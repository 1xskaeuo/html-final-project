class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('ThemeManager: инициализация');
        this.loadTheme();
        this.setupEventListeners();
    }

    setupEventListeners() {

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            console.log('ThemeManager: кнопка темы найдена');
            

            const newToggle = themeToggle.cloneNode(true);
            themeToggle.parentNode.replaceChild(newToggle, themeToggle);
            

            document.getElementById('theme-toggle').addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            });
        }
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log('ThemeManager: переключение темы', currentTheme, '->', newTheme);
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        console.log('ThemeManager: загрузка темы', savedTheme);
        
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
}


if (document.getElementById('theme-toggle')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
}