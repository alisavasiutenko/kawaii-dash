'use strict';
/* ============================================================
   Renderer – canvas drawing with neon glow, parallax bg,
   particles, player icons, obstacles
   ============================================================ */
class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this._time = 0;
    }

    draw(game, dt) {
        this._time += dt;
        const { ctx, canvas } = this;
        const W = canvas.width, H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        const level = game.levelDef;
        const accent = level ? level.accentColor : '#ffb3d9';

        /* ── Background ── */
        this._drawBg(game, W, H, accent);

        if (game.state === GameState.PLAYING || game.state === GameState.DEAD) {
            this._drawGround(game, W, H, accent);
            this._drawObstacles(game);
            this._drawPlayer(game, accent);
            this._drawParticles(game);
        }

        /* Death / Victory overlay pulse */
        if (game.state === GameState.DEAD) {
            const isDoom = typeof DoomMode !== 'undefined' && DoomMode.active;
            const pulse = 0.08 + 0.06 * Math.sin(this._time * 8);
            ctx.fillStyle = isDoom
                ? `rgba(200,0,0,${pulse * 1.8})`
                : `rgba(180,0,120,${pulse})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    /* ── Backgrounds ── */
    _drawBg(game, W, H, accent) {
        const { ctx } = this;
        const level = game.levelDef;
        const stops = level ? level.bgStops : ['#1a0530', '#2e0d4a'];

        /* Base gradient */
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, stops[0]);
        grad.addColorStop(1, stops[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        /* Parallax grid – slower layer */
        this._drawGrid(game, W, H, accent);

        /* Floating geometric diamonds – parallax layer */
        this._drawBgShapes(game, W, H, accent);

        /* Pulsing bottom halo */
        const pulse = 0.12 + 0.06 * Math.sin(this._time * 3);
        const halo = ctx.createLinearGradient(0, H - 250, 0, H);
        halo.addColorStop(0, 'transparent');
        halo.addColorStop(1, accent + Math.round(pulse * 255).toString(16).padStart(2, '0'));
        ctx.fillStyle = halo;
        ctx.fillRect(0, H - 250, W, 250);
    }

    _drawGrid(game, W, H, accent) {
        const { ctx } = this;
        const scroll = game.worldX * 0.15;  // slow parallax
        const gridSz = 80;

        ctx.save();
        ctx.strokeStyle = accent + '12';
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

    _drawBgShapes(game, W, H, accent) {
        const { ctx } = this;
        const t = this._time;
        const scroll = game.worldX * 0.08;
        ctx.save();

        /* Floating diamond shapes at different parallax depths */
        const shapes = [
            { x: 120, y: 100, s: 30, speed: 0.03 },
            { x: 380, y: 180, s: 22, speed: 0.05 },
            { x: 600, y: 80,  s: 35, speed: 0.02 },
            { x: 850, y: 220, s: 18, speed: 0.06 },
            { x: 200, y: 300, s: 24, speed: 0.04 },
            { x: 500, y: 350, s: 28, speed: 0.035 },
            { x: 750, y: 130, s: 20, speed: 0.045 },
            { x: 950, y: 280, s: 32, speed: 0.025 },
        ];

        for (const sh of shapes) {
            const sx = ((sh.x - scroll * sh.speed * 50) % (W + 200) + W + 200) % (W + 200) - 100;
            const sy = sh.y + Math.sin(t * 0.8 + sh.x) * 12;
            const rot = t * 0.3 + sh.x;
            const pulse = 0.06 + 0.03 * Math.sin(t * 1.5 + sh.x);

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(rot);
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = accent;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -sh.s);
            ctx.lineTo(sh.s * 0.6, 0);
            ctx.lineTo(0, sh.s);
            ctx.lineTo(-sh.s * 0.6, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    /* ── Ground – GD-style checkerboard ── */
    _drawGround(game, W, H, accent) {
        const { ctx } = this;
        const gY = game.groundY;
        const T = 40;
        const scroll = game.worldX;
        const groundH = H - gY;
        const cols = Math.ceil(W / T) + 2;
        const rows = Math.ceil(groundH / T) + 1;
        const offsetX = -((scroll % T) + T) % T;
        const colStart = Math.floor(scroll / T);

        /* Checkerboard tiles */
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const tx = offsetX + c * T;
                const ty = gY + r * T;
                const worldCol = colStart + c;
                const isLight = (worldCol + r) % 2 === 0;
                ctx.fillStyle = isLight ? accent + '28' : accent + '14';
                ctx.fillRect(tx, ty, T, T);
            }
        }

        /* Bright ground line with heavy glow */
        ctx.save();
        ctx.shadowColor = accent;
        ctx.shadowBlur = 24;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, gY); ctx.lineTo(W, gY); ctx.stroke();
        /* Double-stroke for extra glow */
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, gY); ctx.lineTo(W, gY); ctx.stroke();
        ctx.restore();

        /* Ceiling line (subtle) */
        ctx.save();
        ctx.shadowColor = accent + '88';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = accent + '44';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, game.ceilingY); ctx.lineTo(W, game.ceilingY); ctx.stroke();
        ctx.restore();
    }

    /* ── Obstacles ── */
    _drawObstacles(game) {
        const { ctx } = this;
        const accent = game.levelDef ? game.levelDef.accentColor : '#00ffff';

        for (const obs of game.obstacles) {
            if (!obs.isVisible) continue;
            const { screenX: x, screenY: y, width: w, height: h, type } = obs;

            ctx.save();
            ctx.shadowBlur = 16;
            ctx.shadowColor = accent;

            switch (type) {
                case 'spike':
                    this._drawSpike(ctx, x, y, w, h, obs._ceil, '#ff9eb5');
                    break;
                case 'block':
                    this._drawBlock(ctx, x, y, w, h, accent);
                    break;
                case 'portal':
                    this._drawPortal(ctx, x, y, w, h, obs.mode, this._time);
                    break;
                case 'end':
                    this._drawEndGate(ctx, x, game.groundY, game.ceilingY, accent);
                    break;
            }
            ctx.restore();
        }
    }

    _drawSpike(ctx, x, y, w, h, ceiling, accent) {
        /* Gradient fill like the real GD spikes */
        let tipX = x + w / 2;
        let tipY = ceiling ? y + h : y;
        let baseY = ceiling ? y : y + h;
        const grad = ctx.createLinearGradient(x, baseY, tipX, tipY);
        grad.addColorStop(0, accent);
        grad.addColorStop(1, '#ffffff66');

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ceiling) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
            ctx.lineTo(tipX, y + h);
        } else {
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(tipX, y);
        }
        ctx.closePath();
        ctx.fill();

        /* Center line detail (like real GD spikes) */
        ctx.strokeStyle = '#ffffff55';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ceiling) {
            ctx.moveTo(tipX, y);
            ctx.lineTo(tipX, y + h);
        } else {
            ctx.moveTo(tipX, y + h);
            ctx.lineTo(tipX, y);
        }
        ctx.stroke();

        /* Glow outline */
        ctx.strokeStyle = '#ffffffaa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ceiling) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
            ctx.lineTo(tipX, y + h);
        } else {
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(tipX, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    _drawBlock(ctx, x, y, w, h, accent) {
        const T = 40;

        /* Per-tile gradient fill */
        for (let tx = x; tx < x + w; tx += T) {
            for (let ty = y; ty < y + h; ty += T) {
                const grad = ctx.createLinearGradient(tx, ty, tx + T, ty + T);
                grad.addColorStop(0, accent + 'cc');
                grad.addColorStop(0.5, accent + '88');
                grad.addColorStop(1, accent + '55');
                ctx.fillStyle = grad;
                ctx.fillRect(tx, ty, T, T);

                /* Inner X-cross pattern (authentic GD block detail) */
                ctx.strokeStyle = '#ffffff22';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tx, ty); ctx.lineTo(tx + T, ty + T);
                ctx.moveTo(tx + T, ty); ctx.lineTo(tx, ty + T);
                ctx.stroke();

                /* Inner border */
                ctx.strokeStyle = '#ffffff18';
                ctx.strokeRect(tx + 2, ty + 2, T - 4, T - 4);
            }
        }

        /* Bright glow outer border */
        ctx.shadowColor = accent;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;
    }

    _drawPortal(ctx, x, y, w, h, mode, t) {
        const modeColors = { cube: '#a8d8ff', ship: '#ff9ed2', ball: '#fff4a8', wave: '#aaf0d1' };
        const col = modeColors[mode] || '#ffffff';

        const pulse = 0.6 + 0.4 * Math.sin(t * 5);
        const cx = x + w / 2;
        const cy = y + h / 2;

        /* Outer spinning ring */
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.shadowColor = col;
        ctx.shadowBlur = 30 * pulse;
        ctx.globalAlpha = pulse * 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, h / 2 + 4, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();

        /* Inner rectangle frame */
        ctx.strokeStyle = col;
        ctx.lineWidth = 3 * pulse;
        ctx.shadowColor = col;
        ctx.shadowBlur = 25 * pulse;
        ctx.strokeRect(x, y, w, h);

        /* Centre gradient fill */
        const portalGrad = ctx.createLinearGradient(x, y, x, y + h);
        portalGrad.addColorStop(0, col + '22');
        portalGrad.addColorStop(0.5, col + '11');
        portalGrad.addColorStop(1, col + '22');
        ctx.fillStyle = portalGrad;
        ctx.fillRect(x, y, w, h);

        /* Label */
        ctx.shadowBlur = 0;
        ctx.fillStyle = col;
        ctx.font = 'bold 11px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(mode.toUpperCase(), cx, cy + 4);
    }

    _drawEndGate(ctx, x, groundY, ceilingY, accent) {
        const pulse = 0.7 + 0.3 * Math.sin(this._time * 4);

        /* Full glow line */
        ctx.strokeStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 35 * pulse;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x, ceilingY);
        ctx.lineTo(x, groundY);
        ctx.stroke();

        /* Dashed secondary lines */
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - 8, ceilingY);
        ctx.lineTo(x - 8, groundY);
        ctx.moveTo(x + 8, ceilingY);
        ctx.lineTo(x + 8, groundY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }

    /* ── Player ── */
    _drawPlayer(game, accent) {
        const { ctx } = this;
        const p = game.player;
        if (!p) return;

        /* Trail */
        for (const tp of p.trail) {
            ctx.save();
            ctx.globalAlpha = tp.alpha * 0.4;
            ctx.fillStyle = p.color;
            ctx.fillRect(tp.x + 4, tp.y + 4, p.size - 8, p.size - 8);
            ctx.restore();
        }

        /* Draw icon based on mode */
        ctx.save();
        ctx.translate(p.cx, p.cy);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 22;

        switch (p.mode) {
            case 'cube': this._drawCubeIcon(ctx, p); break;
            case 'ship': this._drawShipIcon(ctx, p); break;
            case 'ball': this._drawBallIcon(ctx, p); break;
            case 'wave': this._drawWaveIcon(ctx, p); break;
        }

        ctx.restore();

        /* Glow ring */
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, p.size * 0.65, 0, Math.PI * 2);
        ctx.strokeStyle = p.color + '44';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    _drawCubeIcon(ctx, p) {
        switch (p.shape) {
            case 'star':   this._drawStarShape(ctx, p); break;
            case 'heart':  this._drawHeartShape(ctx, p); break;
            case 'diamond':this._drawDiamondShape(ctx, p); break;
            case 'cat':    this._drawCatShape(ctx, p); break;
            case 'flower': this._drawFlowerShape(ctx, p); break;
            default:       this._drawSquareShape(ctx, p); break;
        }
    }

    _drawSquareShape(ctx, p) {
        const s = p.size;
        ctx.fillStyle = p.color;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        /* Inner cross */
        ctx.strokeStyle = '#00000044';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s / 2, 0); ctx.lineTo(s / 2, 0);
        ctx.moveTo(0, -s / 2); ctx.lineTo(0, s / 2);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s / 2, -s / 2, s, s);
    }

    _drawStarShape(ctx, p) {
        const r = p.size * 0.52;
        const r2 = r * 0.42;
        const pts = 5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < pts * 2; i++) {
            const angle = (i * Math.PI / pts) - Math.PI / 2;
            const rad = i % 2 === 0 ? r : r2;
            i === 0 ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
                    : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    _drawHeartShape(ctx, p) {
        const s = p.size * 0.48;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.35);
        ctx.bezierCurveTo(-s * 0.05, s * 0.1, -s * 0.7, -s * 0.1, -s * 0.5, -s * 0.5);
        ctx.bezierCurveTo(-s * 0.3, -s * 0.9, s * 0.1, -s * 0.6, 0, -s * 0.2);
        ctx.bezierCurveTo(-s * 0.1, -s * 0.6,  s * 0.3, -s * 0.9, s * 0.5, -s * 0.5);
        ctx.bezierCurveTo( s * 0.7, -s * 0.1, s * 0.05, s * 0.1, 0, s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    _drawDiamondShape(ctx, p) {
        const s = p.size * 0.52;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.65, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.65, 0);
        ctx.closePath();
        ctx.fill();
        /* shine line */
        ctx.strokeStyle = '#ffffff66';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * 0.5);
        ctx.lineTo(s * 0.1, -s * 0.1);
        ctx.strokeStyle = '#ffffffaa';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    _drawCatShape(ctx, p) {
        const s = p.size * 0.44;
        ctx.fillStyle = p.color;
        /* Body */
        ctx.beginPath();
        ctx.roundRect(-s, -s * 0.6, s * 2, s * 1.6, s * 0.35);
        ctx.fill();
        /* Left ear */
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.6);
        ctx.lineTo(-s * 0.9, -s * 1.1);
        ctx.lineTo(-s * 0.35, -s * 0.6);
        ctx.closePath();
        ctx.fill();
        /* Right ear */
        ctx.beginPath();
        ctx.moveTo(s * 0.7, -s * 0.6);
        ctx.lineTo(s * 0.9, -s * 1.1);
        ctx.lineTo(s * 0.35, -s * 0.6);
        ctx.closePath();
        ctx.fill();
        /* Face */
        ctx.fillStyle = '#ffffff99';
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.05, s * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc( s * 0.3, -s * 0.05, s * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#00000088';
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.05, s * 0.09, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc( s * 0.3, -s * 0.05, s * 0.09, 0, Math.PI * 2); ctx.fill();
    }

    _drawFlowerShape(ctx, p) {
        const r = p.size * 0.28;
        ctx.fillStyle = p.color;
        /* 6 petal circles */
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, r, 0, Math.PI * 2);
            ctx.fill();
        }
        /* Centre */
        ctx.fillStyle = '#ffffff99';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff66';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }


    _drawShipIcon(ctx, p) {
        const s = p.size;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(s * 0.5, 0);
        ctx.lineTo(-s * 0.3, -s * 0.4);
        ctx.lineTo(-s * 0.2, 0);
        ctx.lineTo(-s * 0.3, s * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        /* Exhaust */
        ctx.fillStyle = '#ffffff66';
        ctx.beginPath();
        ctx.ellipse(-s * 0.3, 0, s * 0.12, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawBallIcon(ctx, p) {
        const r = p.size / 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 2;
        ctx.stroke();
        /* Spinner line */
        ctx.strokeStyle = '#00000066';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, 0);
        ctx.lineTo(r * 0.7, 0);
        ctx.stroke();
    }

    _drawWaveIcon(ctx, p) {
        const s = p.size * 0.5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(-s, s * 0.3);
        ctx.lineTo(0, -s * 0.3);
        ctx.lineTo(s, s * 0.3);
        ctx.lineTo(s * 0.6, s * 0.8);
        ctx.lineTo(-s * 0.4, -s * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    /* ── Particles ── */
    _drawParticles(game) {
        const { ctx } = this;
        for (const p of game.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 14;
            ctx.fillStyle = p.color;
            const sz = p.size * p.life;
            ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
            ctx.restore();
        }
    }
}
