const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');

router.get('/', (req, res) => {
    const user = req.session.user;

    // (1) 전체 상품 조회
    db.all('SELECT * FROM products', [], (prodErr, allProducts) => {
        if (prodErr) return res.status(500).send('상품 조회 실패');

        // (2) 오늘의 추천 상품 (예: is_featured=1)
        db.all('SELECT * FROM products WHERE is_featured = 1', [], (featErr, featuredProducts) => {
            if (featErr) return res.status(500).send('추천 상품 조회 실패');

            // (3) 위시리스트 ID 조회
            const fetchWishlist = cb => {
                if (!user) return cb(null, []);
                db.all(
                    'SELECT product_id FROM wishlist_items WHERE user_id = ?',
                    [user.id],
                    (wishErr, rows) => {
                        if (wishErr) return cb(wishErr);
                        cb(null, rows.map(r => r.product_id));
                    }
                );
            };

            fetchWishlist((wishErr, wishlistIds) => {
                if (wishErr) {
                    console.error('위시리스트 조회 실패:', wishErr);
                    wishlistIds = [];
                }
                // (4) 템플릿에 세 개 변수 전달
                res.render('products', {
                    allProducts,
                    featuredProducts,
                    user,
                    wishlistIds
                });
            });
        });
    });
});


// ✅ 전체 상품 목록 + 위시리스트 적용
router.get('/all', (req, res) => {
    const user = req.session.user;

    // (1) 전체 상품 조회
    db.all('SELECT * FROM products', [], (prodErr, allProducts) => {
        if (prodErr) return res.status(500).send('상품 조회 실패');

        // (2) 로그인한 사용자라면 wishlist_items에서 ID만 가져오기
        const fetchWishlistIds = cb => {
            if (!user) return cb(null, []);
            db.all(
                'SELECT product_id FROM wishlist_items WHERE user_id = ?',
                [user.id],
                (wishErr, rows) => {
                    if (wishErr) return cb(wishErr);
                    const wishlistIds = rows.map(r => r.product_id);
                    cb(null, wishlistIds);
                }
            );
        };

        // (3) 위시리스트 ID 조회 후 렌더
        fetchWishlistIds((wishErr, wishlistIds) => {
            if (wishErr) {
                console.error('위시리스트 조회 실패:', wishErr.message);
                wishlistIds = [];
            }
            res.render('products_all', {
                allProducts,
                user,
                wishlistIds
            });
        });
    });
});

// 상품 상세 (추천 상품 / 전체 목록 공통)
function renderProductDetail(req, res) {
    const id   = req.params.id;
    const user = req.session.user;

    // (1) 상품 불러오기
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err || !product) {
            return res.status(404).send('상품을 찾을 수 없습니다.');
        }

        // (2) 로그인한 경우에만 위시리스트 여부 확인
        if (user) {
            db.get(
                'SELECT 1 FROM wishlist_items WHERE user_id = ? AND product_id = ?',
                [user.id, id],
                (wishErr, row) => {
                    if (wishErr) console.error('위시리스트 조회 오류:', wishErr);
                    const isWishlisted = !!row;
                    res.render('product_detail', { product, user, isWishlisted });
                }
            );
        } else {
            // 비로그인 상태면 무조건 false
            res.render('product_detail', { product, user: null, isWishlisted: false });
        }
    });
}

router.get('/:id',  renderProductDetail);
router.get('/all/:id', renderProductDetail);



module.exports = router;
