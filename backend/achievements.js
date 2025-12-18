const database = require('./sqlite-db');

const ACHIEVEMENTS = {

    FIRST_GAME: {
        id: 'first_game',
        title: 'Первая игра',
        description: 'Сыграйте первую игру',
        icon: '🎮',
        points: 10,
        check: async (userId) => {
            const games = await database.getUserGames(userId, 1);
            return games.length > 0 ? 100 : 0;
        }
    },

    SCORE_100: {
        id: 'score_100',
        title: 'Счет 100+',
        description: 'Набрать 100 очков в одной игре',
        icon: '🏆',
        points: 20,
        check: async (userId) => {
            const stats = await database.getUserStats(userId);
            return stats.bestScore >= 100 ? 100 : 0;
        }
    },
    
    SCORE_500: {
        id: 'score_500',
        title: 'Счет 500+',
        description: 'Набрать 500 очков в одной игре',
        icon: '⭐',
        points: 50,
        check: async (userId) => {
            const stats = await database.getUserStats(userId);
            return Math.min((stats.bestScore / 500) * 100, 100);
        }
    },

    LEVEL_3: {
        id: 'level_3',
        title: 'Уровень 3',
        description: 'Достигнуть 3 уровня в обычном режиме',
        icon: '🚀',
        points: 30,
        check: async (userId) => {
            const stats = await database.getUserStats(userId);
            return stats.maxLevel >= 3 ? 100 : 0;
        }
    },

    FAST_30: {
        id: 'fast_30',
        title: 'Быстрее 30 сек',
        description: 'Пройти уровень менее чем за 30 секунд',
        icon: '⚡',
        points: 40,
        check: async (userId) => {
            const stats = await database.getUserStats(userId);
            return stats.bestTime > 0 && stats.bestTime <= 30 ? 100 : 0;
        }
    },

    GAMES_10: {
        id: 'games_10',
        title: '10 игр',
        description: 'Сыграть 10 игр',
        icon: '📊',
        points: 25,
        check: async (userId) => {
            const stats = await database.getUserStats(userId);
            return Math.min((stats.totalGames / 10) * 100, 100);
        }
    },
    
    GAMES_50: {
        id: 'games_50',
        title: '50 игр',
        description: 'Сыграть 50 игр',
        icon: '🎪',
        points: 75,
        check: async (userId) => {
            const stats = await database.getUserStats(userId);
            return Math.min((stats.totalGames / 50) * 100, 100);
        }
    },

    ARCADE_FIRST: {
        id: 'arcade_first',
        title: 'Первая аркада',
        description: 'Сыграть первую аркадную игру',
        icon: '🎯',
        points: 15,
        check: async (userId) => {
            const games = await database.getUserArcadeGames(userId, 1);
            return games.length > 0 ? 100 : 0;
        }
    },
    
    ARCADE_SCORE_200: {
        id: 'arcade_score_200',
        title: 'Аркада 200+',
        description: 'Набрать 200 очков в аркадном режиме',
        icon: '🔥',
        points: 60,
        check: async (userId) => {
            const games = await database.getUserArcadeGames(userId, 50);
            const bestScore = games.reduce((max, game) => Math.max(max, game.score), 0);
            return Math.min((bestScore / 200) * 100, 100);
        }
    }
};

async function checkAndUpdateAchievements(userId) {
    const unlocked = [];
    
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        try {
            const progress = await achievement.check(userId);
            if (progress > 0) {
                await database.unlockAchievement(userId, achievement.id, progress);
                if (progress >= 100) {
                    unlocked.push(achievement);
                }
            }
        } catch (error) {
            console.error(`Ошибка проверки достижения ${key}:`, error);
        }
    }
    
    return unlocked;
}

async function getUserAchievementsWithProgress(userId) {
    const userAchievements = await database.getUserAchievements(userId);
    const achievementsMap = new Map(userAchievements.map(a => [a.achievement_id, a]));
    
    const result = [];
    
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        const userAchievement = achievementsMap.get(achievement.id) || {
            progress: 0,
            completed: false,
            unlocked_at: null
        };
        
        const currentProgress = await achievement.check(userId);
        
        result.push({
            ...achievement,
            progress: Math.max(userAchievement.progress, currentProgress),
            completed: userAchievement.completed || currentProgress >= 100,
            unlockedAt: userAchievement.unlocked_at,
            key
        });
    }
    
    return result;
}

module.exports = {
    ACHIEVEMENTS,
    checkAndUpdateAchievements,
    getUserAchievementsWithProgress
};