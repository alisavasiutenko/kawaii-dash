'use strict';
/* ============================================================
   Obstacle – screen-positioned game object
   ============================================================ */
class Obstacle {
    constructor(def, groundY, canvasH) {
        const T = TILE;
        this.worldX = def.x;
        this.type = def.type;
        this.mode = def.mode;   // portals

        const w = (def.w || 1) * T;
        const h = (def.h || 1) * T;
        const row = (def.row || 0) * T;

        this.width = w;
        this.height = h;

        if (def.ceiling) {
            this._baseY = row;                        // offset from top
            this._ceil = true;
        } else {
            this._baseY = groundY - h - row;          // offset from ground up
            this._ceil = false;
        }

        this.screenX = 0;
        this.screenY = this._baseY;
    }

    update(worldX) {
        this.screenX = this.worldX - worldX + PLAYER_X;
        this.screenY = this._baseY;
    }

    get hitbox() {
        if (this.type === 'spike') {
            /* Smaller AABB for triangle spikes (fairness) */
            const m = TILE * 0.25;
            return {
                x: this.screenX + m,
                y: this.screenY + m,
                w: this.width - m * 2,
                h: this.height - m
            };
        }
        if (this.type === 'portal') {
            return { x: this.screenX, y: this.screenY, w: this.width, h: this.height };
        }
        /* block / platform */
        return { x: this.screenX, y: this.screenY, w: this.width, h: this.height };
    }

    get isVisible() {
        return this.screenX > -this.width - 100;
    }
}
