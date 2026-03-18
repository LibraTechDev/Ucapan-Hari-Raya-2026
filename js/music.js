/* ============================================================
   music.js — Hari Raya music via Web Audio API
   Plays a gentle takbir-inspired melody when the card opens.
   No external files needed — fully generated in browser.
   ============================================================ */

const Music = (() => {
  let ctx = null;
  let playing = false;
  let masterGain = null;
  let scheduledNodes = [];
  let loopTimeout = null;

  // ── Notes: simplified "Selamat Hari Raya" / takbir-inspired melody
  // Format: [frequency_hz, duration_beats, volume_scale]
  const TEMPO_BPM  = 76;
  const BEAT_SEC   = 60 / TEMPO_BPM;

  // Pentatonic-ish melody reminiscent of Eid nasheed
  const MELODY = [
    // bar 1 — gentle opening arpeggio
    [523.25, 0.5, .7],  // C5
    [587.33, 0.5, .7],  // D5
    [659.25, 1.0, .9],  // E5
    [587.33, 0.5, .6],  // D5
    [523.25, 0.5, .6],  // C5
    // bar 2
    [440.00, 1.0, .8],  // A4
    [493.88, 0.5, .7],  // B4
    [523.25, 1.5, .9],  // C5
    // bar 3 — rising phrase
    [523.25, 0.5, .7],
    [659.25, 0.5, .8],
    [783.99, 1.0, .9],  // G5
    [698.46, 0.5, .7],  // F5
    [659.25, 0.5, .7],  // E5
    // bar 4
    [587.33, 1.0, .8],  // D5
    [523.25, 0.5, .7],  // C5
    [493.88, 0.5, .6],  // B4
    [440.00, 1.0, .9],  // A4
    // bar 5 — gentle descend
    [392.00, 0.5, .7],  // G4
    [440.00, 0.5, .7],  // A4
    [493.88, 1.0, .8],  // B4
    [523.25, 0.5, .7],  // C5
    [587.33, 0.5, .7],  // D5
    // bar 6 — resolution
    [659.25, 1.5, .9],  // E5
    [587.33, 0.5, .6],  // D5
    [523.25, 2.0, 1.0], // C5 — hold
  ];

  // Soft chord pad (played simultaneously, lower volume)
  const CHORDS = [
    [[261.63,329.63,392.00], 4.0, .18],  // C maj
    [[261.63,329.63,392.00], 4.0, .18],  // C maj
    [[293.66,369.99,440.00], 4.0, .15],  // D min
    [[261.63,329.63,392.00], 4.0, .18],  // C maj
    [[220.00,261.63,329.63], 4.0, .15],  // A min
    [[246.94,329.63,392.00], 4.0, .15],  // B dim → resolve
  ];

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function makeOsc(freq, startTime, duration, gainVal, type = 'sine') {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type      = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envelope: soft attack + release
    const attack  = Math.min(0.06, duration * 0.15);
    const release = Math.min(0.18, duration * 0.35);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainVal, startTime + attack);
    gain.gain.setValueAtTime(gainVal, startTime + duration - release);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);

    scheduledNodes.push(osc);
    return osc;
  }

  function scheduleMelody(startTime) {
    let t = startTime;
    MELODY.forEach(([freq, beats, vol]) => {
      const dur = beats * BEAT_SEC;
      // Main tone (sine)
      makeOsc(freq, t, dur, vol * 0.55, 'sine');
      // Soft overtone (triangle, lower)
      makeOsc(freq * 2, t, dur, vol * 0.08, 'triangle');
      t += dur;
    });
    return t; // returns end time
  }

  function scheduleChords(startTime) {
    let t = startTime;
    CHORDS.forEach(([freqs, beats, vol]) => {
      const dur = beats * BEAT_SEC;
      freqs.forEach(freq => makeOsc(freq, t, dur, vol, 'sine'));
      t += dur;
    });
  }

  function playLoop() {
    if (!playing) return;
    const start = ctx.currentTime + 0.05;
    const endTime = scheduleMelody(start);
    scheduleChords(start);
    // Schedule next loop slightly before this one ends
    const loopDelay = (endTime - ctx.currentTime - 0.3) * 1000;
    loopTimeout = setTimeout(playLoop, Math.max(loopDelay, 500));
  }

  function fadeIn(durationSec = 1.5) {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + durationSec);
  }

  function fadeOut(durationSec = 1.0, callback) {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);
    setTimeout(callback, durationSec * 1000 + 50);
  }

  function stopAll() {
    clearTimeout(loopTimeout);
    scheduledNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    scheduledNodes = [];
  }

  // ── Public API ────────────────────────────────────────────
  return {
    start() {
      if (playing) return;
      ensureCtx();
      playing = true;
      fadeIn(1.8);
      playLoop();
      updateBtn(true);
    },

    stop() {
      if (!playing) return;
      playing = false;
      fadeOut(0.8, () => stopAll());
      updateBtn(false);
    },

    toggle() {
      playing ? this.stop() : this.start();
    },

    isPlaying() { return playing; },
  };
})();

// ── Music toggle button behaviour ────────────────────────────
function updateBtn(isPlaying) {
  const btn = document.getElementById('musicBtn');
  if (!btn) return;
  btn.textContent  = isPlaying ? '🔇' : '🎵';
  btn.title        = isPlaying ? 'Matikan musik' : 'Putar musik';
  isPlaying ? btn.classList.add('playing') : btn.classList.remove('playing');
}

// Auto-start when card opens (called from envelope.js)
function musicOnCardOpen() {
  // Small delay so animation isn't interrupted
  setTimeout(() => Music.start(), 400);
}

// Stop + reset when replaying from start
function musicOnReplay() {
  Music.stop();
}
