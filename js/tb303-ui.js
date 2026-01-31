/* ============================================================ */
/* MC-303 ULTIMATE v5.0 - TB-303 UI MODULE                      */
/* Dedicated control panel for authentic acid bass control      */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // ============================================================
    // BUILD 303 CONTROL PANEL
    // ============================================================
    
    MC303.build303Panel = function() {
        const container = document.getElementById('sequencer-container');
        if (!container) return;
        
        // Create 303 section before other tracks
        const section = document.createElement('div');
        section.className = 'track-group accordion-group tb303-panel';
        section.id = 'tb303-panel';
        
        section.innerHTML = `
            <div class="accordion-header tb303-header">
                <span>🎛️ TB-303 ACID BASS</span>
                <div class="tb303-mode-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" id="tb303-mode-enabled" checked>
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">303 Mode</span>
                </div>
                <span class="accordion-icon">▼</span>
            </div>
            <div class="accordion-content open">
                
                <!-- PRESETS ROW -->
                <div class="tb303-presets">
                    <span class="preset-label">🎹 Acid Patterns:</span>
                    <button class="btn btn-small" data-pattern="Emmanuel Top - Tone">Tone</button>
                    <button class="btn btn-small" data-pattern="Classic Acid">Classic</button>
                    <button class="btn btn-small" data-pattern="Hardfloor Style">Hardfloor</button>
                    <button class="btn btn-small" data-pattern="Wobble Bass">Wobble</button>
                </div>
                
                <!-- MAIN CONTROLS GRID -->
                <div class="tb303-controls-grid">
                    
                    <!-- FILTER SECTION -->
                    <div class="tb303-section filter-section">
                        <h4>🔊 FILTER</h4>
                        <div class="control-row">
                            <div class="slider-container">
                                <div class="slider-label"><span>Cutoff</span><span id="tb303-cutoff-value">400 Hz</span></div>
                                <input type="range" id="tb303-cutoff" min="30" max="5000" value="400" class="accent-slider">
                            </div>
                            <div class="slider-container">
                                <div class="slider-label"><span>Resonance</span><span id="tb303-resonance-value">8</span></div>
                                <input type="range" id="tb303-resonance" min="0" max="30" step="0.5" value="8" class="accent-slider">
                            </div>
                        </div>
                        <div class="control-row">
                            <div class="slider-container">
                                <div class="slider-label"><span>Env Mod</span><span id="tb303-envmod-value">60%</span></div>
                                <input type="range" id="tb303-envmod" min="0" max="100" value="60">
                            </div>
                            <div class="slider-container">
                                <div class="slider-label"><span>Decay</span><span id="tb303-decay-value">0.3 s</span></div>
                                <input type="range" id="tb303-decay" min="0.02" max="2" step="0.01" value="0.3">
                            </div>
                        </div>
                        <div class="slider-container">
                            <div class="slider-label"><span>Accent</span><span id="tb303-accent-value">50%</span></div>
                            <input type="range" id="tb303-accent" min="0" max="100" value="50" class="accent-slider">
                        </div>
                    </div>
                    
                    <!-- OSCILLATOR SECTION -->
                    <div class="tb303-section osc-section">
                        <h4>〰️ OSCILLATOR</h4>
                        <div class="control-row">
                            <div class="slider-container">
                                <div class="slider-label"><span>Waveform</span></div>
                                <select id="tb303-waveform">
                                    <option value="sawtooth">Sawtooth</option>
                                    <option value="square">Square</option>
                                </select>
                            </div>
                            <div class="slider-container">
                                <div class="slider-label"><span>Sub Osc</span><span id="tb303-sub-value">30%</span></div>
                                <input type="range" id="tb303-sub" min="0" max="100" value="30">
                            </div>
                        </div>
                        <div class="control-row">
                            <div class="slider-container">
                                <div class="slider-label"><span>Drive</span><span id="tb303-drive-value">20%</span></div>
                                <input type="range" id="tb303-drive" min="0" max="100" value="20">
                            </div>
                            <div class="slider-container">
                                <div class="slider-label"><span>Level</span><span id="tb303-level-value">75%</span></div>
                                <input type="range" id="tb303-level" min="0" max="100" value="75">
                            </div>
                        </div>
                        <div class="slide-control">
                            <label class="checkbox-label">
                                <input type="checkbox" id="tb303-slide-enabled">
                                <span>🎸 Slide/Glide Enabled</span>
                            </label>
                            <div class="slider-container mini">
                                <span>Time:</span>
                                <input type="range" id="tb303-slide-time" min="0.02" max="0.3" step="0.01" value="0.06">
                                <span id="tb303-slide-time-value">60ms</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- LFO SECTION (WOBBLE) -->
                    <div class="tb303-section lfo-section">
                        <h4>🌊 LFO (WOBBLE)</h4>
                        <div class="lfo-enable">
                            <label class="checkbox-label">
                                <input type="checkbox" id="tb303-lfo-enabled" checked>
                                <span>LFO Active</span>
                            </label>
                        </div>
                        <div class="control-row">
                            <div class="slider-container">
                                <div class="slider-label"><span>Rate</span><span id="tb303-lfo-rate-value">0.5 Hz</span></div>
                                <input type="range" id="tb303-lfo-rate" min="0.05" max="50" step="0.05" value="0.5" class="lfo-slider">
                            </div>
                            <div class="slider-container">
                                <div class="slider-label"><span>Depth</span><span id="tb303-lfo-depth-value">2400 Hz</span></div>
                                <input type="range" id="tb303-lfo-depth" min="0" max="4800" step="10" value="2400" class="lfo-slider">
                            </div>
                        </div>
                        <div class="control-row">
                            <div class="slider-container">
                                <div class="slider-label"><span>Waveform</span></div>
                                <select id="tb303-lfo-wave">
                                    <option value="sine">Sine</option>
                                    <option value="triangle">Triangle</option>
                                    <option value="square">Square</option>
                                    <option value="sawtooth">Sawtooth</option>
                                    <option value="random">S&H Random</option>
                                </select>
                            </div>
                            <div class="slider-container">
                                <div class="slider-label"><span>Target</span></div>
                                <select id="tb303-lfo-target">
                                    <option value="filter">Filter</option>
                                    <option value="pitch">Pitch</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                        </div>
                        <div class="lfo-sync">
                            <label class="checkbox-label">
                                <input type="checkbox" id="tb303-lfo-sync">
                                <span>Sync to BPM</span>
                            </label>
                            <select id="tb303-lfo-division">
                                <option value="1">1 Bar</option>
                                <option value="2">1/2</option>
                                <option value="4" selected>1/4</option>
                                <option value="8">1/8</option>
                                <option value="16">1/16</option>
                            </select>
                        </div>
                        
                        <!-- WOBBLE BUILD AUTOMATION -->
                        <div class="wobble-automation">
                            <span class="auto-label">🚀 Wobble Build:</span>
                            <button class="btn btn-small" id="wobble-build-8">8 bars</button>
                            <button class="btn btn-small" id="wobble-build-16">16 bars</button>
                            <button class="btn btn-small" id="wobble-build-32">32 bars</button>
                        </div>
                    </div>
                    
                </div>
                
                <!-- STEP ACCENT/SLIDE EDITOR -->
                <div class="tb303-step-editor">
                    <h4>🎹 Step Modifiers (Bass 1 Track)</h4>
                    <div class="step-editor-row">
                        <span class="row-label">ACCENT:</span>
                        <div class="step-buttons" id="accent-steps"></div>
                    </div>
                    <div class="step-editor-row">
                        <span class="row-label">SLIDE:</span>
                        <div class="step-buttons" id="slide-steps"></div>
                    </div>
                </div>
                
            </div>
        `;
        
        // Insert at the beginning
        container.insertBefore(section, container.firstChild);
        
        // Build step buttons
        MC303.build303StepButtons();
        
        // Attach event listeners
        MC303.attach303Listeners();
        
        // Toggle accordion
        const header = section.querySelector('.accordion-header');
        const content = section.querySelector('.accordion-content');
        header.addEventListener('click', (e) => {
            // Don't toggle if clicking on the mode switch
            if (e.target.closest('.tb303-mode-toggle')) return;
            
            content.classList.toggle('open');
            const icon = header.querySelector('.accordion-icon');
            icon.textContent = content.classList.contains('open') ? '▼' : '▶';
        });
        
        console.log('🎛️ TB-303 Panel built');
    };
    
    // ============================================================
    // STEP BUTTONS FOR ACCENT/SLIDE
    // ============================================================
    
    MC303.build303StepButtons = function() {
        const accentContainer = document.getElementById('accent-steps');
        const slideContainer = document.getElementById('slide-steps');
        
        if (!accentContainer || !slideContainer) return;
        
        for (let i = 0; i < 16; i++) {
            // Accent button
            const accentBtn = document.createElement('button');
            accentBtn.className = 'step-mod-btn' + (i % 4 === 0 ? ' beat' : '');
            accentBtn.dataset.step = i;
            accentBtn.dataset.type = 'accent';
            accentBtn.textContent = i + 1;
            if (MC303.tb303.accentSteps[i]) accentBtn.classList.add('active');
            accentContainer.appendChild(accentBtn);
            
            // Slide button
            const slideBtn = document.createElement('button');
            slideBtn.className = 'step-mod-btn' + (i % 4 === 0 ? ' beat' : '');
            slideBtn.dataset.step = i;
            slideBtn.dataset.type = 'slide';
            slideBtn.textContent = i + 1;
            if (MC303.tb303.slideSteps[i]) slideBtn.classList.add('active');
            slideContainer.appendChild(slideBtn);
        }
        
        // Click handlers
        accentContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.step-mod-btn');
            if (!btn) return;
            const step = parseInt(btn.dataset.step);
            MC303.tb303.accentSteps[step] = !MC303.tb303.accentSteps[step];
            btn.classList.toggle('active', MC303.tb303.accentSteps[step]);
        });
        
        slideContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.step-mod-btn');
            if (!btn) return;
            const step = parseInt(btn.dataset.step);
            MC303.tb303.slideSteps[step] = !MC303.tb303.slideSteps[step];
            btn.classList.toggle('active', MC303.tb303.slideSteps[step]);
        });
    };
    
    // ============================================================
    // ATTACH ALL 303 EVENT LISTENERS
    // ============================================================
    
    MC303.attach303Listeners = function() {
        const tb = MC303.tb303;
        
        // --- 303 Mode Toggle ---
        const modeToggle = document.getElementById('tb303-mode-enabled');
        if (modeToggle) {
            modeToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    MC303.enable303Mode();
                } else {
                    MC303.disable303Mode();
                }
            });
        }
        
        // --- Filter Controls ---
        MC303.bindSlider('tb303-cutoff', (v) => { tb.cutoff = v; }, ' Hz');
        MC303.bindSlider('tb303-resonance', (v) => { tb.resonance = v; }, '');
        MC303.bindSlider('tb303-envmod', (v) => { tb.envMod = v; }, '%');
        MC303.bindSlider('tb303-decay', (v) => { tb.decay = v; }, ' s', true);
        MC303.bindSlider('tb303-accent', (v) => { tb.accent = v; }, '%');
        
        // --- Oscillator Controls ---
        const waveEl = document.getElementById('tb303-waveform');
        if (waveEl) {
            waveEl.addEventListener('change', (e) => { tb.waveform = e.target.value; });
        }
        
        MC303.bindSlider('tb303-sub', (v) => { tb.subOsc = v / 100; }, '%');
        MC303.bindSlider('tb303-drive', (v) => { tb.drive = v / 100; }, '%');
        MC303.bindSlider('tb303-level', (v) => { tb.level = v / 100; }, '%');
        
        // --- Slide Controls ---
        const slideEnabled = document.getElementById('tb303-slide-enabled');
        if (slideEnabled) {
            slideEnabled.addEventListener('change', (e) => { tb.slideEnabled = e.target.checked; });
        }
        
        const slideTime = document.getElementById('tb303-slide-time');
        const slideTimeVal = document.getElementById('tb303-slide-time-value');
        if (slideTime) {
            slideTime.addEventListener('input', (e) => {
                tb.slideTime = parseFloat(e.target.value);
                if (slideTimeVal) slideTimeVal.textContent = Math.round(tb.slideTime * 1000) + 'ms';
            });
        }
        
        // --- LFO Controls ---
        const lfoEnabled = document.getElementById('tb303-lfo-enabled');
        if (lfoEnabled) {
            lfoEnabled.addEventListener('change', (e) => { tb.lfo.enabled = e.target.checked; });
        }
        
        MC303.bindSlider('tb303-lfo-rate', (v) => { tb.lfo.rate = v; }, ' Hz', true);
        MC303.bindSlider('tb303-lfo-depth', (v) => { tb.lfo.depth = v; }, ' Hz');
        
        const lfoWave = document.getElementById('tb303-lfo-wave');
        if (lfoWave) {
            lfoWave.addEventListener('change', (e) => { tb.lfo.waveform = e.target.value; });
        }
        
        const lfoTarget = document.getElementById('tb303-lfo-target');
        if (lfoTarget) {
            lfoTarget.addEventListener('change', (e) => { tb.lfo.target = e.target.value; });
        }
        
        const lfoSync = document.getElementById('tb303-lfo-sync');
        if (lfoSync) {
            lfoSync.addEventListener('change', (e) => { tb.lfo.sync = e.target.checked; });
        }
        
        const lfoDivision = document.getElementById('tb303-lfo-division');
        if (lfoDivision) {
            lfoDivision.addEventListener('change', (e) => { tb.lfo.syncDivision = parseInt(e.target.value); });
        }
        
        // --- Preset Buttons ---
        document.querySelectorAll('.tb303-presets button').forEach(btn => {
            btn.addEventListener('click', () => {
                const patternName = btn.dataset.pattern;
                MC303.loadAcidPattern(patternName);
            });
        });
        
        // --- Wobble Build Automation ---
        const bindWobbleBuild = (id, bars) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    const duration = (60 / MC303.state.bpm) * 4 * bars;
                    MC303.startWobbleAutomation(0, 4000, duration);
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), duration * 1000);
                });
            }
        };
        
        bindWobbleBuild('wobble-build-8', 8);
        bindWobbleBuild('wobble-build-16', 16);
        bindWobbleBuild('wobble-build-32', 32);
    };
    
    // ============================================================
    // SLIDER BINDING HELPER
    // ============================================================
    
    MC303.bindSlider = function(id, setter, suffix = '', isFloat = false) {
        const el = document.getElementById(id);
        const valEl = document.getElementById(id + '-value');
        
        if (el) {
            el.addEventListener('input', (e) => {
                const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value);
                setter(val);
                if (valEl) {
                    valEl.textContent = (isFloat && val < 10 ? val.toFixed(2) : Math.round(val)) + suffix;
                }
            });
        }
    };
    
    // ============================================================
    // INIT 303 PANEL (Call from main.js)
    // ============================================================
    
    MC303.init303 = function() {
        MC303.build303Panel();
        MC303.enable303Mode();
        MC303.update303UI();
    };
    
})(window.MC303 = window.MC303 || {});
