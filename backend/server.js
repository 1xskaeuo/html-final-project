const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const auth = require('./auth');
const database = require('./sqlite-db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const cards = ['🌟', '🚀', '🎯', '🌈', '🔥', '💎', '🎨', '⚡', '🎭', '🦄', '👾', '🎪', '🤖', '👽', '🐲', '🦋'];


app.use('/api/auth', auth);

app.get('/api/cards', (req, res) => {
    res.json({ cards });
});

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const user = await database.verifyToken(token);
        if (!user) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
}

app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const userStats = await database.getUserStats(req.user.id);
        res.json(userStats);
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});

app.get('/api/user/games', authenticateToken, async (req, res) => {
    try {
        const userGames = await database.getUserGames(req.user.id);
        res.json(userGames);
    } catch (error) {
        console.error('Ошибка получения истории игр:', error);
        res.status(500).json({ error: 'Ошибка получения истории игр' });
    }
});

app.post('/api/games', authenticateToken, async (req, res) => {
    const { score, time, level } = req.body;
    
    if (typeof score !== 'number' || typeof time !== 'number') {
        return res.status(400).json({ error: 'Invalid score or time' });
    }

    try {
        const game = await database.saveGame(req.user.id, score, time, level || 1);
        res.status(201).json({ 
            message: 'Game saved successfully',
            game: {
                id: game.id,
                score: game.score,
                time: game.time,
                level: game.level,
                played_at: game.played_at
            }
        });
    } catch (error) {
        console.error('Ошибка сохранения игры:', error);
        res.status(500).json({ 
            error: 'Error saving game',
            details: error.message 
        });
    }
});


app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await database.getLeaderboard();
        res.json({ leaderboard });
    } catch (error) {
        console.error('Ошибка получения таблицы лидеров:', error);
        res.status(500).json({ error: 'Ошибка получения таблицы лидеров' });
    }
});

const achievements = require('./achievements');

app.get('/api/achievements', authenticateToken, async (req, res) => {
    try {
        const userAchievements = await achievements.getUserAchievementsWithProgress(req.user.id);
        const stats = await database.getAchievementStats(req.user.id);
        
        res.json({
            achievements: userAchievements,
            stats: stats
        });
    } catch (error) {
        console.error('Ошибка получения достижений:', error);
        res.status(500).json({ error: 'Ошибка получения достижений' });
    }
});

app.post('/api/achievements/check', authenticateToken, async (req, res) => {
    try {
        const unlocked = await achievements.checkAndUpdateAchievements(req.user.id);
        res.json({
            unlocked: unlocked.map(a => ({
                id: a.id,
                title: a.title,
                icon: a.icon,
                points: a.points
            })),
            message: unlocked.length > 0 ? 'Новые достижения разблокированы!' : 'Нет новых достижений'
        });
    } catch (error) {
        console.error('Ошибка проверки достижений:', error);
        res.status(500).json({ error: 'Ошибка проверки достижений' });
    }
});

app.post('/api/arcade/games', authenticateToken, async (req, res) => {
    const { score, time, moves, mode } = req.body;
    
    if (typeof score !== 'number' || typeof time !== 'number' || typeof moves !== 'number') {
        return res.status(400).json({ error: 'Invalid game data' });
    }

    try {
        const game = await database.saveArcadeGame(req.user.id, score, time, moves, mode || 'classic');
        
        await achievements.checkAndUpdateAchievements(req.user.id);
        
        res.status(201).json({ 
            message: 'Arcade game saved successfully',
            game: {
                id: game.id,
                score: game.score,
                time: game.time,
                moves: game.moves,
                mode: game.mode,
                played_at: game.played_at
            }
        });
    } catch (error) {
        console.error('Ошибка сохранения аркадной игры:', error);
        res.status(500).json({ error: 'Error saving arcade game' });
    }
});

app.get('/api/arcade/games', authenticateToken, async (req, res) => {
    try {
        const games = await database.getUserArcadeGames(req.user.id);
        res.json(games);
    } catch (error) {
        console.error('Ошибка получения истории аркадных игр:', error);
        res.status(500).json({ error: 'Ошибка получения истории аркадных игр' });
    }
});

app.get('/api/arcade/leaderboard', async (req, res) => {
    try {
        const mode = req.query.mode || 'classic';
        const leaderboard = await database.getArcadeLeaderboard(mode);
        res.json({ leaderboard, mode });
    } catch (error) {
        console.error('Ошибка получения таблицы лидеров аркады:', error);
        res.status(500).json({ error: 'Ошибка получения таблицы лидеров аркады' });
    }
});


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


async function startServer() {
    try {
        console.log('Инициализация SQLite базы данных...');
        await database.init();
        
        app.listen(PORT, () => {
            console.log(`Сервер запущен на http://localhost:${PORT}`);
            console.log(`База данных: ${path.join(__dirname, 'memory_game.db')}`);
        });
    } catch (error) {
        console.error('Ошибка запуска сервера:', error);
        process.exit(1);
    }
}

startServer().catch(console.error);