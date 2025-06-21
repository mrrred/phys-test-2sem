document.addEventListener('DOMContentLoaded', () => {
    // DOM элементы
    const setupScreen = document.getElementById('setup-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultsScreen = document.getElementById('results-screen');
    const questionCountInput = document.getElementById('question-count');
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    const questionTitle = document.getElementById('question-title');
    const optionsContainer = document.getElementById('options-container');
    const inputContainer = document.getElementById('input-container');
    const formulaInput = document.getElementById('formula-input');
    const formulaPreview = document.getElementById('formula-preview');
    const submitAnswerBtn = document.getElementById('submit-answer');
    const progressBar = document.getElementById('progress');
    const progressText = document.getElementById('progress-text');
    const scoreValue = document.getElementById('score-value');
    const totalQuestions = document.getElementById('total-questions');
    const scorePercent = document.getElementById('score-percent');
    const resultsDetails = document.getElementById('results-details');
    const maxQuestionsSpan = document.getElementById('max-questions');
    const easyModeBtn = document.getElementById('easy-mode-btn');
    const hardModeBtn = document.getElementById('hard-mode-btn');

    // Состояние приложения
    let formulas = [];
    let currentTest = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let score = 0;
    let isHardMode = true;
    let history = [''];
    let historyIndex = 0;

    // Отображение символов для клавиатуры
    const KEY_DISPLAY = {
        '\\frac{}{}': 'Frac',
        '\\vec{}': 'Vec',
        '\\int': '∫',
        '\\sum': '∑',
        '\\lim': 'Lim',
        '\\Delta': 'Δ',
        '\\mathcal{E}': 'ℰ',
        '\\widetilde{k}': 'k̃',
        '\\cdot': '·',
        '\\times': '×',
        '\\infty': '∞',
        '\\partial': '∂',
        '\\text{Внутри: }': 'Внутри',
        '\\text{Снаружи: }': 'Снаружи',
        '\\alpha': 'α',
        '\\beta': 'β',
        '\\gamma': 'γ',
        '\\delta': 'δ',
        '\\varepsilon': 'ε',
        '\\pi': 'π',
        '\\sigma': 'σ',
        '\\lambda': 'λ',
        '\\varphi': 'φ',
        '\\chi': 'χ',
        '\\nu': 'ν',
        '^{}': 'x²',
        '_{}': 'x₀',
        '\\sqrt{}': '√',
        '\\widetilde{k}': 'k̃',
        '\\ln': 'ln',
        '\\log': 'log'
    };

    // Загрузка формул из JSON
    async function loadFormulas() {
        try {
            const response = await fetch('formulas.json');
            formulas = await response.json();
            maxQuestionsSpan.textContent = formulas.length;
            questionCountInput.max = formulas.length;
        } catch (error) {
            console.error('Ошибка загрузки формул:', error);
            alert('Не удалось загрузить формулы. Пожалуйста, проверьте файл formulas.json');
        }
    }

    // Инициализация виртуальной клавиатуры
    function initVirtualKeyboard() {
        const keyboard = document.getElementById('virtual-keyboard');
        keyboard.innerHTML = '';
        
        const keyGroups = [
            {
                name: 'Матем.',
                keys: ['\\frac{}{}', '^{}', '_{}', '\\sqrt{}', '\\pi', '\\infty', '\\ln', '\\log']
            },
            {
                name: 'Греческие',
                keys: ['\\alpha', '\\beta', '\\gamma', '\\delta', '\\varepsilon', '\\pi', '\\sigma', '\\lambda', '\\varphi', '\\nu']
            },
            {
                name: 'Физика',
                keys: ['\\vec{}', '\\Delta', '\\mathcal{E}', '\\cdot', '\\times', '\\partial', '\\widetilde{k}']
            }
        ];
        
        keyGroups.forEach(group => {
            const groupHeader = document.createElement('div');
            groupHeader.className = 'keyboard-row';
            groupHeader.innerHTML = `<div class="keyboard-key group-header">${group.name}</div>`;
            keyboard.appendChild(groupHeader);
            
            const row = document.createElement('div');
            row.className = 'keyboard-row';
            
            group.keys.forEach(key => {
                const keyElement = document.createElement('div');
                keyElement.className = 'keyboard-key';
                keyElement.textContent = KEY_DISPLAY[key] || key;
                keyElement.title = key;
                
                keyElement.addEventListener('click', () => {
                    insertSymbol(key);
                });
                
                row.appendChild(keyElement);
            });
            
            keyboard.appendChild(row);
        });
        
        const controlRow = document.createElement('div');
        controlRow.className = 'keyboard-row';
        controlRow.innerHTML = `
            <div class="keyboard-key space" id="backspace-key">⌫</div>
            <div class="keyboard-key space" id="clear-key">✖</div>
        `;
        keyboard.appendChild(controlRow);
        
        document.getElementById('backspace-key').addEventListener('click', () => {
            formulaInput.value = formulaInput.value.slice(0, -1);
            saveToHistory(formulaInput.value);
            updateFormulaPreview();
        });
        
        document.getElementById('clear-key').addEventListener('click', () => {
            formulaInput.value = '';
            saveToHistory('');
            updateFormulaPreview();
        });
    }
    
    // Вставка символа
    function insertSymbol(symbol) {
        const cursorPos = formulaInput.selectionStart;
        const before = formulaInput.value.substring(0, cursorPos);
        const after = formulaInput.value.substring(cursorPos);
        
        // Обработка специальных символов с курсором
        if (symbol === '^{}' || symbol === '_{}') {
            formulaInput.value = before + symbol[0] + '{}' + after;
            formulaInput.setSelectionRange(cursorPos + 2, cursorPos + 2);
        } 
        else if (symbol === '\\sqrt{}') {
            formulaInput.value = before + '\\sqrt{}' + after;
            formulaInput.setSelectionRange(cursorPos + 6, cursorPos + 6);
        }
        else {
            formulaInput.value = before + symbol + after;
            formulaInput.setSelectionRange(cursorPos + symbol.length, cursorPos + symbol.length);
        }
        
        saveToHistory(formulaInput.value);
        updateFormulaPreview();
        formulaInput.focus();
    }
    
    // Сохранение в историю
    function saveToHistory(value) {
        // Не сохранять повторяющиеся состояния
        if (history[historyIndex] === value) return;
        
        history = history.slice(0, historyIndex + 1);
        history.push(value);
        historyIndex = history.length - 1;
        
        // Ограничить историю 100 записями
        if (history.length > 100) {
            history.shift();
            historyIndex--;
        }
    }
    
    // Обновление предпросмотра формулы
    function updateFormulaPreview() {
        const input = formulaInput.value;
        
        try {
            katex.render(input, formulaPreview, {
                throwOnError: false,
                displayMode: false
            });
        } catch (e) {
            formulaPreview.innerHTML = `<span style="color: #e74c3c;">Ошибка: ${e.message}</span>`;
        }
    }
    
    // Нормализация формулы для сравнения
    function normalizeFormula(formula) {
        // Удаляем пробелы и приводим к нижнему регистру
        let normalized = formula.replace(/\s+/g, '').toLowerCase();
        
        // Заменяем синонимичные записи
        normalized = normalized
            .replace(/\\cdot/g, '')
            .replace(/\\times/g, '')
            .replace(/\*/g, '')
            .replace(/\\vec{([^}]*)}/g, '$1')
            .replace(/\\mathbf{([^}]*)}/g, '$1')
            .replace(/\\text{([^}]*)}/g, '$1')
            .replace(/\\mathcal{([^}]*)}/g, '$1')
            .replace(/\\widetilde{([^}]*)}/g, '$1')
            .replace(/\\frac{([^}{]*)}{([^}{]*)}/g, '$1/$2')
            .replace(/\^(\d)/g, '^{$1}') // Стандартизация степеней
            .replace(/=+/g, '='); // Убираем возможные дублирования =
        
        // Удаляем лишние скобки
        normalized = normalized.replace(/[{}()[\]]/g, '');
        
        // Стандартизация греческих букв
        const greekMap = {
            'alpha': 'a',
            'beta': 'b',
            'gamma': 'g',
            'delta': 'd',
            'varepsilon': 'e',
            'pi': 'p',
            'sigma': 's',
            'lambda': 'l',
            'varphi': 'f',
            'chi': 'c'
        };
        
        for (const [greek, latin] of Object.entries(greekMap)) {
            normalized = normalized.replace(new RegExp(`\\\\${greek}`, 'g'), latin);
        }
        
        return normalized;
    }
    
    // Проверка ответа в сложном режиме
    function checkHardModeAnswer(userInput) {
        const question = currentTest[currentQuestionIndex];
        const correctFormula = question.formula;
        
        // Нормализуем ввод пользователя и правильный ответ
        const normalizedUser = normalizeFormula(userInput);
        const normalizedCorrect = normalizeFormula(correctFormula);
        
        // Проверяем точное соответствие
        if (normalizedUser === normalizedCorrect) {
            return true;
        }
        
        // Проверяем альтернативные формы записи
        const alternativeForms = generateAlternativeForms(correctFormula);
        for (const form of alternativeForms) {
            if (normalizedUser === normalizeFormula(form)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Генерация альтернативных форм записи формулы
    function generateAlternativeForms(formula) {
        const alternatives = [];
        
        // Замена дробей
        if (formula.includes('\\frac')) {
            alternatives.push(formula.replace(/\\frac{([^}{]*)}{([^}{]*)}/g, '$1/$2'));
        }
        
        // Замена векторов
        if (formula.includes('\\vec')) {
            alternatives.push(formula.replace(/\\vec{([^}]*)}/g, '$1'));
        }
        
        // Замена умножения
        if (formula.includes('\\cdot') || formula.includes('\\times')) {
            alternatives.push(formula.replace(/\\cdot|\\times|\*/g, ''));
        }
        
        // Перестановка слагаемых
        if (formula.includes('+')) {
            const parts = formula.split('+');
            if (parts.length === 2) {
                alternatives.push(parts[1] + '+' + parts[0]);
            }
        }
        
        // Перестановка множителей
        if (formula.includes('*') || formula.includes('\\cdot')) {
            const parts = formula.split('*').join('').split('\\cdot');
            if (parts.length === 2) {
                alternatives.push(parts[1] + parts[0]);
            }
        }
        
        // Альтернативные обозначения
        alternatives.push(formula.replace(/\\mathbf{([^}]*)}/g, '$1'));
        alternatives.push(formula.replace(/\\mathcal{([^}]*)}/g, '$1'));
        alternatives.push(formula.replace(/\\widetilde{([^}]*)}/g, '$1'));
        
        return alternatives;
    }

    // Генерация теста
    function generateTest(questionCount) {
        // Выбираем случайные уникальные вопросы
        const shuffled = [...formulas].sort(() => 0.5 - Math.random());
        currentTest = shuffled.slice(0, questionCount).map(q => ({
            ...q,
            options: generateOptions(q)
        }));
    }

    // Генерация вариантов ответов
    function generateOptions(correctFormula) {
        const options = [
            { formula: correctFormula.formula, isCorrect: true }
        ];
        
        // Генерация 3-х неправильных вариантов
        const usedFormulas = new Set([correctFormula.formula]);
        
        while (options.length < 4) {
            let distortedFormula;
            
            // 50% chance to use another real formula
            if (Math.random() > 0.5 && formulas.length > 1) {
                const otherFormulas = formulas.filter(f => 
                    f.id !== correctFormula.id && !usedFormulas.has(f.formula)
                );
                
                if (otherFormulas.length > 0) {
                    const randomIndex = Math.floor(Math.random() * otherFormulas.length);
                    distortedFormula = otherFormulas[randomIndex].formula;
                }
            }
            
            // If we didn't get a formula from another question, distort current
            if (!distortedFormula) {
                distortedFormula = distortFormula(correctFormula.formula);
            }
            
            // Ensure we don't have duplicates
            if (!usedFormulas.has(distortedFormula)) {
                options.push({ 
                    formula: distortedFormula, 
                    isCorrect: false 
                });
                usedFormulas.add(distortedFormula);
            }
        }
        
        // Перемешиваем варианты
        return options.sort(() => Math.random() - 0.5);
    }

    // Безопасное искажение формул с защитой LaTeX
    function distortFormula(formula) {
        const safeDistortions = [
            changeCoefficients,
            swapTerms,
            changeSigns,
            modifyExponents,
            removeConstants
        ];
        
        let distorted = formula;
        let attempts = 0;
        const original = formula;
        
        // Apply 1-2 safe distortions
        const distortionCount = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < distortionCount; i++) {
            const method = safeDistortions[Math.floor(Math.random() * safeDistortions.length)];
            distorted = method(distorted);
            
            // Prevent infinite loops
            if (attempts++ > 10) break;
        }
        
        return distorted !== original ? distorted : getRandomOtherFormula(original);
    }

    // HELPER: Get random other formula
    function getRandomOtherFormula(original) {
        const otherFormulas = formulas.filter(f => f.formula !== original);
        if (otherFormulas.length === 0) return original;
        
        return otherFormulas[Math.floor(Math.random() * otherFormulas.length)].formula;
    }

    // Изменение коэффициентов (безопасно для LaTeX)
    function changeCoefficients(formula) {
        const coefficientChanges = {
            '2': ['1', '3', '4'],
            '3': ['2', '4', '6'],
            '4': ['2', '3', '6'],
            '1/2': ['1/3', '1/4', '2/3'],
            '1/4': ['1/2', '1/3', '1/5'],
            '\\pi': ['2\\pi', '3\\pi', '\\pi/2'],
            '2\\pi': ['\\pi', '3\\pi', '4\\pi'],
            '4\\pi': ['2\\pi', '3\\pi', '\\pi'],
            'k': ['c', 'g', 'm'],
            '\\varepsilon': ['\\mu', '\\kappa', '\\chi'],
            '\\lambda': ['\\sigma', '\\tau', '\\gamma'],
            '\\sigma': ['\\lambda', '\\rho', '\\eta']
        };
        
        for (const [key, replacements] of Object.entries(coefficientChanges)) {
            if (formula.includes(key)) {
                const replacement = replacements[Math.floor(Math.random() * replacements.length)];
                return formula.replace(new RegExp(escapeRegExp(key), 'g'), replacement);
            }
        }
        return formula;
    }

    // Перестановка терминов
    function swapTerms(formula) {
        // Only swap if there's an equals sign
        if (formula.includes('=')) {
            const parts = formula.split('=');
            if (parts.length === 2) {
                return `${parts[1].trim()} = ${parts[0].trim()}`;
            }
        }
        return formula;
    }

    // Изменение знаков
    function changeSigns(formula) {
        return formula
            .replace(/\+/g, '±PLUS±')
            .replace(/-/g, '+')
            .replace(/±PLUS±/g, '-')
            .replace(/=/g, '≈')
            .replace(/≈/g, '=');
    }

    // Изменение показателей степени
    function modifyExponents(formula) {
        return formula
            .replace(/\^2/g, '^3')
            .replace(/\^3/g, '^2')
            .replace(/\^{-1}/g, '^{-2}')
            .replace(/\^{-2}/g, '^{-1}')
            .replace(/r\^2/g, 'r^3')
            .replace(/r\^3/g, 'r^2');
    }

    // Удаление констант
    function removeConstants(formula) {
        const constants = [
            '\\frac{1}{4\\pi\\varepsilon_0}',
            '\\frac{1}{2}',
            '\\frac{1}{4}',
            '2\\pi',
            '4\\pi',
            '\\pi',
            'k'
        ];
        
        for (const constant of constants) {
            if (formula.includes(constant)) {
                return formula.replace(new RegExp(escapeRegExp(constant), 'g'), '');
            }
        }
        return formula;
    }

    // Экранирование для RegExp
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Показ вопроса
    function showQuestion() {
        if (currentQuestionIndex >= currentTest.length) {
            showResults();
            return;
        }
        
        const question = currentTest[currentQuestionIndex];
        questionTitle.textContent = question.title;
        
        // Показываем соответствующий контейнер в зависимости от режима
        if (isHardMode) {
            optionsContainer.style.display = 'none';
            inputContainer.style.display = 'block';
            formulaInput.value = '';
            formulaInput.classList.remove('correct', 'incorrect');
            updateFormulaPreview();
            nextBtn.disabled = true;
            submitAnswerBtn.disabled = false;
        } else {
            optionsContainer.style.display = 'grid';
            inputContainer.style.display = 'none';
            
            // Очищаем контейнер с вариантами
            optionsContainer.innerHTML = '';
            
            // Добавляем варианты ответов
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.dataset.index = index;
                optionElement.innerHTML = `\\(${option.formula}\\)`;
                optionElement.addEventListener('click', () => selectOption(optionElement, index));
                optionsContainer.appendChild(optionElement);
            });
        }
        
        // Обновляем прогресс
        const progressPercent = ((currentQuestionIndex) / currentTest.length) * 100;
        progressBar.style.width = `${progressPercent}%`;
        progressText.textContent = `Вопрос ${currentQuestionIndex + 1} из ${currentTest.length}`;
        
        // Рендерим формулы
        renderMathInElement(optionsContainer);
        
        // Сбрасываем состояние кнопки
        nextBtn.disabled = true;
    }

    // Выбор варианта (стандартный режим)
    function selectOption(optionElement, optionIndex) {
        // Сбрасываем предыдущий выбор
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Помечаем выбранный вариант
        optionElement.classList.add('selected');
        
        // Разрешаем переход к следующему вопросу
        nextBtn.disabled = false;
        
        // Сохраняем ответ пользователя
        const question = currentTest[currentQuestionIndex];
        const isCorrect = question.options[optionIndex].isCorrect;
        
        userAnswers[currentQuestionIndex] = {
            questionId: question.id,
            selectedOptionIndex: optionIndex,
            isCorrect
        };
    }
    
    // Обработчик для кнопки подтверждения ответа (сложный режим)
    function handleSubmitAnswer() {
        const userInput = formulaInput.value;
        const isCorrect = checkHardModeAnswer(userInput);
        
        // Сохраняем ответ пользователя
        userAnswers[currentQuestionIndex] = {
            questionId: currentTest[currentQuestionIndex].id,
            userInput: userInput,
            isCorrect: isCorrect
        };
        
        // Блокируем кнопку
        submitAnswerBtn.disabled = true;
        
        // Показываем результат
        formulaInput.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // Разрешаем переход к следующему вопросу
        nextBtn.disabled = false;
    }

    // Переход к следующему вопросу
    function nextQuestion() {
        currentQuestionIndex++;
        showQuestion();
    }

    // Показ результатов
    function showResults() {
        // Считаем правильные ответы
        score = userAnswers.filter(answer => answer.isCorrect).length;
        const total = currentTest.length;
        const percent = Math.round((score / total) * 100);
        
        // Обновляем данные на экране
        scoreValue.textContent = score;
        totalQuestions.textContent = total;
        scorePercent.textContent = `${percent}%`;
        
        // Очищаем контейнер с детализацией
        resultsDetails.innerHTML = '';
        
        // Добавляем детали по каждому вопросу
        currentTest.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${userAnswer.isCorrect ? 'correct' : 'incorrect'}`;
            
            // Вопрос
            const questionElement = document.createElement('div');
            questionElement.className = 'result-question';
            questionElement.textContent = `${index + 1}. ${question.title}`;
            resultItem.appendChild(questionElement);
            
            // Ответ пользователя
            const userAnswerElement = document.createElement('div');
            userAnswerElement.className = `result-answer user-answer ${userAnswer.isCorrect ? 'correct' : 'incorrect'}`;
            
            const userLabel = document.createElement('span');
            userLabel.className = 'result-label';
            userLabel.textContent = 'Ваш ответ:';
            
            const userFormula = document.createElement('span');
            userFormula.className = 'result-formula';
            
            if (isHardMode) {
                userFormula.innerHTML = `\\(${userAnswer.userInput || ''}\\)`;
            } else {
                userFormula.innerHTML = `\\(${question.options[userAnswer.selectedOptionIndex].formula}\\)`;
            }
            
            userAnswerElement.appendChild(userLabel);
            userAnswerElement.appendChild(userFormula);
            resultItem.appendChild(userAnswerElement);
            
            // Правильный ответ (если пользователь ошибся)
            if (!userAnswer.isCorrect) {
                const correctAnswerElement = document.createElement('div');
                correctAnswerElement.className = 'result-answer correct-answer';
                
                const correctLabel = document.createElement('span');
                correctLabel.className = 'result-label';
                correctLabel.textContent = 'Правильный ответ:';
                
                const correctFormula = document.createElement('span');
                correctFormula.className = 'result-formula';
                correctFormula.innerHTML = `\\(${question.formula}\\)`;
                
                correctAnswerElement.appendChild(correctLabel);
                correctAnswerElement.appendChild(correctFormula);
                resultItem.appendChild(correctAnswerElement);
            }
            
            resultsDetails.appendChild(resultItem);
        });
        
        // Рендерим формулы
        renderMathInElement(resultsDetails);
        
        // Переключаем экраны
        quizScreen.classList.remove('active');
        resultsScreen.classList.add('active');
    }

    // Начало теста
    function startTest() {
        const questionCount = parseInt(questionCountInput.value);
        
        if (isNaN(questionCount) || questionCount < 1 || questionCount > formulas.length) {
            alert(`Пожалуйста, введите число от 1 до ${formulas.length}`);
            return;
        }
        
        // Генерируем тест
        generateTest(questionCount);
        
        // Сбрасываем состояние
        currentQuestionIndex = 0;
        userAnswers = [];
        score = 0;
        
        // Переключаем экраны
        setupScreen.classList.remove('active');
        quizScreen.classList.add('active');
        
        // Показываем первый вопрос
        showQuestion();
    }

    // Перезапуск теста
    function restartTest() {
        resultsScreen.classList.remove('active');
        setupScreen.classList.add('active');
    }

    // Обработчики событий
    startBtn.addEventListener('click', startTest);
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', restartTest);
    
    easyModeBtn.addEventListener('click', () => {
        isHardMode = false;
        easyModeBtn.classList.add('active');
        hardModeBtn.classList.remove('active');
    });
    
    hardModeBtn.addEventListener('click', () => {
        isHardMode = true;
        hardModeBtn.classList.add('active');
        easyModeBtn.classList.remove('active');
    });
    
    formulaInput.addEventListener('input', () => {
        saveToHistory(formulaInput.value);
        updateFormulaPreview();
    });
    
    // Обработка Ctrl+Z/Ctrl+Y
    formulaInput.addEventListener('keydown', (e) => {
        // Отмена (Ctrl+Z)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                formulaInput.value = history[historyIndex];
                updateFormulaPreview();
            }
        }
        // Повтор (Ctrl+Y)
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                historyIndex++;
                formulaInput.value = history[historyIndex];
                updateFormulaPreview();
            }
        }
    });
    
    submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
    
    // Инициализация
    initVirtualKeyboard();
    loadFormulas();
});