const API_BASE = 'http://localhost:3000/api';

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                showUserMenu(user);
                updateUIForLoggedInUser();
                return true;
            } else {
                localStorage.removeItem('token');
                updateUIForGuest();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            updateUIForGuest();
        }
    } else {
        updateUIForGuest();
    }
    return false;
}

function showUserMenu(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const username = document.getElementById('username');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (username) username.textContent = user.username;
}

function showAuthButtons() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
}

function updateUIForLoggedInUser() {

    const playButton = document.querySelector('.btn-primary');
    if (playButton) {
        playButton.style.display = 'inline-block';
        playButton.textContent = 'Начать игру';
        playButton.onclick = () => location.href = 'play.html';
    }

    const loginButton = document.querySelector('.btn-secondary');
    if (loginButton) {
        loginButton.style.display = 'none';
    }
}

function updateUIForGuest() {

    const playButton = document.querySelector('.btn-primary');
    if (playButton) {
        playButton.style.display = 'none';
    }

    const loginButton = document.querySelector('.btn-secondary');
    if (loginButton) {
        loginButton.style.display = 'inline-block';
        loginButton.textContent = 'Войти в аккаунт';
        loginButton.onclick = () => location.href = 'login.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Регистрация успешна! Теперь вы можете войти.', 'success');
                    registerForm.reset();
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showMessage(data.error || 'Ошибка регистрации', 'error');
                }
            } catch (error) {
                showMessage('Ошибка сети', 'error');
            }
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    showMessage('Вход успешен!', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showMessage(data.error || 'Ошибка входа', 'error');
                }
            } catch (error) {
                showMessage('Ошибка сети', 'error');
            }
        });
    }

    checkAuth();
});

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    }
}