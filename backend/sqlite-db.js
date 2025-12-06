const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const JWT_SECRET = 'your-secret-key-change-in-production';
const DB_FILE = path.join(__dirname, 'memory_game.db');

class SQLiteDatabase {
    constructor() {
        this.db = null;
    }

    async init() {
        try {

            this.db = await open({
                filename: DB_FILE,
                driver: sqlite3.Database
            });

            console.log('Подключение к SQLite базе данных...');

            await this.createTables();
            
            await this.createDemoUser();
            
            console.log('База данных SQLite готова к работе');
            return true;
        } catch (error) {
            console.error('Ошибка инициализации базы данных:', error);
            return false;
        }
    }

    async createTables() {

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                score INTEGER NOT NULL,
                time INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
            CREATE INDEX IF NOT EXISTS idx_games_played_at ON games(played_at);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        `);

        console.log('📊 Таблицы базы данных созданы/проверены');
    }

    async createDemoUser() {
        try {

            const existingUser = await this.db.get(
                'SELECT id FROM users WHERE email = ?',
                'demo@example.com'
            );

            if (!existingUser) {
                const hashedPassword = await bcrypt.hash('password', 10);
                await this.db.run(
                    `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
                    ['demo', 'demo@example.com', hashedPassword]
                );
                console.log('Демо-пользователь создан');
            }
        } catch (error) {
            console.error('Ошибка создания демо-пользователя:', error);
        }
    }

    async createUser(username, email, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await this.db.run(
                `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
                [username, email, hashedPassword]
            );

            const user = await this.db.get(
                `SELECT id, username, email, created_at FROM users WHERE id = ?`,
                result.lastID
            );

            console.log(`Пользователь ${username} создан (ID: ${user.id})`);
            return user;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                throw new Error('Пользователь с таким email или именем уже существует');
            }
            throw error;
        }
    }

    async getUserByEmail(email) {
        const user = await this.db.get(
            `SELECT * FROM users WHERE email = ?`,
            email
        );
        return user;
    }

    async getUserById(id) {
        const user = await this.db.get(
            `SELECT id, username, email, created_at FROM users WHERE id = ?`,
            id
        );
        return user;
    }


    async saveGame(userId, score, time, level = 1) {
        console.log(`Сохранение игры: userId=${userId}, score=${score}, time=${time}, level=${level}`);
        

        const numericUserId = Number(userId);
        if (isNaN(numericUserId) || numericUserId <= 0) {
            throw new Error(`Invalid user ID: ${userId}`);
        }

        const result = await this.db.run(
            `INSERT INTO games (user_id, score, time, level) VALUES (?, ?, ?, ?)`,
            [numericUserId, score, time, level]
        );

        const game = await this.db.get(
            `SELECT * FROM games WHERE id = ?`,
            result.lastID
        );

        console.log(`Игра сохранена (ID: ${game.id})`);
        return game;
    }

    async getUserGames(userId, limit = 10) {
        const games = await this.db.all(`
            SELECT * FROM games 
            WHERE user_id = ? 
            ORDER BY played_at DESC 
            LIMIT ?
        `, [userId, limit]);
        return games;
    }

    async getUserStats(userId) {
        const stats = await this.db.get(`
            SELECT 
                COUNT(*) as totalGames,
                MAX(score) as bestScore,
                AVG(score) as averageScore,
                MIN(time) as bestTime,
                MAX(level) as maxLevel
            FROM games 
            WHERE user_id = ?
        `, [userId]);

        return {
            totalGames: stats?.totalGames || 0,
            bestScore: stats?.bestScore || 0,
            averageScore: Math.round(stats?.averageScore) || 0,
            bestTime: stats?.bestTime || 0,
            maxLevel: stats?.maxLevel || 0
        };
    }

    async getLeaderboard(limit = 10) {
        const leaderboard = await this.db.all(`
            SELECT 
                u.id as userId,
                u.username,
                MAX(g.score) as bestScore,
                COUNT(g.id) as totalGames,
                MAX(g.level) as maxLevel
            FROM users u
            LEFT JOIN games g ON u.id = g.user_id
            WHERE g.score IS NOT NULL
            GROUP BY u.id, u.username
            ORDER BY bestScore DESC
            LIMIT ?
        `, [limit]);
        return leaderboard;
    }

    async verifyToken(token) {
        try {

            const decoded = jwt.verify(token, JWT_SECRET);
            
            if (!decoded || !decoded.id) {
                return null;
            }
            
            const user = await this.getUserById(decoded.id);
            
            if (!user) {
                console.log(`Пользователь с ID ${decoded.id} не найден`);
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('Ошибка верификации токена:', error.message);
            return null;
        }
    }

    async close() {
        if (this.db) {
            await this.db.close();
            console.log('Соединение с базой данных закрыто');
        }
    }
}

const database = new SQLiteDatabase();
module.exports = database;