const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const auth = require('./auth');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Инициализация базы данных перед запуском сервера
async function startServer() {
    console.log('Инициализация базы данных...');
    await database.init();
    
    // Routes
    app.use('/api/auth', auth);

    // Cards data
    const cards = ['🌟', '🚀', '🎯', '🌈', '🔥', '💎', '🎨', '⚡', '🎭', '🦄', '👾', '🎪', '🤖', '👽', '🐲', '🦋'];

    app.get('/api/cards', (req, res) => {
        res.json({ cards });
    });

    // Получение статистики пользователя
    app.get('/api/user/stats', authenticateToken, (req, res) => {
        const userStats = database.getUserStats(req.user.id);
        res.json(userStats);
    });

    // Получение истории игр пользователя
    app.get('/api/user/games', authenticateToken, (req, res) => {
        const userGames = database.getUserGames(req.user.id);
        res.json(userGames);
    });

    // Сохранение результата игры
    app.post('/api/games', authenticateToken, async (req, res) => {
        const { score, time, level } = req.body;
        
        if (typeof score !== 'number' || typeof time !== 'number') {
            return res.status(400).json({ error: 'Invalid score or time' });
        }

        try {
            const game = await database.saveGame(req.user.id, score, time, level);
            res.status(201).json({ message: 'Game saved successfully', game });
        } catch (error) {
            res.status(500).json({ error: 'Error saving game' });
        }
    });

    // Таблица лидеров
    app.get('/api/leaderboard', (req, res) => {
        const leaderboard = database.getLeaderboard();
        res.json({ leaderboard });
    });

    // Middleware аутентификации
    function authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const user = database.verifyToken(token);
        if (!user) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    }

    // Serve frontend pages
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });

    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/login.html'));
    });

    app.get('/register', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/register.html'));
    });

    app.get('/game', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/game.html'));
    });

    app.get('/profile', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/profile.html'));
    });

    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
        console.log(`База данных: ${path.join(__dirname, 'database.json')}`);
    });
}

startServer().catch(console.error);