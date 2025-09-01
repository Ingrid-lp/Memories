document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const loggedInUser = localStorage.getItem('loggedInUser');

    if (loggedInUser) {
        window.location.href = 'app.html';
        return;
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target['login-email'].value;
        const password = e.target['login-password'].value;
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('loggedInUser', user.name);
            window.location.href = 'app.html';
        } else {
            alert('Email ou senha incorretos.');
        }
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = e.target['register-name'].value;
        const email = e.target['register-email'].value;
        const password = e.target['register-password'].value;
        if (users.find(u => u.email === email)) {
            alert('Este email já está cadastrado.');
            return;
        }
        users.push({ name, email, password });
        localStorage.setItem('users', JSON.stringify(users));
        alert('Conta criada com sucesso! Faça login para continuar.');
        showLoginLink.click();
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