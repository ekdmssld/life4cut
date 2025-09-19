// public/javascripts/auth-slider.js

document.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('login-page');
    const btnShowSignup = document.getElementById('show-signup');
    const btnShowSignin = document.getElementById('show-signin');

    // (A) 'Sign Up' 버튼 클릭 → 로그인 카드는 왼쪽 뒤쪽(translateX(-180px)), 회원가입 카드는 전면(translateX(0))
    btnShowSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginPage.classList.remove('show-signin');
        loginPage.classList.add('show-signup');
    });

    // (B) 'Log In' 버튼 클릭 → 회원가입 카드는 오른쪽 뒤쪽(translateX(180px)), 로그인 카드는 전면(translateX(0))
    btnShowSignin.addEventListener('click', (e) => {
        e.preventDefault();
        loginPage.classList.remove('show-signup');
        loginPage.classList.add('show-signin');
    });
});
