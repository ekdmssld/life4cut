//관리자 승인 요청 이메일 전송
require('dotenv').config();
const express = require('express');
const router = express.Router();
const smtpTransport = require('../config/mailer');

router.post('/admin/sendmail', async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const { email, username, account } = req.body;

    if (!email || !username || !account) {
      return res
        .status(400)
        .json({ message: '이메일, 사용자명, 계정 ID가 필요합니다.' });
    }

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: adminEmail,
      subject: '새로운 관리자 가입 승인 요청',
      html: `<p>새로운 관리자 가입 요청이 있습니다.</p>
             <p>Account ID: ${account}</p>
             <p>이름: ${username}</p>
             <p>이메일: ${email}</p>
             <a href="http://localhost:8081/admin/approve?email=${email}">승인하기</a>`,
    };

    await smtpTransport.sendMail(mailOptions);

    res.status(201).json({
      message: '승인 요청이 완료되었습니다. 관리자의 승인을 기다려주세요',
    });
  } catch (error) {
    console.error(`이메일 전송 오류 : ${error.message}`);
    res
      .status(500)
      .json({ message: '이메일 전송 중 오류', error: error.message });
  }
});

module.exports = router;
