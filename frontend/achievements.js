class AchievementsPage {
    constructor() {
        this.achievements = [];
        this.filter = 'all';
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadAchievements();
        this.setupEventListeners();
        this.checkNewAchievements();
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';        
            return false;
        }
        return true;
    }

    async loadAchievements() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/achievements', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.achievements = data.achievements;
                this.updateStats(data.stats);
                this.renderAchievements();
            }
        } catch (error) {
            console.error('Ошибка загрузки достижений:', error);
        }
    }

    updateStats(stats) {
        document.getElementById('total-achievements').textContent = this.achievements.length;
        document.getElementById('completed-achievements').textContent = stats.completed || 0;
        document.getElementById('achievements-progress').textContent = 
            stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) + '%' : '0%';
        document.getElementById('achievements-points').textContent = 
            (stats.completed * 10) + Math.round((stats.totalProgress || 0) / 10);
    }

    renderAchievements() {
        const container = document.getElementById('achievements-list');
        const filtered = this.filterAchievements();
        
        container.innerHTML = filtered.map(achievement => `
            <div class="achievement-card ${achievement.completed ? 'completed' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                        </div>
                        <span class="progress-text">${Math.round(achievement.progress)}%</span>
                    </div>
                    <div class="achievement-points">${achievement.points} очков</div>
                    ${achievement.completed ? 
                        `<div class="achievement-date">Разблокировано: ${new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}</div>` : 
                        ''
                    }
                </div>
            </div>
        `).join('');
    }

    filterAchievements() {
        switch(this.filter) {
            case 'unlocked':
                return this.achievements.filter(a => a.completed);
            case 'locked':
                return this.achievements.filter(a => !a.completed && a.progress === 0);
            case 'in-progress':
                return this.achievements.filter(a => !a.completed && a.progress > 0);
            default:
                return this.achievements;
        }
    }

    async checkNewAchievements() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/achievements/check', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.unlocked.length > 0) {
                    this.showNewAchievements(data.unlocked);
                }
            }
        } catch (error) {
            console.error('Ошибка проверки достижений:', error);
        }
    }

    showNewAchievements(unlocked) {
        const alertDiv = document.getElementById('new-achievements-alert');
        const listDiv = document.getElementById('new-achievements-list');
        
        listDiv.innerHTML = unlocked.map(achievement => `
            <div class="new-achievement">
                <span class="achievement-icon">${achievement.icon}</span>
                <span class="achievement-title">${achievement.title}</span>
                <span class="achievement-points">+${achievement.points} очков</span>
            </div>
        `).join('');
        
        alertDiv.classList.remove('hidden');

        setTimeout(() => this.loadAchievements(), 1000);
    }

    hideNewAchievements() {
        document.getElementById('new-achievements-alert').classList.add('hidden');
    }

    setupEventListeners() {

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filter = e.target.dataset.filter;
                this.renderAchievements();
            });
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });

        document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme);
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AchievementsPage();
});