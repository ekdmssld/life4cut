const express = require('express');
const bcrypt = require('bcrypt');
const Admin = require('../models/admin');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    let { account, email, password } = req.body;

    account = account.trim();
    email = email.trim().toLowerCase();

    const admin = await Admin.findOne({ account, email });

    if (!admin) {
      console.log(`계정을 찾을 수 없음: account=${account}, email=${email}`);
      return res.status(401).json({ message: '계정을 찾을 수 없습니다.' });
    }

    if (!admin.approved) {
      console.log(`관리자 승인 필요: account=${account}`);
      return res.status(403).json({ message: '관리자 승인이 필요합니다.' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log(`비밀번호 불일치: account=${account}`);
      return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
    }

    res.status(200).json({ message: '로그인 성공!' });
  } catch (error) {
    console.error(`로그인 오류: ${error.message}`);
    res.status(500).json({ message: '서버 오류 발생', error: error.message });
  }
});

module.exports = router;
