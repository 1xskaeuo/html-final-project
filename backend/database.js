const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const JWT_SECRET = 'your-secret-key-change-in-production';
const DATA_FILE = path.join(__dirname, 'database.json');

class Database {
    constructor() {
        this.users = [];
        this.games = [];
        this.init();
    }

    async init() {
        await this.loadFromFile();
        
        // Создаем тестового пользователя только если база пустая
        if (this.users.length === 0) {
            console.log('Создаем демо-пользователя...');
            this.createUser('demo', 'demo@example.com', bcrypt.hashSync('password', 10));
            await this.saveToFile();
        }
    }

    // Загрузка данных из файла
    async loadFromFile() {
        try {
            await fs.access(DATA_FILE);
            const data = await fs.readFile(DATA_FILE, 'utf8');
            const parsed = JSON.parse(data);
            this.users = parsed.users || [];
            this.games = parsed.games || [];
            console.log(`Данные загружены: ${this.users.length} пользователей, ${this.games.length} игр`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('Файл базы данных не найден, создаем новый...');
                this.users = [];
                this.games = [];
            } else {
                console.error('Ошибка загрузки данных:', error);
                this.users = [];
                this.games = [];
            }
        }
    }

    // Сохранение данных в файл
    async saveToFile() {
        try {
            const data = {
                users: this.users,
                games: this.games,
                lastSave: new Date().toISOString()
            };
            await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
            console.log(`Данные сохранены: ${this.users.length} пользователей, ${this.games.length} игр`);
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
        }
    }

    // User methods
    async createUser(username, email, password) {
        const user = {
            id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        this.users.push(user);
        await this.saveToFile();
        return user;
    }

    getUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    getUserById(id) {
        return this.users.find(user => user.id === id);
    }

    // Game methods
    async saveGame(userId, score, time, level = 1) {
        const game = {
            id: this.games.length > 0 ? Math.max(...this.games.map(g => g.id)) + 1 : 1,
            userId: parseInt(userId),
            score: parseInt(score),
            time: parseInt(time),
            level: parseInt(level),
            date: new Date().toISOString()
        };
        this.games.push(game);
        await this.saveToFile();
        return game;
    }

    getUserGames(userId) {
        return this.games
            .filter(game => game.userId === parseInt(userId))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
    }

    getUserStats(userId) {
        const userGames = this.games.filter(game => game.userId === parseInt(userId));
        
        if (userGames.length === 0) {
            return {
                totalGames: 0,
                bestScore: 0,
                averageScore: 0,
                bestTime: 0,
                maxLevel: 0
            };
        }

        const totalGames = userGames.length;
        const bestScore = Math.max(...userGames.map(game => game.score));
        const averageScore = userGames.reduce((sum, game) => sum + game.score, 0) / totalGames;
        const bestTime = Math.min(...userGames.map(game => game.time));
        const maxLevel = Math.max(...userGames.map(game => game.level || 1));

        return {
            totalGames,
            bestScore,
            averageScore: Math.round(averageScore),
            bestTime: bestTime === Infinity ? 0 : bestTime,
            maxLevel
        };
    }

    // Token verification
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return this.getUserById(decoded.id);
        } catch (error) {
            return null;
        }
    }

    // Получение топа игроков
    getLeaderboard() {
        const userStats = {};
        
        // Собираем статистику по всем пользователям
        this.games.forEach(game => {
            const userId = game.userId;
            if (!userStats[userId]) {
                const user = this.getUserById(userId);
                userStats[userId] = {
                    userId: userId,
                    username: user ? user.username : 'Unknown',
                    bestScore: 0,
                    totalGames: 0,
                    maxLevel: 0
                };
            }
            
            const stats = userStats[userId];
            stats.bestScore = Math.max(stats.bestScore, game.score);
            stats.totalGames++;
            stats.maxLevel = Math.max(stats.maxLevel, game.level || 1);
        });

        // Сортируем по лучшему счету
        return Object.values(userStats)
            .sort((a, b) => b.bestScore - a.bestScore)
            .slice(0, 10);
    }
}

module.exports = new Database();