const database = require('./sqlite-db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production';

const router = require('express').Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
        }

        const existingUser = await database.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        const user = await database.createUser(username, email, password);

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'Пользователь успешно создан',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        
        if (error.message.includes('уже существует')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const user = await database.getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ error: 'Неверные учетные данные' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Неверные учетные данные' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется токен доступа' });
    }

    try {
        const user = await database.verifyToken(token);
        
        if (!user) {
            return res.status(403).json({ error: 'Неверный токен' });
        }

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.created_at
        });
    } catch (error) {
        console.error('Ошибка получения информации о пользователе:', error);
        res.status(403).json({ error: 'Неверный токен' });
    }
});

module.exports = router;