/* ============================================================ */
/* MC-303 ULTIMATE v5.0 - VISUALIZER                            */
/* Waveform visualization                                       */
/* ============================================================ */

(function(MC303) {
    'use strict';
    
    // --- Draw Waveform ---
    MC303.drawWaveform = function() {
        const canvas = document.getElementById('waveform');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        function draw() {
            requestAnimationFrame(draw);
            
            if (!MC303.audio.analyser) {
                // Draw static line when not playing
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#00d9ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, canvas.height / 2);
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
                return;
            }
            
            const bufferLength = MC303.audio.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            MC303.audio.analyser.getByteTimeDomainData(dataArray);
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Waveform
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00d9ff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00d9ff';
            ctx.beginPath();
            
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        }
        
        draw();
        console.log('📊 Visualizer started');
    };
    
    // --- Initialize Visualizer (called from main.js) ---
    MC303.initVisualizer = function() {
        MC303.drawWaveform();
    };
    
})(window.MC303 = window.MC303 || {});
