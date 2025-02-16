document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const account = document.getElementById('account').value.trim();
      const emailUser = document.getElementById('email').value.trim();
      const emailDomain = document.getElementById('emailDomain').value.trim();
      const password = document.getElementById('password').value.trim();

      const email = `${emailUser}@${emailDomain}`.toLowerCase();

      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account, email, password }),
        });

        const result = await response.json();
        console.log(`서버 응답`, result);

        if (response.ok) {
          alert('로그인 성공!');
          localStorage.setItem('token', result.token);

          getProfile();
        } else {
          alert('로그인 실패: ' + result.message);
        }
      } catch (error) {
        console.error('로그인 요청중 오류 발생');
      }
    });
  }
});

// 프로필 가져오기 (로그인 후 실행)
async function getProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('토큰이 없습니다. 로그인 필요');
    return;
  }

  try {
    const response = await fetch('/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const userProfile = await response.json();
    console.log('사용자 프로필:', userProfile);

    if (response.ok) {
      window.location.href = '/main'; // 인증된 사용자만 접근 가능
    } else {
      alert('프로필을 불러올 수 없습니다.');
      localStorage.removeItem('token'); // 토큰 삭제 후 로그인 페이지로 이동
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('프로필 요청 중 오류 발생:', error);
  }
}
