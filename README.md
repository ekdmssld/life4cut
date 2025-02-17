1. 인증 관련 파일
   ./routes/auth.js : 사용자 로그인 및 JWT 발급
   ./routes/adminLogin.js : 관리자 로그인 및 JWT 발급
   ./middlewares/adminAuth.js : JWT 검증 미들웨어 - 관리자 페이지 보호용
   => auth.js + adminLogin.js 통합
