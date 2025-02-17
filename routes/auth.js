// 사용자 및 관리자 로그인 라우터
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const Admin = require('../models/admin');

const router = express.Router();
const JWT_KEY = process.env.JWT_KEY; // ✅ 환경변수에서 비밀키 불러오기

router.post('/login', async (req, res) => {
  try {
    console.log('🔹 로그인 요청 도착:', req.body);

    const { email, password } = req.body;
    console.log('로그인 시도 이메일 : ', email);
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: '존재하지 않는 사용자입니다.' });
    }

    if (!admin.approved) {
      return res.status(403).json({ message: '승인되지 않은 사용자입니다.' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '잘못된 비밀번호입니다.' });
    }
    console.log('✅ 로그인 성공:', admin.email);
    // ✅ secretKey가 없을 경우 오류 발생 예방
    if (!JWT_KEY) {
      console.error('❌ JWT_KEY 값이 설정되지 않았습니다!');
      return res.status(500).json({ message: '서버 오류 발생: JWT_KEY 없음' });
    }

    // ✅ JWT 토큰 발급
    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      JWT_KEY, // ✅ 올바른 secretKey 사용
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('❌ 로그인 오류:', error.message);
    res.status(500).json({ message: '서버 오류 발생', error: error.message });
  }
});

// 🔹 로그아웃 (토큰 제거)
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: '로그아웃 완료' });
});

module.exports = router;
