'use strict';
/* ============================================================
   DOOM MODE – Easter egg that reskins the entire game
   into a hellish DOOM-inspired nightmare version.
   Activated by entering "doom" at the password gate.
   ============================================================ */

const DoomMode = (() => {
    let _active = false;

    /* ── DOOM LEVELS ── */
    const DOOM_LEVELS = [
        {
            name: '💀 KNEE-DEEP IN THE DEAD',
            bpm: 140,
            speed: 260,
            theme: 'doom',
            length: 5500,
            bgStops: ['#0a0000', '#1a0500'],
            accentColor: '#ff2200',
            obstacles: [
                spike(700), spike(900),
                block(1200, 2), spike(1500), spike(1700),
                block(2000, 1), spike(2200), spike(2400), spike(2600),
                portal(3000, 'ship'),
                ceilingBlock(3300, 2), block(3600, 2),
                ceilingBlock(3900, 1), block(4100, 2),
                portal(4400, 'cube'),
                spike(4600), spike(4800), spike(5000),
                end(5300),
            ]
        },
        {
            name: '🔥 THE SHORES OF HELL',
            bpm: 145,
            speed: 270,
            theme: 'doom',
            length: 6000,
            bgStops: ['#100000', '#200800'],
            accentColor: '#ff4400',
            obstacles: [
                spike(600), spike(800), spike(1000),
                block(1300, 2), block(1500, 3),
                spike(1800), spike(2000),
                portal(2300, 'ball'),
                spike(2600), ceilingSpike(2800),
                spike(3000), ceilingSpike(3200),
                spike(3400),
                portal(3700, 'cube'),
                block(4000, 1), spike(4200), spike(4400),
                block(4700, 2), spike(5000),
                spike(5300), spike(5600),
                end(5800),
            ]
        },
        {
            name: '👹 INFERNO',
            bpm: 150,
            speed: 280,
            theme: 'doom',
            length: 6500,
            bgStops: ['#150000', '#2a0a00'],
            accentColor: '#ff6600',
            obstacles: [
                spike(500), spike(700), block(900, 2),
                spike(1100), spike(1300), spike(1500),
                portal(1800, 'wave'),
                ceilingSpike(2000), spike(2200),
                ceilingSpike(2400), spike(2600),
                ceilingSpike(2800), spike(3000),
                portal(3300, 'ship'),
                ceilingBlock(3500, 2), block(3700, 2),
                ceilingBlock(3900, 2), block(4100, 1),
                ceilingBlock(4300, 1),
                portal(4600, 'cube'),
                spike(4800), spike(5000), spike(5200),
                block(5400, 3), spike(5700),
                spike(5900), spike(6100),
                end(6300),
            ]
        },
        {
            name: '☠️ THY FLESH CONSUMED',
            bpm: 155,
            speed: 290,
            theme: 'doom',
            length: 7200,
            bgStops: ['#0d0000', '#1f0400'],
            accentColor: '#ff3300',
            obstacles: [
                spike(400), spike(600), spike(800), spike(1000),
                block(1200, 2), block(1400, 3),
                spike(1600), spike(1800),
                portal(2100, 'wave'),
                ceilingSpike(2300), spike(2500),
                ceilingSpike(2700), spike(2900),
                portal(3100, 'ball'),
                spike(3300), ceilingSpike(3500),
                spike(3700), ceilingSpike(3900),
                spike(4100),
                portal(4300, 'ship'),
                ceilingBlock(4500, 2), block(4700, 2),
                ceilingBlock(4900, 1), block(5100, 3),
                portal(5400, 'cube'),
                spike(5600), spike(5800), spike(6000),
                block(6200, 2), spike(6400),
                spike(6600), spike(6800),
                end(7000),
            ]
        },
    ];

    /* ── DOOM RENDERER OVERRIDES ── */
    function patchRenderer(renderer) {
        const orig = {};
        orig.drawBg = renderer._drawBg.bind(renderer);
        orig.drawGround = renderer._drawGround.bind(renderer);
        orig.drawSpike = renderer._drawSpike.bind(renderer);
        orig.drawBlock = renderer._drawBlock.bind(renderer);
        orig.drawPortal = renderer._drawPortal.bind(renderer);
        orig.drawEndGate = renderer._drawEndGate.bind(renderer);
        orig.drawPlayer = renderer._drawPlayer.bind(renderer);
        orig.drawGrid = renderer._drawGrid.bind(renderer);
        orig.drawCubeIcon = renderer._drawCubeIcon.bind(renderer);
        orig.drawParticles = renderer._drawParticles.bind(renderer);

        renderer._drawBg = function(game, W, H, accent) {
            const { ctx } = this;
            const level = game.levelDef;
            const stops = level ? level.bgStops : ['#0a0000', '#1a0500'];

            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, stops[0]);
            grad.addColorStop(1, stops[1]);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            _drawDoomGrid(ctx, game, W, H, accent);

            const pulse = 0.15 + 0.1 * Math.sin(this._time * 4);
            const halo = ctx.createLinearGradient(0, H - 250, 0, H);
            halo.addColorStop(0, 'transparent');
            halo.addColorStop(0.5, `rgba(255, 30, 0, ${pulse * 0.3})`);
            halo.addColorStop(1, `rgba(255, 60, 0, ${pulse})`);
            ctx.fillStyle = halo;
            ctx.fillRect(0, H - 250, W, 250);

            _drawLavaParticles(ctx, this._time, W, H);
        };

        renderer._drawGrid = function() {};

        renderer._drawGround = function(game, W, H, accent) {
            const { ctx } = this;
            const gY = game.groundY;

            ctx.save();
            ctx.shadowColor = '#ff3300';
            ctx.shadowBlur = 25;
            ctx.strokeStyle = '#ff4400';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, gY); ctx.lineTo(W, gY); ctx.stroke();

            const gGrad = ctx.createLinearGradient(0, gY, 0, H);
            gGrad.addColorStop(0, 'rgba(255,40,0,0.35)');
            gGrad.addColorStop(0.5, 'rgba(180,20,0,0.2)');
            gGrad.addColorStop(1, 'rgba(60,0,0,0.4)');
            ctx.fillStyle = gGrad;
            ctx.fillRect(0, gY, W, H - gY);

            _drawLavaWaves(ctx, this._time, gY, W, H);
            ctx.restore();

            ctx.save();
            ctx.shadowColor = 'rgba(255,0,0,0.5)';
            ctx.shadowBlur = 12;
            ctx.strokeStyle = 'rgba(255,60,0,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, game.ceilingY); ctx.lineTo(W, game.ceilingY); ctx.stroke();
            ctx.restore();
        };

        renderer._drawSpike = function(ctx, x, y, w, h, ceiling, _accent) {
            const spikeGrad = ctx.createLinearGradient(x, y, x + w / 2, ceiling ? y + h : y);
            spikeGrad.addColorStop(0, '#cc0000');
            spikeGrad.addColorStop(1, '#ff4400');
            ctx.fillStyle = spikeGrad;
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#ff2200';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            if (ceiling) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + w, y);
                ctx.lineTo(x + w / 2, y + h);
            } else {
                ctx.moveTo(x, y + h);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x + w / 2, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ff880044';
            ctx.beginPath();
            if (ceiling) {
                ctx.moveTo(x + w * 0.3, y);
                ctx.lineTo(x + w * 0.5, y + h * 0.6);
                ctx.lineTo(x + w * 0.45, y);
            } else {
                ctx.moveTo(x + w * 0.3, y + h);
                ctx.lineTo(x + w * 0.5, y + h * 0.4);
                ctx.lineTo(x + w * 0.45, y + h);
            }
            ctx.closePath();
            ctx.fill();
        };

        renderer._drawBlock = function(ctx, x, y, w, h, _accent) {
            const brickW = TILE;
            const brickH = TILE / 2;

            const grad = ctx.createLinearGradient(x, y, x + w, y + h);
            grad.addColorStop(0, '#552200');
            grad.addColorStop(0.5, '#663311');
            grad.addColorStop(1, '#442200');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, w, h);

            ctx.strokeStyle = '#33110088';
            ctx.lineWidth = 1;
            let row = 0;
            for (let by = y; by < y + h; by += brickH) {
                const off = (row % 2) * (brickW / 2);
                for (let bx = x - off; bx < x + w; bx += brickW) {
                    const drawX = Math.max(bx, x);
                    const drawW = Math.min(bx + brickW, x + w) - drawX;
                    const drawH = Math.min(brickH, y + h - by);
                    if (drawW > 0 && drawH > 0) {
                        ctx.strokeRect(drawX, by, drawW, drawH);
                    }
                }
                row++;
            }

            ctx.strokeStyle = '#ff440066';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ff2200';
            ctx.shadowBlur = 8;
            ctx.strokeRect(x, y, w, h);
        };

        renderer._drawPortal = function(ctx, x, y, w, h, mode, t) {
            const modeColors = { cube: '#ff4400', ship: '#ff0044', ball: '#ffaa00', wave: '#ff6600' };
            const col = modeColors[mode] || '#ff2200';
            const pulse = 0.5 + 0.5 * Math.sin(t * 7);

            ctx.save();
            ctx.shadowColor = col;
            ctx.shadowBlur = 35 * pulse;

            ctx.strokeStyle = col;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w, y + h * 0.3);
            ctx.lineTo(x + w, y + h * 0.7);
            ctx.lineTo(x + w / 2, y + h);
            ctx.lineTo(x, y + h * 0.7);
            ctx.lineTo(x, y + h * 0.3);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = col + '22';
            ctx.fill();

            ctx.fillStyle = col;
            ctx.font = 'bold 10px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(mode.toUpperCase(), x + w / 2, y + h / 2 + 4);
            ctx.restore();
        };

        renderer._drawEndGate = function(ctx, x, groundY, ceilingY, _accent) {
            ctx.save();
            ctx.strokeStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 40;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x, ceilingY);
            ctx.lineTo(x, groundY);
            ctx.stroke();

            const pentSize = 20;
            const cy = (ceilingY + groundY) / 2;
            ctx.fillStyle = '#ff000088';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
                const px = x + Math.cos(a) * pentSize;
                const py = cy + Math.sin(a) * pentSize;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ff440088';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        };

        renderer._drawCubeIcon = function(ctx, p) {
            switch (p.shape) {
                case 'doomguy':   _drawDoomguyShape(ctx, p); break;
                case 'cacodemon': _drawCacodemonShape(ctx, p); break;
                case 'skull':     _drawSkullShape(ctx, p); break;
                case 'pentagram': _drawPentagramShape(ctx, p); break;
                case 'imp':       _drawImpShape(ctx, p); break;
                case 'bfg':       _drawBFGShape(ctx, p); break;
                default:          _drawDoomguyShape(ctx, p); break;
            }
        };

        renderer._drawPlayer = function(game, accent) {
            const { ctx } = this;
            const p = game.player;
            if (!p) return;

            for (const tp of p.trail) {
                ctx.save();
                ctx.globalAlpha = tp.alpha * 0.5;
                ctx.fillStyle = '#ff220088';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 8;
                ctx.fillRect(tp.x + 4, tp.y + 4, p.size - 8, p.size - 8);
                ctx.restore();
            }

            ctx.save();
            ctx.translate(p.cx, p.cy);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 28;

            switch (p.mode) {
                case 'cube': this._drawCubeIcon(ctx, p); break;
                case 'ship': _drawDoomShip(ctx, p); break;
                case 'ball': _drawDoomBall(ctx, p); break;
                case 'wave': _drawDoomWave(ctx, p); break;
            }
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.cx, p.cy, p.size * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff220033';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.restore();
        };

        renderer._drawParticles = function(game) {
            const { ctx } = this;
            for (const p of game.particles) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.shadowColor = '#ff2200';
                ctx.shadowBlur = 10;
                ctx.fillStyle = p.color;
                const sz = p.size * p.life;
                ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
                ctx.restore();
            }
        };

        renderer._originals = orig;
    }

    /* ── DOOM-SPECIFIC DRAW HELPERS ── */

    function _drawDoomGrid(ctx, game, W, H, accent) {
        const scroll = game.worldX * 0.2;
        const gridSz = 80;

        ctx.save();
        ctx.strokeStyle = '#ff110008';
        ctx.lineWidth = 1;

        const startX = (-scroll % gridSz + gridSz) % gridSz;
        for (let x = startX - gridSz; x < W + gridSz; x += gridSz) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += gridSz) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.restore();
    }

    let _lavaParticles = [];
    function _drawLavaParticles(ctx, time, W, H) {
        if (_lavaParticles.length < 30) {
            _lavaParticles.push({
                x: Math.random() * W,
                y: H - Math.random() * 60,
                size: 2 + Math.random() * 4,
                speed: 20 + Math.random() * 60,
                phase: Math.random() * Math.PI * 2
            });
        }

        ctx.save();
        for (const p of _lavaParticles) {
            p.y -= p.speed * 0.016;
            p.x += Math.sin(time * 3 + p.phase) * 0.5;
            if (p.y < H - 280) {
                p.y = H - Math.random() * 30;
                p.x = Math.random() * W;
            }
            const alpha = Math.max(0, 1 - (H - p.y) / 260);
            ctx.globalAlpha = alpha * 0.6;
            ctx.fillStyle = Math.random() > 0.5 ? '#ff4400' : '#ff8800';
            ctx.shadowColor = '#ff2200';
            ctx.shadowBlur = 6;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.restore();
    }

    function _drawLavaWaves(ctx, time, gY, W, H) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ff220044';

        ctx.beginPath();
        ctx.moveTo(0, gY + 5);
        for (let x = 0; x <= W; x += 10) {
            const y = gY + 3 + Math.sin(x * 0.02 + time * 3) * 3 + Math.sin(x * 0.05 + time * 5) * 2;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /* ── DOOM PLAYER SHAPES ── */

    function _drawDoomguyShape(ctx, p) {
        const s = p.size;
        const grad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
        grad.addColorStop(0, '#556633');
        grad.addColorStop(1, '#334411');
        ctx.fillStyle = grad;
        ctx.fillRect(-s / 2, -s / 2, s, s);

        ctx.fillStyle = '#ddb88c';
        ctx.fillRect(-s * 0.3, -s * 0.25, s * 0.6, s * 0.35);

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-s * 0.3, -s * 0.42, s * 0.6, s * 0.18);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-s * 0.2, -s * 0.2, s * 0.15, s * 0.12);
        ctx.fillRect(s * 0.05, -s * 0.2, s * 0.15, s * 0.12);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-s * 0.15, -s * 0.18, s * 0.07, s * 0.08);
        ctx.fillRect(s * 0.08, -s * 0.18, s * 0.07, s * 0.08);

        ctx.fillStyle = '#553333';
        ctx.fillRect(-s * 0.1, -s * 0.02, s * 0.2, s * 0.06);

        ctx.strokeStyle = '#ff440044';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s / 2, -s / 2, s, s);
    }

    function _drawCacodemonShape(ctx, p) {
        const r = p.size * 0.48;

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, '#cc3333');
        grad.addColorStop(0.7, '#aa1111');
        grad.addColorStop(1, '#660000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.15, -r * 0.2, r * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00cc00';
        ctx.beginPath();
        ctx.arc(-r * 0.1, -r * 0.2, r * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-r * 0.08, -r * 0.2, r * 0.07, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#880000';
        ctx.beginPath();
        ctx.arc(0, r * 0.25, r * 0.25, 0, Math.PI);
        ctx.fill();

        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI + 0.1;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r * 0.15, r * 0.25 + Math.sin(a) * r * 0.02);
            ctx.lineTo(Math.cos(a) * r * 0.15 - 2, r * 0.25 - 4);
            ctx.lineTo(Math.cos(a) * r * 0.15 + 2, r * 0.25 - 4);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = '#ff660088';
        ctx.beginPath();
        ctx.moveTo(r * 0.3, -r * 0.7);
        ctx.lineTo(r * 0.5, -r * 1.0);
        ctx.lineTo(r * 0.15, -r * 0.5);
        ctx.closePath();
        ctx.fill();
    }

    function _drawSkullShape(ctx, p) {
        const s = p.size * 0.45;

        ctx.fillStyle = '#ddccbb';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.1, s * 0.8, s * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ddccbb';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.5, s * 0.5, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(-s * 0.28, -s * 0.15, s * 0.2, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.28, -s * 0.15, s * 0.2, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff000066';
        ctx.beginPath();
        ctx.ellipse(-s * 0.28, -s * 0.15, s * 0.1, s * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.28, -s * 0.15, s * 0.1, s * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(-s * 0.08, s * 0.15);
        ctx.lineTo(0, s * 0.3);
        ctx.lineTo(s * 0.08, s * 0.15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#111';
        ctx.fillRect(-s * 0.35, s * 0.4, s * 0.7, s * 0.15);
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = '#ddccbb';
            ctx.fillRect(-s * 0.3 + i * s * 0.14, s * 0.4, s * 0.02, s * 0.15);
        }

        ctx.strokeStyle = '#33221166';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function _drawPentagramShape(ctx, p) {
        const r = p.size * 0.48;

        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#ff000022';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff000088';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function _drawImpShape(ctx, p) {
        const s = p.size * 0.45;

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        grad.addColorStop(0, '#aa6633');
        grad.addColorStop(1, '#664422');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.roundRect(-s * 0.8, -s * 0.5, s * 1.6, s * 1.4, s * 0.2);
        ctx.fill();

        ctx.fillStyle = '#553311';
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, -s * 0.5);
        ctx.lineTo(-s * 0.8, -s * 1.0);
        ctx.lineTo(-s * 0.3, -s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.6, -s * 0.5);
        ctx.lineTo(s * 0.8, -s * 1.0);
        ctx.lineTo(s * 0.3, -s * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff4400';
        ctx.beginPath(); ctx.arc(-s * 0.25, -s * 0.1, s * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.25, -s * 0.1, s * 0.15, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath(); ctx.arc(-s * 0.25, -s * 0.1, s * 0.06, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.25, -s * 0.1, s * 0.06, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#331100';
        ctx.beginPath();
        ctx.arc(0, s * 0.3, s * 0.2, 0, Math.PI);
        ctx.fill();
    }

    function _drawBFGShape(ctx, p) {
        const s = p.size * 0.45;

        ctx.fillStyle = '#334433';
        ctx.fillRect(-s * 0.9, -s * 0.3, s * 1.8, s * 0.6);

        ctx.fillStyle = '#445544';
        ctx.fillRect(-s * 0.5, -s * 0.5, s * 1.0, s * 1.0);

        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.35);
        glow.addColorStop(0, '#00ff00');
        glow.addColorStop(0.5, '#00cc0088');
        glow.addColorStop(1, '#00880022');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#222';
        ctx.fillRect(s * 0.5, -s * 0.12, s * 0.45, s * 0.24);
    }

    /* ── DOOM MODE ICONS FOR SHIP / BALL / WAVE ── */

    function _drawDoomShip(ctx, p) {
        const s = p.size;
        ctx.fillStyle = '#556633';
        ctx.beginPath();
        ctx.moveTo(s * 0.5, 0);
        ctx.lineTo(-s * 0.35, -s * 0.35);
        ctx.lineTo(-s * 0.45, -s * 0.15);
        ctx.lineTo(-s * 0.45, s * 0.15);
        ctx.lineTo(-s * 0.35, s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff440066';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ff4400';
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(-s * 0.45, 0, s * 0.15, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function _drawDoomBall(ctx, p) {
        const r = p.size / 2;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, '#ff4400');
        grad.addColorStop(0.6, '#cc2200');
        grad.addColorStop(1, '#880000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ff660044';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }

    function _drawDoomWave(ctx, p) {
        const s = p.size * 0.5;
        ctx.fillStyle = '#ff2200';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(-s * 0.5, -s * 0.8);
        ctx.lineTo(0, -s * 0.3);
        ctx.lineTo(s * 0.5, -s * 0.8);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.5, s * 0.4);
        ctx.lineTo(0, s * 0.1);
        ctx.lineTo(-s * 0.5, s * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff660066';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    /* ── DOOM AUDIO PATCH ── */
    function patchAudio(audio) {
        audio._origBassPitches = audio._bassPitches.bind(audio);
        audio._origMelodyPitches = audio._melodyPitches.bind(audio);

        audio._bassPitches = function() {
            if (this._theme === 'doom') {
                return [41.20, 46.25, 48.99, 55.00, 61.74, 55.00, 48.99, 41.20];
            }
            return this._origBassPitches();
        };

        audio._melodyPitches = function() {
            if (this._theme === 'doom') {
                return [
                    329.63, 349.23, 392.00, 349.23, 329.63, 293.66, 329.63, 349.23,
                    392.00, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63, 293.66
                ];
            }
            return this._origMelodyPitches();
        };

        audio._origScheduleDrums = audio._scheduleDrums.bind(audio);
        audio._scheduleDrums = function(beat) {
            if (this._theme === 'doom' && this._active && this._ctx) {
                const t = this._ctx.currentTime;
                const b = this._beat;

                this._osc('sine', 80, t, b * 0.5, 1.0);
                const ko = this._ctx.createOscillator();
                const kg = this._ctx.createGain();
                ko.connect(kg); kg.connect(this._master);
                ko.frequency.setValueAtTime(100, t);
                ko.frequency.exponentialRampToValueAtTime(25, t + 0.35);
                kg.gain.setValueAtTime(1.0, t);
                kg.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                ko.start(t); ko.stop(t + 0.41);
                this._nodes.push(ko, kg);

                if (beat % 2 === 1) {
                    this._noise(t + b * 0.5, 0.15, 0.55);
                    this._osc('triangle', 180, t + b * 0.5, 0.12, 0.4);
                }

                this._noise(t, 0.03, 0.22);
                this._noise(t + b * 0.25, 0.03, 0.15);
                this._noise(t + b * 0.5, 0.03, 0.22);
                this._noise(t + b * 0.75, 0.03, 0.15);

                const id = setTimeout(() => this._scheduleDrums(beat + 1), b * 950);
                this._timers.push(id);
                if (beat % 16 === 0) this._pruneNodes();
                return;
            }
            this._origScheduleDrums(beat);
        };
    }

    /* ── DOOM DEATH PARTICLES ── */
    function patchDeathParticles(game) {
        game._die = function() {
            if (this.state !== GameState.PLAYING) return;
            this.state = GameState.DEAD;
            this.audio.stop();

            document.body.classList.add('doom-shake');
            setTimeout(() => document.body.classList.remove('doom-shake'), 400);

            const p = this.player;
            const colors = ['#ff2200', '#ff4400', '#ff6600', '#ff0000', '#880000', '#ffaa00', '#ff0044'];
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 150 + Math.random() * 500;
                this.particles.push({
                    x: p.cx, y: p.cy,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd - 200,
                    life: 1, maxLife: 1,
                    size: 5 + Math.random() * 14,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }

            const pct = Math.min(Math.round(this.worldX / this.levelDef.length * 100), 100);
            setTimeout(() => {
                if (this.state === GameState.DEAD) this._showDeath(pct);
            }, 1400);
        };
    }

    /* ── ACTIVATE / DEACTIVATE ── */
    function activate(game) {
        if (_active) return;
        _active = true;
        _lavaParticles = [];

        document.body.classList.add('doom-mode');

        patchRenderer(game.renderer);
        patchAudio(game.audio);
        patchDeathParticles(game);

        game._doomOrigLevels = LEVELS.slice();
        LEVELS.length = 0;
        DOOM_LEVELS.forEach(l => LEVELS.push(l));

        game.player && (game.player.color = '#556633');
        game.player && (game.player.shape = 'doomguy');

        localStorage.setItem('gd_player_color', '#556633');
        localStorage.setItem('gd_player_shape', 'doomguy');

        const origReset = game._resetLevel.bind(game);
        game._resetLevel = function() {
            origReset();
            const doomShapes = ['doomguy', 'cacodemon', 'skull', 'pentagram', 'imp', 'bfg'];
            const savedShape = localStorage.getItem('gd_player_shape');
            if (this.player && savedShape && doomShapes.includes(savedShape)) {
                this.player.shape = savedShape;
            } else if (this.player) {
                this.player.shape = 'doomguy';
            }
        };

        _rebuildMenu();
    }

    function _rebuildMenu() {
        const select = document.getElementById('levelSelect');
        if (!select) return;
        select.innerHTML = '';

        const doomNames = [
            { icon: '💀', name: 'Knee-Deep in the Dead', stars: '★★☆', tag: 'Hard 🔥' },
            { icon: '🔥', name: 'The Shores of Hell', stars: '★★☆', tag: 'Hard 🔥' },
            { icon: '👹', name: 'Inferno', stars: '★★★', tag: 'Brutal 💀' },
            { icon: '☠️', name: 'Thy Flesh Consumed', stars: '★★★', tag: 'Nightmare ☠️' },
        ];

        doomNames.forEach((lv, i) => {
            const btn = document.createElement('button');
            btn.className = 'level-btn' + (i === 0 ? ' active' : '');
            btn.dataset.level = i;
            btn.id = `lvlBtn${i}`;
            btn.innerHTML = `
                <span class="lvl-icon">${lv.icon}</span>
                <span class="lvl-name">${lv.name}</span>
                <span class="lvl-stars">${lv.stars}</span>
                <span class="lvl-tag">${lv.tag}</span>
            `;
            btn.addEventListener('click', () => {
                select.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.game.currentLevel = i;
            });
            select.appendChild(btn);
        });

        const colorPalette = document.getElementById('colorPalette');
        if (colorPalette) {
            colorPalette.innerHTML = '';
            const doomColors = [
                { color: '#556633', name: 'Marine Green' },
                { color: '#cc3333', name: 'Demon Red' },
                { color: '#ff4400', name: 'Hell Fire' },
                { color: '#ffaa00', name: 'Plasma Gold' },
                { color: '#00cc00', name: 'Toxic Green' },
                { color: '#8844aa', name: 'Soul Purple' },
                { color: '#ddccbb', name: 'Bone White' },
                { color: '#444444', name: 'Steel Gray' },
                { color: '#ff0044', name: 'Blood Red' },
            ];
            doomColors.forEach((c, i) => {
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

        const shapePalette = document.getElementById('shapePalette');
        if (shapePalette) {
            shapePalette.innerHTML = '';
            const doomShapes = [
                { shape: 'doomguy', icon: '🪖', name: 'Doomguy' },
                { shape: 'cacodemon', icon: '👹', name: 'Cacodemon' },
                { shape: 'skull', icon: '💀', name: 'Lost Soul' },
                { shape: 'pentagram', icon: '⛧', name: 'Pentagram' },
                { shape: 'imp', icon: '👿', name: 'Imp' },
                { shape: 'bfg', icon: '🔫', name: 'BFG 9000' },
            ];
            doomShapes.forEach((s, i) => {
                const sw = document.createElement('button');
                sw.className = 'shape-swatch' + (i === 0 ? ' active' : '');
                sw.dataset.shape = s.shape;
                sw.title = s.name;
                sw.textContent = s.icon;
                sw.addEventListener('click', () => {
                    shapePalette.querySelectorAll('.shape-swatch').forEach(x => x.classList.remove('active'));
                    sw.classList.add('active');
                    localStorage.setItem('gd_player_shape', s.shape);
                });
                shapePalette.appendChild(sw);
            });
        }

        const title = document.querySelector('.game-title');
        if (title) {
            title.innerHTML = `Geometry<br><span>DOOM</span><small class="title-hearts">🔥 ☠️ 🔥</small>`;
        }

        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = '☠️ RIP AND TEAR ☠️';

        const hint = document.querySelector('.hint');
        if (hint) hint.textContent = 'SPACE / Click / Tap to jump  |  Hold for Ship / Wave modes  |  RIP AND TEAR';

        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) retryBtn.textContent = '☠️ Try Again, Mortal';

        const deathTitle = document.querySelector('.panel-title.crash');
        if (deathTitle) deathTitle.innerHTML = 'YOU DIED 💀';

        const victoryTitle = document.querySelector('.panel-title.win');
        if (victoryTitle) victoryTitle.innerHTML = 'HELL CONQUERED 🔥';

        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) nextBtn.textContent = 'Next Circle of Hell 🔥';

        const avatarLabels = document.querySelectorAll('.avatar-label');
        if (avatarLabels.length >= 2) {
            avatarLabels[0].textContent = '🔥 WARRIOR COLOR 🔥';
            avatarLabels[1].textContent = '🔥 WARRIOR FORM 🔥';
        }
    }

    return { activate, get active() { return _active; } };
})();
