//JWT 인증 미들웨어 - 관리자 페이지 접근 시 필요함
const jwt = require('jsonwebtoken');

const JWT_KEY = process.env.JWT_KEY;

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('🔹 Authorization 헤더:', authHeader); // ✅ 추가

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('🚨 인증 토큰 없음 또는 잘못된 형식:', authHeader);
    return res
      .status(401)
      .json({ message: '인증 토큰이 없거나 잘못된 형식입니다.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_KEY);
    req.admin = decoded;
    console.log('✅ JWT 인증 성공:', decoded);
    next();
  } catch (error) {
    console.log('❌ JWT 인증 실패:', error.message);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = adminAuth;
