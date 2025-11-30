// Knowledge Arrow - Pixel Art Edition
// Game Variables
let canvas, ctx;
let gameState = 'start'; // start, playing, paused, gameover, leaderboard
let score = 0;
let combo = 1;
let bestCombo = 1;
let correctAnswers = 0;
let totalQuestions = 0;
let currentQuestion = null;
let questions = [];
let currentQuestionIndex = 0;
let canShoot = true; // Controls if player can shoot
let isPaused = false;

// =====================================================
// 🔊 SOUND SYSTEM - 8-bit Retro Sounds (Web Audio API)
// =====================================================
let audioContext = null;
let soundEnabled = true;
let musicEnabled = true;
let masterVolume = 0.5;
let bgMusicOscillator = null;
let bgMusicGain = null;

// Initialize Audio Context (must be called after user interaction)
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Play a retro 8-bit beep sound
function playTone(frequency, duration, type = 'square', volume = 0.3) {
    if (!soundEnabled || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume * masterVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.log('Audio error:', e);
    }
}

// 🏹 Arrow Shoot Sound - Quick whoosh
function playSoundShoot() {
    if (!soundEnabled || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.2 * masterVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {}
}

// ✅ Correct Answer Sound - Happy ascending melody
function playSoundCorrect() {
    if (!soundEnabled || !audioContext) return;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.15, 'square', 0.25), i * 80);
    });
}

// ❌ Wrong Answer Sound - Sad descending buzzer
function playSoundWrong() {
    if (!soundEnabled || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.25 * masterVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {}
}

// 🎯 Target Hit Sound - Impact thud
function playSoundHit() {
    if (!soundEnabled || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.4 * masterVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {}
}

// 🔥 Combo Sound - Exciting rising tone
function playSoundCombo(comboLevel) {
    if (!soundEnabled || !audioContext) return;
    
    const baseFreq = 400 + (comboLevel * 50);
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.1, 'square', 0.2), i * 50);
    });
}

// ⏰ Timer Warning Sound - Urgent beeps
function playSoundTimerWarning() {
    if (!soundEnabled || !audioContext) return;
    playTone(880, 0.1, 'square', 0.15);
}

// 🎮 Game Start Sound - Fanfare
function playSoundGameStart() {
    if (!soundEnabled || !audioContext) return;
    
    const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, 'square', 0.25), i * 120);
    });
}

// 🏆 Game Over Sound - Dramatic ending
function playSoundGameOver() {
    if (!soundEnabled || !audioContext) return;
    
    const notes = [523.25, 392, 329.63, 261.63]; // C5, G4, E4, C4 (descending)
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.3, 'triangle', 0.3), i * 200);
    });
}

// 🎉 Victory Sound - Triumphant melody
function playSoundVictory() {
    if (!soundEnabled || !audioContext) return;
    
    const melody = [
        { freq: 523.25, dur: 0.15 }, // C5
        { freq: 523.25, dur: 0.15 }, // C5
        { freq: 523.25, dur: 0.15 }, // C5
        { freq: 523.25, dur: 0.4 },  // C5 (held)
        { freq: 415.30, dur: 0.15 }, // Ab4
        { freq: 466.16, dur: 0.15 }, // Bb4
        { freq: 523.25, dur: 0.4 },  // C5
        { freq: 466.16, dur: 0.15 }, // Bb4
        { freq: 523.25, dur: 0.5 }   // C5 (final)
    ];
    
    let time = 0;
    melody.forEach(note => {
        setTimeout(() => playTone(note.freq, note.dur, 'square', 0.25), time);
        time += note.dur * 600;
    });
}

// 🔘 Button Click Sound
function playSoundClick() {
    if (!soundEnabled || !audioContext) return;
    playTone(600, 0.05, 'square', 0.15);
}

// ⏸️ Pause Sound
function playSoundPause() {
    if (!soundEnabled || !audioContext) return;
    playTone(400, 0.1, 'triangle', 0.2);
    setTimeout(() => playTone(300, 0.15, 'triangle', 0.15), 100);
}

// ▶️ Resume Sound
function playSoundResume() {
    if (!soundEnabled || !audioContext) return;
    playTone(300, 0.1, 'triangle', 0.2);
    setTimeout(() => playTone(400, 0.15, 'triangle', 0.15), 100);
}

// 🎵 Background Music - African Festival Style (8-bit original)
// Inspired by festive African rhythms - upbeat, percussive, celebratory!
let musicInterval = null;

function startBackgroundMusic() {
    if (!musicEnabled || !audioContext) return;
    stopBackgroundMusic(); // Stop any existing music
    musicEnabled = true;
    
    try {
        bgMusicGain = audioContext.createGain();
        bgMusicGain.connect(audioContext.destination);
        bgMusicGain.gain.setValueAtTime(0.12 * masterVolume, audioContext.currentTime);
        
        // Play a melodic note with envelope
        const playMelody = (freq, startTime, duration, type = 'square', vol = 0.25) => {
            const osc = audioContext.createOscillator();
            const noteGain = audioContext.createGain();
            
            osc.connect(noteGain);
            noteGain.connect(bgMusicGain);
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            
            noteGain.gain.setValueAtTime(vol, startTime);
            noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        // African percussion - djembe-like hits
        const playDrum = (startTime, isAccent = false) => {
            const osc = audioContext.createOscillator();
            const drumGain = audioContext.createGain();
            
            osc.connect(drumGain);
            drumGain.connect(bgMusicGain);
            
            osc.type = 'triangle';
            const baseFreq = isAccent ? 120 : 80;
            osc.frequency.setValueAtTime(baseFreq, startTime);
            osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);
            
            const vol = isAccent ? 0.5 : 0.35;
            drumGain.gain.setValueAtTime(vol, startTime);
            drumGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
            
            osc.start(startTime);
            osc.stop(startTime + 0.15);
        };
        
        // High percussion - shaker/hi-hat style
        const playShaker = (startTime) => {
            const bufferSize = audioContext.sampleRate * 0.05;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.3;
            }
            
            const noise = audioContext.createBufferSource();
            const noiseGain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            noise.buffer = buffer;
            filter.type = 'highpass';
            filter.frequency.value = 5000;
            
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(bgMusicGain);
            
            noiseGain.gain.setValueAtTime(0.15, startTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
            
            noise.start(startTime);
            noise.stop(startTime + 0.05);
        };
        
        // ============================================
        // 🌍 AFRICAN FESTIVAL MELODY - Original 8-bit
        // Key: A minor / C major feel - uplifting & festive
        // ============================================
        
        // Main melody notes (frequencies)
        const A4 = 440.00, B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25;
        const F5 = 698.46, G5 = 783.99, A5 = 880.00;
        const G4 = 392.00, E4 = 329.63, C4 = 261.63, D4 = 293.66;
        
        // Festive African-style melody pattern (original composition)
        // Energetic, call-and-response feel, ascending triumphant phrases
        const melodyPattern = [
            // Bar 1 - Uplifting call (Tsamina mina feel - rising energy)
            { note: E4, time: 0.00, dur: 0.15 },
            { note: G4, time: 0.15, dur: 0.15 },
            { note: A4, time: 0.30, dur: 0.20 },
            { note: A4, time: 0.55, dur: 0.10 },
            { note: G4, time: 0.70, dur: 0.15 },
            { note: A4, time: 0.85, dur: 0.25 },
            
            // Bar 2 - Response (celebratory answer)
            { note: C5, time: 1.15, dur: 0.15 },
            { note: C5, time: 1.30, dur: 0.10 },
            { note: B4, time: 0.45, dur: 0.15 },
            { note: A4, time: 1.55, dur: 0.20 },
            { note: G4, time: 1.80, dur: 0.30 },
            
            // Bar 3 - Building energy (this time for Africa feel)
            { note: A4, time: 2.20, dur: 0.12 },
            { note: A4, time: 2.35, dur: 0.12 },
            { note: C5, time: 2.50, dur: 0.15 },
            { note: D5, time: 2.70, dur: 0.15 },
            { note: E5, time: 2.90, dur: 0.25 },
            
            // Bar 4 - Triumphant resolution
            { note: D5, time: 3.20, dur: 0.15 },
            { note: C5, time: 3.40, dur: 0.15 },
            { note: A4, time: 3.60, dur: 0.30 },
            { note: G4, time: 3.95, dur: 0.20 },
            
            // Bar 5 - Repeat call with variation
            { note: E4, time: 4.20, dur: 0.12 },
            { note: E4, time: 4.35, dur: 0.12 },
            { note: G4, time: 4.50, dur: 0.15 },
            { note: A4, time: 4.70, dur: 0.25 },
            { note: C5, time: 5.00, dur: 0.15 },
            { note: A4, time: 5.20, dur: 0.20 },
            
            // Bar 6 - Energetic response
            { note: G4, time: 5.45, dur: 0.10 },
            { note: A4, time: 5.60, dur: 0.10 },
            { note: C5, time: 5.75, dur: 0.20 },
            { note: D5, time: 6.00, dur: 0.30 },
            
            // Bar 7 - Peak celebration
            { note: E5, time: 6.35, dur: 0.15 },
            { note: E5, time: 6.55, dur: 0.15 },
            { note: D5, time: 6.75, dur: 0.15 },
            { note: C5, time: 6.95, dur: 0.20 },
            
            // Bar 8 - Resolve to home
            { note: A4, time: 7.20, dur: 0.20 },
            { note: G4, time: 7.45, dur: 0.15 },
            { note: A4, time: 7.65, dur: 0.35 }
        ];
        
        // African drum pattern - syncopated, driving rhythm
        const drumPattern = [
            // Strong beats with syncopation (djembe-style)
            { time: 0.00, accent: true },
            { time: 0.25, accent: false },
            { time: 0.40, accent: false },
            { time: 0.55, accent: true },
            { time: 0.85, accent: false },
            
            { time: 1.00, accent: true },
            { time: 1.25, accent: false },
            { time: 1.55, accent: true },
            { time: 1.70, accent: false },
            { time: 1.85, accent: false },
            
            { time: 2.00, accent: true },
            { time: 2.30, accent: false },
            { time: 2.55, accent: true },
            { time: 2.70, accent: false },
            { time: 2.85, accent: false },
            
            { time: 3.00, accent: true },
            { time: 3.25, accent: false },
            { time: 3.55, accent: true },
            { time: 3.85, accent: false },
            
            { time: 4.00, accent: true },
            { time: 4.25, accent: false },
            { time: 4.40, accent: false },
            { time: 4.55, accent: true },
            { time: 4.85, accent: false },
            
            { time: 5.00, accent: true },
            { time: 5.30, accent: false },
            { time: 5.55, accent: true },
            { time: 5.70, accent: false },
            { time: 5.85, accent: false },
            
            { time: 6.00, accent: true },
            { time: 6.25, accent: false },
            { time: 6.55, accent: true },
            { time: 6.85, accent: false },
            
            { time: 7.00, accent: true },
            { time: 7.30, accent: false },
            { time: 7.55, accent: true },
            { time: 7.85, accent: false }
        ];
        
        // Shaker pattern - constant 8th notes for energy
        const shakerTimes = [];
        for (let t = 0; t < 8; t += 0.2) {
            shakerTimes.push(t);
        }
        
        const patternLength = 8.0; // 8 seconds per loop
        
        const playFullPattern = () => {
            if (!musicEnabled || gameState !== 'playing') return;
            
            const now = audioContext.currentTime;
            
            // Play melody
            melodyPattern.forEach(m => {
                playMelody(m.note, now + m.time, m.dur, 'square', 0.22);
            });
            
            // Play bass line (lower octave accents)
            [0, 1, 2, 3, 4, 5, 6, 7].forEach(bar => {
                playMelody(110, now + bar, 0.2, 'triangle', 0.3); // A2 bass
                playMelody(130.81, now + bar + 0.5, 0.15, 'triangle', 0.25); // C3
            });
            
            // Play drums
            drumPattern.forEach(d => {
                playDrum(now + d.time, d.accent);
            });
            
            // Play shaker
            shakerTimes.forEach(t => {
                playShaker(now + t);
            });
            
            // Schedule next loop
            musicInterval = setTimeout(playFullPattern, patternLength * 1000);
        };
        
        playFullPattern();
        
    } catch (e) {
        console.log('Music error:', e);
    }
}

function stopBackgroundMusic() {
    musicEnabled = false;
    if (musicInterval) {
        clearTimeout(musicInterval);
        musicInterval = null;
    }
    if (bgMusicGain) {
        try {
            bgMusicGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        } catch (e) {}
    }
}

// Toggle sound effects
function toggleSound() {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        initAudioContext();
        playSoundClick();
    }
    updateSoundButton();
    return soundEnabled;
}

// Toggle background music
function toggleMusic() {
    musicEnabled = !musicEnabled;
    if (musicEnabled && gameState === 'playing') {
        startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
    updateMusicButton();
    return musicEnabled;
}

// Update UI buttons for sound controls
function updateSoundButton() {
    const btn = document.getElementById('soundToggle');
    if (btn) {
        btn.textContent = soundEnabled ? '🔊' : '🔇';
        btn.title = soundEnabled ? 'Silenciar efectos' : 'Activar efectos';
    }
}

function updateMusicButton() {
    const btn = document.getElementById('musicToggle');
    if (btn) {
        btn.textContent = musicEnabled ? '🎵' : '🎵❌';
        btn.title = musicEnabled ? 'Silenciar música' : 'Activar música';
    }
}

// =====================================================
// END SOUND SYSTEM
// =====================================================

// Game settings
let classSubject = 'General';
let difficulty = 'medium';
let timeLimit = 15;
let timeLeft = timeLimit;
let timerInterval = null;

// Game objects
let targets = []; // Tablas de puntería
let arrows = [];
let particles = [];

// Character system
let currentCharacter = 0;
const characters = [
    { name: 'Archer Girl', color: '#FF6B6B', loaded: false, img: null },
    { name: 'Blue Boy', color: '#4ECDC4', loaded: false, img: null },
    { name: 'Smart Girl', color: '#A67C52', loaded: false, img: null },
    { name: 'Red Boy', color: '#FF4757', loaded: false, img: null }
];

// Pixel art colors for targets - vibrant and attractive
const targetColors = [
    { rings: ['#E74C3C', '#EC7063', '#F1948A'], letter: 'A' }, // Red/Pink
    { rings: ['#3498DB', '#5DADE2', '#85C1E9'], letter: 'B' }, // Blue
    { rings: ['#F39C12', '#F8C471', '#FAD7A0'], letter: 'C' }, // Orange/Yellow
    { rings: ['#2ECC71', '#58D68D', '#82E0AA'], letter: 'D' }  // Green
];

// Archer position
const archer = {
    x: 0,
    y: 0,
    width: 60,
    height: 80,
    offsetY: 0,
    animFrame: 0,
    aimAngle: 0,
    aimX: 0,
    aimY: 0,
    shootingAnim: 0,
    isShooting: false
};

// Mouse tracking
let mouseX = 0;
let mouseY = 0;

// Static background trees (generated once)
let backgroundTreesCache = null;
let groundElementsCache = null;

// Load character images as pixel art data URLs
function loadCharacterImages() {
    // Using simple colored blocks as placeholders
    // In production, you'd load actual pixel art sprites
    characters.forEach((char, idx) => {
        const img = new Image();
        img.onload = () => {
            characters[idx].loaded = true;
            characters[idx].img = img;
        };
        // Placeholder - will draw programmatically
        characters[idx].loaded = true;
    });
}

// Initialize game
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    classSubject = urlParams.get('subject') || 'General';
    difficulty = urlParams.get('difficulty') || 'medium';
    
    timeLimit = difficulty === 'easy' ? 20 : difficulty === 'hard' ? 10 : 15;
    
    // Update UI
    document.getElementById('subjectTag').textContent = classSubject;
    document.getElementById('startSubject').textContent = classSubject;
    document.getElementById('startDifficulty').textContent = 
        difficulty === 'easy' ? 'Fácil ⭐' : 
        difficulty === 'hard' ? 'Difícil ⭐⭐⭐' : 'Media ⭐⭐';
    document.getElementById('filterSubject').textContent = classSubject;
    
    // Setup canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // Pixel perfect rendering
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Load characters
    loadCharacterImages();
    
    // Generate questions
    generateQuestions();
    
    // Canvas click handler
    canvas.addEventListener('click', shootArrow);
    
    // Mouse move handler for aiming
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        
        // Calculate aim angle
        const centerX = archer.x + archer.width / 2;
        const centerY = archer.y + 48;
        archer.aimAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
        archer.aimX = mouseX;
        archer.aimY = mouseY;
    });
    
    // Touch support for mobile devices
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Character selection and pause control
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '4') {
            currentCharacter = parseInt(e.key) - 1;
        }
        // ESC or P key to pause
        if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && (gameState === 'playing' || isPaused)) {
            togglePause();
        }
    });
});

function handleTouch(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
        
        // Calculate aim angle
        const centerX = archer.x + archer.width / 2;
        const centerY = archer.y + 48;
        archer.aimAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
        archer.aimX = mouseX;
        archer.aimY = mouseY;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    // Shoot arrow on touch end
    shootArrow(e);
}

function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const maxWidth = window.innerWidth <= 480 ? wrapper.clientWidth - 10 : 
                     window.innerWidth <= 768 ? wrapper.clientWidth - 20 : 
                     900;
    canvas.width = Math.min(maxWidth, wrapper.clientWidth - 20);
    
    // Adjust height based on screen size
    if (window.innerWidth <= 480) {
        canvas.height = Math.min(350, window.innerHeight * 0.4);
    } else if (window.innerWidth <= 768) {
        canvas.height = Math.min(400, window.innerHeight * 0.45);
    } else {
        canvas.height = 500;
    }
    
    // Responsive archer size
    const isSmallMobile = window.innerWidth <= 480;
    const isMobile = window.innerWidth <= 768;
    
    if (isSmallMobile) {
        archer.width = 45;
        archer.height = 60;
    } else if (isMobile) {
        archer.width = 52;
        archer.height = 70;
    } else {
        archer.width = 60;
        archer.height = 80;
    }
    
    // Position archer at bottom center
    archer.x = canvas.width * 0.5 - archer.width / 2; // Horizontally centered
    const bottomMargin = isSmallMobile ? 15 : isMobile ? 20 : 30;
    archer.y = canvas.height - archer.height - bottomMargin; // Bottom with margin
    
    // Clear caches when resizing
    backgroundTreesCache = null;
    groundElementsCache = null;
}

function selectCharacter(index) {
    // Ignore locked characters
    if (index > 2) return;
    
    // Play click sound
    initAudioContext();
    playSoundClick();
    
    // Update selected character
    currentCharacter = index;
    
    // Update active state in UI
    const cards = document.querySelectorAll('.character-card');
    cards.forEach((card, i) => {
        if (i === index) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

function startGame() {
    // Initialize audio and play start sound
    initAudioContext();
    playSoundGameStart();
    
    document.getElementById('startScreen').style.display = 'none';
    gameState = 'playing';
    isPaused = false;
    score = 0;
    combo = 1;
    bestCombo = 1;
    correctAnswers = 0;
    totalQuestions = 0;
    currentQuestionIndex = 0;
    canShoot = true; // Enable shooting at start
    targets = [];
    arrows = [];
    particles = [];
    
    // Enable music for gameplay
    musicEnabled = true;
    
    updateScore();
    loadNextQuestion();
    gameLoop();
}

function togglePause() {
    if (gameState !== 'playing' && !isPaused) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        // Play pause sound
        playSoundPause();
        
        // Pause the game
        clearInterval(timerInterval);
        stopBackgroundMusic();
        
        // Update pause screen stats
        document.getElementById('pauseScore').textContent = score;
        document.getElementById('pauseCombo').textContent = 'x' + combo;
        document.getElementById('pauseQuestion').textContent = currentQuestionIndex + '/' + questions.length;
        
        document.getElementById('pauseOverlay').classList.add('active');
    } else {
        // Play resume sound
        playSoundResume();
        
        // Resume the game
        musicEnabled = true;
        startTimer();
        document.getElementById('pauseOverlay').classList.remove('active');
        gameLoop();
    }
}

function restartGame() {
    // Reset pause state first
    isPaused = false;
    
    // Reset game state
    gameState = 'start';
    clearInterval(timerInterval);
    
    // Hide pause overlay - force hide
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.classList.remove('active');
        pauseOverlay.style.display = 'none';
    }
    
    // Show start screen
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        startScreen.style.display = 'flex';
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    if (gameState !== 'playing' || isPaused) return;
    
    // Draw forest background (includes ground)
    drawForestBackground();
    
    // Update and draw targets
    updateTargets();
    
    // Update and draw arrows
    updateArrows();
    
    // Update and draw particles
    updateParticles();
    
    // Draw character last (on top)
    drawCharacter();
    
    requestAnimationFrame(gameLoop);
}

function drawForestBackground() {
    // Dark atmospheric forest background with layers
    
    // Sky - gradient from light to darker teal/green
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.8);
    skyGradient.addColorStop(0, '#7FA99B');    // Light teal at top
    skyGradient.addColorStop(0.5, '#5C8D7F'); // Medium teal
    skyGradient.addColorStop(1, '#3D5C52');    // Darker teal/green
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Generate tree positions once and cache them
    if (!backgroundTreesCache) {
        backgroundTreesCache = generateTreePositions();
    }
    
    // Draw cached trees
    drawCachedTrees(backgroundTreesCache);
    
    // Ground with depth
    drawLayeredGround();
}

function generateTreePositions() {
    const layers = [
        { startYPercent: 0.7, darkColor: '#1A3A30', lightColor: '#1F4538', density: 0.08 },
        { startYPercent: 0.78, darkColor: '#2D5046', lightColor: '#35604E', density: 0.12 },
        { startYPercent: 0.85, darkColor: '#3D6B5C', lightColor: '#487863', density: 0.15 }
    ];
    
    const treeData = [];
    
    layers.forEach(layer => {
        const startY = canvas.height * layer.startYPercent;
        const numTrees = Math.floor(canvas.width * layer.density);
        
        for (let i = 0; i < numTrees; i++) {
            const x = (canvas.width / numTrees) * i + (Math.random() * 50 - 25);
            const treeHeight = 150 + Math.random() * 100;
            const trunkWidth = 20 + Math.random() * 15;
            const hasVine = Math.random() > 0.7;
            const vineData = hasVine ? {
                x: x + (Math.random() - 0.5) * (trunkWidth * 2),
                length: 20 + Math.random() * 40,
                y: startY - treeHeight * 0.5
            } : null;
            
            const foliageBlobs = [];
            const foliageY = startY - treeHeight * 0.5;
            const foliageWidth = trunkWidth * 2 + Math.random() * 30;
            
            for (let j = 0; j < 5; j++) {
                foliageBlobs.push({
                    x: x + (Math.random() - 0.5) * foliageWidth,
                    y: foliageY - Math.random() * treeHeight * 0.3,
                    size: 20 + Math.random() * 30,
                    rotation: Math.random() * Math.PI
                });
            }
            
            treeData.push({
                x, startY, treeHeight, trunkWidth,
                darkColor: layer.darkColor,
                lightColor: layer.lightColor,
                foliageBlobs,
                vineData
            });
        }
    });
    
    return treeData;
}

function drawCachedTrees(treeData) {
    treeData.forEach(tree => {
        // Tree trunk (irregular)
        ctx.fillStyle = tree.darkColor;
        ctx.beginPath();
        ctx.moveTo(tree.x - tree.trunkWidth / 2, tree.startY);
        ctx.lineTo(tree.x - tree.trunkWidth / 3, tree.startY - tree.treeHeight * 0.7);
        ctx.lineTo(tree.x + tree.trunkWidth / 3, tree.startY - tree.treeHeight * 0.6);
        ctx.lineTo(tree.x + tree.trunkWidth / 2, tree.startY);
        ctx.fill();
        
        // Tree foliage (organic shapes)
        ctx.fillStyle = tree.lightColor;
        tree.foliageBlobs.forEach(blob => {
            ctx.beginPath();
            ctx.ellipse(blob.x, blob.y, blob.size, blob.size * 0.8, blob.rotation, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Vines
        if (tree.vineData) {
            ctx.fillStyle = tree.darkColor;
            ctx.fillRect(tree.vineData.x, tree.vineData.y, 3, tree.vineData.length);
            // Drip at end
            ctx.beginPath();
            ctx.ellipse(tree.vineData.x + 1.5, tree.vineData.y + tree.vineData.length, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawLayeredGround() {
    const groundY = canvas.height * 0.85; // Ground at 85% height
    
    // Sky to ground transition gradient
    const transitionGradient = ctx.createLinearGradient(0, groundY - 30, 0, groundY);
    transitionGradient.addColorStop(0, '#3D5C5200');
    transitionGradient.addColorStop(1, '#2A4A3B');
    ctx.fillStyle = transitionGradient;
    ctx.fillRect(0, groundY - 30, canvas.width, 30);
    
    // Main ground with richer gradient
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGradient.addColorStop(0, '#2A4A3B');   // Rich dark green
    groundGradient.addColorStop(0.4, '#1F3828'); // Darker forest green
    groundGradient.addColorStop(1, '#15261A');   // Almost black green
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    // Generate ground elements once and cache
    if (!groundElementsCache) {
        groundElementsCache = generateGroundElements(groundY);
    }
    
    // Draw cached ground elements
    drawCachedGroundElements(groundElementsCache, groundY);
    
    // Ground shadow near character position (adds depth)
    const shadowGradient = ctx.createRadialGradient(
        canvas.width / 2, groundY + 10, 
        20, 
        canvas.width / 2, groundY + 10, 
        80
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(canvas.width / 2 - 80, groundY, 160, 30);
}

function generateGroundElements(groundY) {
    const elements = {
        grassLayer1: [],
        grassLayer2: [],
        grassTips: [],
        flowers: [],
        bushes: []
    };
    
    // Generate grass layer 1 (back layer, darker)
    for (let x = 0; x < canvas.width; x += 8) {
        const height = 6 + Math.sin(x * 0.1) * 2;
        elements.grassLayer1.push({ x, height });
    }
    
    // Generate grass layer 2 (front layer, lighter)
    for (let x = 3; x < canvas.width; x += 7) {
        const height = 8 + Math.sin(x * 0.15) * 3;
        elements.grassLayer2.push({ x, height });
    }
    
    // Generate bright grass tips
    for (let x = 5; x < canvas.width; x += 12) {
        const height = 10 + Math.sin(x * 0.2) * 2;
        elements.grassTips.push({ x, height });
    }
    
    // Generate flowers
    const flowerColors = ['#FFD93D', '#FF6B9D', '#A8E6CF', '#FFFFFF'];
    for (let x = 20; x < canvas.width; x += 40) {
        if (Math.random() > 0.6) {
            const flowerX = x + Math.random() * 20 - 10;
            const flowerY = groundY - 5 - Math.random() * 8;
            const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            elements.flowers.push({ x: flowerX, y: flowerY, color });
        }
    }
    
    // Generate bushes
    for (let x = 0; x < canvas.width; x += 35) {
        if (Math.random() > 0.4) {
            const bushX = x + Math.random() * 15;
            const bushWidth = 20 + Math.random() * 25;
            const bushHeight = 12 + Math.random() * 8;
            elements.bushes.push({ x: bushX, width: bushWidth, height: bushHeight });
        }
    }
    
    return elements;
}

function drawCachedGroundElements(elements, groundY) {
    // Draw grass layer 1 (back layer, darker)
    ctx.fillStyle = '#3D6B5C';
    elements.grassLayer1.forEach(grass => {
        const y = groundY - grass.height;
        ctx.beginPath();
        ctx.moveTo(grass.x, groundY);
        ctx.quadraticCurveTo(grass.x + 2, y - 2, grass.x + 3, y);
        ctx.quadraticCurveTo(grass.x + 4, y - 2, grass.x + 6, groundY);
        ctx.fill();
    });
    
    // Draw grass layer 2 (front layer, lighter)
    ctx.fillStyle = '#4A7865';
    elements.grassLayer2.forEach(grass => {
        const y = groundY - grass.height;
        ctx.beginPath();
        ctx.moveTo(grass.x, groundY);
        ctx.quadraticCurveTo(grass.x + 1.5, y - 3, grass.x + 2, y);
        ctx.quadraticCurveTo(grass.x + 2.5, y - 2, grass.x + 4, groundY);
        ctx.fill();
    });
    
    // Draw bright grass tips
    ctx.fillStyle = '#5C9A7F';
    elements.grassTips.forEach(grass => {
        const y = groundY - grass.height;
        ctx.fillRect(grass.x, y, 2, 4);
    });
    
    // Draw flowers
    elements.flowers.forEach(flower => {
        ctx.fillStyle = flower.color;
        // Small flower petals
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const px = flower.x + Math.cos(angle) * 2;
            const py = flower.y + Math.sin(angle) * 2;
            ctx.fillRect(px, py, 2, 2);
        }
        // Center
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(flower.x, flower.y, 2, 2);
    });
    
    // Draw bushes
    ctx.fillStyle = '#2D5046';
    elements.bushes.forEach(bush => {
        // Bush body
        ctx.beginPath();
        ctx.ellipse(bush.x, groundY + 5, bush.width / 2, bush.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight on bush
        ctx.fillStyle = '#3D6B5C';
        ctx.beginPath();
        ctx.ellipse(bush.x - bush.width / 6, groundY + 2, bush.width / 4, bush.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2D5046';
    });
}

function drawPixelCircle(cx, cy, radius) {
    // Draw circle pixel by pixel for retro look
    const pixelSize = 4;
    for (let x = -radius; x <= radius; x += pixelSize) {
        for (let y = -radius; y <= radius; y += pixelSize) {
            if (x * x + y * y <= radius * radius) {
                ctx.fillRect(cx + x, cy + y, pixelSize, pixelSize);
            }
        }
    }
}

function loadNextQuestion() {
    if (currentQuestionIndex >= questions.length) {
        endGame();
        return;
    }
    
    currentQuestion = questions[currentQuestionIndex];
    currentQuestionIndex++;
    totalQuestions++;
    
    // Re-enable shooting for new question
    canShoot = true;
    
    // Update question display
    document.getElementById('questionText').textContent = currentQuestion.question;
    
    // Reset timer
    timeLeft = timeLimit;
    startTimer();
    
    // Create targets
    createTargets();
}

function createTargets() {
    targets = [];
    const options = currentQuestion.options;
    const numTargets = options.length;
    
    // Responsive sizing
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    // Better horizontal distribution with more spacing
    const margin = isSmallMobile ? 30 : isMobile ? 50 : 80; // Side margins
    const availableWidth = canvas.width - (margin * 2);
    const targetSpacing = availableWidth / (numTargets - 1);
    
    // Targets in upper area for better shooting angle
    const targetY = canvas.height * 0.25; // Upper quarter of screen
    const verticalVariation = isSmallMobile ? 20 : isMobile ? 30 : 40; // Slight vertical variation for visual interest
    
    // Responsive target size
    const targetSize = isSmallMobile ? 60 : isMobile ? 75 : 90;
    
    options.forEach((option, index) => {
        // Distribute evenly across the width
        const xPos = margin + (targetSpacing * index);
        
        // Add slight wave pattern to vertical positions
        const waveOffset = Math.sin((index / (numTargets - 1)) * Math.PI) * verticalVariation;
        const yPos = targetY + waveOffset;
        
        targets.push({
            x: xPos,
            y: -100, // Start above screen for animation
            targetY: yPos,
            width: targetSize, // Responsive size
            height: targetSize,
            option: option,
            optionIndex: index,
            color: targetColors[index],
            wobble: 0,
            wobbleSpeed: 0.02,
            hit: false,
            scale: 0.3, // Start small
            animationProgress: 0, // For entrance animation
            animationDelay: index * 0.12 // Stagger the entrance
        });
    });
}

function updateTargets() {
    targets.forEach(target => {
        if (!target.hit) {
            // Entrance animation
            if (target.animationProgress < 1) {
                target.animationProgress += 0.05 - target.animationDelay * 0.02;
                if (target.animationProgress > 0) {
                    // Ease out animation
                    const progress = Math.min(target.animationProgress, 1);
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    
                    // Animate position (drop down with bounce)
                    const bounce = progress > 0.8 ? Math.sin((progress - 0.8) * Math.PI * 5) * 10 * (1 - progress) : 0;
                    target.y = -100 + (target.targetY + 100) * easeProgress + bounce;
                    
                    // Animate scale (grow and slight bounce)
                    target.scale = 0.3 + 0.7 * easeProgress + (progress > 0.7 ? Math.sin((progress - 0.7) * Math.PI * 3) * 0.1 : 0);
                }
            } else {
                // Normal wobble animation after entrance
                target.wobble += target.wobbleSpeed;
                target.y = target.targetY + Math.sin(target.wobble) * 3;
                target.scale = 1;
            }
        } else {
            // Hit animation (shrink)
            target.scale *= 0.95;
        }
        
        drawTarget(target);
    });
    
    // Remove fully scaled down targets
    targets = targets.filter(t => t.scale > 0.1);
}

function drawTarget(target) {
    ctx.save();
    
    // Translate to target center
    const centerX = target.x;
    const centerY = target.y;
    
    ctx.translate(centerX, centerY);
    ctx.scale(target.scale, target.scale);
    ctx.translate(-centerX, -centerY);
    
    const size = target.width;
    const radius = size / 2;
    
    // Outer glow effect
    if (!target.hit) {
        const glowGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.3);
        glowGradient.addColorStop(0, target.color.rings[0] + '00');
        glowGradient.addColorStop(0.5, target.color.rings[0] + '40');
        glowGradient.addColorStop(1, target.color.rings[0] + '00');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Wooden frame/border
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#5C2E0A';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Wood grain texture (simple lines)
    ctx.strokeStyle = '#5C2E0A';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i;
        const x1 = centerX + Math.cos(angle) * (radius + 4);
        const y1 = centerY + Math.sin(angle) * (radius + 4);
        const x2 = centerX + Math.cos(angle) * (radius + 12);
        const y2 = centerY + Math.sin(angle) * (radius + 12);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // Target rings with 3D effect
    const rings = 5;
    for (let i = rings - 1; i >= 0; i--) {
        const ringRadius = radius * ((i + 1) / rings);
        
        // Shadow/3D effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY + 2, ringRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Main ring color
        ctx.fillStyle = i === rings - 1 ? target.color.rings[0] :
                        i === rings - 2 ? '#FFFFFF' :
                        i === rings - 3 ? target.color.rings[1] :
                        i === rings - 4 ? '#FFFFFF' :
                        target.color.rings[2];
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ring outline for definition
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Center bullseye with shine effect
    const bullseyeRadius = radius * 0.25;
    
    // Bullseye shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY + 2, bullseyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Bullseye
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.beginPath();
    ctx.arc(centerX, centerY, bullseyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Bullseye shine
    const shineGradient = ctx.createRadialGradient(
        centerX - bullseyeRadius * 0.3, 
        centerY - bullseyeRadius * 0.3, 
        0, 
        centerX, 
        centerY, 
        bullseyeRadius
    );
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    shineGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shineGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, bullseyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw letter badge on center
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    ctx.fillStyle = '#2C3E50';
    const letterFontSize = isSmallMobile ? 14 : isMobile ? 16 : 20;
    ctx.font = `bold ${letterFontSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.fillText(target.color.letter, centerX, centerY);
    ctx.shadowBlur = 0;
    
    // Draw option text in rounded box below target
    ctx.restore();
    ctx.save();
    
    const textY = centerY + (radius + 32) * target.scale;
    const textBoxWidth = size * 1.8; // Increased from 1.2 to 1.8
    const textBoxX = centerX - textBoxWidth / 2;
    
    // Text background box with rounded corners (taller to fit 2 lines if needed)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeStyle = target.color.rings[0];
    ctx.lineWidth = 3;
    roundRect(ctx, textBoxX, textY - 16, textBoxWidth, 36, 8); // Increased height to 36px
    ctx.fill();
    ctx.stroke();
    
    // Draw option text with responsive font size
    ctx.fillStyle = '#FFF';
    const textFontSize = isSmallMobile ? 7 : isMobile ? 8 : 10;
    ctx.font = `bold ${textFontSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    
    // Split text into multiple lines if needed
    let displayText = target.option;
    const maxWidth = textBoxWidth - 16;
    const words = displayText.split(' ');
    let lines = [];
    let currentLine = '';
    
    // Try to fit words into lines
    for (let word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    
    // Limit to 2 lines and truncate if needed
    if (lines.length > 2) {
        lines = [lines[0], lines[1].substring(0, lines[1].length - 3) + '...'];
    }
    
    // Draw each line
    const lineHeight = 13; // Increased spacing between lines
    const startY = textY + 4 - ((lines.length - 1) * lineHeight / 2);
    lines.forEach((line, i) => {
        ctx.fillText(line, centerX, startY + (i * lineHeight));
    });
    
    ctx.shadowBlur = 0;
    ctx.restore();
}

// Helper function for rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawCharacter() {
    if (currentCharacter === 0) {
        drawLina();
    } else if (currentCharacter === 1) {
        drawRex();
    } else if (currentCharacter === 2) {
        drawMaya();
    } else {
        drawGenericCharacter();
    }
}

function drawLina() {
    ctx.save();
    
    // Smooth idle breathing animation with slight sway
    archer.animFrame += 0.03;
    archer.offsetY = Math.sin(archer.animFrame) * 1.5;
    const swayX = Math.sin(archer.animFrame * 0.7) * 0.8;
    
    // Shooting animation
    if (archer.isShooting) {
        archer.shootingAnim += 0.15;
        if (archer.shootingAnim >= 1) {
            archer.isShooting = false;
            archer.shootingAnim = 0;
        }
    }
    
    // Enhanced shadow with gradient
    const shadowGradient = ctx.createRadialGradient(
        archer.x + archer.width / 2, 
        archer.y + archer.height + 5, 
        5,
        archer.x + archer.width / 2, 
        archer.y + archer.height + 5, 
        25
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.ellipse(archer.x + archer.width / 2, archer.y + archer.height + 5, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const x = archer.x + swayX;
    const y = archer.y + archer.offsetY;
    const legSway = Math.sin(archer.animFrame * 1.2) * 0.5;
    
    // === LINA CHARACTER ===
    
    // Botas (marrón oscuro)
    ctx.fillStyle = '#3D2817';
    ctx.fillRect(x + 18 + legSway, y + 68, 10, 12); // Left boot
    ctx.fillRect(x + 32 - legSway, y + 68, 10, 12); // Right boot
    // Boot details
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(x + 18 + legSway, y + 68, 10, 3); // Top of boot
    ctx.fillRect(x + 32 - legSway, y + 68, 10, 3);
    
    // Pantalones (marrón)
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(x + 20 + legSway, y + 50, 8, 18); // Left leg
    ctx.fillRect(x + 32 - legSway, y + 50, 8, 18); // Right leg
    
    // Cinturón
    ctx.fillStyle = '#3D2817';
    ctx.fillRect(x + 18, y + 48, 24, 3);
    // Belt buckle
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(x + 28, y + 48, 4, 3);
    
    // Quiver strap (diagonal across body)
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(x + 16, y + 35, 4, 3);
    ctx.fillRect(x + 20, y + 38, 4, 3);
    ctx.fillRect(x + 24, y + 41, 4, 3);
    ctx.fillRect(x + 28, y + 44, 4, 3);
    
    // Green tunic/top
    ctx.fillStyle = '#4A9B5C';
    ctx.fillRect(x + 18, y + 35, 24, 16); // Main body
    // Darker green for shadows
    ctx.fillStyle = '#3D7A4A';
    ctx.fillRect(x + 18, y + 40, 3, 11); // Left side shadow
    ctx.fillRect(x + 39, y + 40, 3, 11); // Right side shadow
    // Lighter green for highlights
    ctx.fillStyle = '#5CB370';
    ctx.fillRect(x + 25, y + 36, 3, 8);
    
    // Quiver on back (visible behind)
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(x + 6, y + 38, 6, 18);
    ctx.fillStyle = '#3D2817';
    ctx.fillRect(x + 6, y + 38, 6, 2); // Top
    // Arrows in quiver
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(x + 7, y + 32, 2, 8);
    ctx.fillRect(x + 10, y + 30, 2, 10);
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x + 7, y + 30, 2, 2); // Arrow tips
    ctx.fillRect(x + 10, y + 28, 2, 2);
    
    // Neck
    ctx.fillStyle = '#FFD4A3';
    ctx.fillRect(x + 26, y + 30, 8, 5);
    
    // Head (circular, pixel art style)
    ctx.fillStyle = '#FFD4A3';
    const headPixels = [
        [x + 22, y + 16, 16, 4],  // Top
        [x + 20, y + 20, 20, 4],  // Upper
        [x + 20, y + 24, 20, 6],  // Middle
        [x + 22, y + 30, 16, 2],  // Bottom
    ];
    headPixels.forEach(pixel => ctx.fillRect(...pixel));
    
    // Hair - Orange with pigtails
    ctx.fillStyle = '#FF7F50'; // Main orange
    // Top of head
    ctx.fillRect(x + 20, y + 12, 20, 4);
    ctx.fillRect(x + 18, y + 16, 24, 8);
    // Hair shadow
    ctx.fillStyle = '#E66A3C';
    ctx.fillRect(x + 20, y + 16, 4, 6);
    ctx.fillRect(x + 36, y + 16, 4, 6);
    // Bangs
    ctx.fillStyle = '#FF7F50';
    ctx.fillRect(x + 24, y + 20, 4, 4);
    ctx.fillRect(x + 28, y + 20, 4, 4);
    ctx.fillRect(x + 32, y + 20, 4, 4);
    
    // Left pigtail
    ctx.fillStyle = '#FF7F50';
    ctx.fillRect(x + 14, y + 18, 6, 8);
    ctx.fillRect(x + 12, y + 26, 6, 6);
    ctx.fillStyle = '#E66A3C';
    ctx.fillRect(x + 12, y + 28, 2, 4);
    
    // Right pigtail
    ctx.fillStyle = '#FF7F50';
    ctx.fillRect(x + 40, y + 18, 6, 8);
    ctx.fillRect(x + 42, y + 26, 6, 6);
    ctx.fillStyle = '#E66A3C';
    ctx.fillRect(x + 46, y + 28, 2, 4);
    
    // Hair tie/ribbon (white)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 14, y + 22, 4, 2);
    ctx.fillRect(x + 42, y + 22, 4, 2);
    
    // Eyebrows
    ctx.fillStyle = '#C45A2E';
    ctx.fillRect(x + 24, y + 23, 4, 2);
    ctx.fillRect(x + 32, y + 23, 4, 2);
    
    // Eyes with blink animation
    const blinkChance = Math.random();
    if (blinkChance > 0.98) {
        // Blinking
        ctx.fillStyle = '#3D2817';
        ctx.fillRect(x + 24, y + 26, 4, 1);
        ctx.fillRect(x + 32, y + 26, 4, 1);
    } else {
        // Open eyes
        ctx.fillStyle = '#3D2817';
        ctx.fillRect(x + 24, y + 26, 4, 3);
        ctx.fillRect(x + 32, y + 26, 4, 3);
        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 26, y + 26, 1, 1);
        ctx.fillRect(x + 34, y + 26, 1, 1);
    }
    
    // Nose (small)
    ctx.fillStyle = '#FFCCA3';
    ctx.fillRect(x + 29, y + 28, 2, 2);
    
    // Mouth (small smile)
    ctx.fillStyle = '#E69B8C';
    ctx.fillRect(x + 27, y + 31, 6, 1);
    ctx.fillRect(x + 28, y + 32, 4, 1);
    
    // Blush
    ctx.fillStyle = 'rgba(255, 140, 140, 0.4)';
    ctx.fillRect(x + 21, y + 28, 3, 2);
    ctx.fillRect(x + 36, y + 28, 3, 2);
    
    // === BOW AND ARMS (with proper aiming from chest/shoulder level) ===
    const centerX = x + 30;
    const centerY = y + 38; // Moved up to chest level (was 48)
    
    // Calculate aim angle
    const aimAngle = archer.aimAngle;
    const bowPullback = archer.isShooting ? Math.sin(archer.shootingAnim * Math.PI) * 12 : 3;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aimAngle);
    
    // === BACK ARM (holding bow) - left/back arm ===
    ctx.fillStyle = '#FFD4A3';
    // Shoulder
    ctx.fillRect(-4, -6, 5, 5);
    // Upper arm extending to bow
    ctx.fillRect(-8, -5, 6, 4);
    // Forearm (shorter)
    ctx.fillRect(-13, -4, 7, 4);
    // Hand gripping bow
    ctx.fillRect(-16, -4, 5, 5);
    
    // === BOW ===
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    // Upper limb
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.quadraticCurveTo(-20, -10, -16, -2);
    ctx.stroke();
    
    // Lower limb
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.quadraticCurveTo(-20, 10, -16, 18);
    ctx.stroke();
    
    // Bow grip (where hand holds)
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(-17, -2, 3, 4);
    ctx.fillRect(-10, -3, 4, 6);
    
    // Bow string
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.lineTo(-16 + bowPullback, 0);
    ctx.lineTo(-16, 18);
    ctx.stroke();
    
    // === FRONT ARM (pulling string) - right/front arm ===
    if (!archer.isShooting || archer.shootingAnim < 0.3) {
        ctx.fillStyle = '#FFD4A3';
        // Shoulder
        ctx.fillRect(2, -5, 4, 5);
        // Upper arm extending forward
        ctx.fillRect(5, -4, 8, 4);
        // Forearm pulling back (shorter)
        ctx.fillRect(12, -3, 8, 4);
        // Hand gripping string/arrow
        ctx.fillRect(19 + bowPullback, -4, 5, 5);
        
        // Fingers detail
        ctx.fillStyle = '#FFCCA3';
        ctx.fillRect(21 + bowPullback, -2, 2, 2);
        ctx.fillRect(21 + bowPullback, 0, 2, 2);
    }
    
    // === ARROW ===
    if (!archer.isShooting || archer.shootingAnim < 0.3) {
        const arrowPull = archer.isShooting ? archer.shootingAnim * 30 : bowPullback;
        
        // Arrow shaft
        ctx.strokeStyle = '#CD853F';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-16 + arrowPull, 0);
        ctx.lineTo(30, 0);
        ctx.stroke();
        
        // Arrow head (metallic point)
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(26, -2.5);
        ctx.lineTo(26, 2.5);
        ctx.closePath();
        ctx.fill();
        
        // Arrow outline
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Arrow nock (back where string touches)
        ctx.fillStyle = '#3D2817';
        ctx.fillRect(-16 + arrowPull - 2, -1, 2, 2);
        
        // Arrow feathers (fletching)
        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(-16 + arrowPull - 8, -3, 6, 1);
        ctx.fillRect(-16 + arrowPull - 8, 2, 6, 1);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-16 + arrowPull - 8, -2, 6, 2);
        ctx.fillRect(-16 + arrowPull - 8, 0, 6, 2);
    }
    
    ctx.restore();
    
    ctx.restore();
}

function drawRex() {
    ctx.save();
    
    // Smooth idle breathing animation with slight sway
    archer.animFrame += 0.03;
    archer.offsetY = Math.sin(archer.animFrame) * 1.5;
    const swayX = Math.sin(archer.animFrame * 0.7) * 0.8;
    
    // Shooting animation
    if (archer.isShooting) {
        archer.shootingAnim += 0.15;
        if (archer.shootingAnim >= 1) {
            archer.isShooting = false;
            archer.shootingAnim = 0;
        }
    }
    
    // Enhanced shadow with gradient
    const shadowGradient = ctx.createRadialGradient(
        archer.x + archer.width / 2, 
        archer.y + archer.height + 5, 
        5,
        archer.x + archer.width / 2, 
        archer.y + archer.height + 5, 
        25
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.ellipse(archer.x + archer.width / 2, archer.y + archer.height + 5, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const x = archer.x + swayX;
    const y = archer.y + archer.offsetY;
    const legSway = Math.sin(archer.animFrame * 1.2) * 0.5;
    
    // Colors - Rex has dark skin, black hair, red shirt, brown pants
    const skinColor = '#A67C52';      // Dark skin
    const hairColor = '#2C1810';      // Dark brown/black hair
    const shirtColor = '#DC143C';     // Crimson red shirt
    const pantsColor = '#5C4033';     // Brown pants
    const bootColor = '#3D2817';      // Dark boots
    const beltColor = '#8B4513';      // Saddle brown belt
    const quiverColor = '#654321';    // Dark leather
    const arrowColor = '#D2691E';     // Wood arrows
    const bowColor = '#8B4513';       // Wood bow
    const bowStringColor = '#F5DEB3'; // Wheat string
    
    // LEGS AND BOOTS - standing firm
    // Left leg
    ctx.fillStyle = pantsColor;
    ctx.fillRect(x + 21 + legSway, y + 52, 7, 16);
    ctx.fillStyle = bootColor;
    ctx.fillRect(x + 21 + legSway, y + 68, 8, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 21 + legSway, y + 70, 8, 2);
    
    // Right leg
    ctx.fillStyle = pantsColor;
    ctx.fillRect(x + 32 - legSway, y + 52, 7, 16);
    ctx.fillStyle = bootColor;
    ctx.fillRect(x + 31 - legSway, y + 68, 8, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 31 - legSway, y + 70, 8, 2);
    
    // TORSO - red shirt
    ctx.fillStyle = shirtColor;
    ctx.fillRect(x + 20, y + 32, 20, 20);
    
    // Shirt collar
    ctx.fillStyle = '#B22222'; // Darker red
    ctx.fillRect(x + 24, y + 32, 12, 3);
    
    // Belt
    ctx.fillStyle = beltColor;
    ctx.fillRect(x + 20, y + 50, 20, 3);
    ctx.fillStyle = '#DAA520'; // Gold buckle
    ctx.fillRect(x + 28, y + 50, 4, 3);
    
    // QUIVER ON BACK - darker leather with arrows visible
    ctx.fillStyle = quiverColor;
    ctx.fillRect(x + 16, y + 28, 6, 18);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 16, y + 28, 2, 18);
    
    // Arrows in quiver (feathers visible)
    ctx.fillStyle = arrowColor;
    ctx.fillRect(x + 17, y + 28, 2, 6);
    ctx.fillRect(x + 19, y + 30, 2, 6);
    ctx.fillStyle = '#8B0000'; // Dark red feathers
    ctx.fillRect(x + 17, y + 28, 2, 3);
    ctx.fillStyle = '#228B22'; // Green feathers
    ctx.fillRect(x + 19, y + 30, 2, 3);
    
    // HEAD AND FACE
    // Neck
    ctx.fillStyle = skinColor;
    ctx.fillRect(x + 26, y + 28, 8, 5);
    
    // Head (slightly square jawline)
    ctx.fillRect(x + 23, y + 15, 14, 13);
    
    // Hair - short black hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(x + 22, y + 13, 16, 4); // Top
    ctx.fillRect(x + 22, y + 17, 3, 6);  // Left side
    ctx.fillRect(x + 35, y + 17, 3, 6);  // Right side
    ctx.fillRect(x + 25, y + 13, 10, 3); // Center tuft
    
    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 26, y + 20, 3, 3);
    ctx.fillRect(x + 31, y + 20, 3, 3);
    ctx.fillStyle = '#3B2F2F'; // Dark brown eyes
    ctx.fillRect(x + 27, y + 21, 2, 2);
    ctx.fillRect(x + 32, y + 21, 2, 2);
    
    // Eyebrows (thicker, more defined)
    ctx.fillStyle = hairColor;
    ctx.fillRect(x + 26, y + 19, 3, 1);
    ctx.fillRect(x + 31, y + 19, 3, 1);
    
    // Nose
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 29, y + 23, 2, 2);
    
    // Mouth (slight smile)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 28, y + 25, 4, 1);
    
    // Calculate aim angle and center point (chest level)
    const centerX = x + archer.width / 2;
    const centerY = y + 38; // Chest level for Rex (same as Lina)
    
    // BACK ARM (closer to body) - holds arrow
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(archer.aimAngle);
    
    const pullback = archer.shootingAnim * 12;
    
    // Back shoulder
    ctx.fillStyle = shirtColor;
    ctx.fillRect(-8, -3, 5, 5);
    
    // Back upper arm
    ctx.fillStyle = skinColor;
    ctx.fillRect(-8, 2, 6, 4);
    
    // Back forearm (pulling arrow)
    ctx.fillRect(-8 - pullback, 6, 7, 4);
    
    // Back hand holding arrow
    ctx.fillRect(-8 - pullback, 10, 5, 5);
    
    // Arrow being pulled
    if (archer.shootingAnim > 0) {
        ctx.fillStyle = arrowColor;
        ctx.fillRect(-16 - pullback, 12, pullback + 8, 2);
        ctx.fillStyle = '#8B0000'; // Red fletching
        ctx.fillRect(-16 - pullback, 11, 3, 4);
    }
    
    ctx.restore();
    
    // FRONT ARM - holds bow
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(archer.aimAngle);
    
    // Front shoulder
    ctx.fillStyle = shirtColor;
    ctx.fillRect(3, -3, 4, 5);
    
    // Front upper arm
    ctx.fillStyle = skinColor;
    ctx.fillRect(7, 0, 8, 4);
    
    // Front forearm
    ctx.fillRect(15, 2, 8, 4);
    
    // Front hand gripping bow
    ctx.fillRect(23, 2, 5, 5);
    
    // BOW held in front hand
    const bowDistance = -16;
    ctx.strokeStyle = bowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bowDistance, -10);
    ctx.quadraticCurveTo(bowDistance - 3, 0, bowDistance, 10);
    ctx.stroke();
    
    // Bow string
    ctx.strokeStyle = bowStringColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bowDistance, -10);
    ctx.lineTo(bowDistance - pullback, 0);
    ctx.lineTo(bowDistance, 10);
    ctx.stroke();
    
    // Bow grip decoration
    ctx.fillStyle = beltColor;
    ctx.fillRect(bowDistance - 1, -2, 2, 4);
    
    ctx.restore();
    
    ctx.restore();
}

function drawMaya() {
    ctx.save();
    
    // Smooth idle breathing animation with slight sway
    archer.animFrame += 0.03;
    archer.offsetY = Math.sin(archer.animFrame) * 1.5;
    const swayX = Math.sin(archer.animFrame * 0.7) * 0.8;
    
    // Shooting animation
    if (archer.isShooting) {
        archer.shootingAnim += 0.15;
        if (archer.shootingAnim >= 1) {
            archer.isShooting = false;
            archer.shootingAnim = 0;
        }
    }
    
    // Enhanced shadow with gradient
    const shadowGradient = ctx.createRadialGradient(
        archer.x + archer.width / 2, 
        archer.y + archer.height + 5, 
        5,
        archer.x + archer.width / 2, 
        archer.y + archer.height + 5, 
        25
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.ellipse(archer.x + archer.width / 2, archer.y + archer.height + 5, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const x = archer.x + swayX;
    const y = archer.y + archer.offsetY;
    const legSway = Math.sin(archer.animFrame * 1.2) * 0.5;
    
    // Colors - Maya has brown hair with glasses and teal sweater
    const skinColor = '#F5C9A3';      // Light peachy skin
    const hairColor = '#6B4423';      // Brown hair
    const sweaterColor = '#5F9EA0';   // Cadet blue/teal sweater
    const pantsColor = '#4A5568';     // Dark gray pants
    const bootColor = '#2D3748';      // Darker boots
    const glassesColor = '#2C2C2C';   // Dark frames
    const glassesLens = 'rgba(173, 216, 230, 0.3)'; // Light blue tint
    const quiverColor = '#654321';    // Dark leather
    const arrowColor = '#D2691E';     // Wood arrows
    const bowColor = '#8B4513';       // Wood bow
    const bowStringColor = '#F5DEB3'; // Wheat string
    
    // LEGS AND BOOTS - standing firm
    // Left leg
    ctx.fillStyle = pantsColor;
    ctx.fillRect(x + 21 + legSway, y + 52, 7, 16);
    ctx.fillStyle = bootColor;
    ctx.fillRect(x + 21 + legSway, y + 68, 8, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 21 + legSway, y + 70, 8, 2);
    
    // Right leg
    ctx.fillStyle = pantsColor;
    ctx.fillRect(x + 32 - legSway, y + 52, 7, 16);
    ctx.fillStyle = bootColor;
    ctx.fillRect(x + 31 - legSway, y + 68, 8, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 31 - legSway, y + 70, 8, 2);
    
    // TORSO - teal sweater
    ctx.fillStyle = sweaterColor;
    ctx.fillRect(x + 20, y + 32, 20, 20);
    
    // Sweater collar/neckline
    ctx.fillStyle = '#4A8B8D'; // Darker teal
    ctx.fillRect(x + 24, y + 32, 12, 3);
    
    // Sweater detail - horizontal stripe
    ctx.fillStyle = '#3A6B6E'; // Even darker teal
    ctx.fillRect(x + 20, y + 42, 20, 2);
    
    // QUIVER ON BACK - darker leather with arrows visible
    ctx.fillStyle = quiverColor;
    ctx.fillRect(x + 16, y + 28, 6, 18);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 16, y + 28, 2, 18);
    
    // Arrows in quiver (feathers visible)
    ctx.fillStyle = arrowColor;
    ctx.fillRect(x + 17, y + 28, 2, 6);
    ctx.fillRect(x + 19, y + 30, 2, 6);
    ctx.fillStyle = '#8B008B'; // Purple feathers
    ctx.fillRect(x + 17, y + 28, 2, 3);
    ctx.fillStyle = '#FFD700'; // Gold feathers
    ctx.fillRect(x + 19, y + 30, 2, 3);
    
    // HEAD AND FACE
    // Neck
    ctx.fillStyle = skinColor;
    ctx.fillRect(x + 26, y + 28, 8, 5);
    
    // Head (rounded)
    ctx.fillRect(x + 23, y + 15, 14, 13);
    
    // Hair - brown shoulder-length hair
    ctx.fillStyle = hairColor;
    // Top of hair
    ctx.fillRect(x + 22, y + 13, 16, 4);
    // Left side hair (longer)
    ctx.fillRect(x + 21, y + 17, 3, 10);
    // Right side hair (longer)
    ctx.fillRect(x + 36, y + 17, 3, 10);
    // Bangs/fringe
    ctx.fillRect(x + 25, y + 16, 3, 2);
    ctx.fillRect(x + 29, y + 16, 3, 2);
    ctx.fillRect(x + 33, y + 16, 2, 2);
    
    // GLASSES - distinctive feature
    // Left lens frame
    ctx.fillStyle = glassesColor;
    ctx.fillRect(x + 25, y + 19, 4, 4);
    ctx.fillStyle = glassesLens;
    ctx.fillRect(x + 26, y + 20, 2, 2);
    
    // Right lens frame
    ctx.fillStyle = glassesColor;
    ctx.fillRect(x + 31, y + 19, 4, 4);
    ctx.fillStyle = glassesLens;
    ctx.fillRect(x + 32, y + 20, 2, 2);
    
    // Bridge of glasses
    ctx.fillStyle = glassesColor;
    ctx.fillRect(x + 29, y + 20, 2, 1);
    
    // Glasses arms
    ctx.fillRect(x + 24, y + 20, 1, 1);
    ctx.fillRect(x + 35, y + 20, 1, 1);
    
    // Eyes behind glasses
    ctx.fillStyle = '#5D4E37'; // Brown eyes
    ctx.fillRect(x + 26, y + 20, 2, 2);
    ctx.fillRect(x + 32, y + 20, 2, 2);
    
    // Eye highlights
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 27, y + 20, 1, 1);
    ctx.fillRect(x + 33, y + 20, 1, 1);
    
    // Eyebrows (above glasses)
    ctx.fillStyle = hairColor;
    ctx.fillRect(x + 25, y + 18, 4, 1);
    ctx.fillRect(x + 31, y + 18, 4, 1);
    
    // Nose
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x + 29, y + 23, 2, 2);
    
    // Mouth (gentle smile)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 27, y + 25, 6, 1);
    ctx.fillRect(x + 27, y + 26, 1, 1);
    ctx.fillRect(x + 32, y + 26, 1, 1);
    
    // Calculate aim angle and center point (chest level)
    const centerX = x + archer.width / 2;
    const centerY = y + 38; // Chest level
    
    // BACK ARM (closer to body) - holds arrow
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(archer.aimAngle);
    
    const pullback = archer.shootingAnim * 12;
    
    // Back shoulder
    ctx.fillStyle = sweaterColor;
    ctx.fillRect(-8, -3, 5, 5);
    
    // Back upper arm
    ctx.fillStyle = skinColor;
    ctx.fillRect(-8, 2, 6, 4);
    
    // Back forearm (pulling arrow)
    ctx.fillRect(-8 - pullback, 6, 7, 4);
    
    // Back hand holding arrow
    ctx.fillRect(-8 - pullback, 10, 5, 5);
    
    // Arrow being pulled
    if (archer.shootingAnim > 0) {
        ctx.fillStyle = arrowColor;
        ctx.fillRect(-16 - pullback, 12, pullback + 8, 2);
        ctx.fillStyle = '#8B008B'; // Purple fletching
        ctx.fillRect(-16 - pullback, 11, 3, 4);
    }
    
    ctx.restore();
    
    // FRONT ARM - holds bow
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(archer.aimAngle);
    
    // Front shoulder
    ctx.fillStyle = sweaterColor;
    ctx.fillRect(3, -3, 4, 5);
    
    // Front upper arm
    ctx.fillStyle = skinColor;
    ctx.fillRect(7, 0, 8, 4);
    
    // Front forearm
    ctx.fillRect(15, 2, 8, 4);
    
    // Front hand gripping bow
    ctx.fillRect(23, 2, 5, 5);
    
    // BOW held in front hand
    const bowDistance = -16;
    ctx.strokeStyle = bowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bowDistance, -10);
    ctx.quadraticCurveTo(bowDistance - 3, 0, bowDistance, 10);
    ctx.stroke();
    
    // Bow string
    ctx.strokeStyle = bowStringColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bowDistance, -10);
    ctx.lineTo(bowDistance - pullback, 0);
    ctx.lineTo(bowDistance, 10);
    ctx.stroke();
    
    // Bow grip decoration
    ctx.fillStyle = '#5F9EA0'; // Teal accent
    ctx.fillRect(bowDistance - 1, -2, 2, 4);
    
    ctx.restore();
    
    ctx.restore();
}

function drawGenericCharacter() {
    // Placeholder for other characters (will be implemented later)
    const char = characters[currentCharacter];
    
    ctx.save();
    
    archer.animFrame += 0.03;
    archer.offsetY = Math.sin(archer.animFrame) * 1.5;
    const swayX = Math.sin(archer.animFrame * 0.7) * 0.8;
    
    const shadowGradient = ctx.createRadialGradient(
        archer.x + archer.width / 2, 
        archer.y + archer.height + 5, 
        5,
        archer.x + archer.width / 2, 
        archer.y + archer.height + 5, 
        25
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.ellipse(archer.x + archer.width / 2, archer.y + archer.height + 5, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const x = archer.x + swayX;
    const y = archer.y + archer.offsetY;
    
    // Simple placeholder character
    ctx.fillStyle = char.color;
    ctx.fillRect(x + 20, y + 20, 20, 40);
    
    ctx.fillStyle = '#FFD4A3';
    ctx.fillRect(x + 24, y + 15, 12, 12);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 26, y + 20, 2, 2);
    ctx.fillRect(x + 32, y + 20, 2, 2);
    
    ctx.restore();
}

function shootArrow(event) {
    if (gameState !== 'playing' || !canShoot) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clickX, clickY;
    if (event.touches && event.touches.length > 0) {
        clickX = event.touches[0].clientX - rect.left;
        clickY = event.touches[0].clientY - rect.top;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        clickX = event.changedTouches[0].clientX - rect.left;
        clickY = event.changedTouches[0].clientY - rect.top;
    } else {
        clickX = event.clientX - rect.left;
        clickY = event.clientY - rect.top;
    }
    
    // Trigger shooting animation
    archer.isShooting = true;
    archer.shootingAnim = 0;
    
    // Create arrow from chest/shoulder level
    const arrowX = archer.x + archer.width / 2;
    const arrowY = archer.y + 38 + archer.offsetY; // Chest level (was 48)
    
    const angle = Math.atan2(clickY - arrowY, clickX - arrowX);
    
    // Responsive arrow speed - slower on mobile for better control
    const isMobile = window.innerWidth <= 768;
    const arrowSpeed = isMobile ? 10 : 12;
    
    arrows.push({
        x: arrowX,
        y: arrowY,
        vx: Math.cos(angle) * arrowSpeed,
        vy: Math.sin(angle) * arrowSpeed,
        angle: angle,
        trail: []
    });
    
    // Play shoot sound
    playSoundShoot();
    
    // Shoot animation
    createShootParticles(arrowX, arrowY);
}

function updateArrows() {
    arrows.forEach((arrow, index) => {
        // Update position
        arrow.x += arrow.vx;
        arrow.y += arrow.vy;
        
        // Add to trail
        arrow.trail.push({ x: arrow.x, y: arrow.y });
        if (arrow.trail.length > 10) arrow.trail.shift();
        
        // Check collision with targets
        targets.forEach(target => {
            if (!target.hit && checkCollision(arrow, target)) {
                target.hit = true;
                playSoundHit(); // Play hit sound
                handleAnswer(target.optionIndex);
                createHitParticles(target.x, target.y, target.color.rings[0]);
                arrows.splice(index, 1);
            }
        });
        
        // Draw arrow
        drawArrow(arrow);
    });
    
    // Remove off-screen arrows
    arrows = arrows.filter(a => 
        a.x > -50 && a.x < canvas.width + 50 &&
        a.y > -50 && a.y < canvas.height + 50
    );
}

function drawArrow(arrow) {
    ctx.save();
    
    // Draw trail (pixelated)
    arrow.trail.forEach((point, i) => {
        const alpha = i / arrow.trail.length;
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.5})`;
        ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
    });
    
    // Arrow body
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate(arrow.angle);
    
    // Shaft
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(-20, -2, 25, 4);
    
    // Head
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    
    // Feathers
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(-20, -3, 5, 2);
    ctx.fillRect(-20, 1, 5, 2);
    
    ctx.restore();
}

function checkCollision(arrow, target) {
    const dx = arrow.x - target.x;
    const dy = arrow.y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < target.width / 2;
}

function handleAnswer(optionIndex) {
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    
    // Disable shooting after hitting a target
    canShoot = false;
    
    if (isCorrect) {
        // Play correct sound with combo
        playSoundCorrect();
        if (combo >= 2) {
            setTimeout(() => playSoundCombo(combo), 300);
        }
        
        correctAnswers++;
        score += 100 * combo;
        combo++;
        if (combo > bestCombo) bestCombo = combo;
        showFeedback('¡CORRECTO! +' + (100 * (combo - 1)), '#4CAF50');
    } else {
        // Play wrong sound
        playSoundWrong();
        
        combo = 1;
        showFeedback('✗ INCORRECTO', '#FF5252');
    }
    
    clearInterval(timerInterval);
    updateScore();
    
    setTimeout(() => {
        loadNextQuestion();
    }, 1500);
}

function createHitParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 2 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.02,
            color: color,
            size: 4 + Math.random() * 4
        });
    }
}

function createShootParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1,
            decay: 0.05,
            color: '#FFD700',
            size: 3
        });
    }
}

function updateParticles() {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravity
        p.life -= p.decay;
        
        if (p.life > 0) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            ctx.globalAlpha = 1;
        }
    });
    
    particles = particles.filter(p => p.life > 0);
}

// Timer functions
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = timeLimit;
    
    const timerFill = document.querySelector('.timer-fill');
    timerFill.style.width = '100%';
    timerFill.style.background = 'linear-gradient(90deg, #4ECDC4 0%, #95E1D3 100%)';
    
    timerInterval = setInterval(() => {
        timeLeft--;
        const percentage = (timeLeft / timeLimit) * 100;
        timerFill.style.width = percentage + '%';
        
        // Color changes and warning sound
        if (percentage <= 25) {
            timerFill.style.background = 'linear-gradient(90deg, #FF5252 0%, #FF8A80 100%)';
            timerFill.style.boxShadow = '0 0 15px rgba(255, 82, 82, 0.8)';
            // Play warning beep for last 3 seconds
            if (timeLeft <= 3 && timeLeft > 0) {
                playSoundTimerWarning();
            }
        } else if (percentage <= 50) {
            timerFill.style.background = 'linear-gradient(90deg, #FFD93D 0%, #FFE066 100%)';
            timerFill.style.boxShadow = '0 0 12px rgba(255, 217, 61, 0.6)';
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleAnswer(-1); // Wrong answer
        }
    }, 1000);
}

function showFeedback(text, color) {
    const feedback = document.getElementById('comboDisplay');
    feedback.textContent = text;
    feedback.style.color = color;
    feedback.style.display = 'block';
    
    setTimeout(() => {
        feedback.style.display = 'none';
    }, 1500);
}

function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('combo').textContent = combo + 'x';
}

async function endGame() {
    gameState = 'gameover';
    clearInterval(timerInterval);
    stopBackgroundMusic();
    
    // Calculate accuracy percentage
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Play appropriate end sound based on performance
    if (accuracy >= 70) {
        playSoundVictory();
    } else {
        playSoundGameOver();
    }
    
    // Calculate grade on a 0-10 scale based on accuracy
    // 0-59% = 0-5.9, 60-100% = 6-10
    const gradeOutOf10 = (accuracy / 10).toFixed(1); // Convert percentage to 0-10 scale
    
    // Save grade to Firebase
    await saveGradeToFirebase(accuracy, gradeOutOf10);
    
    // Show game over screen with correct IDs
    const gameOverScreen = document.getElementById('gameoverScreen') || document.getElementById('gameOverScreen');
    document.getElementById('finalScore').textContent = score;
    const correctCount = document.getElementById('finalCorrect') || document.getElementById('correctCount');
    if (correctCount) correctCount.textContent = `${correctAnswers}/${totalQuestions}`;
    const bestComboEl = document.getElementById('finalCombo') || document.getElementById('bestCombo');
    if (bestComboEl) bestComboEl.textContent = `x${bestCombo}`;
    const accuracyEl = document.getElementById('finalAccuracy') || document.getElementById('accuracy');
    if (accuracyEl) accuracyEl.textContent = accuracy + '%';
    
    if (gameOverScreen) gameOverScreen.style.display = 'flex';
}

async function saveGradeToFirebase(accuracy, gradeOutOf10) {
    try {
        // Get the classId from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const classId = urlParams.get('classId');
        
        if (!classId) {
            console.warn('⚠️ No classId found in URL');
            return;
        }
        
        // Get token from localStorage or sessionStorage
        console.log('🔍 Checking for authentication token...');
        console.log('localStorage keys:', Object.keys(localStorage));
        console.log('sessionStorage keys:', Object.keys(sessionStorage));
        
        const token = localStorage.getItem('authToken') || 
                     localStorage.getItem('token') || 
                     sessionStorage.getItem('gameAuthToken');
        
        if (!token) {
            console.error('❌ No authentication token found');
            console.log('Available in localStorage:', {
                authToken: localStorage.getItem('authToken'),
                token: localStorage.getItem('token')
            });
            console.log('Available in sessionStorage:', {
                gameAuthToken: sessionStorage.getItem('gameAuthToken')
            });
            alert('⚠️ No se pudo guardar la calificación. Por favor, vuelve a iniciar sesión.');
            return;
        }
        
        console.log('✅ Token found, length:', token.length);
        
        console.log('💾 Saving grade to Firebase:', {
            classId,
            grade: accuracy,
            gradeOutOf10: parseFloat(gradeOutOf10),
            score,
            correctAnswers,
            totalQuestions
        });
        
        // Send grade to backend
        const response = await fetch(`/api/classes/${classId}/grade`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                grade: accuracy,
                gradeOutOf10: parseFloat(gradeOutOf10),
                score: score,
                correctAnswers: correctAnswers,
                totalQuestions: totalQuestions,
                combo: bestCombo,
                completedAt: new Date().toISOString()
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Grade saved successfully:', data.data);
        } else {
            console.warn('❌ Failed to save grade:', data.error);
        }
    } catch (error) {
        console.error('💥 Error saving grade to Firebase:', error);
    }
}

// UI Functions
function backToHome() {
    // Mark class for completion when returning to dashboard
    const pendingClassId = sessionStorage.getItem('pendingCompletionClassId');
    console.log('🏠 backToHome called. pendingClassId:', pendingClassId);
    if (pendingClassId) {
        sessionStorage.setItem('completedClassId', pendingClassId);
        sessionStorage.removeItem('pendingCompletionClassId');
        console.log('✅ Set completedClassId:', pendingClassId);
    } else {
        console.warn('⚠️ No pendingCompletionClassId found in sessionStorage');
    }
    window.location.href = '/student-dashboard';
}

function goBack() {
    // Mark class for completion when returning to dashboard
    const pendingClassId = sessionStorage.getItem('pendingCompletionClassId');
    console.log('⬅️ goBack called. pendingClassId:', pendingClassId);
    if (pendingClassId) {
        sessionStorage.setItem('completedClassId', pendingClassId);
        sessionStorage.removeItem('pendingCompletionClassId');
        console.log('✅ Set completedClassId:', pendingClassId);
    } else {
        console.warn('⚠️ No pendingCompletionClassId found in sessionStorage');
    }
    window.location.href = '/student-dashboard';
}

function restartGame() {
    const gameOverScreen = document.getElementById('gameoverScreen') || document.getElementById('gameOverScreen');
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    currentQuestionIndex = 0;
    generateQuestions();
    startGame();
}

function saveScore() {
    const playerName = document.getElementById('playerName').value.trim() || 'Anónimo';
    
    // Get existing scores for local leaderboard
    let scores = JSON.parse(localStorage.getItem('archerScores_' + classSubject) || '[]');
    
    const scoreData = {
        name: playerName,
        score: score,
        correct: correctAnswers,
        total: totalQuestions,
        combo: bestCombo,
        date: new Date().toLocaleDateString()
    };
    
    // Add new score to local storage
    scores.push(scoreData);
    
    // Sort and keep top 10
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);
    
    // Save locally
    localStorage.setItem('archerScores_' + classSubject, JSON.stringify(scores));
    
    // Also save to backend (for admin statistics)
    saveScoreToBackend(playerName);
    
    alert('¡Puntuación guardada!');
    showLeaderboard();
}

// Save score to backend for admin panel
async function saveScoreToBackend(playerName) {
    try {
        const API_BASE = window.location.origin;
        const token = localStorage.getItem('authToken');
        
        console.log('📊 Saving score to backend...');
        console.log('📊 Data:', {
            playerName,
            score,
            correctAnswers,
            totalQuestions,
            bestCombo,
            subject: classSubject,
            difficulty
        });
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add auth token if user is logged in
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('📊 User is logged in');
        } else {
            console.log('📊 Playing as guest');
        }
        
        const response = await fetch(`${API_BASE}/api/stats/game-scores`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                playerName: playerName,
                score: score,
                correctAnswers: correctAnswers,
                totalQuestions: totalQuestions,
                bestCombo: bestCombo,
                subject: classSubject,
                difficulty: difficulty
            })
        });
        
        console.log('📊 Response status:', response.status);
        const data = await response.json();
        console.log('📊 Response data:', data);
        
        if (data.success) {
            console.log('✅ Score saved to backend:', data.data.id);
        } else {
            console.warn('⚠️ Could not save score to backend:', data.error);
        }
    } catch (error) {
        console.error('❌ Error saving score to backend:', error);
        // Fail silently - local storage is the backup
    }
}

function showLeaderboard() {
    const gameOverScreen = document.getElementById('gameoverScreen') || document.getElementById('gameOverScreen');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (leaderboardScreen) leaderboardScreen.style.display = 'flex';
    
    const leaderboardList = document.getElementById('leaderboardList');
    const leaderboardBody = document.getElementById('leaderboardBody');
    
    const scores = JSON.parse(localStorage.getItem('archerScores_' + classSubject) || '[]');
    
    if (scores.length === 0) {
        if (leaderboardList) {
            leaderboardList.innerHTML = '<div style="text-align: center; padding: 20px; color: #B0BEC5; font-size: 10px;">No hay puntuaciones aún</div>';
        } else if (leaderboardBody) {
            leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay puntuaciones aún</td></tr>';
        }
        return;
    }
    
    if (leaderboardList) {
        // New HTML structure
        leaderboardList.innerHTML = '';
        scores.forEach((s, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${s.name}</span>
                <span class="leaderboard-score">${s.score} pts</span>
            `;
            leaderboardList.appendChild(item);
        });
    } else if (leaderboardBody) {
        // Old HTML structure
        leaderboardBody.innerHTML = '';
        scores.forEach((s, index) => {
            const row = leaderboardBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${s.name}</td>
                <td>${s.score}</td>
                <td>${s.correct}/${s.total}</td>
                <td>${s.combo}x</td>
            `;
        });
    }
}

function closeLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const gameOverScreen = document.getElementById('gameoverScreen') || document.getElementById('gameOverScreen');
    
    if (leaderboardScreen) leaderboardScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'flex';
}

function hideLeaderboard() {
    closeLeaderboard();
}

function filterLeaderboard(filter) {
    // Same as showLeaderboard for now
    showLeaderboard();
}

function filterScores(filter) {
    // Activate button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter logic here (implement if needed)
    showLeaderboard();
}

// Question generation
function generateQuestions() {
    const allQuestions = getQuestionBank();
    console.log('Total questions in bank:', allQuestions.length);
    console.log('Class subject:', classSubject);
    console.log('Difficulty:', difficulty);
    
    // MAPEO EXACTO - Cada tema tiene su propia categoría exclusiva
    const subjectKeywords = {
        // Ciencias (solo ciencias generales)
        'ciencias': 'Ciencias',
        'ciencia': 'Ciencias',
        'science': 'Ciencias',
        'sciences': 'Ciencias',
        
        // Astronomía (EXCLUSIVO)
        'astronomía': 'Astronomía',
        'astronomia': 'Astronomía',
        'astronomy': 'Astronomía',
        'espacio': 'Astronomía',
        'planetas': 'Astronomía',
        'universo': 'Astronomía',
        
        // Corridos Tumbados (EXCLUSIVO - Solo Home)
        'corridos tumbados': 'Corridos Tumbados',
        'corridos': 'Corridos Tumbados',
        'tumbados': 'Corridos Tumbados',
        'peso pluma': 'Corridos Tumbados',
        'regional mexicano': 'Corridos Tumbados',
        
        // Biología (EXCLUSIVO)
        'biología': 'Biología',
        'biologia': 'Biología',
        'biology': 'Biología',
        
        // Química (EXCLUSIVO)
        'química': 'Química',
        'quimica': 'Química',
        'chemistry': 'Química',
        
        // Física (mantener bajo ciencias por ahora)
        'física': 'Ciencias',
        'fisica': 'Ciencias',
        'physics': 'Ciencias',
        
        // Arte (EXCLUSIVO - sin música)
        'arte': 'Arte',
        'art': 'Arte',
        'pintura': 'Arte',
        'dibujo': 'Arte',
        
        // Música (EXCLUSIVO)
        'música': 'Música',
        'musica': 'Música',
        'music': 'Música',
        
        // Inglés (EXCLUSIVO)
        'inglés': 'Inglés',
        'ingles': 'Inglés',
        'english': 'Inglés',
        
        // Francés (EXCLUSIVO)
        'francés': 'Francés',
        'frances': 'Francés',
        'french': 'Francés',
        
        // Matemáticas
        'matemáticas': 'Matemáticas',
        'matematicas': 'Matemáticas',
        'math': 'Matemáticas',
        'mathematics': 'Matemáticas',
        'álgebra': 'Matemáticas',
        'algebra': 'Matemáticas',
        'geometría': 'Matemáticas',
        'geometria': 'Matemáticas',
        'cálculo': 'Matemáticas',
        'calculo': 'Matemáticas',
        
        // Historia
        'historia': 'Historia',
        'history': 'Historia',
        
        // Geografía
        'geografía': 'Geografía',
        'geografia': 'Geografía',
        'geography': 'Geografía',
        
        // Programación
        'programación': 'Programación',
        'programacion': 'Programación',
        'programming': 'Programación',
        'informática': 'Programación',
        'informatica': 'Programación',
        'tecnología': 'Programación',
        'tecnologia': 'Programación',
        'coding': 'Programación',
        
        // Películas (EXCLUSIVO - Solo Home)
        'películas': 'Películas',
        'peliculas': 'Películas',
        'movies': 'Películas',
        'cine': 'Películas',
        'films': 'Películas',
        'marvel': 'Películas',
        'dc': 'Películas',
        
        // Cultura General (EXCLUSIVO - Solo Home)
        'cultura general': 'Cultura General',
        'cultura': 'Cultura General',
        'general knowledge': 'Cultura General',
        'trivia': 'Cultura General'
    };
    
    // Try to match class name to a subject
    let matchedSubject = 'General';
    const lowerClassName = classSubject.toLowerCase();
    
    for (const [keyword, subject] of Object.entries(subjectKeywords)) {
        if (lowerClassName.includes(keyword)) {
            matchedSubject = subject;
            break;
        }
    }
    
    console.log('Matched subject:', matchedSubject);
    
    // Filter by matched subject and difficulty
    let filtered = allQuestions.filter(q => 
        q.subject === matchedSubject && q.difficulty === difficulty
    );
    
    console.log('Filtered by subject and difficulty:', filtered.length);
    
    // If no questions found with that difficulty, try any difficulty of that subject
    if (filtered.length === 0 && matchedSubject !== 'General') {
        filtered = allQuestions.filter(q => q.subject === matchedSubject);
        console.log('Filtered by subject only:', filtered.length);
    }
    
    // If STILL no questions for this subject, show error instead of using wrong questions
    if (filtered.length === 0) {
        alert(`No hay preguntas disponibles para la categoría "${matchedSubject}" con dificultad "${difficulty}".\n\nPor favor, contacta al administrador para agregar preguntas a esta categoría.`);
        window.location.href = '/student-dashboard';
        return;
    }
    
    // Get recently used questions from localStorage
    const recentKey = `recentQuestions_${matchedSubject}_${difficulty}`;
    let recentQuestions = JSON.parse(localStorage.getItem(recentKey) || '[]');
    
    // Remove questions that were used recently
    let availableQuestions = filtered.filter(q => 
        !recentQuestions.includes(q.question)
    );
    
    // If we've used all questions, reset the recent list
    if (availableQuestions.length < 10 && filtered.length >= 10) {
        console.log('Resetting recent questions pool');
        recentQuestions = [];
        availableQuestions = filtered;
    }
    
    // Shuffle using Fisher-Yates algorithm (better than Math.random sort)
    const shuffled = [...availableQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Select 10 questions (or all if less than 10)
    const selectedCount = Math.min(10, shuffled.length);
    questions = shuffled.slice(0, selectedCount);
    
    // Update recent questions list
    const newRecent = questions.map(q => q.question);
    recentQuestions = [...new Set([...newRecent, ...recentQuestions])].slice(0, 20);
    localStorage.setItem(recentKey, JSON.stringify(recentQuestions));
    
    console.log('Final questions selected:', questions.length);
    console.log('Recent questions tracked:', recentQuestions.length);
    
    if (questions.length === 0) {
        alert('ERROR: No hay preguntas en el banco de datos.');
        window.location.href = '/student-dashboard';
    }
}

function getQuestionBank() {
    return [
        // Matemáticas - Fácil
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 5 + 3?', options: ['7', '8', '9', '10'], correctAnswer: 1 },
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 10 - 4?', options: ['5', '6', '7', '8'], correctAnswer: 1 },
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 3 × 4?', options: ['10', '11', '12', '13'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 20 ÷ 5?', options: ['3', '4', '5', '6'], correctAnswer: 1 },
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 7 + 8?', options: ['14', '15', '16', '17'], correctAnswer: 1 },
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 15 - 9?', options: ['5', '6', '7', '8'], correctAnswer: 1 },
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 6 × 2?', options: ['10', '11', '12', '13'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 18 ÷ 3?', options: ['5', '6', '7', '8'], correctAnswer: 1 },
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 9 + 6?', options: ['13', '14', '15', '16'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'easy', question: '¿Cuánto es 12 - 5?', options: ['6', '7', '8', '9'], correctAnswer: 1 },
        
        // Matemáticas - Media
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuánto es 15 × 8?', options: ['110', '115', '120', '125'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuánto es 144 ÷ 12?', options: ['10', '11', '12', '13'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuánto es 25²?', options: ['525', '575', '625', '675'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuál es la raíz cuadrada de 81?', options: ['7', '8', '9', '10'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuánto es 30% de 200?', options: ['50', '60', '70', '80'], correctAnswer: 1 },
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuánto es 2³ + 2²?', options: ['10', '11', '12', '13'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuánto es 7 × 13?', options: ['89', '90', '91', '92'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuánto es 169 ÷ 13?', options: ['11', '12', '13', '14'], correctAnswer: 2 },
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuánto es 45% de 80?', options: ['34', '36', '38', '40'], correctAnswer: 1 },
        { subject: 'Matemáticas', difficulty: 'medium', question: '¿Cuánto es 8² - 5²?', options: ['37', '38', '39', '40'], correctAnswer: 2 },
        
        // Ciencias - Fácil
        { subject: 'Ciencias', difficulty: 'easy', question: '¿Cuál es el planeta más cercano al Sol?', options: ['Venus', 'Mercurio', 'Tierra', 'Marte'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'easy', question: '¿Cuántos continentes hay?', options: ['5', '6', '7', '8'], correctAnswer: 2 },
        { subject: 'Ciencias', difficulty: 'easy', question: '¿Qué animal es el rey de la selva?', options: ['Tigre', 'León', 'Elefante', 'Gorila'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'easy', question: '¿De qué color es el cielo?', options: ['Verde', 'Rojo', 'Azul', 'Amarillo'], correctAnswer: 2 },
        { subject: 'Ciencias', difficulty: 'easy', question: '¿Cuántas patas tiene una araña?', options: ['6', '8', '10', '12'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'easy', question: '¿Qué necesitan las plantas para crecer?', options: ['Luz', 'Agua', 'Tierra', 'Todas'], correctAnswer: 3 },
        { subject: 'Ciencias', difficulty: 'easy', question: '¿Cuál es el órgano que bombea sangre?', options: ['Hígado', 'Corazón', 'Pulmón', 'Riñón'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'easy', question: '¿Qué gas respiramos?', options: ['Oxígeno', 'Nitrógeno', 'Hidrógeno', 'Helio'], correctAnswer: 0 },
        { subject: 'Ciencias', difficulty: 'easy', question: '¿Cuántos huesos tiene el cuerpo humano adulto?', options: ['186', '196', '206', '216'], correctAnswer: 2 },
        { subject: 'Ciencias', difficulty: 'easy', question: '¿Qué planeta es conocido como el planeta rojo?', options: ['Venus', 'Júpiter', 'Marte', 'Saturno'], correctAnswer: 2 },
        
        // Historia - Fácil
        { subject: 'Historia', difficulty: 'easy', question: '¿Quién descubrió América?', options: ['Marco Polo', 'Cristóbal Colón', 'Magallanes', 'Vespucio'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'easy', question: '¿En qué año llegó Colón a América?', options: ['1492', '1500', '1520', '1550'], correctAnswer: 0 },
        { subject: 'Historia', difficulty: 'easy', question: '¿Cuál fue la primera civilización?', options: ['Romana', 'Griega', 'Egipcia', 'Sumeria'], correctAnswer: 3 },
        { subject: 'Historia', difficulty: 'easy', question: '¿Quién fue el primer presidente de USA?', options: ['Jefferson', 'Washington', 'Lincoln', 'Roosevelt'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'easy', question: '¿En qué continente están las pirámides?', options: ['Asia', 'Europa', 'África', 'América'], correctAnswer: 2 },
        { subject: 'Historia', difficulty: 'easy', question: '¿Qué imperio construyó el Coliseo?', options: ['Griego', 'Romano', 'Persa', 'Egipcio'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'easy', question: '¿Quién pintó la Mona Lisa?', options: ['Miguel Ángel', 'Da Vinci', 'Rafael', 'Botticelli'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'easy', question: '¿Qué idioma hablaban los romanos?', options: ['Griego', 'Latín', 'Italiano', 'Español'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'easy', question: '¿Cuál es la capital de Francia?', options: ['Londres', 'Berlín', 'París', 'Roma'], correctAnswer: 2 },
        { subject: 'Historia', difficulty: 'easy', question: '¿Qué océano está al oeste de España?', options: ['Pacífico', 'Índico', 'Atlántico', 'Ártico'], correctAnswer: 2 },
        
        // Geografía - Fácil
        { subject: 'Geografía', difficulty: 'easy', question: '¿Cuál es el río más largo del mundo?', options: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'easy', question: '¿Cuál es el océano más grande?', options: ['Atlántico', 'Índico', 'Pacífico', 'Ártico'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'easy', question: '¿En qué continente está Brasil?', options: ['África', 'Asia', 'Europa', 'América'], correctAnswer: 3 },
        { subject: 'Geografía', difficulty: 'easy', question: '¿Cuál es el país más grande del mundo?', options: ['China', 'Canadá', 'USA', 'Rusia'], correctAnswer: 3 },
        { subject: 'Geografía', difficulty: 'easy', question: '¿Cuál es la capital de España?', options: ['Barcelona', 'Madrid', 'Valencia', 'Sevilla'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'easy', question: '¿Cuál es la montaña más alta del mundo?', options: ['K2', 'Everest', 'Kilimanjaro', 'Aconcagua'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'easy', question: '¿Cuántos océanos hay en el mundo?', options: ['3', '4', '5', '6'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'easy', question: '¿En qué continente está Egipto?', options: ['Asia', 'África', 'Europa', 'América'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'easy', question: '¿Cuál es el desierto más grande?', options: ['Gobi', 'Kalahari', 'Sahara', 'Atacama'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'easy', question: '¿Qué país tiene forma de bota?', options: ['España', 'Grecia', 'Italia', 'Portugal'], correctAnswer: 2 },
        
        // Geografía - Media
        { subject: 'Geografía', difficulty: 'medium', question: '¿Cuál es la capital de Australia?', options: ['Sídney', 'Melbourne', 'Canberra', 'Brisbane'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'medium', question: '¿Qué estrecho separa Europa de África?', options: ['Bósforo', 'Gibraltar', 'Magallanes', 'Bering'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'medium', question: '¿Cuál es el lago más profundo del mundo?', options: ['Superior', 'Victoria', 'Baikal', 'Tanganica'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'medium', question: '¿Cuántos países hay en África?', options: ['48', '52', '54', '58'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'medium', question: '¿Qué país tiene más islas?', options: ['Indonesia', 'Filipinas', 'Suecia', 'Noruega'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'medium', question: '¿Cuál es el volcán más alto de Europa?', options: ['Vesubio', 'Etna', 'Stromboli', 'Teide'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'medium', question: '¿Qué río atraviesa París?', options: ['Támesis', 'Sena', 'Danubio', 'Rin'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'medium', question: '¿Cuál es el país más pequeño del mundo?', options: ['Mónaco', 'Vaticano', 'San Marino', 'Liechtenstein'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'medium', question: '¿En qué continente está el monte Kilimanjaro?', options: ['Asia', 'América', 'África', 'Oceanía'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'medium', question: '¿Cuál es la capital de Canadá?', options: ['Toronto', 'Montreal', 'Vancouver', 'Ottawa'], correctAnswer: 3 },
        
        // Geografía - Difícil
        { subject: 'Geografía', difficulty: 'hard', question: '¿Cuál es el punto más bajo de la Tierra?', options: ['Valle de la Muerte', 'Mar Muerto', 'Depresión de Qattara', 'Fosa de las Marianas'], correctAnswer: 3 },
        { subject: 'Geografía', difficulty: 'hard', question: '¿Cuántos husos horarios tiene Rusia?', options: ['9', '11', '13', '15'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'hard', question: '¿Qué país tiene el mayor número de lagos del mundo?', options: ['Finlandia', 'Canadá', 'Suecia', 'Rusia'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'hard', question: '¿Cuál es la capital de Kazajistán?', options: ['Almaty', 'Astana', 'Bishkek', 'Tashkent'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'hard', question: '¿Qué océano baña las costas de Yemen?', options: ['Índico', 'Pacífico', 'Atlántico', 'Ártico'], correctAnswer: 0 },
        { subject: 'Geografía', difficulty: 'hard', question: '¿Cuál es el archipiélago más grande del mundo?', options: ['Japón', 'Filipinas', 'Indonesia', 'Maldivas'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'hard', question: '¿Qué cordillera separa Europa de Asia?', options: ['Himalaya', 'Cáucaso', 'Urales', 'Alpes'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'hard', question: '¿Cuál es el desierto más árido del mundo?', options: ['Sahara', 'Gobi', 'Atacama', 'Kalahari'], correctAnswer: 2 },
        { subject: 'Geografía', difficulty: 'hard', question: '¿Cuántos países tienen costa en el Mar Mediterráneo?', options: ['18', '21', '24', '27'], correctAnswer: 1 },
        { subject: 'Geografía', difficulty: 'hard', question: '¿Qué país es atravesado por el Trópico de Capricornio?', options: ['Colombia', 'Venezuela', 'Brasil', 'Perú'], correctAnswer: 2 },
        
        // Historia - Media
        { subject: 'Historia', difficulty: 'medium', question: '¿En qué año cayó el Muro de Berlín?', options: ['1987', '1989', '1991', '1993'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'medium', question: '¿Quién fue el primer emperador de Roma?', options: ['Julio César', 'Augusto', 'Nerón', 'Trajano'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'medium', question: '¿En qué año comenzó la Segunda Guerra Mundial?', options: ['1937', '1939', '1941', '1943'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'medium', question: '¿Quién escribió "El Quijote"?', options: ['Lope de Vega', 'Cervantes', 'Góngora', 'Quevedo'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'medium', question: '¿Qué revolución comenzó en 1789?', options: ['Americana', 'Francesa', 'Rusa', 'Industrial'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'medium', question: '¿Quién fue Cleopatra?', options: ['Reina de Egipto', 'Emperatriz romana', 'Diosa griega', 'Reina persa'], correctAnswer: 0 },
        { subject: 'Historia', difficulty: 'medium', question: '¿En qué siglo vivió Leonardo da Vinci?', options: ['XIV', 'XV', 'XVI', 'XVII'], correctAnswer: 2 },
        { subject: 'Historia', difficulty: 'medium', question: '¿Qué imperio conquistó Hernán Cortés?', options: ['Inca', 'Maya', 'Azteca', 'Olmeca'], correctAnswer: 2 },
        { subject: 'Historia', difficulty: 'medium', question: '¿Quién inventó la imprenta?', options: ['Edison', 'Gutenberg', 'Bell', 'Tesla'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'medium', question: '¿En qué año se descubrió América?', options: ['1492', '1498', '1500', '1502'], correctAnswer: 0 },
        
        // Historia - Difícil
        { subject: 'Historia', difficulty: 'hard', question: '¿Cuánto duró la Guerra de los Cien Años?', options: ['100 años', '116 años', '130 años', '150 años'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'hard', question: '¿Quién fue el último zar de Rusia?', options: ['Alejandro II', 'Alejandro III', 'Nicolás I', 'Nicolás II'], correctAnswer: 3 },
        { subject: 'Historia', difficulty: 'hard', question: '¿En qué batalla fue derrotado Napoleón definitivamente?', options: ['Austerlitz', 'Borodino', 'Leipzig', 'Waterloo'], correctAnswer: 3 },
        { subject: 'Historia', difficulty: 'hard', question: '¿Qué tratado puso fin a la Primera Guerra Mundial?', options: ['Viena', 'Versalles', 'París', 'Tordesillas'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'hard', question: '¿En qué año cayó Constantinopla?', options: ['1204', '1453', '1492', '1517'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'hard', question: '¿Quién fue el líder de la Revolución Rusa de 1917?', options: ['Stalin', 'Trotsky', 'Lenin', 'Kerensky'], correctAnswer: 2 },
        { subject: 'Historia', difficulty: 'hard', question: '¿Qué civilización construyó Machu Picchu?', options: ['Azteca', 'Maya', 'Inca', 'Tolteca'], correctAnswer: 2 },
        { subject: 'Historia', difficulty: 'hard', question: '¿En qué año se firmó la Carta Magna?', options: ['1066', '1215', '1348', '1492'], correctAnswer: 1 },
        { subject: 'Historia', difficulty: 'hard', question: '¿Quién fue el primer faraón del Antiguo Egipto?', options: ['Tutankamón', 'Ramsés II', 'Narmer', 'Keops'], correctAnswer: 2 },
        { subject: 'Historia', difficulty: 'hard', question: '¿Qué guerra duró desde 1618 hasta 1648?', options: ['De los Cien Años', 'De los Treinta Años', 'De Sucesión', 'De las Rosas'], correctAnswer: 1 },
        
        // Ciencias - Media
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Cuál es la velocidad de la luz?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], correctAnswer: 0 },
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Qué es el ADN?', options: ['Una proteína', 'Ácido desoxirribonucleico', 'Un carbohidrato', 'Una enzima'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Cuántos planetas tiene el Sistema Solar?', options: ['7', '8', '9', '10'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Qué órgano produce la insulina?', options: ['Hígado', 'Páncreas', 'Riñón', 'Bazo'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Cuál es el elemento más abundante en el universo?', options: ['Oxígeno', 'Carbono', 'Hidrógeno', 'Helio'], correctAnswer: 2 },
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Qué tipo de animal es una ballena?', options: ['Pez', 'Mamífero', 'Reptil', 'Anfibio'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Cuántos cromosomas tiene el ser humano?', options: ['23', '46', '48', '50'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Qué científico propuso la teoría de la relatividad?', options: ['Newton', 'Einstein', 'Galileo', 'Tesla'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Cuál es el hueso más largo del cuerpo humano?', options: ['Húmero', 'Tibia', 'Fémur', 'Radio'], correctAnswer: 2 },
        { subject: 'Ciencias', difficulty: 'medium', question: '¿Qué produce la fotosíntesis?', options: ['CO2', 'Oxígeno', 'Nitrógeno', 'Agua'], correctAnswer: 1 },
        
        // Ciencias - Difícil
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Cuántos átomos hay aproximadamente en el cuerpo humano?', options: ['7 trillones', '37 trillones', '7 cuatrillones', '37 cuatrillones'], correctAnswer: 2 },
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Qué partícula subatómica tiene carga negativa?', options: ['Protón', 'Neutrón', 'Electrón', 'Positrón'], correctAnswer: 2 },
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Cuál es la constante de Planck?', options: ['3.14', '6.626 × 10⁻³⁴', '9.8', '1.602 × 10⁻¹⁹'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Qué es un agujero negro?', options: ['Estrella muerta', 'Planeta oscuro', 'Región con gravedad extrema', 'Galaxia oscura'], correctAnswer: 2 },
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Cuántos enlaces puede formar el carbono?', options: ['2', '3', '4', '5'], correctAnswer: 2 },
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Qué es la mitocondria?', options: ['Núcleo celular', 'Central energética', 'Membrana', 'Citoplasma'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Cuál es la fórmula del agua oxigenada?', options: ['H2O', 'H2O2', 'HO2', 'H3O'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Qué descubrió Marie Curie?', options: ['Penicilina', 'Radio', 'ADN', 'Electricidad'], correctAnswer: 1 },
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Cuánto dura un año luz?', options: ['Distancia', 'Tiempo', 'Velocidad', 'Energía'], correctAnswer: 0 },
        { subject: 'Ciencias', difficulty: 'hard', question: '¿Qué es la entropía?', options: ['Energía', 'Desorden', 'Temperatura', 'Presión'], correctAnswer: 1 },
        
        // PROGRAMACIÓN - Fácil
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué significa HTML?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'], correctAnswer: 0 },
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué lenguaje se usa para dar estilo a páginas web?', options: ['HTML', 'CSS', 'JavaScript', 'Python'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué símbolo se usa para comentarios en Python?', options: ['//', '#', '/*', '--'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué es una variable?', options: ['Un número', 'Un contenedor de datos', 'Una función', 'Un bucle'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué hace el comando "print" en Python?', options: ['Imprime en impresora', 'Muestra texto en pantalla', 'Guarda archivo', 'Cierra programa'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué es JavaScript?', options: ['Un lenguaje de programación', 'Una marca de café', 'Un sistema operativo', 'Una base de datos'], correctAnswer: 0 },
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué extensión tienen los archivos de Python?', options: ['.js', '.html', '.py', '.java'], correctAnswer: 2 },
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué significa CSS?', options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Code Style Sheets'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué es un bucle "for"?', options: ['Un error', 'Una repetición', 'Una variable', 'Un comentario'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'easy', question: '¿Qué es Git?', options: ['Un lenguaje', 'Control de versiones', 'Un navegador', 'Una base de datos'], correctAnswer: 1 },
        
        // PROGRAMACIÓN - Media
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué es un array?', options: ['Una función', 'Una lista de elementos', 'Un bucle', 'Una clase'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué es JSON?', options: ['Un lenguaje', 'Formato de datos', 'Una base de datos', 'Un framework'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué hace "console.log" en JavaScript?', options: ['Crea variables', 'Muestra información en consola', 'Guarda datos', 'Borra código'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué es una API?', options: ['Un lenguaje', 'Interfaz de programación', 'Un algoritmo', 'Una función'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué es SQL?', options: ['Lenguaje de consultas', 'Sistema operativo', 'Navegador web', 'Editor de texto'], correctAnswer: 0 },
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué es Node.js?', options: ['Base de datos', 'Entorno de JavaScript', 'Lenguaje nuevo', 'Framework CSS'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué es una función recursiva?', options: ['Que se llama a sí misma', 'Que usa bucles', 'Que es muy larga', 'Que usa variables'], correctAnswer: 0 },
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué es React?', options: ['Lenguaje de programación', 'Librería de JavaScript', 'Base de datos', 'Sistema operativo'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué es un algoritmo?', options: ['Un error', 'Secuencia de pasos', 'Un lenguaje', 'Una variable'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'medium', question: '¿Qué hace el método "push" en arrays?', options: ['Elimina elemento', 'Agrega elemento', 'Ordena array', 'Vacía array'], correctAnswer: 1 },
        
        // PROGRAMACIÓN - Difícil
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es Big O notation?', options: ['Mide complejidad', 'Tipo de variable', 'Un lenguaje', 'Un framework'], correctAnswer: 0 },
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es una closure en JavaScript?', options: ['Función que recuerda su entorno', 'Un bucle cerrado', 'Un error', 'Una clase'], correctAnswer: 0 },
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es REST API?', options: ['Base de datos', 'Estilo arquitectónico', 'Lenguaje', 'Sistema operativo'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es Docker?', options: ['Lenguaje', 'Plataforma de contenedores', 'Base de datos', 'Editor'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es GraphQL?', options: ['Base de datos', 'Lenguaje de consultas', 'Framework', 'Librería'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es TypeScript?', options: ['JavaScript con tipos', 'Lenguaje diferente', 'Framework', 'Base de datos'], correctAnswer: 0 },
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es WebSocket?', options: ['Protocolo bidireccional', 'Base de datos', 'Lenguaje', 'Framework'], correctAnswer: 0 },
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es Kubernetes?', options: ['Lenguaje', 'Orquestador de contenedores', 'Base de datos', 'Editor'], correctAnswer: 1 },
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es el patrón MVC?', options: ['Modelo-Vista-Controlador', 'Método-Variable-Clase', 'Manual-Visual-Code', 'Module-View-Component'], correctAnswer: 0 },
        { subject: 'Programación', difficulty: 'hard', question: '¿Qué es un deadlock?', options: ['Bloqueo mutuo', 'Error de sintaxis', 'Tipo de bucle', 'Variable bloqueada'], correctAnswer: 0 },
        
        // IDIOMAS (Inglés) - Fácil
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Cómo se dice "Hola" en inglés?', options: ['Goodbye', 'Hello', 'Thanks', 'Please'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Qué significa "Cat"?', options: ['Perro', 'Gato', 'Pájaro', 'Pez'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Cómo se dice "Gracias"?', options: ['Please', 'Sorry', 'Thank you', 'Welcome'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Qué significa "Red"?', options: ['Azul', 'Verde', 'Rojo', 'Amarillo'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Cómo se dice "Agua"?', options: ['Water', 'Fire', 'Earth', 'Air'], correctAnswer: 0 },
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Qué significa "Book"?', options: ['Mesa', 'Silla', 'Libro', 'Puerta'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Cómo se dice "Casa"?', options: ['Car', 'House', 'Tree', 'Road'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Qué significa "Apple"?', options: ['Naranja', 'Plátano', 'Manzana', 'Uva'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Cómo se dice "Buenas noches"?', options: ['Good morning', 'Good afternoon', 'Good night', 'Good day'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'easy', question: '¿Qué significa "Dog"?', options: ['Gato', 'Perro', 'Ratón', 'Caballo'], correctAnswer: 1 },
        
        // IDIOMAS - Media
        { subject: 'Idiomas', difficulty: 'medium', question: 'What is the past tense of "go"?', options: ['Goed', 'Went', 'Gone', 'Going'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'medium', question: '¿Qué significa "Beautiful"?', options: ['Feo', 'Grande', 'Hermoso', 'Pequeño'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'medium', question: 'How do you say "I am learning"?', options: ['I learn', 'I learning', 'I am learning', 'I learned'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'medium', question: '¿Qué significa "Although"?', options: ['Porque', 'Aunque', 'Entonces', 'Pero'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'medium', question: 'What is the plural of "Child"?', options: ['Childs', 'Children', 'Childes', 'Childer'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'medium', question: '¿Qué significa "Worried"?', options: ['Feliz', 'Triste', 'Preocupado', 'Enfadado'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'medium', question: 'Choose the correct: "She ___ to school"', options: ['go', 'goes', 'going', 'gone'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'medium', question: '¿Qué significa "Knowledge"?', options: ['Poder', 'Conocimiento', 'Riqueza', 'Sabiduría'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'medium', question: 'What is the opposite of "Expensive"?', options: ['Cheap', 'Rich', 'Poor', 'Free'], correctAnswer: 0 },
        { subject: 'Idiomas', difficulty: 'medium', question: '¿Qué significa "Journey"?', options: ['Destino', 'Viaje', 'Camino', 'Aventura'], correctAnswer: 1 },
        
        // IDIOMAS - Difícil
        { subject: 'Idiomas', difficulty: 'hard', question: 'What does "Serendipity" mean?', options: ['Tristeza', 'Descubrimiento afortunado', 'Destino', 'Casualidad'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'hard', question: 'Choose correct: "If I ___ rich, I would travel"', options: ['am', 'was', 'were', 'be'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'hard', question: '¿Qué significa "Ubiquitous"?', options: ['Raro', 'Omnipresente', 'Antiguo', 'Moderno'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'hard', question: 'What is a synonym for "Eloquent"?', options: ['Silent', 'Articulate', 'Confused', 'Simple'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'hard', question: '¿Qué significa "Ephemeral"?', options: ['Eterno', 'Efímero', 'Antiguo', 'Nuevo'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'hard', question: 'Past perfect of "to write"', options: ['Wrote', 'Written', 'Had written', 'Was writing'], correctAnswer: 2 },
        { subject: 'Idiomas', difficulty: 'hard', question: '¿Qué significa "Benevolent"?', options: ['Malvado', 'Benevolente', 'Indiferente', 'Cruel'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'hard', question: 'What is a "Palindrome"?', options: ['Palabra que se lee igual', 'Tipo de poema', 'Figura retórica', 'Acento'], correctAnswer: 0 },
        { subject: 'Idiomas', difficulty: 'hard', question: '¿Qué significa "Juxtapose"?', options: ['Separar', 'Yuxtaponer', 'Comparar', 'Contrastar'], correctAnswer: 1 },
        { subject: 'Idiomas', difficulty: 'hard', question: 'Choose: "She wished she ___ studied more"', options: ['has', 'have', 'had', 'having'], correctAnswer: 2 },
        
        // ARTE - Fácil
        { subject: 'Arte', difficulty: 'easy', question: '¿Quién pintó "La Noche Estrellada"?', options: ['Picasso', 'Van Gogh', 'Dalí', 'Monet'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'easy', question: '¿Cuántos colores tiene el arcoíris?', options: ['5', '6', '7', '8'], correctAnswer: 2 },
        { subject: 'Arte', difficulty: 'easy', question: '¿Qué colores primarios existen?', options: ['Rojo, azul, amarillo', 'Verde, morado, naranja', 'Negro, blanco, gris', 'Rosa, celeste, café'], correctAnswer: 0 },
        { subject: 'Arte', difficulty: 'easy', question: '¿Qué es una escultura?', options: ['Pintura', 'Obra tridimensional', 'Dibujo', 'Fotografía'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'easy', question: '¿Quién pintó la Mona Lisa?', options: ['Miguel Ángel', 'Da Vinci', 'Rafael', 'Donatello'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'easy', question: '¿Qué técnica usa agua?', options: ['Óleo', 'Acuarela', 'Acrílico', 'Pastel'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'easy', question: '¿Qué mezclando azul y amarillo?', options: ['Rojo', 'Verde', 'Morado', 'Naranja'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'easy', question: '¿Dónde está el Museo del Louvre?', options: ['Londres', 'París', 'Roma', 'Madrid'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'easy', question: '¿Qué es un boceto?', options: ['Dibujo final', 'Dibujo preliminar', 'Pintura', 'Escultura'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'easy', question: '¿Qué pintor se cortó una oreja?', options: ['Picasso', 'Van Gogh', 'Goya', 'Velázquez'], correctAnswer: 1 },
        
        // ARTE - Media
        { subject: 'Arte', difficulty: 'medium', question: '¿Qué es el cubismo?', options: ['Movimiento artístico', 'Técnica de pintura', 'Tipo de escultura', 'Estilo musical'], correctAnswer: 0 },
        { subject: 'Arte', difficulty: 'medium', question: '¿Quién pintó "El Grito"?', options: ['Van Gogh', 'Munch', 'Picasso', 'Dalí'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'medium', question: '¿Qué es el claroscuro?', options: ['Contraste luz-sombra', 'Tipo de pintura', 'Técnica escultórica', 'Estilo musical'], correctAnswer: 0 },
        { subject: 'Arte', difficulty: 'medium', question: '¿Quién pintó "Guernica"?', options: ['Picasso', 'Dalí', 'Miró', 'Goya'], correctAnswer: 0 },
        { subject: 'Arte', difficulty: 'medium', question: '¿Qué es la perspectiva?', options: ['Color', 'Profundidad en 2D', 'Tipo de pincel', 'Técnica de grabado'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'medium', question: '¿En qué siglo fue el Renacimiento?', options: ['XIII', 'XIV-XVI', 'XVII', 'XVIII'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'medium', question: '¿Qué museo tiene el David de Miguel Ángel?', options: ['Louvre', 'Prado', 'Uffizi', 'MET'], correctAnswer: 2 },
        { subject: 'Arte', difficulty: 'medium', question: '¿Qué es el surrealismo?', options: ['Arte realista', 'Arte de sueños', 'Arte geométrico', 'Arte clásico'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'medium', question: '¿Quién pintó "Las Meninas"?', options: ['Goya', 'El Greco', 'Velázquez', 'Murillo'], correctAnswer: 2 },
        { subject: 'Arte', difficulty: 'medium', question: '¿Qué es un fresco?', options: ['Pintura sobre yeso húmedo', 'Tipo de escultura', 'Técnica de grabado', 'Pintura al óleo'], correctAnswer: 0 },
        
        // ARTE - Difícil
        { subject: 'Arte', difficulty: 'hard', question: '¿Qué es el tenebrismo?', options: ['Uso dramático de luz', 'Estilo alegre', 'Pintura abstracta', 'Arte minimalista'], correctAnswer: 0 },
        { subject: 'Arte', difficulty: 'hard', question: '¿Quién fundó el movimiento Bauhaus?', options: ['Kandinsky', 'Gropius', 'Mondrian', 'Klee'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'hard', question: '¿Qué técnica usaba Caravaggio?', options: ['Sfumato', 'Tenebrismo', 'Pointillismo', 'Impresionismo'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'hard', question: '¿Qué es el art nouveau?', options: ['Arte moderno', 'Arte decorativo 1890-1910', 'Arte contemporáneo', 'Arte digital'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'hard', question: '¿Quién pintó "El jardín de las delicias"?', options: ['El Bosco', 'Brueghel', 'Bosch', 'Van Eyck'], correctAnswer: 0 },
        { subject: 'Arte', difficulty: 'hard', question: '¿Qué es el fauvismo?', options: ['Uso expresivo del color', 'Arte geométrico', 'Arte realista', 'Arte digital'], correctAnswer: 0 },
        { subject: 'Arte', difficulty: 'hard', question: '¿Quién creó los "ready-made"?', options: ['Picasso', 'Duchamp', 'Warhol', 'Pollock'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'hard', question: '¿Qué es el action painting?', options: ['Pintura gestual', 'Pintura realista', 'Pintura digital', 'Pintura abstracta'], correctAnswer: 0 },
        { subject: 'Arte', difficulty: 'hard', question: '¿Quién pintó "Composición con rojo, amarillo y azul"?', options: ['Kandinsky', 'Mondrian', 'Malevich', 'Rothko'], correctAnswer: 1 },
        { subject: 'Arte', difficulty: 'hard', question: '¿Qué es el divisionismo?', options: ['Puntos de color', 'Líneas', 'Formas geométricas', 'Manchas'], correctAnswer: 0 },
        
        // =====================================================
        // ASTRONOMÍA - PREGUNTAS EXCLUSIVAS
        // =====================================================
        
        // Astronomía - Fácil
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cuál es el planeta más cercano al Sol?', options: ['Venus', 'Mercurio', 'Tierra', 'Marte'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cuántos planetas tiene el Sistema Solar?', options: ['7', '8', '9', '10'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué estrella está más cerca de la Tierra?', options: ['Sirio', 'El Sol', 'Alfa Centauri', 'Vega'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cuál es el satélite natural de la Tierra?', options: ['Fobos', 'La Luna', 'Europa', 'Titán'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué planeta es conocido como el planeta rojo?', options: ['Venus', 'Júpiter', 'Marte', 'Saturno'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué planeta tiene anillos visibles?', options: ['Júpiter', 'Saturno', 'Urano', 'Neptuno'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cuál es el planeta más grande del Sistema Solar?', options: ['Saturno', 'Júpiter', 'Urano', 'Neptuno'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué causa las fases de la Luna?', options: ['Eclipses', 'Posición respecto al Sol', 'Nubes', 'Rotación'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cuánto tarda la Tierra en dar una vuelta al Sol?', options: ['30 días', '365 días', '24 horas', '7 días'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué es una constelación?', options: ['Un planeta', 'Grupo de estrellas', 'Un satélite', 'Un cometa'], correctAnswer: 1 },
        
        // Astronomía - Media
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Cuál es la galaxia más cercana a la Vía Láctea?', options: ['Andrómeda', 'Triángulo', 'Sombrero', 'Remolino'], correctAnswer: 0 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué es un año luz?', options: ['Tiempo', 'Distancia', 'Velocidad', 'Energía'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Cuántas lunas tiene Júpiter aproximadamente?', options: ['16', '53', '79', '95'], correctAnswer: 3 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué planeta rota sobre su lado?', options: ['Venus', 'Urano', 'Neptuno', 'Saturno'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué es un eclipse solar?', options: ['Luna entre Sol y Tierra', 'Tierra entre Sol y Luna', 'Sol entre Tierra y Luna', 'Alineación de planetas'], correctAnswer: 0 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Cuál es la luna más grande de nuestro Sistema Solar?', options: ['Luna', 'Europa', 'Ganímedes', 'Titán'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué es el cinturón de asteroides?', options: ['Anillo de Saturno', 'Zona entre Marte y Júpiter', 'Lluvia de meteoros', 'Órbita de cometas'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué tipo de estrella es el Sol?', options: ['Gigante roja', 'Enana blanca', 'Enana amarilla', 'Supergigante'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Cuánto tarda la luz del Sol en llegar a la Tierra?', options: ['1 segundo', '8 minutos', '1 hora', '1 día'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué planeta tiene la Gran Mancha Roja?', options: ['Marte', 'Júpiter', 'Saturno', 'Neptuno'], correctAnswer: 1 },
        
        // Astronomía - Difícil
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es una enana blanca?', options: ['Planeta pequeño', 'Estrella en muerte', 'Asteroide', 'Agujero negro pequeño'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Cuál es la temperatura del núcleo del Sol?', options: ['1 millón °C', '5 millones °C', '15 millones °C', '100 millones °C'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es la materia oscura?', options: ['Agujeros negros', 'Materia invisible que afecta gravedad', 'Polvo cósmico', 'Antimateria'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es una supernova?', options: ['Estrella naciente', 'Explosión estelar', 'Galaxia pequeña', 'Planeta gaseoso'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Cuántas estrellas tiene la Vía Láctea aproximadamente?', options: ['1 millón', '100 millones', '100-400 mil millones', '1 billón'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es un púlsar?', options: ['Estrella giratoria que emite radiación', 'Tipo de cometa', 'Galaxia activa', 'Nebulosa'], correctAnswer: 0 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es el horizonte de eventos?', options: ['Límite de agujero negro', 'Línea del horizonte', 'Eclipse total', 'Órbita planetaria'], correctAnswer: 0 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Cuál es la edad aproximada del universo?', options: ['4.5 mil millones años', '10 mil millones años', '13.8 mil millones años', '20 mil millones años'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es la radiación cósmica de fondo?', options: ['Luz de estrellas', 'Eco del Big Bang', 'Radiación solar', 'Rayos gamma'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es un cuásar?', options: ['Tipo de estrella', 'Núcleo galáctico superactivo', 'Planeta errante', 'Cometa grande'], correctAnswer: 1 },
        
        // =====================================================
        // BIOLOGÍA - PREGUNTAS EXCLUSIVAS
        // =====================================================
        
        // Biología - Fácil
        { subject: 'Biología', difficulty: 'easy', question: '¿Cuántos huesos tiene el cuerpo humano adulto?', options: ['186', '196', '206', '216'], correctAnswer: 2 },
        { subject: 'Biología', difficulty: 'easy', question: '¿Cuál es el órgano que bombea sangre?', options: ['Hígado', 'Corazón', 'Pulmón', 'Riñón'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'easy', question: '¿Qué gas respiramos?', options: ['Oxígeno', 'Nitrógeno', 'Hidrógeno', 'Helio'], correctAnswer: 0 },
        { subject: 'Biología', difficulty: 'easy', question: '¿Cuántas patas tiene una araña?', options: ['6', '8', '10', '12'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'easy', question: '¿Qué animal es el rey de la selva?', options: ['Tigre', 'León', 'Elefante', 'Gorila'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'easy', question: '¿Qué necesitan las plantas para crecer?', options: ['Luz', 'Agua', 'Tierra', 'Todas'], correctAnswer: 3 },
        { subject: 'Biología', difficulty: 'easy', question: '¿Cuántos sentidos tiene el ser humano?', options: ['3', '4', '5', '6'], correctAnswer: 2 },
        { subject: 'Biología', difficulty: 'easy', question: '¿Cuál es el órgano más grande del cuerpo?', options: ['Hígado', 'Piel', 'Intestino', 'Cerebro'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'easy', question: '¿Qué tipo de animal es la ballena?', options: ['Pez', 'Mamífero', 'Reptil', 'Anfibio'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'easy', question: '¿Dónde se produce la fotosíntesis?', options: ['Raíz', 'Tallo', 'Hojas', 'Flores'], correctAnswer: 2 },
        
        // Biología - Media
        { subject: 'Biología', difficulty: 'medium', question: '¿Qué es el ADN?', options: ['Una proteína', 'Ácido desoxirribonucleico', 'Un carbohidrato', 'Una enzima'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'medium', question: '¿Cuántos cromosomas tiene el ser humano?', options: ['23', '46', '48', '50'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'medium', question: '¿Qué órgano produce la insulina?', options: ['Hígado', 'Páncreas', 'Riñón', 'Bazo'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'medium', question: '¿Cuál es el hueso más largo del cuerpo humano?', options: ['Húmero', 'Tibia', 'Fémur', 'Radio'], correctAnswer: 2 },
        { subject: 'Biología', difficulty: 'medium', question: '¿Qué produce la fotosíntesis?', options: ['CO2', 'Oxígeno', 'Nitrógeno', 'Metano'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'medium', question: '¿Qué es la mitosis?', options: ['División celular', 'Reproducción sexual', 'Respiración', 'Digestión'], correctAnswer: 0 },
        { subject: 'Biología', difficulty: 'medium', question: '¿Cuántos tipos de células sanguíneas hay?', options: ['2', '3', '4', '5'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'medium', question: '¿Qué es el sistema inmunológico?', options: ['Sistema digestivo', 'Sistema de defensa', 'Sistema nervioso', 'Sistema muscular'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'medium', question: '¿Cuál es la función del riñón?', options: ['Producir sangre', 'Filtrar desechos', 'Producir hormonas', 'Almacenar energía'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'medium', question: '¿Qué son los glóbulos rojos?', options: ['Células de defensa', 'Células que transportan oxígeno', 'Células nerviosas', 'Células musculares'], correctAnswer: 1 },
        
        // Biología - Difícil
        { subject: 'Biología', difficulty: 'hard', question: '¿Qué es la mitocondria?', options: ['Núcleo celular', 'Central energética', 'Membrana', 'Citoplasma'], correctAnswer: 1 },
        { subject: 'Biología', difficulty: 'hard', question: '¿Cuántos genes tiene el ser humano aproximadamente?', options: ['5,000', '10,000', '20,000', '50,000'], correctAnswer: 2 },
        { subject: 'Biología', difficulty: 'hard', question: '¿Qué es el ARN mensajero?', options: ['Copia del ADN', 'Proteína', 'Lípido', 'Carbohidrato'], correctAnswer: 0 },
        { subject: 'Biología', difficulty: 'hard', question: '¿Qué es la meiosis?', options: ['División para gametos', 'División normal', 'Fusión celular', 'Muerte celular'], correctAnswer: 0 },
        { subject: 'Biología', difficulty: 'hard', question: '¿Cuántos pares de cromosomas tiene el ser humano?', options: ['21', '22', '23', '24'], correctAnswer: 2 },
        { subject: 'Biología', difficulty: 'hard', question: '¿Qué es el retículo endoplasmático?', options: ['Organelo de síntesis', 'Núcleo', 'Membrana exterior', 'Vacuola'], correctAnswer: 0 },
        { subject: 'Biología', difficulty: 'hard', question: '¿Qué son los ribosomas?', options: ['Productores de proteínas', 'Productores de energía', 'Almacenes de lípidos', 'Digestores celulares'], correctAnswer: 0 },
        { subject: 'Biología', difficulty: 'hard', question: '¿Qué es la apoptosis?', options: ['Muerte celular programada', 'División celular', 'Fusión celular', 'Crecimiento celular'], correctAnswer: 0 },
        { subject: 'Biología', difficulty: 'hard', question: '¿Cuántas neuronas tiene el cerebro humano?', options: ['1 millón', '100 millones', '86 mil millones', '1 billón'], correctAnswer: 2 },
        { subject: 'Biología', difficulty: 'hard', question: '¿Qué es CRISPR?', options: ['Proteína', 'Técnica de edición genética', 'Tipo de célula', 'Hormona'], correctAnswer: 1 },
        
        // =====================================================
        // QUÍMICA - PREGUNTAS EXCLUSIVAS
        // =====================================================
        
        // Química - Fácil
        { subject: 'Química', difficulty: 'easy', question: '¿Cuál es el símbolo del agua?', options: ['O2', 'CO2', 'H2O', 'NaCl'], correctAnswer: 2 },
        { subject: 'Química', difficulty: 'easy', question: '¿Cuántos elementos hay en la tabla periódica?', options: ['100', '108', '118', '128'], correctAnswer: 2 },
        { subject: 'Química', difficulty: 'easy', question: '¿Cuál es el símbolo del oro?', options: ['Ag', 'Au', 'Fe', 'Cu'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'easy', question: '¿Qué gas usamos para respirar?', options: ['Nitrógeno', 'Oxígeno', 'Hidrógeno', 'Helio'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'easy', question: '¿De qué está hecha la sal de mesa?', options: ['Sodio y cloro', 'Potasio', 'Calcio', 'Magnesio'], correctAnswer: 0 },
        { subject: 'Química', difficulty: 'easy', question: '¿Cuál es el símbolo del hierro?', options: ['Hi', 'Ir', 'Fe', 'He'], correctAnswer: 2 },
        { subject: 'Química', difficulty: 'easy', question: '¿Qué elemento es el más abundante en el universo?', options: ['Oxígeno', 'Carbono', 'Hidrógeno', 'Helio'], correctAnswer: 2 },
        { subject: 'Química', difficulty: 'easy', question: '¿Cuántos estados de la materia hay?', options: ['2', '3', '4', '5'], correctAnswer: 2 },
        { subject: 'Química', difficulty: 'easy', question: '¿Qué gas producen las plantas?', options: ['CO2', 'O2', 'N2', 'H2'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'easy', question: '¿De qué color es el cobre?', options: ['Gris', 'Amarillo', 'Naranja-rojizo', 'Blanco'], correctAnswer: 2 },
        
        // Química - Media
        { subject: 'Química', difficulty: 'medium', question: '¿Cuál es el número atómico del carbono?', options: ['4', '6', '8', '12'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'medium', question: '¿Qué es un ion?', options: ['Átomo con carga', 'Molécula', 'Elemento', 'Compuesto'], correctAnswer: 0 },
        { subject: 'Química', difficulty: 'medium', question: '¿Cuál es la fórmula del agua oxigenada?', options: ['H2O', 'H2O2', 'HO2', 'H3O'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'medium', question: '¿Qué tipo de enlace tiene el agua?', options: ['Iónico', 'Covalente', 'Metálico', 'Van der Waals'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'medium', question: '¿Cuántos enlaces puede formar el carbono?', options: ['2', '3', '4', '5'], correctAnswer: 2 },
        { subject: 'Química', difficulty: 'medium', question: '¿Qué es el pH?', options: ['Presión', 'Medida de acidez', 'Temperatura', 'Densidad'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'medium', question: '¿Cuál es el gas más abundante en la atmósfera?', options: ['Oxígeno', 'CO2', 'Nitrógeno', 'Argón'], correctAnswer: 2 },
        { subject: 'Química', difficulty: 'medium', question: '¿Qué es una reacción exotérmica?', options: ['Absorbe calor', 'Libera calor', 'Sin cambio de calor', 'Cambio de estado'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'medium', question: '¿Cuántos electrones tiene el oxígeno?', options: ['6', '8', '10', '12'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'medium', question: '¿Qué es un catalizador?', options: ['Acelera reacciones', 'Frena reacciones', 'Produce energía', 'Absorbe gases'], correctAnswer: 0 },
        
        // Química - Difícil
        { subject: 'Química', difficulty: 'hard', question: '¿Qué es la electronegatividad?', options: ['Capacidad de atraer electrones', 'Número de protones', 'Número de neutrones', 'Masa atómica'], correctAnswer: 0 },
        { subject: 'Química', difficulty: 'hard', question: '¿Cuál es el número de Avogadro?', options: ['3.14 × 10²³', '6.022 × 10²³', '9.8 × 10²³', '1.6 × 10²³'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'hard', question: '¿Qué es un isótopo?', options: ['Mismo elemento, diferente masa', 'Diferente elemento', 'Molécula', 'Ion'], correctAnswer: 0 },
        { subject: 'Química', difficulty: 'hard', question: '¿Qué es la entalpía?', options: ['Presión', 'Contenido de calor', 'Volumen', 'Temperatura'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'hard', question: '¿Cuál elemento tiene el símbolo W?', options: ['Wolframio', 'Vanadio', 'Zinc', 'Xenón'], correctAnswer: 0 },
        { subject: 'Química', difficulty: 'hard', question: '¿Qué es la hibridación sp³?', options: ['Enlace simple', 'Configuración tetraédrica', 'Enlace doble', 'Enlace triple'], correctAnswer: 1 },
        { subject: 'Química', difficulty: 'hard', question: '¿Qué es un mol?', options: ['6.022 × 10²³ partículas', 'Unidad de masa', 'Unidad de volumen', 'Unidad de presión'], correctAnswer: 0 },
        { subject: 'Química', difficulty: 'hard', question: '¿Cuál es el ácido más fuerte?', options: ['HCl', 'H2SO4', 'HF', 'HClO4'], correctAnswer: 3 },
        { subject: 'Química', difficulty: 'hard', question: '¿Qué es la ley de conservación de la masa?', options: ['Masa se crea', 'Masa se destruye', 'Masa se conserva', 'Masa varía'], correctAnswer: 2 },
        { subject: 'Química', difficulty: 'hard', question: '¿Qué son los lantánidos?', options: ['Gases nobles', 'Tierras raras', 'Metales alcalinos', 'Halógenos'], correctAnswer: 1 },
        
        // =====================================================
        // MÚSICA - PREGUNTAS EXCLUSIVAS
        // =====================================================
        
        // Música - Fácil
        { subject: 'Música', difficulty: 'easy', question: '¿Cuántas notas musicales hay?', options: ['5', '6', '7', '8'], correctAnswer: 2 },
        { subject: 'Música', difficulty: 'easy', question: '¿Cuál es la primera nota musical?', options: ['Re', 'Do', 'Mi', 'Sol'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'easy', question: '¿Qué instrumento tiene teclas blancas y negras?', options: ['Guitarra', 'Piano', 'Violín', 'Flauta'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'easy', question: '¿Qué instrumento se toca con un arco?', options: ['Guitarra', 'Piano', 'Violín', 'Flauta'], correctAnswer: 2 },
        { subject: 'Música', difficulty: 'easy', question: '¿Cuántas cuerdas tiene una guitarra clásica?', options: ['4', '5', '6', '7'], correctAnswer: 2 },
        { subject: 'Música', difficulty: 'easy', question: '¿Quién compuso "Para Elisa"?', options: ['Mozart', 'Beethoven', 'Bach', 'Chopin'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'easy', question: '¿Qué es una orquesta?', options: ['Un instrumento', 'Grupo de músicos', 'Tipo de música', 'Una canción'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'easy', question: '¿Qué instrumento es de viento?', options: ['Violín', 'Piano', 'Flauta', 'Guitarra'], correctAnswer: 2 },
        { subject: 'Música', difficulty: 'easy', question: '¿Cómo se llama quien dirige una orquesta?', options: ['Cantante', 'Director', 'Músico', 'Compositor'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'easy', question: '¿Qué instrumento es de percusión?', options: ['Piano', 'Tambor', 'Violín', 'Trompeta'], correctAnswer: 1 },
        
        // Música - Media
        { subject: 'Música', difficulty: 'medium', question: '¿Qué es un pentagrama?', options: ['5 líneas para notas', 'Instrumento', 'Tipo de música', 'Ritmo'], correctAnswer: 0 },
        { subject: 'Música', difficulty: 'medium', question: '¿Quién compuso las "Cuatro Estaciones"?', options: ['Mozart', 'Bach', 'Vivaldi', 'Beethoven'], correctAnswer: 2 },
        { subject: 'Música', difficulty: 'medium', question: '¿Qué es una sinfonía?', options: ['Canción corta', 'Composición orquestal larga', 'Solo de piano', 'Dúo vocal'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'medium', question: '¿Cuántas cuerdas tiene un violín?', options: ['3', '4', '5', '6'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'medium', question: '¿Qué es el tempo en música?', options: ['Volumen', 'Velocidad', 'Tono', 'Ritmo'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'medium', question: '¿Qué significa "forte"?', options: ['Suave', 'Fuerte', 'Lento', 'Rápido'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'medium', question: '¿Qué es un acorde?', options: ['Una nota', 'Varias notas juntas', 'Un silencio', 'Un instrumento'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'medium', question: '¿De qué país era Mozart?', options: ['Alemania', 'Italia', 'Austria', 'Francia'], correctAnswer: 2 },
        { subject: 'Música', difficulty: 'medium', question: '¿Qué es la clave de sol?', options: ['Símbolo para notas agudas', 'Nota musical', 'Instrumento', 'Ritmo'], correctAnswer: 0 },
        { subject: 'Música', difficulty: 'medium', question: '¿Cuántas teclas tiene un piano estándar?', options: ['52', '66', '76', '88'], correctAnswer: 3 },
        
        // Música - Difícil
        { subject: 'Música', difficulty: 'hard', question: '¿Qué es el contrapunto?', options: ['Técnica de melodías simultáneas', 'Tipo de instrumento', 'Género musical', 'Ritmo rápido'], correctAnswer: 0 },
        { subject: 'Música', difficulty: 'hard', question: '¿Cuántas sinfonías compuso Beethoven?', options: ['5', '7', '9', '12'], correctAnswer: 2 },
        { subject: 'Música', difficulty: 'hard', question: '¿Qué es la escala cromática?', options: ['7 notas', '12 semitonos', '5 notas', '8 notas'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'hard', question: '¿Qué significa "pianissimo"?', options: ['Muy fuerte', 'Muy suave', 'Muy rápido', 'Muy lento'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'hard', question: '¿Quién compuso "El Mesías"?', options: ['Bach', 'Händel', 'Mozart', 'Haydn'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'hard', question: '¿Qué es una fuga?', options: ['Composición polifónica', 'Instrumento', 'Nota larga', 'Silencio'], correctAnswer: 0 },
        { subject: 'Música', difficulty: 'hard', question: '¿Cuántos movimientos tiene una sonata clásica?', options: ['2', '3', '4', '5'], correctAnswer: 2 },
        { subject: 'Música', difficulty: 'hard', question: '¿Qué es el leitmotiv?', options: ['Tema musical recurrente', 'Instrumento', 'Tipo de compás', 'Danza'], correctAnswer: 0 },
        { subject: 'Música', difficulty: 'hard', question: '¿Qué compositor quedó sordo?', options: ['Mozart', 'Beethoven', 'Bach', 'Chopin'], correctAnswer: 1 },
        { subject: 'Música', difficulty: 'hard', question: '¿Qué es un requiem?', options: ['Ópera cómica', 'Misa de difuntos', 'Danza barroca', 'Concierto para solista'], correctAnswer: 1 },
        
        // =====================================================
        // INGLÉS - PREGUNTAS EXCLUSIVAS
        // =====================================================
        
        // Inglés - Fácil
        { subject: 'Inglés', difficulty: 'easy', question: '¿Cómo se dice "Hola" en inglés?', options: ['Goodbye', 'Hello', 'Thanks', 'Please'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'easy', question: '¿Qué significa "Dog"?', options: ['Gato', 'Perro', 'Ratón', 'Caballo'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'easy', question: '¿Cómo se dice "Gracias" en inglés?', options: ['Please', 'Sorry', 'Thank you', 'Welcome'], correctAnswer: 2 },
        { subject: 'Inglés', difficulty: 'easy', question: '¿Qué significa "Blue"?', options: ['Rojo', 'Verde', 'Azul', 'Amarillo'], correctAnswer: 2 },
        { subject: 'Inglés', difficulty: 'easy', question: '¿Cómo se dice "Agua" en inglés?', options: ['Water', 'Fire', 'Earth', 'Air'], correctAnswer: 0 },
        { subject: 'Inglés', difficulty: 'easy', question: '¿Qué significa "House"?', options: ['Carro', 'Casa', 'Árbol', 'Camino'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'easy', question: '¿Cómo se dice "Madre" en inglés?', options: ['Father', 'Mother', 'Sister', 'Brother'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'easy', question: '¿Qué significa "Happy"?', options: ['Triste', 'Enojado', 'Feliz', 'Cansado'], correctAnswer: 2 },
        { subject: 'Inglés', difficulty: 'easy', question: '¿Cómo se dice "Uno" en inglés?', options: ['Two', 'One', 'Three', 'Four'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'easy', question: '¿Qué significa "Big"?', options: ['Pequeño', 'Grande', 'Mediano', 'Alto'], correctAnswer: 1 },
        
        // Inglés - Media
        { subject: 'Inglés', difficulty: 'medium', question: 'What is the past tense of "go"?', options: ['Goed', 'Went', 'Gone', 'Going'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'medium', question: '¿Qué significa "However"?', options: ['Porque', 'Sin embargo', 'Entonces', 'Además'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'medium', question: 'What is the plural of "Child"?', options: ['Childs', 'Children', 'Childes', 'Childer'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'medium', question: '¿Qué significa "Hopefully"?', options: ['Tristemente', 'Ojalá', 'Ciertamente', 'Difícilmente'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'medium', question: 'Choose correct: "She ___ to school every day"', options: ['go', 'goes', 'going', 'gone'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'medium', question: '¿Qué significa "Achieve"?', options: ['Perder', 'Lograr', 'Olvidar', 'Fallar'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'medium', question: 'What is the opposite of "Ancient"?', options: ['Old', 'Modern', 'Historic', 'Classic'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'medium', question: '¿Qué significa "Improve"?', options: ['Empeorar', 'Mejorar', 'Mantener', 'Cambiar'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'medium', question: 'Complete: "I have ___ my homework"', options: ['do', 'did', 'done', 'doing'], correctAnswer: 2 },
        { subject: 'Inglés', difficulty: 'medium', question: '¿Qué significa "Although"?', options: ['Porque', 'Aunque', 'Cuando', 'Si'], correctAnswer: 1 },
        
        // Inglés - Difícil
        { subject: 'Inglés', difficulty: 'hard', question: 'What does "Ubiquitous" mean?', options: ['Rare', 'Omnipresent', 'Ancient', 'Modern'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'hard', question: 'Choose correct: "If I ___ rich, I would travel"', options: ['am', 'was', 'were', 'be'], correctAnswer: 2 },
        { subject: 'Inglés', difficulty: 'hard', question: '¿Qué significa "Quintessential"?', options: ['Raro', 'Típico/esencial', 'Antiguo', 'Moderno'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'hard', question: 'What is a synonym for "Meticulous"?', options: ['Careless', 'Thorough', 'Fast', 'Simple'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'hard', question: '¿Qué significa "Ephemeral"?', options: ['Eterno', 'Efímero', 'Antiguo', 'Permanente'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'hard', question: 'Past perfect of "to write":', options: ['Wrote', 'Written', 'Had written', 'Was writing'], correctAnswer: 2 },
        { subject: 'Inglés', difficulty: 'hard', question: '¿Qué significa "Exacerbate"?', options: ['Mejorar', 'Empeorar', 'Mantener', 'Ignorar'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'hard', question: 'What does "Paradox" mean?', options: ['Agreement', 'Contradiction', 'Example', 'Theory'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'hard', question: '¿Qué significa "Corroborate"?', options: ['Negar', 'Confirmar', 'Dudar', 'Ignorar'], correctAnswer: 1 },
        { subject: 'Inglés', difficulty: 'hard', question: 'Choose: "She wished she ___ studied more"', options: ['has', 'have', 'had', 'having'], correctAnswer: 2 },
        
        // =====================================================
        // FRANCÉS - PREGUNTAS EXCLUSIVAS
        // =====================================================
        
        // Francés - Fácil
        { subject: 'Francés', difficulty: 'easy', question: '¿Cómo se dice "Hola" en francés?', options: ['Au revoir', 'Bonjour', 'Merci', 'Oui'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'easy', question: '¿Qué significa "Merci"?', options: ['Hola', 'Adiós', 'Gracias', 'Por favor'], correctAnswer: 2 },
        { subject: 'Francés', difficulty: 'easy', question: '¿Cómo se dice "Sí" en francés?', options: ['Non', 'Oui', 'Peut-être', 'Si'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'easy', question: '¿Qué significa "Chat"?', options: ['Perro', 'Gato', 'Pájaro', 'Ratón'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'easy', question: '¿Cómo se dice "Agua" en francés?', options: ['Vin', 'Lait', 'Eau', 'Café'], correctAnswer: 2 },
        { subject: 'Francés', difficulty: 'easy', question: '¿Qué significa "Maison"?', options: ['Carro', 'Casa', 'Mesa', 'Silla'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'easy', question: '¿Cómo se dice "Buenos días" en francés?', options: ['Bonne nuit', 'Bonjour', 'Bonsoir', 'Au revoir'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'easy', question: '¿Qué significa "Rouge"?', options: ['Azul', 'Verde', 'Rojo', 'Amarillo'], correctAnswer: 2 },
        { subject: 'Francés', difficulty: 'easy', question: '¿Cómo se dice "Uno" en francés?', options: ['Deux', 'Un', 'Trois', 'Quatre'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'easy', question: '¿Qué significa "Jour"?', options: ['Noche', 'Día', 'Mes', 'Año'], correctAnswer: 1 },
        
        // Francés - Media
        { subject: 'Francés', difficulty: 'medium', question: '¿Cómo se dice "Me llamo" en francés?', options: ['Je suis', 'Je m\'appelle', 'J\'ai', 'Je veux'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'medium', question: '¿Qué significa "Aujourd\'hui"?', options: ['Ayer', 'Mañana', 'Hoy', 'Siempre'], correctAnswer: 2 },
        { subject: 'Francés', difficulty: 'medium', question: 'Complete: "Je ___ français"', options: ['suis', 'parle', 'mange', 'bois'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'medium', question: '¿Qué significa "Travail"?', options: ['Viaje', 'Trabajo', 'Casa', 'Escuela'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'medium', question: '¿Cómo se dice "Por favor" en francés?', options: ['Merci', 'Pardon', 'S\'il vous plaît', 'De rien'], correctAnswer: 2 },
        { subject: 'Francés', difficulty: 'medium', question: '¿Qué significa "Bibliothèque"?', options: ['Librería', 'Biblioteca', 'Escuela', 'Universidad'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'medium', question: 'Conjugue "être" en "nous":', options: ['sommes', 'êtes', 'sont', 'suis'], correctAnswer: 0 },
        { subject: 'Francés', difficulty: 'medium', question: '¿Qué significa "Semaine"?', options: ['Mes', 'Semana', 'Día', 'Año'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'medium', question: '¿Cómo se dice "¿Cuánto cuesta?" en francés?', options: ['Où est?', 'Combien ça coûte?', 'Qu\'est-ce que c\'est?', 'Comment?'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'medium', question: '¿Qué significa "Boulangerie"?', options: ['Carnicería', 'Panadería', 'Pescadería', 'Farmacia'], correctAnswer: 1 },
        
        // Francés - Difícil
        { subject: 'Francés', difficulty: 'hard', question: '¿Qué es el "passé composé"?', options: ['Futuro', 'Pretérito compuesto', 'Presente', 'Imperfecto'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'hard', question: 'Conjugue "avoir" en subjonctif (je):', options: ['ai', 'aie', 'avais', 'aurai'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'hard', question: '¿Qué significa "Néanmoins"?', options: ['Por lo tanto', 'Sin embargo', 'Además', 'Porque'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'hard', question: 'Complete: "Il faut que tu ___ (être)"', options: ['es', 'sois', 'soit', 'seras'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'hard', question: '¿Qué significa "Éphémère"?', options: ['Eterno', 'Efímero', 'Antiguo', 'Permanente'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'hard', question: '¿Cuál es el plural de "œil"?', options: ['œils', 'yeux', 'œux', 'yeils'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'hard', question: '¿Qué significa "Bouleversant"?', options: ['Aburrido', 'Conmovedor', 'Triste', 'Alegre'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'hard', question: 'Complete: "Si j\'avais su, je ___ venu"', options: ['suis', 'serais', 'serai', 'étais'], correctAnswer: 1 },
        { subject: 'Francés', difficulty: 'hard', question: '¿Qué es una "liaison" en francés?', options: ['Enlace de sonidos', 'Tipo de acento', 'Conjugación', 'Género'], correctAnswer: 0 },
        { subject: 'Francés', difficulty: 'hard', question: '¿Qué significa "Atterrir"?', options: ['Despegar', 'Aterrizar', 'Volar', 'Caer'], correctAnswer: 1 },
        
        // =====================================================
        // ASTRONOMÍA - PREGUNTAS EXCLUSIVAS
        // =====================================================
        
        // Astronomía - Fácil
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cuál es el planeta más cercano al Sol?', options: ['Venus', 'Mercurio', 'Tierra', 'Marte'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cómo se llama nuestra galaxia?', options: ['Andrómeda', 'Vía Láctea', 'Sombrero', 'Remolino'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cuántos planetas hay en el Sistema Solar?', options: ['7', '8', '9', '10'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué planeta es conocido como el planeta rojo?', options: ['Venus', 'Júpiter', 'Marte', 'Saturno'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué es el Sol?', options: ['Un planeta', 'Una estrella', 'Un satélite', 'Un cometa'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cuál es el satélite natural de la Tierra?', options: ['Fobos', 'Europa', 'Luna', 'Titán'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué planeta tiene anillos visibles?', options: ['Marte', 'Júpiter', 'Urano', 'Saturno'], correctAnswer: 3 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Cuál es el planeta más grande?', options: ['Saturno', 'Júpiter', 'Urano', 'Neptuno'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué estudia la astronomía?', options: ['Animales', 'Plantas', 'El universo', 'El clima'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'easy', question: '¿Qué es una constelación?', options: ['Un planeta', 'Grupo de estrellas', 'Un cometa', 'Una luna'], correctAnswer: 1 },
        
        // Astronomía - Media
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Cuánto tarda la Tierra en orbitar al Sol?', options: ['30 días', '365 días', '24 horas', '12 meses'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué es un año luz?', options: ['Tiempo', 'Distancia', 'Velocidad', 'Energía'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Cuál es la estrella más cercana a la Tierra?', options: ['Sirio', 'Alfa Centauri', 'El Sol', 'Betelgeuse'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué causa las fases de la Luna?', options: ['Sombra de la Tierra', 'Posición relativa Sol-Luna', 'Rotación lunar', 'Eclipses'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué es un agujero negro?', options: ['Estrella brillante', 'Región de gravedad extrema', 'Planeta oscuro', 'Nube de gas'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Cuántas lunas tiene Júpiter?', options: ['4', '16', '79+', '2'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué es una supernova?', options: ['Estrella naciente', 'Explosión de estrella', 'Planeta nuevo', 'Cometa grande'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Por qué Plutón ya no es planeta?', options: ['Es muy frío', 'No limpia su órbita', 'Es muy pequeño', 'Está muy lejos'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué es la Vía Láctea?', options: ['Una estrella', 'Nuestra galaxia', 'Un planeta', 'Un cometa'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'medium', question: '¿Qué planeta gira de lado?', options: ['Marte', 'Venus', 'Urano', 'Neptuno'], correctAnswer: 2 },
        
        // Astronomía - Difícil
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Cuál es la temperatura del núcleo del Sol?', options: ['1 millón °C', '5 millones °C', '15 millones °C', '100 millones °C'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es la materia oscura?', options: ['Polvo espacial', 'Materia que no emite luz', 'Agujeros negros', 'Estrellas muertas'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Cuántos años tiene el universo aproximadamente?', options: ['4.5 mil millones', '10 mil millones', '13.8 mil millones', '20 mil millones'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es una enana blanca?', options: ['Estrella en formación', 'Resto de estrella muerta', 'Planeta pequeño', 'Satélite'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es el horizonte de eventos?', options: ['Amanecer en Marte', 'Límite de agujero negro', 'Eclipse solar', 'Zona habitable'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué luna de Saturno tiene atmósfera densa?', options: ['Encélado', 'Titán', 'Mimas', 'Rea'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es un púlsar?', options: ['Cometa brillante', 'Estrella de neutrones giratoria', 'Planeta de gas', 'Asteroide magnético'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué sonda llegó a Plutón en 2015?', options: ['Voyager 1', 'Cassini', 'New Horizons', 'Juno'], correctAnswer: 2 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Cuánto tarda la luz del Sol en llegar a la Tierra?', options: ['1 segundo', '8 minutos', '1 hora', '24 horas'], correctAnswer: 1 },
        { subject: 'Astronomía', difficulty: 'hard', question: '¿Qué es la radiación de Hawking?', options: ['Luz solar', 'Emisión de agujeros negros', 'Rayos gamma', 'Ondas de radio'], correctAnswer: 1 },
        
        // =====================================================
        // CORRIDOS TUMBADOS - PREGUNTAS EXCLUSIVAS (SOLO HOME)
        // =====================================================
        
        // Corridos Tumbados - Fácil
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿Cuál es el nombre real de Peso Pluma?', options: ['Jesús Ortiz', 'Hassan Emilio', 'Natanael Cano', 'Junior H'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿Quién canta "Ella Baila Sola"?', options: ['Fuerza Regida', 'Peso Pluma y Eslabon Armado', 'Junior H', 'Natanael Cano'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿De qué país son la mayoría de artistas de corridos tumbados?', options: ['Colombia', 'México', 'España', 'Argentina'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿Qué instrumento es común en los corridos tumbados?', options: ['Piano', 'Requinto', 'Violín', 'Saxofón'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿Quién es conocido como el "Doble P"?', options: ['Junior H', 'Natanael Cano', 'Peso Pluma', 'Fuerza Regida'], correctAnswer: 2 },
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿Qué grupo canta "Bebe Dame"?', options: ['Peso Pluma', 'Fuerza Regida', 'Los Tucanes', 'Banda MS'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿Cuál es el género musical padre de los corridos tumbados?', options: ['Reggaetón', 'Corrido tradicional', 'Rock', 'Pop'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿Quién canta "AMG"?', options: ['Junior H', 'Natanael Cano', 'Peso Pluma', 'Eslabón Armado'], correctAnswer: 2 },
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿De qué estado de México es Peso Pluma?', options: ['Sinaloa', 'Jalisco', 'Sonora', 'Chihuahua'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'easy', question: '¿Quién es el líder de Fuerza Regida?', options: ['Natanael Cano', 'Jesús Ortiz Paz', 'Junior H', 'Luis R Conriquez'], correctAnswer: 1 },
        
        // Corridos Tumbados - Media
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿En qué año nació Peso Pluma?', options: ['1995', '1999', '2001', '2003'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿Qué canción hizo famoso a Natanael Cano?', options: ['Ella Baila Sola', 'Soy El Diablo', 'AMG', 'Bebe Dame'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿Con quién colaboró Peso Pluma en "La Bebe"?', options: ['Yng Lvcas', 'Bad Bunny', 'Natanael Cano', 'Fuerza Regida'], correctAnswer: 0 },
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿Qué significa "tumbado" en el contexto del género?', options: ['Acostado/relajado', 'Caído', 'Triste', 'Bailando'], correctAnswer: 0 },
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿Quién canta "Por las Noches"?', options: ['Peso Pluma', 'Junior H', 'Fuerza Regida', 'Eslabón Armado'], correctAnswer: 0 },
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿Qué álbum de Peso Pluma incluye "Ella Baila Sola"?', options: ['Génesis', 'Éxodo', 'ÉXODO', 'Doble P'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿Quién es Brian Tovar?', options: ['Eslabón Armado', 'Fuerza Regida', 'Los Elegantes', 'Legado 7'], correctAnswer: 0 },
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿Qué artista fusionó corridos con trap primero?', options: ['Peso Pluma', 'Natanael Cano', 'Junior H', 'Fuerza Regida'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿En qué año explotó "Ella Baila Sola"?', options: ['2021', '2022', '2023', '2024'], correctAnswer: 2 },
        { subject: 'Corridos Tumbados', difficulty: 'medium', question: '¿Quién canta "Ch y la Pizza"?', options: ['Natanael Cano', 'Fuerza Regida', 'Peso Pluma', 'Junior H'], correctAnswer: 1 },
        
        // Corridos Tumbados - Difícil
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿Cuál fue el primer álbum de estudio de Peso Pluma?', options: ['Ah y Qué?', 'Efectos Secundarios', 'Génesis', 'ÉXODO'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿En qué ciudad de Jalisco nació Peso Pluma?', options: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá'], correctAnswer: 0 },
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿Quién produjo "Ella Baila Sola"?', options: ['Edgar Barrera', 'Tainy', 'Sky Rompiendo', 'Ovy On The Drums'], correctAnswer: 0 },
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿En qué premios ganó Peso Pluma en 2023?', options: ['Grammy Latino', 'MTV', 'Billboard', 'Todos los anteriores'], correctAnswer: 3 },
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿Cuál es el nombre completo de Junior H?', options: ['Antonio Herrera', 'Antonio Salazar', 'Antonio Valdez', 'Antonio Chávez'], correctAnswer: 0 },
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿Qué significa "belicon" en los corridos?', options: ['Fiesta', 'Problema/bronca', 'Dinero', 'Carro'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿Quién colaboró con Peso Pluma en "LADY GAGA"?', options: ['Gabito Ballesteros', 'Junior H', 'Natanael Cano', 'Fuerza Regida'], correctAnswer: 0 },
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿Cuál fue la primera canción viral de Fuerza Regida?', options: ['Radicamos en South Central', 'Bebe Dame', 'Ch y la Pizza', 'TQM'], correctAnswer: 0 },
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿En qué festival de USA tocó Peso Pluma en 2023?', options: ['Lollapalooza', 'Coachella', 'Rolling Loud', 'Austin City Limits'], correctAnswer: 1 },
        { subject: 'Corridos Tumbados', difficulty: 'hard', question: '¿Quién es el compositor de "Siempre Pendientes"?', options: ['Edgar Barrera', 'Peso Pluma', 'Luis R Conriquez', 'Natanael Cano'], correctAnswer: 2 },
        
        // =====================================================
        // PELÍCULAS - PREGUNTAS EXCLUSIVAS (SOLO HOME)
        // =====================================================
        
        // Películas - Fácil
        { subject: 'Películas', difficulty: 'easy', question: '¿Quién interpreta a Spider-Man en las películas más recientes de Marvel?', options: ['Tobey Maguire', 'Andrew Garfield', 'Tom Holland', 'Miles Morales'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'easy', question: '¿Cómo se llama el personaje principal de "Avatar"?', options: ['Jake Sully', 'John Smith', 'Jack Sparrow', 'James Bond'], correctAnswer: 0 },
        { subject: 'Películas', difficulty: 'easy', question: '¿Qué superhéroe tiene un martillo llamado Mjolnir?', options: ['Iron Man', 'Thor', 'Capitán América', 'Hulk'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'easy', question: '¿Qué película de Disney tiene a una princesa que congela todo?', options: ['Moana', 'Frozen', 'Enredados', 'Valiente'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'easy', question: '¿Quién es el actor principal de "Rápidos y Furiosos"?', options: ['Jason Statham', 'The Rock', 'Vin Diesel', 'Paul Walker'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'easy', question: '¿Cómo se llama el ogro verde de DreamWorks?', options: ['Fiona', 'Burro', 'Shrek', 'Farquaad'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'easy', question: '¿Qué actor interpreta a Jack Sparrow?', options: ['Orlando Bloom', 'Johnny Depp', 'Brad Pitt', 'Leonardo DiCaprio'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'easy', question: '¿Cuál es el nombre del león en "El Rey León"?', options: ['Scar', 'Mufasa', 'Simba', 'Timon'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'easy', question: '¿Qué película ganó 11 Oscars en 1998?', options: ['Gladiador', 'Titanic', 'Matrix', 'Braveheart'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'easy', question: '¿Quién dirige la saga de "Avengers: Endgame"?', options: ['Zack Snyder', 'Christopher Nolan', 'Hermanos Russo', 'Joss Whedon'], correctAnswer: 2 },
        
        // Películas - Media
        { subject: 'Películas', difficulty: 'medium', question: '¿En qué año se estrenó la primera película de "Harry Potter"?', options: ['1999', '2001', '2003', '2005'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'medium', question: '¿Cuál es la película más taquillera de la historia (2023)?', options: ['Avengers: Endgame', 'Avatar', 'Titanic', 'Avatar: The Way of Water'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'medium', question: '¿Quién interpretó al Joker en "El Caballero de la Noche"?', options: ['Jared Leto', 'Joaquin Phoenix', 'Heath Ledger', 'Jack Nicholson'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'medium', question: '¿Cuántas películas tiene la saga de "Misión Imposible"?', options: ['5', '6', '7', '8'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'medium', question: '¿Qué actor NO ha interpretado a Batman?', options: ['Ben Affleck', 'Christian Bale', 'Ryan Reynolds', 'Robert Pattinson'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'medium', question: '¿Cuál es el verdadero nombre de Black Widow?', options: ['Wanda Maximoff', 'Natasha Romanoff', 'Carol Danvers', 'Hope Van Dyne'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'medium', question: '¿Qué película de 2023 es sobre un científico atómico?', options: ['Barbie', 'Oppenheimer', 'Dune 2', 'Napoleon'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'medium', question: '¿Quién dirigió "Parásitos" ganadora del Oscar?', options: ['Hayao Miyazaki', 'Bong Joon-ho', 'Park Chan-wook', 'Wong Kar-wai'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'medium', question: '¿Cuántas gemas del infinito existen en Marvel?', options: ['4', '5', '6', '7'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'medium', question: '¿Qué actor protagoniza "John Wick"?', options: ['Tom Cruise', 'Keanu Reeves', 'Liam Neeson', 'Jason Statham'], correctAnswer: 1 },
        
        // Películas - Difícil
        { subject: 'Películas', difficulty: 'hard', question: '¿Cuál fue la primera película de Pixar?', options: ['Buscando a Nemo', 'Monsters Inc', 'Toy Story', 'Bichos'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'hard', question: '¿Quién ganó el Oscar a Mejor Actor en 2023?', options: ['Austin Butler', 'Brendan Fraser', 'Colin Farrell', 'Bill Nighy'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'hard', question: '¿En qué película Margot Robbie NO aparece?', options: ['Barbie', 'El Lobo de Wall Street', 'La La Land', 'Escuadrón Suicida'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'hard', question: '¿Cuál fue la última película de Chadwick Boseman?', options: ['Black Panther 2', 'Ma Rainey\'s Black Bottom', 'Da 5 Bloods', '21 Bridges'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'hard', question: '¿Qué director tiene más premios Oscar?', options: ['Steven Spielberg', 'Martin Scorsese', 'John Ford', 'Francis Ford Coppola'], correctAnswer: 2 },
        { subject: 'Películas', difficulty: 'hard', question: '¿En qué año se fundó Marvel Studios?', options: ['1993', '1996', '1998', '2005'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'hard', question: '¿Qué película tiene el récord de más nominaciones al Oscar sin ganar?', options: ['El Color Púrpura', 'Gangs of New York', 'The Turning Point', 'True Grit'], correctAnswer: 0 },
        { subject: 'Películas', difficulty: 'hard', question: '¿Quién escribió el guión de "Pulp Fiction"?', options: ['Martin Scorsese', 'Quentin Tarantino', 'David Fincher', 'Christopher Nolan'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'hard', question: '¿Cuál es la película más cara de la historia?', options: ['Avatar 2', 'Piratas del Caribe 4', 'Avengers: Endgame', 'Star Wars: Force Awakens'], correctAnswer: 1 },
        { subject: 'Películas', difficulty: 'hard', question: '¿Qué película animada fue la primera en ganar Mejor Película en los Globos de Oro?', options: ['Up', 'Toy Story 3', 'La Bella y la Bestia', 'El Rey León'], correctAnswer: 2 },
        
        // =====================================================
        // CULTURA GENERAL - PREGUNTAS EXCLUSIVAS (SOLO HOME)
        // =====================================================
        
        // Cultura General - Fácil
        { subject: 'Cultura General', difficulty: 'easy', question: '¿Cuál es el país más grande del mundo?', options: ['China', 'Estados Unidos', 'Rusia', 'Canadá'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'easy', question: '¿Cuántos continentes hay en el mundo?', options: ['5', '6', '7', '8'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'easy', question: '¿Cuál es el océano más grande?', options: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'], correctAnswer: 3 },
        { subject: 'Cultura General', difficulty: 'easy', question: '¿En qué país está la Torre Eiffel?', options: ['Italia', 'España', 'Francia', 'Alemania'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'easy', question: '¿Cuál es el animal terrestre más grande?', options: ['Jirafa', 'Rinoceronte', 'Elefante', 'Hipopótamo'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'easy', question: '¿Cuántos colores tiene el arcoíris?', options: ['5', '6', '7', '8'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'easy', question: '¿Cuál es la capital de España?', options: ['Barcelona', 'Sevilla', 'Madrid', 'Valencia'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'easy', question: '¿Qué planeta es conocido como el planeta rojo?', options: ['Venus', 'Marte', 'Júpiter', 'Saturno'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'easy', question: '¿Cuál es el río más largo del mundo?', options: ['Amazonas', 'Nilo', 'Misisipi', 'Yangtsé'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'easy', question: '¿Quién pintó la Mona Lisa?', options: ['Picasso', 'Van Gogh', 'Leonardo da Vinci', 'Miguel Ángel'], correctAnswer: 2 },
        
        // Cultura General - Media
        { subject: 'Cultura General', difficulty: 'medium', question: '¿En qué año llegó el hombre a la Luna?', options: ['1965', '1969', '1972', '1975'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'medium', question: '¿Cuál es el hueso más largo del cuerpo humano?', options: ['Húmero', 'Tibia', 'Fémur', 'Radio'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'medium', question: '¿Quién escribió "Don Quijote de la Mancha"?', options: ['Lope de Vega', 'Cervantes', 'Calderón', 'Quevedo'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'medium', question: '¿Cuál es el metal más abundante en la corteza terrestre?', options: ['Hierro', 'Aluminio', 'Cobre', 'Oro'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'medium', question: '¿Cuántos jugadores tiene un equipo de fútbol en cancha?', options: ['9', '10', '11', '12'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'medium', question: '¿En qué continente está Egipto?', options: ['Asia', 'África', 'Europa', 'Medio Oriente'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'medium', question: '¿Qué invento se atribuye a Thomas Edison?', options: ['Teléfono', 'Bombilla eléctrica', 'Radio', 'Televisión'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'medium', question: '¿Cuál es la moneda de Japón?', options: ['Yuan', 'Won', 'Yen', 'Rupia'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'medium', question: '¿Quién fue el primer presidente de Estados Unidos?', options: ['Abraham Lincoln', 'Thomas Jefferson', 'George Washington', 'John Adams'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'medium', question: '¿Cuál es el elemento químico más abundante en el universo?', options: ['Oxígeno', 'Carbono', 'Helio', 'Hidrógeno'], correctAnswer: 3 },
        
        // Cultura General - Difícil
        { subject: 'Cultura General', difficulty: 'hard', question: '¿En qué año cayó el Muro de Berlín?', options: ['1987', '1989', '1991', '1993'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'hard', question: '¿Cuál es la montaña más alta de América?', options: ['Monte McKinley', 'Aconcagua', 'Chimborazo', 'Monte Logan'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'hard', question: '¿Quién formuló la teoría de la relatividad?', options: ['Newton', 'Einstein', 'Hawking', 'Bohr'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'hard', question: '¿Cuántos países hay en la Unión Europea (2024)?', options: ['25', '27', '28', '30'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'hard', question: '¿Qué tratado terminó la Primera Guerra Mundial?', options: ['Versalles', 'Westfalia', 'París', 'Viena'], correctAnswer: 0 },
        { subject: 'Cultura General', difficulty: 'hard', question: '¿Cuál es el país con más idiomas oficiales?', options: ['India', 'Sudáfrica', 'Suiza', 'Bolivia'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'hard', question: '¿Quién escribió "El origen de las especies"?', options: ['Mendel', 'Darwin', 'Lamarck', 'Wallace'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'hard', question: '¿Cuál es la empresa más valiosa del mundo (2024)?', options: ['Amazon', 'Microsoft', 'Apple', 'Google'], correctAnswer: 2 },
        { subject: 'Cultura General', difficulty: 'hard', question: '¿En qué año se fundó la ONU?', options: ['1942', '1945', '1948', '1950'], correctAnswer: 1 },
        { subject: 'Cultura General', difficulty: 'hard', question: '¿Cuál es el desierto más grande del mundo?', options: ['Sahara', 'Gobi', 'Antártida', 'Arábigo'], correctAnswer: 2 }
    ];
}

