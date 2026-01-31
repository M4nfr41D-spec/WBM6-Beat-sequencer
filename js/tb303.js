/* ============================================================ */
/* MC-303 ULTIMATE v5.0 - TB-303 ACID BASS MODULE               */
/* Authentic 303 emulation with wobble, accent, slide, envelope */
/* Inspired by: Emmanuel Top - Tone, Stress                     */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // ============================================================
    // TB-303 CONFIGURATION
    // ============================================================
    
    MC303.tb303 = {
        // --- Filter Section ---
        cutoff: 400,           // 30Hz - 5000Hz (sweet spot ~300-800)
        resonance: 8,          // 0 - 30 (self-oscillation starts ~20)
        envMod: 60,            // 0 - 100% envelope to filter
        
        // --- Envelope ---
        decay: 0.3,            // 0.02 - 2.0 seconds
        accent: 50,            // 0 - 100% accent intensity
        
        // --- Oscillator ---
        waveform: 'sawtooth',  // sawtooth or square
        subOsc: 0.3,           // 0 - 1.0 sub oscillator mix
        
        // --- LFO (Wobble) ---
        lfo: {
            enabled: true,
            rate: 0.5,          // 0.05 - 50 Hz
            depth: 2400,        // 0 - 4800 (Hz range, ~4 octaves)
            waveform: 'sine',   // sine, triangle, square, sawtooth, random
            sync: false,        // Sync to BPM
            syncDivision: 4,    // 1, 2, 4, 8, 16 (beats)
            phase: 0,           // 0 - 360 degrees
            target: 'filter',   // filter, pitch, both
            bipolar: true       // true = ±depth, false = 0 to +depth
        },
        
        // --- Slide (Glide/Portamento) ---
        slideTime: 0.06,       // 0.02 - 0.3 seconds
        slideEnabled: false,   // Global slide toggle
        
        // --- Output ---
        level: 0.75,
        pan: 0,
        drive: 0.2,            // 0 - 1.0 soft saturation
        
        // --- Internal State ---
        _lastFreq: 0,
        _lfoNode: null,
        _lfoGain: null,
        _filterNode: null
    };
    
    // Slide flags per step (16 steps)
    MC303.tb303.slideSteps = new Array(32).fill(false);
    MC303.tb303.accentSteps = new Array(32).fill(false);
    
    // ============================================================
    // LADDER FILTER EMULATION (4-Pole with Resonance Feedback)
    // ============================================================
    
    MC303.createLadderFilter = function(ctx, cutoff, resonance) {
        // Create 4 cascaded lowpass filters (24dB/oct)
        const stages = [];
        for (let i = 0; i < 4; i++) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = cutoff;
            // Distribute Q across stages for smoother response
            filter.Q.value = 0.5 + (resonance / 30) * 2;
            stages.push(filter);
        }
        
        // Chain the filters
        for (let i = 0; i < 3; i++) {
            stages[i].connect(stages[i + 1]);
        }
        
        // Resonance boost on last stage
        stages[3].Q.value = Math.min(25, resonance * 1.2);
        
        return {
            input: stages[0],
            output: stages[3],
            stages: stages,
            setFrequency: (freq, time) => {
                const safeFreq = Math.max(30, Math.min(ctx.sampleRate / 2.5, freq));
                stages.forEach(s => {
                    if (time !== undefined) {
                        s.frequency.setValueAtTime(safeFreq, time);
                    } else {
                        s.frequency.value = safeFreq;
                    }
                });
            },
            setFrequencyAtTime: (freq, time) => {
                const safeFreq = Math.max(30, Math.min(ctx.sampleRate / 2.5, freq));
                stages.forEach(s => s.frequency.setValueAtTime(safeFreq, time));
            },
            exponentialRampToFrequency: (freq, time) => {
                const safeFreq = Math.max(30, Math.min(ctx.sampleRate / 2.5, freq));
                stages.forEach(s => s.frequency.exponentialRampToValueAtTime(safeFreq, time));
            },
            linearRampToFrequency: (freq, time) => {
                const safeFreq = Math.max(30, Math.min(ctx.sampleRate / 2.5, freq));
                stages.forEach(s => s.frequency.linearRampToValueAtTime(safeFreq, time));
            },
            setResonance: (res) => {
                const q = Math.min(25, res * 1.2);
                stages[3].Q.value = q;
                stages.forEach((s, i) => {
                    if (i < 3) s.Q.value = 0.5 + (res / 30) * 2;
                });
            }
        };
    };
    
    // ============================================================
    // LFO ENGINE
    // ============================================================
    
    MC303.create303LFO = function(ctx) {
        const lfoSettings = MC303.tb303.lfo;
        
        // Main LFO oscillator
        const lfo = ctx.createOscillator();
        lfo.type = lfoSettings.waveform === 'random' ? 'sawtooth' : lfoSettings.waveform;
        
        // Calculate rate (with BPM sync if enabled)
        let rate = lfoSettings.rate;
        if (lfoSettings.sync && MC303.state.bpm) {
            // Sync to BPM: division 1 = 1 bar, 4 = quarter note, etc.
            const barDuration = (60 / MC303.state.bpm) * 4;
            rate = 1 / (barDuration / lfoSettings.syncDivision);
        }
        lfo.frequency.value = rate;
        
        // Depth control
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = lfoSettings.bipolar ? lfoSettings.depth : lfoSettings.depth / 2;
        
        // For random/S&H, we need a custom approach
        if (lfoSettings.waveform === 'random') {
            // Sample & Hold approximation using noise + filter
            const bufferSize = ctx.sampleRate * 2;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            
            // Create stepped random values
            const stepSize = Math.floor(ctx.sampleRate / rate);
            let currentVal = Math.random() * 2 - 1;
            for (let i = 0; i < bufferSize; i++) {
                if (i % stepSize === 0) currentVal = Math.random() * 2 - 1;
                data[i] = currentVal;
            }
            
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;
            noiseSource.connect(lfoGain);
            
            return {
                node: noiseSource,
                gain: lfoGain,
                start: (time) => noiseSource.start(time),
                stop: (time) => noiseSource.stop(time),
                setRate: () => {}, // Can't change rate on buffer
                setDepth: (d) => { lfoGain.gain.value = lfoSettings.bipolar ? d : d / 2; }
            };
        }
        
        lfo.connect(lfoGain);
        
        return {
            node: lfo,
            gain: lfoGain,
            start: (time) => lfo.start(time),
            stop: (time) => lfo.stop(time),
            setRate: (r) => { lfo.frequency.value = r; },
            setDepth: (d) => { lfoGain.gain.value = lfoSettings.bipolar ? d : d / 2; }
        };
    };
    
    // ============================================================
    // SOFT SATURATION / DRIVE
    // ============================================================
    
    MC303.createSoftClipper = function(ctx, drive) {
        const waveshaper = ctx.createWaveShaper();
        const samples = 44100;
        const curve = new Float32Array(samples);
        
        // Soft clipping curve with variable drive
        const k = drive * 50;
        for (let i = 0; i < samples; i++) {
            const x = (i * 2 / samples) - 1;
            if (k === 0) {
                curve[i] = x;
            } else {
                curve[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
            }
        }
        
        waveshaper.curve = curve;
        waveshaper.oversample = '2x';
        return waveshaper;
    };
    
    // ============================================================
    // MAIN 303 VOICE
    // ============================================================
    
    MC303.play303 = function(time, noteFreq, stepIndex, isAccent) {
        const ctx = MC303.audio.context;
        if (!ctx) return;
        
        const tb = MC303.tb303;
        const stepAccent = isAccent || tb.accentSteps[stepIndex];
        const hasSlide = tb.slideSteps[stepIndex] && tb._lastFreq > 0;
        
        // --- OSCILLATORS ---
        
        // Main oscillator
        const osc = ctx.createOscillator();
        osc.type = tb.waveform;
        
        // Handle slide (portamento)
        if (hasSlide && tb.slideEnabled) {
            osc.frequency.setValueAtTime(tb._lastFreq, time);
            osc.frequency.exponentialRampToValueAtTime(noteFreq, time + tb.slideTime);
        } else {
            osc.frequency.setValueAtTime(noteFreq, time);
        }
        
        // Sub oscillator (1 octave down, sine)
        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        if (hasSlide && tb.slideEnabled) {
            subOsc.frequency.setValueAtTime(tb._lastFreq / 2, time);
            subOsc.frequency.exponentialRampToValueAtTime(noteFreq / 2, time + tb.slideTime);
        } else {
            subOsc.frequency.setValueAtTime(noteFreq / 2, time);
        }
        
        // Oscillator mixer
        const oscGain = ctx.createGain();
        const subGain = ctx.createGain();
        oscGain.gain.value = 1 - tb.subOsc * 0.5;
        subGain.gain.value = tb.subOsc;
        
        // --- FILTER (Ladder) ---
        
        const filter = MC303.createLadderFilter(ctx, tb.cutoff, tb.resonance);
        
        // --- FILTER ENVELOPE ---
        
        // Calculate envelope depth based on envMod
        const envDepth = (tb.envMod / 100) * 4000;
        const accentBoost = stepAccent ? (tb.accent / 100) * 3000 : 0;
        const peakFreq = Math.min(18000, tb.cutoff + envDepth + accentBoost);
        const decayTime = stepAccent ? tb.decay * 0.7 : tb.decay; // Faster decay on accent
        
        // Envelope attack spike
        filter.setFrequencyAtTime(tb.cutoff, time);
        filter.exponentialRampToFrequency(peakFreq, time + 0.005);
        filter.exponentialRampToFrequency(tb.cutoff, time + 0.005 + decayTime);
        
        // --- LFO MODULATION ---
        
        let lfoSystem = null;
        if (tb.lfo.enabled && tb.lfo.depth > 0) {
            lfoSystem = MC303.create303LFO(ctx);
            
            // Connect LFO to filter frequency (all stages)
            if (tb.lfo.target === 'filter' || tb.lfo.target === 'both') {
                filter.stages.forEach(stage => {
                    lfoSystem.gain.connect(stage.frequency);
                });
            }
            
            // Connect LFO to pitch
            if (tb.lfo.target === 'pitch' || tb.lfo.target === 'both') {
                const pitchLfoGain = ctx.createGain();
                pitchLfoGain.gain.value = tb.lfo.depth / 10; // Scale for pitch
                lfoSystem.node.connect(pitchLfoGain);
                pitchLfoGain.connect(osc.frequency);
                pitchLfoGain.connect(subOsc.frequency);
            }
            
            lfoSystem.start(time);
        }
        
        // --- AMP ENVELOPE ---
        
        const ampEnv = ctx.createGain();
        const level = tb.level * (stepAccent ? 1.3 : 1.0);
        ampEnv.gain.setValueAtTime(0, time);
        ampEnv.gain.linearRampToValueAtTime(level, time + 0.005);
        ampEnv.gain.setValueAtTime(level, time + 0.1);
        ampEnv.gain.exponentialRampToValueAtTime(0.001, time + tb.decay + 0.3);
        
        // --- DRIVE/SATURATION ---
        
        const drive = MC303.createSoftClipper(ctx, tb.drive);
        
        // --- PANNING ---
        
        const panner = ctx.createStereoPanner();
        panner.pan.value = tb.pan;
        
        // --- ROUTING ---
        
        osc.connect(oscGain);
        subOsc.connect(subGain);
        oscGain.connect(filter.input);
        subGain.connect(filter.input);
        filter.output.connect(drive);
        drive.connect(ampEnv);
        ampEnv.connect(panner);
        panner.connect(MC303.audio.filter); // To master chain
        
        // --- START ---
        
        osc.start(time);
        subOsc.start(time);
        
        // --- STOP ---
        
        const stopTime = time + tb.decay + 0.5;
        osc.stop(stopTime);
        subOsc.stop(stopTime);
        if (lfoSystem) lfoSystem.stop(stopTime);
        
        // Remember frequency for slide
        tb._lastFreq = noteFreq;
    };
    
    // ============================================================
    // PATTERN WOBBLE (Progressive Build-Up like "Tone")
    // ============================================================
    
    // Automate LFO depth over time (for progressive builds)
    MC303.startWobbleAutomation = function(startDepth, endDepth, duration) {
        const tb = MC303.tb303;
        const startTime = Date.now();
        
        const automateWobble = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(1, elapsed / duration);
            
            // Exponential curve for more dramatic build
            const curve = progress * progress;
            tb.lfo.depth = startDepth + (endDepth - startDepth) * curve;
            
            // Update UI if available
            const depthEl = document.getElementById('tb303-lfo-depth');
            const depthVal = document.getElementById('tb303-lfo-depth-value');
            if (depthEl) depthEl.value = tb.lfo.depth;
            if (depthVal) depthVal.textContent = Math.round(tb.lfo.depth) + ' Hz';
            
            if (progress < 1) {
                requestAnimationFrame(automateWobble);
            }
        };
        
        requestAnimationFrame(automateWobble);
    };
    
    // ============================================================
    // CLASSIC ACID PATTERNS
    // ============================================================
    
    MC303.acidPatterns = {
        'Emmanuel Top - Tone': {
            notes: ['A1', 'A1', 'A2', 'A1', 'E2', 'A1', 'A2', 'G2', 
                    'A1', 'A1', 'C2', 'A1', 'E2', 'A1', 'D2', 'A1'],
            accents: [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0],
            slides:  [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0],
            settings: {
                cutoff: 350, resonance: 15, envMod: 70, decay: 0.25,
                waveform: 'sawtooth', lfoRate: 0.25, lfoDepth: 800
            }
        },
        'Classic Acid': {
            notes: ['C2', 'C2', 'C3', 'C2', 'D#2', 'C2', 'F2', 'C2',
                    'C2', 'G2', 'C3', 'C2', 'D#2', 'F2', 'G2', 'C2'],
            accents: [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            slides:  [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
            settings: {
                cutoff: 400, resonance: 18, envMod: 80, decay: 0.2,
                waveform: 'sawtooth', lfoRate: 0, lfoDepth: 0
            }
        },
        'Hardfloor Style': {
            notes: ['A1', 'A1', 'A1', 'A2', 'A1', 'C2', 'A1', 'D2',
                    'A1', 'A1', 'E2', 'A1', 'A1', 'F2', 'E2', 'D2'],
            accents: [1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1],
            slides:  [0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1],
            settings: {
                cutoff: 300, resonance: 20, envMod: 90, decay: 0.15,
                waveform: 'square', lfoRate: 0, lfoDepth: 0
            }
        },
        'Wobble Bass': {
            notes: ['E1', 'E1', 'E1', 'E1', 'E1', 'E1', 'E1', 'E1',
                    'G1', 'G1', 'G1', 'G1', 'A1', 'A1', 'B1', 'B1'],
            accents: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
            slides:  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
            settings: {
                cutoff: 200, resonance: 12, envMod: 40, decay: 0.4,
                waveform: 'sawtooth', lfoRate: 4, lfoDepth: 2000
            }
        }
    };
    
    MC303.loadAcidPattern = function(patternName) {
        const pattern = MC303.acidPatterns[patternName];
        if (!pattern) return;
        
        const tb = MC303.tb303;
        const s = pattern.settings;
        
        // Apply settings
        tb.cutoff = s.cutoff;
        tb.resonance = s.resonance;
        tb.envMod = s.envMod;
        tb.decay = s.decay;
        tb.waveform = s.waveform;
        tb.lfo.rate = s.lfoRate;
        tb.lfo.depth = s.lfoDepth;
        tb.lfo.enabled = s.lfoDepth > 0;
        
        // Apply pattern to bass1 track
        const currentPattern = MC303.getCurrentPattern();
        for (let i = 0; i < 16; i++) {
            currentPattern.bass1[i] = true;
            currentPattern.bass1Notes[i] = pattern.notes[i];
            tb.accentSteps[i] = pattern.accents[i] === 1;
            tb.slideSteps[i] = pattern.slides[i] === 1;
        }
        
        // Update UI
        MC303.update303UI();
        if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
        
        console.log(`🎹 Loaded acid pattern: ${patternName}`);
    };
    
    // ============================================================
    // UI UPDATE HELPER
    // ============================================================
    
    MC303.update303UI = function() {
        const tb = MC303.tb303;
        
        const updateSlider = (id, value, suffix = '') => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(id + '-value');
            if (el) el.value = value;
            if (valEl) valEl.textContent = (typeof value === 'number' ? 
                (value < 10 ? value.toFixed(2) : Math.round(value)) : value) + suffix;
        };
        
        updateSlider('tb303-cutoff', tb.cutoff, ' Hz');
        updateSlider('tb303-resonance', tb.resonance);
        updateSlider('tb303-envmod', tb.envMod, '%');
        updateSlider('tb303-decay', tb.decay, ' s');
        updateSlider('tb303-accent', tb.accent, '%');
        updateSlider('tb303-lfo-rate', tb.lfo.rate, ' Hz');
        updateSlider('tb303-lfo-depth', tb.lfo.depth, ' Hz');
        updateSlider('tb303-drive', tb.drive * 100, '%');
        updateSlider('tb303-sub', tb.subOsc * 100, '%');
        updateSlider('tb303-level', tb.level * 100, '%');
        
        const waveEl = document.getElementById('tb303-waveform');
        if (waveEl) waveEl.value = tb.waveform;
        
        const lfoWaveEl = document.getElementById('tb303-lfo-wave');
        if (lfoWaveEl) lfoWaveEl.value = tb.lfo.waveform;
        
        const lfoTargetEl = document.getElementById('tb303-lfo-target');
        if (lfoTargetEl) lfoTargetEl.value = tb.lfo.target;
        
        const slideEl = document.getElementById('tb303-slide-enabled');
        if (slideEl) slideEl.checked = tb.slideEnabled;
        
        const lfoEnabledEl = document.getElementById('tb303-lfo-enabled');
        if (lfoEnabledEl) lfoEnabledEl.checked = tb.lfo.enabled;
    };
    
    // ============================================================
    // INTEGRATION: Override bass1 to use 303 engine
    // ============================================================
    
    MC303._originalPlayBass = MC303.playBass;
    
    MC303.playBass303 = function(time, settings, freq, accent) {
        // Check if this is bass1 and 303 mode is enabled
        if (settings.trackId === 'bass1' && MC303.tb303.enabled !== false) {
            const stepIndex = MC303.trackSteps.bass1;
            MC303.play303(time, freq, stepIndex, accent);
        } else if (MC303._originalPlayBass) {
            MC303._originalPlayBass(time, settings, freq, accent);
        }
    };
    
    // Hook into the system (call this after all modules loaded)
    MC303.enable303Mode = function() {
        MC303.playBass = MC303.playBass303;
        console.log('🎛️ TB-303 Mode ENABLED on Bass 1');
    };
    
    MC303.disable303Mode = function() {
        if (MC303._originalPlayBass) {
            MC303.playBass = MC303._originalPlayBass;
        }
        console.log('🎛️ TB-303 Mode DISABLED');
    };
    
})(window.MC303 = window.MC303 || {});
