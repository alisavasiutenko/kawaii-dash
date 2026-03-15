'use strict';
/* ============================================================
   AudioManager – Web Audio API procedural chiptune engine
   ============================================================ */
class AudioManager {
  constructor() {
    this._ctx    = null;
    this._master = null;
    this._nodes  = [];
    this._timers = [];
    this._active = false;
  }

  _init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._master = this._ctx.createGain();
    this._master.gain.value = 0.55;
    this._master.connect(this._ctx.destination);
  }

  play(bpm, theme) {
    this._init();
    if (this._ctx.state === 'suspended') this._ctx.resume();
    this.stop();
    this._active = true;
    this._bpm    = bpm;
    this._beat   = 60 / bpm;
    this._theme  = theme || 'cyan';
    this._scheduleDrums(0);
    this._scheduleBass(0);
    this._scheduleMelody(0);
  }

  stop() {
    this._active = false;
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
    this._nodes.forEach(n => { try { n.stop(); n.disconnect(); } catch (_) {} });
    this._nodes = [];
  }

  _pruneNodes() {
    const limit = 200;
    if (this._nodes.length > limit) {
      const stale = this._nodes.splice(0, this._nodes.length - limit);
      stale.forEach(n => { try { n.disconnect(); } catch (_) {} });
    }
  }

  /* ── helpers ── */
  _osc(type, freq, start, dur, gain = 0.4) {
    if (!this._ctx || !this._active) return;
    const ctx = this._ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(this._master);
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.start(start);
    o.stop(start + dur + 0.01);
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (_) {} };
    this._nodes.push(o, g);
  }

  _noise(start, dur, gain = 0.3) {
    if (!this._ctx || !this._active) return;
    const ctx = this._ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    const g   = ctx.createGain();
    const flt = ctx.createBiquadFilter();
    src.buffer = buf;
    flt.type = 'highpass';
    flt.frequency.value = 4000;
    src.connect(flt);
    flt.connect(g);
    g.connect(this._master);
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.start(start);
    src.onended = () => { try { src.disconnect(); g.disconnect(); flt.disconnect(); } catch (_) {} };
    this._nodes.push(src, g, flt);
  }

  /* ── drums ── */
  _scheduleDrums(beat) {
    if (!this._active) return;
    const ctx = this._ctx;
    const t = ctx.currentTime;
    const b = this._beat;

    // Kick
    this._osc('sine', 120, t, b * 0.4, 0.8);
    const ko = ctx.createOscillator();
    const kg = ctx.createGain();
    ko.connect(kg); kg.connect(this._master);
    ko.frequency.setValueAtTime(150, t);
    ko.frequency.exponentialRampToValueAtTime(30, t + 0.25);
    kg.gain.setValueAtTime(0.9, t);
    kg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    ko.start(t); ko.stop(t + 0.31);
    this._nodes.push(ko, kg);

    // Snare (beat 2 & 4)
    if (beat % 4 === 2 || beat % 4 === 0) {
      this._noise(t + b * 0.5, 0.12, 0.4);
      this._osc('triangle', 200, t + b * 0.5, 0.1, 0.3);
    }

    // Hi-hat every 8th note
    this._noise(t,         0.04, 0.18);
    this._noise(t + b * 0.5, 0.04, 0.18);

    // 0.95 beat interval: slight overlap prevents audible gaps between drum hits
    const id = setTimeout(() => this._scheduleDrums(beat + 1), b * 950);
    this._timers.push(id);

    if (beat % 16 === 0) this._pruneNodes();
  }

  /* ── bass ── */
  _scheduleBass(beat) {
    if (!this._active) return;
    const b = this._beat;
    const t = this._ctx.currentTime;

    const scale = this._bassPitches();
    const note  = scale[beat % scale.length];
    this._osc('sawtooth', note * 0.5, t, b * 0.85, 0.3);

    // 1.0 beat interval: bass plays once per beat, no overlap needed
    const id = setTimeout(() => this._scheduleBass(beat + 1), b * 1000);
    this._timers.push(id);
  }

  /* ── melody ── */
  _scheduleMelody(beat) {
    if (!this._active) return;
    const b = this._beat;
    const t = this._ctx.currentTime;

    const scale = this._melodyPitches();
    const note  = scale[beat % scale.length];
    if (beat % 2 === 0) {
      this._osc('square', note, t, b * 0.6, 0.15);
    }

    // 0.5 beat interval: melody runs at 8th-note resolution (twice per beat)
    const id = setTimeout(() => this._scheduleMelody(beat + 1), b * 500);
    this._timers.push(id);
  }

  /* ── pitch tables per theme ── */
  _bassPitches() {
    const themes = {
      cyan:   [65.41, 73.42, 82.41, 87.31, 98.00, 87.31, 82.41, 73.42],
      purple: [55.00, 61.74, 65.41, 73.42, 82.41, 73.42, 65.41, 61.74],
      red:    [73.42, 82.41, 92.50, 98.00, 110.0, 98.00, 92.50, 82.41]
    };
    return themes[this._theme] || themes.cyan;
  }

  _melodyPitches() {
    const themes = {
      cyan:   [523.25, 587.33, 659.26, 698.46, 783.99, 880.00, 783.99, 698.46,
               659.26, 587.33, 523.25, 493.88, 523.25, 587.33, 659.26, 783.99],
      purple: [466.16, 523.25, 587.33, 622.25, 698.46, 783.99, 698.46, 622.25,
               587.33, 523.25, 466.16, 440.00, 466.16, 523.25, 587.33, 698.46],
      red:    [587.33, 659.26, 739.99, 783.99, 880.00, 987.77, 880.00, 783.99,
               739.99, 659.26, 587.33, 554.37, 587.33, 659.26, 739.99, 880.00]
    };
    return themes[this._theme] || themes.cyan;
  }
}
