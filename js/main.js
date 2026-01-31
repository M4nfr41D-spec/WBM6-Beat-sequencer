/* ============================================================ */
/* WBM 5-303 ULTIMATE - MAIN INITIALIZATION                     */
/* Entry point, event listeners, startup sequence               */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // --- Initialization Sequence ---
    MC303.init = function() {
        console.log('🚀 WBM 5-303 ULTIMATE - Modular Edition');
        console.log('⏳ Initializing...');
        
        // Initialize patterns
        MC303.initPatterns();
        
        // Build UI (creates track UI, sequencer grid)
        MC303.buildUI();
        
        // Build TB-303 Panel (must be after buildUI)
        if (MC303.init303) MC303.init303();
        
        // Attach master control listeners
        attachMasterControls();
        
        // Attach transport controls
        attachTransportControls();
        
        // Attach FX controls
        attachFXControls();
        
        // Attach pattern controls
        attachPatternControls();
        
        // Attach export controls
        attachExportControls();
        
        // Initialize piano keyboard
        if (MC303.initPiano) MC303.initPiano();
        
        // Initialize TB-303 Acid Bass Module
        if (MC303.build303Panel) MC303.build303Panel();
        
        // Initialize visualizer
        if (MC303.initVisualizer) MC303.initVisualizer();
        
        // Audio initialization on first interaction
        document.addEventListener('click', initAudioOnce, { once: true });
        document.addEventListener('keydown', initAudioOnce, { once: true });
        
        console.log('✅ WBM 5-303 ULTIMATE ready!');
    };
    
    // --- Initialize Audio on First Interaction ---
    function initAudioOnce() {
        if (!MC303.audio.context) {
            MC303.initAudio();
        }
        MC303.resumeAudio();
    }
    
    // --- Master Controls ---
    function attachMasterControls() {
        // BPM
        const bpmSlider = document.getElementById('bpm');
        const bpmValue = document.getElementById('bpm-value');
        if (bpmSlider) {
            bpmSlider.addEventListener('input', (e) => {
                const bpm = parseInt(e.target.value);
                MC303.setBPM(bpm);
                if (bpmValue) bpmValue.textContent = bpm;
            });
        }
        
        // Volume
        const volumeSlider = document.getElementById('volume');
        const volumeValue = document.getElementById('volume-value');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value) / 100;
                if (MC303.audio.masterGain) {
                    MC303.audio.masterGain.gain.value = vol;
                }
                if (volumeValue) volumeValue.textContent = e.target.value;
            });
        }
        
        // Master Filter Cutoff
        const cutoffSlider = document.getElementById('filter-cutoff');
        const cutoffValue = document.getElementById('filter-cutoff-value');
        if (cutoffSlider) {
            cutoffSlider.addEventListener('input', (e) => {
                const freq = parseInt(e.target.value);
                if (MC303.audio.filter) {
                    MC303.audio.filter.frequency.value = freq;
                }
                if (cutoffValue) cutoffValue.textContent = freq;
            });
        }
        
        // Master Filter Resonance
        const resSlider = document.getElementById('filter-res');
        const resValue = document.getElementById('filter-res-value');
        if (resSlider) {
            resSlider.addEventListener('input', (e) => {
                const q = parseFloat(e.target.value);
                if (MC303.audio.filter) {
                    MC303.audio.filter.Q.value = q;
                }
                if (resValue) resValue.textContent = q.toFixed(1);
            });
        }
        
        // Seed Input
        const seedInput = document.getElementById('seed-input');
        if (seedInput) {
            seedInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') MC303.generateBeat();
            });
        }
        
        // Generate Beat
        const generateBtn = document.getElementById('generate-beat');
        if (generateBtn) {
            generateBtn.addEventListener('click', MC303.generateBeat);
        }
    }
    
    // --- Transport Controls ---
    function attachTransportControls() {
        const playBtn = document.getElementById('play-btn');
        const stopBtn = document.getElementById('stop-btn');
        const clearBtn = document.getElementById('clear-btn');
        const accentBtn = document.getElementById('accent-mode');
        const plockBtn = document.getElementById('plock-mode');
        const plockSelect = document.getElementById('plock-param');
        
        if (playBtn) playBtn.addEventListener('click', MC303.play);
        if (stopBtn) stopBtn.addEventListener('click', MC303.stop);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear all steps in current pattern?')) {
                    MC303.clearPattern();
                }
            });
        }
        if (accentBtn) accentBtn.addEventListener('click', MC303.toggleAccentMode);
        if (plockBtn) plockBtn.addEventListener('click', MC303.toggleParamLockMode);
        if (plockSelect) {
            plockSelect.addEventListener('change', (e) => {
                MC303.state.paramLockParam = e.target.value;
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    MC303.state.isPlaying ? MC303.stop() : MC303.play();
                    break;
                case 'Escape':
                    MC303.stop();
                    break;
                case 'KeyA':
                    if (!e.ctrlKey && !e.metaKey) MC303.toggleAccentMode();
                    break;
                case 'KeyP':
                    if (!e.ctrlKey && !e.metaKey) MC303.toggleParamLockMode();
                    break;
            }
        });
    }
    
    // --- FX Controls ---
    function attachFXControls() {
        // Distortion
        const distType = document.getElementById('dist-type');
        const distAmount = document.getElementById('fx-distortion');
        const distValue = document.getElementById('fx-dist-value');
        
        if (distType) {
            distType.addEventListener('change', (e) => {
                MC303.fxSettings.distortion.type = e.target.value;
                if (MC303.updateDistortion) {
                    MC303.updateDistortion(e.target.value, MC303.fxSettings.distortion.amount);
                }
            });
        }
        
        if (distAmount) {
            distAmount.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                MC303.fxSettings.distortion.amount = val;
                if (distValue) distValue.textContent = val;
                if (MC303.updateDistortion) {
                    MC303.updateDistortion(MC303.fxSettings.distortion.type, val);
                }
            });
        }
        
        // Reverb
        const reverbType = document.getElementById('reverb-type');
        const reverbMix = document.getElementById('fx-reverb');
        const reverbValue = document.getElementById('fx-reverb-value');
        
        if (reverbType) {
            reverbType.addEventListener('change', (e) => {
                MC303.fxSettings.reverb.type = e.target.value;
                if (MC303.updateReverb) {
                    MC303.updateReverb(e.target.value, MC303.fxSettings.reverb.mix);
                }
            });
        }
        
        if (reverbMix) {
            reverbMix.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) / 100;
                MC303.fxSettings.reverb.mix = val;
                if (reverbValue) reverbValue.textContent = e.target.value;
                if (MC303.updateReverb) {
                    MC303.updateReverb(MC303.fxSettings.reverb.type, val);
                }
            });
        }
        
        // Delay
        const delayTime = document.getElementById('fx-delay-time');
        const delayFb = document.getElementById('fx-delay-fb');
        const delayMix = document.getElementById('fx-delay-mix');
        const delayTimeValue = document.getElementById('fx-delay-time-value');
        const delayFbValue = document.getElementById('fx-delay-fb-value');
        const delayMixValue = document.getElementById('fx-delay-mix-value');
        
        if (delayTime) {
            delayTime.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) / 1000;
                MC303.fxSettings.delay.time = val;
                if (delayTimeValue) delayTimeValue.textContent = e.target.value;
                if (MC303.updateDelay) {
                    MC303.updateDelay(val, MC303.fxSettings.delay.feedback, MC303.fxSettings.delay.mix);
                }
            });
        }
        
        if (delayFb) {
            delayFb.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) / 100;
                MC303.fxSettings.delay.feedback = val;
                if (delayFbValue) delayFbValue.textContent = e.target.value;
                if (MC303.updateDelay) {
                    MC303.updateDelay(MC303.fxSettings.delay.time, val, MC303.fxSettings.delay.mix);
                }
            });
        }
        
        if (delayMix) {
            delayMix.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) / 100;
                MC303.fxSettings.delay.mix = val;
                if (delayMixValue) delayMixValue.textContent = e.target.value;
                if (MC303.updateDelay) {
                    MC303.updateDelay(MC303.fxSettings.delay.time, MC303.fxSettings.delay.feedback, val);
                }
            });
        }
        
        // Compressor
        const compThresh = document.getElementById('fx-comp-thresh');
        const compRatio = document.getElementById('fx-comp-ratio');
        const compThreshValue = document.getElementById('fx-comp-thresh-value');
        const compRatioValue = document.getElementById('fx-comp-ratio-value');
        
        if (compThresh) {
            compThresh.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                MC303.fxSettings.compressor.threshold = val;
                if (compThreshValue) compThreshValue.textContent = val;
                if (MC303.audio.compressor) {
                    MC303.audio.compressor.threshold.value = val;
                }
            });
        }
        
        if (compRatio) {
            compRatio.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                MC303.fxSettings.compressor.ratio = val;
                if (compRatioValue) compRatioValue.textContent = val;
                if (MC303.audio.compressor) {
                    MC303.audio.compressor.ratio.value = val;
                }
            });
        }
    }
    
    // --- Pattern Controls ---
    function attachPatternControls() {
        // Pattern buttons
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                MC303.state.currentPattern = btn.dataset.pattern;
                MC303.state.selectedStep = null;
                MC303.updateSequencerDisplay();
                if (MC303.updatePianoInfo) MC303.updatePianoInfo();
            });
        });
        
        // Copy/Paste/Morph
        const copyBtn = document.getElementById('copy-pattern');
        const pasteBtn = document.getElementById('paste-pattern');
        const morphBtn = document.getElementById('morph-pattern');
        
        if (copyBtn) copyBtn.addEventListener('click', MC303.copyPattern);
        if (pasteBtn) pasteBtn.addEventListener('click', MC303.pastePattern);
        if (morphBtn) morphBtn.addEventListener('click', MC303.morphPattern);
    }
    
    // --- Export Controls ---
    function attachExportControls() {
        const wavBtn = document.getElementById('export-wav');
        const mp3Btn = document.getElementById('export-mp3');
        const exportSettingsBtn = document.getElementById('export-settings');
        const importSettingsBtn = document.getElementById('import-settings');
        
        if (wavBtn) wavBtn.addEventListener('click', MC303.exportWAV);
        if (mp3Btn) mp3Btn.addEventListener('click', MC303.exportMP3);
        if (exportSettingsBtn) exportSettingsBtn.addEventListener('click', MC303.exportSettings);
        if (importSettingsBtn) importSettingsBtn.addEventListener('click', MC303.importSettings);
    }
    
    // --- Jump Navigation Buttons ---
    function attachJumpButtons() {
        document.querySelectorAll('.jump-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    // Account for sticky bottom bar
                    const stickyBar = document.querySelector('.sticky-bottom-bar');
                    const offset = stickyBar ? stickyBar.offsetHeight + 20 : 20;
                    
                    const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({
                        top: targetPos,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // --- Update Init to Include Jump Buttons ---
    const originalInit = MC303.init;
    MC303.init = function() {
        originalInit();
        attachJumpButtons();
        console.log('🎯 Jump navigation initialized');
    };
    
    // --- DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', MC303.init);
    
})(window.MC303 = window.MC303 || {});
