const menu = document.getElementById('menu');
const game = document.getElementById('game');
const answerInput = document.getElementById('answer');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const gameOver = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart');
const timerSetting = document.getElementById('timer-setting');
const scoreboardDiv = document.getElementById('scoreboard');
const scoreList = document.getElementById('score-list');

let previousScores = [];
let score = 0;
let timeLeft = 30;
let gameInterval;
let fallInterval;
let currentTimerLength = 30;
let currentDifficulty = 'easy';
let activeQuestions = [];
let currentElement = null;
let currentAnswer = null;

document.querySelectorAll('.difficulty').forEach(btn => {
    btn.addEventListener('click', () => {
        currentDifficulty = btn.dataset.level;
        currentTimerLength = parseInt(timerSetting.value, 10) || 30;
        timeLeft = currentTimerLength;
        startGame();
    });
});


function startGame() {
    menu.classList.add('hidden');
    game.classList.remove('hidden');

    // reset state
    score = 0;
    timeLeft = currentTimerLength;
    activeQuestions.forEach(q => { clearTimeout(q.to); q.el.remove(); });
    activeQuestions = [];
    updateScore();
    updateTimer();
    answerInput.value = '';
    answerInput.focus();

    gameInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) endGame();
    }, 1000);

    spawnQuestion(currentDifficulty);
    fallInterval = setInterval(() => spawnQuestion(currentDifficulty), 2000);
}

function spawnQuestion(level) {
    const el = document.createElement('div');
    const [question, answer] = generateQuestion(level);
    el.textContent = question;
    el.className = 'falling text-2xl text-white';
    const left = 30 + Math.random() * 40;
    el.style.left = `${left}%`;
    el.dataset.answer = answer;

    game.appendChild(el);

    // add to active list
    activeQuestions.push(el);

    // first question = current
    if (activeQuestions.length === 1) {
        setCurrent(el);
    }

    // auto remove after duration
    const duration = Math.random() * 4 + 3;
    el.style.animationDuration = `${duration}s`;

    setTimeout(() => {
        // remove from list safely
        activeQuestions = activeQuestions.filter(q => q !== el);
        if (el === currentElement) pickNext();
        el.remove();
    }, duration * 1000 + 100);
}

function setCurrent(el) {
    if (currentElement) currentElement.classList.remove('current');
    if (!el) return (currentElement = currentAnswer = null);

    el.classList.add('current');
    currentElement = el;
    currentAnswer = Number(el.dataset.answer);
}

function pickNext() {
    const next = activeQuestions[0];
    setCurrent(next);
}


answerInput.addEventListener('input', () => {
    const raw = answerInput.value.trim();
    const intRegex = /^[+-]?\d+$/;
    if (!intRegex.test(raw)) return;

    const val = Number(raw);
    if (val === currentAnswer) {
        score++;
        updateScore();
        answerInput.value = '';
        answerInput.classList.add('bg-emerald-200');
        setTimeout(() => answerInput.classList.remove('bg-emerald-200'), 120);

        // remove current from DOM & list
        if (currentElement) {
            currentElement.style.opacity = '0.4';
            currentElement.classList.remove('current');
            activeQuestions = activeQuestions.filter(q => q !== currentElement);
            currentElement.remove();
        }

        // 🔹 If player answered *everything* and is waiting, spawn a new one immediately
        if (activeQuestions.length === 0 && timeLeft > 0) {
            spawnQuestion(currentDifficulty);
        }

        pickNext();
    }
});

function generateQuestion(level) {
    const rand = max => Math.floor(Math.random() * max);

    let a, b, question, answer;

    if (level === 'easy') {
        // range 0–20, only positive answers
        a = rand(21);
        b = rand(21);
        if (Math.random() < 0.5) {
            question = `${a} + ${b}`;
            answer = a + b;
        } else {
            // ensure positive result for subtraction
            if (b > a) [a, b] = [b, a];
            question = `${a} - ${b}`;
            answer = a - b;
        }
    }

    else if (level === 'medium') {
        // helper for inclusive random integers
        const randBetween = (min, max) =>
            Math.floor(Math.random() * (max - min + 1)) + min;

        const op = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)];

        switch (op) {
            case '+': {
                const a = randBetween(0, 50);
                const b = randBetween(0, 50);
                question = `${a} + ${b}`;
                answer = a + b;
                break;
            }

            case '-': {
                const a = randBetween(0, 50);
                const b = randBetween(0, 50);
                question = `${a} - ${b}`;
                answer = a - b; // may be negative
                break;
            }

            case '×': {
                // single-digit × single-digit (up to 12×12)
                const a = randBetween(2, 12);
                const b = randBetween(2, 12);
                question = `${a} × ${b}`;
                answer = a * b;
                break;
            }

            case '÷': {
                // ensure clean integer result and both sides ≤ 2 digits
                const divisor = randBetween(2, 12);
                const quotient = randBetween(2, 12);
                const dividend = divisor * quotient;
                question = `${dividend} / ${divisor}`;
                answer = quotient;
                break;
            }
        }
    }


    else if (level === 'hard') {
        // go wild: wider ranges and random ops
        const ops = ['+', '-', '×', '÷'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        a = rand(101) - 50; // can be negative
        b = rand(101) - 50;
        if (b === 0) b = 1;

        switch (op) {
            case '+':
                question = `${a} + ${b}`;
                answer = a + b;
                break;
            case '-':
                question = `${a} - ${b}`;
                answer = a - b;
                break;
            case '×':
                question = `${a} × ${b}`;
                answer = a * b;
                break;
            case '÷':
                // keep integer division if possible
                answer = rand(21) - 10;
                b = rand(10) + 1;
                a = answer * b;
                question = `${a} ÷ ${b}`;
                break;
        }
    }

    return [question, answer];
}



function updateScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

function updateTimer() {
    timerDisplay.textContent = `Time: ${timeLeft}`;
}

function endGame() {
    clearInterval(gameInterval);
    clearInterval(fallInterval);
    activeQuestions.forEach(q => { clearTimeout(q.to); q.el?.remove(); });
    activeQuestions = [];

    previousScores.unshift({
        level: currentDifficulty,
        score: score,
        timer: currentTimerLength,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    if (previousScores.length > 5) previousScores.pop(); // keep last 5

    updateScoreboard();

    game.classList.add('hidden');
    menu.classList.remove('hidden');
}


function updateScoreboard() {
    scoreboardDiv.classList.remove('hidden');
    scoreList.innerHTML = previousScores
        .map(s =>
            `<li>${s.time} – <span class="text-epflRed">${s.level}</span> (${s.timer}s): ${s.score} pts</li>`
        )
        .join('');
}

