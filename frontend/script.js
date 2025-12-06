class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.score = 0;
        this.time = 0;
        this.timer = null;
        this.isPlaying = false;
        this.canFlip = true;
        this.level = 1;
        this.maxLevel = 4; 
        
        this.init();
    }

    async init() {
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.restartButton = document.getElementById('restart');
        this.levelElement = document.getElementById('level');

        this.restartButton.addEventListener('click', () => this.restart());
        
        await this.loadCards();
        this.setupGame();
    }

    async loadCards() {
        try {
            const response = await fetch('http://localhost:3000/api/cards');
            const data = await response.json();
            this.availableCards = data.cards;
        } catch (error) {
            console.error('Error loading cards:', error);
            this.availableCards = ['🌟', '🚀', '🎯', '🌈', '🔥', '💎', '🎨', '⚡', '🎭', '🦄', '👾', '🎪', '🤖', '👽', '🐲', '🦋'];
        }
    }

    createCardPairs() {
        const gridSize = this.getGridSize();
        const pairsNeeded = (gridSize * gridSize) / 2;

        const selectedCards = this.availableCards.slice(0, pairsNeeded);
        this.cards = [...selectedCards, ...selectedCards];
        this.shuffleCards();
    }

    getGridSize() {

        return this.level + 2;
    }

    shuffleCards() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    setupGame() {
        this.gameBoard.innerHTML = '';
        const gridSize = this.getGridSize();
        const pairsNeeded = (gridSize * gridSize) / 2;

        const selectedCards = this.availableCards.slice(0, pairsNeeded);
        this.cards = [...selectedCards, ...selectedCards];
        this.shuffleCards();

        this.gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

        const { cardSize, fontSize } = this.getCardSize();
        
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.index = index;
            cardElement.style.width = cardSize;
            cardElement.style.height = cardSize;
            cardElement.style.fontSize = fontSize;
            cardElement.innerHTML = `
                <div class="back">?</div>
                <div class="front">${card}</div>
            `;
            cardElement.addEventListener('click', () => this.flipCard(cardElement));
            this.gameBoard.appendChild(cardElement);
        });

        if (this.levelElement) {
            this.levelElement.textContent = this.level;
        }
    }

    getCardSize() {
        const gridSize = this.getGridSize();

        const sizes = {
            3: { cardSize: '120px', fontSize: '2.5rem' },  
            4: { cardSize: '100px', fontSize: '2rem' },     
            5: { cardSize: '85px', fontSize: '1.7rem' },   
            6: { cardSize: '75px', fontSize: '1.5rem' }    
        };
        
        return sizes[gridSize] || sizes[4];
    }

    flipCard(card) {
        if (!this.canFlip || 
            !this.isPlaying && this.flippedCards.length > 0 ||
            card.classList.contains('flipped') || 
            card.classList.contains('matched') ||
            this.flippedCards.length >= 2) {
            return;
        }

        if (!this.isPlaying) {
            this.startGame();
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.canFlip = false;
            setTimeout(() => this.checkMatch(), 500);
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const value1 = this.cards[card1.dataset.index];
        const value2 = this.cards[card2.dataset.index];

        if (value1 === value2) {
            this.handleMatch(card1, card2);
        } else {
            this.handleMismatch(card1, card2);
        }
    }

    handleMatch(card1, card2) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        card1.style.animation = 'matchSuccess 0.6s ease-in-out';
        card2.style.animation = 'matchSuccess 0.6s ease-in-out';
        
        this.matchedPairs++;

        const points = 10 + (this.level * 5);
        this.score += points;
        this.updateScore();
        
        this.flippedCards = [];
        this.canFlip = true;
        
        if (this.matchedPairs === this.cards.length / 2) {
            setTimeout(() => this.levelComplete(), 600);
        }
    }

    handleMismatch(card1, card2) {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            
            setTimeout(() => {
                this.flippedCards = [];
                this.canFlip = true;
            }, 300);
        }, 1000);
    }

    levelComplete() {
        clearInterval(this.timer);
        this.isPlaying = false;
        this.canFlip = false;
        const timeBonus = Math.max(100 - this.time, 0) * this.level;
        this.score += timeBonus;

        this.saveScore();

        if (this.level < this.maxLevel) {
            setTimeout(() => {
                if (confirm(`Уровень ${this.level} пройден!\nВы получили бонус за время: +${timeBonus} очков\n\nПерейти на уровень ${this.level + 1}?`)) {
                    this.nextLevel();
                } else {
                    this.showLevelComplete();
                }
            }, 500);
        } else {
            this.showGameComplete();
        }
    }

    nextLevel() {
        this.level++;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.time = 0;
        this.isPlaying = false;
        this.canFlip = true;
        
        this.timerElement.textContent = '0';
        this.createCardPairs();
        this.setupGame();
    }

    showLevelComplete() {
        alert(`Игра завершена на уровне ${this.level}!\nИтоговый счет: ${this.score}\nВремя: ${this.time} секунд`);
    }

    showGameComplete() {
        alert(`ПОБЕДА! Вы прошли все уровни!\nФинальный счет: ${this.score}\nОбщее время: ${this.time} секунд\n\nИгра завершена!`);
    }

    startGame() {
        this.isPlaying = true;
        this.time = 0;
        this.timer = setInterval(() => {
            this.time++;
            this.timerElement.textContent = this.time;
        }, 1000);
    }

    async saveScore() {
        try {
            const token = localStorage.getItem('token');
            console.log('💾 Попытка сохранения игры...');
            console.log('🔐 Токен в localStorage:', token ? '✅ Есть' : '❌ Нет');
            
            if (!token) {
                console.log('⚠️ Пользователь не залогинен, результат не сохраняется');
                return;
            }
    
            // Проверяем токен перед отправкой
            console.log('🔍 Проверка токена перед отправкой:', {
                length: token.length,
                first50: token.substring(0, 50) + '...'
            });
    
            // Декодируем токен для отладки
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('📋 ID пользователя из токена:', payload.id);
            } catch (e) {
                console.error('❌ Ошибка декодирования токена:', e);
            }
    
            console.log('📤 Отправка результата игры:', {
                score: this.score,
                time: this.time,
                level: this.level
            });
            
            const response = await fetch('http://localhost:3000/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    score: this.score,
                    time: this.time,
                    level: this.level
                })
            });
    
            const data = await response.json();
            console.log('📥 Ответ сервера:', data);
            
            if (!response.ok) {
                console.error('❌ Ошибка сохранения:', data.error || data.details);
                throw new Error(data.error || 'Ошибка сохранения');
            }
            
            console.log('✅ Игра успешно сохранена! ID:', data.game?.id);
        } catch (error) {
            console.error('❌ Error saving score:', error);
            // Можно показать пользователю уведомление
            // alert('Не удалось сохранить результат: ' + error.message);
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    restart() {
        clearInterval(this.timer);
        this.level = 1;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.score = 0;
        this.time = 0;
        this.isPlaying = false;
        this.canFlip = true;
        
        this.updateScore();
        this.timerElement.textContent = '0';
        if (this.levelElement) {
            this.levelElement.textContent = '1';
        }
        this.createCardPairs();
        this.setupGame();
    }
}