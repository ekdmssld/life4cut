require('dotenv').config();

const express = require('express');
const path = require('path');

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
const dbConnect = require('./config/dbConnect');

const app = express();
const PORT = process.env.PORT || 8081;

dbConnect();

app.use(express.json());

//게시글 관련 라우터
app.use(orderRoutes);
app.use(postRoutes);

//로그인 관련 라우터
app.use('/signup', adminRegister);
app.use('/admin', adminApprove);
app.use('/register', adminSendmail);
app.use('/', loginRoutes);

// EJS 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 라우트 설정
app.get('/main', (req, res) => {
  res.render('admin_main');
});

app.get('/admin_crud', (req, res) => {
  res.render('admin_crud');
});

app.get('/admin_list', (req, res) => {
  res.render('admin_list');
});

app.get('/admin_statistics', (req, res) => {
  res.render('admin_statistics');
});

app.get('/logout', (req, res) => {
  res.render('admin_login');
});

app.get('/register', (req, res) => {
  res.render('admin_register');
});

app.get('/verify-email', (req, res) => {
  res.render('admin_verifyemail');
});

app.post('/signup/email', sendVerification);
app.post('/signup/email/verify', verifyEmailCode);

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
