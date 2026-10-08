'use client';

import { assetPath } from '@/utils/assetPath';

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
// 🎙️ BM VOICE AUDIO ENGINE — Real MP3 Playback
// Uses Kapten's 178 professionally recorded MP3s
// Lazy-loaded, cached, zero-latency after first play
// ============================================

const voiceCache = {};  // Cache loaded Audio elements
let currentVoice = null; // Track currently playing voice to prevent overlap

function playMP3(path, volume = 0.85) {
  return new Promise((resolve) => {
    try {
      // Stop any currently playing voice
      if (currentVoice) {
        currentVoice.pause();
        currentVoice.currentTime = 0;
      }
      
      if (voiceCache[path]) {
        const cached = voiceCache[path];
        cached.volume = volume;
        cached.currentTime = 0;
        currentVoice = cached;
        cached.play().then(resolve).catch(resolve);
      } else {
        const audio = new Audio(path);
        audio.volume = volume;
        audio.preload = 'auto';
        voiceCache[path] = audio;
        currentVoice = audio;
        audio.play().then(resolve).catch(resolve);
      }
    } catch (e) {
      resolve();
    }
  });
}

// Helper: pick random from array with deterministic seed option
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// 🎙️ FEEDBACK VOICES — Galakan & Maklum Balas
// Randomly picks from multiple encouraging phrases
// ============================================

const BM_CORRECT_VOICES = [
  assetPath('/audio/bm/betul.mp3'),
  assetPath('/audio/bm/bagus_sekali.mp3'), 
  assetPath('/audio/bm/bijak.mp3'),
  assetPath('/audio/bm/hebat.mp3'),
  assetPath('/audio/bm/hebat_sangat.mp3'),
  assetPath('/audio/bm/pandainya.mp3'),
  assetPath('/audio/bm/sempurna.mp3'),
  assetPath('/audio/bm/syabas.mp3'),
  assetPath('/audio/bm/tahniah.mp3'),
  assetPath('/audio/bm/tepat_sekali.mp3'),
  assetPath('/audio/bm/terbaik.mp3'),
  assetPath('/audio/bm/wah_pandai.mp3'),
];

const BM_WRONG_VOICES = [
  assetPath('/audio/bm/cuba_lagi.mp3'),
  assetPath('/audio/bm/cuba_lagi_sayang.mp3'),
  assetPath('/audio/bm/hampir_betul.mp3'),
  assetPath('/audio/bm/jangan_putus_asa.mp3'),
  assetPath('/audio/bm/tak_apa_cuba_lagi.mp3'),
  assetPath('/audio/bm/alamak.mp3'),
];

const BM_CELEBRATION_VOICES = [
  assetPath('/audio/bm/tahniah.mp3'),
  assetPath('/audio/bm/hebat_sangat.mp3'),
  assetPath('/audio/bm/sempurna.mp3'),
  assetPath('/audio/bm/terbaik.mp3'),
  assetPath('/audio/bm/wah_pandai.mp3'),
];

// ============================================
// 🐾 ANIMAL SFX — Real animal sound recordings
// ============================================

const BM_ANIMAL_SFX = {
  'kucing': assetPath('/audio/bm/sfx_meow.mp3'),
  'cat': assetPath('/audio/bm/sfx_meow.mp3'),
  'anjing': assetPath('/audio/bm/sfx_woof.mp3'),
  'dog': assetPath('/audio/bm/sfx_woof.mp3'),
  'lembu': assetPath('/audio/bm/sfx_moo.mp3'),
  'cow': assetPath('/audio/bm/sfx_moo.mp3'),
  'ayam': assetPath('/audio/bm/sfx_rooster.mp3'),
  'chicken': assetPath('/audio/bm/sfx_rooster.mp3'),
  'itik': assetPath('/audio/bm/sfx_duck.mp3'), 
  'duck': assetPath('/audio/bm/sfx_duck.mp3'),
  'burung': assetPath('/audio/bm/sfx_bird.mp3'),
  'bird': assetPath('/audio/bm/sfx_bird.mp3'),
  'monyet': assetPath('/audio/bm/sfx_monkey.mp3'),
  'monkey': assetPath('/audio/bm/sfx_monkey.mp3'),
  'gajah': assetPath('/audio/bm/sfx_elephant.mp3'),
  'elephant': assetPath('/audio/bm/sfx_elephant.mp3'),
  'singa': assetPath('/audio/bm/sfx_roar.mp3'),
  'lion': assetPath('/audio/bm/sfx_roar.mp3'),
  'kambing': assetPath('/audio/bm/sfx_baa.mp3'),
  'goat': assetPath('/audio/bm/sfx_baa.mp3'),
  'kuda': assetPath('/audio/bm/sfx_horse.mp3'),
  'horse': assetPath('/audio/bm/sfx_horse.mp3'),
  'khinzir': assetPath('/audio/bm/sfx_pig.mp3'),
  'pig': assetPath('/audio/bm/sfx_pig.mp3'),
  'lebah': assetPath('/audio/bm/sfx_bee.mp3'),
  'bee': assetPath('/audio/bm/sfx_bee.mp3'),
  'burung_hantu': assetPath('/audio/bm/sfx_owl.mp3'),
  'owl': assetPath('/audio/bm/sfx_owl.mp3'),
  'katak': assetPath('/audio/bm/sfx_kwak.mp3'),
  'frog': assetPath('/audio/bm/sfx_kwak.mp3'),
};

// ============================================
// 🎙️ GAME-SPECIFIC VOICE MAP
// Maps game contexts to specific voice files
// ============================================

const BM_VOICE_MAP = {
  // Navigation & Greetings
  'selamat_datang': assetPath('/audio/bm/selamat_datang.mp3'),
  'selamat_pagi': assetPath('/audio/bm/selamat_pagi.mp3'),
  'selamat_petang': assetPath('/audio/bm/selamat_petang.mp3'),
  'selamat_tengah_hari': assetPath('/audio/bm/selamat_tengah_hari.mp3'),
  'jom_main': assetPath('/audio/bm/jom_main.mp3'),
  'jom_belajar': assetPath('/audio/bm/jom_belajar.mp3'),
  'pilih_dunia': assetPath('/audio/bm/pilih_dunia.mp3'),
  'laman_utama': assetPath('/audio/bm/laman_utama.mp3'),
  'kembali': assetPath('/audio/bm/kembali.mp3'),
  'mula': assetPath('/audio/bm/mula.mp3'),
  'siap': assetPath('/audio/bm/siap.mp3'),
  'tamat': assetPath('/audio/bm/tamat.mp3'),
  'main_lagi': assetPath('/audio/bm/main_lagi.mp3'),
  'jom_berehat': assetPath('/audio/bm/jom_berehat.mp3'),
  
  // ABC & Letters
  'cari_huruf': assetPath('/audio/bm/cari_huruf.mp3'),
  'huruf_hilang': assetPath('/audio/bm/huruf_hilang.mp3'),
  'nyanyian_abc': assetPath('/audio/bm/nyanyian_abc.mp3'),
  'bijak_mengeja': assetPath('/audio/bm/bijak_mengeja.mp3'),
  'bina_perkataan': assetPath('/audio/bm/bina_perkataan.mp3'),
  'suku_kata_betul': assetPath('/audio/bm/suku_kata_betul.mp3'),
  'bantu_lebah': assetPath('/audio/bm/bantu_lebah.mp3'),
  
  // Numbers & Math
  'berapa_jumlah': assetPath('/audio/bm/berapa_jumlah.mp3'),
  'bijak_mengira': assetPath('/audio/bm/bijak_mengira.mp3'),
  'kira_benda': assetPath('/audio/bm/kira_benda.mp3'),
  'mana_lebih_banyak': assetPath('/audio/bm/mana_lebih_banyak.mp3'),
  'mesin_matematik': assetPath('/audio/bm/mesin_matematik.mp3'),
  'nombor_cantik': assetPath('/audio/bm/nombor_cantik.mp3'),
  'tahniah_matematik': assetPath('/audio/bm/tahniah_matematik.mp3'),
  'apa_seterusnya': assetPath('/audio/bm/apa_seterusnya.mp3'),
  
  // Shapes & 3D
  'cari_bentuk': assetPath('/audio/bm/cari_bentuk.mp3'),
  'sama_bentuk': assetPath('/audio/bm/sama_bentuk.mp3'),
  'bentuk_3d': assetPath('/audio/bm/bentuk_3d.mp3'),
  'pakar_3d': assetPath('/audio/bm/pakar_3d.mp3'),
  'bulatan': assetPath('/audio/bm/bulatan.mp3'),
  'segi_empat': assetPath('/audio/bm/segi_empat.mp3'),
  'segi_empat_tepat': assetPath('/audio/bm/segi_empat_tepat.mp3'),
  'segi_tiga': assetPath('/audio/bm/segi_tiga.mp3'),
  'pentagon': assetPath('/audio/bm/pentagon.mp3'),
  'berlian': assetPath('/audio/bm/berlian.mp3'),
  'kubus': assetPath('/audio/bm/kubus.mp3'),
  'sfera': assetPath('/audio/bm/sfera.mp3'),
  'silinder': assetPath('/audio/bm/silinder.mp3'),
  'kon': assetPath('/audio/bm/kon.mp3'),
  'piramid': assetPath('/audio/bm/piramid.mp3'),
  'tangram_ajaib': assetPath('/audio/bm/tangram_ajaib.mp3'),
  'pakar_tangram': assetPath('/audio/bm/pakar_tangram.mp3'),
  'bijak_corak': assetPath('/audio/bm/bijak_corak.mp3'),
  'lengkapkan_corak': assetPath('/audio/bm/lengkapkan_corak.mp3'),
  'bijak_membanding': assetPath('/audio/bm/bijak_membanding.mp3'),
  
  // Colors
  'cari_warna': assetPath('/audio/bm/cari_warna.mp3'),
  'padankan_warna': assetPath('/audio/bm/padankan_warna.mp3'),
  'campur_warna': assetPath('/audio/bm/campur_warna.mp3'),
  'warna_baharu': assetPath('/audio/bm/warna_baharu.mp3'),
  'pemburu_warna': assetPath('/audio/bm/pemburu_warna.mp3'),
  'merah': assetPath('/audio/bm/merah.mp3'),
  'biru': assetPath('/audio/bm/biru.mp3'),
  'kuning': assetPath('/audio/bm/kuning.mp3'),
  'hijau': assetPath('/audio/bm/hijau.mp3'),
  'jingga': assetPath('/audio/bm/jingga.mp3'),
  'ungu': assetPath('/audio/bm/ungu.mp3'),
  'merah_jambu': assetPath('/audio/bm/merah_jambu.mp3'),
  'coklat': assetPath('/audio/bm/coklat.mp3'),
  'hitam': assetPath('/audio/bm/hitam.mp3'),
  'putih': assetPath('/audio/bm/putih.mp3'),
  'kelabu': assetPath('/audio/bm/kelabu.mp3'),
  
  // Animals
  'haiwan_bunyi': assetPath('/audio/bm/haiwan_bunyi.mp3'),
  'haiwan_kenyang': assetPath('/audio/bm/haiwan_kenyang.mp3'),
  'pakar_haiwan': assetPath('/audio/bm/pakar_haiwan.mp3'),
  'tiru_haiwan': assetPath('/audio/bm/tiru_haiwan.mp3'),
  'dimana_tinggal': assetPath('/audio/bm/dimana_tinggal.mp3'),
  'apa_makanan': assetPath('/audio/bm/apa_makanan.mp3'),
  'kucing': assetPath('/audio/bm/kucing.mp3'),
  'anjing': assetPath('/audio/bm/anjing.mp3'),
  'lembu': assetPath('/audio/bm/lembu.mp3'),
  'ayam': assetPath('/audio/bm/ayam.mp3'),
  'ayam_jantan': assetPath('/audio/bm/ayam_jantan.mp3'),
  'itik': assetPath('/audio/bm/itik.mp3'),
  'ikan': assetPath('/audio/bm/ikan.mp3'),
  'arnab': assetPath('/audio/bm/arnab.mp3'),
  'burung': assetPath('/audio/bm/burung.mp3'),
  'burung_hantu': assetPath('/audio/bm/burung_hantu.mp3'),
  'rama_rama': assetPath('/audio/bm/rama_rama.mp3'),
  'lebah': assetPath('/audio/bm/lebah.mp3'),
  'monyet': assetPath('/audio/bm/monyet.mp3'),
  'gajah': assetPath('/audio/bm/gajah.mp3'),
  'singa': assetPath('/audio/bm/singa.mp3'),
  'beruang': assetPath('/audio/bm/beruang.mp3'),
  'ular': assetPath('/audio/bm/ular.mp3'),
  'kambing': assetPath('/audio/bm/kambing.mp3'),
  'kambing_biribiri': assetPath('/audio/bm/kambing_biribiri.mp3'),
  'katak': assetPath('/audio/bm/katak.mp3'),
  'khinzir': assetPath('/audio/bm/babi.mp3'),
  'helang': assetPath('/audio/bm/helang.mp3'),
  'merak': assetPath('/audio/bm/merak.mp3'),
  'penguin': assetPath('/audio/bm/penguin.mp3'),
  'penyu': assetPath('/audio/bm/penyu.mp3'),
  'lumba_lumba': assetPath('/audio/bm/lumba_lumba.mp3'),
  'sotong': assetPath('/audio/bm/sotong.mp3'),
  'hayun_belalai': assetPath('/audio/bm/hayun_belalai.mp3'),
  'mengaum': assetPath('/audio/bm/mengaum.mp3'),
  'mengeong': assetPath('/audio/bm/mengeong.mp3'),
  'menyalak': assetPath('/audio/bm/menyalak.mp3'),
  'singa_menari': assetPath('/audio/bm/singa_menari.mp3'),
  
  // Body Parts
  'label_badan': assetPath('/audio/bm/label_badan.mp3'),
  'lagu_badan': assetPath('/audio/bm/lagu_badan.mp3'),
  'kepala': assetPath('/audio/bm/kepala.mp3'),
  'mata': assetPath('/audio/bm/mata.mp3'),
  'hidung': assetPath('/audio/bm/hidung.mp3'),
  'mulut': assetPath('/audio/bm/mulut.mp3'),
  'telinga': assetPath('/audio/bm/telinga.mp3'),
  'tangan': assetPath('/audio/bm/tangan.mp3'),
  'kaki': assetPath('/audio/bm/kaki.mp3'),
  'bahu': assetPath('/audio/bm/bahu.mp3'),
  'lutut': assetPath('/audio/bm/lutut.mp3'),
  'jari_kaki': assetPath('/audio/bm/jari_kaki.mp3'),
  'sentuh_jari': assetPath('/audio/bm/sentuh_jari.mp3'),
  
  // Health & Hygiene
  'doktor_kecil': assetPath('/audio/bm/doktor_kecil.mp3'),
  'doktor_hebat': assetPath('/audio/bm/doktor_hebat.mp3'),
  'periksa_pesakit': assetPath('/audio/bm/periksa_pesakit.mp3'),
  'badan_sihat': assetPath('/audio/bm/badan_sihat.mp3'),
  'tabiat_sihat': assetPath('/audio/bm/tabiat_sihat.mp3'),
  'basuh_tangan': assetPath('/audio/bm/basuh_tangan.mp3'),
  'gosok_gigi': assetPath('/audio/bm/gosok_gigi.mp3'),
  'mandi': assetPath('/audio/bm/mandi.mp3'),
  'makan': assetPath('/audio/bm/makan.mp3'),
  'tidur': assetPath('/audio/bm/tidur.mp3'),
  'batuk': assetPath('/audio/bm/batuk.mp3'),
  'demam': assetPath('/audio/bm/demam.mp3'),
  'sakit_perut': assetPath('/audio/bm/sakit_perut.mp3'),
  'sakit_tekak': assetPath('/audio/bm/sakit_tekak.mp3'),
  'kaki_luka': assetPath('/audio/bm/kaki_luka.mp3'),
  
  // Activities & Actions
  'angkat_tangan': assetPath('/audio/bm/angkat_tangan.mp3'),
  'tepuk_tangan': assetPath('/audio/bm/tepuk_tangan.mp3'),
  'lompat': assetPath('/audio/bm/lompat.mp3'),
  'lompat_tinggi': assetPath('/audio/bm/lompat_tinggi.mp3'),
  'pusing_badan': assetPath('/audio/bm/pusing_badan.mp3'),
  'geleng_kepala': assetPath('/audio/bm/geleng_kepala.mp3'),
  'berjalan_goyang': assetPath('/audio/bm/berjalan_goyang.mp3'),
  'ikut_gerakan': assetPath('/audio/bm/ikut_gerakan.mp3'),
  'ketuk_gelembung': assetPath('/audio/bm/ketuk_gelembung.mp3'),
  
  // Building & Construction
  'menara_blok': assetPath('/audio/bm/menara_blok.mp3'),
  'arkitek_hebat': assetPath('/audio/bm/arkitek_hebat.mp3'),
  
  // Music
  'pandai_nyanyi': assetPath('/audio/bm/pandai_nyanyi.mp3'),
  
  // Safety
  'kedai_tutup': assetPath('/audio/bm/kedai_tutup.mp3'),
  'ensaiklopedia': assetPath('/audio/bm/ensaiklopedia.mp3'),
};

// ============================================
// 🎙️ PUBLIC VOICE API
// ============================================

/**
 * Play any BM voice clip by key name
 * @param {string} key - Voice key from BM_VOICE_MAP (e.g., 'selamat_datang', 'betul')
 * @param {number} volume - Volume 0-1 (default 0.85)
 */
export function playBMVoice(key, volume = 0.85) {
  const path = BM_VOICE_MAP[key];
  if (path) playMP3(path, volume);
}

/**
 * Play a random correct feedback voice
 * Also plays the SFX correct chime first
 */
export function playBMCorrectFeedback() {
  playBuffer('correct', 0.7);
  setTimeout(() => {
    playMP3(pickRandom(BM_CORRECT_VOICES), 0.9);
  }, 350);
}

/**
 * Play a random wrong feedback voice
 * Also plays the SFX wrong sound first
 */
export function playBMWrongFeedback() {
  playBuffer('wrong', 0.6);
  setTimeout(() => {
    playMP3(pickRandom(BM_WRONG_VOICES), 0.9);
  }, 300);
}

/**
 * Play celebration voice with fanfare
 */
export function playBMCelebration() {
  playBuffer('celebration', 0.8);
  setTimeout(() => {
    playMP3(pickRandom(BM_CELEBRATION_VOICES), 0.95);
  }, 500);
}

/**
 * Play animal sound effect by animal name
 * @param {string} animal - Animal name in BM or EN (e.g., 'kucing', 'cat')
 */
export function playBMAnimalSfx(animal) {
  const key = animal.toLowerCase().replace(/\s+/g, '_');
  const path = BM_ANIMAL_SFX[key];
  if (path) playMP3(path, 0.9);
}

/**
 * Play animal name voice (says the animal name in BM)
 * @param {string} animal - Animal key (e.g., 'kucing', 'anjing')
 */
export function playBMAnimalName(animal) {
  const key = animal.toLowerCase().replace(/\s+/g, '_');
  const path = BM_VOICE_MAP[key];
  if (path) playMP3(path, 0.85);
}

/**
 * Play a body part name
 * @param {string} part - Body part key (e.g., 'kepala', 'mata')
 */
export function playBMBodyPart(part) {
  const key = part.toLowerCase().replace(/\s+/g, '_');
  const path = BM_VOICE_MAP[key];
  if (path) playMP3(path, 0.85);
}

/**
 * Play a color name voice
 * @param {string} color - Color key (e.g., 'merah', 'biru')
 */
export function playBMColor(color) {
  const key = color.toLowerCase().replace(/\s+/g, '_');
  const path = BM_VOICE_MAP[key];
  if (path) playMP3(path, 0.85);
}

/**
 * Play a shape name voice
 * @param {string} shape - Shape key (e.g., 'bulatan', 'segi_tiga')
 */
export function playBMShape(shape) {
  const key = shape.toLowerCase().replace(/\s+/g, '_');
  const path = BM_VOICE_MAP[key];
  if (path) playMP3(path, 0.85);
}

/**
 * Play "Selamat Datang" welcome audio — called ONCE on login/register
 * Only plays selamat_datang.mp3 (no follow-up to avoid clash)
 */
export function playSelamatDatang() {
  playMP3(assetPath('/audio/bm/selamat_datang.mp3'), 0.95);
}

/**
 * Play a time-appropriate greeting
 */
export function playBMGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) playMP3(assetPath('/audio/bm/selamat_pagi.mp3'), 0.9);
  else if (hour < 15) playMP3(assetPath('/audio/bm/selamat_tengah_hari.mp3'), 0.9);
  else playMP3(assetPath('/audio/bm/selamat_petang.mp3'), 0.9);
}

/**
 * Preload critical voice files for instant playback
 * Call this on first user interaction alongside initAudio()
 */
export function preloadBMVoices() {
  const criticalPaths = [
    ...BM_CORRECT_VOICES,
    ...BM_WRONG_VOICES,
    assetPath('/audio/bm/selamat_datang.mp3'),
    assetPath('/audio/bm/jom_main.mp3'),
    assetPath('/audio/bm/pilih_dunia.mp3'),
    assetPath('/audio/bm/tamat.mp3'),
    assetPath('/audio/bm/main_lagi.mp3'),
  ];
  
  criticalPaths.forEach(path => {
    if (!voiceCache[path]) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = path;
      voiceCache[path] = audio;
    }
  });
}

// Legacy compatibility — now wired to real voices
export function speak(key) { playBMVoice(key); }
export function speakAnimalSound(animal) { playBMAnimalSfx(animal); }
export function speakWord(word) { playBMVoice(word); }
export function speakEncouragement() { playBMCorrectFeedback(); }
