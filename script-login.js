document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const API_URL = 'http://localhost:3000';

    loginForm.addEventListener('submit', async(e) => {
        e.preventDefault();
        const email = e.target['login-email'].value;
        const password = e.target['login-password'].value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                window.location.href = 'app.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Erro ao tentar fazer login. Servidor indisponível.');
            console.error('Login error:', error);
        }
    });

    registerForm.addEventListener('submit', async(e) => {
        e.preventDefault();
        const name = e.target['register-name'].value;
        const email = e.target['register-email'].value;
        const password = e.target['register-password'].value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                showLoginLink.click();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Erro ao tentar criar a conta. Servidor indisponível.');
            console.error('Registration error:', error);
        }
    });

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginScreen.style.display = 'none';
        registerScreen.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginScreen.style.display = 'block';
        registerScreen.style.display = 'none';
    });
});