document.addEventListener('DOMContentLoaded', function () {
  const savedEmail = localStorage.getItem('verifiedEmail');
  const emailInput = document.getElementById('email');
  const signupForm = document.getElementById('signupForm');
  const verifyForm = document.getElementById('verifyForm');

  if (savedEmail && emailInput) {
    emailInput.value = savedEmail;
    if (signupForm) signupForm.style.display = 'block';
    if (verifyForm) verifyForm.style.display = 'none';
  }

  // 이메일 인증 요청
  const emailForm = document.getElementById('emailForm');
  if (emailForm) {
    emailForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const email = document.getElementById('email').value;

      const response = await fetch('/signup/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const emailMessage = document.getElementById('emailMessage');
        if (emailMessage) emailMessage.style.display = 'block';
        if (verifyForm) verifyForm.style.display = 'block';
        document.getElementById('email').disabled = true;
      } else {
        alert('이메일 전송 실패');
      }
    });
  }

  // 이메일 인증 코드 확인
  if (verifyForm) {
    verifyForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const emailInput = document.getElementById('email');
      const codeInput = document.getElementById('verificationCode');

      if (!emailInput || !codeInput) {
        console.error('❌ [CLIENT] 입력 필드가 존재하지 않습니다.');
        alert('이메일 또는 인증 코드 입력 필드가 없습니다.');
        return;
      }

      const email = emailInput.value.trim();
      const code = codeInput.value.trim();

      console.log(
        `📤 [CLIENT] 인증 코드 확인 요청: email=${email}, code=${code}`
      );

      const response = await fetch('/signup/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const result = await response.json();
      console.log(`📥 [CLIENT] 서버 응답:`, result);

      if (response.ok) {
        alert('이메일 인증 완료');
        if (signupForm) signupForm.style.display = 'block';
        if (verifyForm) verifyForm.style.display = 'none';
        localStorage.setItem('verifiedEmail', email);
        window.location.href = '/register';
      } else {
        alert(result.message || '인증 코드가 올바르지 않습니다.');
      }
    });
  }

  // 회원가입 요청
  if (signupForm) {
    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const account = document.getElementById('account').value;
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const phoneNumber = document.getElementById('phoneNumber').value;

      console.log(
        `📤 [CLIENT] 회원가입 요청: account=${account}, username=${username}, email=${email}`
      );

      const response = await fetch('/signup/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account,
          username,
          email,
          password,
          phoneNumber,
        }),
      });

      const result = await response.json();
      console.log(`📥 [CLIENT] 서버 응답:`, result);

      if (response.ok) {
        alert('관리자가 승인 중입니다.!');
        window.location.href = '/logout';
      } else {
        alert('회원가입 실패: ' + result.message);
      }
    });
  }
});
