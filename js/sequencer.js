/* ============================================================ */
/* MC-303 ULTIMATE v5.0 - SEQUENCER                             */
/* Pattern management, step triggering, polyrhythm              */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    const MAX_STEPS = 32; // Support for polyrhythm up to 32 steps
    
    // --- Track-specific step counters for polyrhythm ---
    MC303.trackSteps = {
        kick1: 0, kick2: 0, snare1: 0, snare2: 0,
        hat1: 0, hat2: 0, bass1: 0, bass2: 0, fx1: 0, fx2: 0
    };
    
    // --- Create Empty Pattern ---
    MC303.createEmptyPattern = function() {
        const tracks = ['kick1', 'kick2', 'snare1', 'snare2', 'hat1', 'hat2', 'bass1', 'bass2', 'fx1', 'fx2'];
        const pattern = {
            accent: new Array(MAX_STEPS).fill(false)
        };
        
        tracks.forEach(track => {
            // Step triggers
            pattern[track] = new Array(MAX_STEPS).fill(false);
            
            // Notes
            const defaultNote = track.startsWith('kick') ? 'C2' :
                               track.startsWith('snare') ? 'D3' :
                               track.startsWith('hat') ? 'F#4' :
                               track.startsWith('bass') ? 'A1' :
                               track === 'fx1' ? 'A4' : 'C3';
            pattern[`${track}Notes`] = new Array(MAX_STEPS).fill(defaultNote);
            
            // Parameter locks
            pattern[`${track}Locks`] = [];
            for (let i = 0; i < MAX_STEPS; i++) {
                pattern[`${track}Locks`].push({ velocity: null, decay: null, filter: null });
            }
        });
        
        return pattern;
    };
    
    // --- Initialize Patterns (Lazy) ---
    MC303.initPatterns = function() {
        if (!MC303.patterns) {
            MC303.patterns = {
                A: MC303.createEmptyPattern(),
                B: MC303.createEmptyPattern(),
                C: MC303.createEmptyPattern(),
                D: MC303.createEmptyPattern()
            };
        }
        return MC303.patterns;
    };
    
    // --- Get Current Pattern ---
    MC303.getCurrentPattern = function() {
        MC303.initPatterns();
        return MC303.patterns[MC303.state.currentPattern];
    };
    
    // --- Get Step Parameters (with locks applied) ---
    MC303.getStepParams = function(trackId, stepIndex) {
        const pattern = MC303.getCurrentPattern();
        const locks = pattern[`${trackId}Locks`]?.[stepIndex] || {};
        
        return {
            velocity: locks.velocity !== null ? locks.velocity : 1.0,
            decay: locks.decay !== null ? locks.decay : 1.0,
            filter: locks.filter !== null ? locks.filter : 1.0
        };
    };
    
    // --- Set Parameter Lock ---
    MC303.setParamLock = function(trackId, stepIndex, param, value) {
        const pattern = MC303.getCurrentPattern();
        const lockKey = `${trackId}Locks`;
        if (!pattern[lockKey]) return;
        if (!pattern[lockKey][stepIndex]) {
            pattern[lockKey][stepIndex] = { velocity: null, decay: null, filter: null };
        }
        pattern[lockKey][stepIndex][param] = value;
        if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
    };
    
    // --- Set Track Length (Polyrhythm) ---
    MC303.setTrackLength = function(trackId, length) {
        MC303.trackLengths[trackId] = Math.max(1, Math.min(32, length));
        if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
    };
    
    // --- Sequencer Step Function ---
    MC303.step = function() {
        const stepTime = MC303.audio.context.currentTime;
        const pattern = MC303.getCurrentPattern();
        const isAccent = pattern.accent[MC303.state.currentStep];
        
        const tracks = ['kick1', 'kick2', 'snare1', 'snare2', 'hat1', 'hat2', 'bass1', 'bass2', 'fx1', 'fx2'];
        
        tracks.forEach(trackId => {
            // Polyrhythm: Each track has its own length
            const trackLen = MC303.trackLengths[trackId];
            const trackStep = MC303.trackSteps[trackId];
            
            if (pattern[trackId][trackStep]) {
                const noteFreq = MC303.allNotes[pattern[`${trackId}Notes`][trackStep]] || 65;
                const locks = pattern[`${trackId}Locks`]?.[trackStep] || {};
                
                // Merge base settings with parameter locks
                const settings = {
                    ...MC303.trackSettings[trackId],
                    trackId: trackId,
                    level: MC303.trackSettings[trackId].level * (locks.velocity !== null ? locks.velocity : 1.0),
                    decay: (MC303.trackSettings[trackId].decay || 0.2) * (locks.decay !== null ? locks.decay : 1.0),
                    _filterMod: locks.filter !== null ? locks.filter : 1.0
                };
                
                // Route to correct sound engine
                if (trackId.startsWith('kick')) {
                    MC303.playKick(stepTime, settings, noteFreq, isAccent);
                } else if (trackId.startsWith('snare')) {
                    MC303.playSnare(stepTime, settings, noteFreq, isAccent);
                } else if (trackId.startsWith('hat')) {
                    MC303.playHat(stepTime, settings, noteFreq, isAccent);
                } else if (trackId.startsWith('bass')) {
                    MC303.playBass(stepTime, settings, noteFreq, isAccent);
                } else if (trackId.startsWith('fx')) {
                    MC303.playFX(stepTime, settings, noteFreq, isAccent);
                }
            }
            
            // Update track-specific step for polyrhythm
            MC303.trackSteps[trackId] = (trackStep + 1) % trackLen;
        });
        
        if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
        MC303.state.currentStep = (MC303.state.currentStep + 1) % 16;
    };
    
    // --- Play ---
    MC303.play = function() {
        if (!MC303.audio.context) MC303.initAudio();
        MC303.resumeAudio();
        if (MC303.state.isPlaying) return;
        
        MC303.state.isPlaying = true;
        MC303.state.currentStep = 0;
        
        // Reset all track steps for polyrhythm
        Object.keys(MC303.trackSteps).forEach(t => MC303.trackSteps[t] = 0);
        
        const stepInterval = (60 / MC303.state.bpm / 4) * 1000;
        MC303.state.intervalId = setInterval(MC303.step, stepInterval);
        
        document.getElementById('play-btn')?.classList.add('active');
        console.log('▶ Playing at', MC303.state.bpm, 'BPM');
    };
    
    // --- Stop ---
    MC303.stop = function() {
        MC303.state.isPlaying = false;
        MC303.state.currentStep = 0;
        Object.keys(MC303.trackSteps).forEach(t => MC303.trackSteps[t] = 0);
        
        if (MC303.state.intervalId) {
            clearInterval(MC303.state.intervalId);
            MC303.state.intervalId = null;
        }
        
        if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
        document.getElementById('play-btn')?.classList.remove('active');
        console.log('⏹ Stopped');
    };
    
    // --- Clear Pattern ---
    MC303.clearPattern = function() {
        const pattern = MC303.getCurrentPattern();
        Object.keys(pattern).forEach(key => {
            if (Array.isArray(pattern[key])) {
                if (key.includes('Notes')) {
                    const defaultNote = key.startsWith('kick') ? 'C2' :
                                       key.startsWith('snare') ? 'D3' :
                                       key.startsWith('hat') ? 'F#4' :
                                       key.startsWith('bass') ? 'A1' : 'C3';
                    pattern[key].fill(defaultNote);
                } else if (key.includes('Locks')) {
                    for (let i = 0; i < pattern[key].length; i++) {
                        pattern[key][i] = { velocity: null, decay: null, filter: null };
                    }
                } else {
                    pattern[key].fill(false);
                }
            }
        });
        if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
        console.log('🗑 Pattern cleared');
    };
    
    // --- Copy Pattern ---
    MC303.copyPattern = function() {
        MC303.state.clipboard = JSON.parse(JSON.stringify(MC303.getCurrentPattern()));
        alert(`Pattern ${MC303.state.currentPattern} copied!`);
    };
    
    // --- Paste Pattern ---
    MC303.pastePattern = function() {
        if (!MC303.state.clipboard) {
            alert('Nothing to paste!');
            return;
        }
        MC303.initPatterns();
        MC303.patterns[MC303.state.currentPattern] = JSON.parse(JSON.stringify(MC303.state.clipboard));
        if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
        alert(`Pattern pasted to ${MC303.state.currentPattern}!`);
    };
    
    // --- Morph Patterns A→B into C ---
    MC303.morphPattern = function() {
        MC303.initPatterns();
        const patA = MC303.patterns.A;
        const patB = MC303.patterns.B;
        const result = MC303.createEmptyPattern();
        const tracks = ['kick1', 'kick2', 'snare1', 'snare2', 'hat1', 'hat2', 'bass1', 'bass2', 'fx1', 'fx2'];
        
        tracks.forEach(track => {
            for (let i = 0; i < 16; i++) {
                result[track][i] = patA[track][i] || patB[track][i];
                result[`${track}Notes`][i] = patA[track][i] ? patA[`${track}Notes`][i] : patB[`${track}Notes`][i];
            }
        });
        
        MC303.patterns.C = result;
        alert('Morphed A→B into Pattern C!');
    };
    
    // --- Seeded Random ---
    MC303.seededRandom = function(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
    
    // --- Generate Beat ---
    MC303.generateBeat = function() {
        if (!MC303.audio.context) MC303.initAudio();
        
        const seed = parseInt(document.getElementById('seed-input')?.value) || 303;
        const pattern = MC303.getCurrentPattern();
        
        // Clear pattern
        Object.keys(pattern).forEach(key => {
            if (Array.isArray(pattern[key])) {
                if (key.includes('Notes')) pattern[key].fill('C2');
                else if (!key.includes('Locks')) pattern[key].fill(false);
            }
        });
        
        let rng = seed;
        
        // Generate kick
        for (let i = 0; i < 16; i++) {
            if (i % 4 === 0 || MC303.seededRandom(rng++) > 0.85) {
                pattern.kick1[i] = true;
                pattern.kick1Notes[i] = MC303.noteNames[Math.floor(MC303.seededRandom(rng++) * 12) + 12];
            }
        }
        
        // Generate snare
        for (let i = 0; i < 16; i++) {
            if (i === 4 || i === 12) {
                pattern.snare1[i] = true;
                pattern.snare1Notes[i] = MC303.noteNames[Math.floor(MC303.seededRandom(rng++) * 12) + 24];
            }
        }
        
        // Generate hats
        for (let i = 0; i < 16; i++) {
            if (MC303.seededRandom(rng++) > 0.3) {
                pattern.hat1[i] = true;
                pattern.hat1Notes[i] = MC303.noteNames[Math.floor(MC303.seededRandom(rng++) * 12) + 36];
            }
        }
        
        // Generate bass
        for (let i = 0; i < 16; i++) {
            if (i % 4 === 0 || MC303.seededRandom(rng++) > 0.65) {
                pattern.bass1[i] = true;
                const noteIndex = Math.floor(MC303.seededRandom(rng++) * 24);
                pattern.bass1Notes[i] = MC303.noteNames[noteIndex];
                if (MC303.seededRandom(rng++) > 0.7) pattern.accent[i] = true;
            }
        }
        
        if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
        console.log('🎲 Beat generated with seed:', seed);
    };
    
    // --- Toggle Accent Mode ---
    MC303.toggleAccentMode = function() {
        MC303.state.accentMode = !MC303.state.accentMode;
        const btn = document.getElementById('accent-mode');
        if (btn) {
            btn.textContent = `Accent: ${MC303.state.accentMode ? 'ON' : 'OFF'}`;
            btn.classList.toggle('active', MC303.state.accentMode);
        }
    };
    
    // --- Toggle Param Lock Mode ---
    MC303.toggleParamLockMode = function() {
        MC303.state.paramLockMode = !MC303.state.paramLockMode;
        const btn = document.getElementById('plock-mode');
        if (btn) {
            btn.textContent = `🔒 P-Lock: ${MC303.state.paramLockMode ? 'ON' : 'OFF'}`;
            btn.classList.toggle('active', MC303.state.paramLockMode);
        }
    };
    
    // --- Update BPM ---
    MC303.setBPM = function(newBpm) {
        MC303.state.bpm = newBpm;
        if (MC303.state.isPlaying) {
            clearInterval(MC303.state.intervalId);
            MC303.state.intervalId = setInterval(MC303.step, (60 / MC303.state.bpm / 4) * 1000);
        }
    };
    
})(window.MC303 = window.MC303 || {});
