const jwt = require('jsonwebtoken');

const JWT_KEY = process.env.JWT_KEY;

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: '인증 토큰 없음' });
  }
  try {
    const decoded = jwt.verify(token.split(' ')[1], JWT_KEY);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: '유효 토큰이 아닙니다.' });
  }
};

module.exports = adminAuth;
