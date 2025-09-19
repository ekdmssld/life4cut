const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');

router.post("/add", (req, res) => {
    const user = req.session.user;
    const productId = req.body.productId;

    if (!user) {
        return res.status(401).render('login_required', {
            message: '장바구니 담기 위해서는 로그인이 필요합니다.',
            redirectUrl: '/auth'
        });
    }

    const query = `INSERT INTO cart_items (user_id, product_id, quantity) 
                   VALUES (?, ?, 1) 
                   ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + 1`;

    db.run(query, [user.id, productId], function (err) {
        if (err) return res.status(500).send('장바구니 추가 실패');
        res.redirect('/cart');
    });
});

// 장바구니 목록 조회
router.get('/', (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.render('login_required', {
            message: '장바구니를 확인하려면 로그인이 필요합니다.',
            redirectUrl: '/auth'
        });
    }

    // ── 1) cart_items 조회 ───────────────────────────────────────────────
    const cartQuery = `
        SELECT p.id, p.name, p.price, p.emoji, p.image, c.quantity
        FROM cart_items c
                 JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    `;
    db.all(cartQuery, [user.id], (cartErr, cartItems) => {
        if (cartErr) return res.status(500).send('장바구니 조회 실패');

        // ── 2) wishlist_items 조회 ─────────────────────────────────────────
        const wishQuery = `
      SELECT p.id, p.name, p.price, p.emoji, p.image
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `;
        db.all(wishQuery, [user.id], (wishErr, wishlist) => {
            if (wishErr) {
                console.error('위시리스트 조회 오류:', wishErr.message);
                wishlist = [];  // 오류 시 빈 배열
            }

            // ── 3) cart.ejs에 cartItems, user, wishlist 세 가지를 전달 ────────
            res.render('cart', {
                cartItems,
                user,
                wishlist,
            });
        });
    });
});

// 장바구니 수량 조절
router.post('/update', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login_required'); // 로그인 한 사용자만 수량 변경 가능
    }
    const userId = req.session.user.id; // 로그인한 사용자의 user_id만 사용
    const productId = req.body.productId;
    const action = req.body.action;

    db.get(`SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?`, [userId, productId], (err, row) => {
        if (err || !row) {
            return res.status(500).send("❌ 조회 실패");
        }

        let newQuantity = row.quantity;
        if (action === 'increase') {
            newQuantity += 1;
        } else if (action === 'decrease') {
            newQuantity -= 1;
        }

        if (newQuantity <= 0) {
            db.run(`DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`, [userId, productId], (err) => {
                if (err) return res.status(500).send("❌ 삭제 실패");
                res.redirect('/cart');
            });
        } else {
            db.run(`UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?`, [newQuantity, userId, productId], (err) => {
                if (err) return res.status(500).send("❌ 업데이트 실패");
                res.redirect('/cart');
            });
        }
    });
});

// 장바구니에서 상품 삭제
router.post('/delete', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login_required');
    }
    const userId = req.session.user.id;
    const productId = req.body.productId;

    db.run(`DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`, [userId, productId], (err) => {
        if (err) return res.status(500).send("❌ 삭제 실패");
        res.redirect('/cart');
    });
});

module.exports = router;