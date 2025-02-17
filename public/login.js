//로그인 페이지
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
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account, email, password }),
        });

        const result = await response.json();

        if (response.ok) {
          alert('로그인 성공!');

          // JWT 토큰 저장
          localStorage.setItem('token', result.token);

          await verfiyAndRedirection();
        } else {
          alert('로그인 실패: ' + result.message);
        }
      } catch (error) {
        console.error('로그인 요청 중 오류 발생:', error);
      }
    });
  }
});

// JWT 인증 확인 후 페이지 이동
async function verfiyAndRedirection() {
  const token = localStorage.getItem('token');

  if (!token) {
    console.log('JWT 없음 로그인 필요');
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch('/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (response.ok) {
      console.log('인증 성공, 메인 페이지 이동');
      window.location.href = '/main';
    } else {
      console.error('인증 실패, 재로그인 필요');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('이동 중 오류 발생', error);
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

function logout() {
  fetch('/auth/logout', {
    method: 'POST',
  })
    .then((response) => {
      if (response.ok) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert('로그아웃 실패');
      }
    })
    .catch((error) => {
      console.error('로그아웃 중 오류 발생', error);
    });
}
