'use strict';
/* ============================================================
   LEVELS  – 8 kawaii easy levels ♡
   T = tile size (40px)
   Each obstacle: { x, type, w?, h?, row?, ceiling?, mode? }
     type: 'spike' | 'block' | 'platform' | 'portal' | 'end'
     w/h : width/height in tiles (default 1)
     row : tiles above ground (0 = on ground)
     ceiling: attached to ceiling instead of floor
     mode: (portals only) 'cube'|'ship'|'ball'|'wave'
   ============================================================ */
const T = 40;

/* Helpers for building levels */
function spike(x, row = 0)             { return { x, type: 'spike', row }; }
function block(x, h = 1, row = 0)     { return { x, type: 'block', h, row }; }
function blocks(x, w, h = 1, row = 0) { return { x, type: 'block', w, h, row }; }
function ceilingSpike(x, row = 0)     { return { x, type: 'spike', row, ceiling: true }; }
function ceilingBlock(x, h = 1, row = 0) { return { x, type: 'block', h, row, ceiling: true }; }
function portal(x, mode)              { return { x, type: 'portal', w: 2, h: 5, mode }; }
function end(x)                       { return { x, type: 'end' }; }

/* ── LEVEL 1 – 🌸 Sakura Dream ── */
const level1 = {
    name: '🌸 Sakura Dream',
    bpm: 110,
    speed: 200,
    theme: 'cyan',
    length: 4800,
    bgStops: ['#2a0d3a', '#3d1554'],
    accentColor: '#ffb3d9',
    obstacles: [
        // Very gentle intro – wide gaps, just a few spikes
        spike(800),
        spike(1300),
        block(1700, 1),
        spike(2100),
        spike(2600),
        block(3000, 1),
        spike(3400),
        spike(3900),
        block(4200, 1),
        end(4600),
    ]
};

/* ── LEVEL 2 – 🦋 Butterfly Garden ── */
const level2 = {
    name: '🦋 Butterfly Garden',
    bpm: 115,
    speed: 210,
    theme: 'cyan',
    length: 5200,
    bgStops: ['#0d2a1a', '#163d2a'],
    accentColor: '#aaf0d1',
    obstacles: [
        // Cube then brief ship section
        spike(700),
        spike(1200),
        block(1600, 1),
        spike(2000),
        // Ship corridor – very open
        portal(2400, 'ship'),
        ceilingBlock(2800, 1),   // tiny ceiling nudge
        block(3200, 1),          // tiny floor bump
        ceilingBlock(3700, 1),
        // Back to cube
        portal(4000, 'cube'),
        spike(4300),
        spike(4700),
        end(5000),
    ]
};

/* ── LEVEL 3 – 🍭 Candy Land ── */
const level3 = {
    name: '🍭 Candy Land',
    bpm: 118,
    speed: 215,
    theme: 'purple',
    length: 5500,
    bgStops: ['#2d0a30', '#4a1250'],
    accentColor: '#d4b3ff',
    obstacles: [
        // Step-up blocks then spikes
        block(700,  1),
        block(900,  2),
        block(1100, 1),
        spike(1400),
        spike(1900),
        block(2200, 1),
        block(2400, 2),
        spike(2800),
        spike(3200),
        // Brief ball section
        portal(3600, 'ball'),
        spike(3900),
        spike(4200),
        portal(4500, 'cube'),
        spike(4800),
        spike(5100),
        end(5300),
    ]
};

/* ── LEVEL 4 – 🌙 Moon Bunny ── */
const level4 = {
    name: '🌙 Moon Bunny',
    bpm: 108,
    speed: 195,
    theme: 'cyan',
    length: 5000,
    bgStops: ['#0a0d2a', '#141654'],
    accentColor: '#a8d8ff',
    obstacles: [
        // Very slow, easy pattern
        spike(800),
        spike(1400),
        spike(2000),
        block(2500, 1),
        spike(2900),
        spike(3400),
        // Wave section – very open corridor
        portal(3800, 'wave'),
        ceilingSpike(4100),
        spike(4300),
        ceilingSpike(4500),
        spike(4700),
        portal(4900, 'cube'),
        end(5200),  // level end
    ]
};

/* ── LEVEL 5 – 🌈 Rainbow Road ── */
const level5 = {
    name: '🌈 Rainbow Road',
    bpm: 120,
    speed: 220,
    theme: 'purple',
    length: 6000,
    bgStops: ['#200a2a', '#321050'],
    accentColor: '#ffb3d9',
    obstacles: [
        // Cube
        spike(700),
        block(1100, 1),
        spike(1500),
        spike(2000),
        // Ship
        portal(2400, 'ship'),
        ceilingBlock(2700, 2),
        block(3000, 2),
        ceilingBlock(3400, 2),
        block(3700, 1),
        // Ball
        portal(4000, 'ball'),
        spike(4300),
        spike(4600),
        // Cube finale
        portal(4900, 'cube'),
        spike(5200),
        spike(5600),
        end(5800),
    ]
};

/* ── LEVEL 6 – 🍬 Sugar Rush ── */
const level6 = {
    name: '🍬 Sugar Rush',
    bpm: 125,
    speed: 230,
    theme: 'red',
    length: 5800,
    bgStops: ['#2a1500', '#3d2000'],
    accentColor: '#ffd6b3',
    obstacles: [
        // Quick easy blocks + spikes
        block(600,  1),
        block(800,  2),
        spike(1100),
        block(1500, 1),
        spike(1900),
        spike(2300),
        block(2700, 1),
        spike(3100),
        // Short ship
        portal(3500, 'ship'),
        ceilingBlock(3900, 1),
        block(4200, 1),
        portal(4500, 'cube'),
        spike(4800),
        block(5100, 1),
        spike(5400),
        end(5700),
    ]
};

/* ── LEVEL 7 – 🌷 Flower Power ── */
const level7 = {
    name: '🌷 Flower Power',
    bpm: 112,
    speed: 205,
    theme: 'purple',
    length: 6200,
    bgStops: ['#1a0a26', '#2c0f40'],
    accentColor: '#e8c0ff',
    obstacles: [
        // Cube intro
        spike(800),
        spike(1300),
        block(1700, 1),
        spike(2100),
        // Wave section – nice easy zigzag
        portal(2500, 'wave'),
        ceilingSpike(2800),
        spike(3000),
        ceilingSpike(3200),
        spike(3400),
        ceilingSpike(3600),
        spike(3800),
        // Back to cube
        portal(4100, 'cube'),
        spike(4400),
        block(4800, 2),
        spike(5100),
        spike(5500),
        block(5800, 1),
        end(6000),
    ]
};

/* ── LEVEL 8 – ⭐ Starlight ── */
const level8 = {
    name: '⭐ Starlight',
    bpm: 130,
    speed: 240,
    theme: 'red',
    length: 7000,
    bgStops: ['#0d0d20', '#1a1a3a'],
    accentColor: '#fff4a8',
    obstacles: [
        // Mixed easy medley
        spike(600),
        spike(1000),
        block(1400, 1),
        spike(1800),
        // Ship
        portal(2200, 'ship'),
        ceilingBlock(2500, 2),
        block(2800, 1),
        ceilingBlock(3200, 1),
        block(3500, 2),
        // Ball
        portal(3900, 'ball'),
        spike(4200),
        spike(4500),
        spike(4800),
        // Wave
        portal(5100, 'wave'),
        ceilingSpike(5400),
        spike(5600),
        ceilingSpike(5800),
        // Cube finish
        portal(6000, 'cube'),
        spike(6200),
        spike(6500),
        end(6800),
    ]
};

const LEVELS = [level1, level2, level3, level4, level5, level6, level7, level8];
