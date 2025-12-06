class ChatBot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.quickButtons = [
            { text: "Как играть?", question: "Как играть в Memory Game?" },
            { text: "Система очков", question: "Как начисляются очки?" },
            { text: "Уровни сложности", question: "Расскажи про уровни" },
            { text: "Моя статистика", question: "Где посмотреть статистику?" },
            { text: "Сохранение прогресса", question: "Как сохраняется прогресс?" },
            { text: "Темы оформления", question: "Как сменить тему?" }
        ];
        this.currentTheme = this.getCurrentTheme();
        this.init();
    }

    init() {
        this.createChatBot();
        this.loadWelcomeMessage();
        this.applyTheme();
        this.setupThemeObserver();
    }

    getCurrentTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    applyTheme() {
        const isDark = this.currentTheme === 'dark';
        
        if (isDark) {
            this.chatContainer.style.background = '#1e293b';
            this.chatContainer.style.borderColor = '#334155';
            this.chatContainer.querySelector('.chatbot-messages').style.background = '#1e293b';
            this.chatContainer.querySelector('.chatbot-quick-buttons').style.background = '#0f172a';
            this.chatContainer.querySelector('.chatbot-quick-buttons').style.borderColor = '#334155';

            const quickButtons = this.chatContainer.querySelectorAll('.chatbot-quick-button');
            quickButtons.forEach(btn => {
                btn.style.background = '#334155';
                btn.style.color = '#e2e8f0';
                btn.style.borderColor = '#475569';
            });
        } else {
            this.chatContainer.style.background = 'white';
            this.chatContainer.style.borderColor = '#e2e8f0';
            this.chatContainer.querySelector('.chatbot-messages').style.background = 'white';
            this.chatContainer.querySelector('.chatbot-quick-buttons').style.background = '#f8fafc';
            this.chatContainer.querySelector('.chatbot-quick-buttons').style.borderColor = '#e2e8f0';

            const quickButtons = this.chatContainer.querySelectorAll('.chatbot-quick-button');
            quickButtons.forEach(btn => {
                btn.style.background = 'white';
                btn.style.color = '#334155';
                btn.style.borderColor = '#e2e8f0';
            });
        }
    }

    setupThemeObserver() {

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    this.currentTheme = this.getCurrentTheme();
                    this.applyTheme();
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    createChatBot() {

        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'chatbot-container';
        this.chatContainer.innerHTML = `
            <div class="chatbot-header">
                <div class="chatbot-title">
                    <span>Помощник Memory Game</span>
                </div>
                <button class="chatbot-close">×</button>
            </div>
            <div class="chatbot-messages"></div>
            <div class="chatbot-quick-buttons"></div>
        `;

        this.chatButton = document.createElement('div');
        this.chatButton.className = 'chatbot-button';
        this.chatButton.innerHTML = '🤖';

        document.body.appendChild(this.chatButton);
        document.body.appendChild(this.chatContainer);

        this.setupEventListeners();
        this.createQuickButtons();
    }

    setupEventListeners() {

        this.chatButton.addEventListener('click', () => this.toggleChat());

        this.chatContainer.querySelector('.chatbot-close').addEventListener('click', () => this.closeChat());
    }

    createQuickButtons() {
        const buttonsContainer = this.chatContainer.querySelector('.chatbot-quick-buttons');
        
        this.quickButtons.forEach(button => {
            const buttonElement = document.createElement('button');
            buttonElement.className = 'chatbot-quick-button';
            buttonElement.textContent = button.text;
            buttonElement.addEventListener('click', () => {
                this.addUserMessage(button.question);
                this.processUserMessage(button.question);
            });
            buttonsContainer.appendChild(buttonElement);
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.openChat();
        } else {
            this.closeChat();
        }
    }

    openChat() {
        this.chatContainer.classList.add('active');
        this.chatButton.classList.add('active');
    }

    closeChat() {
        this.chatContainer.classList.remove('active');
        this.chatButton.classList.remove('active');
    }

    loadWelcomeMessage() {
        const welcomeMessage = "Привет! Я ваш помощник по игре Memory Game!\n\nВыберите интересующий вас вопрос:";

        setTimeout(() => {
            this.addBotMessage(welcomeMessage);
        }, 500);
    }

    addUserMessage(message) {
        this.addMessage(message, 'user');
    }

    addBotMessage(message) {
        this.addMessage(message, 'bot');
    }

    addMessage(message, sender) {
        const messagesContainer = this.chatContainer.querySelector('.chatbot-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `chatbot-message chatbot-message-${sender}`;
        
        const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        messageElement.innerHTML = `
            <div class="chatbot-message-content">${formattedMessage}</div>
            <div class="chatbot-message-time">${this.getCurrentTime()}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        setTimeout(() => {
            messageElement.classList.add('visible');
        }, 10);
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    processUserMessage(message) {
        const lowerMessage = message.toLowerCase();
        let response = '';

        if (lowerMessage.includes('как играть') || lowerMessage.includes('правила')) {
            response = `**Правила игры Memory Game:**

• **Цель игры:** Найти все парные карточки
• **Как играть:** 
  - Кликайте по карточкам, чтобы перевернуть их
  - Открывайте по две карточки за ход
  - Если карточки совпадают - они остаются открытыми
  - Если нет - переворачиваются обратно
  - Запоминайте расположение карточек

• **Уровни сложности:** 
  - От 3x3 до 6x6 сетки
  - Чем выше уровень, тем больше карточек

**Совет:** Тренируйте память и старайтесь проходить уровни быстрее для большего количества очков!`;
        }
        else if (lowerMessage.includes('очк') || lowerMessage.includes('счет')) {
            response = `**Система начисления очков:**

• **Базовые очки:** 10 + (уровень × 5) за каждую найденную пару
• **Бонус за скорость:** (100 - ваше время) × уровень
• **Множитель уровня:** Чем выше уровень, тем больше очков

**Пример:**
- Уровень 1: 15 очков за пару + бонус за время
- Уровень 4: 30 очков за пару + увеличенный бонус

**Стратегия:** Проходите уровни быстро и переходите на более сложные для максимального счета!`;
        }
        else if (lowerMessage.includes('уровень') || lowerMessage.includes('сложность')) {
            response = `**Система уровней:**

• **Уровень 1:** 3x3 сетка (6 карточек) - отличный старт!
• **Уровень 2:** 4x4 сетка (8 карточек) - интереснее!
• **Уровень 3:** 5x5 сетка (13 карточек) - настоящий вызов!
• **Уровень 4:** 6x6 сетка (18 карточек) - испытание для памяти!

**Особенности:**
- Каждый следующий уровень сложнее предыдущего
- Больше карточек = сложнее запомнить
- Но и больше потенциальных очков!
- Автоматический переход после прохождения уровня

**Совет:** Начинайте с первого уровня и постепенно повышайте сложность!`;
        }
        else if (lowerMessage.includes('статистик') || lowerMessage.includes('профиль')) {
            response = `**Ваша статистика и профиль:**

В личном кабинете вы найдете:

• **Общая статистика:**
  - Количество сыгранных игр
  - Лучший результат
  - Средний счет
  - Лучшее время
  - Максимальный уровень

• **История игр:** Последние 10 сыгранных партий
• **Таблица лидеров:** Сравните свои результаты с другими игроками

**Чтобы посмотреть:** Перейдите в раздел "Профиль" в главном меню! 👤`;
        }
        else if (lowerMessage.includes('сохранение') || lowerMessage.includes('прогресс')) {
            response = `**💾 Сохранение прогресса:**

**Что сохраняется автоматически:**
• Все ваши игровые результаты
• Достигнутые уровни сложности
• Лучшие счета и рекорды
• История всех сыгранных игр

**Для сохранения прогресса:**
1. **Зарегистрируйтесь** или **войдите** в аккаунт
2. Все данные будут привязаны к вашему профилю
3. Вы можете заходить с любого устройства

**Важно:** Без регистрации прогресс сохраняется только до закрытия браузера. С аккаунтом - навсегда!`;
        }
        else if (lowerMessage.includes('темы') || lowerMessage.includes('оформление')) {
            response = `**Темы оформления:**

**Доступные темы:**
• **Светлая тема** - яркая и современная
• **Темная тема** - комфортная для глаз

**Как сменить тему:**
1. Найдите кнопку переключения темы в правом верхнем углу
2. Нажмите на нее для смены темы
3. Ваш выбор сохранится автоматически

**Преимущества:**
- Уменьшает нагрузку на глаза
- Подстраивается под ваши предпочтения
- Работает на всех страницах сайта

Выберите тему, которая вам больше нравится! 😊`;
        }
        else if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
            response = "Привет! Рад вас видеть! \n\nЯ помогу разобраться с игрой Memory Game. Выберите вопрос из списка ниже!";
        }
        else if (lowerMessage.includes('спасибо') || lowerMessage.includes('благодар')) {
            response = "Всегда пожалуйста!\n\nЕсли возникнут еще вопросы - обращайтесь! Удачи в игре и новых рекордов!";
        }
        else if (lowerMessage.includes('пока') || lowerMessage.includes('до свидани')) {
            response = "До встречи! Возвращайтесь, чтобы побить свои рекорды! \n\nЕсли нужна будет помощь - я всегда здесь! 🤖";
        }
        else {
            response = "Отличный вопрос!\n\nПока я специализируюсь на помощи с игрой Memory Game. Попробуйте выбрать один из готовых вопросов выше - там много полезной информации!\n\nИли переформулируйте вопрос про игру, уровни, очки или статистику - с удовольствием помогу!";
        }

        setTimeout(() => {
            this.addBotMessage(response);
        }, 1000 + Math.random() * 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatBot = new ChatBot();
});