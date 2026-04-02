'use strict';
/* ============================================================
   GLITCH MODE – Easter egg that transforms the game into a
   corrupted, broken, static-noise nightmare with "coding errors"
   floating across screen, visual tearing, scanlines, RGB splits
   and distorted audio. Activated by entering "glitch" at password.
   ============================================================ */

const GlitchMode = (() => {
    let _active = false;
    let _glitchCanvas = null;
    let _glitchCtx = null;
    let _staticInterval = null;
    let _errorOverlay = null;
    let _codeErrors = [];
    let _scanlineOffset = 0;

    /* ── CODE ERROR MESSAGES ── */
    const ERROR_MESSAGES = [
        'FATAL ERROR: null pointer at 0x00FF42',
        'Segmentation fault (core dumped)',
        'TypeError: undefined is not a function',
        'KERNEL PANIC: not syncing',
        'ERROR 0xDEADBEEF: memory corrupted',
        'WARNING: buffer overflow detected',
        'Exception in thread "main"',
        'SyntaxError: Unexpected token <',
        'BSOD: IRQL_NOT_LESS_OR_EQUAL',
        'Stack overflow at address 0x7FFE',
        'ERROR: texture_load failed (gl_error=1281)',
        'Assertion failed: node != NULL',
        'ERROR: entity.position = NaN',
        'WARNING: physics timestep too large',
        'CORRUPTION: save data unreadable',
        'malloc(): corrupted top size',
        'free(): double free detected',
        'runtime error: index out of bounds',
        'FATAL: cannot allocate memory',
        'ERROR 404: reality not found',
        'kernel: BUG: workqueue lockup',
        'GLITCH: ▓▒░ DATA LOST ░▒▓',
        '>>> SYSTEM UNSTABLE <<<',
        'ERR: player.y = -Infinity',
        'WARN: frame_time = 999ms',
        'CRITICAL: render pipeline broken',
        'ERR: audio_ctx.state = "broken"',
        '▓▒░ H̷E̵L̶P̷ ░▒▓',
        'console.error("why am I here")',
        'catch(e) { /* TODO: fix this */ }',
        'if (true === false) { // ???',
        'var x = x + x; // infinite loop',
        '// FIXME: everything is broken',
        '/* this code should not exist */',
    ];

    /* ── GLITCH LEVEL ── */
    const GLITCH_LEVEL = {
        name: '▓▒░ G̷L̶I̵T̸C̷H̶ ░▒▓',
        bpm: 666, // Doesn't matter, we override audio
        speed: 250,
        theme: 'glitch',
        length: 8000,
        bgStops: ['#000000', '#0a0a0a'],
        accentColor: '#00ff00',
        obstacles: [
            spike(600), spike(700),
            block(1000, 2), spike(1200),
            spike(1400), spike(1500),
            portal(1800, 'ship'),
            ceilingBlock(2100, 2), block(2400, 1),
            ceilingBlock(2700, 1), block(2900, 2),
            portal(3200, 'cube'),
            spike(3400), spike(3600), spike(3800),
            block(4000, 3),
            portal(4300, 'wave'),
            ceilingSpike(4500), spike(4700),
            ceilingSpike(4900), spike(5100),
            ceilingSpike(5300), spike(5500),
            portal(5700, 'ball'),
            spike(5900), ceilingSpike(6100),
            spike(6300), ceilingSpike(6500),
            portal(6700, 'cube'),
            spike(6900), spike(7100), spike(7300),
            block(7500, 2), spike(7700),
            end(7800),
        ]
    };

    /* ── FLOATING CODE ERROR SYSTEM ── */
    function _spawnCodeError() {
        const msg = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
        _codeErrors.push({
            text: msg,
            x: window.innerWidth + 20,
            y: 30 + Math.random() * (window.innerHeight - 60),
            speed: 40 + Math.random() * 120,
            alpha: 0.3 + Math.random() * 0.7,
            size: 10 + Math.random() * 6,
            color: Math.random() > 0.5 ? '#00ff00' :
                   Math.random() > 0.5 ? '#ff0000' :
                   Math.random() > 0.5 ? '#ff00ff' : '#00ffff',
            glitchPhase: Math.random() * Math.PI * 2,
        });
    }

    function _updateCodeErrors(dt) {
        for (const err of _codeErrors) {
            err.x -= err.speed * dt;
            err.y += Math.sin(err.glitchPhase + err.x * 0.01) * 0.5;
        }
        _codeErrors = _codeErrors.filter(e => e.x > -500);
        // Spawn new ones
        if (Math.random() < 0.08) _spawnCodeError();
    }

    function _drawCodeErrors(ctx) {
        ctx.save();
        for (const err of _codeErrors) {
            ctx.globalAlpha = err.alpha * (0.5 + 0.5 * Math.sin(err.glitchPhase + performance.now() * 0.005));
            ctx.font = `bold ${err.size}px "Courier New", monospace`;
            ctx.fillStyle = err.color;
            ctx.shadowColor = err.color;
            ctx.shadowBlur = 8;
            ctx.fillText(err.text, err.x, err.y);
            // Occasional double-print offset
            if (Math.random() < 0.1) {
                ctx.globalAlpha *= 0.4;
                ctx.fillText(err.text, err.x + (Math.random() - 0.5) * 6, err.y + (Math.random() - 0.5) * 4);
            }
        }
        ctx.restore();
    }

    /* ── STATIC NOISE ── */
    function _drawStatic(ctx, W, H, intensity) {
        const imageData = ctx.getImageData(0, 0, W, H);
        const data = imageData.data;
        const strength = intensity || 0.03;

        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < strength) {
                const v = Math.random() * 255;
                data[i] = v;     // R
                data[i+1] = v;   // G
                data[i+2] = v;   // B
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    /* ── SCANLINES ── */
    function _drawScanlines(ctx, W, H, time) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        for (let y = 0; y < H; y += 3) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, y, W, 1);
        }
        // Moving thick scanline
        const scanY = (time * 80) % (H + 100) - 50;
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, scanY, W, 3);
        ctx.restore();
    }

    /* ── RGB SPLIT / CHROMATIC ABERRATION ── */
    function _drawRGBSplit(ctx, W, H, time) {
        // Occasionally do a heavy RGB split
        if (Math.random() < 0.02) {
            ctx.save();
            const off = 2 + Math.random() * 6;
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.15;
            ctx.drawImage(ctx.canvas, off, 0);
            ctx.drawImage(ctx.canvas, -off, 0);
            ctx.restore();
        }
    }

    /* ── SCREEN TEAR ── */
    function _drawScreenTear(ctx, W, H) {
        if (Math.random() < 0.04) {
            const tearY = Math.random() * H;
            const tearH = 5 + Math.random() * 30;
            const tearShift = (Math.random() - 0.5) * 40;
            ctx.save();
            const slice = ctx.getImageData(0, tearY, W, tearH);
            ctx.putImageData(slice, tearShift, tearY);
            ctx.restore();
        }
    }

    /* ── VHS FLICKER ── */
    function _drawVHSFlicker(ctx, W, H, time) {
        if (Math.random() < 0.05) {
            ctx.save();
            ctx.globalAlpha = 0.1 + Math.random() * 0.15;
            ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#111';
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }
    }

    /* ── PATCH RENDERER ── */
    function patchRenderer(renderer) {
        const origDraw = renderer.draw.bind(renderer);
        const origDrawBg = renderer._drawBg.bind(renderer);
        const origDrawGround = renderer._drawGround.bind(renderer);
        const origDrawSpike = renderer._drawSpike.bind(renderer);
        const origDrawBlock = renderer._drawBlock.bind(renderer);
        const origDrawPortal = renderer._drawPortal.bind(renderer);
        const origDrawEndGate = renderer._drawEndGate.bind(renderer);
        const origDrawPlayer = renderer._drawPlayer.bind(renderer);

        renderer._drawBg = function(game, W, H, accent) {
            const { ctx } = this;
            const t = this._time;

            // Dark glitchy background
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#000000');
            grad.addColorStop(0.5, '#050505');
            grad.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Matrix-style falling characters
            _drawMatrixRain(ctx, t, W, H);

            // Glitchy grid
            _drawGlitchGrid(ctx, game, W, H, t);

            // Pulsing green halo
            const pulse = 0.08 + 0.05 * Math.sin(t * 6);
            const halo = ctx.createLinearGradient(0, H - 200, 0, H);
            halo.addColorStop(0, 'transparent');
            halo.addColorStop(1, `rgba(0, 255, 0, ${pulse})`);
            ctx.fillStyle = halo;
            ctx.fillRect(0, H - 200, W, 200);
        };

        renderer._drawGround = function(game, W, H, accent) {
            const { ctx } = this;
            const gY = game.groundY;
            const t = this._time;

            // Glitchy ground with random color flashes
            ctx.save();
            const gColor = Math.random() < 0.05 ? '#ff0000' : 
                           Math.random() < 0.05 ? '#ff00ff' : '#00ff00';
            ctx.shadowColor = gColor;
            ctx.shadowBlur = 20 + Math.sin(t * 10) * 10;
            ctx.strokeStyle = gColor;
            ctx.lineWidth = 2 + Math.random() * 2;
            
            // Sometimes offset the ground line
            const yOffset = Math.random() < 0.03 ? (Math.random() - 0.5) * 8 : 0;
            ctx.beginPath();
            // Jagged line instead of straight
            for (let x = 0; x < W; x += 10) {
                const jitter = Math.random() < 0.1 ? (Math.random() - 0.5) * 6 : 0;
                if (x === 0) ctx.moveTo(x, gY + yOffset + jitter);
                else ctx.lineTo(x, gY + yOffset + jitter);
            }
            ctx.stroke();

            // Ground fill with static pattern
            const gGrad = ctx.createLinearGradient(0, gY, 0, H);
            gGrad.addColorStop(0, 'rgba(0,255,0,0.1)');
            gGrad.addColorStop(0.5, 'rgba(0,100,0,0.05)');
            gGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = gGrad;
            ctx.fillRect(0, gY, W, H - gY);

            ctx.restore();

            // Ceiling
            ctx.save();
            ctx.shadowColor = '#00ff0044';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = '#00ff0033';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, game.ceilingY); ctx.lineTo(W, game.ceilingY); ctx.stroke();
            ctx.restore();
        };

        renderer._drawSpike = function(ctx, x, y, w, h, ceiling, _accent) {
            const t = performance.now() / 1000;
            // Glitch color
            const colors = ['#00ff00', '#ff0000', '#00ffff', '#ff00ff', '#ffff00'];
            const col = Math.random() < 0.1 ? colors[Math.floor(Math.random() * colors.length)] : '#00ff00';

            // Occasionally shift position
            const xShift = Math.random() < 0.03 ? (Math.random() - 0.5) * 10 : 0;

            ctx.fillStyle = col;
            ctx.strokeStyle = '#ffffff44';
            ctx.lineWidth = 1;
            ctx.shadowColor = col;
            ctx.shadowBlur = 10;

            ctx.beginPath();
            if (ceiling) {
                ctx.moveTo(x + xShift, y);
                ctx.lineTo(x + w + xShift, y);
                ctx.lineTo(x + w / 2 + xShift, y + h);
            } else {
                ctx.moveTo(x + xShift, y + h);
                ctx.lineTo(x + w + xShift, y + h);
                ctx.lineTo(x + w / 2 + xShift, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Glitch artifact lines
            if (Math.random() < 0.15) {
                ctx.strokeStyle = '#ff000088';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x - 5, y + h / 2);
                ctx.lineTo(x + w + 5, y + h / 2);
                ctx.stroke();
            }
        };

        renderer._drawBlock = function(ctx, x, y, w, h, _accent) {
            const t = performance.now() / 1000;
            // Matrix-green block with terminal styling
            const col = Math.random() < 0.08 ? '#ff0000' : '#00ff00';

            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(x, y, w, h);

            // Terminal-style border
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.shadowColor = col;
            ctx.shadowBlur = 8;
            ctx.strokeRect(x, y, w, h);

            // Inner code-like pattern
            ctx.font = '8px "Courier New", monospace';
            ctx.fillStyle = col + '66';
            const lines = ['01', '10', 'FF', 'NaN', '??'];
            for (let ty = y + 12; ty < y + h - 4; ty += 14) {
                for (let tx = x + 4; tx < x + w - 10; tx += 20) {
                    ctx.fillText(lines[Math.floor(Math.random() * lines.length)], tx, ty);
                }
            }

            // Occasional red error flash
            if (Math.random() < 0.05) {
                ctx.fillStyle = 'rgba(255,0,0,0.3)';
                ctx.fillRect(x, y, w, h);
            }
        };

        renderer._drawPortal = function(ctx, x, y, w, h, mode, t) {
            const pulse = 0.5 + 0.5 * Math.sin(t * 8);
            const col = '#00ff00';

            ctx.save();
            ctx.shadowColor = col;
            ctx.shadowBlur = 30 * pulse;

            // Glitchy portal - flickering rectangle
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const off = (Math.random() - 0.5) * 4;
                ctx.strokeRect(x + off, y + off, w - off * 2, h - off * 2);
            }

            ctx.fillStyle = col + '11';
            ctx.fillRect(x, y, w, h);

            // Binary text inside
            ctx.fillStyle = col;
            ctx.font = 'bold 9px "Courier New", monospace';
            ctx.textAlign = 'center';
            const label = Math.random() < 0.3 ? '???' : mode.toUpperCase();
            ctx.fillText(label, x + w / 2, y + h / 2 + 4);
            ctx.restore();
        };

        renderer._drawEndGate = function(ctx, x, groundY, ceilingY, _accent) {
            const t = performance.now() / 1000;
            const pulse = 0.7 + 0.3 * Math.sin(t * 6);

            ctx.save();
            // Flickering end gate
            const col = Math.random() < 0.1 ? '#ff0000' : '#00ff00';
            ctx.strokeStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = 30 * pulse;
            ctx.lineWidth = 4;
            
            // Jagged line
            ctx.beginPath();
            for (let y = ceilingY; y <= groundY; y += 5) {
                const jitter = (Math.random() - 0.5) * 6;
                if (y === ceilingY) ctx.moveTo(x + jitter, y);
                else ctx.lineTo(x + jitter, y);
            }
            ctx.stroke();

            // "EXIT" text
            ctx.fillStyle = col;
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('EXIT?', x, (ceilingY + groundY) / 2);
            ctx.restore();
        };

        renderer._drawPlayer = function(game, accent) {
            const { ctx } = this;
            const p = game.player;
            if (!p) return;

            // Glitchy trail
            for (const tp of p.trail) {
                ctx.save();
                ctx.globalAlpha = tp.alpha * 0.5;
                const trailCol = Math.random() < 0.3 ? '#ff0000' : '#00ff00';
                ctx.fillStyle = trailCol;
                ctx.shadowColor = trailCol;
                ctx.shadowBlur = 6;
                ctx.fillRect(tp.x + 4, tp.y + 4, p.size - 8, p.size - 8);
                ctx.restore();
            }

            ctx.save();
            ctx.translate(p.cx, p.cy);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 20;

            // Draw glitch player based on mode
            switch (p.mode) {
                case 'cube': _drawGlitchCube(ctx, p); break;
                case 'ship': _drawGlitchShip(ctx, p); break;
                case 'ball': _drawGlitchBall(ctx, p); break;
                case 'wave': _drawGlitchWave(ctx, p); break;
            }
            ctx.restore();

            // Occasional RGB ghost
            if (Math.random() < 0.1) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(p.x + 3, p.y, p.size, p.size);
                ctx.fillStyle = '#0000ff';
                ctx.fillRect(p.x - 3, p.y, p.size, p.size);
                ctx.restore();
            }
        };

        // Override main draw to add glitch effects after rendering
        renderer.draw = function(game, dt) {
            origDraw.call(this, game, dt);
            const { ctx, canvas } = this;
            const W = canvas.width, H = canvas.height;
            const t = this._time;

            if (game.state === GameState.PLAYING || game.state === GameState.DEAD) {
                _updateCodeErrors(dt);
                _drawCodeErrors(ctx);
                _drawScanlines(ctx, W, H, t);
                _drawScreenTear(ctx, W, H);
                _drawRGBSplit(ctx, W, H, t);
                _drawVHSFlicker(ctx, W, H, t);
                
                // Occasional heavy static burst
                if (Math.random() < 0.01) {
                    _drawStatic(ctx, W, H, 0.15);
                }
            }

            // Death state extra corruption
            if (game.state === GameState.DEAD) {
                const pulse = 0.15 + 0.1 * Math.sin(t * 12);
                ctx.fillStyle = `rgba(255,0,0,${pulse})`;
                ctx.fillRect(0, 0, W, H);
                _drawStatic(ctx, W, H, 0.08);
            }
        };
    }

    /* ── GLITCH PLAYER SHAPES ── */
    function _drawGlitchCube(ctx, p) {
        const s = p.size;
        const t = performance.now() / 1000;

        // Flickering corrupted square
        const col = Math.random() < 0.05 ? '#ff0000' :
                    Math.random() < 0.05 ? '#ff00ff' : '#00ff00';
        ctx.fillStyle = col;
        
        // Sometimes distort
        if (Math.random() < 0.05) {
            ctx.fillRect(-s/2 + (Math.random()-0.5)*8, -s/2 + (Math.random()-0.5)*8, s, s);
        } else {
            ctx.fillRect(-s/2, -s/2, s, s);
        }

        // Terminal text on player
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${s*0.3}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labels = ['ERR', 'NaN', '???', '0x0', 'BUG', '404'];
        ctx.fillText(labels[Math.floor(t * 2) % labels.length], 0, 0);

        // Border
        ctx.strokeStyle = '#ffffff44';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s/2, -s/2, s, s);
    }

    function _drawGlitchShip(ctx, p) {
        const s = p.size;
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(s * 0.5, 0);
        ctx.lineTo(-s * 0.3, -s * 0.4);
        ctx.lineTo(-s * 0.15, 0);
        ctx.lineTo(-s * 0.3, s * 0.4);
        ctx.closePath();
        ctx.fill();
        // Glitch exhaust
        if (Math.random() > 0.3) {
            ctx.fillStyle = Math.random() < 0.5 ? '#ff0000' : '#00ffff';
            ctx.fillRect(-s * 0.45, -s * 0.1, s * 0.15 + Math.random() * s * 0.2, s * 0.2);
        }
    }

    function _drawGlitchBall(ctx, p) {
        const r = p.size / 2;
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        // Binary inside
        ctx.fillStyle = '#000';
        ctx.font = `${r * 0.6}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.random() < 0.5 ? '01' : '10', 0, 0);
    }

    function _drawGlitchWave(ctx, p) {
        const s = p.size * 0.5;
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(-s, s * 0.3);
        ctx.lineTo(0, -s * 0.3);
        ctx.lineTo(s, s * 0.3);
        ctx.lineTo(s * 0.6, s * 0.8);
        ctx.lineTo(-s * 0.4, -s * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff000088';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /* ── MATRIX RAIN ── */
    let _matrixDrops = [];
    function _drawMatrixRain(ctx, time, W, H) {
        // Initialize drops
        if (_matrixDrops.length === 0) {
            for (let i = 0; i < Math.floor(W / 20); i++) {
                _matrixDrops.push({
                    x: i * 20,
                    y: Math.random() * H,
                    speed: 30 + Math.random() * 80,
                    chars: [],
                });
                // Fill with random chars
                for (let j = 0; j < 15; j++) {
                    _matrixDrops[i].chars.push(String.fromCharCode(0x30A0 + Math.random() * 96));
                }
            }
        }

        ctx.save();
        ctx.font = '12px "Courier New", monospace';
        for (const drop of _matrixDrops) {
            drop.y += drop.speed * 0.016;
            if (drop.y > H + 200) {
                drop.y = -200;
                drop.x = Math.random() * W;
            }
            for (let j = 0; j < drop.chars.length; j++) {
                const cy = drop.y - j * 16;
                if (cy < 0 || cy > H) continue;
                const alpha = Math.max(0, 1 - j / drop.chars.length) * 0.15;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = j === 0 ? '#ffffff' : '#00ff00';
                ctx.fillText(drop.chars[j], drop.x, cy);
                // Randomly change chars
                if (Math.random() < 0.02) {
                    drop.chars[j] = String.fromCharCode(0x30A0 + Math.random() * 96);
                }
            }
        }
        ctx.restore();
    }

    /* ── GLITCH GRID ── */
    function _drawGlitchGrid(ctx, game, W, H, t) {
        const scroll = game.worldX * 0.15;
        const gridSz = 80;

        ctx.save();
        ctx.strokeStyle = '#00ff0008';
        ctx.lineWidth = 1;

        const startX = (-scroll % gridSz + gridSz) % gridSz;
        for (let x = startX - gridSz; x < W + gridSz; x += gridSz) {
            // Occasionally skip or double a line
            if (Math.random() < 0.01) continue;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += gridSz) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.restore();
    }

    /* ── GLITCH AUDIO – Static noise & distorted tones ── */
    function patchAudio(audio) {
        audio._origBassPitches2 = audio._bassPitches.bind(audio);
        audio._origMelodyPitches2 = audio._melodyPitches.bind(audio);

        audio._bassPitches = function() {
            if (this._theme === 'glitch') {
                // Dissonant, wrong-sounding bass
                return [36.71, 38.89, 41.20, 43.65, 46.25, 43.65, 41.20, 38.89];
            }
            return this._origBassPitches2();
        };

        audio._melodyPitches = function() {
            if (this._theme === 'glitch') {
                // Atonal, corrupted melody
                return [
                    233.08, 277.18, 311.13, 369.99, 415.30, 466.16, 415.30, 369.99,
                    311.13, 277.18, 233.08, 207.65, 233.08, 311.13, 415.30, 277.18
                ];
            }
            return this._origMelodyPitches2();
        };

        const origScheduleDrums = audio._scheduleDrums.bind(audio);
        audio._scheduleDrums = function(beat) {
            if (this._theme === 'glitch' && this._active && this._ctx) {
                const t = this._ctx.currentTime;
                const b = this._beat;

                // Distorted kick with random pitch
                this._osc('sine', 60 + Math.random() * 40, t, b * 0.3, 0.6);

                // Static burst instead of snare
                if (beat % 2 === 1) {
                    this._noise(t + b * 0.5, 0.2, 0.5);
                }

                // Erratic hi-hats
                this._noise(t, 0.02 + Math.random() * 0.04, 0.15);
                if (Math.random() > 0.3) {
                    this._noise(t + b * 0.25, 0.02, 0.1);
                }
                this._noise(t + b * 0.5, 0.03, 0.18);

                // Random glitch tone
                if (Math.random() < 0.15) {
                    this._osc('sawtooth', 200 + Math.random() * 2000, t + Math.random() * b, 0.05, 0.2);
                }

                const id = setTimeout(() => this._scheduleDrums(beat + 1), b * 950);
                this._timers.push(id);
                if (beat % 16 === 0) this._pruneNodes();
                return;
            }
            origScheduleDrums(beat);
        };
    }

    /* ── GLITCH DEATH ── */
    function patchDeathParticles(game) {
        const origDie = game._die.bind(game);
        game._die = function() {
            if (this.state !== GameState.PLAYING) return;
            this.state = GameState.DEAD;
            this.audio.stop();

            // Screen shake
            document.body.style.animation = 'glitchShake 0.3s ease-in-out';
            setTimeout(() => document.body.style.animation = '', 400);

            const p = this.player;
            const colors = ['#00ff00', '#ff0000', '#00ffff', '#ff00ff', '#ffff00', '#ffffff'];
            for (let i = 0; i < 35; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 120 + Math.random() * 450;
                this.particles.push({
                    x: p.cx, y: p.cy,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd - 180,
                    life: 1, maxLife: 1,
                    size: 3 + Math.random() * 12,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }

            // Spawn extra error messages
            for (let i = 0; i < 5; i++) {
                _spawnCodeError();
            }

            const pct = Math.min(Math.round(this.worldX / this.levelDef.length * 100), 100);
            setTimeout(() => {
                if (this.state === GameState.DEAD) this._showDeath(pct);
            }, 1400);
        };
    }

    /* ── CSS FOR GLITCH MODE ── */
    function _injectCSS() {
        const style = document.createElement('style');
        style.id = 'glitch-mode-css';
        style.textContent = `
            .glitch-mode::before {
                content: '';
                position: fixed;
                inset: 0;
                z-index: 9999;
                pointer-events: none;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(0,0,0,0.15) 0px,
                    rgba(0,0,0,0) 1px,
                    rgba(0,0,0,0) 2px,
                    rgba(0,0,0,0.15) 3px
                );
                animation: staticFlicker 0.08s steps(4) infinite;
            }
            .glitch-mode::after {
                content: '';
                position: fixed;
                inset: 0;
                z-index: 9998;
                pointer-events: none;
                background: linear-gradient(transparent 50%, rgba(0,0,0,0.08) 50%);
                background-size: 100% 4px;
                animation: staticScroll 3s linear infinite;
            }
            @keyframes staticFlicker {
                0% { opacity: 0.7; }
                25% { opacity: 0.5; }
                50% { opacity: 0.8; }
                75% { opacity: 0.4; }
                100% { opacity: 0.6; }
            }
            @keyframes staticScroll {
                0% { background-position: 0 0; }
                100% { background-position: 0 200px; }
            }
            .glitch-mode { background: #000 !important; }
            .glitch-mode .overlay {
                background: rgba(0, 0, 0, 0.92) !important;
                backdrop-filter: none !important;
            }
            .glitch-mode .menu-content { gap: 10px !important; }
            .glitch-mode .panel {
                background: rgba(0, 10, 0, 0.95) !important;
                border: 2px solid #00ff00 !important;
                box-shadow: 0 0 40px rgba(0,255,0,0.3), inset 0 0 60px rgba(0,255,0,0.03) !important;
                backdrop-filter: none !important;
            }
            .glitch-mode .panel-title { font-family: 'Courier New', monospace !important; }
            .glitch-mode .panel-title.crash {
                color: #ff0000 !important;
                text-shadow: 0 0 20px #ff0000, 3px 0 #00ff00, -3px 0 #0000ff !important;
                animation: glitchText 0.15s steps(2) infinite !important;
            }
            .glitch-mode .panel-title.win {
                color: #00ff00 !important;
                text-shadow: 0 0 20px #00ff00 !important;
            }
            .glitch-mode .btn-primary {
                background: linear-gradient(135deg, #00aa00 0%, #004400 100%) !important;
                box-shadow: 0 0 20px rgba(0,255,0,0.4), inset 0 0 15px rgba(0,255,0,0.1) !important;
                font-family: 'Courier New', monospace !important;
                text-transform: uppercase !important;
                letter-spacing: 0.2em !important;
                border: 1px solid #00ff0066 !important;
            }
            .glitch-mode .btn-primary::after { display: none !important; }
            .glitch-mode .btn-ghost {
                border-color: #00ff0044 !important;
                color: #00ff00 !important;
                font-family: 'Courier New', monospace !important;
                background: rgba(0,255,0,0.03) !important;
            }
            .glitch-mode .btn-ghost:hover {
                background: rgba(0,255,0,0.1) !important;
                border-color: #00ff00 !important;
            }
            .glitch-mode .game-title {
                font-family: 'Courier New', monospace !important;
                text-shadow: 0 0 20px #00ff00, 4px 0 #ff0000, -4px 0 #0000ff !important;
                animation: glitchText 0.2s steps(3) infinite, titleGlitchColor 2s infinite !important;
            }
            .glitch-mode .game-title span { color: #00ff00 !important; }
            .glitch-mode .title-hearts {
                animation: glitchText 0.1s steps(2) infinite !important;
                color: #00ff00 !important;
            }
            .glitch-mode .level-btn {
                background: rgba(0,255,0,0.04) !important;
                border-color: rgba(0,255,0,0.25) !important;
                font-family: 'Courier New', monospace !important;
            }
            .glitch-mode .level-btn:hover,
            .glitch-mode .level-btn.active {
                background: rgba(0,255,0,0.12) !important;
                border-color: #00ff00 !important;
                box-shadow: 0 0 20px rgba(0,255,0,0.3) !important;
            }
            .glitch-mode .lvl-tag, .glitch-mode .lvl-stars { color: #00ff00 !important; }
            .glitch-mode .avatar-section {
                background: rgba(0,255,0,0.02) !important;
                border-color: rgba(0,255,0,0.12) !important;
            }
            .glitch-mode .avatar-label {
                color: #00ff00 !important;
                font-family: 'Courier New', monospace !important;
                animation: glitchText 0.5s steps(2) infinite !important;
            }
            .glitch-mode .music-section {
                background: rgba(0,255,0,0.02) !important;
                border-color: rgba(0,255,0,0.12) !important;
            }
            .glitch-mode .music-track-btn {
                background: rgba(0,255,0,0.04) !important;
                border-color: rgba(0,255,0,0.2) !important;
                color: #00ff00 !important;
                font-family: 'Courier New', monospace !important;
            }
            .glitch-mode .music-track-btn:hover {
                background: rgba(0,255,0,0.12) !important;
                border-color: #00ff00 !important;
                box-shadow: 0 0 12px rgba(0,255,0,0.3) !important;
            }
            .glitch-mode .music-track-btn.active {
                background: rgba(0,255,0,0.18) !important;
                border-color: #00ff00 !important;
                box-shadow: 0 0 18px rgba(0,255,0,0.5) !important;
            }
            .glitch-mode .hud-lvl-name {
                color: #00ff00 !important;
                text-shadow: 0 0 10px #00ff00, 2px 0 #ff0000 !important;
                font-family: 'Courier New', monospace !important;
            }
            .glitch-mode .hud-mode-badge {
                background: rgba(0,255,0,0.12) !important;
                border-color: rgba(0,255,0,0.4) !important;
                color: #00ff00 !important;
                font-family: 'Courier New', monospace !important;
            }
            .glitch-mode .progress-fill {
                background: linear-gradient(90deg, #00ff00, #00aa00) !important;
                box-shadow: 0 0 10px #00ff00 !important;
            }
            .glitch-mode .hint {
                color: rgba(0,255,0,0.35) !important;
                font-family: 'Courier New', monospace !important;
            }
            .glitch-mode body::before { display: none !important; }
            @keyframes glitchText {
                0% { transform: translate(0); clip-path: inset(0 0 0 0); }
                20% { transform: translate(-3px, 2px); clip-path: inset(20% 0 30% 0); }
                40% { transform: translate(3px, -1px); clip-path: inset(40% 0 10% 0); }
                60% { transform: translate(-2px, -2px) skewX(2deg); }
                80% { transform: translate(2px, 3px) skewX(-1deg); }
                100% { transform: translate(0); clip-path: inset(0 0 0 0); }
            }
            @keyframes titleGlitchColor {
                0%, 90%, 100% { color: #fff; }
                92% { color: #ff0000; text-shadow: -5px 0 #00ff00, 5px 0 #0000ff; }
                94% { color: #00ff00; text-shadow: 3px 0 #ff0000, -3px 0 #0000ff; }
                96% { color: #fff; }
                98% { color: #0000ff; text-shadow: -3px 0 #ff0000, 3px 0 #00ff00; }
            }
            @keyframes glitchShake {
                0%, 100% { transform: translate(0); }
                10% { transform: translate(-8px, 4px); }
                20% { transform: translate(6px, -6px); }
                30% { transform: translate(-4px, 2px); }
                40% { transform: translate(8px, -4px); }
                50% { transform: translate(-6px, 6px); }
                60% { transform: translate(4px, -2px); }
                70% { transform: translate(-2px, 4px); }
                80% { transform: translate(6px, -6px); }
                90% { transform: translate(-4px, 2px); }
            }
        `;
        document.head.appendChild(style);
    }

    /* ── REBUILD MENU ── */
    function _rebuildMenu() {
        const select = document.getElementById('levelSelect');
        if (!select) return;
        select.innerHTML = '';

        const btn = document.createElement('button');
        btn.className = 'level-btn active';
        btn.dataset.level = 0;
        btn.id = 'lvlBtn0';
        btn.innerHTML = `
            <span class="lvl-icon">▓</span>
            <span class="lvl-name">C̷O̶R̵R̸U̷P̶T̴E̶D̷</span>
            <span class="lvl-stars">☠☠☠</span>
            <span class="lvl-tag">G̶L̵I̶T̷C̵H̷ ▓</span>
        `;
        btn.addEventListener('click', () => {
            select.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.game.currentLevel = 0;
        });
        select.appendChild(btn);

        // Glitch colors
        const colorPalette = document.getElementById('colorPalette');
        if (colorPalette) {
            colorPalette.innerHTML = '';
            const glitchColors = [
                { color: '#00ff00', name: 'Matrix Green' },
                { color: '#ff0000', name: 'Error Red' },
                { color: '#00ffff', name: 'Cyan Static' },
                { color: '#ff00ff', name: 'Corrupt Magenta' },
                { color: '#ffff00', name: 'Warning Yellow' },
                { color: '#ffffff', name: 'White Noise' },
                { color: '#0080ff', name: 'BSOD Blue' },
                { color: '#ff8000', name: 'Overflow Orange' },
                { color: '#8000ff', name: 'Void Purple' },
            ];
            glitchColors.forEach((c, i) => {
                const sw = document.createElement('button');
                sw.className = 'color-swatch' + (i === 0 ? ' active' : '');
                sw.dataset.color = c.color;
                sw.style.setProperty('--c', c.color);
                sw.title = c.name;
                sw.addEventListener('click', () => {
                    colorPalette.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('active'));
                    sw.classList.add('active');
                    localStorage.setItem('gd_player_color', c.color);
                });
                colorPalette.appendChild(sw);
            });
        }

        // Hide shape palette (glitch only has one corrupted shape)
        const shapePalette = document.getElementById('shapePalette');
        if (shapePalette) {
            shapePalette.innerHTML = '';
            const sw = document.createElement('button');
            sw.className = 'shape-swatch active';
            sw.dataset.shape = 'square';
            sw.title = 'C̷O̶R̵R̸U̷P̶T̴';
            sw.textContent = '▓';
            shapePalette.appendChild(sw);
        }

        // Title
        const title = document.querySelector('.game-title');
        if (title) {
            title.innerHTML = `S̷Y̶S̵T̸E̷M̶<br><span>E̵R̴R̶O̸R̵</span><small class="title-hearts">▓▒░ ▓▒░ ▓▒░</small>`;
        }

        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = '▓ EXECUTE ▓';

        const hint = document.querySelector('.hint');
        if (hint) hint.textContent = 'SPACE / Click / Tap to jump  |  WARNING: SYSTEM UNSTABLE';

        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) retryBtn.textContent = '↺ RELOAD PROCESS';

        const deathTitle = document.querySelector('.panel-title.crash');
        if (deathTitle) deathTitle.innerHTML = 'SEGFAULT 💀';

        const victoryTitle = document.querySelector('.panel-title.win');
        if (victoryTitle) victoryTitle.innerHTML = 'PROCESS COMPLETE ✓';

        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) nextBtn.textContent = 'NEXT SECTOR ▓';

        const avatarLabels = document.querySelectorAll('.avatar-label');
        if (avatarLabels.length >= 2) {
            avatarLabels[0].textContent = '▓ PROCESS COLOR ▓';
            avatarLabels[1].textContent = '▓ PROCESS FORM ▓';
        }
    }

    /* ── ACTIVATE ── */
    function activate(game) {
        if (_active) return;
        _active = true;
        _matrixDrops = [];
        _codeErrors = [];

        _injectCSS();
        document.body.classList.add('glitch-mode');

        patchRenderer(game.renderer);
        patchAudio(game.audio);
        patchDeathParticles(game);

        game._glitchOrigLevels = LEVELS.slice();
        LEVELS.length = 0;
        LEVELS.push(GLITCH_LEVEL);

        game.player && (game.player.color = '#00ff00');
        game.player && (game.player.shape = 'square');

        localStorage.setItem('gd_player_color', '#00ff00');
        localStorage.setItem('gd_player_shape', 'square');

        _rebuildMenu();
    }

    return { activate, get active() { return _active; } };
})();
