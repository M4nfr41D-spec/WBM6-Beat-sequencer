/* ============================================================ */
/* MC-303 ULTIMATE v5.0 - PIANO KEYBOARD                        */
/* Visual piano for note selection                              */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // --- Create Piano Keyboard ---
    MC303.createPianoKeyboard = function() {
        const container = document.getElementById('piano-keys');
        if (!container) return;
        
        // Determine key width based on screen size
        let whiteKeyWidth = 32;
        if (window.innerWidth <= 480) whiteKeyWidth = 22;
        else if (window.innerWidth <= 768) whiteKeyWidth = 26;
        
        const keyMargin = 2;
        const blackKeyOffset = whiteKeyWidth * 0.7;
        
        // Note definitions
        const octaves = ['1', '2', '3', '4'];
        const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const blackNotes = {'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#'};
        
        let whiteKeyIndex = 0;
        
        octaves.forEach(oct => {
            whiteNotes.forEach(note => {
                // White key
                const whiteKey = document.createElement('div');
                whiteKey.className = 'piano-key white';
                whiteKey.dataset.note = note + oct;
                
                const whiteLabel = document.createElement('div');
                whiteLabel.className = 'piano-key-label';
                whiteLabel.textContent = note + oct;
                whiteKey.appendChild(whiteLabel);
                
                MC303.addPianoKeyHandler(whiteKey);
                container.appendChild(whiteKey);
                
                // Black key (if applicable)
                if (blackNotes[note]) {
                    const blackKey = document.createElement('div');
                    blackKey.className = 'piano-key black';
                    blackKey.dataset.note = blackNotes[note] + oct;
                    blackKey.style.left = `${whiteKeyIndex * (whiteKeyWidth + keyMargin) + blackKeyOffset}px`;
                    
                    const blackLabel = document.createElement('div');
                    blackLabel.className = 'piano-key-label';
                    blackLabel.textContent = blackNotes[note] + oct;
                    blackKey.appendChild(blackLabel);
                    
                    MC303.addPianoKeyHandler(blackKey);
                    container.appendChild(blackKey);
                }
                
                whiteKeyIndex++;
            });
        });
        
        // C5 at the end
        const c5Key = document.createElement('div');
        c5Key.className = 'piano-key white';
        c5Key.dataset.note = 'C5';
        
        const c5Label = document.createElement('div');
        c5Label.className = 'piano-key-label';
        c5Label.textContent = 'C5';
        c5Key.appendChild(c5Label);
        
        MC303.addPianoKeyHandler(c5Key);
        container.appendChild(c5Key);
        
        console.log('🎹 Piano keyboard created');
    };
    
    // --- Add Click Handler to Piano Key ---
    MC303.addPianoKeyHandler = function(keyDiv) {
        keyDiv.addEventListener('click', () => {
            if (!MC303.audio.context) MC303.initAudio();
            
            const noteName = keyDiv.dataset.note;
            const previewFreq = MC303.allNotes[noteName];
            
            // Play preview sound
            if (previewFreq && MC303.playPreviewNote) {
                MC303.playPreviewNote(previewFreq);
            }
            
            // Set note for selected step
            if (MC303.state.selectedStep) {
                const pattern = MC303.getCurrentPattern();
                const notesKey = `${MC303.state.selectedStep.track}Notes`;
                
                if (pattern[notesKey]) {
                    pattern[notesKey][MC303.state.selectedStep.step] = noteName;
                    if (MC303.updateSequencerDisplay) MC303.updateSequencerDisplay();
                    MC303.updatePianoInfo();
                    console.log(`🎵 Set ${MC303.state.selectedStep.track} step ${MC303.state.selectedStep.step} to ${noteName}`);
                }
            }
        });
    };
    
    // --- Update Piano Highlight ---
    MC303.updatePianoHighlight = function() {
        document.querySelectorAll('.piano-key').forEach(key => {
            key.classList.remove('current-note');
        });
        
        if (MC303.state.selectedStep) {
            const pattern = MC303.getCurrentPattern();
            const notesKey = `${MC303.state.selectedStep.track}Notes`;
            
            if (pattern[notesKey]) {
                const currentNote = pattern[notesKey][MC303.state.selectedStep.step];
                const keyElement = document.querySelector(`.piano-key[data-note="${currentNote}"]`);
                if (keyElement) {
                    keyElement.classList.add('current-note');
                }
            }
        }
    };
    
    // --- Update Piano Info Display ---
    MC303.updatePianoInfo = function() {
        const infoDiv = document.getElementById('piano-info');
        if (!infoDiv) return;
        
        if (MC303.state.selectedStep) {
            const pattern = MC303.getCurrentPattern();
            const notesKey = `${MC303.state.selectedStep.track}Notes`;
            
            if (pattern[notesKey]) {
                const currentNote = pattern[notesKey][MC303.state.selectedStep.step];
                const freq = MC303.allNotes[currentNote] || 0;
                infoDiv.textContent = `${MC303.state.selectedStep.track.toUpperCase()} Step ${MC303.state.selectedStep.step + 1}: ${currentNote} (${Math.round(freq)} Hz) - Click a piano key!`;
                infoDiv.style.color = 'var(--neon-green)';
            } else {
                infoDiv.textContent = `${MC303.state.selectedStep.track.toUpperCase()} Step ${MC303.state.selectedStep.step + 1} selected`;
                infoDiv.style.color = 'var(--neon-blue)';
            }
        } else {
            infoDiv.textContent = 'Click a step, then click a piano key to set the note!';
            infoDiv.style.color = 'var(--neon-yellow)';
        }
        
        MC303.updatePianoHighlight();
    };
    
    // --- Play Preview Note ---
    MC303.playPreviewNote = function(freq) {
        if (!MC303.audio.context) return;
        
        const ctx = MC303.audio.context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(MC303.audio.filter || ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    };
    
    // --- Initialize Piano (called from main.js) ---
    MC303.initPiano = function() {
        MC303.createPianoKeyboard();
        MC303.updatePianoInfo();
        console.log('🎹 Piano initialized');
    };
    
})(window.MC303 = window.MC303 || {});
