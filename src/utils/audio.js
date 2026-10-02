'use client';

// ============================================
// 🔊 CELIKMINDA PREMIUM AUDIO ENGINE v4
// Pre-baked AudioBuffer approach — Kiddora-level quality
// All sounds generated once at init, cached as AudioBuffers
// Zero latency, consistent quality, no synthesis clicks
// ============================================

let audioCtx = null;
let masterCompressor = null;
let soundBank = {};
let initialized = false;

function getCtx() {
  if (!audioCtx && typeof window !== 'undefined') {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-20, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(25, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(8, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.15, audioCtx.currentTime);
      masterCompressor.connect(audioCtx.destination);
    } catch (e) {
      return null;
    }
  }
  if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function getDest() {
  return masterCompressor || audioCtx?.destination || null;
}

// ============================================
// PRE-BAKE ENGINE: Generate AudioBuffers ONCE
// ============================================

function generateBuffer(ctx, duration, generator) {
  const sampleRate = ctx.sampleRate;
  const length = Math.ceil(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    generator(data, sampleRate, length, ch);
  }
  return buffer;
}

// Warm sine note with ADSR
function addNote(data, sampleRate, freq, startSec, durSec, volume, type = 'sine') {
  const start = Math.floor(startSec * sampleRate);
  const dur = Math.floor(durSec * sampleRate);
  const attack = Math.min(Math.floor(0.015 * sampleRate), dur / 4);
  const release = Math.floor(dur * 0.35);
  
  for (let i = 0; i < dur && (start + i) < data.length; i++) {
    const t = i / sampleRate;
    let sample = 0;
    
    if (type === 'sine') {
      sample = Math.sin(2 * Math.PI * freq * t);
    } else if (type === 'triangle') {
      const p = (freq * t) % 1;
      sample = 4 * Math.abs(p - 0.5) - 1;
    } else if (type === 'square') {
      sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.5 : -0.5;
    }
    
    // ADSR envelope
    let env = 1;
    if (i < attack) env = i / attack;
    else if (i > dur - release) env = (dur - i) / release;
    env = Math.max(0, env);
    
    // Soft curve for release
    if (i > dur - release) env = env * env;
    
    data[start + i] += sample * volume * env;
  }
}

// Glockenspiel with partials (warm metallic tone)
function addGlock(data, sr, freq, startSec, durSec, vol) {
  addNote(data, sr, freq, startSec, durSec, vol, 'sine');
  addNote(data, sr, freq * 2.0, startSec + 0.003, durSec * 0.5, vol * 0.22, 'sine');
  addNote(data, sr, freq * 3.0, startSec + 0.005, durSec * 0.25, vol * 0.07, 'sine');
  addNote(data, sr, freq * 5.43, startSec + 0.002, durSec * 0.1, vol * 0.03, 'sine');
}

// Bell with inharmonic partials
function addBell(data, sr, freq, startSec, durSec, vol) {
  addNote(data, sr, freq, startSec, durSec, vol, 'sine');
  addNote(data, sr, freq * 2.0, startSec + 0.004, durSec * 0.6, vol * 0.35, 'sine');
  addNote(data, sr, freq * 2.76, startSec + 0.007, durSec * 0.35, vol * 0.15, 'sine');
  addNote(data, sr, freq * 5.4, startSec + 0.009, durSec * 0.15, vol * 0.05, 'sine');
}

// Marimba (warm wooden)
function addMarimba(data, sr, freq, startSec, durSec, vol) {
  addNote(data, sr, freq, startSec, durSec, vol, 'sine');
  addNote(data, sr, freq * 4.0, startSec, durSec * 0.12, vol * 0.1, 'sine');
  addNote(data, sr, freq * 0.5, startSec, durSec * 0.7, vol * 0.12, 'sine');
}

// Sparkle shimmer
function addSparkle(data, sr, startSec, count, vol) {
  for (let i = 0; i < count; i++) {
    const freq = 2500 + (Math.sin(i * 1.618) * 0.5 + 0.5) * 3000;
    const delay = i * 0.045;
    addNote(data, sr, freq, startSec + delay, 0.1, vol * (0.7 + Math.sin(i) * 0.3), 'sine');
  }
}

// Reverb tail (stereo decorrelation)
function addReverb(data, sr, length, ch, amount = 0.12) {
  // Simple delay-based reverb simulation
  const delays = ch === 0 ? [0.031, 0.047, 0.073] : [0.037, 0.053, 0.079];
  const feedback = 0.3;
  
  for (const delay of delays) {
    const delaySamples = Math.floor(delay * sr);
    for (let i = delaySamples; i < length; i++) {
      data[i] += data[i - delaySamples] * amount * feedback;
    }
  }
}

function initSoundBank() {
  const ctx = getCtx();
  if (!ctx || initialized) return;
  
  // ✅ CORRECT SOUND — C5-E5-G5 ascending glockenspiel
  soundBank.correct = generateBuffer(ctx, 0.8, (data, sr, len, ch) => {
    addGlock(data, sr, 523.25, 0.0, 0.30, 0.13);
    addGlock(data, sr, 659.25, 0.12, 0.30, 0.13);
    addGlock(data, sr, 783.99, 0.24, 0.45, 0.15);
    addReverb(data, sr, len, ch, 0.08);
  });
  
  // ❌ WRONG SOUND — Gentle descending (Eb4-Db4)
  soundBank.wrong = generateBuffer(ctx, 0.55, (data, sr, len, ch) => {
    addNote(data, sr, 311.13, 0.0, 0.20, 0.10, 'triangle');
    addNote(data, sr, 277.18, 0.16, 0.28, 0.08, 'triangle');
    addReverb(data, sr, len, ch, 0.04);
  });
  
  // 👆 TAP — Quick pop
  soundBank.tap = generateBuffer(ctx, 0.12, (data, sr, len) => {
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = 1100 * Math.pow(0.5, t * 20);
      const env = Math.exp(-t * 50);
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.08 * env;
    }
  });
  
  // 🎉 CELEBRATION — Full fanfare with sparkle
  soundBank.celebration = generateBuffer(ctx, 1.8, (data, sr, len, ch) => {
    // Ascending fanfare: C5 → E5 → G5 → C6
    addGlock(data, sr, 523.25, 0.0, 0.28, 0.12);
    addGlock(data, sr, 659.25, 0.15, 0.28, 0.12);
    addGlock(data, sr, 783.99, 0.30, 0.28, 0.12);
    addGlock(data, sr, 1046.50, 0.45, 0.60, 0.14);
    
    // Bass marimba support
    addMarimba(data, sr, 261.63, 0.0, 0.45, 0.06);
    addMarimba(data, sr, 329.63, 0.30, 0.45, 0.05);
    
    // High bells
    addBell(data, sr, 2093.0, 0.55, 0.45, 0.04);
    addBell(data, sr, 2637.0, 0.65, 0.45, 0.03);
    addBell(data, sr, 3136.0, 0.75, 0.60, 0.03);
    
    // Sparkle cascade
    addSparkle(data, sr, 0.85, 8, 0.025);
    
    addReverb(data, sr, len, ch, 0.12);
  });
  
  // ⭐ STAR — Ascending sparkle
  soundBank.star = generateBuffer(ctx, 0.8, (data, sr, len, ch) => {
    const sparkleNotes = [1318.51, 1567.98, 2093.0, 2637.0, 3136.0];
    sparkleNotes.forEach((freq, i) => {
      addBell(data, sr, freq, i * 0.07, 0.30, 0.05);
    });
    addSparkle(data, sr, 0.40, 4, 0.02);
    addReverb(data, sr, len, ch, 0.10);
  });
  
  // 🔊 ANIMAL HINT — Playful attention motif
  soundBank.animalHint = generateBuffer(ctx, 0.65, (data, sr, len, ch) => {
    addGlock(data, sr, 659.25, 0.0, 0.20, 0.12);  // E5
    addGlock(data, sr, 783.99, 0.12, 0.20, 0.12);  // G5
    addBell(data, sr, 1046.50, 0.26, 0.35, 0.07);   // C6 bell
    addSparkle(data, sr, 0.32, 3, 0.018);
    addReverb(data, sr, len, ch, 0.08);
  });
  
  // 📖 REVEAL — Discovery ding
  soundBank.reveal = generateBuffer(ctx, 0.6, (data, sr, len, ch) => {
    addBell(data, sr, 1046.50, 0.0, 0.50, 0.08);
    addNote(data, sr, 1567.98, 0.04, 0.25, 0.03, 'sine');
    addReverb(data, sr, len, ch, 0.08);
  });
  
  // 🎯 NEW ROUND — Quick attention duo
  soundBank.newRound = generateBuffer(ctx, 0.30, (data, sr, len, ch) => {
    addMarimba(data, sr, 440, 0.0, 0.12, 0.07);
    addMarimba(data, sr, 554.37, 0.08, 0.16, 0.08);
    addReverb(data, sr, len, ch, 0.04);
  });
  
  // 🧱 BLOCK PLACE — Wooden clonk
  soundBank.blockPlace = generateBuffer(ctx, 0.25, (data, sr, len) => {
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      // Low thud
      const thudFreq = 180 * Math.pow(0.3, t * 8);
      const thud = Math.sin(2 * Math.PI * thudFreq * t) * 0.15 * Math.exp(-t * 12);
      // Click
      const click = (Math.sin(2 * Math.PI * 900 * t) > 0 ? 0.03 : -0.03) * Math.exp(-t * 100);
      data[i] = thud + click;
    }
  });
  
  // 🎨 MIX — Bubbly pops
  soundBank.mix = generateBuffer(ctx, 0.40, (data, sr, len, ch) => {
    for (let i = 0; i < 4; i++) {
      const freq = 380 + i * 140 + (Math.sin(i * 2.5) * 0.5 + 0.5) * 80;
      addNote(data, sr, freq, i * 0.07, 0.12, 0.07, 'sine');
    }
    addReverb(data, sr, len, ch, 0.04);
  });
  
  // 🏠 NAVIGATE — Soft whoosh
  soundBank.navigate = generateBuffer(ctx, 0.15, (data, sr, len) => {
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const noise = (Math.sin(i * 0.1) * Math.cos(i * 0.07) + Math.sin(i * 0.23)) * 0.3;
      const env = Math.pow(1 - i / len, 3.5);
      // Bandpass effect via frequency sweep
      const sweep = Math.sin(2 * Math.PI * (1800 + t * 20000) * t);
      data[i] = noise * env * 0.04 * sweep;
    }
  });
  
  // 🎪 BOUNCE — Fun bouncy
  soundBank.bounce = generateBuffer(ctx, 0.20, (data, sr, len) => {
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = 600 + Math.sin(t * 50) * 200;
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.08 * Math.exp(-t * 10);
    }
  });
  
  // 🌟 LEVEL UP — Triumphant scale
  soundBank.levelUp = generateBuffer(ctx, 1.0, (data, sr, len, ch) => {
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.50];
    scale.forEach((freq, i) => {
      addGlock(data, sr, freq, i * 0.075, 0.14, 0.055 + i * 0.006);
    });
    addSparkle(data, sr, 0.65, 10, 0.02);
    addReverb(data, sr, len, ch, 0.10);
  });
  
  initialized = true;
}

// ---- PLAYBACK: Instant, zero-latency ----

function playBuffer(name, volume = 1.0) {
  const ctx = getCtx();
  if (!ctx) return;
  
  if (!initialized) initSoundBank();
  const buffer = soundBank[name];
  if (!buffer) return;
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  
  source.connect(gain);
  gain.connect(getDest());
  source.start(0);
}


// ============================================
// 🎵 PUBLIC API — Same interface, premium playback
// ============================================

export function playCorrectSound()    { playBuffer('correct', 1.0); }
export function playWrongSound()      { playBuffer('wrong', 0.8); }
export function playTapSound()        { playBuffer('tap', 0.7); }
export function playCelebrationSound(){ playBuffer('celebration', 1.0); }
export function playStarSound()       { playBuffer('star', 0.9); }
export function playAnimalHint()      { playBuffer('animalHint', 1.0); }
export function playRevealSound()     { playBuffer('reveal', 0.9); }
export function playNewRoundSound()   { playBuffer('newRound', 0.8); }
export function playBlockPlaceSound() { playBuffer('blockPlace', 0.9); }
export function playMixSound()        { playBuffer('mix', 0.8); }
export function playNavigateSound()   { playBuffer('navigate', 0.6); }
export function playBounceSound()     { playBuffer('bounce', 0.8); }
export function playLevelUpSound()    { playBuffer('levelUp', 1.0); }

// Initialize on first user interaction (required by browser autoplay policy)
export function initAudio() {
  const ctx = getCtx();
  if (ctx && !initialized) initSoundBank();
}

// ============================================
// 🚫 NO TTS — Zero robot voice, zero AI speech
// ============================================
export function speak() {}
export function speakAnimalSound() {}
export function speakWord() {}
export function speakEncouragement() {}
