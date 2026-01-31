/* ============================================================ */
/* WBM 5-303 ULTIMATE - CONFIGURATION                           */
/* Global settings, note frequencies, track definitions         */
/* ============================================================ */

const MC303 = window.MC303 || {};

// --- Note Frequencies (C1 to C5) ---
MC303.allNotes = {
    'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
    'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
    'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25
};

MC303.noteNames = Object.keys(MC303.allNotes);

// --- Track Definitions ---
MC303.trackGroups = [
    { name: 'DRUMS', emoji: '🥁', tracks: ['kick1', 'kick2', 'snare1', 'snare2'] },
    { name: 'HI-HATS', emoji: '🎩', tracks: ['hat1', 'hat2'] },
    { name: 'BASS', emoji: '🎸', tracks: ['bass1', 'bass2'] },
    { name: 'FX', emoji: '✨', tracks: ['fx1', 'fx2'] }
];

// --- Track Configurations ---
MC303.trackConfigs = {
    kick1: { id: 'kick1', name: 'Kick 1', hasFreq: true, hasWave: true, hasLFO: true, hasADSR: true, hasPan: true, hasDetune: true, hasPiano: true },
    kick2: { id: 'kick2', name: 'Kick 2', hasFreq: true, hasWave: true, hasLFO: true, hasADSR: true, hasPan: true, hasDetune: true, hasPiano: true },
    snare1: { id: 'snare1', name: 'Snare 1', hasTone: true, hasDecay: true, hasLFO: true, hasADSR: true, hasPan: true, hasDetune: true, hasPiano: true },
    snare2: { id: 'snare2', name: 'Snare 2', hasTone: true, hasDecay: true, hasLFO: true, hasADSR: true, hasPan: true, hasDetune: true, hasPiano: true },
    hat1: { id: 'hat1', name: 'Hi-Hat Closed', hasTone: true, hasDecay: true, hasLFO: true, hasADSR: true, hasPan: true, hasPiano: true },
    hat2: { id: 'hat2', name: 'Hi-Hat Open', hasTone: true, hasDecay: true, hasLFO: true, hasADSR: true, hasPan: true, hasPiano: true },
    bass1: { id: 'bass1', name: 'Bass 1', hasWave: true, hasLFO: true, hasADSR: true, hasPan: true, hasDetune: true, hasPiano: true },
    bass2: { id: 'bass2', name: 'Bass 2', hasWave: true, hasLFO: true, hasADSR: true, hasPan: true, hasDetune: true, hasPiano: true },
    fx1: { id: 'fx1', name: 'FX 1', hasFXType: true, hasPitch: true, hasLFO: true, hasADSR: true, hasPan: true, hasDetune: true, hasPiano: true },
    fx2: { id: 'fx2', name: 'FX 2', hasFXType: true, hasPitch: true, hasLFO: true, hasADSR: true, hasPan: true, hasDetune: true, hasPiano: true }
};

// --- Default Track Settings (FIXED: Higher levels, smoother attacks) ---
MC303.trackSettings = {
    kick1: { 
        freq: 55, wave: 'sine', level: 1.0,  // LOUD kick
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'pitch' },
        adsr: { attack: 0.003, decay: 0.45, sustain: 0, release: 0.3 }
    },
    kick2: { 
        freq: 70, wave: 'sine', level: 0.8,
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'pitch' },
        adsr: { attack: 0.003, decay: 0.35, sustain: 0, release: 0.25 }
    },
    snare1: { 
        tone: 200, decay: 0.22, level: 0.9,  // Louder snare
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'pitch' },
        adsr: { attack: 0.002, decay: 0.22, sustain: 0, release: 0.15 }
    },
    snare2: { 
        tone: 280, decay: 0.15, level: 0.7,
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'pitch' },
        adsr: { attack: 0.002, decay: 0.15, sustain: 0, release: 0.1 }
    },
    hat1: { 
        tone: 8000, decay: 0.06, level: 0.7,  // Louder hats
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'filter' },
        adsr: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 }
    },
    hat2: { 
        tone: 6000, decay: 0.25, level: 0.6,
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'filter' },
        adsr: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 }
    },
    bass1: { 
        wave: 'sawtooth', level: 0.85,  // Louder bass
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'filter' },
        adsr: { attack: 0.008, decay: 0.3, sustain: 0.5, release: 0.3 }
    },
    bass2: { 
        wave: 'square', level: 0.65,
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'filter' },
        adsr: { attack: 0.008, decay: 0.25, sustain: 0.4, release: 0.25 }
    },
    fx1: { 
        type: 'cowbell', pitch: 800, level: 0.75,
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'pitch' },
        adsr: { attack: 0.003, decay: 0.18, sustain: 0, release: 0.12 }
    },
    fx2: { 
        type: 'acidstab', pitch: 200, level: 0.8,
        mute: false, solo: false, pan: 0, detune: 0,
        lfo: { rate: 0, depth: 0, target: 'pitch' },
        adsr: { attack: 0.003, decay: 0.25, sustain: 0, release: 0.18 }
    }
};

// Deep copy for defaults
MC303.defaultTrackSettings = JSON.parse(JSON.stringify(MC303.trackSettings));

// --- FX Types ---
MC303.fxTypes = [
    { value: 'cowbell', label: 'Cowbell' },
    { value: 'gunshot', label: 'Gunshot' },
    { value: 'creaky', label: 'Creaky Door' },
    { value: 'clap', label: 'Clap' },
    { value: 'rimshot', label: 'Rimshot' },
    { value: 'acidstab', label: '🔥 Acid Stab' },
    { value: 'hoover', label: '🚀 Hoover' },
    { value: 'ravestab', label: '⚡ Rave Stab' },
    { value: 'laser', label: '🔫 Laser' },
    { value: 'reese', label: '🎸 Reese Bass' },
    { value: 'fmbell', label: '🔔 FM Bell' },
    { value: 'whitenoise', label: '🌊 Noise Sweep' }
];

// --- Track Lengths for Polyrhythm ---
MC303.trackLengths = {
    kick1: 16, kick2: 16,
    snare1: 16, snare2: 16,
    hat1: 16, hat2: 16,
    bass1: 16, bass2: 16,
    fx1: 16, fx2: 16
};

// --- Global State ---
MC303.state = {
    bpm: 128,
    isPlaying: false,
    currentStep: 0,
    currentPattern: 'A',
    accentMode: false,
    paramLockMode: false,
    paramLockParam: 'velocity',
    selectedStep: null,
    clipboard: null,
    settingsClipboard: null,
    intervalId: null
};

// --- Patterns (Lazy Init) ---
MC303.patterns = null;

// --- FX Settings ---
MC303.fxSettings = {
    distortion: { type: 'soft', amount: 0 },
    reverb: { type: 'room', mix: 0.2 },
    delay: { time: 0.25, feedback: 0.3, mix: 0 },
    compressor: { threshold: -12, ratio: 4 }
};

// Export to global
window.MC303 = MC303;
