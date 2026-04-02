'use strict';
/* ============================================================
   MusicSelector – Lets players pick background music
   Includes Minecraft-inspired ambient tracks recreated via
   Web Audio API (procedural piano/synth approximations of
   Aria Math, Door, Wet Hands, Sweden, etc.)
   ============================================================ */

const MusicSelector = (() => {
    let _selectedTrack = localStorage.getItem('gd_music_track') || 'default';
    let _ctx = null;
    let _master = null;
    let _nodes = [];
    let _timers = [];
    let _playing = false;

    /* ── TRACK LIST ── */
    const TRACKS = [
        { id: 'default',   name: '♡ Default',         icon: '🎵', desc: 'Original chiptune' },
        { id: 'aria_math', name: '✦ Aria Math',        icon: '🎹', desc: 'Calm ambient piano' },
        { id: 'sweden',    name: '✦ Sweden',           icon: '🌅', desc: 'Peaceful melody' },
        { id: 'wet_hands', name: '✦ Wet Hands',        icon: '💧', desc: 'Gentle piano' },
        { id: 'door',      name: '✦ Door',             icon: '🚪', desc: 'Mysterious ambient' },
        { id: 'mice_on_venus', name: '✦ Mice on Venus', icon: '🐭', desc: 'Dreamy atmosphere' },
        { id: 'haggstrom', name: '✦ Haggstrom',        icon: '🎸', desc: 'Upbeat melody' },
        { id: 'subwoofer', name: '✦ Subwoofer Lullaby', icon: '🌙', desc: 'Deep bass ambient' },
        { id: 'silent',    name: '🔇 No Music',         icon: '🔇', desc: 'Silence' },
    ];

    /* ── AUDIO INIT ── */
    function _init() {
        if (_ctx) return;
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
        _master = _ctx.createGain();
        _master.gain.value = 0.35;
        _master.connect(_ctx.destination);
    }

    function stop() {
        _playing = false;
        _timers.forEach(t => clearTimeout(t));
        _timers = [];
        _nodes.forEach(n => { try { n.stop(); n.disconnect(); } catch (_) {} });
        _nodes = [];
    }

    /* ── HELPER: play a note ── */
    function _note(type, freq, start, dur, gain = 0.3, detune = 0) {
        if (!_ctx || !_playing) return;
        const o = _ctx.createOscillator();
        const g = _ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        if (detune) o.detune.value = detune;
        o.connect(g);
        g.connect(_master);
        // Soft attack for piano-like feel
        g.gain.setValueAtTime(0.001, start);
        g.gain.linearRampToValueAtTime(gain, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        o.start(start);
        o.stop(start + dur + 0.01);
        o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (_) {} };
        _nodes.push(o, g);
    }

    /* ── HELPER: piano-like tone (layered sine + triangle) ── */
    function _piano(freq, start, dur, gain = 0.25) {
        _note('sine', freq, start, dur, gain);
        _note('triangle', freq, start, dur, gain * 0.3);
        _note('sine', freq * 2, start, dur * 0.5, gain * 0.08); // harmonic
    }

    /* ── HELPER: pad/ambient tone ── */
    function _pad(freq, start, dur, gain = 0.1) {
        _note('sine', freq, start, dur, gain);
        _note('sine', freq * 1.005, start, dur, gain * 0.5); // slight detuned for warmth
        _note('triangle', freq * 0.5, start, dur, gain * 0.3); // sub
    }

    /* ── PRUNE ── */
    function _prune() {
        if (_nodes.length > 100) {
            const stale = _nodes.splice(0, _nodes.length - 100);
            stale.forEach(n => { try { n.disconnect(); } catch (_) {} });
        }
    }

    /* ──────────────────────────────────────────────────────────
       TRACK: Aria Math (C418) – Approximation
       Calm, ambient piano with arpeggiated chords
       ────────────────────────────────────────────────────────── */
    function _playAriaMath(measure) {
        if (!_playing || _selectedTrack !== 'aria_math') return;
        const t = _ctx.currentTime;
        const bpm = 85;
        const beat = 60 / bpm;

        // Aria Math uses repeating arpeggiated patterns in D major
        const patterns = [
            [293.66, 369.99, 440.00, 554.37],  // D4 F#4 A4 C#5
            [261.63, 329.63, 392.00, 493.88],  // C4 E4 G4 B4
            [246.94, 311.13, 369.99, 440.00],  // B3 Eb4 F#4 A4
            [220.00, 277.18, 329.63, 415.30],  // A3 C#4 E4 G#4
        ];

        const pattern = patterns[measure % patterns.length];
        
        // Arpeggiate the chord
        for (let i = 0; i < pattern.length; i++) {
            _piano(pattern[i], t + i * beat * 0.5, beat * 1.5, 0.18);
        }

        // Bass note
        _pad(pattern[0] * 0.5, t, beat * 2.5, 0.08);

        // High shimmer
        if (measure % 2 === 0) {
            _piano(pattern[2] * 2, t + beat * 1.5, beat * 1, 0.06);
        }

        const id = setTimeout(() => _playAriaMath(measure + 1), beat * 2000);
        _timers.push(id);
        if (measure % 8 === 0) _prune();
    }

    /* ──────────────────────────────────────────────────────────
       TRACK: Sweden (C418) – Approximation
       Peaceful, nostalgic piano melody in F major
       ────────────────────────────────────────────────────────── */
    function _playSweden(measure) {
        if (!_playing || _selectedTrack !== 'sweden') return;
        const t = _ctx.currentTime;
        const bpm = 72;
        const beat = 60 / bpm;

        // Sweden's iconic melody notes (simplified)
        const melodies = [
            [523.25, 440.00, 349.23, 440.00, 523.25, 659.26],
            [587.33, 523.25, 440.00, 349.23, 440.00, 523.25],
            [440.00, 349.23, 293.66, 349.23, 440.00, 523.25],
            [349.23, 293.66, 261.63, 293.66, 349.23, 440.00],
        ];

        const melody = melodies[measure % melodies.length];
        
        for (let i = 0; i < melody.length; i++) {
            _piano(melody[i], t + i * beat * 0.7, beat * 1.2, 0.2);
        }

        // Soft bass
        _pad(melody[0] * 0.25, t, beat * 4, 0.06);
        _pad(melody[2] * 0.25, t + beat * 2, beat * 4, 0.06);

        const id = setTimeout(() => _playSweden(measure + 1), beat * 4200);
        _timers.push(id);
        if (measure % 8 === 0) _prune();
    }

    /* ──────────────────────────────────────────────────────────
       TRACK: Wet Hands (C418) – Approximation
       Simple, gentle piano in C major
       ────────────────────────────────────────────────────────── */
    function _playWetHands(measure) {
        if (!_playing || _selectedTrack !== 'wet_hands') return;
        const t = _ctx.currentTime;
        const bpm = 65;
        const beat = 60 / bpm;

        // Wet Hands – simple rising piano patterns
        const patterns = [
            [261.63, 329.63, 392.00, 523.25, 392.00, 329.63],
            [293.66, 349.23, 440.00, 523.25, 440.00, 349.23],
            [261.63, 329.63, 392.00, 493.88, 392.00, 329.63],
            [246.94, 311.13, 369.99, 493.88, 369.99, 311.13],
        ];

        const pattern = patterns[measure % patterns.length];

        for (let i = 0; i < pattern.length; i++) {
            _piano(pattern[i], t + i * beat * 0.6, beat * 1.8, 0.22);
        }

        const id = setTimeout(() => _playWetHands(measure + 1), beat * 3600);
        _timers.push(id);
        if (measure % 8 === 0) _prune();
    }

    /* ──────────────────────────────────────────────────────────
       TRACK: Door (C418) – Approximation
       Mysterious, slightly dark ambient tones
       ────────────────────────────────────────────────────────── */
    function _playDoor(measure) {
        if (!_playing || _selectedTrack !== 'door') return;
        const t = _ctx.currentTime;
        const bpm = 60;
        const beat = 60 / bpm;

        // Door – mysterious, sparse notes with reverb-like decay
        const noteGroups = [
            [220.00, 277.18, 329.63],
            [196.00, 246.94, 293.66],
            [207.65, 261.63, 311.13],
            [185.00, 233.08, 277.18],
        ];

        const group = noteGroups[measure % noteGroups.length];

        // Sparse, echoing notes
        _piano(group[0], t, beat * 3, 0.15);
        _piano(group[1], t + beat * 1.5, beat * 2.5, 0.12);
        _piano(group[2], t + beat * 3, beat * 2, 0.10);

        // Deep sub bass
        _pad(group[0] * 0.5, t, beat * 5, 0.05);

        // Atmospheric pad
        _note('sine', group[1] * 2, t + beat, beat * 4, 0.03);

        const id = setTimeout(() => _playDoor(measure + 1), beat * 5000);
        _timers.push(id);
        if (measure % 8 === 0) _prune();
    }

    /* ──────────────────────────────────────────────────────────
       TRACK: Mice on Venus (C418) – Approximation
       Dreamy, ascending piano with ethereal feel
       ────────────────────────────────────────────────────────── */
    function _playMiceOnVenus(measure) {
        if (!_playing || _selectedTrack !== 'mice_on_venus') return;
        const t = _ctx.currentTime;
        const bpm = 78;
        const beat = 60 / bpm;

        const patterns = [
            [329.63, 392.00, 493.88, 587.33, 659.26],
            [349.23, 440.00, 523.25, 659.26, 783.99],
            [293.66, 369.99, 440.00, 554.37, 659.26],
            [311.13, 392.00, 493.88, 587.33, 739.99],
        ];

        const pattern = patterns[measure % patterns.length];

        for (let i = 0; i < pattern.length; i++) {
            _piano(pattern[i], t + i * beat * 0.5, beat * 2, 0.16);
        }

        // Ethereal high pad
        _pad(pattern[3] * 1.5, t + beat, beat * 3, 0.03);

        const id = setTimeout(() => _playMiceOnVenus(measure + 1), beat * 2500);
        _timers.push(id);
        if (measure % 8 === 0) _prune();
    }

    /* ──────────────────────────────────────────────────────────
       TRACK: Haggstrom (C418) – Approximation
       Upbeat, cheerful piano melody
       ────────────────────────────────────────────────────────── */
    function _playHaggstrom(measure) {
        if (!_playing || _selectedTrack !== 'haggstrom') return;
        const t = _ctx.currentTime;
        const bpm = 90;
        const beat = 60 / bpm;

        const melodies = [
            [392.00, 440.00, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00],
            [349.23, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00],
            [329.63, 392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00],
            [293.66, 349.23, 392.00, 440.00, 493.88, 440.00, 392.00, 349.23],
        ];

        const melody = melodies[measure % melodies.length];

        for (let i = 0; i < melody.length; i++) {
            _piano(melody[i], t + i * beat * 0.4, beat * 0.8, 0.18);
        }

        // Bass notes
        _pad(melody[0] * 0.25, t, beat * 3, 0.06);

        const id = setTimeout(() => _playHaggstrom(measure + 1), beat * 3200);
        _timers.push(id);
        if (measure % 8 === 0) _prune();
    }

    /* ──────────────────────────────────────────────────────────
       TRACK: Subwoofer Lullaby (C418) – Approximation
       Deep bass with gentle high notes
       ────────────────────────────────────────────────────────── */
    function _playSubwooferLullaby(measure) {
        if (!_playing || _selectedTrack !== 'subwoofer') return;
        const t = _ctx.currentTime;
        const bpm = 55;
        const beat = 60 / bpm;

        const bassNotes = [55.00, 49.00, 46.25, 41.20];
        const highNotes = [
            [523.25, 659.26],
            [493.88, 587.33],
            [440.00, 554.37],
            [392.00, 493.88],
        ];

        const bass = bassNotes[measure % bassNotes.length];
        const highs = highNotes[measure % highNotes.length];

        // Deep rumbling bass
        _pad(bass, t, beat * 6, 0.10);
        _note('sine', bass * 2, t, beat * 4, 0.05);

        // Gentle high piano notes (sparse)
        _piano(highs[0], t + beat * 2, beat * 2, 0.12);
        _piano(highs[1], t + beat * 4, beat * 2, 0.10);

        const id = setTimeout(() => _playSubwooferLullaby(measure + 1), beat * 6000);
        _timers.push(id);
        if (measure % 8 === 0) _prune();
    }

    /* ── PLAY SELECTED TRACK ── */
    function play() {
        _init();
        if (_ctx.state === 'suspended') _ctx.resume();
        stop();
        _playing = true;

        if (_selectedTrack === 'default' || _selectedTrack === 'silent') return;

        switch (_selectedTrack) {
            case 'aria_math':      _playAriaMath(0); break;
            case 'sweden':         _playSweden(0); break;
            case 'wet_hands':      _playWetHands(0); break;
            case 'door':           _playDoor(0); break;
            case 'mice_on_venus':  _playMiceOnVenus(0); break;
            case 'haggstrom':      _playHaggstrom(0); break;
            case 'subwoofer':      _playSubwooferLullaby(0); break;
        }
    }

    /* ── GET/SET ── */
    function getSelectedTrack() { return _selectedTrack; }
    function setSelectedTrack(id) {
        _selectedTrack = id;
        localStorage.setItem('gd_music_track', id);
    }
    function getTracks() { return TRACKS; }

    return {
        play, stop,
        getSelectedTrack, setSelectedTrack, getTracks,
    };
})();
