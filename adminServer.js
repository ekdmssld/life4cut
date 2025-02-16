require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const adminRegister = require('./routes/adminRegister');
const adminApprove = require('./routes/adminApprove');
const orderRoutes = require('./routes/adminOrderRoutes');
const loginRoutes = require('./routes/adminLogin');
const postRoutes = require('./routes/postRoutes');
const adminSendmail = require('./routes/adminSendmail');
const {
  sendVerification,
  verifyEmailCode,
} = require('./middlewares/emailAuth');
const adminAuth = require('./middlewares/adminAuth');
const dbConnect = require('./config/dbConnect');

const app = express();
const PORT = process.env.PORT || 8081;

dbConnect();

app.use(express.json());
app.use(cors());

//게시글 관련 라우터
app.use('/orders', orderRoutes);
app.use('/posts', postRoutes);

//로그인 관련 라우터
app.use('/signup', adminRegister); //회원가입
app.use('/admin', adminApprove);
app.use('/admin/sendMail', adminSendmail);
app.use('/login', loginRoutes); //로그인

// EJS 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

//보호된 경로
app.get('/profile', adminAuth, (req, res) => {
  res.json({ message: '프로필 메시지', admin: req.admin });
});
// 라우트 설정
app.get('/main', (req, res) => {
  res.render('admin_main');
});

app.get('/admin_crud', adminAuth, (req, res) => {
  res.render('admin_crud');
});

app.get('/admin_list', adminAuth, (req, res) => {
  res.render('admin_list');
});

app.get('/admin_statistics', adminAuth, (req, res) => {
  res.render('admin_statistics');
});
//로그아웃 후 로그인 페이지로 redirection
app.get('/login', (req, res) => {
  res.render('admin_login');
});
//회원가입 관련 페이지
app.get('/register', (req, res) => {
  res.render('admin_register');
});

app.get('/verify-email', (req, res) => {
  res.render('admin_verifyemail');
});
//이메일 인증 API
app.post('/signup/email', sendVerification);
app.post('/signup/email/verify', verifyEmailCode);

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
