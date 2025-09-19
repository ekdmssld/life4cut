const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const bcrypt = require('bcrypt');
const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// 회원가입 페이지
router.get("/", (req, res) => {
    res.render("auth", {title : "로그인 / 회원가입"});
});


// POST 로그인 처리
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) {
            return res.render("login-failed", {title : "로그인 실패", message: "존재하지 않는 사용자입니다."});
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = user;
            res.redirect("/");
        } else {
            res.render("login-failed", {title : "로그인 실패", message: "비밀번호가 일치하지 않습니다."});
        }
    });
});

// POST 회원가입 처리
router.post("/register", async (req, res) => {
    const { username, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        "INSERT INTO users (username, password, name) VALUES (?, ?, ?)",
        [username, hashedPassword, name],
        (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send("회원가입 실패");
            }
            res.render("register-success", {title : "회원가입 성공"});
        }
    );
});

// GET 로그아웃
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

module.exports = router;