/* ============================================================ */
/* WBM 5-303 ULTIMATE - EFFECTS                                 */
/* Distortion, reverb, delay effects chain                      */
/* FIXED: Proper filter→effects→output chain                    */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // --- Effects Nodes ---
    MC303.effects = {
        distortion: null,
        distortionGain: null,
        delay: null,
        delayFeedback: null,
        delayMix: null,
        reverb: null,
        reverbMix: null
    };
    
    // --- Initialize Effects Chain ---
    MC303.initEffects = function() {
        const ctx = MC303.audio.context;
        
        // Distortion (Waveshaper)
        MC303.effects.distortion = ctx.createWaveShaper();
        MC303.effects.distortion.curve = MC303.makeDistortionCurve('soft', 0);
        MC303.effects.distortion.oversample = '4x';
        
        MC303.effects.distortionGain = ctx.createGain();
        MC303.effects.distortionGain.gain.value = 1;
        
        // Delay
        MC303.effects.delay = ctx.createDelay(1.0);
        MC303.effects.delay.delayTime.value = 0.25;
        
        MC303.effects.delayFeedback = ctx.createGain();
        MC303.effects.delayFeedback.gain.value = 0.3;
        
        MC303.effects.delayMix = ctx.createGain();
        MC303.effects.delayMix.gain.value = 0;
        
        // Reverb (Convolver)
        MC303.effects.reverb = ctx.createConvolver();
        MC303.effects.reverbMix = ctx.createGain();
        MC303.effects.reverbMix.gain.value = 0.2;
        MC303.createReverbImpulse('room');
        
        // ============================================
        // FIXED SIGNAL CHAIN:
        // filter → distortion → distortionGain → delay/reverb → compressor → limiter → masterGain → output
        // ============================================
        
        // 1. FILTER connects to DISTORTION (this is the input!)
        MC303.audio.filter.connect(MC303.effects.distortion);
        
        // 2. Distortion → distortionGain
        MC303.effects.distortion.connect(MC303.effects.distortionGain);
        
        // 3. DistortionGain splits to: delay, reverb, and direct to compressor
        MC303.effects.distortionGain.connect(MC303.effects.delay);
        MC303.effects.distortionGain.connect(MC303.effects.reverb);
        MC303.effects.distortionGain.connect(MC303.audio.compressor);  // Dry signal
        
        // 4. Delay feedback loop
        MC303.effects.delay.connect(MC303.effects.delayFeedback);
        MC303.effects.delayFeedback.connect(MC303.effects.delay);
        MC303.effects.delay.connect(MC303.effects.delayMix);
        
        // 5. Reverb → reverbMix
        MC303.effects.reverb.connect(MC303.effects.reverbMix);
        
        // 6. Wet signals to compressor
        MC303.effects.delayMix.connect(MC303.audio.compressor);
        MC303.effects.reverbMix.connect(MC303.audio.compressor);
        
        // 7. Compressor → Limiter → MasterGain → Analyser → Destination
        MC303.audio.compressor.connect(MC303.audio.masterLimiter);
        MC303.audio.masterLimiter.connect(MC303.audio.masterGain);
        MC303.audio.masterGain.connect(MC303.audio.analyser);
        MC303.audio.analyser.connect(ctx.destination);
        
        console.log('🎚️ Effects chain initialized - FILTER CONNECTED!');
    };
    
    // --- Create Distortion Curve ---
    MC303.makeDistortionCurve = function(type, amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const drive = amount / 100;
        
        // Linear pass-through when drive is 0
        if (drive === 0) {
            for (let i = 0; i < samples; i++) {
                curve[i] = (i * 2 / samples) - 1;
            }
            return curve;
        }
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2 / samples) - 1;
            
            switch(type) {
                case 'soft':
                    const k = 2 * drive / (1 - drive + 0.01);
                    curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
                    break;
                    
                case 'hard':
                    const threshold = 1 - drive * 0.9;
                    if (x > threshold) curve[i] = threshold;
                    else if (x < -threshold) curve[i] = -threshold;
                    else curve[i] = x;
                    break;
                    
                case 'tube':
                    const driven = x * (1 + drive * 5);
                    curve[i] = (driven > 0 ? 1 - Math.exp(-driven) : -1 + Math.exp(driven)) * 0.7;
                    break;
                    
                case 'fuzz':
                    const fuzzed = Math.tanh(x * drive * 50);
                    curve[i] = (fuzzed + 0.1 * Math.sin(fuzzed * Math.PI * 3) * drive) * 0.5;
                    break;
                    
                case 'tape':
                    curve[i] = Math.tanh(x * (1 + drive * 3)) * 0.9;
                    break;
                    
                default:
                    curve[i] = Math.tanh(x * (1 + drive * 10)) * 0.8;
            }
        }
        return curve;
    };
    
    // --- Create Reverb Impulse Response ---
    MC303.createReverbImpulse = function(type) {
        const ctx = MC303.audio.context;
        let duration, decay, preDelay;
        
        switch(type) {
            case 'room':
                duration = 0.8; decay = 2; preDelay = 0.01;
                break;
            case 'hall':
                duration = 2.5; decay = 2.5; preDelay = 0.02;
                break;
            case 'church':
                duration = 4; decay = 3; preDelay = 0.05;
                break;
            case 'plate':
                duration = 1.5; decay = 4; preDelay = 0.005;
                break;
            case 'gated':
                duration = 0.4; decay = 0.5; preDelay = 0.01;
                break;
            case 'spring':
                duration = 1; decay = 3; preDelay = 0.015;
                break;
            default:
                duration = 1; decay = 2; preDelay = 0.01;
        }
        
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        const impulse = ctx.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                if (t < preDelay) {
                    channelData[i] = 0;
                    continue;
                }
                
                let envelope = Math.exp(-decay * (t - preDelay));
                
                // Gated reverb cut-off
                if (type === 'gated' && t > duration * 0.7) {
                    envelope *= Math.max(0, 1 - (t - duration * 0.7) / 0.05);
                }
                
                channelData[i] = (Math.random() * 2 - 1) * envelope;
            }
        }
        
        MC303.effects.reverb.buffer = impulse;
    };
    
    // --- Update Distortion ---
    MC303.updateDistortion = function(type, amount) {
        MC303.fxSettings.distortion.type = type;
        MC303.fxSettings.distortion.amount = amount;
        if (MC303.effects.distortion) {
            MC303.effects.distortion.curve = MC303.makeDistortionCurve(type, amount);
        }
    };
    
    // --- Update Reverb ---
    MC303.updateReverb = function(type, mix) {
        MC303.fxSettings.reverb.type = type;
        MC303.fxSettings.reverb.mix = mix;
        if (MC303.audio.context) {
            MC303.createReverbImpulse(type);
        }
        if (MC303.effects.reverbMix) {
            MC303.effects.reverbMix.gain.value = mix;
        }
    };
    
    // --- Update Delay ---
    MC303.updateDelay = function(time, feedback, mix) {
        MC303.fxSettings.delay.time = time;
        MC303.fxSettings.delay.feedback = feedback;
        MC303.fxSettings.delay.mix = mix;
        
        if (MC303.effects.delay) {
            MC303.effects.delay.delayTime.value = time;
        }
        if (MC303.effects.delayFeedback) {
            MC303.effects.delayFeedback.gain.value = feedback;
        }
        if (MC303.effects.delayMix) {
            MC303.effects.delayMix.gain.value = mix;
        }
    };
    
    // --- Update Compressor ---
    MC303.updateCompressor = function(threshold, ratio) {
        MC303.fxSettings.compressor.threshold = threshold;
        MC303.fxSettings.compressor.ratio = ratio;
        
        if (MC303.audio.compressor) {
            MC303.audio.compressor.threshold.value = threshold;
            MC303.audio.compressor.ratio.value = ratio;
        }
    };
    
})(window.MC303 = window.MC303 || {});
