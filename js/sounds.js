/* ============================================================ */
/* WBM 5-303 ULTIMATE - SOUND SYNTHESIS                         */
/* All sound generation: drums, bass, FX                        */
/* VERIFIED: All 17 sounds connect to filter() → effects chain  */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    const ctx = () => MC303.audio.context;
    const filter = () => MC303.audio.filter;
    
    // ========================================
    // KICK DRUM (FIXED: Louder, cleaner, no clicks)
    // ========================================
    MC303.playKick = function(time, settings, noteFreq, accent = false) {
        if (!MC303.isTrackAudible(settings.trackId || 'kick1')) return;
        
        const osc = ctx().createOscillator();
        const subOsc = ctx().createOscillator();
        const oscGain = ctx().createGain();
        const subGain = ctx().createGain();
        const masterGain = ctx().createGain();
        const panner = MC303.createPanner(settings.pan || 0);
        
        const filterMod = settings._filterMod || 1.0;
        
        osc.type = settings.wave || 'sine';
        subOsc.type = 'sine';
        
        const startFreq = noteFreq * (accent ? 1.2 : 1.0);
        osc.detune.value = settings.detune || 0;
        
        // Pitch envelope - smooth sweep
        osc.frequency.setValueAtTime(startFreq * 3.5, time);
        osc.frequency.exponentialRampToValueAtTime(startFreq, time + 0.025);
        osc.frequency.exponentialRampToValueAtTime(noteFreq * 0.5, time + 0.15);
        
        // Sub oscillator for weight
        subOsc.frequency.setValueAtTime(noteFreq * 0.9, time);
        subOsc.frequency.exponentialRampToValueAtTime(noteFreq * 0.4, time + 0.25);
        
        // LFO
        if (settings.lfo && settings.lfo.depth > 0 && settings.lfo.target === 'pitch') {
            const lfo = ctx().createOscillator();
            const lfoGain = ctx().createGain();
            lfo.type = 'sine';
            lfo.frequency.value = settings.lfo.rate;
            lfoGain.gain.value = startFreq * settings.lfo.depth * 0.3;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start(time);
            lfo.stop(time + 0.5);
        }
        
        const adsr = settings.adsr;
        const decay = settings.decay || adsr.decay;
        // LOUDER: Much higher gain values
        const gainValue = Math.min((accent ? 1.0 : 0.9) * settings.level, 1.0);
        
        // FIXED: Smooth attack to prevent clicks
        oscGain.gain.setValueAtTime(0.0001, time);
        oscGain.gain.exponentialRampToValueAtTime(gainValue, time + 0.005);
        oscGain.gain.setValueAtTime(gainValue, time + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(gainValue * 0.5, time + decay * 0.3);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, time + decay + adsr.release);
        
        // Sub gain - adds low end weight
        subGain.gain.setValueAtTime(0.0001, time);
        subGain.gain.exponentialRampToValueAtTime(gainValue * 0.6 * filterMod, time + 0.008);
        subGain.gain.exponentialRampToValueAtTime(0.0001, time + decay * 0.9);
        
        // Routing
        osc.connect(oscGain);
        subOsc.connect(subGain);
        oscGain.connect(masterGain);
        subGain.connect(masterGain);
        masterGain.connect(panner);
        panner.connect(filter());
        
        osc.start(time);
        subOsc.start(time);
        osc.stop(time + decay + adsr.release + 0.1);
        subOsc.stop(time + decay + 0.15);
    };
    
    // ========================================
    // SNARE DRUM (FIXED: Louder, cleaner)
    // ========================================
    MC303.playSnare = function(time, settings, noteFreq, accent = false) {
        if (!MC303.isTrackAudible(settings.trackId || 'snare1')) return;
        
        const panner = MC303.createPanner(settings.pan || 0);
        const adsr = settings.adsr;
        const filterMod = settings._filterMod || 1.0;
        const decay = settings.decay || adsr.decay;
        
        // Noise component
        const noise = ctx().createBufferSource();
        const noiseBuffer = ctx().createBuffer(1, ctx().sampleRate * 0.5, ctx().sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        
        const noiseGain = ctx().createGain();
        // LOUDER gain values
        const gainValue = Math.min((accent ? 0.95 : 0.8) * settings.level, 1.0);
        
        // FIXED: Smooth attack, no clicks
        noiseGain.gain.setValueAtTime(0.0001, time);
        noiseGain.gain.exponentialRampToValueAtTime(gainValue * 0.8, time + 0.003);
        noiseGain.gain.exponentialRampToValueAtTime(gainValue * 0.4, time + decay * 0.35);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
        
        const snareFilter = ctx().createBiquadFilter();
        snareFilter.type = 'bandpass';
        snareFilter.frequency.value = (noteFreq * 1.2) * filterMod;
        snareFilter.Q.value = 1.2;
        
        const snareHP = ctx().createBiquadFilter();
        snareHP.type = 'highpass';
        snareHP.frequency.value = 120;
        
        // LFO
        if (settings.lfo && settings.lfo.depth > 0) {
            const lfo = ctx().createOscillator();
            const lfoGain = ctx().createGain();
            lfo.type = 'sine';
            lfo.frequency.value = settings.lfo.rate;
            lfoGain.gain.value = noteFreq * settings.lfo.depth * 1.5;
            lfo.connect(lfoGain);
            lfoGain.connect(snareFilter.frequency);
            lfo.start(time);
            lfo.stop(time + decay + 0.1);
        }
        
        // Tone hit - body of snare
        const toneOsc = ctx().createOscillator();
        const toneGain = ctx().createGain();
        toneOsc.type = 'triangle';
        toneOsc.frequency.setValueAtTime(noteFreq * 2.5, time);
        toneOsc.frequency.exponentialRampToValueAtTime(noteFreq * 0.5, time + 0.04);
        toneOsc.detune.value = settings.detune || 0;
        
        toneGain.gain.setValueAtTime(0.0001, time);
        toneGain.gain.exponentialRampToValueAtTime(gainValue * 0.6, time + 0.002);
        toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
        
        toneOsc.connect(toneGain);
        toneGain.connect(panner);
        panner.connect(filter());
        toneOsc.start(time);
        toneOsc.stop(time + 0.08);
        
        noise.connect(snareFilter);
        snareFilter.connect(snareHP);
        snareHP.connect(noiseGain);
        noiseGain.connect(panner);
        noise.start(time);
        noise.stop(time + decay + 0.05);
    };
    
    // ========================================
    // HI-HAT (FIXED: Cleaner metallic sound)
    // ========================================
    MC303.playHat = function(time, settings, noteFreq, accent = false) {
        if (!MC303.isTrackAudible(settings.trackId || 'hat1')) return;
        
        const panner = MC303.createPanner(settings.pan || 0);
        const adsr = settings.adsr;
        const filterMod = settings._filterMod || 1.0;
        const decay = settings.decay || adsr.decay;
        
        // Metallic oscillators - classic 808/909 ratios
        const osc1 = ctx().createOscillator();
        const osc2 = ctx().createOscillator();
        const osc3 = ctx().createOscillator();
        const oscGain = ctx().createGain();
        
        osc1.type = 'square';
        osc2.type = 'square';
        osc3.type = 'square';
        // Classic metallic ratios
        const baseFreq = noteFreq / 10;  // Scaled down base frequency
        osc1.frequency.value = baseFreq * 1.0;
        osc2.frequency.value = baseFreq * 1.4471;
        osc3.frequency.value = baseFreq * 1.6170;
        
        // Noise layer for texture
        const noise = ctx().createBufferSource();
        const noiseBuffer = ctx().createBuffer(1, ctx().sampleRate * 0.3, ctx().sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        
        const noiseGain = ctx().createGain();
        // LOUDER gain values
        const gainValue = Math.min((accent ? 0.7 : 0.55) * settings.level, 0.9);
        
        // FIXED: Smooth envelopes, no clicks
        noiseGain.gain.setValueAtTime(0.0001, time);
        noiseGain.gain.exponentialRampToValueAtTime(gainValue, time + 0.002);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
        
        oscGain.gain.setValueAtTime(0.0001, time);
        oscGain.gain.exponentialRampToValueAtTime(gainValue * 0.4, time + 0.002);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, time + decay * 0.7);
        
        // High-pass filter - removes low rumble
        const hatFilter = ctx().createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.value = Math.max(4000, (noteFreq * 0.6) * filterMod);
        hatFilter.Q.value = 0.5;  // Lower Q = less harsh
        
        // Bandpass for color
        const hatBP = ctx().createBiquadFilter();
        hatBP.type = 'bandpass';
        hatBP.frequency.value = noteFreq * filterMod;
        hatBP.Q.value = 1.5;
        
        // LFO
        if (settings.lfo && settings.lfo.depth > 0 && settings.lfo.target === 'filter') {
            const lfo = ctx().createOscillator();
            const lfoGain = ctx().createGain();
            lfo.type = 'sine';
            lfo.frequency.value = settings.lfo.rate;
            lfoGain.gain.value = noteFreq * settings.lfo.depth * 1.2;
            lfo.connect(lfoGain);
            lfoGain.connect(hatFilter.frequency);
            lfo.start(time);
            lfo.stop(time + decay + 0.1);
        }
        
        // Oscillators → Bandpass → Gain → Highpass
        osc1.connect(hatBP);
        osc2.connect(hatBP);
        osc3.connect(hatBP);
        hatBP.connect(oscGain);
        oscGain.connect(hatFilter);
        
        // Noise → Highpass
        noise.connect(hatFilter);
        hatFilter.connect(noiseGain);
        noiseGain.connect(panner);
        panner.connect(filter());
        
        osc1.start(time);
        osc2.start(time);
        osc3.start(time);
        noise.start(time);
        osc1.stop(time + decay + 0.02);
        osc2.stop(time + decay + 0.02);
        osc3.stop(time + decay + 0.02);
        noise.stop(time + decay + 0.05);
    };
    
    // ========================================
    // BASS (FIXED: Louder, richer sound)
    // ========================================
    MC303.playBass = function(time, settings, noteFreq, accent = false) {
        if (!MC303.isTrackAudible(settings.trackId || 'bass1')) return;
        
        const panner = MC303.createPanner(settings.pan || 0);
        const osc = ctx().createOscillator();
        const osc2 = ctx().createOscillator();
        const osc3 = ctx().createOscillator();
        const oscGain = ctx().createGain();
        const bassFilter = ctx().createBiquadFilter();
        const filterMod = settings._filterMod || 1.0;
        
        osc.type = settings.wave || 'sawtooth';
        osc2.type = settings.wave === 'sawtooth' ? 'square' : 'sawtooth';
        osc3.type = 'sine';  // Sub
        
        osc.frequency.value = noteFreq;
        osc2.frequency.value = noteFreq * 1.003;  // Slight detune for thickness
        osc3.frequency.value = noteFreq * 0.5;    // Sub octave
        osc.detune.value = settings.detune || 0;
        osc2.detune.value = (settings.detune || 0) + 8;
        
        bassFilter.type = 'lowpass';
        bassFilter.Q.value = 6;  // Slightly less resonance
        
        const adsr = settings.adsr;
        const decay = settings.decay || adsr.decay;
        // LOUDER bass
        const baseGain = Math.min((accent ? 0.85 : 0.7) * settings.level, 0.95);
        
        // Filter envelope
        const filterBase = noteFreq * filterMod;
        const filterPeak = filterBase * 8;
        bassFilter.frequency.setValueAtTime(filterBase, time);
        bassFilter.frequency.linearRampToValueAtTime(filterPeak, time + adsr.attack * 0.4);
        bassFilter.frequency.exponentialRampToValueAtTime(filterBase * 2, time + adsr.attack + decay);
        
        // LFO
        if (settings.lfo && settings.lfo.depth > 0) {
            const lfo = ctx().createOscillator();
            const lfoGain = ctx().createGain();
            lfo.type = 'sine';
            lfo.frequency.value = settings.lfo.rate;
            
            if (settings.lfo.target === 'filter') {
                lfoGain.gain.value = noteFreq * settings.lfo.depth * 5;
                lfo.connect(lfoGain);
                lfoGain.connect(bassFilter.frequency);
            } else if (settings.lfo.target === 'pitch') {
                lfoGain.gain.value = noteFreq * settings.lfo.depth * 0.3;
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                lfoGain.connect(osc2.frequency);
            }
            lfo.start(time);
            lfo.stop(time + adsr.attack + decay + adsr.release + 0.1);
        }
        
        // FIXED: Smooth amp envelope, no clicks
        oscGain.gain.setValueAtTime(0.0001, time);
        oscGain.gain.exponentialRampToValueAtTime(baseGain, time + adsr.attack);
        oscGain.gain.setValueAtTime(baseGain * adsr.sustain, time + adsr.attack + decay);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, time + adsr.attack + decay + adsr.release);
        
        osc.connect(bassFilter);
        osc2.connect(bassFilter);
        osc3.connect(bassFilter);
        bassFilter.connect(oscGain);
        oscGain.connect(panner);
        panner.connect(filter());
        
        osc.start(time);
        osc2.start(time);
        osc3.start(time);
        const stopTime = time + adsr.attack + decay + adsr.release + 0.1;
        osc.stop(stopTime);
        osc2.stop(stopTime);
        osc3.stop(stopTime);
    };
    
    // ========================================
    // FX ROUTER
    // ========================================
    MC303.playFX = function(time, settings, noteFreq, accent = false) {
        if (!MC303.isTrackAudible(settings.trackId || 'fx1')) return;
        
        const gainMult = accent ? 1.1 : 1.0;
        const panner = MC303.createPanner(settings.pan || 0);
        
        switch(settings.type) {
            case 'cowbell': MC303.playCowbell(time, noteFreq, settings.level * gainMult, settings.adsr, panner, settings.detune); break;
            case 'gunshot': MC303.playGunshot(time, noteFreq, settings.level * gainMult, settings.adsr, panner); break;
            case 'creaky': MC303.playCreakyDoor(time, noteFreq, settings.level * gainMult, settings.adsr, panner); break;
            case 'clap': MC303.playClap(time, settings.level * gainMult, settings.adsr, panner); break;
            case 'rimshot': MC303.playRimshot(time, noteFreq, settings.level * gainMult, settings.adsr, panner); break;
            case 'acidstab': MC303.playAcidStab(time, noteFreq, settings.level * gainMult, settings.adsr, panner, settings.detune); break;
            case 'hoover': MC303.playHoover(time, noteFreq, settings.level * gainMult, settings.adsr, panner); break;
            case 'ravestab': MC303.playRaveStab(time, noteFreq, settings.level * gainMult, settings.adsr, panner); break;
            case 'laser': MC303.playLaser(time, noteFreq, settings.level * gainMult, settings.adsr, panner); break;
            case 'reese': MC303.playReese(time, noteFreq, settings.level * gainMult, settings.adsr, panner, settings.detune); break;
            case 'fmbell': MC303.playFMBell(time, noteFreq, settings.level * gainMult, settings.adsr, panner); break;
            case 'whitenoise': MC303.playWhiteNoiseSweep(time, noteFreq, settings.level * gainMult, settings.adsr, panner); break;
            default: MC303.playCowbell(time, noteFreq, settings.level * gainMult, settings.adsr, panner, settings.detune);
        }
    };
    
    // ========================================
    // FX SOUNDS
    // ========================================
    
    MC303.playCowbell = function(time, pitch, level, adsr, panner, detune = 0) {
        const osc1 = ctx().createOscillator();
        const osc2 = ctx().createOscillator();
        const gain = ctx().createGain();
        
        osc1.type = 'square';
        osc2.type = 'square';
        osc1.detune.value = detune;
        osc2.detune.value = detune;
        osc1.frequency.value = pitch;
        osc2.frequency.value = pitch * 0.675;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.25 * level, time + adsr.attack);
        gain.gain.exponentialRampToValueAtTime(0.01, time + adsr.attack + adsr.decay);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + adsr.attack + adsr.decay);
        osc2.stop(time + adsr.attack + adsr.decay);
    };
    
    MC303.playGunshot = function(time, pitch, level, adsr, panner) {
        const noise = ctx().createBufferSource();
        const noiseBuffer = ctx().createBuffer(1, ctx().sampleRate * 0.1, ctx().sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
        noise.buffer = noiseBuffer;
        
        const gain = ctx().createGain();
        const shootFilter = ctx().createBiquadFilter();
        shootFilter.type = 'lowpass';
        shootFilter.frequency.setValueAtTime(8000, time);
        shootFilter.frequency.exponentialRampToValueAtTime(pitch, time + 0.1);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.7 * level, time + adsr.attack);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        noise.connect(shootFilter);
        shootFilter.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
        noise.start(time);
        noise.stop(time + 0.1);
    };
    
    MC303.playCreakyDoor = function(time, pitch, level, adsr, panner) {
        const noise = ctx().createBufferSource();
        const noiseBuffer = ctx().createBuffer(1, ctx().sampleRate * 0.4, ctx().sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
        noise.buffer = noiseBuffer;
        
        const gain = ctx().createGain();
        const creakyFilter = ctx().createBiquadFilter();
        creakyFilter.type = 'bandpass';
        creakyFilter.frequency.setValueAtTime(3000, time);
        creakyFilter.frequency.exponentialRampToValueAtTime(pitch, time + 0.4);
        creakyFilter.Q.value = 30;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.5 * level, time + adsr.attack);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        
        noise.connect(creakyFilter);
        creakyFilter.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
        noise.start(time);
        noise.stop(time + 0.4);
    };
    
    MC303.playClap = function(time, level, adsr, panner) {
        for (let burst = 0; burst < 3; burst++) {
            const noise = ctx().createBufferSource();
            const noiseBuffer = ctx().createBuffer(1, ctx().sampleRate * 0.02, ctx().sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
            noise.buffer = noiseBuffer;
            
            const gain = ctx().createGain();
            const clapFilter = ctx().createBiquadFilter();
            clapFilter.type = 'bandpass';
            clapFilter.frequency.value = 2000;
            clapFilter.Q.value = 2;
            
            const burstTime = time + burst * 0.01;
            gain.gain.setValueAtTime(0, burstTime);
            gain.gain.linearRampToValueAtTime(0.3 * level, burstTime + 0.002);
            gain.gain.exponentialRampToValueAtTime(0.01, burstTime + 0.05);
            
            noise.connect(clapFilter);
            clapFilter.connect(gain);
            gain.connect(panner);
            panner.connect(filter());
            noise.start(burstTime);
            noise.stop(burstTime + 0.05);
        }
    };
    
    MC303.playRimshot = function(time, pitch, level, adsr, panner) {
        const osc = ctx().createOscillator();
        const gain = ctx().createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch * 5, time);
        osc.frequency.exponentialRampToValueAtTime(pitch, time + 0.01);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4 * level, time + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
        osc.start(time);
        osc.stop(time + 0.05);
    };
    
    // --- ACID/TRANCE FX ---
    
    MC303.playAcidStab = function(time, pitch, level, adsr, panner, detune = 0) {
        const osc = ctx().createOscillator();
        const osc2 = ctx().createOscillator();
        const gain = ctx().createGain();
        const acidFilter = ctx().createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc2.type = 'square';
        osc.frequency.value = pitch;
        osc2.frequency.value = pitch * 1.005;
        osc.detune.value = detune;
        osc2.detune.value = detune + 7;
        
        acidFilter.type = 'lowpass';
        acidFilter.frequency.setValueAtTime(pitch * 8, time);
        acidFilter.frequency.exponentialRampToValueAtTime(pitch * 0.5, time + 0.15);
        acidFilter.Q.value = 18;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.35 * level, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        osc.connect(acidFilter);
        osc2.connect(acidFilter);
        acidFilter.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
        osc.start(time);
        osc2.start(time);
        osc.stop(time + 0.2);
        osc2.stop(time + 0.2);
    };
    
    MC303.playHoover = function(time, pitch, level, adsr, panner) {
        const numOscs = 5;
        const gain = ctx().createGain();
        const hooverFilter = ctx().createBiquadFilter();
        
        hooverFilter.type = 'lowpass';
        hooverFilter.frequency.setValueAtTime(pitch * 6, time);
        hooverFilter.frequency.exponentialRampToValueAtTime(pitch * 2, time + 0.3);
        hooverFilter.Q.value = 4;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.25 * level, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        
        for (let i = 0; i < numOscs; i++) {
            const osc = ctx().createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = pitch * (1 + (i - 2) * 0.02);
            osc.frequency.setValueAtTime(pitch * 1.5, time);
            osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, time + 0.3);
            osc.connect(hooverFilter);
            osc.start(time);
            osc.stop(time + 0.4);
        }
        
        hooverFilter.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
    };
    
    MC303.playRaveStab = function(time, pitch, level, adsr, panner) {
        const osc1 = ctx().createOscillator();
        const osc2 = ctx().createOscillator();
        const osc3 = ctx().createOscillator();
        const gain = ctx().createGain();
        const raveFilter = ctx().createBiquadFilter();
        
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc3.type = 'square';
        osc1.frequency.value = pitch;
        osc2.frequency.value = pitch * 2;
        osc3.frequency.value = pitch * 1.5;
        
        raveFilter.type = 'bandpass';
        raveFilter.frequency.value = pitch * 4;
        raveFilter.Q.value = 3;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3 * level, time + 0.001);
        gain.gain.setValueAtTime(0.25 * level, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        osc1.connect(raveFilter);
        osc2.connect(raveFilter);
        osc3.connect(raveFilter);
        raveFilter.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
        osc1.start(time);
        osc2.start(time);
        osc3.start(time);
        osc1.stop(time + 0.15);
        osc2.stop(time + 0.15);
        osc3.stop(time + 0.15);
    };
    
    MC303.playLaser = function(time, pitch, level, adsr, panner) {
        const osc = ctx().createOscillator();
        const gain = ctx().createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch * 10, time);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.2, time + 0.15);
        
        gain.gain.setValueAtTime(0.4 * level, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
        osc.start(time);
        osc.stop(time + 0.15);
    };
    
    MC303.playReese = function(time, pitch, level, adsr, panner, detune = 0) {
        const gain = ctx().createGain();
        const reeseFilter = ctx().createBiquadFilter();
        
        reeseFilter.type = 'lowpass';
        reeseFilter.frequency.value = pitch * 4;
        reeseFilter.Q.value = 2;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4 * level, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        
        for (let i = 0; i < 4; i++) {
            const osc = ctx().createOscillator();
            osc.type = 'sawtooth';
            const detuneAmount = (i - 1.5) * 15 + detune;
            osc.detune.value = detuneAmount;
            osc.frequency.value = pitch;
            osc.connect(reeseFilter);
            osc.start(time);
            osc.stop(time + 0.4);
        }
        
        reeseFilter.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
    };
    
    MC303.playFMBell = function(time, pitch, level, adsr, panner) {
        const carrier = ctx().createOscillator();
        const modulator = ctx().createOscillator();
        const modGain = ctx().createGain();
        const gain = ctx().createGain();
        
        carrier.type = 'sine';
        modulator.type = 'sine';
        carrier.frequency.value = pitch;
        modulator.frequency.value = pitch * 3.5;
        
        modGain.gain.setValueAtTime(pitch * 2, time);
        modGain.gain.exponentialRampToValueAtTime(pitch * 0.1, time + 0.5);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.35 * level, time + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);
        
        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
        modulator.start(time);
        carrier.start(time);
        modulator.stop(time + 0.6);
        carrier.stop(time + 0.6);
    };
    
    MC303.playWhiteNoiseSweep = function(time, pitch, level, adsr, panner) {
        const noise = ctx().createBufferSource();
        const noiseBuffer = ctx().createBuffer(1, ctx().sampleRate * 0.5, ctx().sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
        noise.buffer = noiseBuffer;
        
        const gain = ctx().createGain();
        const sweepFilter = ctx().createBiquadFilter();
        
        sweepFilter.type = 'bandpass';
        sweepFilter.Q.value = 8;
        
        if (pitch > 500) {
            sweepFilter.frequency.setValueAtTime(200, time);
            sweepFilter.frequency.exponentialRampToValueAtTime(pitch * 4, time + 0.3);
        } else {
            sweepFilter.frequency.setValueAtTime(pitch * 8, time);
            sweepFilter.frequency.exponentialRampToValueAtTime(100, time + 0.3);
        }
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.35 * level, time + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);
        
        noise.connect(sweepFilter);
        sweepFilter.connect(gain);
        gain.connect(panner);
        panner.connect(filter());
        noise.start(time);
        noise.stop(time + 0.35);
    };
    
    // ========================================
    // PREVIEW NOTE (for piano)
    // ========================================
    MC303.playPreviewNote = function(freq) {
        const time = ctx().currentTime;
        const osc = ctx().createOscillator();
        const osc2 = ctx().createOscillator();
        const oscGain = ctx().createGain();
        const previewFilter = ctx().createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc2.type = 'square';
        osc.frequency.value = freq;
        osc2.frequency.value = freq * 1.003;
        
        previewFilter.type = 'lowpass';
        previewFilter.frequency.setValueAtTime(freq * 6, time);
        previewFilter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + 0.2);
        previewFilter.Q.value = 4;
        
        oscGain.gain.setValueAtTime(0, time);
        oscGain.gain.linearRampToValueAtTime(0.5, time + 0.01);
        oscGain.gain.linearRampToValueAtTime(0.3, time + 0.1);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        
        osc.connect(previewFilter);
        osc2.connect(previewFilter);
        previewFilter.connect(oscGain);
        oscGain.connect(filter());
        osc.start(time);
        osc2.start(time);
        osc.stop(time + 0.4);
        osc2.stop(time + 0.4);
    };
    
})(window.MC303 = window.MC303 || {});
