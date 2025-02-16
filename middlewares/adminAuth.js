const jwt = require('jsonwebtoken');

const JWT_KEY = process.env.JWT_KEY;

const adminAuth = (req, res, next) => {
  console.log('🔹 요청 헤더:', req.headers);

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log('❌ Authorization 헤더 없음');
    return res.status(401).json({ message: '❌ 인증 토큰이 없습니다.' });
  }

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    console.log('❌ 잘못된 인증 토큰 형식:', authHeader);
    return res.status(401).json({ message: '❌ 잘못된 토큰 형식입니다.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_KEY);
    console.log('✅ JWT 인증 성공:', decoded);
    req.admin = decoded;
    next();
  } catch (error) {
    console.log('❌ JWT 인증 실패:', error.message);
    return res.status(401).json({ message: '❌ 유효하지 않은 토큰입니다.' });
  }
};

module.exports = adminAuth;
