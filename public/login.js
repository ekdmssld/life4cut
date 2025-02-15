document.addEventListener('DOMContentLoaded', function () {
  console.log('login.js loaded');
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
          window.location.href = '/main';
        } else {
          alert('로그인 실패: ' + result.message);
        }
      } catch (error) {
        console.error('로그인 요청중 오류 발생');
      }
    });
  }
});
