/* ============================================================ */
/* MC-303 ULTIMATE v5.0 - PRESETS                               */
/* Hardware emulation presets                                   */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // --- Hardware Presets ---
    MC303.hardwarePresets = {
        TR808: {
            name: 'TR-808',
            color: 'var(--neon-orange)',
            settings: {
                kick1: { freq: 60, wave: 'sine', level: 0.9 },
                snare1: { tone: 180, decay: 0.12, level: 0.7 },
                hat1: { tone: 8000, decay: 0.04, level: 0.5 }
            }
        },
        TR909: {
            name: 'TR-909',
            color: 'var(--neon-orange)',
            settings: {
                kick1: { freq: 65, wave: 'sine', level: 0.85 },
                snare1: { tone: 250, decay: 0.15, level: 0.75 },
                hat1: { tone: 9000, decay: 0.05, level: 0.55 }
            }
        },
        TB303: {
            name: 'TB-303',
            color: 'var(--neon-orange)',
            settings: {
                bass1: { wave: 'sawtooth', level: 0.7, adsr: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.1 } },
                bass2: { wave: 'square', level: 0.4, adsr: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.1 } }
            }
        },
        MC303: {
            name: 'MC-303',
            color: 'var(--neon-orange)',
            settings: {
                kick1: { freq: 70, wave: 'sine', level: 0.8 },
                bass1: { wave: 'sawtooth', level: 0.65 },
                fx1: { type: 'cowbell', pitch: 800, level: 0.5 }
            }
        },
        CR78: {
            name: 'CR-78',
            color: 'var(--neon-orange)',
            settings: {
                kick1: { freq: 55, wave: 'sine', level: 0.7, adsr: { attack: 0.005, decay: 0.25, sustain: 0, release: 0.15 } },
                snare1: { tone: 150, decay: 0.1, level: 0.6 },
                hat1: { tone: 6000, decay: 0.03, level: 0.45 }
            }
        },
        LINNDRUM: {
            name: 'LinnDrum',
            color: 'var(--neon-orange)',
            settings: {
                kick1: { freq: 58, wave: 'sine', level: 0.85 },
                snare1: { tone: 220, decay: 0.18, level: 0.8 },
                hat1: { tone: 8500, decay: 0.06, level: 0.5 }
            }
        },
        JUNO106: {
            name: 'Juno-106',
            color: 'var(--neon-orange)',
            settings: {
                bass1: { wave: 'sawtooth', level: 0.65, lfo: { rate: 3, depth: 0.15, target: 'filter' }, adsr: { attack: 0.05, decay: 0.3, sustain: 0.5, release: 0.3 } },
                bass2: { wave: 'square', level: 0.45, lfo: { rate: 2, depth: 0.1, target: 'filter' }, adsr: { attack: 0.05, decay: 0.25, sustain: 0.4, release: 0.25 } }
            }
        },
        SH101: {
            name: 'SH-101',
            color: 'var(--neon-orange)',
            settings: {
                bass1: { wave: 'sawtooth', level: 0.7, lfo: { rate: 5, depth: 0.2, target: 'pitch' }, adsr: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.15 } },
                bass2: { wave: 'square', level: 0.5, adsr: { attack: 0.01, decay: 0.15, sustain: 0.25, release: 0.1 } }
            }
        },
        PROPHET: {
            name: 'Prophet-5',
            color: 'var(--neon-orange)',
            settings: {
                bass1: { wave: 'sawtooth', level: 0.6, lfo: { rate: 1.5, depth: 0.1, target: 'filter' }, adsr: { attack: 0.1, decay: 0.4, sustain: 0.6, release: 0.4 } },
                bass2: { wave: 'triangle', level: 0.4, lfo: { rate: 2, depth: 0.15, target: 'pitch' }, adsr: { attack: 0.08, decay: 0.35, sustain: 0.5, release: 0.35 } }
            }
        },
        SYNTHWAVE: {
            name: 'Synthwave',
            color: 'var(--neon-orange)',
            settings: {
                kick1: { freq: 55, wave: 'sine', level: 0.9 },
                snare1: { tone: 200, decay: 0.2, level: 0.75 },
                bass1: { wave: 'sawtooth', level: 0.7, lfo: { rate: 2, depth: 0.1, target: 'filter' } },
                hat1: { tone: 9000, decay: 0.08, level: 0.4 }
            }
        },
        INDUSTRIAL: {
            name: 'Industrial',
            color: 'var(--neon-orange)',
            settings: {
                kick1: { freq: 45, wave: 'triangle', level: 0.95 },
                snare1: { tone: 350, decay: 0.25, level: 0.85 },
                fx1: { type: 'gunshot', pitch: 150, level: 0.7 },
                hat1: { tone: 10000, decay: 0.02, level: 0.6 }
            }
        },
        AMBIENT: {
            name: 'Ambient',
            color: 'var(--neon-orange)',
            settings: {
                bass1: { wave: 'sine', level: 0.4, lfo: { rate: 0.5, depth: 0.3, target: 'filter' }, adsr: { attack: 0.5, decay: 1, sustain: 0.7, release: 1 } },
                bass2: { wave: 'triangle', level: 0.3, lfo: { rate: 0.3, depth: 0.2, target: 'pitch' }, adsr: { attack: 0.8, decay: 1.2, sustain: 0.6, release: 1.5 } },
                hat1: { tone: 5000, decay: 0.3, level: 0.2 }
            }
        },
        NORDLEAD_LEAD: {
            name: '🎹 Nordlead Lead',
            color: 'var(--neon-pink)',
            settings: {
                bass1: { wave: 'sawtooth', level: 0.75, lfo: { rate: 6, depth: 0.08, target: 'pitch' }, adsr: { attack: 0.005, decay: 0.1, sustain: 0.7, release: 0.15 } },
                bass2: { wave: 'square', level: 0.55, lfo: { rate: 4, depth: 0.1, target: 'filter' }, adsr: { attack: 0.005, decay: 0.08, sustain: 0.65, release: 0.1 } }
            }
        },
        NORDLEAD_PAD: {
            name: '☁️ Nordlead Pad',
            color: 'var(--neon-purple)',
            settings: {
                bass1: { wave: 'sawtooth', level: 0.5, lfo: { rate: 0.8, depth: 0.25, target: 'filter' }, adsr: { attack: 0.4, decay: 0.8, sustain: 0.7, release: 1.2 } },
                bass2: { wave: 'triangle', level: 0.4, lfo: { rate: 0.5, depth: 0.15, target: 'pitch' }, adsr: { attack: 0.6, decay: 1.0, sustain: 0.6, release: 1.5 } }
            }
        },
        DX200_FM: {
            name: '📻 DX200 FM',
            color: 'var(--neon-green)',
            settings: {
                bass1: { wave: 'sine', level: 0.65, lfo: { rate: 3.5, depth: 0.3, target: 'pitch' }, adsr: { attack: 0.01, decay: 0.25, sustain: 0.4, release: 0.2 } },
                bass2: { wave: 'triangle', level: 0.45, lfo: { rate: 7, depth: 0.2, target: 'filter' }, adsr: { attack: 0.01, decay: 0.2, sustain: 0.35, release: 0.15 } },
                fx1: { type: 'fmbell', pitch: 440, level: 0.5 }
            }
        },
        NI_MASCHINE: {
            name: '⬛ NI Maschine',
            color: 'var(--neon-blue)',
            settings: {
                kick1: { freq: 55, wave: 'sine', level: 0.9, adsr: { attack: 0.005, decay: 0.35, sustain: 0, release: 0.2 } },
                snare1: { tone: 280, decay: 0.18, level: 0.8 },
                hat1: { tone: 9500, decay: 0.04, level: 0.55 },
                bass1: { wave: 'square', level: 0.6, adsr: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.1 } }
            }
        },
        TR909_TECHNO: {
            name: '⚡ 909 Techno',
            color: 'var(--neon-yellow)',
            settings: {
                kick1: { freq: 50, wave: 'sine', level: 0.95, adsr: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.25 } },
                snare1: { tone: 300, decay: 0.12, level: 0.85 },
                hat1: { tone: 10000, decay: 0.03, level: 0.6 }
            }
        },
        TR808_TRAP: {
            name: '💎 808 Trap',
            color: 'var(--neon-red)',
            settings: {
                kick1: { freq: 40, wave: 'sine', level: 0.95, adsr: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 } },
                snare1: { tone: 200, decay: 0.2, level: 0.7 },
                hat1: { tone: 8000, decay: 0.08, level: 0.5 },
                bass1: { wave: 'square', level: 0.7, adsr: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 } }
            }
        }
    };
    
    // --- Load Preset (FIXED: Proper merge and UI update) ---
    MC303.loadPreset = function(presetName) {
        const preset = MC303.hardwarePresets[presetName];
        if (!preset) {
            console.warn('Preset not found:', presetName);
            return;
        }
        
        // Apply preset settings to tracks (deep merge)
        Object.keys(preset.settings).forEach(track => {
            if (MC303.trackSettings[track]) {
                const presetTrack = preset.settings[track];
                // Merge each property, keeping non-preset values
                Object.keys(presetTrack).forEach(key => {
                    if (key === 'adsr' && presetTrack.adsr) {
                        // Deep merge ADSR
                        MC303.trackSettings[track].adsr = {
                            ...MC303.trackSettings[track].adsr,
                            ...presetTrack.adsr
                        };
                    } else if (key === 'lfo' && presetTrack.lfo) {
                        // Deep merge LFO
                        MC303.trackSettings[track].lfo = {
                            ...MC303.trackSettings[track].lfo,
                            ...presetTrack.lfo
                        };
                    } else {
                        MC303.trackSettings[track][key] = presetTrack[key];
                    }
                });
                
                // Update UI for this track
                if (MC303.updateTrackUI) MC303.updateTrackUI(track);
            }
        });
        
        // Also update all track UIs to reflect changes
        if (MC303.updateAllTrackControls) MC303.updateAllTrackControls();
        
        console.log(`🎹 Loaded preset: ${preset.name}`);
        alert(`${preset.name} preset loaded!`);
    };
    
    // --- Render Preset Buttons ---
    MC303.renderPresetButtons = function() {
        const container = document.getElementById('preset-buttons');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.keys(MC303.hardwarePresets).forEach(key => {
            const preset = MC303.hardwarePresets[key];
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = preset.name;
            if (preset.color && preset.color !== 'var(--neon-orange)') {
                btn.style.borderColor = preset.color;
            }
            btn.onclick = () => MC303.loadPreset(key);
            container.appendChild(btn);
        });
    };
    
    // --- Copy Track Settings ---
    MC303.copyTrackSettings = function(trackId) {
        MC303.state.settingsClipboard = JSON.parse(JSON.stringify(MC303.trackSettings[trackId]));
        alert(`${trackId.toUpperCase()} settings copied!`);
    };
    
    // --- Paste Track Settings ---
    MC303.pasteTrackSettings = function(trackId) {
        if (!MC303.state.settingsClipboard) {
            alert('Nothing to paste!');
            return;
        }
        const mute = MC303.trackSettings[trackId].mute;
        const solo = MC303.trackSettings[trackId].solo;
        Object.assign(MC303.trackSettings[trackId], JSON.parse(JSON.stringify(MC303.state.settingsClipboard)));
        MC303.trackSettings[trackId].mute = mute;
        MC303.trackSettings[trackId].solo = solo;
        if (MC303.updateTrackUI) MC303.updateTrackUI(trackId);
        alert(`Settings pasted to ${trackId.toUpperCase()}!`);
    };
    
    // --- Reset Track Settings ---
    MC303.resetTrackSettings = function(trackId) {
        const mute = MC303.trackSettings[trackId].mute;
        const solo = MC303.trackSettings[trackId].solo;
        Object.assign(MC303.trackSettings[trackId], JSON.parse(JSON.stringify(MC303.defaultTrackSettings[trackId])));
        MC303.trackSettings[trackId].mute = mute;
        MC303.trackSettings[trackId].solo = solo;
        if (MC303.updateTrackUI) MC303.updateTrackUI(trackId);
        alert(`${trackId.toUpperCase()} reset to defaults!`);
    };
    
    // Make functions globally accessible
    window.loadPreset = MC303.loadPreset;
    window.copyTrackSettings = MC303.copyTrackSettings;
    window.pasteTrackSettings = MC303.pasteTrackSettings;
    window.resetTrackSettings = MC303.resetTrackSettings;
    
})(window.MC303 = window.MC303 || {});
