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
        this.maxLevel = 4; // 3x3, 4x4, 5x5, 6x6
        
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
        
        // Выбираем нужное количество уникальных карточек
        const selectedCards = this.availableCards.slice(0, pairsNeeded);
        this.cards = [...selectedCards, ...selectedCards];
        this.shuffleCards();
    }

    getGridSize() {
        // Уровень 1: 3x3, уровень 2: 4x4, уровень 3: 5x5, уровень 4: 6x6
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
        
        // Выбираем нужное количество уникальных карточек
        const selectedCards = this.availableCards.slice(0, pairsNeeded);
        this.cards = [...selectedCards, ...selectedCards];
        this.shuffleCards();
        
        // Обновляем CSS grid в зависимости от размера
        this.gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        // Настраиваем размер карточек и шрифта в зависимости от уровня
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
    
        // Обновляем отображение уровня
        if (this.levelElement) {
            this.levelElement.textContent = this.level;
        }
    }

    getCardSize() {
        const gridSize = this.getGridSize();
        
        // Размеры карточек для разных уровней
        const sizes = {
            3: { cardSize: '120px', fontSize: '2.5rem' },  // 3x3
            4: { cardSize: '100px', fontSize: '2rem' },    // 4x4  
            5: { cardSize: '85px', fontSize: '1.7rem' },   // 5x5
            6: { cardSize: '75px', fontSize: '1.5rem' }    // 6x6
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
        
        // Бонусные очки за уровень: базовые 10 + 5 за уровень
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

        // Бонус за время: чем быстрее, тем больше очков
        const timeBonus = Math.max(100 - this.time, 0) * this.level;
        this.score += timeBonus;

        this.saveScore();

        if (this.level < this.maxLevel) {
            setTimeout(() => {
                if (confirm(`🎉 Уровень ${this.level} пройден!\n🏆 Вы получили бонус за время: +${timeBonus} очков\n\nПерейти на уровень ${this.level + 1}?`)) {
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
        alert(`🎊 Игра завершена на уровне ${this.level}!\n🏆 Итоговый счет: ${this.score}\n⏱️ Время: ${this.time} секунд`);
    }

    showGameComplete() {
        alert(`🏆 ПОБЕДА! Вы прошли все уровни!\n🎯 Финальный счет: ${this.score}\n⏱️ Общее время: ${this.time} секунд\n\nИгра завершена!`);
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
            if (!token) return;

            await fetch('http://localhost:3000/api/games', {
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
        } catch (error) {
            console.error('Error saving score:', error);
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