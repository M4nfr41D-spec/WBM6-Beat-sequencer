/* ============================================================ */
/* MC-303 ULTIMATE v5.0 - UI MODULE                             */
/* DOM manipulation, track creation, accordion, event handlers  */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // --- Create Accordion Track Group ---
    MC303.createAccordionGroup = function(group, container) {
        const section = document.createElement('div');
        section.className = 'track-group accordion-group';
        
        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.innerHTML = `<span>${group.emoji} ${group.name}</span><span class="accordion-icon">▼</span>`;
        
        const content = document.createElement('div');
        content.className = 'accordion-content open';
        
        // Create tracks for this group
        group.tracks.forEach(trackId => {
            const trackEl = MC303.createTrack(trackId);
            content.appendChild(trackEl);
        });
        
        // Toggle accordion
        header.addEventListener('click', () => {
            content.classList.toggle('open');
            const icon = header.querySelector('.accordion-icon');
            icon.textContent = content.classList.contains('open') ? '▼' : '▶';
        });
        
        section.appendChild(header);
        section.appendChild(content);
        container.appendChild(section);
    };
    
    // --- Create Single Track UI ---
    MC303.createTrack = function(trackId) {
        const config = MC303.trackConfigs[trackId];
        const settings = MC303.trackSettings[trackId];
        
        const track = document.createElement('div');
        track.className = 'track';
        track.id = `track-${trackId}`;
        
        // Track Header
        const header = document.createElement('div');
        header.className = 'track-header';
        header.innerHTML = `
            <span class="track-name">${config.name}</span>
            <div class="track-buttons">
                <button class="btn btn-small btn-mute ${settings.mute ? 'active' : ''}" data-track="${trackId}" data-action="mute">M</button>
                <button class="btn btn-small btn-solo ${settings.solo ? 'active' : ''}" data-track="${trackId}" data-action="solo">S</button>
            </div>
        `;
        
        // Controls Container
        const controls = document.createElement('div');
        controls.className = 'track-controls';
        
        // Level Slider
        controls.appendChild(MC303.createSlider(`${trackId}-level`, 'Level', 0, 100, Math.round(settings.level * 100), '%'));
        
        // Pan Slider
        if (config.hasPan) {
            controls.appendChild(MC303.createSlider(`${trackId}-pan`, 'Pan', -100, 100, settings.pan * 100, '', true));
        }
        
        // Track-specific controls
        if (config.hasFreq) {
            controls.appendChild(MC303.createSlider(`${trackId}-freq`, 'Freq', 20, 200, settings.freq, 'Hz'));
        }
        
        if (config.hasWave) {
            controls.appendChild(MC303.createSelect(`${trackId}-wave`, 'Wave', 
                ['sine', 'triangle', 'square', 'sawtooth'], settings.wave));
        }
        
        if (config.hasTone) {
            const max = trackId.startsWith('hat') ? 15000 : 1000;
            controls.appendChild(MC303.createSlider(`${trackId}-tone`, 'Tone', 50, max, settings.tone, 'Hz'));
        }
        
        if (config.hasDecay) {
            controls.appendChild(MC303.createSlider(`${trackId}-decay`, 'Decay', 0.01, 1, settings.decay, 's'));
        }
        
        if (config.hasFXType) {
            const fxOptions = MC303.fxTypes.map(t => ({ value: t.value, label: t.label }));
            controls.appendChild(MC303.createSelect(`${trackId}-fxtype`, 'FX Type', fxOptions, settings.type));
        }
        
        if (config.hasPitch) {
            controls.appendChild(MC303.createSlider(`${trackId}-pitch`, 'Pitch', 50, 2000, settings.pitch, 'Hz'));
        }
        
        if (config.hasDetune) {
            controls.appendChild(MC303.createSlider(`${trackId}-detune`, 'Detune', -100, 100, settings.detune, 'ct', true));
        }
        
        // LFO Controls
        if (config.hasLFO) {
            const lfoGroup = document.createElement('div');
            lfoGroup.className = 'control-subgroup';
            lfoGroup.innerHTML = '<span class="subgroup-label">LFO</span>';
            lfoGroup.appendChild(MC303.createSlider(`${trackId}-lfo-rate`, 'Rate', 0, 20, settings.lfo.rate, 'Hz'));
            lfoGroup.appendChild(MC303.createSlider(`${trackId}-lfo-depth`, 'Depth', 0, 100, settings.lfo.depth, '%'));
            lfoGroup.appendChild(MC303.createSelect(`${trackId}-lfo-target`, 'Target', 
                ['pitch', 'filter', 'amp'], settings.lfo.target));
            controls.appendChild(lfoGroup);
        }
        
        // Track Length (Polyrhythm)
        const lengthControl = document.createElement('div');
        lengthControl.className = 'track-length-control';
        lengthControl.innerHTML = `
            <label>Steps:</label>
            <input type="number" id="${trackId}-length" min="4" max="32" value="${MC303.trackLengths[trackId]}" class="length-input">
        `;
        controls.appendChild(lengthControl);
        
        // Step Sequencer Grid
        const grid = document.createElement('div');
        grid.className = 'step-grid';
        grid.id = `grid-${trackId}`;
        
        for (let i = 0; i < 16; i++) {
            const step = document.createElement('button');
            step.className = 'step';
            step.dataset.track = trackId;
            step.dataset.step = i;
            if (i % 4 === 0) step.classList.add('beat');
            grid.appendChild(step);
        }
        
        track.appendChild(header);
        track.appendChild(controls);
        track.appendChild(grid);
        
        return track;
    };
    
    // --- Create Slider Control ---
    MC303.createSlider = function(id, label, min, max, value, unit = '', isCentered = false) {
        const container = document.createElement('div');
        container.className = 'slider-container compact';
        
        const step = (max - min) < 10 ? 0.01 : 1;
        
        container.innerHTML = `
            <div class="slider-label">
                <span>${label}</span>
                <span id="${id}-value">${typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}${unit}</span>
            </div>
            <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" 
                   class="${isCentered ? 'centered' : ''}">
        `;
        
        return container;
    };
    
    // --- Create Select Control ---
    MC303.createSelect = function(id, label, options, value) {
        const container = document.createElement('div');
        container.className = 'slider-container compact';
        
        let optionsHTML = '';
        options.forEach(opt => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            optionsHTML += `<option value="${val}" ${val === value ? 'selected' : ''}>${lbl}</option>`;
        });
        
        container.innerHTML = `
            <div class="slider-label"><span>${label}</span></div>
            <select id="${id}">${optionsHTML}</select>
        `;
        
        return container;
    };
    
    // --- Update Sequencer Display ---
    MC303.updateSequencerDisplay = function() {
        const pattern = MC303.getCurrentPattern();
        const tracks = ['kick1', 'kick2', 'snare1', 'snare2', 'hat1', 'hat2', 'bass1', 'bass2', 'fx1', 'fx2'];
        
        tracks.forEach(trackId => {
            const grid = document.getElementById(`grid-${trackId}`);
            if (!grid) return;
            
            const trackLen = MC303.trackLengths[trackId];
            const steps = grid.querySelectorAll('.step');
            
            steps.forEach((step, i) => {
                // Active state
                step.classList.toggle('active', pattern[trackId][i]);
                
                // Current step highlight
                const isCurrentStep = MC303.state.isPlaying && (MC303.trackSteps[trackId] === i);
                step.classList.toggle('current', isCurrentStep);
                
                // Polyrhythm: dim steps outside track length
                step.classList.toggle('out-of-range', i >= trackLen);
                
                // Accent
                step.classList.toggle('accent', pattern.accent[i] && pattern[trackId][i]);
                
                // Parameter locks indicator
                const locks = pattern[`${trackId}Locks`]?.[i] || {};
                const hasLock = locks.velocity !== null || locks.decay !== null || locks.filter !== null;
                step.classList.toggle('has-lock', hasLock && pattern[trackId][i]);
                
                // Selected step
                step.classList.toggle('selected', MC303.state.selectedStep?.track === trackId && MC303.state.selectedStep?.step === i);
                
                // Display note
                const note = pattern[`${trackId}Notes`][i];
                step.title = pattern[trackId][i] ? `${note}${hasLock ? ' 🔒' : ''}` : '';
            });
        });
        
        // Update pattern buttons
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.pattern === MC303.state.currentPattern);
        });
    };
    
    // --- Attach Track Control Listeners ---
    MC303.attachTrackControlListeners = function(trackId) {
        const config = MC303.trackConfigs[trackId];
        const settings = MC303.trackSettings[trackId];
        
        // Level
        const levelEl = document.getElementById(`${trackId}-level`);
        if (levelEl) {
            levelEl.addEventListener('input', (e) => {
                settings.level = e.target.value / 100;
                document.getElementById(`${trackId}-level-value`).textContent = e.target.value + '%';
            });
        }
        
        // Pan
        const panEl = document.getElementById(`${trackId}-pan`);
        if (panEl) {
            panEl.addEventListener('input', (e) => {
                settings.pan = e.target.value / 100;
                document.getElementById(`${trackId}-pan-value`).textContent = e.target.value;
            });
        }
        
        // Freq (kick)
        const freqEl = document.getElementById(`${trackId}-freq`);
        if (freqEl) {
            freqEl.addEventListener('input', (e) => {
                settings.freq = parseFloat(e.target.value);
                document.getElementById(`${trackId}-freq-value`).textContent = e.target.value + 'Hz';
            });
        }
        
        // Wave
        const waveEl = document.getElementById(`${trackId}-wave`);
        if (waveEl) {
            waveEl.addEventListener('change', (e) => {
                settings.wave = e.target.value;
            });
        }
        
        // Tone
        const toneEl = document.getElementById(`${trackId}-tone`);
        if (toneEl) {
            toneEl.addEventListener('input', (e) => {
                settings.tone = parseFloat(e.target.value);
                document.getElementById(`${trackId}-tone-value`).textContent = e.target.value + 'Hz';
            });
        }
        
        // Decay
        const decayEl = document.getElementById(`${trackId}-decay`);
        if (decayEl) {
            decayEl.addEventListener('input', (e) => {
                settings.decay = parseFloat(e.target.value);
                document.getElementById(`${trackId}-decay-value`).textContent = parseFloat(e.target.value).toFixed(2) + 's';
            });
        }
        
        // FX Type
        const fxTypeEl = document.getElementById(`${trackId}-fxtype`);
        if (fxTypeEl) {
            fxTypeEl.addEventListener('change', (e) => {
                settings.type = e.target.value;
            });
        }
        
        // Pitch
        const pitchEl = document.getElementById(`${trackId}-pitch`);
        if (pitchEl) {
            pitchEl.addEventListener('input', (e) => {
                settings.pitch = parseFloat(e.target.value);
                document.getElementById(`${trackId}-pitch-value`).textContent = e.target.value + 'Hz';
            });
        }
        
        // Detune
        const detuneEl = document.getElementById(`${trackId}-detune`);
        if (detuneEl) {
            detuneEl.addEventListener('input', (e) => {
                settings.detune = parseFloat(e.target.value);
                document.getElementById(`${trackId}-detune-value`).textContent = e.target.value + 'ct';
            });
        }
        
        // LFO
        const lfoRateEl = document.getElementById(`${trackId}-lfo-rate`);
        if (lfoRateEl) {
            lfoRateEl.addEventListener('input', (e) => {
                settings.lfo.rate = parseFloat(e.target.value);
                document.getElementById(`${trackId}-lfo-rate-value`).textContent = e.target.value + 'Hz';
            });
        }
        
        const lfoDepthEl = document.getElementById(`${trackId}-lfo-depth`);
        if (lfoDepthEl) {
            lfoDepthEl.addEventListener('input', (e) => {
                settings.lfo.depth = parseFloat(e.target.value);
                document.getElementById(`${trackId}-lfo-depth-value`).textContent = e.target.value + '%';
            });
        }
        
        const lfoTargetEl = document.getElementById(`${trackId}-lfo-target`);
        if (lfoTargetEl) {
            lfoTargetEl.addEventListener('change', (e) => {
                settings.lfo.target = e.target.value;
            });
        }
        
        // Track Length (Polyrhythm)
        const lengthEl = document.getElementById(`${trackId}-length`);
        if (lengthEl) {
            lengthEl.addEventListener('change', (e) => {
                MC303.setTrackLength(trackId, parseInt(e.target.value));
            });
        }
        
        // Mute/Solo buttons
        const muteBtn = document.querySelector(`[data-track="${trackId}"][data-action="mute"]`);
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                settings.mute = !settings.mute;
                muteBtn.classList.toggle('active', settings.mute);
            });
        }
        
        const soloBtn = document.querySelector(`[data-track="${trackId}"][data-action="solo"]`);
        if (soloBtn) {
            soloBtn.addEventListener('click', () => {
                settings.solo = !settings.solo;
                soloBtn.classList.toggle('active', settings.solo);
            });
        }
        
        // Step Grid Click Handler
        const grid = document.getElementById(`grid-${trackId}`);
        if (grid) {
            grid.addEventListener('click', (e) => {
                const step = e.target.closest('.step');
                if (!step) return;
                
                const stepIndex = parseInt(step.dataset.step);
                MC303.handleStepClick(trackId, stepIndex, e);
            });
        }
    };
    
    // --- Handle Step Click ---
    MC303.handleStepClick = function(trackId, stepIndex, event) {
        if (!MC303.audio.context) MC303.initAudio();
        MC303.resumeAudio();
        
        const pattern = MC303.getCurrentPattern();
        
        // Accent Mode
        if (MC303.state.accentMode) {
            pattern.accent[stepIndex] = !pattern.accent[stepIndex];
            MC303.updateSequencerDisplay();
            return;
        }
        
        // Param Lock Mode
        if (MC303.state.paramLockMode) {
            if (pattern[trackId][stepIndex]) {
                // Cycle through lock values
                const param = MC303.state.paramLockParam;
                const locks = pattern[`${trackId}Locks`][stepIndex];
                const currentVal = locks[param];
                
                if (currentVal === null) locks[param] = 0.5;
                else if (currentVal === 0.5) locks[param] = 1.5;
                else if (currentVal === 1.5) locks[param] = 2.0;
                else locks[param] = null;
            }
            MC303.updateSequencerDisplay();
            return;
        }
        
        // Normal toggle
        pattern[trackId][stepIndex] = !pattern[trackId][stepIndex];
        
        // Select for piano if bass/FX track
        if (trackId.startsWith('bass') || trackId.startsWith('fx') || MC303.trackConfigs[trackId].hasPiano) {
            MC303.state.selectedStep = { track: trackId, step: stepIndex };
            MC303.updatePianoInfo();
        }
        
        MC303.updateSequencerDisplay();
    };
    
    // --- Update Piano Info ---
    MC303.updatePianoInfo = function() {
        const infoEl = document.getElementById('piano-info');
        if (!infoEl) return;
        
        if (MC303.state.selectedStep) {
            const { track, step } = MC303.state.selectedStep;
            const pattern = MC303.getCurrentPattern();
            const note = pattern[`${track}Notes`][step];
            infoEl.textContent = `${MC303.trackConfigs[track].name} Step ${step + 1}: ${note}`;
        } else {
            infoEl.textContent = 'Wähle einen Step aus, dann klicke hier eine Taste!';
        }
    };
    
    // --- Update All Track Controls (for preset/import) ---
    MC303.updateAllTrackControls = function() {
        Object.keys(MC303.trackSettings).forEach(trackId => {
            const settings = MC303.trackSettings[trackId];
            const config = MC303.trackConfigs[trackId];
            
            const updateEl = (id, value, suffix = '') => {
                const el = document.getElementById(id);
                const valEl = document.getElementById(id + '-value');
                if (el) el.value = value;
                if (valEl) valEl.textContent = (typeof value === 'number' ? value.toFixed(el?.step < 1 ? 2 : 0) : value) + suffix;
            };
            
            updateEl(`${trackId}-level`, settings.level * 100, '%');
            if (config.hasPan) updateEl(`${trackId}-pan`, settings.pan * 100);
            if (config.hasFreq) updateEl(`${trackId}-freq`, settings.freq, 'Hz');
            if (config.hasWave) {
                const waveEl = document.getElementById(`${trackId}-wave`);
                if (waveEl) waveEl.value = settings.wave;
            }
            if (config.hasTone) updateEl(`${trackId}-tone`, settings.tone, 'Hz');
            if (config.hasDecay) updateEl(`${trackId}-decay`, settings.decay, 's');
            if (config.hasFXType) {
                const fxEl = document.getElementById(`${trackId}-fxtype`);
                if (fxEl) fxEl.value = settings.type;
            }
            if (config.hasPitch) updateEl(`${trackId}-pitch`, settings.pitch, 'Hz');
            if (config.hasDetune) updateEl(`${trackId}-detune`, settings.detune, 'ct');
            
            // LFO
            if (config.hasLFO && settings.lfo) {
                updateEl(`${trackId}-lfo-rate`, settings.lfo.rate, 'Hz');
                updateEl(`${trackId}-lfo-depth`, settings.lfo.depth, '%');
                const lfoTargetEl = document.getElementById(`${trackId}-lfo-target`);
                if (lfoTargetEl) lfoTargetEl.value = settings.lfo.target;
            }
            
            // Track length
            const lengthEl = document.getElementById(`${trackId}-length`);
            if (lengthEl) lengthEl.value = MC303.trackLengths[trackId];
            
            // Mute/Solo buttons
            const muteBtn = document.querySelector(`[data-track="${trackId}"][data-action="mute"]`);
            if (muteBtn) muteBtn.classList.toggle('active', settings.mute);
            const soloBtn = document.querySelector(`[data-track="${trackId}"][data-action="solo"]`);
            if (soloBtn) soloBtn.classList.toggle('active', settings.solo);
        });
    };
    
    // --- Render Preset Buttons ---
    MC303.renderPresetButtons = function() {
        const container = document.getElementById('preset-buttons');
        if (!container || !MC303.hardwarePresets) return;
        
        container.innerHTML = '';
        
        Object.keys(MC303.hardwarePresets).forEach(presetName => {
            const btn = document.createElement('button');
            btn.className = 'btn preset-btn';
            btn.textContent = presetName;
            btn.addEventListener('click', () => {
                MC303.applyPreset(presetName);
            });
            container.appendChild(btn);
        });
    };
    
    // --- Build Complete UI ---
    MC303.buildUI = function() {
        const container = document.getElementById('sequencer-container');
        if (!container) {
            console.error('Sequencer container not found!');
            return;
        }
        
        container.innerHTML = '';
        
        // Create accordion groups
        MC303.trackGroups.forEach(group => {
            MC303.createAccordionGroup(group, container);
        });
        
        // Attach listeners to all tracks
        Object.keys(MC303.trackConfigs).forEach(trackId => {
            MC303.attachTrackControlListeners(trackId);
        });
        
        // Render preset buttons
        MC303.renderPresetButtons();
        
        // Initial display update
        MC303.updateSequencerDisplay();
        
        console.log('🎛️ UI built successfully');
    };
    
})(window.MC303 = window.MC303 || {});
