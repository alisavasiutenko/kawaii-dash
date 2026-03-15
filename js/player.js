'use strict';
/* ============================================================
   Player – physics, game modes, hitbox
   ============================================================ */

class Player {
    constructor(screenX, groundY) {
        /* Position (top-left of bounding box) */
        this.x = screenX - TILE / 2;
        this.y = groundY - TILE;
        this.size = TILE;
        this.vy = 0;

        /* State */
        this.onGround = true;
        this.gravDir = 1;   // +1 = down, -1 = up
        this.mode = 'cube';
        this.rotation = 0;

        /* Visuals */
        this.color = '#ff9ed2';
        this.shape = 'square'; // cube icon style
        this.trail = [];        // { x, y, alpha }
    }

    /* ── Mode change (called by portal collision) ── */
    setMode(mode) {
        if (this.mode === mode) return;
        this.mode = mode;
        this.gravDir = 1;
        this.vy = 0;
        // Preserve the user's chosen avatar colour; don't overwrite it.
    }

    /* ── Called on press (tap / spacebar) ── */
    onPress() {
        switch (this.mode) {
            case 'cube':
                if (this.onGround) { this.vy = JUMP_VEL; this.onGround = false; }
                break;
            case 'ball':
                this.gravDir *= -1;
                this.vy *= 0.2;
                break;
            // ship / wave are hold-based (handled in update via heldDown)
        }
    }

    /* ── Main update ── */
    update(dt, groundY, ceilingY, heldDown) {
        /* Trail */
        this.trail.unshift({ x: this.x, y: this.y, alpha: 0.9 });
        if (this.trail.length > 14) this.trail.pop();
        this.trail.forEach((p, i) => { p.alpha = 0.9 * (1 - i / 14); });

        switch (this.mode) {
            case 'cube': this._cube(dt, groundY, ceilingY); break;
            case 'ship': this._ship(dt, groundY, ceilingY, heldDown); break;
            case 'ball': this._ball(dt, groundY, ceilingY); break;
            case 'wave': this._wave(dt, groundY, ceilingY, heldDown); break;
        }
    }

    /* ── CUBE ── */
    _cube(dt, groundY, ceilingY) {
        this.vy += GRAVITY * this.gravDir * dt;
        this.y += this.vy * dt;

        if (!this.onGround) this.rotation += 270 * dt * Math.sign(this.vy || 1);

        const floor = groundY - this.size;
        const ceil = ceilingY;

        if (this.gravDir === 1 && this.y >= floor) {
            this.y = floor; this.vy = 0; this.onGround = true;
            this.rotation = Math.round(this.rotation / 90) * 90;
        } else if (this.gravDir === -1 && this.y <= ceil) {
            this.y = ceil; this.vy = 0; this.onGround = true;
            this.rotation = Math.round(this.rotation / 90) * 90;
        } else {
            this.onGround = false;
        }

        /* Don't fall through ceiling in normal gravity */
        if (this.gravDir === 1 && this.y < ceil - this.size) {
            /* allow – player jumped high */
        }
    }

    /* ── SHIP ── */
    _ship(dt, groundY, ceilingY, held) {
        const thrust = -1100;
        const grav = GRAVITY * 0.45;

        if (held) this.vy += thrust * dt;
        this.vy += grav * dt;
        this.vy = Math.max(-520, Math.min(520, this.vy));
        this.y += this.vy * dt;

        this.rotation = Math.max(-30, Math.min(30, this.vy * 0.055));

        if (this.y >= groundY - this.size) { this.y = groundY - this.size; this.vy = 0; }
        if (this.y <= ceilingY) { this.y = ceilingY; this.vy = 0; }
    }

    /* ── BALL ── */
    _ball(dt, groundY, ceilingY) {
        this.vy += GRAVITY * this.gravDir * dt;
        this.vy = Math.max(-650, Math.min(650, this.vy));
        this.y += this.vy * dt;
        this.rotation += 360 * dt * 1.5;

        const floor = groundY - this.size;
        const ceil = ceilingY;

        if (this.gravDir === 1 && this.y >= floor) {
            this.y = floor; this.vy = 0; this.onGround = true;
        } else if (this.gravDir === -1 && this.y <= ceil) {
            this.y = ceil; this.vy = 0; this.onGround = true;
        } else {
            this.onGround = false;
        }
    }

    /* ── WAVE ── */
    _wave(dt, groundY, ceilingY, held) {
        const spd = 380;
        this.y += held ? -spd * dt : spd * dt;
        this.rotation = held ? -45 : 45;

        if (this.y >= groundY - this.size) this.y = groundY - this.size;
        if (this.y <= ceilingY) this.y = ceilingY;
    }

    /* ── Hitbox (inset for fair play) ── */
    get hitbox() {
        const m = 6;
        return { x: this.x + m, y: this.y + m, w: this.size - m * 2, h: this.size - m * 2 };
    }

    overlaps(obs) {
        const h = this.hitbox;
        const r = obs.hitbox;
        return h.x < r.x + r.w && h.x + h.w > r.x &&
            h.y < r.y + r.h && h.y + h.h > r.y;
    }

    /* Centre coords */
    get cx() { return this.x + this.size / 2; }
    get cy() { return this.y + this.size / 2; }
}
