//관리자 로그인 라우트 /login
const express = require('express');
const bcrypt = require("bcryptjs");
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth');

const JWT_KEY = process.env.JWT_KEY;

router.post('/', async (req, res) => {
  try {
    let { account, email, password } = req.body;

    account = account.trim();
    email = email.trim().toLowerCase();

    const admin = await Admin.findOne({ account, email });

    if (!admin) {
      return res.status(401).json({ message: '계정을 찾을 수 없습니다.' });
    }

    if (!admin.approved) {
      return res.status(403).json({ message: '관리자 승인이 필요합니다.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
    }

    // JWT 발급
    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_KEY, {
      expiresIn: '1h',
    });

    res.status(200).json({ message: '로그인 성공!', token });
  } catch (error) {
    console.error(`로그인 오류: ${error.message}`);
    res.status(500).json({ message: '서버 오류 발생', error: error.message });
  }
});

// ✅ 보호된 프로필 조회
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: '관리자를 찾을 수 없습니다.' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: '서버 오류 발생', error });
  }
});

module.exports = router;
