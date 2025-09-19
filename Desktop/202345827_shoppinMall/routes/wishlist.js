const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');

// (1) 위시리스트 추가/삭제 (AJAX POST)
router.post('/toggle', (req, res) => {
    const user = req.session.user;
    const { productId } = req.body;
    if (!user) return res.status(401).json({ error: '로그인이 필요합니다.' });

    // 먼저 존재 여부 확인
    db.get(
        'SELECT 1 FROM wishlist_items WHERE user_id = ? AND product_id = ?',
        [user.id, productId],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            if (row) {
                // 이미 있음 → 삭제
                db.run(
                    'DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?',
                    [user.id, productId],
                    err2 => {
                        if (err2) return res.status(500).json({ error: err2.message });
                        res.json({ added: false });
                    }
                );
            } else {
                // 없으면 추가
                db.run(
                    'INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)',
                    [user.id, productId],
                    err2 => {
                        if (err2) return res.status(500).json({ error: err2.message });
                        res.json({ added: true });
                    }
                );
            }
        }
    );
});

// (2) 현재 사용자의 위시리스트 전체 조회 (장바구니 페이지 렌더링용)
router.get('/', (req, res, next) => {
    const user = req.session.user;
    if (!user) return res.status(401).send('로그인이 필요합니다.');
    db.all(
        `SELECT p.id, p.name, p.price, p.emoji, p.image
     FROM wishlist_items w
     JOIN products p ON w.product_id = p.id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
        [user.id],
        (err, rows) => {
            if (err) return next(err);
            res.locals.wishlist = rows; // res.render 시 EJS에 전달
            next();
        }
    );
});

module.exports = router;
