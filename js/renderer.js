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

        if (game.state === 'playing' || game.state === 'dead') {
            this._drawGround(game, W, H, accent);
            this._drawObstacles(game);
            this._drawPlayer(game, accent);
            this._drawParticles(game);
        }

        /* Death / Victory overlay pulse */
        if (game.state === 'dead') {
            ctx.fillStyle = `rgba(180,0,120,${0.08 + 0.06 * Math.sin(this._time * 8)})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    /* ── Backgrounds ── */
    _drawBg(game, W, H, accent) {
        const { ctx } = this;
        const level = game.levelDef;
        const stops = level ? level.bgStops : ['#1a0530', '#2e0d4a'];

        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, stops[0]);
        grad.addColorStop(1, stops[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        /* Parallax star-grid */
        this._drawGrid(game, W, H, accent);

        /* Subtle pulsing halo at bottom */
        const pulse = 0.12 + 0.05 * Math.sin(this._time * 3);
        const halo = ctx.createLinearGradient(0, H - 200, 0, H);
        halo.addColorStop(0, 'transparent');
        halo.addColorStop(1, accent + Math.round(pulse * 255).toString(16).padStart(2, '0'));
        ctx.fillStyle = halo;
        ctx.fillRect(0, H - 200, W, 200);
    }

    _drawGrid(game, W, H, accent) {
        const { ctx } = this;
        const scroll = game.worldX * 0.3;
        const gridSz = 80;

        ctx.save();
        ctx.strokeStyle = accent + '18';
        ctx.lineWidth = 1;

        // Vertical lines
        const startX = (-scroll % gridSz + gridSz) % gridSz;
        for (let x = startX - gridSz; x < W + gridSz; x += gridSz) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        // Horizontal lines
        for (let y = 0; y < H; y += gridSz) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.restore();
    }

    /* ── Ground ── */
    _drawGround(game, W, H, accent) {
        const { ctx } = this;
        const gY = game.groundY;

        /* Ground line glow */
        ctx.save();
        ctx.shadowColor = accent;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, gY); ctx.lineTo(W, gY); ctx.stroke();

        /* Ground fill */
        const gGrad = ctx.createLinearGradient(0, gY, 0, H);
        gGrad.addColorStop(0, accent + '33');
        gGrad.addColorStop(1, accent + '08');
        ctx.fillStyle = gGrad;
        ctx.fillRect(0, gY, W, H - gY);
        ctx.restore();

        /* Ceiling line */
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
        ctx.fillStyle = accent;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
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
    }

    _drawBlock(ctx, x, y, w, h, accent) {
        /* Fill */
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, accent + 'cc');
        grad.addColorStop(1, accent + '55');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        /* Inner detail lines */
        ctx.strokeStyle = '#ffffff33';
        ctx.lineWidth = 1;
        for (let tx = x; tx < x + w; tx += TILE) {
            ctx.strokeRect(tx, y, TILE, h);
        }

        /* Glow border */
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
    }

    _drawPortal(ctx, x, y, w, h, mode, t) {
        const modeColors = { cube: '#a8d8ff', ship: '#ff9ed2', ball: '#fff4a8', wave: '#aaf0d1' };
        const modeIcons = { cube: '⬛', ship: '✈', ball: '⚫', wave: '〰' };
        const col = modeColors[mode] || '#ffffff';

        /* Pulsing portal frame */
        const pulse = 0.6 + 0.4 * Math.sin(t * 5);
        ctx.strokeStyle = col;
        ctx.lineWidth = 3 * pulse;
        ctx.shadowColor = col;
        ctx.shadowBlur = 30 * pulse;
        ctx.strokeRect(x, y, w, h);

        /* Label */
        ctx.fillStyle = col + 'cc';
        ctx.font = 'bold 11px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(mode.toUpperCase(), x + w / 2, y + h / 2 + 4);
    }

    _drawEndGate(ctx, x, groundY, ceilingY, accent) {
        ctx.strokeStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 25;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, ceilingY);
        ctx.lineTo(x, groundY);
        ctx.stroke();
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
