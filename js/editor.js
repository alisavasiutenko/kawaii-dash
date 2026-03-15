'use strict';
/* ============================================================
   Level Editor
   ============================================================ */

class LevelEditor {
    constructor(game) {
        this.game = game;
        this.overlay = document.getElementById('editorOverlay');
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.active = false;
        this.scrollX = 0;
        this.selectedTool = 'spike';
        this.obstacles = [];

        this.tools = ['spike', 'block', 'portal-ship', 'portal-cube', 'portal-wave', 'end', 'erase'];

        this._bindEvents();
    }

    open() {
        this.active = true;
        this.scrollX = 0;
        this.obstacles = [];
        this.overlay.classList.remove('hidden');
        this.resize();
        this.draw();
    }

    close() {
        this.active = false;
        this.overlay.classList.add('hidden');
    }

    resize() {
        if (!this.active) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 60; // leave room for header
        const W = this.canvas.width;
        const H = this.canvas.height;
        // Ground is relative to game's ground proportion (approx H - 80)
        // To keep it simple, editor uses exact canvas pixels
        this.groundY = H - 80;
        this.ceilingY = 70;
        this.draw();
    }

    _bindEvents() {
        window.addEventListener('resize', () => { if (this.active) this.resize(); });

        // Tools
        document.querySelectorAll('.ed-tool').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.ed-tool').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.selectedTool = e.currentTarget.dataset.tool;
            });
        });

        // Actions
        document.getElementById('edClose').addEventListener('click', () => {
            this.close();
            this.game.returnToMenu();
        });

        document.getElementById('edTest').addEventListener('click', () => {
            this._testLevel();
        });

        // Canvas interactions
        let isDragging = false;
        let startX = 0;
        let startScroll = 0;

        // Right click / Middle click pan
        this.canvas.addEventListener('mousedown', e => {
            if (e.button === 1 || e.button === 2) {
                isDragging = true;
                startX = e.clientX;
                startScroll = this.scrollX;
            } else if (e.button === 0) {
                this._handleCanvasClick(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mousemove', e => {
            if (isDragging) {
                const dx = e.clientX - startX;
                this.scrollX = Math.max(0, startScroll - dx);
                this.draw();
            }
        });

        window.addEventListener('mouseup', e => {
            if (e.button === 1 || e.button === 2) {
                isDragging = false;
            }
        });

        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        // Wheel scroll
        this.canvas.addEventListener('wheel', e => {
            this.scrollX = Math.max(0, this.scrollX + Math.sign(e.deltaY) * 80);
            this.draw();
        });
    }

    /* ── Interaction ── */
    _handleCanvasClick(cx, cy) {
        const rect = this.canvas.getBoundingClientRect();
        const x = cx - rect.left;
        const y = cy - rect.top;

        const T = TILE;
        const worldX = this.scrollX + x;

        // Snap to grid
        const sX = Math.floor(worldX / T) * T;

        if (this.selectedTool === 'erase') {
            this.obstacles = this.obstacles.filter(o => {
                const oh = (o.h || 1) * T;
                const ow = (o.w || 1) * T;
                const oY = this.groundY - oh - (o.row || 0) * T;
                const inX = worldX >= o.x && worldX < o.x + ow;
                const inY = y >= oY && y < oY + oh;
                return !(inX && inY);
            });
        } else {
            // Add obstacle
            const row = Math.max(0, Math.floor((this.groundY - y) / T));
            const type = this.selectedTool.split('-')[0];
            const mode = this.selectedTool.split('-')[1];

            let obs = { x: sX, type: type, row: row };
            if (type === 'portal') {
                obs.w = 2; obs.h = 5; obs.mode = mode;
            }
            this.obstacles.push(obs);
        }
        this.draw();
    }

    /* ── Generating & Testing ── */
    _testLevel() {
        if (this.obstacles.length === 0) {
            alert("Please add some obstacles first!"); return;
        }

        const maxObs = this.obstacles.reduce((max, o) => Math.max(max, o.x), 0);

        // Sort and ensure End gate exists
        let finalObs = [...this.obstacles];
        if (!finalObs.find(o => o.type === 'end')) {
            finalObs.push({ x: maxObs + 400, type: 'end' });
        }
        finalObs.sort((a, b) => a.x - b.x);

        const levelData = {
            name: 'Custom Level',
            bpm: 130,
            speed: 300,
            theme: 'cyan', // Re-uses default audio
            length: maxObs + 800,
            bgStops: ['#1e0512', '#3a0c1c'], // Hot pink theme mapping
            accentColor: '#ff66cc',
            obstacles: finalObs
        };

        this.close();
        this.game.playCustomLevel(levelData);
    }

    /* ── Drawing ── */
    draw() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#1a0530';
        ctx.fillRect(0, 0, W, H);

        // Grid
        const T = TILE;
        const offset = -(this.scrollX % T);

        ctx.strokeStyle = '#ffffff11';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = offset; x < W; x += T) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (let y = this.groundY; y > 0; y -= T) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();

        // Ground and Ceiling
        ctx.fillStyle = '#d4b3ff22';
        ctx.fillRect(0, this.groundY, W, H - this.groundY);
        ctx.strokeStyle = '#d4b3ff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, this.groundY); ctx.lineTo(W, this.groundY); ctx.stroke();

        ctx.strokeStyle = '#d4b3ff33';
        ctx.beginPath(); ctx.moveTo(0, this.ceilingY); ctx.lineTo(W, this.ceilingY); ctx.stroke();

        // Player start pos
        ctx.fillStyle = '#ffffff66';
        ctx.fillRect(PLAYER_X - this.scrollX, this.groundY - T, T, T);

        // Obstacles
        ctx.fillStyle = '#ff66cc';
        ctx.strokeStyle = '#fff';

        for (const o of this.obstacles) {
            const scrX = o.x - this.scrollX;
            if (scrX < -200 || scrX > W) continue;

            const w = (o.w || 1) * T;
            const h = (o.h || 1) * T;
            const y = this.groundY - h - (o.row || 0) * T;

            if (o.type === 'spike') {
                ctx.fillStyle = '#ff9eb5';
                ctx.beginPath();
                ctx.moveTo(scrX, y + h); ctx.lineTo(scrX + w, y + h); ctx.lineTo(scrX + w / 2, y);
                ctx.fill(); ctx.stroke();
            } else if (o.type === 'block') {
                ctx.fillStyle = '#d4aaff88';
                ctx.fillRect(scrX, y, w, h);
                ctx.strokeRect(scrX, y, w, h);
            } else if (o.type === 'portal') {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.strokeRect(scrX, y, w, h);
                ctx.fillStyle = '#ffffffaa';
                ctx.fillText(o.mode.toUpperCase(), scrX + w / 2 - 10, y + h / 2);
            } else if (o.type === 'end') {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(scrX, this.ceilingY); ctx.lineTo(scrX, this.groundY); ctx.stroke();
            }
        }

        // Scroll indicator
        ctx.fillStyle = '#fff';
        ctx.font = '14px Orbitron';
        ctx.fillText(`Scroll: ${Math.round(this.scrollX)}`, 20, 30);
    }
}

