// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const typeInput = document.getElementById('typeInput');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const timerDisplay = document.getElementById('timer');
const timerProgress = document.getElementById('timerProgress');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const correctDisplay = document.getElementById('correct');
const wrongDisplay = document.getElementById('wrong');
const timeSelect = document.getElementById('timeSelect');
const resultsCard = document.getElementById('resultsCard');
const closeResults = document.getElementById('closeResults');
const clearHistoryBtn = document.getElementById('clearHistory');

// Result elements
const resultWPM = document.getElementById('resultWPM');
const resultAccuracy = document.getElementById('resultAccuracy');
const resultRawWPM = document.getElementById('resultRawWPM');
const performanceMsg = document.getElementById('performanceMsg');

// Game Variables
let timer = null;
let timeLeft = 30;
let isTestRunning = false;
let currentQuote = '';
let currentQuoteWords = [];
let currentCharIndex = 0;
let totalChars = 0;
let correctChars = 0;
let wrongChars = 0;
let startTime = null;
let history = [];

// Quotes Database
const quotes = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet.",
    "Programming is the art of telling another human what one wants the computer to do. It requires logic and creativity.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep pushing forward!",
    "The only way to do great work is to love what you do. Stay hungry, stay foolish, and never stop learning.",
    "Technology is best when it brings people together. It should enhance human connection, not replace it.",
    "Simplicity is the soul of efficiency. Complex solutions often hide simple problems waiting to be discovered.",
    "The future belongs to those who believe in the beauty of their dreams. Dream big and work hard!",
    "Coding is not just about syntax, it's about solving problems and creating solutions that make a difference.",
    "Practice makes progress, not perfect. Every keystroke brings you one step closer to mastery.",
    "The best error message is the one that never shows up. Write clean, bug-free code whenever possible.",
    "Innovation distinguishes between a leader and a follower. Always strive to innovate and improve.",
    "Learning to code opens doors to endless possibilities. It's a superpower in the digital age.",
    "Patience and perseverance have a magical effect before which difficulties disappear and obstacles vanish.",
    "The function of good software is to make the complex appear simple. Always aim for user-friendly designs.",
    "Debugging is like being a detective in a crime movie where you are also the murderer. Stay curious!"
];

// Load history from localStorage
function loadHistory() {
    const savedHistory = localStorage.getItem('typingTestHistory');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        displayHistory();
    }
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('typingTestHistory', JSON.stringify(history));
    displayHistory();
}

// Display history
function displayHistory() {
    const historyList = document.getElementById('historyList');
    if (history.length === 0) {
        historyList.innerHTML = '<div class="text-center text-muted py-3"><i class="fas fa-info-circle me-2"></i>No tests taken yet</div>';
        return;
    }
    
    historyList.innerHTML = history.slice().reverse().map(test => `
        <div class="history-item">
            <div class="history-info">
                <strong>WPM: ${test.wpm}</strong> | 
                Accuracy: ${test.accuracy}% | 
                Time: ${test.time}s
            </div>
            <div class="history-date">
                ${new Date(test.date).toLocaleString()}
            </div>
        </div>
    `).join('');
}

// Clear history
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all test history?')) {
        history = [];
        saveHistory();
        displayHistory();
        showNotification('History cleared!', 'info');
    }
});

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Get random quote
function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// Format quote with spans
function formatQuote(quote, currentIndex) {
    return quote.split('').map((char, index) => {
        let className = '';
        if (index < currentIndex) {
            className = 'correct';
        } else if (index === currentIndex) {
            className = 'current';
        } else {
            className = '';
        }
        return `<span class="${className}">${char === ' ' ? '&nbsp;' : escapeHtml(char)}</span>`;
    }).join('');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update stats display
function updateStats() {
    wpmDisplay.textContent = Math.floor(calculateWPM());
    accuracyDisplay.textContent = Math.floor(calculateAccuracy());
    correctDisplay.textContent = correctChars;
    wrongDisplay.textContent = wrongChars;
}

// Calculate WPM
function calculateWPM() {
    if (!startTime || !isTestRunning) return 0;
    const minutesElapsed = (Date.now() - startTime) / 60000;
    const wordsTyped = correctChars / 5; // Standard: 5 chars = 1 word
    return minutesElapsed > 0 ? wordsTyped / minutesElapsed : 0;
}

// Calculate accuracy
function calculateAccuracy() {
    if (totalChars === 0) return 100;
    return (correctChars / totalChars) * 100;
}

// Update timer progress bar
function updateTimerProgress() {
    const totalTime = parseInt(timeSelect.value);
    const percentage = (timeLeft / totalTime) * 100;
    timerProgress.style.width = `${percentage}%`;
    
    // Change color based on time left
    if (percentage < 25) {
        timerProgress.classList.remove('bg-success', 'bg-warning');
        timerProgress.classList.add('bg-danger');
    } else if (percentage < 50) {
        timerProgress.classList.remove('bg-success', 'bg-danger');
        timerProgress.classList.add('bg-warning');
    } else {
        timerProgress.classList.remove('bg-warning', 'bg-danger');
        timerProgress.classList.add('bg-success');
    }
}

// Start timer
function startTimer() {
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        if (!isTestRunning) return;
        
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        updateTimerProgress();
        
        if (timeLeft <= 0) {
            endTest();
        }
    }, 1000);
}

// End test
function endTest() {
    isTestRunning = false;
    clearInterval(timer);
    typeInput.disabled = true;
    startBtn.disabled = false;
    resetBtn.disabled = false;
    
    const finalWPM = Math.floor(calculateWPM());
    const finalAccuracy = Math.floor(calculateAccuracy());
    const rawWPM = Math.floor((totalChars / 5) / (parseInt(timeSelect.value) / 60));
    
    // Show results
    resultWPM.textContent = finalWPM;
    resultAccuracy.textContent = `${finalAccuracy}%`;
    resultRawWPM.textContent = rawWPM;
    
    // Performance message
    let message = '';
    if (finalWPM >= 80) {
        message = '🏆 Excellent! You\'re a typing master! Keep up the great work!';
    } else if (finalWPM >= 60) {
        message = '🎉 Great job! You have above-average typing speed!';
    } else if (finalWPM >= 40) {
        message = '👍 Good effort! Practice more to improve your speed!';
    } else if (finalWPM >= 20) {
        message = '💪 Keep practicing! Speed comes with consistency!';
    } else {
        message = '🌟 Every expert was once a beginner. Keep typing!';
    }
    performanceMsg.innerHTML = `<i class="fas fa-comment-dots me-2"></i>${message}`;
    
    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Save to history
    history.push({
        wpm: finalWPM,
        accuracy: finalAccuracy,
        time: parseInt(timeSelect.value),
        date: new Date().toISOString()
    });
    saveHistory();
    
    showNotification(`Test completed! Your WPM: ${finalWPM}`, 'success');
}

// Reset test
function resetTest() {
    if (timer) clearInterval(timer);
    isTestRunning = false;
    currentCharIndex = 0;
    totalChars = 0;
    correctChars = 0;
    wrongChars = 0;
    startTime = null;
    
    timeLeft = parseInt(timeSelect.value);
    timerDisplay.textContent = timeLeft;
    updateTimerProgress();
    
    currentQuote = getRandomQuote();
    quoteDisplay.innerHTML = formatQuote(currentQuote, 0);
    
    typeInput.value = '';
    typeInput.disabled = true;
    startBtn.disabled = false;
    resetBtn.disabled = true;
    
    updateStats();
    resultsCard.style.display = 'none';
}

// Start test
function startTest() {
    if (isTestRunning) return;
    
    resetTest();
    currentQuote = getRandomQuote();
    quoteDisplay.innerHTML = formatQuote(currentQuote, 0);
    typeInput.disabled = false;
    typeInput.focus();
    startBtn.disabled = true;
    resetBtn.disabled = false;
    startTime = Date.now();
    isTestRunning = true;
    timeLeft = parseInt(timeSelect.value);
    timerDisplay.textContent = timeLeft;
    startTimer();
}

// Handle typing
function handleTyping(e) {
    if (!isTestRunning) return;
    
    const typedChar = e.data;
    const expectedChar = currentQuote[currentCharIndex];
    
    if (typedChar === null) {
        // Handle deletions
        if (currentCharIndex > 0) {
            currentCharIndex--;
            totalChars--;
            const lastChar = typeInput.value[currentCharIndex];
            if (lastChar === currentQuote[currentCharIndex]) {
                correctChars--;
            } else {
                wrongChars--;
            }
        }
    } else {
        // Handle new characters
        if (currentCharIndex < currentQuote.length) {
            totalChars++;
            
            if (typedChar === expectedChar) {
                correctChars++;
                updateStats();
                // Add success animation
                const spans = document.querySelectorAll('#quoteDisplay span');
                if (spans[currentCharIndex]) {
                    spans[currentCharIndex].classList.add('success-pulse');
                    setTimeout(() => {
                        spans[currentCharIndex].classList.remove('success-pulse');
                    }, 200);
                }
            } else {
                wrongChars++;
                updateStats();
                // Add error animation
                const spans = document.querySelectorAll('#quoteDisplay span');
                if (spans[currentCharIndex]) {
                    spans[currentCharIndex].classList.add('error-shake');
                    setTimeout(() => {
                        spans[currentCharIndex].classList.remove('error-shake');
                    }, 200);
                }
            }
            currentCharIndex++;
        }
    }
    
    // Update display
    quoteDisplay.innerHTML = formatQuote(currentQuote, currentCharIndex);
    updateStats();
    
    // Check if quote is complete
    if (currentCharIndex >= currentQuote.length) {
        // Auto-load new quote
        setTimeout(() => {
            if (isTestRunning) {
                currentQuote = getRandomQuote();
                currentCharIndex = 0;
                quoteDisplay.innerHTML = formatQuote(currentQuote, 0);
                typeInput.value = '';
                showNotification('New quote loaded! Keep typing!', 'info');
            }
        }, 500);
    }
}

// Update timer when time selector changes
timeSelect.addEventListener('change', () => {
    if (!isTestRunning) {
        timeLeft = parseInt(timeSelect.value);
        timerDisplay.textContent = timeLeft;
        updateTimerProgress();
    }
});

// Close results
closeResults.addEventListener('click', () => {
    resultsCard.style.display = 'none';
});

// Event Listeners
startBtn.addEventListener('click', startTest);
resetBtn.addEventListener('click', resetTest);
typeInput.addEventListener('input', handleTyping);

// Initialize
function init() {
    loadHistory();
    resetTest();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            resetTest();
        }
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (!isTestRunning) startTest();
        }
    });
    
   