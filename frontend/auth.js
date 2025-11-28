// Функции для авторизации
const API_BASE = 'http://localhost:3000/api';

// Проверка авторизации и управление интерфейсом
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

// Показать меню пользователя
function showUserMenu(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const username = document.getElementById('username');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (username) username.textContent = user.username;
}

// Показать кнопки авторизации
function showAuthButtons() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
}

// Обновить интерфейс для авторизованного пользователя
function updateUIForLoggedInUser() {
    // Показать кнопку "Начать игру"
    const playButton = document.querySelector('.btn-primary');
    if (playButton) {
        playButton.style.display = 'inline-block';
        playButton.textContent = 'Начать игру';
        playButton.onclick = () => location.href = 'game.html';
    }
    
    // Скрыть кнопку входа
    const loginButton = document.querySelector('.btn-secondary');
    if (loginButton) {
        loginButton.style.display = 'none';
    }
    
    // Обновить текст приветствия
    const heroTitle = document.querySelector('.hero h2');
    if (heroTitle) {
        heroTitle.textContent = 'С возвращением!';
    }
    
    const heroText = document.querySelector('.hero p');
    if (heroText) {
        heroText.textContent = 'Продолжайте тренировать память и улучшайте свои результаты!';
    }
}

// Обновить интерфейс для гостя
function updateUIForGuest() {
    // Скрыть кнопку "Начать игру"
    const playButton = document.querySelector('.btn-primary');
    if (playButton) {
        playButton.style.display = 'none';
    }
    
    // Показать кнопку входа
    const loginButton = document.querySelector('.btn-secondary');
    if (loginButton) {
        loginButton.style.display = 'inline-block';
        loginButton.textContent = 'Войти в аккаунт';
        loginButton.onclick = () => location.href = 'login.html';
    }
    
    // Вернуть оригинальный текст
    const heroTitle = document.querySelector('.hero h2');
    if (heroTitle) {
        heroTitle.textContent = 'Тренируйте память с нашей игрой!';
    }
    
    const heroText = document.querySelector('.hero p');
    if (heroText) {
        heroText.textContent = 'Найдите все парные карточки за минимальное время';
    }
}

// Регистрация
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
    
    // Вход
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
    
    // Инициализация авторизации
    checkAuth();
});

// Выход
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Показать сообщение
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