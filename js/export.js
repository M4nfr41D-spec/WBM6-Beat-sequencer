/* ============================================================ */
/* WBM 5-303 ULTIMATE - EXPORT MODULE                           */
/* WAV/MP3 export with offline audio rendering & limiter        */
/* Quality: 44.1kHz/16-bit (WAV), 320kbps (MP3)                */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // --- Export Status UI ---
    const updateExportStatus = function(msg, isError = false) {
        const el = document.getElementById('export-status');
        if (el) {
            el.textContent = msg;
            el.style.color = isError ? '#ff6b6b' : '#39ff14';
        }
        console.log(isError ? '❌' : '📤', msg);
    };
    
    // --- Convert AudioBuffer to WAV Blob ---
    MC303.audioBufferToWav = function(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitsPerSample = 16;
        
        // Interleave channels
        let interleaved;
        if (numChannels === 2) {
            const left = buffer.getChannelData(0);
            const right = buffer.getChannelData(1);
            interleaved = new Float32Array(left.length + right.length);
            for (let i = 0; i < left.length; i++) {
                interleaved[i * 2] = left[i];
                interleaved[i * 2 + 1] = right[i];
            }
        } else {
            interleaved = buffer.getChannelData(0);
        }
        
        // Apply limiter to prevent clipping
        let maxSample = 0;
        for (let i = 0; i < interleaved.length; i++) {
            maxSample = Math.max(maxSample, Math.abs(interleaved[i]));
        }
        const normalizeRatio = maxSample > 0.95 ? 0.95 / maxSample : 1;
        
        // Convert to 16-bit PCM
        const dataLength = interleaved.length * (bitsPerSample / 8);
        const bufferLength = 44 + dataLength;
        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, str) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, bufferLength - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
        view.setUint16(32, numChannels * (bitsPerSample / 8), true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);
        
        // Audio data with limiter
        let offset = 44;
        for (let i = 0; i < interleaved.length; i++) {
            const sample = Math.max(-1, Math.min(1, interleaved[i] * normalizeRatio));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    };
    
    // --- Offline Render Pattern ---
    MC303.renderPatternOffline = async function(bars = 2) {
        const bpm = MC303.state.bpm;
        const stepsPerBar = 16;
        const totalSteps = bars * stepsPerBar;
        const stepDuration = 60 / bpm / 4;
        const totalDuration = totalSteps * stepDuration + 2; // +2s tail for reverb/delay
        
        // Create offline context
        const sampleRate = 44100;
        const offlineCtx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);
        
        // Create master chain for offline context
        const masterGain = offlineCtx.createGain();
        masterGain.gain.value = MC303.audio.masterGain?.gain.value || 0.7;
        
        const masterFilter = offlineCtx.createBiquadFilter();
        masterFilter.type = 'lowpass';
        masterFilter.frequency.value = MC303.audio.filter?.frequency.value || 12000;
        masterFilter.Q.value = MC303.audio.filter?.Q.value || 0.7;
        
        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.value = MC303.audio.compressor?.threshold.value || -6;
        compressor.ratio.value = MC303.audio.compressor?.ratio.value || 3;
        compressor.knee.value = 20;
        compressor.attack.value = 0.02;
        compressor.release.value = 0.15;
        
        // Chain: Filter → Compressor → Gain → Destination
        masterFilter.connect(compressor);
        compressor.connect(masterGain);
        masterGain.connect(offlineCtx.destination);
        
        const pattern = MC303.getCurrentPattern();
        const tracks = ['kick1', 'kick2', 'snare1', 'snare2', 'hat1', 'hat2', 'bass1', 'bass2', 'fx1', 'fx2'];
        
        // Schedule all sounds
        for (let step = 0; step < totalSteps; step++) {
            const stepTime = step * stepDuration;
            const patternStep = step % 16;
            const isAccent = pattern.accent[patternStep];
            
            tracks.forEach(trackId => {
                if (!MC303.isTrackAudible(trackId)) return;
                
                const trackLen = MC303.trackLengths[trackId];
                const trackStep = step % trackLen;
                
                if (pattern[trackId][trackStep]) {
                    const noteFreq = MC303.allNotes[pattern[`${trackId}Notes`][trackStep]] || 65;
                    const locks = pattern[`${trackId}Locks`]?.[trackStep] || {};
                    
                    const settings = {
                        ...MC303.trackSettings[trackId],
                        trackId: trackId,
                        level: MC303.trackSettings[trackId].level * (locks.velocity !== null ? locks.velocity : 1.0),
                        decay: (MC303.trackSettings[trackId].decay || 0.2) * (locks.decay !== null ? locks.decay : 1.0),
                        _filterMod: locks.filter !== null ? locks.filter : 1.0
                    };
                    
                    // Generate sound into offline context
                    scheduleOfflineSound(offlineCtx, masterFilter, trackId, stepTime, settings, noteFreq, isAccent);
                }
            });
        }
        
        // Render
        return offlineCtx.startRendering();
    };
    
    // --- Schedule Sound for Offline Rendering (FIXED: Matches live sound) ---
    function scheduleOfflineSound(ctx, destination, trackId, time, settings, freq, accent) {
        // Use same gain structure as live sounds
        const level = settings.level * (accent ? 1.15 : 1.0);
        const decay = settings.decay || 0.25;
        
        if (trackId.startsWith('kick')) {
            // Kick synthesis - matches live playKick
            const osc = ctx.createOscillator();
            const subOsc = ctx.createOscillator();
            const gain = ctx.createGain();
            const subGain = ctx.createGain();
            
            osc.type = settings.wave || 'sine';
            subOsc.type = 'sine';
            
            // Pitch envelope
            osc.frequency.setValueAtTime(freq * 3.5, time);
            osc.frequency.exponentialRampToValueAtTime(freq, time + 0.025);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.15);
            
            subOsc.frequency.setValueAtTime(freq * 0.9, time);
            subOsc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.25);
            
            // FIXED: Higher gain, smooth envelope
            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.exponentialRampToValueAtTime(level * 0.9, time + 0.005);
            gain.gain.exponentialRampToValueAtTime(level * 0.5, time + decay * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
            
            subGain.gain.setValueAtTime(0.0001, time);
            subGain.gain.exponentialRampToValueAtTime(level * 0.6, time + 0.008);
            subGain.gain.exponentialRampToValueAtTime(0.0001, time + decay * 0.9);
            
            osc.connect(gain);
            subOsc.connect(subGain);
            gain.connect(destination);
            subGain.connect(destination);
            
            osc.start(time);
            subOsc.start(time);
            osc.stop(time + decay + 0.1);
            subOsc.stop(time + decay + 0.15);
            
        } else if (trackId.startsWith('snare')) {
            // Snare: Tone + Noise - matches live
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(settings.tone || 200, time);
            osc.frequency.exponentialRampToValueAtTime(80, time + 0.04);
            
            oscGain.gain.setValueAtTime(0.0001, time);
            oscGain.gain.exponentialRampToValueAtTime(level * 0.6, time + 0.002);
            oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
            
            osc.connect(oscGain);
            oscGain.connect(destination);
            osc.start(time);
            osc.stop(time + 0.08);
            
            // Noise component
            const bufferSize = ctx.sampleRate * decay;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
            
            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1000;
            
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.0001, time);
            noiseGain.gain.exponentialRampToValueAtTime(level * 0.8, time + 0.003);
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
            
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(destination);
            noise.start(time);
            noise.stop(time + decay + 0.05);
            
        } else if (trackId.startsWith('hat')) {
            // Hi-hat - noise based
            const bufferSize = ctx.sampleRate * decay;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;
            
            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            
            const hatFilter = ctx.createBiquadFilter();
            hatFilter.type = 'highpass';
            hatFilter.frequency.value = Math.max(4000, (settings.tone || 8000) * 0.6);
            hatFilter.Q.value = 0.5;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.exponentialRampToValueAtTime(level * 0.6, time + 0.002);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
            
            noise.connect(hatFilter);
            hatFilter.connect(gain);
            gain.connect(destination);
            noise.start(time);
            noise.stop(time + decay + 0.05);
            
        } else if (trackId.startsWith('bass')) {
            // Bass - sawtooth/square with filter
            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const bassFilter = ctx.createBiquadFilter();
            const gain = ctx.createGain();
            
            osc.type = settings.wave || 'sawtooth';
            osc2.type = 'sine';
            osc.frequency.value = freq;
            osc2.frequency.value = freq * 0.5;  // Sub
            
            bassFilter.type = 'lowpass';
            bassFilter.frequency.setValueAtTime(freq * 8, time);
            bassFilter.frequency.exponentialRampToValueAtTime(freq * 2, time + decay * 0.5);
            bassFilter.Q.value = 6;
            
            const adsr = settings.adsr || { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2 };
            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.exponentialRampToValueAtTime(level * 0.8, time + adsr.attack);
            gain.gain.setValueAtTime(level * 0.8 * adsr.sustain, time + adsr.attack + decay);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + adsr.attack + decay + adsr.release);
            
            osc.connect(bassFilter);
            osc2.connect(bassFilter);
            bassFilter.connect(gain);
            gain.connect(destination);
            
            osc.start(time);
            osc2.start(time);
            osc.stop(time + adsr.attack + decay + adsr.release + 0.1);
            osc2.stop(time + adsr.attack + decay + adsr.release + 0.1);
            
        } else if (trackId.startsWith('fx')) {
            // FX - simple square-based
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'square';
            osc2.type = 'square';
            osc1.frequency.value = freq;
            osc2.frequency.value = freq * 1.47;
            
            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.exponentialRampToValueAtTime(level * 0.5, time + 0.003);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(destination);
            
            osc1.start(time);
            osc2.start(time);
            osc1.stop(time + decay + 0.1);
            osc2.stop(time + decay + 0.1);
        }
    }
    
    // --- Export WAV ---
    MC303.exportWAV = async function() {
        try {
            updateExportStatus('Rendering WAV...');
            
            const audioBuffer = await MC303.renderPatternOffline(2);
            const wavBlob = MC303.audioBufferToWav(audioBuffer);
            
            // Download
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MC303_${MC303.state.currentPattern}_${MC303.state.bpm}bpm.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            updateExportStatus('WAV exported! ✅');
            setTimeout(() => updateExportStatus(''), 3000);
            
        } catch (error) {
            updateExportStatus('Export failed: ' + error.message, true);
            console.error('WAV Export Error:', error);
        }
    };
    
    // --- Export MP3 (via WAV conversion) ---
    MC303.exportMP3 = async function() {
        try {
            updateExportStatus('Rendering MP3...');
            
            const audioBuffer = await MC303.renderPatternOffline(2);
            
            // Check for lamejs
            if (typeof lamejs === 'undefined') {
                // Fallback to WAV
                updateExportStatus('MP3 encoder not loaded, exporting WAV instead...');
                await MC303.exportWAV();
                return;
            }
            
            // Convert to MP3 using lamejs
            const mp3encoder = new lamejs.Mp3Encoder(2, audioBuffer.sampleRate, 320);
            const left = audioBuffer.getChannelData(0);
            const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
            
            // Convert Float32 to Int16
            const leftInt = new Int16Array(left.length);
            const rightInt = new Int16Array(right.length);
            for (let i = 0; i < left.length; i++) {
                leftInt[i] = Math.max(-32768, Math.min(32767, left[i] * 32767));
                rightInt[i] = Math.max(-32768, Math.min(32767, right[i] * 32767));
            }
            
            // Encode
            const mp3Data = [];
            const blockSize = 1152;
            for (let i = 0; i < leftInt.length; i += blockSize) {
                const leftChunk = leftInt.subarray(i, i + blockSize);
                const rightChunk = rightInt.subarray(i, i + blockSize);
                const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
            
            const mp3End = mp3encoder.flush();
            if (mp3End.length > 0) mp3Data.push(mp3End);
            
            // Create blob and download
            const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
            const url = URL.createObjectURL(mp3Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MC303_${MC303.state.currentPattern}_${MC303.state.bpm}bpm.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            updateExportStatus('MP3 exported! ✅');
            setTimeout(() => updateExportStatus(''), 3000);
            
        } catch (error) {
            updateExportStatus('MP3 failed, trying WAV...', true);
            console.error('MP3 Export Error:', error);
            await MC303.exportWAV();
        }
    };
    
    // --- Export Settings as JSON ---
    MC303.exportSettings = function() {
        const settings = {
            version: '5.0',
            bpm: MC303.state.bpm,
            trackSettings: MC303.trackSettings,
            trackLengths: MC303.trackLengths,
            fxSettings: MC303.fxSettings,
            patterns: MC303.patterns
        };
        
        const json = JSON.stringify(settings, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `MC303_settings_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateExportStatus('Settings exported! ✅');
        setTimeout(() => updateExportStatus(''), 3000);
    };
    
    // --- Import Settings from JSON ---
    MC303.importSettings = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const settings = JSON.parse(evt.target.result);
                    
                    // Apply settings
                    if (settings.bpm) {
                        MC303.state.bpm = settings.bpm;
                        const bpmEl = document.getElementById('bpm');
                        const bpmVal = document.getElementById('bpm-value');
                        if (bpmEl) bpmEl.value = settings.bpm;
                        if (bpmVal) bpmVal.textContent = settings.bpm;
                    }
                    
                    if (settings.trackSettings) {
                        MC303.trackSettings = settings.trackSettings;
                    }
                    
                    if (settings.trackLengths) {
                        MC303.trackLengths = settings.trackLengths;
                    }
                    
                    if (settings.fxSettings) {
                        MC303.fxSettings = settings.fxSettings;
                        // Apply FX
                        if (MC303.updateDistortion) MC303.updateDistortion(settings.fxSettings.distortion?.type, settings.fxSettings.distortion?.amount);
                        if (MC303.updateReverb) MC303.updateReverb(settings.fxSettings.reverb?.type, settings.fxSettings.reverb?.mix);
                        if (MC303.updateDelay) MC303.updateDelay(settings.fxSettings.delay?.time, settings.fxSettings.delay?.feedback, settings.fxSettings.delay?.mix);
                    }
                    
                    if (settings.patterns) {
                        MC303.patterns = settings.patterns;
                    }
                    
                    if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
                    if (MC303.updateAllTrackControls) MC303.updateAllTrackControls();
                    
                    updateExportStatus('Settings imported! ✅');
                    setTimeout(() => updateExportStatus(''), 3000);
                    
                } catch (error) {
                    updateExportStatus('Import failed: Invalid JSON', true);
                    console.error('Import Error:', error);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    };
    
})(window.MC303 = window.MC303 || {});
