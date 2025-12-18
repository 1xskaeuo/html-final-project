class ArcadeGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.score = 0;
        this.time = 0;
        this.timer = null;
        this.isPlaying = false;
        this.canFlip = true;
        this.moves = 0;
        this.currentMode = 'classic';
        this.timeLimit = 120;
        this.moveLimit = 50;
        this.remainingMoves = 50;
        this.gameActive = false;
        
        this.init();
    }

    async init() {
        this.gameBoard = document.getElementById('arcade-game-board');
        this.scoreElement = document.getElementById('arcade-score');
        this.timeElement = document.getElementById('arcade-time');
        this.movesElement = document.getElementById('arcade-moves');
        
        await this.loadCards();
        this.setupEventListeners();
        this.loadArcadeLeaderboard('classic');
        this.loadArcadeHistory();
    }

    async loadCards() {
        try {
            const response = await fetch('http://localhost:3000/api/cards');
            const data = await response.json();
            this.availableCards = data.cards || ['🌟', '🚀', '🎯', '🌈', '🔥', '💎', '🎨', '⚡', '🎭', '🦄', '👾', '🎪', '🤖', '👽', '🐲', '🦋'];
        } catch (error) {
            console.error('Error loading cards:', error);
            this.availableCards = ['🌟', '🚀', '🎯', '🌈', '🔥', '💎', '🎨', '⚡', '🎭', '🦄', '👾', '🎪', '🤖', '👽', '🐲', '🦋'];
        }
    }

    setupEventListeners() {
        const modeButtons = document.querySelectorAll('.play-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.startArcadeMode(e.target.dataset.mode || e.target.closest('.play-btn').dataset.mode);
            });
        });

        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.loadArcadeLeaderboard(e.target.dataset.mode);
            });
        });

        const restartBtn = document.getElementById('arcade-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartArcade());
        }
    }

    startArcadeMode(mode) {
        this.currentMode = mode;

        switch(mode) {
            case 'classic':
                this.timeLimit = 120;
                this.moveLimit = Infinity;
                break;
            case 'moves':
                this.timeLimit = Infinity;
                this.moveLimit = 50;
                break;
            case 'survival':
                this.timeLimit = 300; 
                this.moveLimit = 30;
                break;
        }

        this.remainingMoves = this.moveLimit;
        this.moves = 0;
        this.score = 0;
        this.time = this.timeLimit;
        this.gameActive = true;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.canFlip = true;

        document.querySelector('.arcade-modes').classList.add('hidden');
        document.getElementById('arcade-game').classList.remove('hidden');
        
        this.updateArcadeUI();
        this.startArcadeGame();
    }

    startArcadeGame() {

        this.gameBoard.innerHTML = '';
        
        this.createCardPairs();

        this.displayCards();

        if (this.timeLimit !== Infinity) {
            clearInterval(this.timer);
            this.timer = setInterval(() => {
                if (this.time > 0 && this.gameActive) {
                    this.time--;
                    this.timeElement.textContent = this.time;

                    if (this.time <= 10) {
                        this.timeElement.style.color = '#ff4757';
                    } else {
                        this.timeElement.style.color = '';
                    }
                    
                    if (this.time === 0) {
                        this.endArcadeGame('⏱️ Время вышло!');
                    }
                }
            }, 1000);
        }

        if (this.moveLimit !== Infinity) {
            this.movesElement.textContent = `${this.moves}/${this.moveLimit}`;
        }
    }

    createCardPairs() {
        const gridSize = 4;
        const pairsNeeded = (gridSize * gridSize) / 2;

        const selectedCards = this.availableCards.slice(0, pairsNeeded);
        this.cards = [...selectedCards, ...selectedCards];
        this.shuffleCards();

        this.gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    }

    shuffleCards() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    displayCards() {
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.index = index;
            cardElement.dataset.value = card;
            cardElement.style.width = '100px';
            cardElement.style.height = '100px';
            cardElement.style.fontSize = '2rem';
            cardElement.innerHTML = `
                <div class="back">?</div>
                <div class="front">${card}</div>
            `;
            
            cardElement.addEventListener('click', () => this.flipCard(cardElement));
            this.gameBoard.appendChild(cardElement);
        });
    }

    flipCard(card) {
        if (!this.gameActive || !this.canFlip || 
            card.classList.contains('flipped') || 
            card.classList.contains('matched') ||
            this.flippedCards.length >= 2) {
            return;
        }

        if (!this.isPlaying) {
            this.isPlaying = true;
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.canFlip = false;
            setTimeout(() => this.checkMatch(), 500);

            this.moves++;
            if (this.moveLimit !== Infinity) {
                this.remainingMoves--;
                this.movesElement.textContent = `${this.moves}/${this.moveLimit}`;
                
                if (this.remainingMoves <= 0) {
                    this.endArcadeGame('🎯 Ходы закончились!');
                }
            }
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const value1 = card1.dataset.value;
        const value2 = card2.dataset.value;

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

        let points = 10;
        if (this.currentMode === 'survival') {
            points = 20;
            this.remainingMoves += 2; 
            this.movesElement.textContent = `${this.moves}/${this.moveLimit}`;
        } else if (this.currentMode === 'classic' && this.matchedPairs % 5 === 0) {
            this.time += 10; 
            this.timeElement.textContent = this.time;
        }

        this.score += points;
        this.scoreElement.textContent = this.score;
        
        this.flippedCards = [];
        this.canFlip = true;

        if (this.matchedPairs === this.cards.length / 2) {
            this.endArcadeGame('🎉 Все пары найдены!');
        }
    }

    handleMismatch(card1, card2) {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            
            this.flippedCards = [];
            this.canFlip = true;
        }, 1000);
    }

    updateArcadeUI() {
        this.timeElement.textContent = this.time;
        this.scoreElement.textContent = this.score;
        
        if (this.moveLimit !== Infinity) {
            this.movesElement.parentElement.style.display = 'flex';
            this.movesElement.textContent = `${this.moves}/${this.moveLimit}`;
        } else {
            this.movesElement.parentElement.style.display = 'none';
        }
    }

    async endArcadeGame(reason = 'Игра завершена') {
        this.gameActive = false;
        this.isPlaying = false;
        clearInterval(this.timer);
        
        await this.saveArcadeResult();

        setTimeout(() => {
            alert(`${reason}\n\n🏆 Итоговый счет: ${this.score}\n🎯 Ходов сделано: ${this.moves}\n⏱️ Время: ${this.timeLimit - this.time} секунд\n✨ Найдено пар: ${this.matchedPairs}`);

            this.showArcadeMenu();
            this.loadArcadeLeaderboard(this.currentMode);
            this.loadArcadeHistory();
        }, 500);
    }

    async saveArcadeResult() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.log('Пользователь не залогинен, результат не сохраняется');
                return;
            }

            console.log('💾 Сохранение аркадной игры:', {
                score: this.score,
                time: this.timeLimit - this.time,
                moves: this.moves,
                mode: this.currentMode
            });

            const response = await fetch('http://localhost:3000/api/arcade/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    score: this.score,
                    time: this.timeLimit - this.time,
                    moves: this.moves,
                    mode: this.currentMode
                })
            });

            const data = await response.json();
            console.log('📥 Ответ сервера:', data);
            
            if (!response.ok) {
                console.error('Ошибка сохранения:', data.error);
                return;
            }
            
            console.log('Аркадная игра сохранена! ID:', data.game?.id);
        } catch (error) {
            console.error('Error saving arcade game:', error);
        }
    }

    showArcadeMenu() {
        document.querySelector('.arcade-modes').classList.remove('hidden');
        document.getElementById('arcade-game').classList.add('hidden');

        this.gameActive = false;
        this.isPlaying = false;
        clearInterval(this.timer);
        this.gameBoard.innerHTML = '';
    }

    restartArcade() {
        this.showArcadeMenu();
        setTimeout(() => {
            this.startArcadeMode(this.currentMode);
        }, 100);
    }

    async loadArcadeLeaderboard(mode) {
        try {
            const response = await fetch(`http://localhost:3000/api/arcade/leaderboard?mode=${mode}`);
            
            if (response.ok) {
                const data = await response.json();
                this.displayArcadeLeaderboard(data.leaderboard || []);

                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                const activeTab = document.querySelector(`.tab-btn[data-mode="${mode}"]`);
                if (activeTab) {
                    activeTab.classList.add('active');
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки таблицы лидеров:', error);
            this.displayArcadeLeaderboard([]);
        }
    }

    displayArcadeLeaderboard(leaderboard) {
        const container = document.getElementById('arcade-leaderboard-list');
        
        if (!leaderboard || leaderboard.length === 0) {
            container.innerHTML = '<div class="no-data">😔 Пока нет данных для этого режима</div>';
            return;
        }

        container.innerHTML = leaderboard.map((player, index) => `
            <div class="leaderboard-item ${index < 3 ? 'top-three' : ''}">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-user">${player.username || 'Игрок'}</div>
                <div class="leaderboard-score">${player.bestScore || 0}</div>
                <div class="leaderboard-time">${player.bestTime || 0}с</div>
            </div>
        `).join('');
    }

    async loadArcadeHistory() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                document.getElementById('arcade-history-list').innerHTML = 
                    '<div class="no-data">🔒 Войдите, чтобы видеть историю игр</div>';
                return;
            }

            const response = await fetch('http://localhost:3000/api/arcade/games', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const games = await response.json();
                this.displayArcadeHistory(games.slice(0, 5) || []);
            } else {
                this.displayArcadeHistory([]);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            this.displayArcadeHistory([]);
        }
    }

    displayArcadeHistory(games) {
        const container = document.getElementById('arcade-history-list');
        
        if (!games || games.length === 0) {
            container.innerHTML = '<div class="no-data">Вы еще не играли в аркаду</div>';
            return;
        }

        container.innerHTML = games.map(game => `
            <div class="game-record">
                <div class="game-mode">${this.getModeName(game.mode)}</div>
                <div class="game-score">${game.score} очков</div>
                <div class="game-time">${game.time}с</div>
                <div class="game-moves">${game.moves} ходов</div>
                <div class="game-date">${new Date(game.played_at).toLocaleDateString('ru-RU')}</div>
            </div>
        `).join('');
    }

    getModeName(mode) {
        const modes = {
            'classic': '⚡ Классика',
            'moves': '🎯 Ограниченные ходы',
            'survival': '💀 Выживание'
        };
        return modes[mode] || mode;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.arcadeGame = new ArcadeGame();
});