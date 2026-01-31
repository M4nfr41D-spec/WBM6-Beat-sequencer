/* ============================================================ */
/* WBM 5-303 ULTIMATE - AUDIO ENGINE (FIXED)                    */
/* Clean audio routing with proper gain staging                 */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // --- Audio Nodes ---
    MC303.audio = {
        context: null,
        masterGain: null,
        masterLimiter: null,
        analyser: null,
        filter: null,
        compressor: null,
        isInitialized: false
    };
    
    // --- Initialize Audio Context ---
    MC303.initAudio = function() {
        if (MC303.audio.isInitialized) return;
        
        try {
            MC303.audio.context = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = MC303.audio.context;
            
            // Master Gain - main volume control (higher default)
            MC303.audio.masterGain = ctx.createGain();
            MC303.audio.masterGain.gain.value = 1.0;  // LOUD default
            
            // Master Filter - very high cutoff for clean sound
            // THIS IS THE INPUT NODE - ALL SOUNDS CONNECT HERE
            MC303.audio.filter = ctx.createBiquadFilter();
            MC303.audio.filter.type = 'lowpass';
            MC303.audio.filter.frequency.value = 20000;
            MC303.audio.filter.Q.value = 0.5;
            
            // Master Compressor - gentle settings
            MC303.audio.compressor = ctx.createDynamicsCompressor();
            MC303.audio.compressor.threshold.value = -4;
            MC303.audio.compressor.knee.value = 8;
            MC303.audio.compressor.ratio.value = 3;
            MC303.audio.compressor.attack.value = 0.005;
            MC303.audio.compressor.release.value = 0.12;
            
            // Final Limiter - brick wall
            MC303.audio.masterLimiter = ctx.createDynamicsCompressor();
            MC303.audio.masterLimiter.threshold.value = -1;
            MC303.audio.masterLimiter.knee.value = 0;
            MC303.audio.masterLimiter.ratio.value = 20;
            MC303.audio.masterLimiter.attack.value = 0.001;
            MC303.audio.masterLimiter.release.value = 0.05;
            
            // Analyser for visualization
            MC303.audio.analyser = ctx.createAnalyser();
            MC303.audio.analyser.fftSize = 2048;
            MC303.audio.analyser.smoothingTimeConstant = 0.8;
            
            // Initialize effects chain (will handle filter→effects routing)
            if (MC303.initEffects) {
                MC303.initEffects();
            } else {
                // Fallback direct chain if no effects module
                // filter → compressor → limiter → masterGain → analyser → output
                MC303.audio.filter.connect(MC303.audio.compressor);
                MC303.audio.compressor.connect(MC303.audio.masterLimiter);
                MC303.audio.masterLimiter.connect(MC303.audio.masterGain);
                MC303.audio.masterGain.connect(MC303.audio.analyser);
                MC303.audio.analyser.connect(ctx.destination);
            }
            
            MC303.audio.isInitialized = true;
            console.log('🎧 Audio Engine initialized - Filter connected!');
            
        } catch (error) {
            console.error('Audio Engine error:', error);
        }
    };
    
    // --- Resume Audio Context ---
    MC303.resumeAudio = function() {
        if (MC303.audio.context && MC303.audio.context.state === 'suspended') {
            MC303.audio.context.resume();
        }
    };
    
    // --- Create Panner ---
    MC303.createPanner = function(panValue) {
        if (!MC303.audio.context) return null;
        const panner = MC303.audio.context.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, panValue || 0));
        return panner;
    };
    
    // --- Check if Track is Audible ---
    MC303.isTrackAudible = function(trackId) {
        const settings = MC303.trackSettings[trackId];
        if (!settings) return true;
        if (settings.mute) return false;
        
        const hasSolo = Object.values(MC303.trackSettings).some(t => t.solo);
        if (hasSolo && !settings.solo) return false;
        
        return true;
    };
    
    // --- Get Audio Time ---
    MC303.getTime = function() {
        return MC303.audio.context ? MC303.audio.context.currentTime : 0;
    };
    
    // --- Set Master Volume ---
    MC303.setMasterVolume = function(value) {
        if (MC303.audio.masterGain) {
            const vol = Math.pow(value / 100, 1.2) * 1.2;
            MC303.audio.masterGain.gain.setTargetAtTime(Math.min(vol, 1.5), MC303.getTime(), 0.02);
        }
    };
    
    // --- Set Master Filter ---
    MC303.setMasterFilter = function(cutoff, resonance) {
        if (MC303.audio.filter) {
            MC303.audio.filter.frequency.setTargetAtTime(cutoff, MC303.getTime(), 0.02);
            MC303.audio.filter.Q.value = resonance;
        }
    };
    
})(window.MC303 = window.MC303 || {});
