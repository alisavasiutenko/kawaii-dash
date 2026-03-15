'use strict';
/* ============================================================
   Game – main controller, state machine, UI wiring
   ============================================================ */

class Game {
    constructor() {
        /* Canvas */
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) throw new Error('Missing #gameCanvas element');
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) throw new Error('Unable to get 2D canvas context');

        /* State */
        this.state = GameState.MENU;
        this.currentLevel = 0;
        this.attempts = 1;
        this.worldX = 0;
        this.player = null;
        this.obstacles = [];
        this.particles = [];
        this._spawnQueue = [];
        this.levelDef = null;

        /* Hold tracking */
        this.heldDown = false;

        /* Cached DOM elements */
        this.$menuOverlay   = document.getElementById('menuOverlay');
        this.$deathScreen   = document.getElementById('deathScreen');
        this.$victoryScreen = document.getElementById('victoryScreen');
        this.$gameHud       = document.getElementById('gameHud');
        this.$hudLevelName  = document.getElementById('hudLevelName');
        this.$hudAttempts   = document.getElementById('hudAttempts');
        this.$hudMode       = document.getElementById('hudMode');
        this.$progressBar   = document.getElementById('progressBar');
        this.$progressPct   = document.getElementById('progressPct');
        this.$deathPct      = document.getElementById('deathPct');
        this.$nextBtn       = document.getElementById('nextBtn');

        // Engine systems
        this.audio = new AudioManager();
        this.renderer = new Renderer(this.canvas, this.ctx);
        if (typeof LevelEditor !== 'undefined') {
            this.editor = new LevelEditor(this);
        }

        // Setup & Bind DOM UI
        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._wireUI();
        this._wireInput();

        /* Loop */
        this._lastTime = 0;
        this._boundLoop = (t) => this._loop(t);
        requestAnimationFrame(this._boundLoop);
    }

    /* ──────────── Resize ──────────── */
    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height - 80;
        this.ceilingY = 70;
    }

    /* ──────────── Input ──────────── */
    _wireInput() {
        const press = () => { this.heldDown = true; this._onAction(); };
        const release = () => { this.heldDown = false; };

        document.addEventListener('keydown', e => {
            if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); press(); }
        });
        document.addEventListener('keyup', e => {
            if (e.code === 'Space' || e.code === 'ArrowUp') release();
        });
        this.canvas.addEventListener('mousedown', press);
        this.canvas.addEventListener('mouseup', release);
        this.canvas.addEventListener('touchstart', e => { e.preventDefault(); press(); }, { passive: false });
        this.canvas.addEventListener('touchend', e => { e.preventDefault(); release(); }, { passive: false });
    }

    _onAction() {
        if (this.state === GameState.PLAYING && this.player) {
            this.player.onPress();
        }
    }

    /* ──────────── UI wiring ──────────── */
    _wireUI() {
        /* Level buttons */
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentLevel = parseInt(btn.dataset.level, 10);
            });
        });

        /* Avatar colour swatches */
        const swatches = document.querySelectorAll('.color-swatch');
        const savedColor = localStorage.getItem('gd_player_color') || '#ff9ed2';
        swatches.forEach(s => {
            if (s.dataset.color === savedColor) s.classList.add('active');
            else s.classList.remove('active');
            s.addEventListener('click', () => {
                swatches.forEach(x => x.classList.remove('active'));
                s.classList.add('active');
                localStorage.setItem('gd_player_color', s.dataset.color);
            });
        });

        /* Avatar shape swatches */
        const shapes = document.querySelectorAll('.shape-swatch');
        const savedShape = localStorage.getItem('gd_player_shape') || 'square';
        shapes.forEach(s => {
            if (s.dataset.shape === savedShape) s.classList.add('active');
            else s.classList.remove('active');
            s.addEventListener('click', () => {
                shapes.forEach(x => x.classList.remove('active'));
                s.classList.add('active');
                localStorage.setItem('gd_player_shape', s.dataset.shape);
            });
        });

        /* Play */
        document.getElementById('playBtn').addEventListener('click', () => this.startLevel(this.currentLevel));

        /* Retry */
        document.getElementById('retryBtn').addEventListener('click', () => {
            this._hideAll();
            this.attempts++;
            this._resetLevel();
        });

        /* Death → menu */
        document.getElementById('deathMenuBtn').addEventListener('click', () => {
            this.returnToMenu();
        });

        /* Next level */
        this.$nextBtn.addEventListener('click', () => {
            this._hideAll();
            if (this.currentLevel < LEVELS.length - 1 && this.currentLevel !== -1) {
                this.currentLevel++;
                this.attempts = 1;
                this._resetLevel();
                this._showHud();
            } else {
                this._showMenu();
            }
        });

        /* Victory → menu */
        document.getElementById('victoryMenuBtn').addEventListener('click', () => {
            this.returnToMenu();
        });

        /* Level Editor */
        document.getElementById('editorBtn').addEventListener('click', () => {
            if (this.editor) this.editor.open();
        });
    }

    /* ──────────── Public API ──────────── */
    startLevel(idx) {
        this.currentLevel = idx;
        this.attempts = 1;
        this._hideAll();
        this._resetLevel();
        this._showHud();
    }

    returnToMenu() {
        this._hideAll();
        this._showMenu();
    }

    playCustomLevel(levelData) {
        this.levelDef = levelData;
        this.currentLevel = -1;
        this._hideAll();
        this._resetLevel();
        this._showHud();
    }

    /* ──────────── Level lifecycle ──────────── */
    _resetLevel() {
        const lv = this.currentLevel === -1 ? this.levelDef : LEVELS[this.currentLevel];
        this.levelDef = lv;
        this.worldX = 0;
        this.obstacles = [];
        this.particles = [];
        this._spawnQueue = lv.obstacles.map(o => ({ ...o })).sort((a, b) => a.x - b.x);
        this.player = new Player(PLAYER_X, this.groundY);
        // Apply saved avatar colour (only overrides cube, not ship/ball/wave)
        const savedColor = localStorage.getItem('gd_player_color');
        if (savedColor) this.player.color = savedColor;
        const savedShape = localStorage.getItem('gd_player_shape');
        if (savedShape) this.player.shape = savedShape;
        this.state = GameState.PLAYING;
        this.audio.play(lv.bpm, lv.theme);
    }

    /* ──────────── Main loop ──────────── */
    _loop(ts) {
        const dt = Math.min((ts - this._lastTime) / 1000, 0.05);
        this._lastTime = ts;

        if (this.state === GameState.PLAYING) this._update(dt);
        this.renderer.draw(this, dt);

        requestAnimationFrame(this._boundLoop);
    }

    /* ──────────── Update ──────────── */
    _update(dt) {
        const lv = this.levelDef;

        /* Scroll world */
        this.worldX += lv.speed * dt;

        /* Progress */
        const pct = Math.min(this.worldX / lv.length, 1);
        this._setProgress(pct);

        /* Spawn obstacles ahead */
        const spawnEdge = this.canvas.width + 200;
        while (this._spawnQueue.length) {
            const next = this._spawnQueue[0];
            if (next.x - this.worldX + PLAYER_X < spawnEdge) {
                this._spawnQueue.shift();
                this.obstacles.push(new Obstacle(next, this.groundY, this.canvas.height));
            } else {
                break;
            }
        }

        /* Update player */
        this.player.update(dt, this.groundY, this.ceilingY, this.heldDown);

        /* Update obstacles (screenX sync) */
        this.obstacles.forEach(o => o.update(this.worldX));

        /* Cull off-screen */
        this.obstacles = this.obstacles.filter(o => o.isVisible);

        /* Collisions */
        for (const obs of this.obstacles) {
            if (obs.type === 'portal') {
                if (this.player.overlaps(obs)) {
                    this.player.setMode(obs.mode);
                    this.$hudMode.textContent = obs.mode.toUpperCase();
                }
                continue;
            }
            if (obs.type === 'end') {
                if (obs.screenX <= PLAYER_X + 10) { this._victory(); return; }
                continue;
            }

            if (!this.player.overlaps(obs)) continue;

            // Spikes always kill
            if (obs.type === 'spike') { this._die(); return; }

            // Blocks: safe to land on top, deadly from the side
            if (obs.type === 'block') {
                const playerCY = this.player.cy;                   // player vertical centre
                const blockCY = obs.screenY + obs.height / 2;    // block vertical centre
                if (playerCY <= blockCY) {
                    // Player came from above → land on top
                    this.player.y = obs.screenY - this.player.size;
                    this.player.vy = 0;
                    this.player.onGround = true;
                } else {
                    // Side / bottom → die
                    this._die(); return;
                }
            }
        }

        /* Out of bounds */
        if (this.player.y > this.canvas.height + 100 || this.player.y < -300) {
            this._die(); return;
        }

        /* Particles */
        this._tickParticles(dt);
    }

    /* ──────────── Death ──────────── */
    _die() {
        if (this.state !== GameState.PLAYING) return;
        this.state = GameState.DEAD;
        this.audio.stop();

        /* Burst particles */
        const p = this.player;
        for (let i = 0; i < 28; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 100 + Math.random() * 400;
            this.particles.push({
                x: p.cx, y: p.cy,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 150,
                life: 1, maxLife: 1,
                size: 4 + Math.random() * 10,
                color: i % 4 === 0 ? '#fff' : p.color
            });
        }

        const pct = Math.min(Math.round(this.worldX / this.levelDef.length * 100), 100);
        setTimeout(() => {
            if (this.state === GameState.DEAD) this._showDeath(pct);
        }, 1400);
    }

    /* ──────────── Victory ──────────── */
    _victory() {
        if (this.state !== GameState.PLAYING) return;
        this.state = GameState.VICTORY;
        this.audio.stop();
        const hasNext = this.currentLevel < LEVELS.length - 1;
        setTimeout(() => this._showVictory(hasNext), 600);
    }

    /* ──────────── Particles ──────────── */
    _tickParticles(dt) {
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 700 * dt;
            p.life -= dt * 1.4;
        }
        this.particles = this.particles.filter(p => p.life > 0);
    }

    /* ──────────── UI helpers ──────────── */
    _hideAll() {
        this.$menuOverlay.classList.add('hidden');
        this.$deathScreen.classList.add('hidden');
        this.$victoryScreen.classList.add('hidden');
        this.$gameHud.classList.add('hidden');
    }

    _showMenu() {
        this.state = GameState.MENU;
        this.audio.stop();
        this.$menuOverlay.classList.remove('hidden');
    }

    _showHud() {
        this.$gameHud.classList.remove('hidden');
        this.$hudLevelName.textContent = this.levelDef.name;
        this.$hudAttempts.textContent = `Attempt ${this.attempts}`;
        this.$hudMode.textContent = 'CUBE';
        this._setProgress(0);
    }

    _setProgress(pct) {
        this.$progressBar.style.width = (pct * 100).toFixed(1) + '%';
        this.$progressPct.textContent = Math.round(pct * 100) + '%';
    }

    _showDeath(pct) {
        this.$deathPct.textContent = pct + '%';
        this.$deathScreen.classList.remove('hidden');
    }

    _showVictory(hasNext) {
        this.$nextBtn.style.display = hasNext ? '' : 'none';
        this.$victoryScreen.classList.remove('hidden');
    }
}

/* ── Boot ── */
window.addEventListener('load', () => { window.game = new Game(); });
