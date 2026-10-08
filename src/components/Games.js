'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '@/stores/gameStore';
import { assetPath } from '@/utils/assetPath';
import { WORLDS, GUIDES, LETTERS, BUBBLE_COLORS } from '@/data/gameData';
import { t, getRandomEncouragement, getRandomWrongResponse } from '@/data/translations';
import { StarIcon, CheckIcon, RefreshIcon, TrophyIcon, SparkleIcon, CloseIcon } from '@/components/Icons';
import { GI } from '@/components/GameIcon';
import { playCorrectSound, playWrongSound, playTapSound, playCelebrationSound, playStarSound, playAnimalHint, playRevealSound, playNewRoundSound, playBlockPlaceSound, playMixSound, playNavigateSound, playBMVoice, playBMCorrectFeedback, playBMWrongFeedback, playBMCelebration, playBMAnimalSfx, playBMAnimalName, playBMBodyPart, playBMColor, playBMShape, playBMGreeting, preloadBMVoices, initAudio } from '@/utils/audio';

// Stable shuffle — Fisher-Yates with seed derived from key
// Prevents choices from jumping around on re-render!
function shuffleWithSeed(arr, seed) {
  const result = [...arr];
  let s = typeof seed === 'number' ? seed : String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Audio-enhanced feedback helpers — premium SFX + BM voice
function correctFeedback(lang, soundEnabled = true) {
  const msg = getRandomEncouragement(lang);
  if (soundEnabled) {
    if (lang === 'bm') {
      playBMCorrectFeedback();
    } else {
      playCorrectSound();
    }
  }
  return msg;
}

function wrongFeedback(lang, soundEnabled = true) {
  const msg = getRandomWrongResponse(lang);
  if (soundEnabled) {
    if (lang === 'bm') {
      playBMWrongFeedback();
    } else {
      playWrongSound();
    }
  }
  return msg;
}

function celebrationFeedback(lang, soundEnabled = true) {
  if (soundEnabled) {
    if (lang === 'bm') {
      playBMCelebration();
    } else {
      playCelebrationSound();
    }
  }
}


// ============================================
// LETTER BUBBLE GARDEN (Taman Huruf Ajaib)
// Pop the correct letter bubble! Beautiful floating
// rainbow bubbles with letters inside — no ugly tree!
// Research-backed: Bubble-pop mechanic is proven most
// engaging for toddlers (1-6 years). Large touch targets,
// satisfying pop animation, progressive difficulty.
// ============================================
export function LetterTreeGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 15;
  const BUBBLES_PER_ROUND = 6;

  // Beautiful gradient color pairs for bubbles
  const BUBBLE_STYLES = [
    { bg: 'linear-gradient(135deg, #FF9A9E, #FAD0C4)', border: '#FF6B9D', shadow: 'rgba(255,107,157,0.3)' },
    { bg: 'linear-gradient(135deg, #A18CD1, #FBC2EB)', border: '#9B72CF', shadow: 'rgba(155,114,207,0.3)' },
    { bg: 'linear-gradient(135deg, #FAD961, #F76B1C)', border: '#FFB347', shadow: 'rgba(250,217,97,0.3)' },
    { bg: 'linear-gradient(135deg, #84FAB0, #8FD3F4)', border: '#6BCB77', shadow: 'rgba(107,203,119,0.3)' },
    { bg: 'linear-gradient(135deg, #A6C0FE, #F68084)', border: '#7B9EFF', shadow: 'rgba(123,158,255,0.3)' },
    { bg: 'linear-gradient(135deg, #FDCBF1, #E6DEE9)', border: '#F0A6CA', shadow: 'rgba(240,166,202,0.3)' },
    { bg: 'linear-gradient(135deg, #FFE985, #FA742B)', border: '#FFC107', shadow: 'rgba(255,193,7,0.3)' },
    { bg: 'linear-gradient(135deg, #96FBC4, #F9F586)', border: '#81C784', shadow: 'rgba(129,199,132,0.3)' },
    { bg: 'linear-gradient(135deg, #F5576C, #FF6B9D)', border: '#E91E63', shadow: 'rgba(233,30,99,0.3)' },
    { bg: 'linear-gradient(135deg, #4FC3F7, #0288D1)', border: '#29B6F6', shadow: 'rgba(41,182,246,0.3)' },
  ];

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetLetter, setTargetLetter] = useState('');
  const [bubbles, setBubbles] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [popEffect, setPopEffect] = useState(null);
  const [bubbleOffsets, setBubbleOffsets] = useState({});
  const animFrameRef = useRef(null);
  const driftDataRef = useRef({});

  // Gentle floating animation — bubbles drift dreamily
  useEffect(() => {
    let lastTime = performance.now();
    const drift = driftDataRef.current;

    bubbles.forEach(b => {
      if (!drift[b.id]) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 6 + Math.random() * 10;
        drift[b.id] = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          ox: 0, oy: 0,
          bobPhase: Math.random() * Math.PI * 2,
        };
      }
    });

    function tick(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const newOffsets = {};
      const BOUND = 20;

      bubbles.forEach(b => {
        if (b.popped) return;
        const d = drift[b.id];
        if (!d) return;

        d.ox += d.vx * dt;
        d.oy += d.vy * dt;
        d.bobPhase += dt * 2;

        // Gentle bob up and down
        const bob = Math.sin(d.bobPhase) * 4;

        if (Math.abs(d.ox) > BOUND) { d.vx *= -1; d.ox = Math.sign(d.ox) * BOUND; }
        if (Math.abs(d.oy) > BOUND) { d.vy *= -1; d.oy = Math.sign(d.oy) * BOUND; }

        if (Math.random() < 0.003) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 6 + Math.random() * 10;
          d.vx = Math.cos(angle) * speed;
          d.vy = Math.sin(angle) * speed;
        }

        newOffsets[b.id] = { x: d.ox, y: d.oy + bob };
      });

      setBubbleOffsets(prev => ({ ...prev, ...newOffsets }));
      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [bubbles]);

  const generateRound = useCallback((roundNum) => {
    driftDataRef.current = {};
    setBubbleOffsets({});
    setPopEffect(null);
    const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setTargetLetter(target);

    const wrongLetters = LETTERS.filter(l => l !== target)
      .sort(() => Math.random() - 0.5)
      .slice(0, BUBBLES_PER_ROUND - 1);
    const allLetters = [target, ...wrongLetters].sort(() => Math.random() - 0.5);

    // Spread bubbles across the play area — well-spaced grid with jitter
    const cols = 3;
    const rows = 2;
    const positions = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push({
          x: 8 + (c * 32) + (Math.random() * 12 - 6),
          y: 18 + (r * 30) + (Math.random() * 8 - 4),
        });
      }
    }
    const shuffledPos = positions.sort(() => Math.random() - 0.5);

    const newBubbles = allLetters.map((letter, i) => ({
      id: `${roundNum}-${i}`,
      letter,
      isTarget: letter === target,
      style: BUBBLE_STYLES[Math.floor(Math.random() * BUBBLE_STYLES.length)],
      x: shuffledPos[i % shuffledPos.length].x,
      y: shuffledPos[i % shuffledPos.length].y,
      popped: false,
      wrong: false,
      scale: 0.85 + Math.random() * 0.3,
    }));
    setBubbles(newBubbles);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleBubbleTap = (bubble) => {
    if (bubble.popped || feedback?.type === 'correct') return;

    if (bubble.isTarget) {
      setScore(prev => prev + 10);
      setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, popped: true } : b));
      setPopEffect({ x: bubble.x + 5, y: bubble.y + 3 });
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        setPopEffect(null);
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 120 ? 3 : finalScore >= 70 ? 2 : 1;
          completeGame('abc', 'letter-tree', stars, finalScore);
          setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
          spawnConfetti();
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1200);
    } else {
      setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, wrong: true } : b));
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => {
        setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, wrong: false } : b));
        setFeedback(null);
      }, 800);
    }
  };

  const spawnConfetti = () => {
    const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF', '#FF8C42'];
    setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
      id: i, left: Math.random() * 100, color: colors[i % colors.length],
      delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
    })));
  };

  const getStars = () => score >= 120 ? 3 : score >= 70 ? 2 : 1;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('abc')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Taman Huruf Ajaib' : 'Magic Letter Garden'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body" style={{ padding: 0 }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          background: 'linear-gradient(180deg, #E8F5FE 0%, #F3E5F5 30%, #FFF8E1 60%, #E8F5E9 100%)',
          borderRadius: 0, overflow: 'hidden',
        }}>
          {/* Decorative floating sparkles — hidden on complete */}
          {!gameComplete && [...Array(12)].map((_, i) => (
            <div key={`sparkle-${i}`} style={{
              position: 'absolute',
              left: `${8 + (i * 8)}%`,
              top: `${10 + (i % 3) * 30}%`,
              width: 6 + (i % 4) * 2,
              height: 6 + (i % 4) * 2,
              borderRadius: '50%',
              background: ['#FFD93D', '#FF6B9D', '#A18CD1', '#84FAB0', '#4FC3F7'][i % 5],
              opacity: 0.3,
              animation: `sparkleFloat ${3 + (i % 3)}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.3}s`,
            }} />
          ))}

          {/* Top HUD — stacked vertically so nothing overlaps */}
          {!gameComplete && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 12px', gap: 6,
            }}>
              {/* Row 1: Round + Score */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', width: '100%',
                alignItems: 'center',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.9)', borderRadius: 50,
                  padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700,
                  fontFamily: 'var(--font-heading)', color: '#666',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  {t('round', lang)} {round}/{TOTAL_ROUNDS}
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.9)', borderRadius: 50,
                  padding: '4px 14px', fontSize: '0.85rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#60A5FA"><path d="M6 3l-6 8 12 11L24 11l-6-8H6z"/></svg>
                  <span style={{ color: '#333', fontFamily: 'var(--font-heading)' }}>{score}</span>
                </div>
              </div>

              {/* Row 2: Instruction banner */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(12px)',
                padding: '8px 20px',
                borderRadius: 50,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: 'clamp(0.85rem, 2.5vw, 1.15rem)',
                display: 'flex', alignItems: 'center', gap: 6,
                flexWrap: 'wrap', justifyContent: 'center',
              }}>
                {lang === 'bm' ? 'Cari huruf' : 'Find letter'}{' '}
                <span style={{
                  color: '#E91E63', fontSize: '1.5em', fontWeight: 900,
                  textShadow: '0 2px 8px rgba(233,30,99,0.3)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  lineHeight: 1,
                }}>{targetLetter}</span>
              </div>
            </div>
          )}

          {/* Floating letter bubbles — hidden on complete */}
          {!gameComplete && bubbles.map(bubble => {
            const off = bubbleOffsets[bubble.id] || { x: 0, y: 0 };
            const isActive = !bubble.popped && !bubble.wrong;
            const sz = Math.round(80 * bubble.scale);
            return (
              <div
                key={bubble.id}
                onClick={() => handleBubbleTap(bubble)}
                style={{
                  position: 'absolute',
                  left: `${bubble.x}%`, top: `${bubble.y}%`,
                  transform: isActive
                    ? `translate(${off.x}px, ${off.y}px) scale(${bubble.scale})`
                    : bubble.popped ? 'scale(0)' : `scale(${bubble.scale})`,
                  width: sz, height: sz,
                  background: bubble.popped ? 'transparent' : bubble.style.bg,
                  borderRadius: '50%',
                  border: bubble.popped ? 'none' : `3px solid ${bubble.style.border}`,
                  display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: bubble.popped ? 'none'
                    : `0 8px 25px ${bubble.style.shadow}, inset 0 -4px 8px rgba(0,0,0,0.05), inset 0 4px 12px rgba(255,255,255,0.4)`,
                  cursor: bubble.popped ? 'default' : 'pointer',
                  transition: bubble.wrong ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                  animationName: bubble.wrong ? 'bubbleShake' : 'none',
                  animationDuration: '0.5s',
                  opacity: bubble.popped ? 0 : 1,
                  zIndex: 5,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Bubble shine highlight */}
                {!bubble.popped && (
                  <div style={{
                    position: 'absolute', top: '12%', left: '18%',
                    width: '28%', height: '20%',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.6)',
                    transform: 'rotate(-30deg)',
                    pointerEvents: 'none',
                  }} />
                )}
                <span style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 900,
                  fontSize: `${Math.round(sz * 0.45)}px`,
                  color: 'white',
                  textShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}>{bubble.letter}</span>
              </div>
            );
          })}

          {/* Pop sparkle effect */}
          {popEffect && (
            <div style={{
              position: 'absolute', left: `${popEffect.x}%`, top: `${popEffect.y}%`,
              zIndex: 30, pointerEvents: 'none',
            }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: ['#FFD93D', '#FF6B9D', '#6BCB77', '#A18CD1', '#4FC3F7', '#FF8C42', '#F5576C', '#84FAB0'][i],
                  animation: 'popSparkle 0.6s ease-out forwards',
                  animationDelay: `${i * 0.03}s`,
                  transform: `rotate(${i * 45}deg) translateY(-20px)`,
                }} />
              ))}
            </div>
          )}

          {/* Feedback toast */}
          {feedback && (
            <div style={{
              position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
              zIndex: 20,
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', padding: '12px 28px', borderRadius: 50,
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem',
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              {feedback.type === 'correct' ? '🎉 ' : ''}{feedback.message}
            </div>
          )}

          {/* Decorative ground — soft grass with flowers */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 30,
            background: 'linear-gradient(0deg, #81C784 0%, #A5D6A7 50%, transparent 100%)',
            zIndex: 0,
          }} />
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="#E91E63"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('abc')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// BEE FLOWER GARDEN (Taman Lebah Ajaib)
// Match uppercase to lowercase! A cute kawaii bee
// flies to the correct flower. Beautiful CSS gradient
// flowers instead of emoji. Research-backed: character-
// driven letter matching is proven most effective for
// toddlers 1-6 (multi-sensory: visual + spatial).
// ============================================
export function BeeFlowerGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 15;
  const FLOWERS_PER_ROUND = 4;

  // Beautiful gradient flower petal styles (no emoji!)
  const FLOWER_STYLES = [
    { petals: '#FF9A9E', center: '#FFECD2', glow: 'rgba(255,154,158,0.4)' },
    { petals: '#A18CD1', center: '#FBC2EB', glow: 'rgba(161,140,209,0.4)' },
    { petals: '#84FAB0', center: '#F9F586', glow: 'rgba(132,250,176,0.4)' },
    { petals: '#FF6B9D', center: '#FFD93D', glow: 'rgba(255,107,157,0.4)' },
    { petals: '#4FC3F7', center: '#E1F5FE', glow: 'rgba(79,195,247,0.4)' },
    { petals: '#FFB347', center: '#FFF8E1', glow: 'rgba(255,179,71,0.4)' },
    { petals: '#E040FB', center: '#F3E5F5', glow: 'rgba(224,64,251,0.4)' },
    { petals: '#66BB6A', center: '#F1F8E9', glow: 'rgba(102,187,106,0.4)' },
  ];

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetUpper, setTargetUpper] = useState('');
  const [flowers, setFlowers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [beePos, setBeePos] = useState({ x: 50, y: 5 });
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [beeFlying, setBeeFlying] = useState(false);
  const [honeyDrop, setHoneyDrop] = useState(null);

  const generateRound = useCallback((roundNum) => {
    const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setTargetUpper(target);
    setBeePos({ x: 40 + Math.random() * 20, y: 22 });
    setBeeFlying(false);
    setHoneyDrop(null);

    const wrongLetters = LETTERS.filter(l => l !== target)
      .sort(() => Math.random() - 0.5)
      .slice(0, FLOWERS_PER_ROUND - 1);
    const allLetters = [target, ...wrongLetters].sort(() => Math.random() - 0.5);

    // Position flowers evenly across the bottom garden area
    const spacing = 85 / FLOWERS_PER_ROUND;
    const newFlowers = allLetters.map((letter, i) => ({
      id: `${roundNum}-${i}`,
      upperLetter: letter,
      lowerLetter: letter.toLowerCase(),
      isTarget: letter === target,
      style: FLOWER_STYLES[Math.floor(Math.random() * FLOWER_STYLES.length)],
      x: 5 + i * spacing + Math.random() * 4,
      stemHeight: 50 + Math.random() * 30,
      matched: false,
      wrong: false,
      petalCount: 5 + Math.floor(Math.random() * 3),
    }));
    setFlowers(newFlowers);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleFlowerTap = (flower) => {
    if (flower.matched || feedback?.type === 'correct') return;

    if (flower.isTarget) {
      setBeeFlying(true);
      setBeePos({ x: flower.x + 5, y: 55 });
      setScore(prev => prev + 10);
      setFlowers(prev => prev.map(f => f.id === flower.id ? { ...f, matched: true } : f));
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });
      setHoneyDrop({ x: flower.x + 6, y: 50 });

      setTimeout(() => {
        setHoneyDrop(null);
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 120 ? 3 : finalScore >= 70 ? 2 : 1;
          completeGame('abc', 'bee-flower', stars, finalScore);
          setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
          spawnConfetti();
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1500);
    } else {
      setFlowers(prev => prev.map(f => f.id === flower.id ? { ...f, wrong: true } : f));
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => {
        setFlowers(prev => prev.map(f => f.id === flower.id ? { ...f, wrong: false } : f));
        setFeedback(null);
      }, 800);
    }
  };

  const spawnConfetti = () => {
    const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF'];
    setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
      id: i, left: Math.random() * 100, color: colors[i % colors.length],
      delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
    })));
  };

  const getStars = () => score >= 120 ? 3 : score >= 70 ? 2 : 1;

  // CSS gradient flower petals renderer — bigger & more visible
  const renderFlower = (flower) => {
    const petalSize = 30;
    const petals = [];
    for (let i = 0; i < flower.petalCount; i++) {
      const angle = (360 / flower.petalCount) * i;
      petals.push(
        <div key={i} style={{
          position: 'absolute',
          width: petalSize, height: petalSize * 1.4,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${flower.style.petals}, ${flower.style.center})`,
          transform: `rotate(${angle}deg) translateY(-${petalSize * 0.7}px)`,
          transformOrigin: 'center bottom',
          opacity: 0.95,
          boxShadow: `0 3px 10px ${flower.style.glow}`,
        }} />
      );
    }
    return petals;
  };

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('abc')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Taman Lebah Ajaib' : 'Magic Bee Garden'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body" style={{ padding: 0 }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          borderRadius: 0, overflow: 'hidden',
        }}>
          {/* Garden background */}
          <img src={assetPath('/images/game/bee_garden_bg.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
          }} />

          {/* Top HUD — stacked vertically, mobile-safe */}
          {!gameComplete && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 12px', gap: 6,
            }}>
              {/* Row 1: Round + Score */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', width: '100%',
                alignItems: 'center',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.9)', borderRadius: 50,
                  padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700,
                  fontFamily: 'var(--font-heading)', color: '#666',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  {t('round', lang)} {round}/{TOTAL_ROUNDS}
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.9)', borderRadius: 50,
                  padding: '4px 14px', fontSize: '0.85rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span style={{ color: '#333', fontFamily: 'var(--font-heading)' }}>{score}</span>
                </div>
              </div>

              {/* Row 2: Instruction with uppercase → lowercase */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(12px)',
                padding: '8px 20px',
                borderRadius: 50,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
                display: 'flex', alignItems: 'center', gap: 6,
                flexWrap: 'wrap', justifyContent: 'center',
              }}>
                {lang === 'bm' ? 'Cari huruf kecil' : 'Find lowercase'}{' '}
                <span style={{
                  color: '#1976D2', fontSize: '1.4em', fontWeight: 900,
                }}>{targetUpper}</span>
                <span style={{ color: '#999', fontSize: '1.2em' }}>→</span>
                <span style={{
                  color: '#9C27B0', fontSize: '1.4em', fontWeight: 900,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>{targetUpper.toLowerCase()}</span>
              </div>
            </div>
          )}

          {/* Cute Bee Character — real image! */}
          {!gameComplete && (
            <div style={{
              position: 'absolute',
              left: `${beePos.x}%`, top: `${beePos.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 90, height: 90,
              zIndex: 15,
              transition: beeFlying ? 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
              animation: beeFlying ? 'none' : 'characterBob 2s ease-in-out infinite',
              filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.2))',
            }}>
              <img src={assetPath('/images/game/cute_bee.jpg')} alt="Bee" style={{
                width: '100%', height: '100%', objectFit: 'contain',
                borderRadius: '50%',
              }} />
              {/* Letter card the bee is showing */}
              <div style={{
                position: 'absolute', bottom: -10, right: -10,
                width: 36, height: 36, borderRadius: 10,
                background: 'white',
                border: '3px solid #FFD93D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading)', fontWeight: 900,
                fontSize: '1.1rem', color: '#1976D2',
                boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
              }}>
                {targetUpper}
              </div>
            </div>
          )}

          {/* Honey drop animation when correct */}
          {honeyDrop && (
            <div style={{
              position: 'absolute', left: `${honeyDrop.x}%`, top: `${honeyDrop.y}%`,
              zIndex: 30, pointerEvents: 'none',
            }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: 10, height: 10,
                  borderRadius: '50%',
                  background: '#FFD93D',
                  animation: 'popSparkle 0.8s ease-out forwards',
                  animationDelay: `${i * 0.05}s`,
                  transform: `rotate(${i * 72}deg) translateY(-20px)`,
                  boxShadow: '0 0 6px rgba(255,217,61,0.6)',
                }} />
              ))}
            </div>
          )}

          {/* Beautiful CSS Gradient Flowers */}
          {!gameComplete && flowers.map((flower, idx) => (
            <div
              key={flower.id}
              onClick={() => handleFlowerTap(flower)}
              style={{
                position: 'absolute',
                left: `${flower.x}%`, bottom: '12%',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: flower.matched ? 'default' : 'pointer',
                zIndex: 5,
                animation: flower.wrong ? 'bubbleShake 0.5s ease' : flower.matched ? 'none' : `float ${3 + idx * 0.4}s ease-in-out infinite`,
                opacity: flower.matched ? 0.4 : 1,
                transition: 'opacity 0.5s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Flower head — CSS gradient petals around center */}
              <div style={{
                width: 100, height: 100, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Petals */}
                {renderFlower(flower)}
                {/* Center with letter */}
                <div style={{
                  position: 'relative', zIndex: 2,
                  width: 50, height: 50, borderRadius: '50%',
                  background: flower.matched
                    ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                    : `radial-gradient(circle, ${flower.style.center}, white)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: flower.matched
                    ? '0 0 16px rgba(107,203,119,0.5)'
                    : `0 6px 20px ${flower.style.glow}, 0 0 30px rgba(255,255,255,0.5)`,
                  border: flower.matched ? '3px solid #4CAF50' : '3px solid rgba(255,255,255,0.9)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-heading)', fontWeight: 900,
                    fontSize: '1.4rem',
                    color: flower.matched ? 'white' : '#333',
                  }}>
                    {flower.lowerLetter}
                  </span>
                </div>
              </div>
              {/* Stem */}
              <div style={{
                width: 4, height: flower.stemHeight,
                background: 'linear-gradient(180deg, #66BB6A, #388E3C)',
                borderRadius: 2,
              }} />
              {/* Leaf */}
              <div style={{
                position: 'absolute', bottom: flower.stemHeight * 0.3,
                left: idx % 2 === 0 ? -10 : 'auto',
                right: idx % 2 !== 0 ? -10 : 'auto',
                width: 18, height: 10,
                borderRadius: idx % 2 === 0 ? '0 50% 50% 0' : '50% 0 0 50%',
                background: 'linear-gradient(135deg, #81C784, #4CAF50)',
                transform: `rotate(${idx % 2 === 0 ? -15 : 15}deg)`,
              }} />
            </div>
          ))}

          {/* Feedback toast */}
          {feedback && (
            <div style={{
              position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
              zIndex: 20,
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', padding: '10px 24px', borderRadius: 50,
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem',
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              {feedback.type === 'correct' ? '🍯 ' : ''}{feedback.message}
            </div>
          )}

          {/* Soft grass overlay at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 30,
            background: 'linear-gradient(0deg, rgba(34,139,34,0.6) 0%, rgba(50,205,50,0.3) 50%, transparent 100%)',
            zIndex: 0,
          }} />
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="#F59E0B"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('abc')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// COUNT OBJECTS GAME (Kira Benda)
// Count the cute objects on screen!
// ============================================
export function CountObjectsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 15;
  const OBJECT_SETS = [
    { emoji: '🐱', image: assetPath('/animals/cat.jpg'), nameBm: 'kucing', nameEn: 'cats' },
    { emoji: '🐶', image: assetPath('/animals/dog.jpg'), nameBm: 'anjing', nameEn: 'dogs' },
    { emoji: '🦋', image: assetPath('/animals/butterfly.jpg'), nameBm: 'rama-rama', nameEn: 'butterflies' },
    { emoji: '🐠', image: assetPath('/animals/fish.jpg'), nameBm: 'ikan', nameEn: 'fish' },
    { emoji: '🌺', nameBm: 'bunga', nameEn: 'flowers' },
    { emoji: '⭐', nameBm: 'bintang', nameEn: 'stars' },
    { emoji: '🍎', nameBm: 'epal', nameEn: 'apples' },
    { emoji: '🐸', image: assetPath('/animals/frog.jpg'), nameBm: 'katak', nameEn: 'frogs' },
    { emoji: '🐣', image: assetPath('/animals/rooster.jpg'), nameBm: 'anak ayam', nameEn: 'chicks' },
    { emoji: '🐝', image: assetPath('/animals/bee.jpg'), nameBm: 'lebah', nameEn: 'bees' },
  ];

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [objects, setObjects] = useState([]);
  const [objectInfo, setObjectInfo] = useState(OBJECT_SETS[0]);
  const [choices, setChoices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  const generateRound = useCallback((roundNum) => {
    const count = 1 + Math.floor(Math.random() * 9); // 1-9
    const objSet = OBJECT_SETS[Math.floor(Math.random() * OBJECT_SETS.length)];
    setCorrectCount(count);
    setObjectInfo(objSet);

    const objs = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 75,
      y: 10 + Math.random() * 70,
      delay: i * 0.15,
      size: 35 + Math.random() * 15,
    }));
    setObjects(objs);

    const wrongAnswers = new Set();
    while (wrongAnswers.size < 3) {
      const w = 1 + Math.floor(Math.random() * 9);
      if (w !== count) wrongAnswers.add(w);
    }
    const allChoices = [count, ...wrongAnswers].sort(() => Math.random() - 0.5);
    setChoices(allChoices);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleAnswer = (num) => {
    if (feedback) return;

    if (num === correctCount) {
      setScore(prev => prev + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
          completeGame('numbers', 'count-objects', stars, finalScore);
          setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
          const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF'];
          setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
            id: i, left: Math.random() * 100, color: colors[i % colors.length],
            delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
          })));
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const getStars = () => score >= 70 ? 3 : score >= 40 ? 2 : 1;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('numbers')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Kira Benda' : 'Count Objects'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body" style={{ padding: 0 }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          borderRadius: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <img src={assetPath('/images/game/counting_classroom.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.3,
          }} />
          {/* Instruction */}
          <div style={{
            textAlign: 'center', padding: 'var(--space-lg) var(--space-md) var(--space-sm)',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem',
            color: 'var(--text-primary)', zIndex: 10,
          }}>
            {lang === 'bm' ? `Berapa banyak ${objectInfo.nameBm}?` : `How many ${objectInfo.nameEn}?`}
          </div>

          {/* Round & Score */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 var(--space-lg)' }}>
            <div className="round-counter" style={{ position: 'static' }}>
              {t('round', lang)} {round}/{TOTAL_ROUNDS}
            </div>
            <div className="game-score" style={{ position: 'static' }}>
              <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#60A5FA" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 3l-6 8 12 11L24 11l-6-8H6z"/></svg></span>
              <span className="score-value">{score}</span>
            </div>
          </div>

          {/* Objects area */}
          <div style={{
            flex: 1, position: 'relative', minHeight: '40vh',
            margin: 'var(--space-sm) var(--space-md)',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 'var(--radius-lg)',
          }}>
            {objects.map(obj => (
              <div key={obj.id} style={{
                position: 'absolute', left: `${obj.x}%`, top: `${obj.y}%`,
                fontSize: `${obj.size}px`,
                animation: `bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${obj.delay}s both`,
              }}><GI e={objectInfo.emoji} size={32}/></div>
            ))}
          </div>

          {/* Answer choices */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 'var(--space-md)',
            padding: 'var(--space-md) var(--space-md) var(--space-lg)', flexWrap: 'wrap',
          }}>
            {choices.map((num, i) => (
              <button key={i} onClick={() => handleAnswer(num)} style={{
                width: 70, height: 70, borderRadius: 'var(--radius-lg)',
                background: feedback?.type === 'correct' && num === correctCount
                  ? 'linear-gradient(135deg, #6BCB77, #48C9B0)' : 'white',
                color: feedback?.type === 'correct' && num === correctCount ? 'white' : 'var(--cm-pink)',
                fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2rem',
                border: '3px solid #FFE4E1', boxShadow: 'var(--shadow-md)',
                cursor: 'pointer', transition: 'all 0.2s ease',
                animation: `bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s both`,
              }}>
                {num}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              textAlign: 'center', paddingBottom: 'var(--space-md)',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem',
              color: feedback.type === 'correct' ? 'var(--cm-green)' : 'var(--cm-red)',
            }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-pink)"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('numbers')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// COLOUR MIXING GAME (Campur Warna)
// Mix primary colours to discover new ones!
// ============================================
export function ColourMixingGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const COLOR_RECIPES = [
    { a: { hex: '#FF0000', nameBm: 'Merah', nameEn: 'Red' },
      b: { hex: '#FFFF00', nameBm: 'Kuning', nameEn: 'Yellow' },
      result: { hex: '#FF8C00', nameBm: 'Jingga', nameEn: 'Orange' } },
    { a: { hex: '#FF0000', nameBm: 'Merah', nameEn: 'Red' },
      b: { hex: '#0000FF', nameBm: 'Biru', nameEn: 'Blue' },
      result: { hex: '#800080', nameBm: 'Ungu', nameEn: 'Purple' } },
    { a: { hex: '#FFFF00', nameBm: 'Kuning', nameEn: 'Yellow' },
      b: { hex: '#0000FF', nameBm: 'Biru', nameEn: 'Blue' },
      result: { hex: '#008000', nameBm: 'Hijau', nameEn: 'Green' } },
    { a: { hex: '#FF0000', nameBm: 'Merah', nameEn: 'Red' },
      b: { hex: '#FFFFFF', nameBm: 'Putih', nameEn: 'White' },
      result: { hex: '#FFB6C1', nameBm: 'Merah Jambu', nameEn: 'Pink' } },
    { a: { hex: '#000000', nameBm: 'Hitam', nameEn: 'Black' },
      b: { hex: '#FFFFFF', nameBm: 'Putih', nameEn: 'White' },
      result: { hex: '#808080', nameBm: 'Kelabu', nameEn: 'Grey' } },
    { a: { hex: '#FF8C00', nameBm: 'Jingga', nameEn: 'Orange' },
      b: { hex: '#FFFFFF', nameBm: 'Putih', nameEn: 'White' },
      result: { hex: '#FFDAB9', nameBm: 'Peach', nameEn: 'Peach' } },
  ];

  const [currentRecipeIdx, setCurrentRecipeIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [mixed, setMixed] = useState(false);
  const [choices, setChoices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [pourAnimation, setPourAnimation] = useState(false);

  const TOTAL_ROUNDS = 15;

  const generateRound = useCallback((roundNum) => {
    const idx = (roundNum - 1) % COLOR_RECIPES.length;
    setCurrentRecipeIdx(idx);
    setMixed(false);
    setPourAnimation(false);

    const recipe = COLOR_RECIPES[idx];
    const wrongResults = COLOR_RECIPES.filter((_, i) => i !== idx)
      .sort(() => Math.random() - 0.5).slice(0, 3).map(r => r.result);
    const allChoices = [recipe.result, ...wrongResults].sort(() => Math.random() - 0.5);
    setChoices(allChoices);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleMix = () => {
    setPourAnimation(true);
    setTimeout(() => setMixed(true), 800);
  };

  const handleAnswer = (colorResult) => {
    if (feedback) return;
    const recipe = COLOR_RECIPES[currentRecipeIdx];

    if (colorResult.hex === recipe.result.hex) {
      setScore(prev => prev + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 50 ? 3 : finalScore >= 30 ? 2 : 1;
          completeGame('colours', 'colour-mixing', stars, finalScore);
          setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
          const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF'];
          setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
            id: i, left: Math.random() * 100, color: colors[i % colors.length],
            delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
          })));
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const getStars = () => score >= 50 ? 3 : score >= 30 ? 2 : 1;
  const recipe = COLOR_RECIPES[currentRecipeIdx];

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('colours')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Campur Warna' : 'Colour Mixing'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body">
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          borderRadius: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'var(--space-lg)',
        }}>
          <img src={assetPath('/images/game/colour_mixing_lab.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.855,
          }} />
          {/* Round & Score */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-lg)' }}>
            <div className="round-counter" style={{ position: 'static' }}>{t('round', lang)} {round}/{TOTAL_ROUNDS}</div>
            <div className="game-score" style={{ position: 'static' }}>
              <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#60A5FA" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 3l-6 8 12 11L24 11l-6-8H6z"/></svg></span><span className="score-value">{score}</span>
            </div>
          </div>

          {/* Mixing area */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 90, height: 90, borderRadius: 'var(--radius-lg)',
                background: recipe.a.hex, border: '4px solid white', boxShadow: 'var(--shadow-md)',
                animation: pourAnimation ? 'bubbleShake 0.5s ease' : 'none',
              }} />
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginTop: 'var(--space-xs)', fontSize: '0.9rem' }}>
                {lang === 'bm' ? recipe.a.nameBm : recipe.a.nameEn}
              </p>
            </div>

            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-secondary)' }}>+</span>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 90, height: 90, borderRadius: 'var(--radius-lg)',
                background: recipe.b.hex, border: '4px solid white', boxShadow: 'var(--shadow-md)',
                animation: pourAnimation ? 'bubbleShake 0.5s ease 0.2s' : 'none',
              }} />
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginTop: 'var(--space-xs)', fontSize: '0.9rem' }}>
                {lang === 'bm' ? recipe.b.nameBm : recipe.b.nameEn}
              </p>
            </div>

            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-secondary)' }}>=</span>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 90, height: 90, borderRadius: 'var(--radius-lg)',
                background: mixed ? recipe.result.hex : 'repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 20px 20px',
                border: '4px solid white', boxShadow: 'var(--shadow-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.8s ease',
              }}>
                {!mixed && <span style={{ fontSize: "2rem" }}>?</span>}
              </div>
              <p style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700, marginTop: 'var(--space-xs)', fontSize: '0.9rem',
                color: mixed ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
                {mixed ? '???' : '???'}
              </p>
            </div>
          </div>

          {/* Mix button */}
          {!mixed && (
            <button className="btn-primary" onClick={handleMix} style={{
              marginBottom: 'var(--space-lg)',
              background: 'linear-gradient(135deg, var(--cm-purple), #764ba2)',
              fontSize: '1.1rem', padding: '14px 36px',
            }}>
              {lang === 'bm' ? 'Campur!' : 'Mix!'}
            </button>
          )}

          {/* Answer choices */}
          {mixed && (
            <>
              <p style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem',
                color: 'var(--text-primary)', marginBottom: 'var(--space-md)',
              }}>
                {lang === 'bm' ? 'Apakah warna baharu?' : 'What new colour is this?'}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
                {choices.map((c, i) => (
                  <button key={i} onClick={() => handleAnswer(c)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 'var(--space-xs)', padding: 'var(--space-md)',
                    background: 'white', borderRadius: 'var(--radius-lg)',
                    border: feedback?.type === 'correct' && c.hex === recipe.result.hex
                      ? '3px solid var(--cm-green)' : '3px solid #EEE',
                    boxShadow: 'var(--shadow-md)', cursor: 'pointer', minWidth: 80,
                    transition: 'all 0.2s ease',
                    animation: `bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s both`,
                  }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 'var(--radius-md)',
                      background: c.hex, border: '2px solid rgba(0,0,0,0.1)',
                    }} />
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8rem' }}>
                      {lang === 'bm' ? c.nameBm : c.nameEn}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Feedback */}
          {feedback && (
            <div style={{
              marginTop: 'var(--space-lg)', textAlign: 'center',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem',
              color: feedback.type === 'correct' ? 'var(--cm-green)' : 'var(--cm-red)',
            }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-purple)"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('colours')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// ANIMAL SOUNDS GAME (Bunyi Haiwan)
// Listen and match sounds to animals!
// ============================================
export function AnimalSoundsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const ANIMALS = [
    { id: 'cat', emoji: '🐱', image: assetPath('/animals/cat.jpg'), nameBm: 'Kucing', nameEn: 'Cat', soundBm: 'Meow! Meow!', soundEn: 'Meow! Meow!', bgColor: '#FFF0E5' },
    { id: 'dog', emoji: '🐶', image: assetPath('/animals/dog.jpg'), nameBm: 'Anjing', nameEn: 'Dog', soundBm: 'Woof! Woof!', soundEn: 'Woof! Woof!', bgColor: '#FFF5E0' },
    { id: 'cow', emoji: '🐮', image: assetPath('/animals/cow.jpg'), nameBm: 'Lembu', nameEn: 'Cow', soundBm: 'Moo! Moo!', soundEn: 'Moo! Moo!', bgColor: '#E8F5E9' },
    { id: 'duck', emoji: '🦆', image: assetPath('/animals/duck.jpg'), nameBm: 'Itik', nameEn: 'Duck', soundBm: 'Kwek! Kwek!', soundEn: 'Quack! Quack!', bgColor: '#E3F2FD' },
    { id: 'rooster', emoji: '🐓', image: assetPath('/animals/rooster.jpg'), nameBm: 'Ayam Jantan', nameEn: 'Rooster', soundBm: 'Kukuruyuk!', soundEn: 'Cock-a-doodle-doo!', bgColor: '#FFF3E0' },
    { id: 'sheep', emoji: '🐑', image: assetPath('/animals/sheep.jpg'), nameBm: 'Kambing Biri-biri', nameEn: 'Sheep', soundBm: 'Baa! Baa!', soundEn: 'Baa! Baa!', bgColor: '#F3E5F5' },
    { id: 'frog', emoji: '🐸', image: assetPath('/animals/frog.jpg'), nameBm: 'Katak', nameEn: 'Frog', soundBm: 'Koak! Koak!', soundEn: 'Ribbit! Ribbit!', bgColor: '#E8F5E9' },
    { id: 'lion', emoji: '🦁', image: assetPath('/animals/lion.jpg'), nameBm: 'Singa', nameEn: 'Lion', soundBm: 'Aum! Aum!', soundEn: 'Roar! Roar!', bgColor: '#FFF8E1' },
    { id: 'elephant', emoji: '🐘', image: assetPath('/animals/elephant.jpg'), nameBm: 'Gajah', nameEn: 'Elephant', soundBm: 'Prruut!', soundEn: 'Trumpet!', bgColor: '#ECEFF1' },
    { id: 'bird', emoji: '🐦', image: assetPath('/animals/bird.jpg'), nameBm: 'Burung', nameEn: 'Bird', soundBm: 'Cip! Cip!', soundEn: 'Tweet! Tweet!', bgColor: '#E0F7FA' },
  ];

  const TOTAL_ROUNDS = 15;
  const CHOICES_PER_ROUND = 4;

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetAnimal, setTargetAnimal] = useState(ANIMALS[0]);
  const [choices, setChoices] = useState([]);
  const [showSound, setShowSound] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [soundPulse, setSoundPulse] = useState(false);

  const generateRound = useCallback((roundNum) => {
    const target = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    setTargetAnimal(target);
    setShowSound(true);
    setSoundPulse(true);
    setTimeout(() => setSoundPulse(false), 2000);
    // Auto-play the real animal sound for the new round
    if (soundEnabled) {
      setTimeout(() => {
        // Play real animal SFX if available, otherwise fallback to hint chime
        const sfxMap = { cat: 'kucing', dog: 'anjing', cow: 'lembu', duck: 'itik', rooster: 'ayam', sheep: 'kambing', frog: 'katak', lion: 'singa', elephant: 'gajah', bird: 'burung' };
        if (sfxMap[target.id]) {
          playBMAnimalSfx(sfxMap[target.id]);
        } else {
          playAnimalHint();
        }
      }, 500);
    }

    const wrongAnimals = ANIMALS.filter(a => a.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, CHOICES_PER_ROUND - 1);
    const allChoices = [target, ...wrongAnimals].sort(() => Math.random() - 0.5);
    setChoices(allChoices);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleAnimalTap = (animal) => {
    if (feedback) return;

    if (animal.id === targetAnimal.id) {
      setScore(prev => prev + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
          completeGame('animals', 'animal-sounds', stars, finalScore);
          setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
          const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF'];
          setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
            id: i, left: Math.random() * 100, color: colors[i % colors.length],
            delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
          })));
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1500);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const getStars = () => score >= 70 ? 3 : score >= 40 ? 2 : 1;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('animals')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Bunyi Haiwan' : 'Animal Sounds'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body">
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          borderRadius: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'var(--space-lg)',
        }}>
          <img src={assetPath('/images/game/safari_jungle_bg.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.35,
          }} />
          {/* Round & Score */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-lg)' }}>
            <div className="round-counter" style={{ position: 'static' }}>{t('round', lang)} {round}/{TOTAL_ROUNDS}</div>
            <div className="game-score" style={{ position: 'static' }}>
              <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span><span className="score-value">{score}</span>
            </div>
          </div>

          {/* Sound Display — the "speaker" */}
          <div onClick={() => { setSoundPulse(true); setTimeout(() => setSoundPulse(false), 2000); if (soundEnabled) playAnimalHint(); }}
            style={{
              width: 160, height: 160, borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: soundPulse ? '0 0 30px rgba(155,114,207,0.5), var(--shadow-lg)' : 'var(--shadow-lg)',
              marginBottom: 'var(--space-lg)', cursor: 'pointer',
              transition: 'box-shadow 0.3s ease',
              animation: soundPulse ? 'starBadgePulse 0.5s ease infinite' : 'none',
              border: '3px solid rgba(255,255,255,0.6)',
            }}>
            <span style={{ marginBottom: "var(--space-xs)" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="#6C63FF" style={{display:"inline-block"}}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg></span>
            <span style={{
              fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.3rem',
              color: 'var(--cm-purple)', textAlign: 'center', lineHeight: 1.2,
            }}>
              "{lang === 'bm' ? targetAnimal.soundBm : targetAnimal.soundEn}"
            </span>
          </div>

          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem',
            color: 'var(--text-primary)', marginBottom: 'var(--space-lg)', textAlign: 'center',
          }}>
            {lang === 'bm' ? 'Haiwan mana yang berbunyi begini?' : 'Which animal makes this sound?'}
          </p>

          {/* Animal Choices */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-md)', width: '100%', maxWidth: 400,
          }}>
            {choices.map((animal, i) => (
              <button key={animal.id + '-' + i} onClick={() => handleAnimalTap(animal)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'var(--space-sm)', padding: 'var(--space-lg)',
                background: feedback?.type === 'correct' && animal.id === targetAnimal.id
                  ? 'linear-gradient(135deg, #6BCB77, #48C9B0)' : 'white',
                borderRadius: 'var(--radius-lg)',
                border: feedback?.type === 'correct' && animal.id === targetAnimal.id
                  ? '3px solid var(--cm-green)' : '3px solid rgba(0,0,0,0.04)',
                boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                transition: 'all 0.2s ease',
                animation: `bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s both`,
              }}>
                {animal.image ? (
                  <img src={animal.image} alt={lang === 'bm' ? animal.nameBm : animal.nameEn}
                    style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
                ) : (
                  <GI e={animal.emoji} size={48}/>
                )}
                <span style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem',
                  color: feedback?.type === 'correct' && animal.id === targetAnimal.id ? 'white' : 'var(--text-primary)',
                }}>
                  {lang === 'bm' ? animal.nameBm : animal.nameEn}
                </span>
              </button>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              marginTop: 'var(--space-lg)', textAlign: 'center', padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem',
              boxShadow: 'var(--shadow-md)',
            }}>
              {feedback.message}
              {feedback.type === 'correct' && (
                <span style={{ display: 'block', fontSize: '0.85rem', marginTop: 4, opacity: 0.9 }}>
                  {targetAnimal.emoji} {lang === 'bm' ? targetAnimal.nameBm : targetAnimal.nameEn}!
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-green)"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('animals')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// SHAPE HUNT GAME (Cari Bentuk)
// Find shapes hidden in a scene!
// ============================================
export function ShapeHuntGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const SCENES = [
    {
      nameBm: 'Bilik Tidur', nameEn: 'Bedroom',
      bg: 'linear-gradient(180deg, #E8F0FE 0%, #D4E8FF 100%)',
      shapes: [
        { id: 's1', shape: '⬜', nameBm: 'Segi Empat', nameEn: 'Square', x: 15, y: 25, size: 50, desc: '🖼️ bingkai' },
        { id: 's2', shape: '🔺', nameBm: 'Segi Tiga', nameEn: 'Triangle', x: 60, y: 15, size: 45, desc: 'bumbung' },
        { id: 's3', shape: '⭕', nameBm: 'Bulatan', nameEn: 'Circle', x: 75, y: 40, size: 40, desc: '⏰ jam' },
        { id: 's4', shape: '▬', nameBm: 'Segi Empat Tepat', nameEn: 'Rectangle', x: 30, y: 55, size: 55, desc: 'pintu' },
      ],
      decorations: ['🛏️', '🪟', '🧸', '📚', '💡'],
    },
    {
      nameBm: 'Taman', nameEn: 'Garden',
      bg: 'linear-gradient(180deg, #87CEEB 0%, #90EE90 60%, #228B22 100%)',
      shapes: [
        { id: 's1', shape: '⭕', nameBm: 'Bulatan', nameEn: 'Circle', x: 20, y: 20, size: 55, desc: '☀️ matahari' },
        { id: 's2', shape: '🔺', nameBm: 'Segi Tiga', nameEn: 'Triangle', x: 50, y: 30, size: 50, desc: 'pokok' },
        { id: 's3', shape: '⬜', nameBm: 'Segi Empat', nameEn: 'Square', x: 70, y: 50, size: 45, desc: 'rumah' },
        { id: 's4', shape: '💎', nameBm: 'Berlian', nameEn: 'Diamond', x: 35, y: 55, size: 40, desc: 'layang-layang' },
      ],
      decorations: ['🌻', '🦋', '🐝', '🌈', '🐦'],
    },
    {
      nameBm: 'Dapur', nameEn: 'Kitchen',
      bg: 'linear-gradient(180deg, #FFF5E1 0%, #FFE0B2 100%)',
      shapes: [
        { id: 's1', shape: '⭕', nameBm: 'Bulatan', nameEn: 'Circle', x: 25, y: 30, size: 50, desc: 'kuali' },
        { id: 's2', shape: '▬', nameBm: 'Segi Empat Tepat', nameEn: 'Rectangle', x: 60, y: 25, size: 55, desc: 'peti ais' },
        { id: 's3', shape: '🔺', nameBm: 'Segi Tiga', nameEn: 'Triangle', x: 40, y: 50, size: 45, desc: 'pizza' },
        { id: 's4', shape: '⬜', nameBm: 'Segi Empat', nameEn: 'Square', x: 75, y: 55, size: 40, desc: 'roti' },
      ],
      decorations: ['🍽️', '🥄', '🧂', '🫖', '🔪'],
    },
  ];

  const TOTAL_ROUNDS = SCENES.length;

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [foundShapes, setFoundShapes] = useState(new Set());
  const [targetShape, setTargetShape] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [sceneShapeIdx, setSceneShapeIdx] = useState(0);

  const currentScene = SCENES[round];

  useEffect(() => {
    setFoundShapes(new Set());
    setSceneShapeIdx(0);
    if (currentScene) {
      setTargetShape(currentScene.shapes[0]);
    }
    setFeedback(null);
  }, [round]);

  const handleShapeTap = (shape) => {
    if (foundShapes.has(shape.id) || feedback) return;

    if (targetShape && shape.id === targetShape.id) {
      setScore(prev => prev + 10);
      const newFound = new Set([...foundShapes, shape.id]);
      setFoundShapes(newFound);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        setFeedback(null);
        const nextIdx = sceneShapeIdx + 1;
        if (nextIdx >= currentScene.shapes.length) {
          // Scene complete — next scene or game complete
          if (round + 1 >= TOTAL_ROUNDS) {
            const stars = score + 10 >= 100 ? 3 : score + 10 >= 60 ? 2 : 1;
            completeGame('shapes', 'shape-hunt', stars, score + 10);
            setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
            const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF'];
            setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
              id: i, left: Math.random() * 100, color: colors[i % colors.length],
              delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
            })));
          } else {
            setRound(prev => prev + 1);
          }
        } else {
          setSceneShapeIdx(nextIdx);
          setTargetShape(currentScene.shapes[nextIdx]);
        }
      }, 1000);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 800);
    }
  };

  const getStars = () => score >= 100 ? 3 : score >= 60 ? 2 : 1;

  if (!currentScene) return null;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('shapes')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Cari Bentuk' : 'Shape Hunt'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body">
        <div style={{
          width: '100%', height: '100%',
          background: currentScene.bg,
          borderRadius: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          position: 'relative',
        }}>
          <img src={assetPath('/images/game/shape_hunt_bg.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.85,
          }} />
          {/* Instruction */}
          <div style={{
            textAlign: 'center', padding: 'var(--space-lg) var(--space-md) var(--space-sm)',
            zIndex: 10,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)',
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
              padding: 'var(--space-sm) var(--space-xl)', borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-md)', border: '1px solid rgba(255,255,255,0.5)',
            }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>
                {lang === 'bm' ? 'Cari' : 'Find'}{' '}
                <span style={{ color: 'var(--cm-blue)', fontSize: '1.5rem' }}>
                  {targetShape?.shape}
                </span>{' '}
                <span style={{ color: 'var(--cm-purple)', fontWeight: 800 }}>
                  {lang === 'bm' ? targetShape?.nameBm : targetShape?.nameEn}
                </span>
              </span>
            </div>
            <p style={{
              fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem',
              color: 'var(--text-secondary)', marginTop: 'var(--space-xs)',
            }}>
              {lang === 'bm' ? currentScene.nameBm : currentScene.nameEn} — {foundShapes.size}/{currentScene.shapes.length}
            </p>
          </div>

          {/* Score */}
          <div style={{
            position: 'absolute', top: 'var(--space-lg)', right: 'var(--space-lg)', zIndex: 10,
          }}>
            <div className="game-score" style={{ position: 'static' }}>
              <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#60A5FA" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 3l-6 8 12 11L24 11l-6-8H6z"/></svg></span><span className="score-value">{score}</span>
            </div>
          </div>

          {/* Scene with shapes */}
          <div style={{ flex: 1, position: 'relative', minHeight: '50vh' }}>
            {/* Decorations */}
            {currentScene.decorations.map((d, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${15 + i * 18}%`, top: `${20 + (i % 2) * 30}%`,
                opacity: 0.5, pointerEvents: 'none',
              }}>
                <GI e={d} size={40}/>
              </div>
            ))}

            {/* Shapes (clickable) */}
            {currentScene.shapes.map((shape, i) => {
              const isFound = foundShapes.has(shape.id);
              return (
                <div key={shape.id} onClick={() => handleShapeTap(shape)} style={{
                  position: 'absolute',
                  left: `${shape.x}%`, top: `${shape.y}%`,
                  width: shape.size + 20, height: shape.size + 20,
                  borderRadius: 'var(--radius-lg)',
                  background: isFound ? 'rgba(107,203,119,0.3)' : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isFound ? 'none' : 'var(--shadow-md)',
                  cursor: isFound ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  border: isFound ? '3px solid var(--cm-green)' : '3px solid rgba(255,255,255,0.5)',
                  animation: `bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.15}s both`,
                  zIndex: 5,
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{shape.desc.split(' ')[0]}</span>
                  <span style={{
                    fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.75rem',
                    color: isFound ? 'var(--cm-green)' : 'var(--text-secondary)',
                  }}>
                    {shape.shape} {isFound ? '✓' : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              textAlign: 'center', padding: 'var(--space-md)',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem',
              color: feedback.type === 'correct' ? 'var(--cm-green)' : 'var(--cm-red)',
            }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-blue)"
          onPlayAgain={() => { setRound(0); setScore(0); setGameComplete(false); setConfettiPieces([]); setFoundShapes(new Set()); setSceneShapeIdx(0); }}
          onBack={() => goToWorld('shapes')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// BLOCK TOWER GAME (Menara Blok)
// Stack the right number of blocks!
// ============================================
export function BlockTowerGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 15;
  const BLOCK_COLORS = ['#FF6B9D', '#4A90D9', '#6BCB77', '#FFD93D', '#9B72CF', '#FF8C42', '#48C9B0', '#ee5a24'];

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetNumber, setTargetNumber] = useState(3);
  const [currentBlocks, setCurrentBlocks] = useState(0);
  const [blockColors, setBlockColors] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [towerShake, setTowerShake] = useState(false);

  const generateRound = useCallback((roundNum) => {
    const target = 2 + Math.floor(Math.random() * 7); // 2-8
    setTargetNumber(target);
    setCurrentBlocks(0);
    setBlockColors([]);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const addBlock = () => {
    if (feedback) return;
    const newCount = currentBlocks + 1;
    setCurrentBlocks(newCount);
    setBlockColors(prev => [...prev, BLOCK_COLORS[newCount % BLOCK_COLORS.length]]);
    setTowerShake(true);
    setTimeout(() => setTowerShake(false), 300);
  };

  const removeBlock = () => {
    if (feedback || currentBlocks <= 0) return;
    setCurrentBlocks(prev => prev - 1);
    setBlockColors(prev => prev.slice(0, -1));
  };

  const checkAnswer = () => {
    if (feedback) return;

    if (currentBlocks === targetNumber) {
      setScore(prev => prev + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
          completeGame('numbers', 'block-tower', stars, finalScore);
          setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
          const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF'];
          setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
            id: i, left: Math.random() * 100, color: colors[i % colors.length],
            delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
          })));
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: `${wrongFeedback(lang, soundEnabled)} (${lang === 'bm' ? 'Perlu' : 'Need'} ${targetNumber})` });
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  const getStars = () => score >= 70 ? 3 : score >= 40 ? 2 : 1;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('numbers')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Menara Blok' : 'Block Tower'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body">
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          borderRadius: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'var(--space-lg)',
        }}>
          <img src={assetPath('/images/game/block_tower_bg.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.3,
          }} />
          {/* Round & Score */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-md)' }}>
            <div className="round-counter" style={{ position: 'static' }}>{t('round', lang)} {round}/{TOTAL_ROUNDS}</div>
            <div className="game-score" style={{ position: 'static' }}>
              <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#60A5FA" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 3l-6 8 12 11L24 11l-6-8H6z"/></svg></span><span className="score-value">{score}</span>
            </div>
          </div>

          {/* Instruction */}
          <div style={{
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
            padding: 'var(--space-sm) var(--space-xl)', borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-md)', marginBottom: 'var(--space-lg)',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem',
          }}>
            {lang === 'bm' ? 'Susun' : 'Stack'}{' '}
            <span style={{ color: 'var(--cm-pink)', fontSize: '2rem', fontWeight: 900 }}>{targetNumber}</span>
            {' '}{lang === 'bm' ? 'blok!' : 'blocks!'}
          </div>

          {/* Tower */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            alignItems: 'center', minHeight: '35vh', position: 'relative',
            animation: towerShake ? 'bubbleShake 0.3s ease' : 'none',
          }}>
            {blockColors.map((color, i) => (
              <div key={i} style={{
                width: 100 - i * 2, height: 40, background: color,
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 -2px 4px rgba(0,0,0,0.1)',
                marginBottom: 2,
                animation: `bounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'white',
                fontSize: '1.1rem', textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}>
                {i + 1}
              </div>
            ))}
            {/* Platform */}
            <div style={{
              width: 140, height: 12, background: '#8B4513',
              borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }} />
          </div>

          {/* Counter display */}
          <div style={{
            fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2.5rem',
            color: currentBlocks === targetNumber ? 'var(--cm-green)' : 'var(--cm-pink)',
            margin: 'var(--space-md) 0',
            transition: 'color 0.3s ease',
          }}>
            {currentBlocks} / {targetNumber}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <button onClick={removeBlock} style={{
              width: 60, height: 60, borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', fontWeight: 900, fontSize: '2rem',
              border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer',
            }}>−</button>
            <button onClick={addBlock} style={{
              width: 60, height: 60, borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #6BCB77, #48C9B0)',
              color: 'white', fontWeight: 900, fontSize: '2rem',
              border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer',
            }}>+</button>
          </div>

          <button className="btn-primary" onClick={checkAnswer} style={{
            background: 'linear-gradient(135deg, var(--cm-pink), #FF8C42)',
            fontSize: '1.1rem', padding: '14px 36px',
          }}>
            <CheckIcon size={14} /> {lang === 'bm' ? 'Semak!' : 'Check!'}
          </button>

          {/* Feedback */}
          {feedback && (
            <div style={{
              marginTop: 'var(--space-md)', padding: '10px 24px', borderRadius: 'var(--radius-full)',
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem',
              boxShadow: 'var(--shadow-md)',
            }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-pink)"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('numbers')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// ANIMAL HOMES GAME (Rumah Haiwan)
// Match animals to their habitats!
// ============================================
export function AnimalHomesGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const HABITATS = [
    { id: 'farm', emoji: '🏡', nameBm: 'Ladang', nameEn: 'Farm', color: '#FFE0B2' },
    { id: 'jungle', emoji: '🌴', nameBm: 'Hutan', nameEn: 'Jungle', color: '#C8E6C9' },
    { id: 'ocean', emoji: '🌊', nameBm: 'Laut', nameEn: 'Ocean', color: '#BBDEFB' },
    { id: 'sky', emoji: '☁️', nameBm: 'Langit', nameEn: 'Sky', color: '#E1F5FE' },
  ];

  const ANIMALS_DATA = [
    { emoji: '🐮', image: assetPath('/animals/cow.jpg'), nameBm: 'Lembu', nameEn: 'Cow', habitat: 'farm' },
    { emoji: '🐔', image: assetPath('/animals/rooster.jpg'), nameBm: 'Ayam', nameEn: 'Chicken', habitat: 'farm' },
    { emoji: '🐷', image: assetPath('/animals/pig.jpg'), nameBm: 'Babi', nameEn: 'Pig', habitat: 'farm' },
    { emoji: '🐑', image: assetPath('/animals/sheep.jpg'), nameBm: 'Kambing', nameEn: 'Sheep', habitat: 'farm' },
    { emoji: '🦁', image: assetPath('/animals/lion.jpg'), nameBm: 'Singa', nameEn: 'Lion', habitat: 'jungle' },
    { emoji: '🐒', image: assetPath('/animals/monkey.jpg'), nameBm: 'Monyet', nameEn: 'Monkey', habitat: 'jungle' },
    { emoji: '🐍', image: assetPath('/animals/snake.jpg'), nameBm: 'Ular', nameEn: 'Snake', habitat: 'jungle' },
    { emoji: '🦜', image: assetPath('/animals/bird.jpg'), nameBm: 'Burung', nameEn: 'Bird', habitat: 'sky' },
    { emoji: '🐠', image: assetPath('/animals/fish.jpg'), nameBm: 'Ikan', nameEn: 'Fish', habitat: 'ocean' },
    { emoji: '🐙', image: assetPath('/animals/octopus.jpg'), nameBm: 'Sotong', nameEn: 'Octopus', habitat: 'ocean' },
    { emoji: '🐢', image: assetPath('/animals/turtle.jpg'), nameBm: 'Penyu', nameEn: 'Turtle', habitat: 'ocean' },
    { emoji: '🐬', image: assetPath('/animals/dolphin.jpg'), nameBm: 'Lumba-lumba', nameEn: 'Dolphin', habitat: 'ocean' },
    { emoji: '🦅', image: assetPath('/animals/eagle.jpg'), nameBm: 'Helang', nameEn: 'Eagle', habitat: 'sky' },
    { emoji: '🦋', image: assetPath('/animals/butterfly.jpg'), nameBm: 'Rama-rama', nameEn: 'Butterfly', habitat: 'sky' },
    { emoji: '🐝', image: assetPath('/animals/bee.jpg'), nameBm: 'Lebah', nameEn: 'Bee', habitat: 'sky' },
    { emoji: '🐱', image: assetPath('/animals/cat.jpg'), nameBm: 'Kucing', nameEn: 'Cat', habitat: 'farm' },
    { emoji: '🐶', image: assetPath('/animals/dog.jpg'), nameBm: 'Anjing', nameEn: 'Dog', habitat: 'farm' },
    { emoji: '🦆', image: assetPath('/animals/duck.jpg'), nameBm: 'Itik', nameEn: 'Duck', habitat: 'farm' },
    { emoji: '🐸', image: assetPath('/animals/frog.jpg'), nameBm: 'Katak', nameEn: 'Frog', habitat: 'jungle' },
    { emoji: '🐘', image: assetPath('/animals/elephant.jpg'), nameBm: 'Gajah', nameEn: 'Elephant', habitat: 'jungle' },
  ];

  const TOTAL_ROUNDS = 15;

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [currentAnimal, setCurrentAnimal] = useState(ANIMALS_DATA[0]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  const generateRound = useCallback((roundNum) => {
    const animal = ANIMALS_DATA[Math.floor(Math.random() * ANIMALS_DATA.length)];
    setCurrentAnimal(animal);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleHabitatTap = (habitat) => {
    if (feedback) return;

    if (habitat.id === currentAnimal.habitat) {
      setScore(prev => prev + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
          completeGame('animals', 'animal-homes', stars, finalScore);
          setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
          const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF'];
          setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
            id: i, left: Math.random() * 100, color: colors[i % colors.length],
            delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
          })));
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const getStars = () => score >= 70 ? 3 : score >= 40 ? 2 : 1;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('animals')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Rumah Haiwan' : 'Animal Homes'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body">
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          borderRadius: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'var(--space-lg)',
        }}>
          <img src={assetPath('/images/game/animal_homes_bg.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.3,
          }} />
          {/* Round & Score */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-lg)' }}>
            <div className="round-counter" style={{ position: 'static' }}>{t('round', lang)} {round}/{TOTAL_ROUNDS}</div>
            <div className="game-score" style={{ position: 'static' }}>
              <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD93D" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span><span className="score-value">{score}</span>
            </div>
          </div>

          {/* Animal to place */}
          <div style={{
            width: 140, height: 140, borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)', marginBottom: 'var(--space-md)',
            border: '3px solid rgba(255,255,255,0.6)',
            animation: 'characterBob 2s ease-in-out infinite',
          }}>
            {currentAnimal.image ? (
              <img src={currentAnimal.image} alt={lang === 'bm' ? currentAnimal.nameBm : currentAnimal.nameEn}
                style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <GI e={currentAnimal.emoji} size={56}/>
            )}
            <span style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem',
              color: 'var(--text-primary)', marginTop: 4,
            }}>
              {lang === 'bm' ? currentAnimal.nameBm : currentAnimal.nameEn}
            </span>
          </div>

          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem',
            color: 'var(--text-primary)', marginBottom: 'var(--space-lg)',
          }}>
            {lang === 'bm' ? 'Di mana dia tinggal?' : 'Where does it live?'}
          </p>

          {/* Habitat choices */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-md)', width: '100%', maxWidth: 400,
          }}>
            {HABITATS.map((habitat, i) => (
              <button key={habitat.id} onClick={() => handleHabitatTap(habitat)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'var(--space-sm)', padding: 'var(--space-lg)',
                background: feedback?.type === 'correct' && habitat.id === currentAnimal.habitat
                  ? 'linear-gradient(135deg, #6BCB77, #48C9B0)' : habitat.color,
                borderRadius: 'var(--radius-lg)',
                border: feedback?.type === 'correct' && habitat.id === currentAnimal.habitat
                  ? '3px solid var(--cm-green)' : '3px solid rgba(255,255,255,0.6)',
                boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                transition: 'all 0.2s ease',
                animation: `bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s both`,
              }}>
                <GI e={habitat.emoji} size={40}/>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem',
                  color: feedback?.type === 'correct' && habitat.id === currentAnimal.habitat ? 'white' : 'var(--text-primary)',
                }}>
                  {lang === 'bm' ? habitat.nameBm : habitat.nameEn}
                </span>
              </button>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              marginTop: 'var(--space-lg)', padding: '10px 24px', borderRadius: 'var(--radius-full)',
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem',
              boxShadow: 'var(--shadow-md)',
            }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-green)"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('animals')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// MATCH COLOUR GAME (Padankan Warna)
// Match colour names to their swatches!
// ============================================
export function MatchColourGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const ALL_COLOURS = [
    { hex: '#FF0000', nameBm: 'Merah', nameEn: 'Red' },
    { hex: '#0000FF', nameBm: 'Biru', nameEn: 'Blue' },
    { hex: '#FFFF00', nameBm: 'Kuning', nameEn: 'Yellow' },
    { hex: '#008000', nameBm: 'Hijau', nameEn: 'Green' },
    { hex: '#FF8C00', nameBm: 'Jingga', nameEn: 'Orange' },
    { hex: '#800080', nameBm: 'Ungu', nameEn: 'Purple' },
    { hex: '#FFB6C1', nameBm: 'Merah Jambu', nameEn: 'Pink' },
    { hex: '#000000', nameBm: 'Hitam', nameEn: 'Black' },
    { hex: '#FFFFFF', nameBm: 'Putih', nameEn: 'White' },
    { hex: '#808080', nameBm: 'Kelabu', nameEn: 'Grey' },
    { hex: '#8B4513', nameBm: 'Coklat', nameEn: 'Brown' },
  ];

  const TOTAL_ROUNDS = 15;

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetColour, setTargetColour] = useState(ALL_COLOURS[0]);
  const [choices, setChoices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  const generateRound = useCallback((roundNum) => {
    const target = ALL_COLOURS[Math.floor(Math.random() * ALL_COLOURS.length)];
    setTargetColour(target);

    const wrong = ALL_COLOURS.filter(c => c.hex !== target.hex)
      .sort(() => Math.random() - 0.5).slice(0, 3);
    setChoices([target, ...wrong].sort(() => Math.random() - 0.5));
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleAnswer = (colour) => {
    if (feedback) return;

    if (colour.hex === targetColour.hex) {
      setScore(prev => prev + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
          completeGame('colours', 'match-colour', stars, finalScore);
          setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
          const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF'];
          setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
            id: i, left: Math.random() * 100, color: colors[i % colors.length],
            delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
          })));
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const getStars = () => score >= 70 ? 3 : score >= 40 ? 2 : 1;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('colours')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Padankan Warna' : 'Match Colour'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body">
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          borderRadius: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'var(--space-lg)',
        }}>
          <img src={assetPath('/images/game/sock_room_bg.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.855,
          }} />
          {/* Round & Score */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-lg)' }}>
            <div className="round-counter" style={{ position: 'static' }}>{t('round', lang)} {round}/{TOTAL_ROUNDS}</div>
            <div className="game-score" style={{ position: 'static' }}>
              <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#EC4899" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span><span className="score-value">{score}</span>
            </div>
          </div>

          {/* Target — show the colour NAME, ask to pick swatch */}
          <div style={{
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
            padding: 'var(--space-lg) var(--space-xxl)', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)', marginBottom: 'var(--space-lg)',
            textAlign: 'center', border: '1px solid rgba(255,255,255,0.5)',
          }}>
            <p style={{
              fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem',
              color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)',
            }}>
              {lang === 'bm' ? 'Cari warna ini:' : 'Find this colour:'}
            </p>
            <p style={{
              fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2rem',
              color: 'var(--text-primary)',
            }}>
              {lang === 'bm' ? targetColour.nameBm : targetColour.nameEn}
            </p>
          </div>

          {/* Colour swatches */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-md)', width: '100%', maxWidth: 350,
          }}>
            {choices.map((colour, i) => (
              <button key={colour.hex + i} onClick={() => handleAnswer(colour)} style={{
                width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-lg)',
                background: colour.hex,
                border: feedback?.type === 'correct' && colour.hex === targetColour.hex
                  ? '5px solid var(--cm-green)'
                  : colour.hex === '#FFFFFF' ? '3px solid #DDD' : '3px solid rgba(255,255,255,0.3)',
                boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                transition: 'all 0.2s ease',
                animation: `bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s both`,
              }} />
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              marginTop: 'var(--space-lg)', padding: '10px 24px', borderRadius: 'var(--radius-full)',
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem',
              boxShadow: 'var(--shadow-md)',
            }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-purple)"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('colours')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// SORT TRANSPORT GAME (Susun Kenderaan)
// Sort vehicles into Land, Air, or Water!
// ============================================
export function SortTransportGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const CATEGORIES = [
    { id: 'land', emoji: '🛤️', nameBm: 'Darat', nameEn: 'Land', color: '#A5D6A7' },
    { id: 'air', emoji: '☁️', nameBm: 'Udara', nameEn: 'Air', color: '#90CAF9' },
    { id: 'water', emoji: '🌊', nameBm: 'Air', nameEn: 'Water', color: '#80DEEA' },
  ];

  const VEHICLES = [
    { emoji: '🚗', image: assetPath('/transport/car.jpg'), nameBm: 'Kereta', nameEn: 'Car', category: 'land' },
    { emoji: '🚌', image: assetPath('/transport/bus.jpg'), nameBm: 'Bas', nameEn: 'Bus', category: 'land' },
    { emoji: '🚲', image: assetPath('/transport/bicycle.jpg'), nameBm: 'Basikal', nameEn: 'Bicycle', category: 'land' },
    { emoji: '🏍️', image: assetPath('/transport/motorcycle.jpg'), nameBm: 'Motosikal', nameEn: 'Motorcycle', category: 'land' },
    { emoji: '🚂', image: assetPath('/transport/train.jpg'), nameBm: 'Keretapi', nameEn: 'Train', category: 'land' },
    { emoji: '🚑', image: assetPath('/transport/ambulance.jpg'), nameBm: 'Ambulans', nameEn: 'Ambulance', category: 'land' },
    { emoji: '✈️', image: assetPath('/transport/airplane.jpg'), nameBm: 'Kapal Terbang', nameEn: 'Airplane', category: 'air' },
    { emoji: '🚁', image: assetPath('/transport/helicopter.jpg'), nameBm: 'Helikopter', nameEn: 'Helicopter', category: 'air' },
    { emoji: '🎈', image: assetPath('/transport/balloon.jpg'), nameBm: 'Belon Udara', nameEn: 'Hot Air Balloon', category: 'air' },
    { emoji: '🚀', image: assetPath('/transport/rocket.jpg'), nameBm: 'Roket', nameEn: 'Rocket', category: 'air' },
    { emoji: '🚢', image: assetPath('/transport/ship.jpg'), nameBm: 'Kapal', nameEn: 'Ship', category: 'water' },
    { emoji: '⛵', image: assetPath('/transport/sailboat.jpg'), nameBm: 'Perahu Layar', nameEn: 'Sailboat', category: 'water' },
    { emoji: '🛶', image: assetPath('/transport/kayak.jpg'), nameBm: 'Kayak', nameEn: 'Kayak', category: 'water' },
    { emoji: '🚤', image: assetPath('/transport/speedboat.jpg'), nameBm: 'Bot Laju', nameEn: 'Speedboat', category: 'water' },
  ];

  const TOTAL_ROUNDS = 15;

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [currentVehicle, setCurrentVehicle] = useState(VEHICLES[0]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  const generateRound = useCallback((roundNum) => {
    const vehicle = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
    setCurrentVehicle(vehicle);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleCategoryTap = (category) => {
    if (feedback) return;

    if (category.id === currentVehicle.category) {
      setScore(prev => prev + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 80 ? 3 : finalScore >= 50 ? 2 : 1;
          completeGame('transport', 'sort-transport', stars, finalScore);
          setGameComplete(true);
          celebrationFeedback(lang, soundEnabled);
          const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#FF8C42'];
          setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
            id: i, left: Math.random() * 100, color: colors[i % colors.length],
            delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
          })));
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const getStars = () => score >= 80 ? 3 : score >= 50 ? 2 : 1;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('transport')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Susun Kenderaan' : 'Sort Transport'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body">
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          borderRadius: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'var(--space-lg)',
        }}>
          <img src={assetPath('/images/game/transport_bg.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.3,
          }} />
          {/* Round & Score */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-lg)' }}>
            <div className="round-counter" style={{ position: 'static' }}>{t('round', lang)} {round}/{TOTAL_ROUNDS}</div>
            <div className="game-score" style={{ position: 'static' }}>
              <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span><span className="score-value">{score}</span>
            </div>
          </div>

          {/* Vehicle to sort */}
          <div style={{
            width: 160, height: 160, borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)', marginBottom: 'var(--space-md)',
            border: '3px solid rgba(255,255,255,0.6)',
            animation: 'characterBob 2s ease-in-out infinite',
          }}>
            {currentVehicle.image ? (
              <img src={currentVehicle.image} alt={lang === 'bm' ? currentVehicle.nameBm : currentVehicle.nameEn}
                style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <GI e={currentVehicle.emoji} size={64}/>
            )}
            <span style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem',
              color: 'var(--text-primary)', marginTop: 4,
            }}>
              {lang === 'bm' ? currentVehicle.nameBm : currentVehicle.nameEn}
            </span>
          </div>

          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem',
            color: 'var(--text-primary)', marginBottom: 'var(--space-lg)',
          }}>
            {lang === 'bm' ? 'Kenderaan ini bergerak di mana?' : 'Where does this vehicle travel?'}
          </p>

          {/* Category choices */}
          <div style={{
            display: 'flex', gap: 'var(--space-md)', width: '100%',
            maxWidth: 500, justifyContent: 'center',
          }}>
            {CATEGORIES.map((cat, i) => (
              <button key={cat.id} onClick={() => handleCategoryTap(cat)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'var(--space-sm)', padding: 'var(--space-lg)',
                background: feedback?.type === 'correct' && cat.id === currentVehicle.category
                  ? 'linear-gradient(135deg, #6BCB77, #48C9B0)' : cat.color,
                borderRadius: 'var(--radius-lg)',
                border: feedback?.type === 'correct' && cat.id === currentVehicle.category
                  ? '3px solid var(--cm-green)' : '3px solid rgba(255,255,255,0.6)',
                boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                transition: 'all 0.2s ease',
                animation: `bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s both`,
              }}>
                <GI e={cat.emoji} size={40}/>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem',
                  color: feedback?.type === 'correct' && cat.id === currentVehicle.category ? 'white' : 'var(--text-primary)',
                }}>
                  {lang === 'bm' ? cat.nameBm : cat.nameEn}
                </span>
              </button>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              marginTop: 'var(--space-lg)', padding: '10px 24px', borderRadius: 'var(--radius-full)',
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem',
              boxShadow: 'var(--shadow-md)',
            }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-orange)"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('transport')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// Shared Game Complete Modal
// ============================================
export function GameCompleteModal({ lang, stars, score, accentColor, onPlayAgain, onBack, confettiPieces }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <>
      <div className="confetti-container">
        {confettiPieces.map(p => (
          <div key={p.id} className="confetti-piece" style={{
            left: `${p.left}%`, background: p.color, width: p.size, height: p.size,
            animationDelay: `${p.delay}s`,
          }} />
        ))}
      </div>
      <div className="game-complete-overlay">
        <div className="game-complete-modal">
          <div className="trophy"><TrophyIcon size={48} /></div>
          <h2>{lang === 'bm' ? 'Syabas!' : 'Well Done!'}</h2>
          <p>{t('youEarned', lang)} {stars} {t('starsEarned', lang)}!</p>
          <div className="stars-row">
            {[1,2,3].map(s => <span key={s} className="star" style={{ opacity: s <= stars ? 1 : 0.3 }}><StarIcon size={16} /></span>)}
          </div>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: accentColor, fontSize: '1.2rem' }}>
            {t('score', lang)}: {score}
          </p>
          <div className="action-buttons" style={{ marginTop: 'var(--space-lg)' }}>
            <button className="btn-secondary" onClick={onPlayAgain}>
              <RefreshIcon size={16} /> {t('playAgain', lang)}
            </button>
            <button className="btn-success" onClick={onBack}>
              <CheckIcon size={16} /> {t('backToWorld', lang)}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ============================================
// MATH MACHINE GAME (Mesin Matematik)
// Addition vending machine — toddler-friendly!
// ============================================
export function MathMachineGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 15;
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [machineAnim, setMachineAnim] = useState(false);

  const generateRound = useCallback(() => {
    const a = Math.floor(Math.random() * 5) + 1; // 1-5
    const b = Math.floor(Math.random() * 5) + 1; // 1-5
    const correct = a + b;
    setNum1(a);
    setNum2(b);

    // Generate 3 wrong options + correct
    const wrongSet = new Set();
    while (wrongSet.size < 3) {
      const w = Math.floor(Math.random() * 10) + 1;
      if (w !== correct) wrongSet.add(w);
    }
    const allOptions = [correct, ...wrongSet].sort(() => Math.random() - 0.5);
    setOptions(allOptions.map(val => ({ val, correct: val === correct })));
    setFeedback(null);
    setMachineAnim(true);
    setTimeout(() => setMachineAnim(false), 600);
  }, []);

  useEffect(() => { generateRound(); }, [generateRound]);

  const handleAnswer = (opt) => {
    if (feedback) return;
    if (opt.correct) {
      setScore(s => s + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });
      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
          completeGame('numbers', 'math-machine', stars, finalScore);
          celebrationFeedback(lang, soundEnabled);
          setGameComplete(true);
        } else {
          setRound(r => r + 1);
          generateRound();
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 900);
    }
  };

  const emojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍑', '🥝', '🍒', '🍌'];

  if (gameComplete) {
    const stars = score >= 70 ? 3 : score >= 40 ? 2 : 1;
    return (
      <div className="game-screen">
        <div className="game-body" style={{ textAlign: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}></div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cm-purple)' }}>
            {lang === 'bm' ? 'Tahniah! Matematik Hebat!' : 'Amazing Math Skills!'}
          </h2>
          <div style={{ fontSize: '2rem', margin: 'var(--space-md) 0' }}>
            {[1,2,3].map(s => <span key={s}>{s <= stars ? <StarIcon size={20} /> : <svg width={20} height={20} viewBox='0 0 24 24' fill='#DDD'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>}</span>)}
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 700 }}>{t('score', lang)}: {score}</p>
          <div className="action-buttons" style={{ marginTop: 'var(--space-lg)' }}>
            <button className="btn-secondary" onClick={() => { setRound(1); setScore(0); setGameComplete(false); generateRound(); }}>
              <RefreshIcon size={16} /> {t('playAgain', lang)}
            </button>
            <button className="btn-success" onClick={() => goToWorld('numbers')}>
              <CheckIcon size={16} /> {t('backToWorld', lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen" style={{ position: 'relative' }}>
      <img src={assetPath('/images/game/dice_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.85 }} />
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('numbers')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Mesin Matematik' : 'Math Machine'}
        </span>
        <div className="game-stars">
          <span style={{ fontWeight: 700, color: 'var(--cm-pink)' }}>
            {round}/{TOTAL_ROUNDS}
          </span>
        </div>
      </div>

      <div className="game-body" style={{ textAlign: 'center', gap: 'var(--space-md)' }}>
        {/* Vending Machine Display */}
        <div style={{
          background: 'linear-gradient(180deg, #6C5CE7 0%, #A29BFE 100%)',
          borderRadius: 24, padding: 'var(--space-lg)', color: 'white',
          boxShadow: 'var(--shadow-lg)', maxWidth: 380, margin: '0 auto',
          transform: machineAnim ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.3s ease'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: 4 }}>
            {lang === 'bm' ? 'MESIN MATEMATIK' : 'MATH MACHINE'}
          </div>

          {/* Visual Objects */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, margin: '12px 0', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: num1 }, (_, i) => (
                <span key={`a${i}`} style={{ fontSize: '1.8rem', animation: `popIn 0.3s ease ${i * 0.08}s both` }}>
                  {emojis[i % emojis.length]}
                </span>
              ))}
            </div>
            <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>+</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: num2 }, (_, i) => (
                <span key={`b${i}`} style={{ fontSize: '1.8rem', animation: `popIn 0.3s ease ${(num1 + i) * 0.08}s both` }}>
                  {emojis[(num1 + i) % emojis.length]}
                </span>
              ))}
            </div>
          </div>

          {/* Equation Display */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: '12px 20px',
            fontSize: '2.8rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
            letterSpacing: 4
          }}>
            {num1} + {num2} = ?
          </div>
        </div>

        {/* Answer Buttons */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
          maxWidth: 300, margin: '0 auto'
        }}>
          {options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt)} style={{
              background: feedback && opt.correct ? '#6BCB77' :
                         feedback && !opt.correct && feedback.type === 'wrong' ? '#FF6B6B55' :
                         'white',
              border: '3px solid #E0E0E0', borderRadius: 16, padding: '16px 8px',
              fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              transform: feedback && opt.correct ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }}>
              {opt.val}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            padding: '10px 20px', borderRadius: 16,
            background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B',
            color: 'white', fontWeight: 700, fontSize: '1.1rem',
            animation: 'popIn 0.3s ease'
          }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================
// ANIMAL FOOD GAME (Apa Dia Makan?)
// Drag/tap to feed animals the right food!
// ============================================
export function AnimalFoodGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const ANIMALS = [
    { nameBm: 'Kucing', nameEn: 'Cat', image: assetPath('/animals/cat.jpg'), food: 'fish', foodEmoji: '🐟', foodBm: 'Ikan', foodEn: 'Fish' },
    { nameBm: 'Arnab', nameEn: 'Rabbit', image: assetPath('/animals/rabbit.jpg'), food: 'carrot', foodEmoji: '🥕', foodBm: 'Lobak', foodEn: 'Carrot' },
    { nameBm: 'Monyet', nameEn: 'Monkey', image: assetPath('/animals/monkey.jpg'), food: 'banana', foodEmoji: '🍌', foodBm: 'Pisang', foodEn: 'Banana' },
    { nameBm: 'Gajah', nameEn: 'Elephant', image: assetPath('/animals/elephant.jpg'), food: 'leaves', foodEmoji: '🌿', foodBm: 'Daun', foodEn: 'Leaves' },
    { nameBm: 'Anjing', nameEn: 'Dog', image: assetPath('/animals/dog.jpg'), food: 'bone', foodEmoji: '🦴', foodBm: 'Tulang', foodEn: 'Bone' },
    { nameBm: 'Burung', nameEn: 'Bird', image: assetPath('/animals/bird.jpg'), food: 'seeds', foodEmoji: '🌾', foodBm: 'Biji', foodEn: 'Seeds' },
    { nameBm: 'Panda', nameEn: 'Panda', image: assetPath('/animals/panda.jpg'), food: 'bamboo', foodEmoji: '🎋', foodBm: 'Buluh', foodEn: 'Bamboo' },
    { nameBm: 'Singa', nameEn: 'Lion', image: assetPath('/animals/lion.jpg'), food: 'meat', foodEmoji: '🥩', foodBm: 'Daging', foodEn: 'Meat' },
  ];

  const TOTAL_ROUNDS = 15;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [currentAnimal, setCurrentAnimal] = useState(null);
  const [foodOptions, setFoodOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [usedAnimals, setUsedAnimals] = useState([]);

  const generateRound = useCallback((used = []) => {
    const available = ANIMALS.filter(a => !used.includes(a.food));
    if (available.length === 0) return;
    const animal = available[Math.floor(Math.random() * available.length)];
    setCurrentAnimal(animal);

    // Create food options: 1 correct + 3 wrong
    const allFoods = ANIMALS.map(a => ({ emoji: a.foodEmoji, name: lang === 'bm' ? a.foodBm : a.foodEn, key: a.food }));
    const wrong = allFoods.filter(f => f.key !== animal.food).sort(() => Math.random() - 0.5).slice(0, 3);
    const correct = allFoods.find(f => f.key === animal.food);
    const shuffled = [correct, ...wrong].sort(() => Math.random() - 0.5);
    setFoodOptions(shuffled);
    setFeedback(null);
    if (soundEnabled) playNewRoundSound();
  }, [lang, soundEnabled]);

  useEffect(() => { generateRound([]); }, [generateRound]);

  const handleFoodSelect = (food) => {
    if (feedback) return;
    if (food.key === currentAnimal.food) {
      setScore(s => s + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });
      const newUsed = [...usedAnimals, currentAnimal.food];
      setUsedAnimals(newUsed);
      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 50 ? 3 : finalScore >= 30 ? 2 : 1;
          completeGame('animals', 'animal-food', stars, finalScore);
          celebrationFeedback(lang, soundEnabled);
          setGameComplete(true);
        } else {
          setRound(r => r + 1);
          generateRound(newUsed);
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 900);
    }
  };

  if (gameComplete) {
    const stars = score >= 50 ? 3 : score >= 30 ? 2 : 1;
    return (
      <div className="game-screen">
        <div className="game-body" style={{ textAlign: 'center', justifyContent: 'center' }}>
          <div style={{ marginBottom: 8 }}><TrophyIcon size={48} /></div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cm-green)' }}>
            {lang === 'bm' ? 'Semua Haiwan Kenyang!' : 'All Animals Fed!'}
          </h2>
          <div style={{ fontSize: '2rem', margin: 'var(--space-md) 0' }}>
            {[1,2,3].map(s => <span key={s}>{s <= stars ? <StarIcon size={20} /> : <svg width={20} height={20} viewBox='0 0 24 24' fill='#DDD'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>}</span>)}
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 700 }}>{t('score', lang)}: {score}</p>
          <div className="action-buttons" style={{ marginTop: 'var(--space-lg)' }}>
            <button className="btn-secondary" onClick={() => { setRound(0); setScore(0); setGameComplete(false); setUsedAnimals([]); generateRound([]); }}>
              <RefreshIcon size={16} /> {t('playAgain', lang)}
            </button>
            <button className="btn-success" onClick={() => goToWorld('animals')}>
              <CheckIcon size={16} /> {t('backToWorld', lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentAnimal) return null;

  return (
    <div className="game-screen" style={{ position: 'relative' }}>
      <img src={assetPath('/images/game/animal_food_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.85 }} />
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('animals')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Apa Dia Makan?' : 'What Do They Eat?'}
        </span>
        <div className="game-stars">
          <span style={{ fontWeight: 700, color: 'var(--cm-green)' }}>
            {round + 1}/{TOTAL_ROUNDS}
          </span>
        </div>
      </div>

      <div className="game-body" style={{ textAlign: 'center', gap: 'var(--space-md)' }}>
        {/* Animal Display */}
        <div style={{
          background: 'white', borderRadius: 24, padding: 'var(--space-lg)',
          boxShadow: 'var(--shadow-lg)', maxWidth: 280, margin: '0 auto'
        }}>
          <img src={currentAnimal.image} alt={lang === 'bm' ? currentAnimal.nameBm : currentAnimal.nameEn}
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--cm-green)' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cm-green)', marginTop: 8 }}>
            {lang === 'bm' ? currentAnimal.nameBm : currentAnimal.nameEn}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {lang === 'bm' ? 'Apa makanan dia?' : 'What does it eat?'}
          </p>
        </div>

        {/* Food Options */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
          maxWidth: 320, margin: '0 auto'
        }}>
          {foodOptions.map((food, i) => (
            <button key={i} onClick={() => handleFoodSelect(food)} style={{
              background: feedback?.type === 'correct' && food.key === currentAnimal.food ? '#6BCB77' :
                         feedback?.type === 'wrong' && food.key !== currentAnimal.food ? '#fff5f5' :
                         'white',
              border: '3px solid #E0E0E0', borderRadius: 16, padding: '14px 8px',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.2s ease',
              transform: feedback?.type === 'correct' && food.key === currentAnimal.food ? 'scale(1.1)' : 'scale(1)'
            }}>
              <GI e={food.emoji} size={35}/>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555' }}>{food.name}</span>
            </button>
          ))}
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            padding: '10px 20px', borderRadius: 16,
            background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B',
            color: 'white', fontWeight: 700, fontSize: '1.1rem',
            animation: 'popIn 0.3s ease'
          }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================
// FREE DRAW GAME (Lukis Bersama)
// Touch/mouse drawing canvas for creative play
// ============================================
export function FreeDrawGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const [color, setColor] = useState('#FF6B6B');
  const [brushSize, setBrushSize] = useState(6);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasRef] = useState({ current: null });

  const COLORS = [
    '#FF6B6B', '#FF8C42', '#FFD93D', '#6BCB77', '#4A90D9',
    '#9B72CF', '#FF69B4', '#2D3436', '#FFFFFF', '#A0522D'
  ];

  const getCanvas = () => canvasRef.current;
  const getCtx = () => getCanvas()?.getContext('2d');

  const setCanvasRef = useCallback((node) => {
    if (node) {
      canvasRef.current = node;
      const ctx = node.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, node.width, node.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const getPos = (e) => {
    const canvas = getCanvas();
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = (e) => {
    e?.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const ctx = getCtx();
    const canvas = getCanvas();
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (soundEnabled) playNavigateSound();
  };

  const handleDone = () => {
    completeGame('colours', 'free-draw', 3, 100);
    celebrationFeedback(lang, soundEnabled);
    goToWorld('colours');
  };

  return (
    <div className="game-screen" style={{ position: 'relative' }}>
      <img src={assetPath('/images/game/drawing_studio_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.85 }} />
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('colours')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Lukis Bersama' : 'Draw Together'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={clearCanvas} style={{
            background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: 12,
            padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
          }}>
            {lang === 'bm' ? 'Padam' : 'Clear'}
          </button>
          <button onClick={handleDone} style={{
            background: '#6BCB77', border: 'none', borderRadius: 12,
            padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', color: 'white'
          }}>
            <CheckIcon size={14} /> {lang === 'bm' ? 'Siap!' : 'Done!'}
          </button>
        </div>
      </div>

      <div className="game-body" style={{ padding: 'var(--space-sm)', gap: 'var(--space-sm)' }}>
        {/* Canvas */}
        <div style={{
          background: 'white', borderRadius: 16, boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden', width: '100%', maxWidth: 500, margin: '0 auto',
          touchAction: 'none'
        }}>
          <canvas
            ref={setCanvasRef}
            width={500}
            height={400}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>

        {/* Color Palette */}
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
          background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: '8px 12px'
        }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); if (soundEnabled) playTapSound(); }} style={{
              width: 32, height: 32, borderRadius: '50%', background: c,
              border: color === c ? '3px solid #333' : '2px solid #ddd',
              cursor: 'pointer', transition: 'transform 0.15s ease',
              transform: color === c ? 'scale(1.2)' : 'scale(1)',
              boxShadow: color === c ? '0 0 8px rgba(0,0,0,0.3)' : 'none'
            }} />
          ))}
        </div>

        {/* Brush Size */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center',
          background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: '6px 16px'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666' }}>
            {lang === 'bm' ? 'Saiz:' : 'Size:'}
          </span>
          {[3, 6, 12, 20].map(s => (
            <button key={s} onClick={() => setBrushSize(s)} style={{
              width: Math.max(20, s + 16), height: Math.max(20, s + 16),
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: brushSize === s ? color : '#f0f0f0',
              border: brushSize === s ? '2px solid #333' : '2px solid #ddd',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}>
              <div style={{
                width: s, height: s, borderRadius: '50%',
                background: brushSize === s ? 'white' : '#999'
              }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============================================
// SUBTRACTION SHOP GAME (Kedai Tolak)
// Fun subtraction with visual items at a shop!
// ============================================
export function SubtractionShopGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 15;
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [soldItems, setSoldItems] = useState([]);

  const ITEMS = ['🧁', '🍪', '🍩', '🍰', '🧃', '🍫', '🍬', '🍭', '🥤', '🎂'];

  const generateRound = useCallback(() => {
    const total = Math.floor(Math.random() * 7) + 3; // 3-9
    const sold = Math.floor(Math.random() * (total - 1)) + 1; // 1 to total-1
    const correct = total - sold;
    setNum1(total);
    setNum2(sold);
    setSoldItems([]);

    const wrongSet = new Set();
    while (wrongSet.size < 3) {
      const w = Math.floor(Math.random() * 9) + 1;
      if (w !== correct) wrongSet.add(w);
    }
    const allOptions = [correct, ...wrongSet].sort(() => Math.random() - 0.5);
    setOptions(allOptions.map(val => ({ val, correct: val === correct })));
    setFeedback(null);

    // Animate items being "sold"
    setTimeout(() => {
      const indices = [];
      while (indices.length < sold) {
        const idx = Math.floor(Math.random() * total);
        if (!indices.includes(idx)) indices.push(idx);
      }
      setSoldItems(indices);
    }, 800);
  }, []);

  useEffect(() => { generateRound(); }, [generateRound]);

  const handleAnswer = (opt) => {
    if (feedback) return;
    if (opt.correct) {
      setScore(s => s + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });
      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
          completeGame('numbers', 'subtraction-shop', stars, finalScore);
          celebrationFeedback(lang, soundEnabled);
          setGameComplete(true);
        } else {
          setRound(r => r + 1);
          generateRound();
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 900);
    }
  };

  if (gameComplete) {
    const stars = score >= 70 ? 3 : score >= 40 ? 2 : 1;
    return (
      <div className="game-screen">
        <div className="game-body" style={{ textAlign: 'center', justifyContent: 'center' }}>
          <div style={{ marginBottom: 8 }}><TrophyIcon size={48} /></div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cm-pink)' }}>
            {lang === 'bm' ? 'Kedai Tutup! Matematik Hebat!' : 'Shop Closed! Great Math!'}
          </h2>
          <div style={{ fontSize: '2rem', margin: 'var(--space-md) 0' }}>
            {[1,2,3].map(s => <span key={s}>{s <= stars ? <StarIcon size={20} /> : <svg width={20} height={20} viewBox='0 0 24 24' fill='#DDD'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>}</span>)}
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 700 }}>{t('score', lang)}: {score}</p>
          <div className="action-buttons" style={{ marginTop: 'var(--space-lg)' }}>
            <button className="btn-secondary" onClick={() => { setRound(1); setScore(0); setGameComplete(false); generateRound(); }}>
              <RefreshIcon size={16} /> {t('playAgain', lang)}
            </button>
            <button className="btn-success" onClick={() => goToWorld('numbers')}>
              <CheckIcon size={16} /> {t('backToWorld', lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const itemEmoji = ITEMS[round % ITEMS.length];

  return (
    <div className="game-screen" style={{ position: 'relative' }}>
      <img src={assetPath('/images/game/grocery_store_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.85 }} />
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('numbers')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Kedai Tolak' : 'Subtraction Shop'}
        </span>
        <div className="game-stars">
          <span style={{ fontWeight: 700, color: 'var(--cm-orange)' }}>
            {round}/{TOTAL_ROUNDS}
          </span>
        </div>
      </div>

      <div className="game-body" style={{ textAlign: 'center', gap: 'var(--space-md)' }}>
        {/* Shop Display */}
        <div style={{
          background: 'linear-gradient(180deg, #FF6B6B 0%, #FF8E8E 100%)',
          borderRadius: 24, padding: 'var(--space-lg)', color: 'white',
          boxShadow: 'var(--shadow-lg)', maxWidth: 380, margin: '0 auto'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: 8 }}>
            {lang === 'bm' ? 'KEDAI KUIH' : 'BAKERY SHOP'}
          </div>

          {/* Visual Items */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', margin: '12px 0', minHeight: 60 }}>
            {Array.from({ length: num1 }, (_, i) => (
              <span key={i} style={{
                fontSize: '2rem',
                opacity: soldItems.includes(i) ? 0.2 : 1,
                textDecoration: soldItems.includes(i) ? 'line-through' : 'none',
                transition: 'all 0.5s ease',
                transform: soldItems.includes(i) ? 'scale(0.7) translateY(10px)' : 'scale(1)'
              }}>
                {itemEmoji}
              </span>
            ))}
          </div>

          {/* Equation */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: '12px 20px',
            fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
            letterSpacing: 4
          }}>
            {num1} - {num2} = ?
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: 6, opacity: 0.8 }}>
            {lang === 'bm' ? `${num2} kuih telah dijual!` : `${num2} were sold!`}
          </div>
        </div>

        {/* Answer Buttons */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
          maxWidth: 300, margin: '0 auto'
        }}>
          {options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt)} style={{
              background: feedback && opt.correct ? '#6BCB77' : 'white',
              border: '3px solid #E0E0E0', borderRadius: 16, padding: '16px 8px',
              fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              transform: feedback && opt.correct ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }}>
              {opt.val}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            padding: '10px 20px', borderRadius: 16,
            background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B',
            color: 'white', fontWeight: 700, fontSize: '1.1rem',
            animation: 'popIn 0.3s ease'
          }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================
// ROAD SAFETY GAME (Jalan Raya)
// Control the traffic light — Red/Yellow/Green!
// ============================================
export function RoadSafetyGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const SCENARIOS = [
    { situation: { bm: 'Lampu MERAH menyala. Apa patut buat?', en: 'The RED light is on. What should you do?' },
      lightColor: '#FF4444', correct: 'stop',
      options: [
        { key: 'stop', bm: 'Berhenti', en: 'Stop' },
        { key: 'go', bm: 'Jalan', en: 'Walk' },
        { key: 'run', bm: 'Lari', en: 'Run' }
      ]},
    { situation: { bm: 'Lampu HIJAU menyala. Apa patut buat?', en: 'The GREEN light is on. What should you do?' },
      lightColor: '#4CAF50', correct: 'go',
      options: [
        { key: 'stop', bm: 'Berhenti', en: 'Stop' },
        { key: 'go', bm: 'Jalan dengan selamat', en: 'Walk safely' },
        { key: 'run', bm: 'Lari laju', en: 'Run fast' }
      ]},
    { situation: { bm: 'Lampu KUNING menyala. Apa patut buat?', en: 'The YELLOW light is on. What should you do?' },
      lightColor: '#FFD700', correct: 'wait',
      options: [
        { key: 'go', bm: 'Jalan terus', en: 'Keep walking' },
        { key: 'wait', bm: '⏳ Tunggu & bersedia', en: '⏳ Wait & get ready' },
        { key: 'run', bm: 'Lari', en: 'Run' }
      ]},
    { situation: { bm: 'Hendak melintas jalan. Apa patut buat dahulu?', en: 'Want to cross the road. What should you do first?' },
      lightColor: '#4A90D9', correct: 'look',
      options: [
        { key: 'run', bm: 'Lari lintasi', en: 'Run across' },
        { key: 'look', bm: 'Tengok kiri-kanan', en: 'Look left-right' },
        { key: 'close', bm: 'Pejam mata', en: 'Close eyes' }
      ]},
    { situation: { bm: 'Nampak zebra crossing. Di mana patut melintas?', en: 'You see a zebra crossing. Where should you cross?' },
      lightColor: '#2D3436', correct: 'zebra',
      options: [
        { key: 'anywhere', bm: 'Mana-mana saja', en: 'Anywhere' },
        { key: 'zebra', bm: 'Di zebra crossing', en: 'At the zebra crossing' },
        { key: 'behind', bm: 'Belakang kereta', en: 'Behind the car' }
      ]},
    { situation: { bm: 'Berjalan di tepi jalan. Di mana patut berjalan?', en: 'Walking on the roadside. Where should you walk?' },
      lightColor: '#6BCB77', correct: 'sidewalk',
      options: [
        { key: 'middle', bm: '🛣️ Tengah jalan', en: '🛣️ Middle of road' },
        { key: 'sidewalk', bm: 'Di kaki lima', en: 'On the sidewalk' },
        { key: 'backwards', bm: 'Berjalan undur', en: 'Walk backwards' }
      ]},
  ];

  const TOTAL_ROUNDS = SCENARIOS.length;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);

  const scenario = SCENARIOS[round];

  const handleAnswer = (opt) => {
    if (feedback) return;
    if (opt.key === scenario.correct) {
      setScore(s => s + 10);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });
      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 50 ? 3 : finalScore >= 30 ? 2 : 1;
          completeGame('transport', 'road-safety', stars, finalScore);
          celebrationFeedback(lang, soundEnabled);
          setGameComplete(true);
        } else {
          setRound(r => r + 1);
          setFeedback(null);
        }
      }, 1200);
    } else {
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => setFeedback(null), 900);
    }
  };

  if (gameComplete) {
    const stars = score >= 50 ? 3 : score >= 30 ? 2 : 1;
    return (
      <div className="game-screen">
        <div className="game-body" style={{ textAlign: 'center', justifyContent: 'center' }}>
          <div style={{ marginBottom: 8 }}><TrophyIcon size={48} /></div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cm-orange)' }}>
            {lang === 'bm' ? 'Pandai Keselamatan Jalan!' : 'Road Safety Expert!'}
          </h2>
          <div style={{ fontSize: '2rem', margin: 'var(--space-md) 0' }}>
            {[1,2,3].map(s => <span key={s}>{s <= stars ? <StarIcon size={20} /> : <svg width={20} height={20} viewBox='0 0 24 24' fill='#DDD'><path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/></svg>}</span>)}
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 700 }}>{t('score', lang)}: {score}</p>
          <div className="action-buttons" style={{ marginTop: 'var(--space-lg)' }}>
            <button className="btn-secondary" onClick={() => { setRound(0); setScore(0); setGameComplete(false); }}>
              <RefreshIcon size={16} /> {t('playAgain', lang)}
            </button>
            <button className="btn-success" onClick={() => goToWorld('transport')}>
              <CheckIcon size={16} /> {t('backToWorld', lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen" style={{ position: 'relative' }}>
      <img src={assetPath('/images/game/road_scene_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.85 }} />
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('transport')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Jalan Raya' : 'Road Safety'}
        </span>
        <div className="game-stars">
          <span style={{ fontWeight: 700, color: 'var(--cm-orange)' }}>
            {round + 1}/{TOTAL_ROUNDS}
          </span>
        </div>
      </div>

      <div className="game-body" style={{ textAlign: 'center', gap: 'var(--space-md)' }}>
        {/* Traffic Light */}
        <div style={{
          background: '#2D3436', borderRadius: 24, padding: '20px 30px',
          display: 'inline-flex', flexDirection: 'column', gap: 12,
          boxShadow: 'var(--shadow-lg)', margin: '0 auto'
        }}>
          {['#FF4444', '#FFD700', '#4CAF50'].map(lc => (
            <div key={lc} style={{
              width: 50, height: 50, borderRadius: '50%',
              background: scenario.lightColor === lc ? lc : '#444',
              boxShadow: scenario.lightColor === lc ? `0 0 20px ${lc}` : 'none',
              transition: 'all 0.5s ease'
            }} />
          ))}
        </div>

        {/* Question */}
        <div style={{
          background: 'white', borderRadius: 20, padding: 'var(--space-md) var(--space-lg)',
          boxShadow: 'var(--shadow-md)', maxWidth: 360, margin: '0 auto'
        }}>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#333' }}>
            {lang === 'bm' ? scenario.situation.bm : scenario.situation.en}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto', width: '100%' }}>
          {scenario.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt)} style={{
              background: feedback?.type === 'correct' && opt.key === scenario.correct ? '#6BCB77' : 'white',
              border: '3px solid #E0E0E0', borderRadius: 16, padding: '14px 18px',
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)', textAlign: 'left',
              transform: feedback?.type === 'correct' && opt.key === scenario.correct ? 'scale(1.03)' : 'scale(1)',
              color: feedback?.type === 'correct' && opt.key === scenario.correct ? 'white' : '#333',
              transition: 'all 0.2s ease'
            }}>
              {lang === 'bm' ? opt.bm : opt.en}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            padding: '10px 20px', borderRadius: 16,
            background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B',
            color: 'white', fontWeight: 700, animation: 'popIn 0.3s ease'
          }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// GROCERY STORE GAME (Kedai Runcit)
// Shop for ingredients from the grocery list!
// ============================================
export function GroceryStoreGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const RECIPES = [
    { name: lang === 'bm' ? 'Nasi Goreng' : 'Fried Rice', emoji: '🍚', items: ['🍚','🥚','🧅','🧄','🫑'], wrong: ['🍰','🍭','🍩','🧁','🍫'] },
    { name: lang === 'bm' ? 'Sup Sayur' : 'Veggie Soup', emoji: '🥣', items: ['🥕','🥔','🌽','🧅','🥦'], wrong: ['🍦','🍬','🍪','🎂','🧃'] },
    { name: lang === 'bm' ? 'Salad Buah' : 'Fruit Salad', emoji: '🥗', items: ['🍎','🍊','🍇','🍓','🥝'], wrong: ['🍟','🍔','🌭','🍕','🧀'] },
  ];
  
  const [recipeIdx, setRecipeIdx] = useState(0);
  const [basket, setBasket] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  
  const setupShelf = useCallback((idx) => {
    const recipe = RECIPES[idx];
    const all = [...recipe.items, ...recipe.wrong].sort(() => Math.random() - 0.5);
    setShelves(all);
    setBasket([]);
  }, []);
  
  useEffect(() => { setupShelf(0); }, []);
  
  const handlePick = (item) => {
    const recipe = RECIPES[recipeIdx];
    if (recipe.items.includes(item) && !basket.includes(item)) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      const newBasket = [...basket, item];
      setBasket(newBasket);
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      
      if (newBasket.length === recipe.items.length) {
        const newScore = score + 1;
        setScore(newScore);
        setTimeout(() => {
          if (recipeIdx + 1 < RECIPES.length) {
            setRecipeIdx(recipeIdx + 1);
            setupShelf(recipeIdx + 1);
            setFeedback(null);
          } else {
            if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
            const stars = newScore >= 3 ? 3 : newScore >= 2 ? 2 : 1;
            completeGame('food', 'grocery-store', stars, newScore * 30);
            setGameComplete(true);
          }
        }, 800);
      }
    } else if (!recipe.items.includes(item)) {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    setTimeout(() => setFeedback(null), 1500);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>
          {lang === 'bm' ? 'Tahniah, Chef Kecil!' : 'Great Shopping!'}
        </h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('food')}>
          {lang === 'bm' ? '← Kembali' : '← Back'}
        </button>
      </div>
    );
  }
  
  const recipe = RECIPES[recipeIdx];
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/grocery_store_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('food')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <div style={{ textAlign: 'center' }}><GI e={recipe.emoji} size={32}/></div>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100', margin: '4px 0' }}>
          {lang === 'bm' ? `Beli bahan untuk ${recipe.name}!` : `Shop for ${recipe.name}!`}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>
          {lang === 'bm' ? `Resepi ${recipeIdx + 1}/${RECIPES.length}` : `Recipe ${recipeIdx + 1}/${RECIPES.length}`}
        </div>
        
        {/* Basket */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0',
          padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: 16,
          minHeight: 50, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span></span>
          {recipe.items.map((item, i) => (
            <div key={i} style={{
              width: 40, height: 40, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
              background: basket.includes(item) ? 'rgba(107,203,119,0.3)' : 'rgba(200,200,200,0.3)',
              border: basket.includes(item) ? '2px solid #6BCB77' : '2px dashed #CCC',
            }}>
              {basket.includes(item) ? item : '?'}
            </div>
          ))}
        </div>
        
        {/* Shelf */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8,
          maxWidth: 350, margin: '0 auto',
        }}>
          {shelves.map((item, i) => (
            <button key={i} onClick={() => handlePick(item)} style={{
              padding: 10, borderRadius: 14,
              background: basket.includes(item) ? '#E0E0E0' : 'white',
              border: '2px solid rgba(0,0,0,0.08)',
              boxShadow: 'var(--shadow-sm)', cursor: basket.includes(item) ? 'default' : 'pointer',
              opacity: basket.includes(item) ? 0.4 : 1,
              transition: 'all 0.2s',
            }}><GI e={item} size={32}/></button>
          ))}
        </div>
        
        {feedback && (
          <div style={{
            marginTop: 12, padding: '8px 16px', borderRadius: 12,
            background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B',
            color: 'white', fontWeight: 700, animation: 'popIn 0.3s ease',
            display: 'inline-block',
          }}>{feedback.type === 'correct' ? '' : ''}{feedback.message}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// OUR GARDEN GAME (Kebun Kita)
// Grow your own food — tap stages to advance!
// ============================================
export function OurGardenGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const PLANTS = [
    { name: lang === 'bm' ? 'Tomato' : 'Tomato', stages: ['🕳️','🌱','🪴','🌿','🍅'], water: 3 },
    { name: lang === 'bm' ? 'Bunga Matahari' : 'Sunflower', stages: ['🕳️','🌱','🪴','🌿','🌻'], water: 3 },
    { name: lang === 'bm' ? 'Lobak Merah' : 'Carrot', stages: ['🕳️','🌱','🪴','🌿','🥕'], water: 3 },
  ];
  
  const [plantIdx, setPlantIdx] = useState(0);
  const [stage, setStage] = useState(0);
  const [waterCount, setWaterCount] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showSun, setShowSun] = useState(false);
  
  const handleWater = () => {
    if (soundEnabled) playTapSound();
    const newWater = waterCount + 1;
    setWaterCount(newWater);
    
    if (newWater >= PLANTS[plantIdx].water) {
      if (stage < PLANTS[plantIdx].stages.length - 1) {
        setStage(stage + 1);
        setWaterCount(0);
        if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
        setShowSun(true);
        setTimeout(() => setShowSun(false), 1000);
        
        if (stage + 1 === PLANTS[plantIdx].stages.length - 1) {
          const newScore = score + 1;
          setScore(newScore);
          setTimeout(() => {
            if (plantIdx + 1 < PLANTS.length) {
              setPlantIdx(plantIdx + 1);
              setStage(0);
              setWaterCount(0);
            } else {
              if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
              completeGame('food', 'our-garden', newScore >= 3 ? 3 : newScore >= 2 ? 2 : 1, newScore * 30);
              setGameComplete(true);
            }
          }, 1500);
        }
      }
    }
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>
          {lang === 'bm' ? 'Kebun kamu cantik!' : 'Beautiful garden!'}
        </h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('food')}>
          {lang === 'bm' ? '← Kembali' : '← Back'}
        </button>
      </div>
    );
  }
  
  const plant = PLANTS[plantIdx];
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/garden_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('food')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>
          {lang === 'bm' ? `Tanam ${plant.name}!` : `Grow ${plant.name}!`}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>
          {lang === 'bm' ? `Pokok ${plantIdx + 1}/${PLANTS.length}` : `Plant ${plantIdx + 1}/${PLANTS.length}`}
        </div>
        
        {/* Garden scene */}
        <div style={{
          margin: '24px auto', width: 200, height: 200,
          background: 'linear-gradient(180deg, #87CEEB 50%, #8B5E3C 50%)',
          borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {showSun && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: '2rem', animation: 'popIn 0.3s ease' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="#FBBF24" style={{display:"inline-block"}}><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="#FBBF24" strokeWidth="2" fill="none"/></svg></div>}
          <div style={{ transition: 'all 0.5s ease', transform: stage > 0 ? 'scale(1)' : 'scale(0.7)' }}>
            <GI e={plant.stages[stage]} size={80}/>
          </div>
        </div>
        
        {/* Water progress */}
        <div style={{ maxWidth: 200, margin: '0 auto 16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
            {Array.from({ length: plant.water }).map((_, i) => (
              <span key={i} style={{ fontSize: '1.2rem', opacity: i < waterCount ? 1 : 0.3 }}></span>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {lang === 'bm' ? `Peringkat ${stage + 1}/${plant.stages.length}` : `Stage ${stage + 1}/${plant.stages.length}`}
          </div>
        </div>
        
        <button onClick={handleWater} style={{
          fontSize: '2rem', padding: '16px 40px', borderRadius: 20,
          background: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(33,150,243,0.4)',
          fontFamily: 'var(--font-heading)', fontWeight: 800,
          transition: 'transform 0.15s ease',
        }}>
          {lang === 'bm' ? 'Siram!' : 'Water!'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// LITTLE CHEF GAME (Chef Kecil)
// Follow recipe steps to cook a meal!
// ============================================
export function LittleChefGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const RECIPES = [
    {
      name: lang === 'bm' ? 'Roti Bakar' : 'Toast',
      emoji: '🍞',
      steps: [
        { action: lang === 'bm' ? 'Ambil roti' : 'Get bread', emoji: '🍞', choices: ['🍞','🍰','🥧'] },
        { action: lang === 'bm' ? 'Sapu mentega' : 'Spread butter', emoji: '🧈', choices: ['🧈','🧴','🫙'] },
        { action: lang === 'bm' ? 'Panggang roti' : 'Toast it', emoji: '🔥', choices: ['🔥','❄️','💨'] },
      ]
    },
    {
      name: lang === 'bm' ? 'Jus Oren' : 'Orange Juice',
      emoji: '🍊',
      steps: [
        { action: lang === 'bm' ? 'Ambil oren' : 'Get oranges', emoji: '🍊', choices: ['🍊','🍆','🥑'] },
        { action: lang === 'bm' ? 'Perah oren' : 'Squeeze them', emoji: '🤲', choices: ['🤲','🦶','👂'] },
        { action: lang === 'bm' ? 'Tuang dalam gelas' : 'Pour in glass', emoji: '🥤', choices: ['🥤','🪣','🧃'] },
      ]
    },
  ];
  
  const [recipeIdx, setRecipeIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [doneSteps, setDoneSteps] = useState([]);
  
  const handleChoice = (emoji) => {
    const recipe = RECIPES[recipeIdx];
    const step = recipe.steps[stepIdx];
    
    if (emoji === step.emoji) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setDoneSteps([...doneSteps, step.emoji]);
      
      setTimeout(() => {
        setFeedback(null);
        if (stepIdx + 1 < recipe.steps.length) {
          setStepIdx(stepIdx + 1);
        } else {
          const newScore = score + 1;
          setScore(newScore);
          if (recipeIdx + 1 < RECIPES.length) {
            setRecipeIdx(recipeIdx + 1);
            setStepIdx(0);
            setDoneSteps([]);
          } else {
            if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
            completeGame('food', 'little-chef', newScore >= 2 ? 3 : 2, newScore * 40);
            setGameComplete(true);
          }
        }
      }, 800);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
      setTimeout(() => setFeedback(null), 1200);
    }
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>
          {lang === 'bm' ? 'Chef Hebat!' : 'Great Chef!'}
        </h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('food')}>
          {lang === 'bm' ? '← Kembali' : '← Back'}
        </button>
      </div>
    );
  }
  
  const recipe = RECIPES[recipeIdx];
  const step = recipe.steps[stepIdx];
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/kitchen_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('food')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>
          {recipe.emoji} {recipe.name}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>
          {lang === 'bm' ? `Resepi ${recipeIdx + 1}/${RECIPES.length}` : `Recipe ${recipeIdx + 1}/${RECIPES.length}`}
        </div>
        
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0' }}>
          {recipe.steps.map((s, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: i < stepIdx ? '#6BCB77' : i === stepIdx ? '#FF9800' : '#E0E0E0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', color: 'white', fontWeight: 800,
            }}>
              {i < stepIdx ? '✓' : i + 1}
            </div>
          ))}
        </div>
        
        <div style={{
          background: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 20,
          margin: '16px auto', maxWidth: 320,
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
            {lang === 'bm' ? `Langkah ${stepIdx + 1}:` : `Step ${stepIdx + 1}:`}
          </div>
          <div style={{ fontSize: '1.1rem', color: '#555', marginBottom: 16 }}>{step.action}</div>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {step.choices.map((c, i) => (
              <button key={i} onClick={() => handleChoice(c)} style={{
                fontSize: '2.5rem', padding: 16, borderRadius: 20,
                background: 'white', border: '3px solid rgba(0,0,0,0.08)',
                boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}>{c}</button>
            ))}
          </div>
        </div>
        
        {feedback && (
          <div style={{
            marginTop: 12, padding: '8px 16px', borderRadius: 12,
            background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B',
            color: 'white', fontWeight: 700, display: 'inline-block',
          }}>{feedback.type === 'correct' ? '' : ''}{feedback.message}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// HEALTHY OR NOT GAME (Sihat atau Tidak?)
// Sort foods into healthy vs unhealthy!
// ============================================
export function HealthyOrNotGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const FOODS = [
    { emoji: '🍎', name: 'Apple', healthy: true },
    { emoji: '🥦', name: 'Broccoli', healthy: true },
    { emoji: '🥕', name: 'Carrot', healthy: true },
    { emoji: '🐟', name: 'Fish', healthy: true },
    { emoji: '🥛', name: 'Milk', healthy: true },
    { emoji: '🍚', name: 'Rice', healthy: true },
    { emoji: '🍬', name: 'Candy', healthy: false },
    { emoji: '🍩', name: 'Donut', healthy: false },
    { emoji: '🍟', name: 'Fries', healthy: false },
    { emoji: '🍭', name: 'Lollipop', healthy: false },
    { emoji: '🧁', name: 'Cupcake', healthy: false },
    { emoji: '🥤', name: 'Soda', healthy: false },
  ];
  
  const [items, setItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  useEffect(() => {
    setItems(FOODS.sort(() => Math.random() - 0.5).slice(0, 8));
  }, []);
  
  const handleChoice = (isHealthy) => {
    if (currentIdx >= items.length) return;
    const correct = items[currentIdx].healthy === isHealthy;
    
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    
    setTimeout(() => {
      setFeedback(null);
      if (currentIdx + 1 < items.length) {
        setCurrentIdx(currentIdx + 1);
      } else {
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        const finalScore = correct ? score + 1 : score;
        const stars = finalScore >= 7 ? 3 : finalScore >= 5 ? 2 : 1;
        completeGame('food', 'healthy-or-not', stars, finalScore * 10);
        setGameComplete(true);
      }
    }, 800);
  };
  
  if (gameComplete) {
    const stars = score >= 7 ? 3 : score >= 5 ? 2 : 1;
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>
          {lang === 'bm' ? 'Bijak Pilih Makanan!' : 'Smart Food Choices!'}
        </h1>
        <p>{score}/{items.length} {lang === 'bm' ? 'betul' : 'correct'}</p>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('food')}>
          {lang === 'bm' ? '← Kembali' : '← Back'}
        </button>
      </div>
    );
  }
  
  if (items.length === 0) return null;
  const current = items[currentIdx];
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/healthy_or_not_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('food')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>
          {lang === 'bm' ? 'Sihat atau Tidak?' : 'Healthy or Not?'}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>
          {currentIdx + 1}/{items.length}
        </div>
        
        {/* Food card */}
        <div style={{
          margin: '24px auto', width: 180, height: 180,
          background: 'white', borderRadius: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', boxShadow: 'var(--shadow-lg)',
          animation: 'popIn 0.3s ease',
        }}><GI e={current.emoji} size={80}/></div>
        
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>{current.name}</div>
        
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={() => handleChoice(true)} style={{
            fontSize: '1.1rem', padding: '14px 28px', borderRadius: 20,
            background: '#6BCB77', color: 'white', border: 'none',
            fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-heading)',
          }}>
            <CheckIcon size={14} /> {lang === 'bm' ? 'Sihat!' : 'Healthy!'}
          </button>
          <button onClick={() => handleChoice(false)} style={{
            fontSize: '1.1rem', padding: '14px 28px', borderRadius: 20,
            background: '#FF6B6B', color: 'white', border: 'none',
            fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-heading)',
          }}>
            <CloseIcon size={14} color="#EF4444" /> {lang === 'bm' ? 'Tidak!' : 'Not!'}
          </button>
        </div>
        
        {feedback && (
          <div style={{
            marginTop: 16, padding: '8px 16px', borderRadius: 12,
            background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B',
            color: 'white', fontWeight: 700, display: 'inline-block',
          }}>{feedback.type === 'correct' ? '' : ''}{feedback.message}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// FRUIT OR VEG GAME (Buah atau Sayur?)
// Classify foods into fruits vs vegetables!
// ============================================
export function FruitOrVegGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const ITEMS = [
    { emoji: '🍎', name: lang === 'bm' ? 'Epal' : 'Apple', type: 'fruit' },
    { emoji: '🍊', name: lang === 'bm' ? 'Oren' : 'Orange', type: 'fruit' },
    { emoji: '🍇', name: lang === 'bm' ? 'Anggur' : 'Grapes', type: 'fruit' },
    { emoji: '🍓', name: lang === 'bm' ? 'Strawberi' : 'Strawberry', type: 'fruit' },
    { emoji: '🍌', name: lang === 'bm' ? 'Pisang' : 'Banana', type: 'fruit' },
    { emoji: '🥕', name: lang === 'bm' ? 'Lobak' : 'Carrot', type: 'veg' },
    { emoji: '🥦', name: lang === 'bm' ? 'Brokoli' : 'Broccoli', type: 'veg' },
    { emoji: '🌽', name: lang === 'bm' ? 'Jagung' : 'Corn', type: 'veg' },
    { emoji: '🫑', name: lang === 'bm' ? 'Lada' : 'Pepper', type: 'veg' },
    { emoji: '🥬', name: lang === 'bm' ? 'Salad' : 'Lettuce', type: 'veg' },
  ];
  
  const [items, setItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [fruitBasket, setFruitBasket] = useState([]);
  const [vegBasket, setVegBasket] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  useEffect(() => {
    setItems(ITEMS.sort(() => Math.random() - 0.5).slice(0, 8));
  }, []);
  
  const handleSort = (type) => {
    if (currentIdx >= items.length) return;
    const item = items[currentIdx];
    const correct = item.type === type;
    
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
      if (type === 'fruit') setFruitBasket([...fruitBasket, item.emoji]);
      else setVegBasket([...vegBasket, item.emoji]);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    
    setTimeout(() => {
      setFeedback(null);
      if (currentIdx + 1 < items.length) {
        setCurrentIdx(currentIdx + 1);
      } else {
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        const finalScore = correct ? score + 1 : score;
        const stars = finalScore >= 7 ? 3 : finalScore >= 5 ? 2 : 1;
        completeGame('food', 'fruit-or-veg', stars, finalScore * 10);
        setGameComplete(true);
      }
    }, 800);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>
          {lang === 'bm' ? 'Bijak Mengasingkan!' : 'Great Sorting!'}
        </h1>
        <p>{score}/{items.length} {lang === 'bm' ? 'betul' : 'correct'}</p>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('food')}>
          {lang === 'bm' ? '← Kembali' : '← Back'}
        </button>
      </div>
    );
  }
  
  if (items.length === 0) return null;
  const current = items[currentIdx];
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/fruit_or_veg_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('food')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>
          {lang === 'bm' ? 'Buah atau Sayur?' : 'Fruit or Veg?'}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{currentIdx + 1}/{items.length}</div>
        
        {/* Baskets display */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, margin: '12px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#666' }}>{lang === 'bm' ? 'Buah' : 'Fruit'}</div>
            <div style={{ display: 'flex', gap: 2, minWidth: 60, justifyContent: 'center' }}>
              {fruitBasket.map((e, i) => <GI key={i} e={e} size={16}/>)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#666' }}>{lang === 'bm' ? 'Sayur' : 'Veg'}</div>
            <div style={{ display: 'flex', gap: 2, minWidth: 60, justifyContent: 'center' }}>
              {vegBasket.map((e, i) => <GI key={i} e={e} size={16}/>)}
            </div>
          </div>
        </div>
        
        {/* Current item */}
        <div style={{
          margin: '16px auto', width: 150, height: 150,
          background: 'white', borderRadius: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)', animation: 'popIn 0.3s ease',
        }}>
          <div style={{ marginBottom: 8 }}><TrophyIcon size={48} /></div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 4 }}>{current.name}</div>
        </div>
        
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
          <button onClick={() => handleSort('fruit')} style={{
            fontSize: '1rem', padding: '14px 28px', borderRadius: 20,
            background: 'linear-gradient(135deg, #FF6B9D, #FF8E53)',
            color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer',
            fontFamily: 'var(--font-heading)',
          }}>
            {lang === 'bm' ? 'Buah!' : 'Fruit!'}
          </button>
          <button onClick={() => handleSort('veg')} style={{
            fontSize: '1rem', padding: '14px 28px', borderRadius: 20,
            background: 'linear-gradient(135deg, #6BCB77, #48C9B0)',
            color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer',
            fontFamily: 'var(--font-heading)',
          }}>
            {lang === 'bm' ? 'Sayur!' : 'Veg!'}
          </button>
        </div>
        
        {feedback && (
          <div style={{
            marginTop: 16, padding: '8px 16px', borderRadius: 12,
            background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B',
            color: 'white', fontWeight: 700, display: 'inline-block',
          }}>{feedback.type === 'correct' ? '' : ''}{feedback.message}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// LETTER TRAIL GAME (Jejak Huruf)
// Trace letters by tapping dots in order!
// ============================================
export function LetterTrailGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawingRef = useRef(false);

  // Full A-Z letter stroke paths (0-100 coordinate system)
  const LETTER_PATHS = useMemo(() => ({
    'A': [[20,95],[50,5],[80,95]], 
    'B': [[20,95],[20,5],[65,5],[80,18],[80,30],[65,45],[20,45],[70,45],[85,60],[85,75],[65,95],[20,95]],
    'C': [[80,20],[60,5],[40,5],[20,25],[20,75],[40,95],[60,95],[80,80]],
    'D': [[20,95],[20,5],[55,5],[75,20],[85,50],[75,80],[55,95],[20,95]],
    'E': [[75,5],[20,5],[20,50],[60,50],[20,50],[20,95],[75,95]],
    'F': [[75,5],[20,5],[20,50],[60,50],[20,50],[20,95]],
    'G': [[75,20],[55,5],[35,5],[15,25],[15,75],[35,95],[60,95],[80,75],[80,50],[55,50]],
    'H': [[20,5],[20,95],[20,50],[80,50],[80,5],[80,95]],
    'I': [[30,5],[70,5],[50,5],[50,95],[30,95],[70,95]],
    'J': [[25,5],[75,5],[55,5],[55,75],[45,90],[30,90],[15,75]],
    'K': [[20,5],[20,95],[20,50],[75,5],[20,50],[75,95]],
    'L': [[20,5],[20,95],[75,95]],
    'M': [[10,95],[10,5],[50,55],[90,5],[90,95]],
    'N': [[20,95],[20,5],[80,95],[80,5]],
    'O': [[50,5],[25,5],[10,25],[10,75],[25,95],[50,95],[75,95],[90,75],[90,25],[75,5],[50,5]],
    'P': [[20,95],[20,5],[65,5],[80,18],[80,32],[65,48],[20,48]],
    'Q': [[50,5],[25,5],[10,25],[10,75],[25,95],[50,95],[75,95],[90,75],[90,25],[75,5],[50,5],[62,78],[85,98]],
    'R': [[20,95],[20,5],[65,5],[80,18],[80,32],[65,48],[20,48],[60,48],[85,95]],
    'S': [[78,18],[62,5],[38,5],[18,22],[22,38],[42,48],[62,55],[82,68],[78,82],[62,95],[38,95],[18,82]],
    'T': [[10,5],[90,5],[50,5],[50,95]],
    'U': [[15,5],[15,70],[28,88],[50,95],[72,88],[85,70],[85,5]],
    'V': [[10,5],[50,95],[90,5]],
    'W': [[5,5],[22,95],[40,40],[58,95],[95,5]],
    'X': [[10,5],[90,95],[50,50],[90,5],[10,95]],
    'Y': [[10,5],[50,50],[90,5],[50,50],[50,95]],
    'Z': [[10,5],[90,5],[10,95],[90,95]],
  }), []);

  const LETTERS = Object.keys(LETTER_PATHS);
  const ROUNDS = 15;
  const ZONE_RADIUS = 0.045; // % of canvas size for zone hit detection

  const sessionLetters = useMemo(() => {
    const shuffled = [...LETTERS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, ROUNDS);
  }, []);

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [letterDone, setLetterDone] = useState(false);
  const [drawnPts, setDrawnPts] = useState([]); // current stroke
  const [allStrokes, setAllStrokes] = useState([]); // all completed strokes
  const [zonesHit, setZonesHit] = useState(new Set());
  const [canvasSize, setCanvasSize] = useState({ w: 500, h: 500 });
  const [trailColor, setTrailColor] = useState('#FF6B6B');
  const [showStars, setShowStars] = useState(false);

  const COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FF9FF3','#54A0FF','#FF6348','#2ED573','#FFA502','#5F27CD','#DDA0DD','#FFEAA7'];

  // Responsive canvas
  useEffect(() => {
    const resize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const avail = Math.min(vw * 0.88, vh - 140, 650);
      setCanvasSize({ w: Math.max(avail, 260), h: Math.max(avail, 260) });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => { setTrailColor(COLORS[round % COLORS.length]); }, [round]);

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const letter = sessionLetters[round];
    const pts = LETTER_PATHS[letter];
    if (!pts) return;

    const s = (p) => [p[0] * W / 100, p[1] * H / 100];

    // 1. Draw BIG ghost letter (very visible!)
    ctx.save();
    ctx.font = `900 ${W * 0.75}px 'Fredoka', 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText(letter, W / 2, H / 2 + W * 0.02);
    // Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.strokeText(letter, W / 2, H / 2 + W * 0.02);
    ctx.restore();

    // 2. Draw guide path — thick dashed, high contrast
    ctx.save();
    ctx.setLineDash([12, 8]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = Math.max(5, W * 0.015);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    pts.forEach((p, i) => { const [x,y] = s(p); i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
    ctx.stroke();
    ctx.restore();

    // 3. Draw zone checkpoints — sequential highlighting
    const nextZoneIdx = zonesHit.size;
    pts.forEach((p, i) => {
      const [x, y] = s(p);
      const r = W * ZONE_RADIUS;
      const hit = zonesHit.has(i);
      const isNext = i === nextZoneIdx;
      
      if (hit) {
        // Completed zone — colored with checkmark
        ctx.beginPath();
        ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = trailColor;
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${r * 0.6}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', x, y);
      } else if (isNext) {
        // NEXT zone — pulsing, orange glow (moderate size)
        const pulse = 1 + 0.1 * Math.sin(Date.now() * 0.006);
        // Outer glow
        ctx.beginPath();
        ctx.arc(x, y, r * 1.3 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 0, 0.12)';
        ctx.fill();
        // Main circle
        ctx.beginPath();
        ctx.arc(x, y, r * 0.85 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD93D';
        ctx.fill();
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();
        // Label
        ctx.fillStyle = '#333';
        ctx.font = `bold ${r * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i === 0 ? (lang === 'bm' ? 'MULA' : 'START') : `${i + 1}`, x, y);
      } else {
        // Future zone — dim, small
        ctx.beginPath();
        ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.stroke();
      }
    });

    // 4. Draw ALL completed strokes — thick, colorful, glowing!
    allStrokes.forEach(stroke => {
      if (stroke.length > 1) {
        ctx.save();
        ctx.setLineDash([]);
        ctx.strokeStyle = trailColor;
        ctx.lineWidth = Math.max(6, W * 0.018);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = trailColor;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        stroke.forEach((p, i) => { i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); });
        ctx.stroke();
        ctx.restore();
      }
    });

    // 5. Draw CURRENT active stroke
    if (drawnPts.length > 1) {
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = trailColor;
      ctx.lineWidth = Math.max(8, W * 0.025);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = trailColor;
      ctx.shadowBlur = 15;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      drawnPts.forEach((p, i) => { i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); });
      ctx.stroke();
      ctx.restore();
    }

    // 5. Progress ring (bottom-right)
    const progPct = pts.length > 0 ? zonesHit.size / pts.length : 0;
    const ringR = W * 0.05;
    const ringX = W - ringR - 15;
    const ringY = H - ringR - 15;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ringX, ringY, ringR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ringX, ringY, ringR - 3, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progPct));
    ctx.strokeStyle = progPct >= 0.7 ? '#6BCB77' : '#FFD93D';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = `bold ${ringR * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(progPct * 100)}%`, ringX, ringY);
    ctx.restore();

  }, [drawnPts, allStrokes, zonesHit, round, canvasSize, sessionLetters, LETTER_PATHS, trailColor, lang]);

  // Check zone hits — SEQUENTIAL: must hit in order!
  const checkZones = useCallback((px, py) => {
    const letter = sessionLetters[round];
    const pts = LETTER_PATHS[letter];
    if (!pts || letterDone) return;
    const W = canvasSize.w;
    const H = canvasSize.h;
    const hitR = W * ZONE_RADIUS * 1.8; // generous radius for toddlers

    // Only check the NEXT zone in sequence
    const nextZone = zonesHit.size; // next zone index to hit
    if (nextZone >= pts.length) return;

    const target = pts[nextZone];
    const tx = target[0] * W / 100;
    const ty = target[1] * H / 100;
    const d = Math.sqrt((px - tx) ** 2 + (py - ty) ** 2);

    if (d < hitR) {
      const newHits = new Set(zonesHit);
      newHits.add(nextZone);
      setZonesHit(newHits);
      if (soundEnabled) playTapSound();

      // Check completion (100% of zones hit IN ORDER = pass)
      const pct = newHits.size / pts.length;
      if (pct >= 1.0 && !letterDone) {
        setLetterDone(true);
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        setScore(s => s + 1);
        setShowStars(true);

        setTimeout(() => {
          setShowStars(false);
          setLetterDone(false);
          setDrawnPts([]);
          setAllStrokes([]);
          setZonesHit(new Set());
          if (round + 1 < ROUNDS) {
            setRound(r => r + 1);
          } else {
            const finalScore = score + 1;
            const stars = finalScore >= 13 ? 3 : finalScore >= 10 ? 2 : 1;
            completeGame('abc', 'letter-trail', stars, finalScore * 10);
            setGameComplete(true);
          }
        }, 1800);
      }
    }
  }, [zonesHit, round, sessionLetters, LETTER_PATHS, canvasSize, letterDone, soundEnabled, lang, score, completeGame]);

  // Canvas touch/mouse handlers
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return [(cx - rect.left) * (canvas.width / rect.width), (cy - rect.top) * (canvas.height / rect.height)];
  }, []);

  const onStart = useCallback((e) => {
    e.preventDefault();
    if (letterDone) return;
    drawingRef.current = true;
    const p = getPos(e);
    if (p) { setDrawnPts([p]); }
  }, [getPos, letterDone]);

  const onMove = useCallback((e) => {
    e.preventDefault();
    if (!drawingRef.current || letterDone) return;
    const p = getPos(e);
    if (p) {
      setDrawnPts(prev => {
        const next = [...prev, p];
        // Only check zones if user has drawn at least 3 points (real drag, not click)
        if (next.length >= 3) checkZones(p[0], p[1]);
        return next;
      });
    }
  }, [getPos, checkZones, letterDone]);

  const onEnd = useCallback((e) => {
    e.preventDefault();
    if (drawingRef.current && drawnPts.length > 1) {
      setAllStrokes(prev => [...prev, drawnPts]);
    }
    drawingRef.current = false;
    setDrawnPts([]);
  }, [drawnPts]);

  // Clear drawing
  const handleClear = useCallback(() => {
    if (letterDone) return;
    setDrawnPts([]);
    setAllStrokes([]);
    setZonesHit(new Set());
  }, [letterDone]);

  // Game complete screen
  if (gameComplete) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: 'white', textAlign: 'center', padding: 20,
      }}>
        <div style={{ fontSize: 80, marginBottom: 16, animation: 'bounceIn 0.6s ease' }}>🏆</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 6vw, 3rem)', margin: '0 0 8px' }}>
          {lang === 'bm' ? 'Tahniah! Huruf kamu cantik!' : 'Congrats! Beautiful letters!'}
        </h1>
        <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
          {[1,2,3].map(i => <span key={i} style={{ fontSize: 40, animation: `bounceIn ${0.3 + i * 0.2}s ease` }}>⭐</span>)}
        </div>
        <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', opacity: 0.9, marginBottom: 24 }}>
          {lang === 'bm' ? `Skor: ${score}/${ROUNDS}` : `Score: ${score}/${ROUNDS}`}
        </p>
        <button onClick={() => goToWorld('abc')} style={{
          padding: '16px 48px', fontSize: '1.2rem',
          background: 'rgba(255,255,255,0.2)', color: 'white',
          border: '2px solid rgba(255,255,255,0.5)', borderRadius: 50,
          cursor: 'pointer', fontWeight: 700, backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
        }}>
          {lang === 'bm' ? '← Kembali ke Dunia ABC' : '← Back to ABC World'}
        </button>
      </div>
    );
  }

  const letter = sessionLetters[round];
  const pts = LETTER_PATHS[letter] || [];
  const progPct = pts.length > 0 ? Math.round(zonesHit.size / pts.length * 100) : 0;

  return (
    <div ref={containerRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: 'hidden', background: '#1a1a2e',
    }}>
      {/* Background image — full vibrant */}
      <img src={assetPath('/images/game/letter_tracing_bg.jpg')} alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, pointerEvents: 'none' }}
      />

      {/* Header — compact, mobile-first */}
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', padding: '6px 10px',
        background: 'linear-gradient(135deg, rgba(102,126,234,0.92), rgba(118,75,162,0.92))',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        {/* Row 1: Back + Title + Score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <button onClick={() => goToWorld('abc')} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
            fontWeight: 700, fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', color: 'white',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            ←
          </button>

          <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)', margin: 0,
              fontSize: 'clamp(0.9rem, 3vw, 1.4rem)', color: 'white',
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {lang === 'bm' ? `Jejak Huruf ${letter}` : `Trace ${letter}`}
            </h2>
            <div style={{ fontSize: 'clamp(0.55rem, 1.5vw, 0.7rem)', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              {round + 1} / {ROUNDS}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={handleClear} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
              color: 'white', fontSize: 'clamp(0.65rem, 1.8vw, 0.8rem)', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              🗑️
            </button>
            <div style={{
              background: 'linear-gradient(135deg, #FFD93D, #FF9800)',
              borderRadius: 14, padding: '4px 10px', fontWeight: 800,
              color: 'white', fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
              whiteSpace: 'nowrap',
            }}>
              ⭐ {score}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: 5, background: 'rgba(0,0,0,0.2)', position: 'relative', zIndex: 10 }}>
        <div style={{
          height: '100%', width: `${(round / ROUNDS) * 100}%`,
          background: 'linear-gradient(90deg, #FFD93D, #FF6B6B, #764ba2)',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Canvas area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 5, padding: '8px 12px',
      }}>
        {/* Instruction */}
        <div style={{
          fontSize: 'clamp(0.7rem, 2.2vw, 1rem)', color: 'white',
          fontWeight: 700, marginBottom: 4, textAlign: 'center',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          background: 'rgba(0,0,0,0.2)', borderRadius: 12,
          padding: '4px 14px', backdropFilter: 'blur(4px)',
        }}>
          {letterDone 
            ? `🎉 ${lang === 'bm' ? 'HEBAT!' : 'AMAZING!'} 🎉`
            : `✏️ ${lang === 'bm' ? 'Lukis huruf ' + letter + ' ikut garisan!' : 'Draw ' + letter + '!'}`
          }
        </div>

        {/* Canvas — glassmorphic container */}
        <div style={{
          background: 'rgba(0,0,0,0.25)', borderRadius: 24,
          backdropFilter: 'blur(6px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
          padding: 6, position: 'relative',
          border: letterDone ? '3px solid #6BCB77' : '3px solid rgba(255,255,255,0.2)',
          transition: 'border-color 0.3s ease',
        }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{
              width: canvasSize.w, height: canvasSize.h, maxWidth: '90vw', maxHeight: '62vh',
              borderRadius: 20, touchAction: 'none', display: 'block', cursor: 'crosshair',
            }}
            onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          />

          {/* Letter done celebration overlay */}
          {letterDone && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(107, 203, 119, 0.2)', borderRadius: 24,
              flexDirection: 'column', gap: 8,
            }}>
              <span style={{ fontSize: 'clamp(3rem, 12vw, 7rem)', animation: 'bounceIn 0.5s ease' }}>✨</span>
              {showStars && <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3].map(i => <span key={i} style={{ fontSize: 32, animation: `bounceIn ${0.2 + i * 0.15}s ease` }}>⭐</span>)}
              </div>}
            </div>
          )}
        </div>

        {/* Letter progress bar */}
        <div style={{
          display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap',
          justifyContent: 'center', maxWidth: '95vw',
        }}>
          {sessionLetters.map((l, i) => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: 6,
              background: i < round ? '#6BCB77' : i === round ? trailColor : 'rgba(255,255,255,0.15)',
              color: i <= round ? 'white' : 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.55rem', fontWeight: 800,
              transition: 'all 0.3s ease',
              transform: i === round ? 'scale(1.2)' : 'scale(1)',
              boxShadow: i === round ? '0 0 8px rgba(255,255,255,0.3)' : 'none',
            }}>
              {i < round ? '✓' : l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SYLLABLE FACTORY GAME (Bijak Suku Kata)
// Combine syllables to build words!
// ============================================
export function SyllableFactoryGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 15;

  // 20+ Malay words with syllables and wrong options
  const ALL_WORDS = useMemo(() => [
    { word: 'BUKU', syllables: ['BU','KU'], wrong: ['MA','TI','LA','RI'] },
    { word: 'MAMA', syllables: ['MA','MA'], wrong: ['BU','KU','SI','TE'] },
    { word: 'BOLA', syllables: ['BO','LA'], wrong: ['KE','RI','TA','SU'] },
    { word: 'KUDA', syllables: ['KU','DA'], wrong: ['PI','SA','NG','BI'] },
    { word: 'SUSU', syllables: ['SU','SU'], wrong: ['BA','JU','TE','KA'] },
    { word: 'TOPI', syllables: ['TO','PI'], wrong: ['RU','MA','HI','BE'] },
    { word: 'NASI', syllables: ['NA','SI'], wrong: ['KU','LA','BO','TI'] },
    { word: 'IKAN', syllables: ['I','KAN'], wrong: ['BU','MA','SE','RI'] },
    { word: 'SAPI', syllables: ['SA','PI'], wrong: ['KU','DA','BO','LA'] },
    { word: 'BAJU', syllables: ['BA','JU'], wrong: ['KE','RI','TA','SU'] },
    { word: 'ROTI', syllables: ['RO','TI'], wrong: ['MA','KA','PI','SE'] },
    { word: 'MATA', syllables: ['MA','TA'], wrong: ['BU','KU','SI','LA'] },
    { word: 'KAKI', syllables: ['KA','KI'], wrong: ['BO','LA','SU','TI'] },
    { word: 'GULA', syllables: ['GU','LA'], wrong: ['BI','SA','KE','RI'] },
    { word: 'BESI', syllables: ['BE','SI'], wrong: ['KU','DA','MA','LA'] },
    { word: 'TALI', syllables: ['TA','LI'], wrong: ['BU','KE','NA','RO'] },
    { word: 'DURI', syllables: ['DU','RI'], wrong: ['SA','PI','BO','LA'] },
    { word: 'PAKU', syllables: ['PA','KU'], wrong: ['MA','SI','TA','BE'] },
    { word: 'GURU', syllables: ['GU','RU'], wrong: ['KA','BI','SE','LA'] },
    { word: 'PADI', syllables: ['PA','DI'], wrong: ['BU','KU','MA','TO'] },
    { word: 'GIGI', syllables: ['GI','GI'], wrong: ['BA','KU','SO','LE'] },
    { word: 'DADA', syllables: ['DA','DA'], wrong: ['BU','SI','MA','KE'] },
    { word: 'LAGU', syllables: ['LA','GU'], wrong: ['BI','SA','KE','RI'] },
    { word: 'SIKU', syllables: ['SI','KU'], wrong: ['BA','LA','TO','ME'] },
    { word: 'JARI', syllables: ['JA','RI'], wrong: ['BU','KA','SE','TO'] },
    { word: 'BIRU', syllables: ['BI','RU'], wrong: ['KA','LA','SO','ME'] },
    { word: 'KOTA', syllables: ['KO','TA'], wrong: ['BU','SI','LA','RI'] },
    { word: 'DUIT', syllables: ['DU','IT'], wrong: ['BA','KA','SO','ME'] },
    { word: 'GAJI', syllables: ['GA','JI'], wrong: ['BU','KU','SO','LE'] },
    { word: 'KAYU', syllables: ['KA','YU'], wrong: ['BI','SA','TO','ME'] },
    { word: 'TAHU', syllables: ['TA','HU'], wrong: ['BU','KA','SI','LE'] },
    { word: 'PETA', syllables: ['PE','TA'], wrong: ['BU','KU','SI','LA'] },
    { word: 'BATU', syllables: ['BA','TU'], wrong: ['KE','RI','SO','MA'] },
    { word: 'KAIN', syllables: ['KA','IN'], wrong: ['BU','SO','LE','RI'] },
    { word: 'LORI', syllables: ['LO','RI'], wrong: ['BA','KU','SE','TA'] },
    { word: 'NAGA', syllables: ['NA','GA'], wrong: ['BU','KU','SI','LE'] },
    { word: 'SENI', syllables: ['SE','NI'], wrong: ['BA','KU','TO','LA'] },
    { word: 'PURI', syllables: ['PU','RI'], wrong: ['BA','KU','SO','LE'] },
    { word: 'BUMI', syllables: ['BU','MI'], wrong: ['KA','SO','LE','RI'] },
    { word: 'KIRI', syllables: ['KI','RI'], wrong: ['BA','SO','LE','TU'] },
    { word: 'LUPA', syllables: ['LU','PA'], wrong: ['BI','KA','SO','TE'] },
    { word: 'SAYA', syllables: ['SA','YA'], wrong: ['BU','KU','TO','LE'] },
    { word: 'RAJA', syllables: ['RA','JA'], wrong: ['BU','KU','SI','LE'] },
    { word: 'PASU', syllables: ['PA','SU'], wrong: ['BI','KA','TO','ME'] },
    { word: 'LAUT', syllables: ['LA','UT'], wrong: ['BU','KA','SI','RI'] },
    { word: 'TIPU', syllables: ['TI','PU'], wrong: ['BA','KU','SO','LE'] },
    { word: 'JALA', syllables: ['JA','LA'], wrong: ['BU','KU','SI','TE'] },
    { word: 'KUKU', syllables: ['KU','KU'], wrong: ['BA','SO','LE','RI'] },
    { word: 'RAGA', syllables: ['RA','GA'], wrong: ['BU','KU','SI','LE'] },
    { word: 'DAGU', syllables: ['DA','GU'], wrong: ['BI','KA','SO','TE'] },
    { word: 'BAYU', syllables: ['BA','YU'], wrong: ['KE','RI','SO','MA'] },
    { word: 'LAKI', syllables: ['LA','KI'], wrong: ['BU','SO','TE','RI'] },
    { word: 'SAPU', syllables: ['SA','PU'], wrong: ['BI','KA','TO','ME'] },
    { word: 'SURI', syllables: ['SU','RI'], wrong: ['BA','KU','TO','LE'] },
    { word: 'BACA', syllables: ['BA','CA'], wrong: ['KU','SI','TO','LE'] },
    { word: 'MADU', syllables: ['MA','DU'], wrong: ['BI','KA','SO','TE'] },
    { word: 'DAHI', syllables: ['DA','HI'], wrong: ['BU','KU','SO','LE'] },
    { word: 'HATI', syllables: ['HA','TI'], wrong: ['BU','KA','SO','LE'] },
    { word: 'LABA', syllables: ['LA','BA'], wrong: ['KU','SI','TO','ME'] },
    { word: 'MUKA', syllables: ['MU','KA'], wrong: ['BI','SO','TE','RI'] },
    { word: 'PARI', syllables: ['PA','RI'], wrong: ['BU','KU','SO','LE'] },
    { word: 'SUDU', syllables: ['SU','DU'], wrong: ['BA','KA','TO','ME'] },
    { word: 'KACA', syllables: ['KA','CA'], wrong: ['BU','SI','TO','LE'] },
    { word: 'BAHU', syllables: ['BA','HU'], wrong: ['KU','SI','TO','LE'] },
    { word: 'TIRU', syllables: ['TI','RU'], wrong: ['BA','KU','SO','LE'] },
    { word: 'JAMU', syllables: ['JA','MU'], wrong: ['BI','KA','SO','TE'] },
    { word: 'NADI', syllables: ['NA','DI'], wrong: ['BU','KU','SO','LE'] },
    { word: 'PAHA', syllables: ['PA','HA'], wrong: ['BU','KU','SI','LE'] },
    { word: 'WAJA', syllables: ['WA','JA'], wrong: ['BU','KU','SI','TE'] },
    { word: 'LADA', syllables: ['LA','DA'], wrong: ['BU','KU','SI','TE'] },
    { word: 'SAGA', syllables: ['SA','GA'], wrong: ['BU','KU','TO','LE'] },
    { word: 'RATU', syllables: ['RA','TU'], wrong: ['BI','KA','SO','ME'] },
    { word: 'PALA', syllables: ['PA','LA'], wrong: ['BU','KU','SI','TE'] },
    { word: 'BAGI', syllables: ['BA','GI'], wrong: ['KU','SO','TE','RI'] },
    { word: 'SAGU', syllables: ['SA','GU'], wrong: ['BI','KA','TO','ME'] },
    { word: 'GULI', syllables: ['GU','LI'], wrong: ['BA','KU','SO','TE'] },
    { word: 'MALU', syllables: ['MA','LU'], wrong: ['BI','KA','SO','TE'] },
    { word: 'RAPI', syllables: ['RA','PI'], wrong: ['BU','KU','SO','LE'] },
    { word: 'SUKA', syllables: ['SU','KA'], wrong: ['BI','TO','ME','RI'] },
    { word: 'DARA', syllables: ['DA','RA'], wrong: ['BU','KU','SI','LE'] },
    { word: 'KUTU', syllables: ['KU','TU'], wrong: ['BA','SO','LE','RI'] },
    { word: 'JADI', syllables: ['JA','DI'], wrong: ['BU','KU','SO','LE'] },
    { word: 'TARI', syllables: ['TA','RI'], wrong: ['BU','KU','SO','LE'] },
    { word: 'LIKU', syllables: ['LI','KU'], wrong: ['BA','SO','TE','RI'] },
    { word: 'PALU', syllables: ['PA','LU'], wrong: ['BI','KA','SO','TE'] },
    { word: 'GELI', syllables: ['GE','LI'], wrong: ['BA','KU','SO','TE'] },
    { word: 'RUGI', syllables: ['RU','GI'], wrong: ['BA','KA','SO','LE'] },
    { word: 'SATU', syllables: ['SA','TU'], wrong: ['BI','KA','TO','ME'] },
    { word: 'LIMA', syllables: ['LI','MA'], wrong: ['BU','KA','SO','TE'] },
    { word: 'DUKA', syllables: ['DU','KA'], wrong: ['BI','SO','LE','RI'] },
    { word: 'MEJA', syllables: ['ME','JA'], wrong: ['BU','KU','SO','LE'] },
    { word: 'DADU', syllables: ['DA','DU'], wrong: ['BI','KA','SO','TE'] },
    { word: 'RUSA', syllables: ['RU','SA'], wrong: ['BI','KA','TO','LE'] },
    { word: 'AYAM', syllables: ['A','YAM'], wrong: ['BU','KA','SI','LE'] },
    { word: 'BUAH', syllables: ['BU','AH'], wrong: ['KA','SI','TO','LE'] },
    { word: 'DUKU', syllables: ['DU','KU'], wrong: ['BA','SO','LE','RI'] },
    { word: 'HARI', syllables: ['HA','RI'], wrong: ['BU','KU','SO','LE'] },
    { word: 'TIGA', syllables: ['TI','GA'], wrong: ['BA','KU','SO','LE'] },
    { word: 'MISI', syllables: ['MI','SI'], wrong: ['BA','KU','TO','LE'] },
    { word: 'KUCI', syllables: ['KU','CI'], wrong: ['BA','SO','TE','RI'] },
  ], []);

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [built, setBuilt] = useState([]);
  const [options, setOptions] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [wordComplete, setWordComplete] = useState(false);
  const [usedIndices, setUsedIndices] = useState([]);

  const setupRound = useCallback((roundNum) => {
    const shuffled = [...ALL_WORDS].sort(() => Math.random() - 0.5);
    const w = shuffled[(roundNum - 1) % shuffled.length];
    setCurrentWord(w);
    // Mix correct syllables with 3 wrong ones, shuffle
    const allSyllables = [...w.syllables, ...w.wrong.slice(0, 3)]
      .sort(() => Math.random() - 0.5)
      .map((s, i) => ({ id: i, syl: s, used: false }));
    setOptions(allSyllables);
    setBuilt([]);
    setFeedback(null);
    setWordComplete(false);
  }, [ALL_WORDS]);

  useEffect(() => { setupRound(1); }, [setupRound]);

  const handlePick = (opt) => {
    if (!currentWord || wordComplete || opt.used) return;
    const nextIdx = built.length;

    if (nextIdx < currentWord.syllables.length && opt.syl === currentWord.syllables[nextIdx]) {
      // Correct syllable — place it and mark as used (grey out)
      if (soundEnabled) playTapSound();
      const newBuilt = [...built, opt.syl];
      setBuilt(newBuilt);
      // Mark this option as used
      setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, used: true } : o));

      // Check if word is now complete
      if (newBuilt.length === currentWord.syllables.length) {
        // WORD COMPLETE — NOW play celebration!
        setWordComplete(true);
        setScore(prev => prev + 10);
        if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
        setFeedback({ type: 'correct', message: correctFeedback(lang, false) });

        setTimeout(() => {
          setFeedback(null);
          if (round >= TOTAL_ROUNDS) {
            const finalScore = score + 10;
            const stars = finalScore >= 120 ? 3 : finalScore >= 70 ? 2 : 1;
            completeGame('abc', 'syllable-factory', stars, finalScore);
            setGameComplete(true);
            if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
            spawnConfetti();
          } else {
            setRound(prev => prev + 1);
            setupRound(round + 1);
          }
        }, 1200);
      }
    } else {
      // Wrong syllable
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
      setTimeout(() => setFeedback(null), 800);
    }
  };

  const spawnConfetti = () => {
    const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF'];
    setConfettiPieces(Array.from({ length: 50 }, (_, i) => ({
      id: i, left: Math.random() * 100, color: colors[i % colors.length],
      delay: Math.random() * 0.5, size: 6 + Math.random() * 8,
    })));
  };

  const getStars = () => score >= 120 ? 3 : score >= 70 ? 2 : 1;

  // Syllable button gradient colors
  const SYLLABLE_COLORS = [
    'linear-gradient(135deg, #FF9A9E, #FECFEF)',
    'linear-gradient(135deg, #A18CD1, #FBC2EB)',
    'linear-gradient(135deg, #84FAB0, #8FD3F4)',
    'linear-gradient(135deg, #FFD93D, #FFE082)',
    'linear-gradient(135deg, #4FC3F7, #B3E5FC)',
  ];

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('abc')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Bina Perkataan' : 'Build Words'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body" style={{ padding: 0 }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Clean background */}
          <img src={assetPath('/images/game/syllable_factory_bg.jpg')} alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
          }} />

          {/* HUD */}
          {!gameComplete && currentWord && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 12px', gap: 6,
            }}>
              {/* Row 1: Round + Score */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', width: '100%',
                alignItems: 'center',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.9)', borderRadius: 50,
                  padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700,
                  fontFamily: 'var(--font-heading)', color: '#666',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  {t('round', lang)} {round}/{TOTAL_ROUNDS}
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.9)', borderRadius: 50,
                  padding: '4px 14px', fontSize: '0.85rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span style={{ color: '#333', fontFamily: 'var(--font-heading)' }}>{score}</span>
                </div>
              </div>

              {/* Row 2: Instruction */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(12px)',
                padding: '8px 20px',
                borderRadius: 50,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
                color: '#4527A0',
              }}>
                {lang === 'bm' ? 'Susun suku kata:' : 'Arrange syllables:'}{' '}
                <span style={{ color: '#E91E63', fontSize: '1.2em' }}>{currentWord.word}</span>
              </div>
            </div>
          )}

          {/* Word building area — center */}
          {!gameComplete && currentWord && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 5, width: '90%', maxWidth: 420,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            }}>
              {/* Target slots */}
              <div style={{
                display: 'flex', gap: 'clamp(8px, 2vw, 14px)', justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                {currentWord.syllables.map((syl, i) => (
                  <div key={i} style={{
                    width: 'clamp(80px, 22vw, 110px)',
                    height: 'clamp(60px, 16vw, 80px)',
                    borderRadius: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    background: i < built.length
                      ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                      : 'rgba(255,255,255,0.7)',
                    border: i < built.length
                      ? '3px solid #4CAF50'
                      : '3px dashed rgba(69,39,160,0.3)',
                    color: i < built.length ? 'white' : '#BBB',
                    boxShadow: i < built.length
                      ? '0 6px 20px rgba(107,203,119,0.4)'
                      : '0 4px 12px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: i < built.length ? 'scale(1.05)' : 'scale(1)',
                    backdropFilter: 'blur(8px)',
                  }}>
                    {i < built.length ? built[i] : '?'}
                  </div>
                ))}
              </div>

              {/* Syllable options */}
              <div style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: 24, padding: 'clamp(12px, 3vw, 20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.6)',
                width: '100%',
              }}>
                <div style={{
                  fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', color: '#888',
                  marginBottom: 10, fontWeight: 600, textAlign: 'center',
                }}>
                  {lang === 'bm' ? 'Pilih suku kata yang betul:' : 'Pick the correct syllable:'}
                </div>
                <div style={{
                  display: 'flex', gap: 'clamp(6px, 2vw, 10px)',
                  justifyContent: 'center', flexWrap: 'wrap',
                }}>
                  {options.map((opt, i) => (
                    <button key={opt.id} onClick={() => handlePick(opt)} disabled={opt.used} style={{
                      padding: 'clamp(10px, 3vw, 14px) clamp(20px, 5vw, 30px)',
                      borderRadius: 16,
                      background: opt.used ? '#D5D5D5' : SYLLABLE_COLORS[i % SYLLABLE_COLORS.length],
                      border: opt.used ? '2px solid #C0C0C0' : '2px solid rgba(255,255,255,0.6)',
                      fontSize: 'clamp(1.05rem, 3.5vw, 1.3rem)', fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                      cursor: opt.used ? 'default' : 'pointer',
                      boxShadow: opt.used ? 'none' : '0 4px 16px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      color: opt.used ? '#AAA' : '#333',
                      opacity: opt.used ? 0.5 : 1,
                      textDecoration: opt.used ? 'line-through' : 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}>{opt.syl}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div style={{
              position: 'absolute', bottom: 'clamp(20px, 5vh, 50px)',
              left: '50%', transform: 'translateX(-50%)',
              zIndex: 20,
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', padding: '10px 24px', borderRadius: 50,
              fontFamily: 'var(--font-heading)', fontWeight: 700,
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="#4527A0"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); setupRound(1); }}
          onBack={() => goToWorld('abc')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// LETTER PUZZLE GAME (Puzzle Huruf)
// Fill in the missing letter in a word!
// ============================================
export function LetterPuzzleGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const TOTAL_ROUNDS = 15;

  const ALL_PUZZLES = useMemo(() => [
    { word: 'BUKU', missing: 1, choices: ['U','A','I','O'] },
    { word: 'MAMA', missing: 0, choices: ['M','B','K','S'] },
    { word: 'KUDA', missing: 2, choices: ['D','B','G','P'] },
    { word: 'BOLA', missing: 3, choices: ['A','U','E','I'] },
    { word: 'NASI', missing: 0, choices: ['N','R','T','L'] },
    { word: 'IKAN', missing: 2, choices: ['A','U','E','O'] },
    { word: 'KUIH', missing: 3, choices: ['H','N','K','S'] },
    { word: 'SAPI', missing: 1, choices: ['A','U','I','E'] },
    { word: 'TOPI', missing: 0, choices: ['T','P','K','B'] },
    { word: 'GULA', missing: 1, choices: ['U','A','I','O'] },
    { word: 'PADI', missing: 3, choices: ['I','A','U','E'] },
    { word: 'ROTI', missing: 2, choices: ['T','D','K','P'] },
    { word: 'MEJA', missing: 0, choices: ['M','N','K','R'] },
    { word: 'DADU', missing: 1, choices: ['A','I','U','E'] },
    { word: 'SUSU', missing: 3, choices: ['U','A','I','O'] },
    { word: 'KAKI', missing: 2, choices: ['K','G','P','T'] },
    { word: 'BAJU', missing: 0, choices: ['B','D','P','G'] },
    { word: 'GIGI', missing: 1, choices: ['I','A','U','E'] },
    { word: 'SATU', missing: 3, choices: ['U','A','I','E'] },
    { word: 'LIMA', missing: 2, choices: ['M','N','K','R'] },
    { word: 'AYAM', missing: 0, choices: ['A','I','U','E'] },
    { word: 'BUAH', missing: 1, choices: ['U','A','I','O'] },
    { word: 'DUKU', missing: 2, choices: ['K','G','P','T'] },
    { word: 'HARI', missing: 3, choices: ['I','A','U','E'] },
    { word: 'TIGA', missing: 0, choices: ['T','D','K','S'] },
    { word: 'RUSA', missing: 1, choices: ['U','A','I','E'] },
    { word: 'PAKU', missing: 2, choices: ['K','G','P','T'] },
    { word: 'KOTA', missing: 3, choices: ['A','U','I','E'] },
    { word: 'DUIT', missing: 0, choices: ['D','B','P','G'] },
    { word: 'GAJI', missing: 1, choices: ['A','I','U','E'] },
    { word: 'LAGU', missing: 2, choices: ['G','K','P','T'] },
    { word: 'BESI', missing: 3, choices: ['I','A','U','E'] },
    { word: 'KAYU', missing: 0, choices: ['K','G','P','T'] },
    { word: 'TAHU', missing: 1, choices: ['A','I','U','E'] },
    { word: 'GARI', missing: 2, choices: ['R','L','N','M'] },
    { word: 'PETA', missing: 3, choices: ['A','U','I','E'] },
    { word: 'BATU', missing: 0, choices: ['B','D','P','G'] },
    { word: 'BABI', missing: 1, choices: ['A','I','U','E'] },
    { word: 'KAIN', missing: 2, choices: ['I','A','U','E'] },
    { word: 'LORI', missing: 3, choices: ['I','A','U','E'] },
    { word: 'SIKU', missing: 0, choices: ['S','T','K','P'] },
    { word: 'NAGA', missing: 2, choices: ['G','K','P','T'] },
    { word: 'SENI', missing: 3, choices: ['I','A','U','E'] },
    { word: 'BIRU', missing: 0, choices: ['B','D','P','G'] },
    { word: 'PURI', missing: 1, choices: ['U','A','I','E'] },
    { word: 'JARI', missing: 2, choices: ['R','L','N','M'] },
    { word: 'BUMI', missing: 3, choices: ['I','A','U','E'] },
    { word: 'DADA', missing: 0, choices: ['D','B','P','G'] },
    { word: 'KIRI', missing: 1, choices: ['I','A','U','E'] },
    { word: 'LUPA', missing: 2, choices: ['P','K','G','T'] },
    { word: 'SAYA', missing: 3, choices: ['A','U','I','E'] },
    { word: 'GURU', missing: 0, choices: ['G','K','P','T'] },
    { word: 'RAJA', missing: 1, choices: ['A','I','U','E'] },
    { word: 'PASU', missing: 2, choices: ['S','T','K','P'] },
    { word: 'MATA', missing: 3, choices: ['A','U','I','E'] },
    { word: 'LAUT', missing: 0, choices: ['L','R','N','M'] },
    { word: 'SISI', missing: 1, choices: ['I','A','U','E'] },
    { word: 'TIPU', missing: 3, choices: ['U','A','I','E'] },
    { word: 'JALA', missing: 0, choices: ['J','K','G','T'] },
    { word: 'KUKU', missing: 1, choices: ['U','A','I','E'] },
    { word: 'RAGA', missing: 2, choices: ['G','K','P','T'] },
    { word: 'DAGU', missing: 3, choices: ['U','A','I','E'] },
    { word: 'BAYU', missing: 1, choices: ['A','I','U','E'] },
    { word: 'LAKI', missing: 2, choices: ['K','G','P','T'] },
    { word: 'SAPU', missing: 3, choices: ['U','A','I','E'] },
    { word: 'TALI', missing: 0, choices: ['T','D','K','S'] },
    { word: 'SURI', missing: 1, choices: ['U','A','I','E'] },
    { word: 'BACA', missing: 2, choices: ['C','K','G','S'] },
    { word: 'DURI', missing: 3, choices: ['I','A','U','E'] },
    { word: 'MADU', missing: 0, choices: ['M','N','K','R'] },
    { word: 'DAHI', missing: 1, choices: ['A','I','U','E'] },
    { word: 'HATI', missing: 2, choices: ['T','D','K','P'] },
    { word: 'LABA', missing: 0, choices: ['L','R','N','M'] },
    { word: 'MUKA', missing: 1, choices: ['U','A','I','E'] },
    { word: 'PARI', missing: 2, choices: ['R','L','N','M'] },
    { word: 'SUDU', missing: 3, choices: ['U','A','I','E'] },
    { word: 'KACA', missing: 0, choices: ['K','G','P','T'] },
    { word: 'BAHU', missing: 2, choices: ['H','K','G','P'] },
    { word: 'TIRU', missing: 3, choices: ['U','A','I','E'] },
    { word: 'JAMU', missing: 0, choices: ['J','K','G','T'] },
    { word: 'NADI', missing: 1, choices: ['A','I','U','E'] },
    { word: 'PAHA', missing: 2, choices: ['H','K','G','P'] },
    { word: 'WAJA', missing: 3, choices: ['A','U','I','E'] },
    { word: 'LADA', missing: 0, choices: ['L','R','N','M'] },
    { word: 'SAGA', missing: 2, choices: ['G','K','P','T'] },
    { word: 'RATU', missing: 3, choices: ['U','A','I','E'] },
    { word: 'PALA', missing: 0, choices: ['P','B','D','G'] },
    { word: 'BAGI', missing: 2, choices: ['G','K','P','T'] },
    { word: 'SAGU', missing: 3, choices: ['U','A','I','E'] },
    { word: 'GULI', missing: 0, choices: ['G','K','P','T'] },
    { word: 'MALU', missing: 1, choices: ['A','I','U','E'] },
    { word: 'RAPI', missing: 0, choices: ['R','L','N','M'] },
    { word: 'BUMI', missing: 0, choices: ['B','D','P','G'] },
    { word: 'SUKA', missing: 1, choices: ['U','A','I','E'] },
    { word: 'DARA', missing: 2, choices: ['R','L','N','M'] },
    { word: 'KUTU', missing: 3, choices: ['U','A','I','E'] },
    { word: 'JADI', missing: 0, choices: ['J','K','G','T'] },
    { word: 'TARI', missing: 1, choices: ['A','I','U','E'] },
    { word: 'LIKU', missing: 2, choices: ['K','G','P','T'] },
    { word: 'PALU', missing: 3, choices: ['U','A','I','E'] },
  ], []);

  const [roundPuzzles, setRoundPuzzles] = useState([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  const initGame = useCallback(() => {
    const shuffled = [...ALL_PUZZLES].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
    setRoundPuzzles(shuffled);
    setRound(0); setScore(0); setFeedback(null);
    setGameComplete(false); setRevealed(false); setConfettiPieces([]);
  }, [ALL_PUZZLES]);

  useEffect(() => { initGame(); }, [initGame]);

  const handleChoice = (letter) => {
    if (revealed || !roundPuzzles[round]) return;
    const puzzle = roundPuzzles[round];
    const correct = letter === puzzle.word[puzzle.missing];
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(prev => prev + 10); setRevealed(true);
      setTimeout(() => {
        setFeedback(null); setRevealed(false);
        if (round + 1 < TOTAL_ROUNDS) { setRound(prev => prev + 1); }
        else {
          if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
          const finalScore = score + 10;
          completeGame('abc', 'letter-puzzle', finalScore >= 120 ? 3 : finalScore >= 80 ? 2 : 1, finalScore);
          setGameComplete(true);
          const colors = ['#FF6B9D','#FFD93D','#4A90D9','#6BCB77','#9B72CF'];
          setConfettiPieces(Array.from({length:50},(_,i)=>({id:i,left:Math.random()*100,color:colors[i%colors.length],delay:Math.random()*0.5,size:6+Math.random()*8})));
        }
      }, 1000);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const getStars = () => score >= 120 ? 3 : score >= 80 ? 2 : 1;
  const puzzle = roundPuzzles[round];
  const CHOICE_COLORS = ['linear-gradient(135deg,#FFB6C1,#FF69B4)','linear-gradient(135deg,#B39DDB,#9575CD)','linear-gradient(135deg,#A5D6A7,#66BB6A)','linear-gradient(135deg,#90CAF9,#42A5F5)'];

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('abc')}>←</button>
        <span className="game-title">{lang === 'bm' ? 'Huruf Hilang' : 'Missing Letter'}</span>
        <div className="game-stars">{[1,2,3].map(s=><span key={s} className={s<=getStars()?'star-earned':'star-empty'}><StarIcon size={20}/></span>)}</div>
      </div>
      <div className="game-body" style={{ padding: 0 }}>
        <div style={{ width:'100%',height:'100%',position:'relative',overflow:'hidden' }}>
          <img src={assetPath('/images/game/letter_puzzle_bg.jpg')} alt="" style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0 }} />
          {/* HUD */}
          <div style={{ position:'absolute',top:0,left:0,right:0,zIndex:15,display:'flex',justifyContent:'space-between',padding:'6px 12px' }}>
            <div style={{ background:'rgba(255,255,255,0.9)',borderRadius:50,padding:'3px 12px',fontSize:'0.75rem',fontWeight:700,fontFamily:'var(--font-heading)',color:'#666',boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              Pusingan {round+1}/{TOTAL_ROUNDS}
            </div>
            <div style={{ background:'rgba(255,255,255,0.9)',borderRadius:50,padding:'3px 12px',fontSize:'0.8rem',fontWeight:700,display:'flex',alignItems:'center',gap:5,boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span style={{ color:'#333',fontFamily:'var(--font-heading)' }}>{score}</span>
            </div>
          </div>
          {/* Game content */}
          {puzzle && (
            <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:5,width:'90%',maxWidth:420,display:'flex',flexDirection:'column',alignItems:'center',gap:'clamp(12px,3vh,24px)' }}>
              <div style={{ background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',padding:'8px 20px',borderRadius:50,boxShadow:'0 4px 16px rgba(0,0,0,0.08)',fontFamily:'var(--font-heading)',fontWeight:700,fontSize:'clamp(0.85rem,2.5vw,1.1rem)',color:'#1565C0' }}>
                {lang === 'bm' ? 'Huruf mana yang hilang?' : 'Which letter is missing?'}
              </div>
              <div style={{ display:'flex',gap:'clamp(8px,2vw,14px)',justifyContent:'center' }}>
                {puzzle.word.split('').map((char,i) => (
                  <div key={i} style={{
                    width:'clamp(55px,15vw,80px)',height:'clamp(60px,16vw,85px)',borderRadius:18,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'clamp(1.5rem,5vw,2.2rem)',fontWeight:900,fontFamily:'var(--font-heading)',
                    background:i===puzzle.missing?(revealed?'linear-gradient(135deg,#6BCB77,#48C9B0)':'linear-gradient(135deg,#FFD93D,#FFA726)'):'rgba(255,255,255,0.95)',
                    color:i===puzzle.missing?(revealed?'white':'#FF9800'):'#333',
                    border:i===puzzle.missing?'3px solid #FF9800':'2px solid rgba(0,0,0,0.08)',
                    boxShadow:i===puzzle.missing?'0 6px 20px rgba(255,152,0,0.3)':'0 4px 12px rgba(0,0,0,0.06)',
                    transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    transform:(i===puzzle.missing&&revealed)?'scale(1.1)':'scale(1)',backdropFilter:'blur(8px)',
                  }}>{i===puzzle.missing?(revealed?char:'?'):char}</div>
                ))}
              </div>
              <div style={{ background:'rgba(255,255,255,0.88)',backdropFilter:'blur(12px)',borderRadius:24,padding:'clamp(12px,3vw,20px)',boxShadow:'0 8px 32px rgba(0,0,0,0.08)',border:'1px solid rgba(255,255,255,0.6)' }}>
                <div style={{ fontSize:'clamp(0.7rem,2vw,0.8rem)',color:'#888',marginBottom:10,fontWeight:600,textAlign:'center' }}>
                  {lang === 'bm' ? 'Pilih huruf yang betul:' : 'Pick the correct letter:'}
                </div>
                <div style={{ display:'flex',gap:'clamp(8px,2vw,14px)',justifyContent:'center' }}>
                  {shuffleWithSeed(puzzle.choices,round).map((letter,i) => (
                    <button key={i} onClick={()=>handleChoice(letter)} style={{
                      width:'clamp(50px,14vw,70px)',height:'clamp(50px,14vw,70px)',borderRadius:16,
                      fontSize:'clamp(1.3rem,4vw,1.8rem)',fontWeight:900,fontFamily:'var(--font-heading)',
                      background:CHOICE_COLORS[i],border:'2px solid rgba(255,255,255,0.6)',
                      cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',
                      transition:'transform 0.15s ease',color:'white',textShadow:'0 1px 3px rgba(0,0,0,0.2)',
                      WebkitTapHighlightColor:'transparent',
                    }}>{letter}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {feedback && (
            <div style={{ position:'absolute',bottom:'clamp(10px,3vh,30px)',left:'50%',transform:'translateX(-50%)',zIndex:20,background:feedback.type==='correct'?'linear-gradient(135deg,#6BCB77,#48C9B0)':'linear-gradient(135deg,#FF6B6B,#ee5a24)',color:'white',padding:'8px 20px',borderRadius:50,fontFamily:'var(--font-heading)',fontWeight:700,fontSize:'clamp(0.8rem,2.5vw,1rem)',boxShadow:'0 4px 16px rgba(0,0,0,0.2)',animation:'fadeInUp 0.3s ease-out' }}>
              {feedback.message}
            </div>
          )}
        </div>
      </div>
      {gameComplete && (
        <GameCompleteModal lang={lang} stars={getStars()} score={score} accentColor="#1565C0"
          onPlayAgain={initGame} onBack={()=>goToWorld('abc')} confettiPieces={confettiPieces} />
      )}
    </div>
  );
}


// ============================================
// ✍️ NUMBER TRACE GAME (Jejak Nombor)
// Trace numbers by tapping dots in order!
// ============================================
export function NumberTraceGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const NUMBERS = ['0','1','2','3','4','5','6','7','8','9'];
  const [numIdx, setNumIdx] = useState(0);
  const [dotsTapped, setDotsTapped] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const DOTS_PER_NUM = 4;
  
  const handleDotTap = (dotIdx) => {
    if (dotIdx === dotsTapped) {
      if (soundEnabled) playTapSound();
      const newDots = dotsTapped + 1;
      setDotsTapped(newDots);
      if (newDots === DOTS_PER_NUM) {
        if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
        setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
        const newScore = score + 1;
        setScore(newScore);
        setTimeout(() => {
          setFeedback(null);
          if (numIdx + 1 < NUMBERS.length) {
            setNumIdx(numIdx + 1);
            setDotsTapped(0);
          } else {
            if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
            completeGame('numbers', 'number-trace', newScore >= 8 ? 3 : newScore >= 5 ? 2 : 1, newScore * 10);
            setGameComplete(true);
          }
        }, 800);
      }
    }
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>
          {lang === 'bm' ? 'Nombor kamu cantik!' : 'Beautiful numbers!'}
        </h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('numbers')}>
          {lang === 'bm' ? '← Kembali' : '← Back'}
        </button>
      </div>
    );
  }
  
  const num = NUMBERS[numIdx];
  const dotPositions = Array.from({ length: DOTS_PER_NUM }, (_, i) => ({
    left: 25 + (i % 2) * 50,
    top: 20 + Math.floor(i / 2) * 35 + (Math.sin(i) * 8),
  }));
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/number_trace_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('numbers')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>
          {lang === 'bm' ? `Jejak nombor ${num}!` : `Trace number ${num}!`}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{numIdx + 1}/{NUMBERS.length}</div>
        <div style={{
          margin: '20px auto', width: 220, height: 220, background: 'white', borderRadius: 24,
          position: 'relative', boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8rem', color: 'rgba(173,20,87,0.1)', fontFamily: 'var(--font-heading)', fontWeight: 900,
          }}>{num}</div>
          {dotPositions.map((pos, i) => (
            <button key={i} onClick={() => handleDotTap(i)} style={{
              position: 'absolute', left: `${pos.left}%`, top: `${pos.top}%`,
              width: i < dotsTapped ? 18 : 26, height: i < dotsTapped ? 18 : 26, borderRadius: '50%',
              background: i < dotsTapped ? '#AD1457' : i === dotsTapped ? '#FFD93D' : '#E0E0E0',
              border: i === dotsTapped ? '3px solid #FF9800' : '2px solid rgba(0,0,0,0.1)',
              cursor: i === dotsTapped ? 'pointer' : 'default', transform: 'translate(-50%, -50%)',
              transition: 'all 0.2s ease', fontSize: '0.7rem', color: 'white', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: i === dotsTapped ? '0 0 12px rgba(255,152,0,0.5)' : 'none',
            }}>{i < dotsTapped ? '✓' : i + 1}</button>
          ))}
        </div>
        {feedback && (
          <div style={{ marginTop: 12, padding: '8px 16px', borderRadius: 12, background: '#6BCB77', color: 'white', fontWeight: 700, display: 'inline-block' }}><CheckIcon size={14} /> {feedback.message}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// BIGGER SMALLER GAME (Besar & Kecil)
// Which group has more items?
// ============================================
export function BiggerSmallerGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const EMOJIS = ['🍎','🌟','🐱','🎈','🐟','🌺','🦋','🍬'];
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [leftCount, setLeftCount] = useState(0);
  const [rightCount, setRightCount] = useState(0);
  const [leftEmoji, setLeftEmoji] = useState('🍎');
  const [rightEmoji, setRightEmoji] = useState('🌟');
  const TOTAL_ROUNDS = 15;
  
  const generateRound = useCallback(() => {
    const l = Math.floor(Math.random() * 5) + 1;
    let r = Math.floor(Math.random() * 5) + 1;
    while (r === l) r = Math.floor(Math.random() * 5) + 1;
    setLeftCount(l);
    setRightCount(r);
    setLeftEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
    setRightEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  }, []);
  
  useEffect(() => { generateRound(); }, []);
  
  const handleChoice = (side) => {
    const correct = (side === 'left' && leftCount > rightCount) || (side === 'right' && rightCount > leftCount);
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    setTimeout(() => {
      setFeedback(null);
      if (round + 1 < TOTAL_ROUNDS) {
        setRound(round + 1);
        generateRound();
      } else {
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        const finalScore = correct ? score + 1 : score;
        completeGame('numbers', 'bigger-smaller', finalScore >= 7 ? 3 : finalScore >= 4 ? 2 : 1, finalScore * 10);
        setGameComplete(true);
      }
    }, 800);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>
          {lang === 'bm' ? 'Bijak Membanding!' : 'Great Comparing!'}
        </h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('numbers')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/bigger_smaller_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('numbers')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>
          {lang === 'bm' ? 'Mana lebih banyak?' : 'Which has more?'}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{round + 1}/{TOTAL_ROUNDS}</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '20px 0' }}>
          <button onClick={() => handleChoice('left')} style={{
            flex: 1, maxWidth: 160, padding: 20, borderRadius: 20, background: 'white',
            border: '3px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ lineHeight: 1.4, display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
              {Array.from({ length: leftCount }).map((_, i) => <GI key={i} e={leftEmoji} size={32}/>)}
            </div>
          </button>
          <button onClick={() => handleChoice('right')} style={{
            flex: 1, maxWidth: 160, padding: 20, borderRadius: 20, background: 'white',
            border: '3px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ lineHeight: 1.4, display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
              {Array.from({ length: rightCount }).map((_, i) => <GI key={i} e={rightEmoji} size={32}/>)}
            </div>
          </button>
        </div>
        {feedback && (
          <div style={{ marginTop: 12, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PATTERNS GAME (Corak & Pola)
// Complete the pattern sequence!
// ============================================
export function PatternsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const PATTERN_SETS = [
    { pattern: ['🔴','🔵','🔴','🔵'], answer: '🔴', choices: ['🔴','🟡','🟢'] },
    { pattern: ['⭐','⭐','🌙','⭐','⭐'], answer: '🌙', choices: ['🌙','⭐','☀️'] },
    { pattern: ['🍎','🍊','🍎','🍊','🍎'], answer: '🍊', choices: ['🍊','🍎','🍇'] },
    { pattern: ['🐱','🐶','🐱','🐶'], answer: '🐱', choices: ['🐱','🐟','🐰'] },
    { pattern: ['1️⃣','2️⃣','3️⃣','4️⃣'], answer: '5️⃣', choices: ['5️⃣','7️⃣','0️⃣'] },
    { pattern: ['🟩','🟨','🟩','🟨','🟩'], answer: '🟨', choices: ['🟨','🟩','🟦'] },
  ];
  
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handleChoice = (emoji) => {
    const correct = emoji === PATTERN_SETS[idx].answer;
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    setTimeout(() => {
      setFeedback(null);
      if (idx + 1 < PATTERN_SETS.length) setIdx(idx + 1);
      else {
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        const f = correct ? score + 1 : score;
        completeGame('numbers', 'patterns', f >= 5 ? 3 : f >= 3 ? 2 : 1, f * 15);
        setGameComplete(true);
      }
    }, 800);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#6A1B9A' }}>{lang === 'bm' ? 'Bijak Corak!' : 'Pattern Master!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('numbers')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const p = PATTERN_SETS[idx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/pattern_puzzle_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('numbers')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#6A1B9A' }}>{lang === 'bm' ? 'Lengkapkan corak!' : 'Complete the pattern!'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{PATTERN_SETS.length}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '24px 0', alignItems: 'center', flexWrap: 'wrap' }}>
          {p.pattern.map((e, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}><GI e={e} size={36}/></span>
          ))}
          <span style={{ fontSize: '2.2rem', width: 50, height: 50, borderRadius: 12, border: '3px dashed #9C27B0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#9C27B0' }}>?</span>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {p.choices.map((c, i) => (
            <button key={i} onClick={() => handleChoice(c)} style={{
              padding: 14, borderRadius: 18, background: 'white',
              border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            }}><GI e={c} size={40}/></button>
          ))}
        </div>
        {feedback && (
          <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAGIC DICE GAME (Dadu Ajaib)
// Roll dice and count the total!
// ============================================
export function MagicDiceGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const [dice1, setDice1] = useState(0);
  const [dice2, setDice2] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [choices, setChoices] = useState([]);
  const TOTAL_ROUNDS = 15;
  
  const rollDice = useCallback(() => {
    setRolling(true);
    if (soundEnabled) playTapSound();
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6);
      const d2 = Math.floor(Math.random() * 6);
      setDice1(d1);
      setDice2(d2);
      const total = (d1 + 1) + (d2 + 1);
      const wrongs = [];
      while (wrongs.length < 2) {
        const w = Math.floor(Math.random() * 12) + 2;
        if (w !== total && !wrongs.includes(w)) wrongs.push(w);
      }
      setChoices([total, ...wrongs].sort(() => Math.random() - 0.5));
      setRolling(false);
    }, 600);
  }, [soundEnabled]);
  
  useEffect(() => { rollDice(); }, []);
  
  const handleAnswer = (num) => {
    const total = (dice1 + 1) + (dice2 + 1);
    if (num === total) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: `${lang === 'bm' ? 'Jawapan betul:' : 'Correct answer:'} ${total}` });
    }
    setTimeout(() => {
      setFeedback(null);
      if (round + 1 < TOTAL_ROUNDS) { setRound(round + 1); rollDice(); }
      else {
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        const f = num === total ? score + 1 : score;
        completeGame('numbers', 'magic-dice', f >= 7 ? 3 : f >= 4 ? 2 : 1, f * 10);
        setGameComplete(true);
      }
    }, 1000);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{lang === 'bm' ? 'Bijak Mengira!' : 'Great Counting!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('numbers')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/colour_hunt_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('numbers')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{lang === 'bm' ? 'Berapa jumlah?' : 'What is the total?'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{round + 1}/{TOTAL_ROUNDS}</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', margin: '24px 0' }}>
          <div style={{ fontSize: '5rem', transition: 'transform 0.3s', transform: rolling ? 'rotate(360deg)' : 'rotate(0)' }}>{DICE_FACES[dice1]}</div>
          <div style={{ fontSize: '2rem', alignSelf: 'center', fontWeight: 900 }}>+</div>
          <div style={{ fontSize: '5rem', transition: 'transform 0.3s', transform: rolling ? 'rotate(-360deg)' : 'rotate(0)' }}>{DICE_FACES[dice2]}</div>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>{dice1 + 1} + {dice2 + 1} = ?</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {choices.map((c, i) => (
            <button key={i} onClick={() => handleAnswer(c)} disabled={rolling} style={{
              width: 60, height: 60, borderRadius: 16, fontSize: '1.5rem', fontWeight: 900,
              background: 'white', border: '2px solid rgba(0,0,0,0.1)', cursor: 'pointer',
              fontFamily: 'var(--font-heading)', boxShadow: 'var(--shadow-sm)',
            }}>{c}</button>
          ))}
        </div>
        {feedback && (
          <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 🖌️ MAGIC COLOURING GAME (Mewarna Ajaib)
// Colour regions and watch them animate!
// ============================================
export function MagicColouringGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const SCENES = [
    { name: lang === 'bm' ? 'Kucing' : 'Cat', parts: ['Badan', 'Telinga', 'Ekor'], emoji: '🐱' },
    { name: lang === 'bm' ? 'Bunga' : 'Flower', parts: ['Kelopak', 'Daun', 'Batang'], emoji: '🌸' },
    { name: lang === 'bm' ? 'Rumah' : 'House', parts: ['Dinding', 'Bumbung', 'Pintu'], emoji: '🏠' },
  ];
  const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#9B72CF', '#FF9800', '#2196F3', '#E91E63'];
  
  const [sceneIdx, setSceneIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [partColors, setPartColors] = useState({});
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handleColorPart = (partIdx) => {
    if (soundEnabled) playTapSound();
    const key = `${sceneIdx}-${partIdx}`;
    setPartColors({ ...partColors, [key]: selectedColor });
    
    const allColored = SCENES[sceneIdx].parts.every((_, i) => partColors[`${sceneIdx}-${i}`] || `${sceneIdx}-${i}` === key);
    if (allColored) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(() => {
        if (sceneIdx + 1 < SCENES.length) setSceneIdx(sceneIdx + 1);
        else {
          if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
          completeGame('colours', 'magic-colouring', newScore >= 3 ? 3 : 2, newScore * 30);
          setGameComplete(true);
        }
      }, 1000);
    }
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#7B1FA2' }}>{lang === 'bm' ? 'Lukisan cantik!' : 'Beautiful art!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('colours')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const scene = SCENES[sceneIdx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/magic_colouring_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('colours')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7B1FA2' }}>{lang === 'bm' ? `Warnakan ${scene.name}!` : `Colour the ${scene.name}!`}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{sceneIdx + 1}/{SCENES.length}</div>
        <div style={{ textAlign: 'center', margin: '12px 0' }}><GI e={scene.emoji} size={64}/></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px auto', maxWidth: 280 }}>
          {scene.parts.map((part, i) => {
            const key = `${sceneIdx}-${i}`;
            return (
              <button key={i} onClick={() => handleColorPart(i)} style={{
                padding: '12px 16px', borderRadius: 14, border: '2px solid rgba(0,0,0,0.1)',
                background: partColors[key] || '#F5F5F5', color: partColors[key] ? 'white' : '#333',
                fontWeight: 700, cursor: 'pointer', textShadow: partColors[key] ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.3s ease', fontSize: '1rem',
              }}>{part}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0' }}>
          {COLORS.map((c, i) => (
            <button key={i} onClick={() => { setSelectedColor(c); if (soundEnabled) playTapSound(); }} style={{
              width: 32, height: 32, borderRadius: '50%', background: c,
              border: selectedColor === c ? '3px solid #333' : '2px solid rgba(0,0,0,0.1)',
              cursor: 'pointer', transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.15s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SOCK PAIRS GAME (Pasangan Stokin)
// Memory match — find matching sock pairs!
// ============================================
export function SockPairsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const SOCK_COLORS = ['🧦🔴', '🧦🔵', '🧦🟢', '🧦🟡', '🧦🟣', '🧦🟠'];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  
  useEffect(() => {
    const pairs = SOCK_COLORS.slice(0, 4);
    const allCards = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
    setCards(allCards);
  }, []);
  
  const handleFlip = (idx) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;
    if (soundEnabled) playTapSound();
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    
    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
        const newMatched = [...matched, ...newFlipped];
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === cards.length) {
          if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
          const stars = moves + 1 <= 6 ? 3 : moves + 1 <= 10 ? 2 : 1;
          completeGame('colours', 'sock-pairs', stars, (12 - Math.min(moves + 1, 11)) * 10);
          setGameComplete(true);
        }
      } else {
        if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };
  
  if (gameComplete) {
    const stars = moves <= 6 ? 3 : moves <= 10 ? 2 : 1;
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#283593' }}>{lang === 'bm' ? 'Semua berpasangan!' : 'All matched!'}</h1>
        <p>{moves} {lang === 'bm' ? 'cubaan' : 'moves'}</p>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('colours')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/sock_room_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('colours')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#283593' }}>{lang === 'bm' ? 'Cari Pasangan!' : 'Find Pairs!'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{lang === 'bm' ? `Cubaan: ${moves}` : `Moves: ${moves}`}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, maxWidth: 300, margin: '20px auto' }}>
          {cards.map((card, i) => {
            const isVisible = flipped.includes(i) || matched.includes(i);
            return (
              <button key={i} onClick={() => handleFlip(i)} style={{
                width: '100%', aspectRatio: '1', borderRadius: 16, fontSize: '1.8rem',
                background: matched.includes(i) ? '#C8E6C9' : isVisible ? 'white' : 'linear-gradient(135deg, #5C6BC0, #3F51B5)',
                border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.3s ease', transform: isVisible ? 'rotateY(0deg)' : 'rotateY(180deg)',
              }}>
                {isVisible ? card.slice(0, 2) : '?'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COLOUR HUNTER GAME (Pemburu Warna)
// Find items of the target colour!
// ============================================
export function ColourHunterGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const ROUNDS = [
    { color: lang === 'bm' ? 'Merah' : 'Red', bg: '#FF6B6B', targets: ['🍎','🌹','❤️','🍒'], distractors: ['🍌','🥒','🔵','🟢'] },
    { color: lang === 'bm' ? 'Biru' : 'Blue', bg: '#42A5F5', targets: ['🫐','💙','🧊','🌊'], distractors: ['🍊','🍋','🔴','🟡'] },
    { color: lang === 'bm' ? 'Hijau' : 'Green', bg: '#66BB6A', targets: ['🥒','🌿','🐸','🍀'], distractors: ['🍓','🍑','🔵','🟡'] },
    { color: lang === 'bm' ? 'Kuning' : 'Yellow', bg: '#FFD93D', targets: ['🍌','⭐','🌻','🐤'], distractors: ['🍇','🫐','🔴','🟢'] },
  ];
  
  const [roundIdx, setRoundIdx] = useState(0);
  const [found, setFound] = useState([]);
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const setupRound = useCallback((idx) => {
    const r = ROUNDS[idx];
    const all = [...r.targets.slice(0, 3), ...r.distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
    setItems(all);
    setFound([]);
  }, []);
  
  useEffect(() => { setupRound(0); }, []);
  
  const handleTap = (item) => {
    const r = ROUNDS[roundIdx];
    if (found.includes(item)) return;
    if (r.targets.includes(item)) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      const newFound = [...found, item];
      setFound(newFound);
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      if (newFound.length === 3) {
        setScore(score + 1);
        setTimeout(() => {
          setFeedback(null);
          if (roundIdx + 1 < ROUNDS.length) { setRoundIdx(roundIdx + 1); setupRound(roundIdx + 1); }
          else {
            if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
            completeGame('colours', 'colour-hunter', score + 1 >= 4 ? 3 : score + 1 >= 2 ? 2 : 1, (score + 1) * 25);
            setGameComplete(true);
          }
        }, 800);
      }
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    setTimeout(() => setFeedback(null), 1200);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17' }}>{lang === 'bm' ? 'Pemburu Warna Hebat!' : 'Colour Hunter!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('colours')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const r = ROUNDS[roundIdx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/colour_hunt_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('colours')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: r.bg }}>
          {lang === 'bm' ? `Cari benda ${r.color}!` : `Find ${r.color} things!`}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{roundIdx + 1}/{ROUNDS.length} • {found.length}/3</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 280, margin: '24px auto' }}>
          {items.map((item, i) => (
            <button key={i} onClick={() => handleTap(item)} style={{
              padding: 14, borderRadius: 18, background: found.includes(item) ? `${r.bg}33` : 'white',
              border: found.includes(item) ? `3px solid ${r.bg}` : '2px solid rgba(0,0,0,0.08)',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)', opacity: found.includes(item) ? 0.6 : 1,
            }}><GI e={item} size={40}/></button>
          ))}
        </div>
        {feedback && (
          <div style={{ marginTop: 12, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// BUILD VEHICLE GAME (Bina Kenderaan)
// Pick the right parts to build a vehicle!
// ============================================
export function BuildVehicleGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const VEHICLES = [
    { name: lang === 'bm' ? 'Kereta' : 'Car', emoji: '🚗', parts: ['🔧','🛞','🪟','🚗'], wrong: ['⛵','✈️','🚂'] },
    { name: lang === 'bm' ? 'Kapal Terbang' : 'Airplane', emoji: '✈️', parts: ['🛫','✈️','💺','🔧'], wrong: ['🚗','⛵','🚲'] },
    { name: lang === 'bm' ? 'Kapal' : 'Ship', emoji: '🚢', parts: ['⚓','🚢','⛵','🔧'], wrong: ['🚗','✈️','🚂'] },
  ];
  
  const [vIdx, setVIdx] = useState(0);
  const [partIdx, setPartIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [builtParts, setBuiltParts] = useState([]);
  
  const handlePick = (emoji) => {
    const v = VEHICLES[vIdx];
    if (emoji === v.parts[partIdx]) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      const newBuilt = [...builtParts, emoji];
      setBuiltParts(newBuilt);
      setTimeout(() => {
        setFeedback(null);
        if (partIdx + 1 < v.parts.length) setPartIdx(partIdx + 1);
        else {
          const newScore = score + 1;
          setScore(newScore);
          if (vIdx + 1 < VEHICLES.length) { setVIdx(vIdx + 1); setPartIdx(0); setBuiltParts([]); }
          else {
            if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
            completeGame('transport', 'build-vehicle', newScore >= 3 ? 3 : 2, newScore * 30);
            setGameComplete(true);
          }
        }
      }, 600);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
      setTimeout(() => setFeedback(null), 1000);
    }
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{lang === 'bm' ? 'Jurutera Hebat!' : 'Great Engineer!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('transport')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const v = VEHICLES[vIdx];
  const choices = [v.parts[partIdx], ...v.wrong.slice(0, 2)].sort(() => Math.random() - 0.5);
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/build_vehicle_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('transport')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{lang === 'bm' ? `Bina ${v.name}!` : `Build a ${v.name}!`}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{vIdx + 1}/{VEHICLES.length}</div>
        <div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={v.emoji} size={64}/></div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 16 }}>
          {v.parts.map((_, i) => (
            <div key={i} style={{
              width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < builtParts.length ? '#6BCB77' : '#E0E0E0', fontSize: '0.8rem',
            }}>{i < builtParts.length ? '✓' : i + 1}</div>
          ))}
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>
          {lang === 'bm' ? `Bahagian ${partIdx + 1}: Pilih yang betul!` : `Part ${partIdx + 1}: Pick the right one!`}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {choices.map((c, i) => (
            <button key={i} onClick={() => handlePick(c)} style={{
              fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white',
              border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            }}>{c}</button>
          ))}
        </div>
        {feedback && (
          <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// WORLD VEHICLES GAME (Kenderaan Dunia)
// Learn about unique vehicles from around the world!
// ============================================
export function WorldVehiclesGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const VEHICLES = [
    { name: lang === 'bm' ? 'Tuk-Tuk' : 'Tuk-Tuk', country: 'Thailand', emoji: '🛺', fact: lang === 'bm' ? 'Teksi tiga roda popular di Asia!' : 'Popular three-wheeled taxi in Asia!' },
    { name: lang === 'bm' ? 'Gondola' : 'Gondola', country: 'Italy', emoji: '🚣', fact: lang === 'bm' ? 'Bot di kanal Venice!' : 'Boat in Venice canals!' },
    { name: lang === 'bm' ? 'Kereta Api Peluru' : 'Bullet Train', country: 'Japan', emoji: '🚄', fact: lang === 'bm' ? 'Kereta api paling laju di dunia!' : 'Fastest train in the world!' },
    { name: lang === 'bm' ? 'Rickshaw' : 'Rickshaw', country: 'India', emoji: '🛺', fact: lang === 'bm' ? 'Ditarik oleh manusia atau basikal!' : 'Pulled by people or bicycles!' },
    { name: lang === 'bm' ? 'Bas Sekolah' : 'School Bus', country: 'USA', emoji: '🚌', fact: lang === 'bm' ? 'Bas kuning yang terkenal!' : 'The famous yellow bus!' },
  ];
  
  const [idx, setIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showFact, setShowFact] = useState(true);
  
  const handleQuiz = (answer) => {
    const correct = answer === VEHICLES[idx].country;
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setScore(score + 1);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
    }
    setQuizAnswer(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      setQuizAnswer(null);
      setShowFact(true);
      if (idx + 1 < VEHICLES.length) setIdx(idx + 1);
      else {
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        const f = correct ? score + 1 : score;
        completeGame('transport', 'world-vehicles', f >= 4 ? 3 : f >= 2 ? 2 : 1, f * 20);
        setGameComplete(true);
      }
    }, 1000);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{lang === 'bm' ? 'Penjelajah Kenderaan!' : 'Vehicle Explorer!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('transport')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const v = VEHICLES[idx];
  const countryChoices = [v.country, ...VEHICLES.filter((_, i) => i !== idx).slice(0, 2).map(x => x.country)].sort(() => Math.random() - 0.5);
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/world_vehicles_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('transport')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{v.name}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{VEHICLES.length}</div>
        <div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={v.emoji} size={80}/></div>
        {showFact && (
          <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}>
            <p style={{ fontSize: '0.9rem', color: '#555', margin: 0 }}>{v.fact}</p>
            <button onClick={() => setShowFact(false)} style={{
              marginTop: 12, padding: '8px 20px', borderRadius: 12, background: '#00897B', color: 'white',
              border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)',
            }}>{lang === 'bm' ? 'Kuiz!' : 'Quiz!'}</button>
          </div>
        )}
        {!showFact && (
          <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>
              {lang === 'bm' ? `${v.name} dari mana?` : `Where is ${v.name} from?`}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {countryChoices.map((c, i) => (
                <button key={i} onClick={() => handleQuiz(c)} style={{
                  padding: '10px 16px', borderRadius: 12, background: 'white', border: '2px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                }}>{c}</button>
              ))}
            </div>
            {quizAnswer && (
              <div style={{ marginTop: 10, fontWeight: 700, color: quizAnswer === 'correct' ? '#4CAF50' : '#F44336' }}>
                {quizAnswer === 'correct' ? '' : ''} {v.country}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ANIMAL PUZZLE GAME (Lengkap Haiwan)
// Pick the missing part of the animal!
// ============================================
export function AnimalPuzzleGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const PUZZLES = [
    { animal: '🐘', name: lang === 'bm' ? 'Gajah' : 'Elephant', missing: lang === 'bm' ? 'Belalai' : 'Trunk', answer: '👃', choices: ['👃','👂','👀'] },
    { animal: '🦁', name: lang === 'bm' ? 'Singa' : 'Lion', missing: lang === 'bm' ? 'Surai' : 'Mane', answer: '💇', choices: ['💇','🦷','👅'] },
    { animal: '🐢', name: lang === 'bm' ? 'Penyu' : 'Turtle', missing: lang === 'bm' ? 'Cengkerang' : 'Shell', answer: '🛡️', choices: ['🛡️','🎩','👑'] },
    { animal: '🐰', name: lang === 'bm' ? 'Arnab' : 'Rabbit', missing: lang === 'bm' ? 'Telinga panjang' : 'Long ears', answer: '👂', choices: ['👂','👃','👀'] },
    { animal: '🦚', name: lang === 'bm' ? 'Merak' : 'Peacock', missing: lang === 'bm' ? 'Ekor cantik' : 'Beautiful tail', answer: '🪶', choices: ['🪶','🦷','🫁'] },
    { animal: '🐙', name: lang === 'bm' ? 'Sotong' : 'Octopus', missing: lang === 'bm' ? 'Tentakel' : 'Tentacles', answer: '🦑', choices: ['🦑','🐚','🦀'] },
  ];
  
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handleChoice = (answer) => {
    const correct = answer === PUZZLES[idx].answer;
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    setTimeout(() => {
      setFeedback(null);
      if (idx + 1 < PUZZLES.length) setIdx(idx + 1);
      else {
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        const f = correct ? score + 1 : score;
        completeGame('animals', 'animal-puzzle', f >= 5 ? 3 : f >= 3 ? 2 : 1, f * 15);
        setGameComplete(true);
      }
    }, 800);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>{lang === 'bm' ? 'Pakar Haiwan!' : 'Animal Expert!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('animals')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const p = PUZZLES[idx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/animal_puzzle_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('animals')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>{lang === 'bm' ? 'Apa yang hilang?' : 'What is missing?'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{PUZZLES.length}</div>
        <div style={{ fontSize: '5rem', margin: '16px 0' }}>{p.animal}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: 16 }}>
          {lang === 'bm' ? `Bahagian hilang: ${p.missing}` : `Missing part: ${p.missing}`}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {p.choices.map((c, i) => (
            <button key={i} onClick={() => handleChoice(c)} style={{
              fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white',
              border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            }}>{c}</button>
          ))}
        </div>
        {feedback && (
          <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ANIMAL ENCYCLOPEDIA GAME (Ensaiklopedia)
// Collect animal badges by answering questions!
// ============================================
export function AnimalEncyclopediaGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const ANIMALS = [
    { emoji: '🦁', name: lang === 'bm' ? 'Singa' : 'Lion', q: lang === 'bm' ? 'Singa makan...' : 'Lions eat...', a: '🥩', choices: ['🥩','🥬','🍎'] },
    { emoji: '🐘', name: lang === 'bm' ? 'Gajah' : 'Elephant', q: lang === 'bm' ? 'Gajah tinggal di...' : 'Elephants live in...', a: '🌿', choices: ['🌿','❄️','🌊'] },
    { emoji: '🐬', name: lang === 'bm' ? 'Lumba-lumba' : 'Dolphin', q: lang === 'bm' ? 'Lumba-lumba hidup di...' : 'Dolphins live in...', a: '🌊', choices: ['🌊','🏔️','🌵'] },
    { emoji: '🦅', name: lang === 'bm' ? 'Helang' : 'Eagle', q: lang === 'bm' ? 'Helang boleh...' : 'Eagles can...', a: '🦅', choices: ['🦅','🏊','🏃'] },
    { emoji: '🐧', name: lang === 'bm' ? 'Penguin' : 'Penguin', q: lang === 'bm' ? 'Penguin tinggal di...' : 'Penguins live in...', a: '❄️', choices: ['❄️','🌴','🏜️'] },
  ];
  
  const [idx, setIdx] = useState(0);
  const [badges, setBadges] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handleAnswer = (answer) => {
    const correct = answer === ANIMALS[idx].a;
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setBadges([...badges, ANIMALS[idx].emoji]);
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    setTimeout(() => {
      setFeedback(null);
      if (idx + 1 < ANIMALS.length) setIdx(idx + 1);
      else {
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        const f = correct ? score + 1 : score;
        completeGame('animals', 'animal-encyclopedia', f >= 4 ? 3 : f >= 2 ? 2 : 1, f * 20);
        setGameComplete(true);
      }
    }, 800);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#1B5E20' }}>{lang === 'bm' ? 'Ensaiklopedia Lengkap!' : 'Encyclopedia Complete!'}</h1>
        <div style={{ fontSize: '2rem', margin: '8px 0' }}>{badges.join(' ')}</div>
        <div style={{ fontSize: '2rem', margin: '8px 0' }}>{Array.from({length: 3}, (_, i) => <StarIcon key={i} size={28} />)}</div>
        <button className="btn-premium" onClick={() => goToWorld('animals')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const a = ANIMALS[idx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/animal_encyclopedia_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('animals')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1B5E20' }}>{a.name}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{ANIMALS.length}</div>
        {badges.length > 0 && <div style={{ fontSize: '1.5rem', margin: '8px 0' }}>{badges.join(' ')}</div>}
        <div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={a.emoji} size={80}/></div>
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>{a.q}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {a.choices.map((c, i) => (
            <button key={i} onClick={() => handleAnswer(c)} style={{
              fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white',
              border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            }}>{c}</button>
          ))}
        </div>
        {feedback && (
          <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
            {feedback.type === 'correct' ? '' : ''}{feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MIMIC ANIMAL GAME (Tiru Haiwan)
// Follow the animal's actions!
// ============================================
export function MimicAnimalGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const ACTIONS = [
    { animal: '🐱', name: lang === 'bm' ? 'Kucing' : 'Cat', action: lang === 'bm' ? 'Mengeong! Meow!' : 'Say Meow!', sound: '😺' },
    { animal: '🐶', name: lang === 'bm' ? 'Anjing' : 'Dog', action: lang === 'bm' ? 'Menyalak! Woof!' : 'Say Woof!', sound: '🐕' },
    { animal: '🐸', name: lang === 'bm' ? 'Katak' : 'Frog', action: lang === 'bm' ? 'Lompat tinggi!' : 'Jump high!', sound: '🦿' },
    { animal: '🐘', name: lang === 'bm' ? 'Gajah' : 'Elephant', action: lang === 'bm' ? 'Hayun belalai!' : 'Swing your trunk!', sound: '💪' },
    { animal: '🦁', name: lang === 'bm' ? 'Singa' : 'Lion', action: lang === 'bm' ? 'Mengaum! Roar!' : 'Roar loudly!', sound: '🗣️' },
    { animal: '🐧', name: lang === 'bm' ? 'Penguin' : 'Penguin', action: lang === 'bm' ? 'Berjalan goyang-goyang!' : 'Waddle walk!', sound: '🚶' },
  ];
  
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [acting, setActing] = useState(false);
  
  const startAction = () => {
    if (soundEnabled) playTapSound();
    // Play real animal SFX when starting mimic
    if (soundEnabled && lang === 'bm') {
      const sfxMap = { '🐱': 'kucing', '🐶': 'anjing', '🐸': 'katak', '🐘': 'gajah', '🦁': 'singa' };
      const animalKey = sfxMap[ACTIONS[idx].animal];
      if (animalKey) setTimeout(() => playBMAnimalSfx(animalKey), 300);
    }
    setActing(true);
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (soundEnabled) {
            if (lang === 'bm') playBMCorrectFeedback();
            else playCorrectSound();
          }
          setDone(true);
          setActing(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const nextAnimal = () => {
    setDone(false);
    if (idx + 1 < ACTIONS.length) setIdx(idx + 1);
    else {
      if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
      completeGame('animals', 'mimic-animal', 3, ACTIONS.length * 15);
      setGameComplete(true);
    }
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17' }}>{lang === 'bm' ? 'Pelakon Hebat!' : 'Great Actor!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('animals')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const a = ACTIONS[idx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/mimic_animal_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('animals')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17' }}>{lang === 'bm' ? 'Tiru Haiwan!' : 'Act Like an Animal!'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{ACTIONS.length}</div>
        <div style={{ textAlign: 'center', margin: '20px 0', animation: acting ? 'bounce 0.5s infinite alternate' : 'none' }}><GI e={a.animal} size={96}/></div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{a.name}</div>
        <div style={{ fontSize: '1rem', color: '#555', margin: '8px 0 20px' }}>{a.action}</div>
        {acting && <div style={{ fontSize: '3rem', fontWeight: 900, color: '#F57F17' }}>{countdown}</div>}
        {!acting && !done && (
          <button onClick={startAction} style={{
            padding: '14px 32px', borderRadius: 20, background: 'linear-gradient(135deg, #FFD93D, #FFA726)',
            color: 'white', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
            fontFamily: 'var(--font-heading)', boxShadow: '0 4px 16px rgba(255,152,0,0.4)',
          }}>{lang === 'bm' ? 'Mula!' : 'Start!'}</button>
        )}
        {done && (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>{lang === 'bm' ? 'Hebat!' : 'Awesome!'}</div>
            <button onClick={nextAnimal} style={{
              padding: '12px 28px', borderRadius: 16, background: '#6BCB77', color: 'white',
              border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-heading)',
            }}>{lang === 'bm' ? 'Seterusnya →' : 'Next →'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ABC SONG GAME (Nyanyian ABC)
// Interactive ABC song with karaoke-style highlighting!
// ============================================
export function AbcSongGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const ABC_ROWS = [
    ['A','B','C','D','E','F','G'],
    ['H','I','J','K','L','M','N'],
    ['O','P','Q','R','S','T','U'],
    ['V','W','X','Y','Z'],
  ];
  const FLAT = ABC_ROWS.flat();
  
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  
  const startSong = () => {
    if (playing) return;
    setPlaying(true);
    setCurrentIdx(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= FLAT.length) {
        clearInterval(interval);
        setPlaying(false);
        setCurrentIdx(-1);
        const newCount = completedCount + 1;
        setCompletedCount(newCount);
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        if (newCount >= 2) {
          completeGame('abc', 'abc-song', 3, 100);
          setGameComplete(true);
        }
      } else {
        setCurrentIdx(i);
        if (soundEnabled) playTapSound();
      }
    }, 350);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{lang === 'bm' ? 'Pandai nyanyi ABC!' : 'ABC Song Star!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('abc')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/abc_song_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('abc')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{lang === 'bm' ? 'Nyanyian ABC!' : 'ABC Song!'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{completedCount}/2 {lang === 'bm' ? 'selesai' : 'complete'}</div>
        <div style={{ margin: '20px auto', maxWidth: 320 }}>
          {ABC_ROWS.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
              {row.map((letter) => {
                const flatIdx = FLAT.indexOf(letter);
                const isActive = flatIdx === currentIdx;
                const isPast = flatIdx < currentIdx && currentIdx >= 0;
                return (
                  <div key={letter} style={{
                    width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
                    background: isActive ? '#FFD93D' : isPast ? '#4A90D9' : 'white',
                    color: isActive ? '#333' : isPast ? 'white' : '#666',
                    border: isActive ? '3px solid #FF9800' : '2px solid rgba(0,0,0,0.08)',
                    transform: isActive ? 'scale(1.3)' : 'scale(1)', transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 16px rgba(255,152,0,0.4)' : 'var(--shadow-sm)',
                  }}>{letter}</div>
                );
              })}
            </div>
          ))}
        </div>
        <button onClick={startSong} disabled={playing} style={{
          padding: '14px 36px', borderRadius: 20, background: playing ? '#999' : 'linear-gradient(135deg, #4A90D9, #1565C0)',
          color: 'white', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: playing ? 'default' : 'pointer',
          fontFamily: 'var(--font-heading)', boxShadow: '0 4px 16px rgba(74,144,217,0.4)',
        }}>
          {playing ? '...' : 'Play'} {lang === 'bm' ? (playing ? 'Menyanyi...' : 'Nyanyi!') : (playing ? 'Singing...' : 'Sing!')}
        </button>
      </div>
    </div>
  );
}

// ============================================
// LETTER STORIES GAME (Cerita Huruf)
// Interactive mini-stories that teach letters!
// ============================================
export function LetterStoriesGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const STORIES = [
    {
      letter: 'A',
      title: lang === 'bm' ? 'Arnab yang Aktif' : 'Active Rabbit',
      emoji: '🐰',
      pages: [
        { text: lang === 'bm' ? 'Arnab suka melompat!' : 'Rabbit loves to jump!', emoji: '🐰🦿' },
        { text: lang === 'bm' ? 'A adalah untuk Arnab!' : 'A is for... Rabbit!', emoji: '🔤' },
      ],
      q: lang === 'bm' ? 'A untuk...' : 'A is for...', a: '🐰', choices: ['🐰','🐱','🐶'],
    },
    {
      letter: 'B',
      title: lang === 'bm' ? 'Bola yang Besar' : 'Big Ball',
      emoji: '⚽',
      pages: [
        { text: lang === 'bm' ? 'Bola merah bergolek!' : 'Red ball is rolling!', emoji: '⚽💨' },
        { text: lang === 'bm' ? 'B adalah untuk Bola!' : 'B is for... Ball!', emoji: '🔤' },
      ],
      q: lang === 'bm' ? 'B untuk...' : 'B is for...', a: '⚽', choices: ['⚽','🎈','🧸'],
    },
    {
      letter: 'C',
      title: lang === 'bm' ? 'Cawan yang Cantik' : 'Cute Cup',
      emoji: '☕',
      pages: [
        { text: lang === 'bm' ? 'Cawan berisi susu!' : 'Cup full of milk!', emoji: '☕🥛' },
        { text: lang === 'bm' ? 'C adalah untuk Cawan!' : 'C is for... Cup!', emoji: '🔤' },
      ],
      q: lang === 'bm' ? 'C untuk...' : 'C is for...', a: '☕', choices: ['☕','🍕','🎸'],
    },
  ];
  
  const [storyIdx, setStoryIdx] = useState(0);
  const [pageIdx, setPageIdx] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const nextPage = () => {
    if (soundEnabled) playTapSound();
    const story = STORIES[storyIdx];
    if (pageIdx + 1 < story.pages.length) setPageIdx(pageIdx + 1);
    else setShowQuiz(true);
  };
  
  const handleQuiz = (answer) => {
    const correct = answer === STORIES[storyIdx].a;
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    setTimeout(() => {
      setFeedback(null);
      setShowQuiz(false);
      setPageIdx(0);
      if (storyIdx + 1 < STORIES.length) setStoryIdx(storyIdx + 1);
      else {
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        const f = correct ? score + 1 : score;
        completeGame('abc', 'letter-stories', f >= 3 ? 3 : f >= 2 ? 2 : 1, f * 30);
        setGameComplete(true);
      }
    }, 800);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{lang === 'bm' ? 'Pandai Membaca!' : 'Reading Star!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('abc')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const story = STORIES[storyIdx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/letter_stories_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('abc')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <div style={{
          fontSize: '4rem', width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD93D, #FFA726)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '8px auto', fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'white',
        }}>{story.letter}</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100', margin: '8px 0' }}>{story.title}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{storyIdx + 1}/{STORIES.length}</div>
        
        {!showQuiz ? (
          <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 24, margin: '16px auto', maxWidth: 320 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}><GI e={story.pages[pageIdx].emoji} size={48}/></div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#555', lineHeight: 1.6 }}>{story.pages[pageIdx].text}</p>
            <button onClick={nextPage} style={{
              marginTop: 16, padding: '10px 28px', borderRadius: 14, background: '#FF9800', color: 'white',
              border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-heading)',
            }}>{pageIdx + 1 < story.pages.length ? (lang === 'bm' ? 'Seterusnya →' : 'Next →') : (lang === 'bm' ? 'Kuiz!' : 'Quiz!')}</button>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 24, margin: '16px auto', maxWidth: 320 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>{story.q}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {story.choices.map((c, i) => (
                <button key={i} onClick={() => handleQuiz(c)} style={{
                  fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white',
                  border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                }}>{c}</button>
              ))}
            </div>
            {feedback && (
              <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
                {feedback.type === 'correct' ? '' : ''}{feedback.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ╔════════════════════════════════════════════╗
// ║  COMPLETE TIER WORLDS (RM99.90)           ║
// ║  Body • Shapes • Jobs • Music •           ║
// ║  World Explorer • Science                 ║
// ╚════════════════════════════════════════════╝

// ============================================
// LABEL BODY GAME (Labelkan Badan)
// Drag labels to the correct body parts!
// ============================================
export function LabelBodyGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const PARTS = [
    { id: 'head', label: lang === 'bm' ? 'Kepala' : 'Head', emoji: '🧠', pos: { top: '8%' } },
    { id: 'eyes', label: lang === 'bm' ? 'Mata' : 'Eyes', emoji: '👀', pos: { top: '18%' } },
    { id: 'nose', label: lang === 'bm' ? 'Hidung' : 'Nose', emoji: '👃', pos: { top: '28%' } },
    { id: 'mouth', label: lang === 'bm' ? 'Mulut' : 'Mouth', emoji: '👄', pos: { top: '36%' } },
    { id: 'hands', label: lang === 'bm' ? 'Tangan' : 'Hands', emoji: '🤲', pos: { top: '52%' } },
    { id: 'legs', label: lang === 'bm' ? 'Kaki' : 'Legs', emoji: '🦵', pos: { top: '72%' } },
  ];
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [labeled, setLabeled] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handleTapPart = (partId) => {
    if (labeled.includes(partId)) return;
    const correct = partId === PARTS[currentIdx].id;
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      // Speak the body part name in BM
      if (soundEnabled && lang === 'bm') {
        const bodyMap = { head: 'kepala', eyes: 'mata', nose: 'hidung', mouth: 'mulut', hands: 'tangan', legs: 'kaki' };
        if (bodyMap[partId]) setTimeout(() => playBMBodyPart(bodyMap[partId]), 400);
      }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setLabeled([...labeled, partId]);
      setScore(score + 1);
      setTimeout(() => {
        setFeedback(null);
        if (currentIdx + 1 < PARTS.length) setCurrentIdx(currentIdx + 1);
        else {
          if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
          completeGame('body', 'label-body', score + 1 >= 5 ? 3 : score + 1 >= 3 ? 2 : 1, (score + 1) * 15);
          setGameComplete(true);
        }
      }, 600);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
      setTimeout(() => setFeedback(null), 800);
    }
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{lang === 'bm' ? 'Pandai Labelkan!' : 'Body Expert!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('body')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/body_parts_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('body')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{lang === 'bm' ? 'Labelkan bahagian badan!' : 'Label the body parts!'}</h2>
        <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 20, padding: '12px 16px', margin: '8px auto', maxWidth: 200 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{lang === 'bm' ? 'Cari:' : 'Find:'}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00897B', fontFamily: 'var(--font-heading)' }}>
            {PARTS[currentIdx].emoji} {PARTS[currentIdx].label}
          </div>
        </div>
        <div style={{ position: 'relative', width: 160, height: 320, margin: '12px auto' }}>
          <div style={{ fontSize: '8rem', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}></div>
          {PARTS.map((part, i) => (
            <button key={part.id} onClick={() => handleTapPart(part.id)} style={{
              position: 'absolute', left: '50%', top: part.pos.top, transform: 'translateX(-50%)',
              width: 50, height: 28, borderRadius: 10, fontSize: '0.7rem', fontWeight: 700,
              background: labeled.includes(part.id) ? '#4CAF50' : i === currentIdx ? '#FFD93D' : 'rgba(255,255,255,0.7)',
              color: labeled.includes(part.id) ? 'white' : '#333',
              border: i === currentIdx ? '2px solid #FF9800' : '1px solid rgba(0,0,0,0.1)',
              cursor: labeled.includes(part.id) ? 'default' : 'pointer',
              boxShadow: i === currentIdx ? '0 0 8px rgba(255,152,0,0.4)' : 'none',
            }}><GI e={labeled.includes(part.id) ? '✓' : part.emoji} size={32}/></button>
          ))}
        </div>
        {feedback && (
          <div style={{ padding: '6px 14px', borderRadius: 10, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
            {feedback.type === 'correct' ? '' : ''} {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MOVE TOGETHER GAME (Bergerak Bersama)
// Follow the movement instructions!
// ============================================
export function MoveTogetherGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const MOVES = [
    { move: lang === 'bm' ? 'Angkat tangan!' : 'Raise your hands!', emoji: '🙌', duration: 3 },
    { move: lang === 'bm' ? 'Lompat!' : 'Jump!', emoji: '🤸', duration: 3 },
    { move: lang === 'bm' ? 'Pusing badan!' : 'Turn around!', emoji: '🔄', duration: 3 },
    { move: lang === 'bm' ? 'Tepuk tangan!' : 'Clap your hands!', emoji: '👏', duration: 3 },
    { move: lang === 'bm' ? 'Sentuh jari kaki!' : 'Touch your toes!', emoji: '🦶', duration: 3 },
    { move: lang === 'bm' ? 'Geleng kepala!' : 'Shake your head!', emoji: '🙅', duration: 3 },
  ];
  
  const [idx, setIdx] = useState(0);
  const [acting, setActing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [done, setDone] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  
  const startMove = () => {
    if (soundEnabled) playTapSound();
    setActing(true);
    setCountdown(MOVES[idx].duration);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setDone(true); setActing(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };
  
  const next = () => {
    setDone(false);
    if (idx + 1 < MOVES.length) setIdx(idx + 1);
    else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } completeGame('body', 'move-together', 3, MOVES.length * 15); setGameComplete(true); }
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>{lang === 'bm' ? 'Badan Sihat!' : 'Healthy Body!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('body')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const m = MOVES[idx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/body_parts_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('body')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>{lang === 'bm' ? 'Ikut Gerakan!' : 'Follow Along!'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{MOVES.length}</div>
        <div style={{ textAlign: 'center', margin: '20px 0', animation: acting ? 'bounce 0.4s infinite alternate' : 'none' }}><GI e={m.emoji} size={96}/></div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#333' }}>{m.move}</div>
        {acting && <div style={{ fontSize: '3rem', fontWeight: 900, color: '#4CAF50', marginTop: 12 }}>{countdown}</div>}
        {!acting && !done && (
          <button onClick={startMove} style={{ marginTop: 20, padding: '14px 32px', borderRadius: 20, background: 'linear-gradient(135deg, #66BB6A, #43A047)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
            {lang === 'bm' ? 'Mula!' : 'Go!'}
          </button>
        )}
        {done && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{lang === 'bm' ? 'Hebat!' : 'Great!'}</div>
            <button onClick={next} style={{ padding: '10px 24px', borderRadius: 14, background: '#43A047', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
              {lang === 'bm' ? 'Seterusnya →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// HEALTHY HABITS GAME (Tabiat Sihat)
// Put morning routine steps in order!
// ============================================
export function HealthyHabitsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const ROUTINES = [
    { steps: [
      { emoji: '⏰', text: lang === 'bm' ? 'Bangun tidur' : 'Wake up' },
      { emoji: '🪥', text: lang === 'bm' ? 'Gosok gigi' : 'Brush teeth' },
      { emoji: '🚿', text: lang === 'bm' ? 'Mandi' : 'Shower' },
      { emoji: '🥣', text: lang === 'bm' ? 'Sarapan' : 'Breakfast' },
    ]},
    { steps: [
      { emoji: '🏠', text: lang === 'bm' ? 'Balik sekolah' : 'Come home' },
      { emoji: '🤲', text: lang === 'bm' ? 'Basuh tangan' : 'Wash hands' },
      { emoji: '🍽️', text: lang === 'bm' ? 'Makan' : 'Eat dinner' },
      { emoji: '😴', text: lang === 'bm' ? 'Tidur' : 'Sleep' },
    ]},
  ];
  
  const [routineIdx, setRoutineIdx] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [shuffled, setShuffled] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  useEffect(() => {
    setShuffled([...ROUTINES[0].steps].sort(() => Math.random() - 0.5));
  }, []);
  
  const handlePick = (step) => {
    const routine = ROUTINES[routineIdx];
    const nextIdx = placed.length;
    if (step.emoji === routine.steps[nextIdx].emoji) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      const newPlaced = [...placed, step];
      setPlaced(newPlaced);
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      if (newPlaced.length === routine.steps.length) {
        setScore(score + 1);
        setTimeout(() => {
          setFeedback(null);
          if (routineIdx + 1 < ROUTINES.length) {
            setRoutineIdx(routineIdx + 1);
            setPlaced([]);
            setShuffled([...ROUTINES[routineIdx + 1].steps].sort(() => Math.random() - 0.5));
          } else {
            if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
            completeGame('body', 'healthy-habits', score + 1 >= 2 ? 3 : 2, (score + 1) * 40);
            setGameComplete(true);
          }
        }, 800);
      }
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
    }
    setTimeout(() => setFeedback(null), 1000);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{lang === 'bm' ? 'Tabiat Sihat!' : 'Healthy Habits!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('body')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/healthy_habits_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('body')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{lang === 'bm' ? 'Susun aktiviti!' : 'Order the routine!'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{routineIdx + 1}/{ROUTINES.length}</div>
        <div style={{ margin: '12px auto', maxWidth: 280 }}>
          {placed.map((s, i) => (
            <div key={i} style={{ padding: '8px 12px', margin: '4px 0', borderRadius: 12, background: '#C8E6C9', fontWeight: 700, fontSize: '0.9rem' }}>
              {i + 1}. {s.emoji} {s.text}
            </div>
          ))}
          {placed.length < ROUTINES[routineIdx].steps.length && (
            <div style={{ padding: '8px 12px', margin: '4px 0', borderRadius: 12, border: '2px dashed #00897B', color: '#00897B', fontWeight: 700 }}>
              {placed.length + 1}. {lang === 'bm' ? 'Apa seterusnya?' : 'What comes next?'}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', margin: '12px 0' }}>
          {shuffled.filter(s => !placed.find(p => p.emoji === s.emoji)).map((s, i) => (
            <button key={i} onClick={() => handlePick(s)} style={{
              padding: '8px 14px', borderRadius: 12, background: 'white', border: '2px solid rgba(0,0,0,0.08)',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', boxShadow: 'var(--shadow-sm)',
            }}>{s.emoji} {s.text}</button>
          ))}
        </div>
        {feedback && (
          <div style={{ padding: '6px 14px', borderRadius: 10, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>
            {feedback.type === 'correct' ? '' : ''} {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// LITTLE DOCTOR GAME (Doktor Kecil)
// Diagnose and treat sick animal friends!
// ============================================
export function LittleDoctorGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const PATIENTS = [
    { animal: '🐱', name: lang === 'bm' ? 'Kucing' : 'Cat', symptom: lang === 'bm' ? 'Batuk' : 'Coughing', treatment: '💊', choices: ['💊','🩹','💉'] },
    { animal: '🐶', name: lang === 'bm' ? 'Anjing' : 'Dog', symptom: lang === 'bm' ? 'Kaki luka' : 'Hurt paw', treatment: '🩹', choices: ['🩹','💊','🌡️'] },
    { animal: '🐰', name: lang === 'bm' ? 'Arnab' : 'Rabbit', symptom: lang === 'bm' ? 'Demam' : 'Fever', treatment: '🌡️', choices: ['🌡️','🩹','💊'] },
    { animal: '🐻', name: lang === 'bm' ? 'Beruang' : 'Bear', symptom: lang === 'bm' ? 'Sakit perut' : 'Tummy ache', treatment: '💊', choices: ['💊','🩹','💉'] },
    { animal: '🐸', name: lang === 'bm' ? 'Katak' : 'Frog', symptom: lang === 'bm' ? 'Sakit tekak' : 'Sore throat', treatment: '🍯', choices: ['🍯','🩹','💉'] },
  ];
  
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [healed, setHealed] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handleTreat = (treatment) => {
    const correct = treatment === PATIENTS[idx].treatment;
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
      setHealed(true);
      setTimeout(() => {
        setFeedback(null); setHealed(false);
        if (idx + 1 < PATIENTS.length) setIdx(idx + 1);
        else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } completeGame('body', 'little-doctor', score + 1 >= 4 ? 3 : score + 1 >= 2 ? 2 : 1, (score + 1) * 20); setGameComplete(true); }
      }, 1000);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
      setTimeout(() => setFeedback(null), 800);
    }
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>{lang === 'bm' ? 'Doktor Hebat!' : 'Great Doctor!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('body')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  const p = PATIENTS[idx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/doctor_clinic_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('body')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>{lang === 'bm' ? 'Doktor Kecil' : 'Little Doctor'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{PATIENTS.length}</div>
        <div style={{ textAlign: 'center', margin: '16px 0', transition: 'all 0.3s' }}><GI e={healed ? '😊' : p.animal} size={healed ? 96 : 80}/></div>
        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{p.name}</div>
        <div style={{ fontSize: '0.9rem', color: '#666', margin: '4px 0 16px' }}>{lang === 'bm' ? 'Simptom:' : 'Symptom:'} {p.symptom}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {p.choices.map((c, i) => (
            <button key={i} onClick={() => handleTreat(c)} style={{ padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}><GI e={c} size={40}/></button>
          ))}
        </div>
        {feedback && <div style={{ marginTop: 12, padding: '6px 14px', borderRadius: 10, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}
      </div>
    </div>
  );
}

// ============================================
// BODY SONG GAME (Lagu Badan)
// Head, Shoulders, Knees & Toes!
// ============================================
export function BodySongGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const PARTS_SEQ = [
    { part: lang === 'bm' ? 'Kepala' : 'Head', emoji: '🧠' },
    { part: lang === 'bm' ? 'Bahu' : 'Shoulders', emoji: '💪' },
    { part: lang === 'bm' ? 'Lutut' : 'Knees', emoji: '🦵' },
    { part: lang === 'bm' ? 'Jari kaki' : 'Toes', emoji: '🦶' },
    { part: lang === 'bm' ? 'Mata' : 'Eyes', emoji: '👀' },
    { part: lang === 'bm' ? 'Telinga' : 'Ears', emoji: '👂' },
    { part: lang === 'bm' ? 'Mulut' : 'Mouth', emoji: '👄' },
    { part: lang === 'bm' ? 'Hidung' : 'Nose', emoji: '👃' },
  ];
  
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [rounds, setRounds] = useState(0);
  
  const startSong = () => {
    if (playing) return;
    setPlaying(true); setIdx(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= PARTS_SEQ.length) {
        clearInterval(interval); setPlaying(false); setIdx(-1);
        const newRounds = rounds + 1; setRounds(newRounds);
        if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
        if (newRounds >= 2) { completeGame('body', 'body-song', 3, 100); setGameComplete(true); }
      } else { setIdx(i); if (soundEnabled) playTapSound(); }
    }, 500);
  };
  
  if (gameComplete) {
    return (
      <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}>
        <div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#7B1FA2' }}>{lang === 'bm' ? 'Pandai Menyanyi!' : 'Song Star!'}</h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('body')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button>
      </div>
    );
  }
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/body_song_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('body')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#7B1FA2' }}>{lang === 'bm' ? 'Lagu Badan!' : 'Body Song!'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{rounds}/2</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', margin: '20px 0', maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
          {PARTS_SEQ.map((p, i) => (
            <div key={i} style={{
              width: 65, height: 65, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: i === idx ? '#FFD93D' : i < idx && idx >= 0 ? '#9C27B0' : 'white',
              color: i === idx ? '#333' : i < idx && idx >= 0 ? 'white' : '#666',
              fontWeight: 700, fontSize: '0.65rem', border: i === idx ? '3px solid #FF9800' : '2px solid rgba(0,0,0,0.08)',
              transform: i === idx ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.2s ease',
              boxShadow: i === idx ? '0 4px 16px rgba(255,152,0,0.4)' : 'var(--shadow-sm)',
            }}>
              <GI e={p.emoji} size={22}/>
              <span>{p.part}</span>
            </div>
          ))}
        </div>
        <button onClick={startSong} disabled={playing} style={{
          padding: '14px 36px', borderRadius: 20, background: playing ? '#999' : 'linear-gradient(135deg, #9C27B0, #7B1FA2)',
          color: 'white', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: playing ? 'default' : 'pointer', fontFamily: 'var(--font-heading)',
        }}>{playing ? '...' : 'Play'} {lang === 'bm' ? (playing ? 'Menyanyi...' : 'Nyanyi!') : (playing ? 'Singing...' : 'Sing!')}</button>
      </div>
    </div>
  );
}

// ============================================
// MAGIC TANGRAM GAME (Tangram Ajaib)
// Identify which shape completes the tangram!
// ============================================
export function MagicTangramGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const PUZZLES = [
    { name: lang === 'bm' ? 'Rumah' : 'House', emoji: '🏠', answer: '🔺', choices: ['🔺','⬜','⬟'] },
    { name: lang === 'bm' ? 'Pokok' : 'Tree', emoji: '🌲', answer: '🔻', choices: ['🔻','⬜','⬟'] },
    { name: lang === 'bm' ? 'Bot' : 'Boat', emoji: '⛵', answer: '◆', choices: ['◆','🔺','⬜'] },
    { name: lang === 'bm' ? 'Kucing' : 'Cat', emoji: '🐱', answer: '🔺', choices: ['🔺','◆','⬟'] },
    { name: lang === 'bm' ? 'Ikan' : 'Fish', emoji: '🐟', answer: '◆', choices: ['◆','🔺','⬜'] },
  ];
  
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handleChoice = (c) => {
    const correct = c === PUZZLES[idx].answer;
    if (correct) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); setScore(score + 1); }
    else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); }
    setTimeout(() => { setFeedback(null); if (idx + 1 < PUZZLES.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = correct ? score + 1 : score; completeGame('shapes', 'magic-tangram', f >= 4 ? 3 : f >= 2 ? 2 : 1, f * 20); setGameComplete(true); } }, 800);
  };
  
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{lang === 'bm' ? 'Pakar Tangram!' : 'Tangram Master!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('shapes')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div>); }
  
  const p = PUZZLES[idx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/tangram_puzzle_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('shapes')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{lang === 'bm' ? 'Tangram Ajaib' : 'Magic Tangram'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{PUZZLES.length}</div>
        <div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={p.emoji} size={80}/></div>
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>{lang === 'bm' ? `Bentuk apa hilang dari ${p.name}?` : `What shape completes the ${p.name}?`}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {p.choices.map((c, i) => (<button key={i} onClick={() => handleChoice(c)} style={{ fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>{c}</button>))}
        </div>
        {feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}
      </div>
    </div>
  );
}

// ============================================
// DRAW SHAPES GAME (Lukis Bentuk)
// Tap dots in order to trace shapes!
// ============================================
export function DrawShapesGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const SHAPES = [
    { name: lang === 'bm' ? 'Segi Tiga' : 'Triangle', emoji: '🔺', dots: 3 },
    { name: lang === 'bm' ? 'Segi Empat' : 'Square', emoji: '⬜', dots: 4 },
    { name: lang === 'bm' ? 'Pentagon' : 'Pentagon', emoji: '⬟', dots: 5 },
    { name: lang === 'bm' ? 'Bulatan' : 'Circle', emoji: '⭕', dots: 6 },
  ];
  
  const [shapeIdx, setShapeIdx] = useState(0);
  const [dotsTapped, setDotsTapped] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handleDot = (i) => {
    if (i !== dotsTapped) return;
    if (soundEnabled) playTapSound();
    const newDots = dotsTapped + 1;
    setDotsTapped(newDots);
    if (newDots === SHAPES[shapeIdx].dots) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setScore(score + 1);
      setTimeout(() => {
        if (shapeIdx + 1 < SHAPES.length) { setShapeIdx(shapeIdx + 1); setDotsTapped(0); }
        else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } completeGame('shapes', 'draw-shapes', score + 1 >= 3 ? 3 : 2, (score + 1) * 25); setGameComplete(true); }
      }, 600);
    }
  };
  
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#283593' }}>{lang === 'bm' ? 'Pelukis Hebat!' : 'Shape Artist!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('shapes')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div>); }
  
  const s = SHAPES[shapeIdx];
  const dots = Array.from({ length: s.dots }, (_, i) => ({ x: 50 + 35 * Math.cos(2 * Math.PI * i / s.dots - Math.PI / 2), y: 50 + 35 * Math.sin(2 * Math.PI * i / s.dots - Math.PI / 2) }));
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/draw_shapes_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('shapes')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#283593' }}>{lang === 'bm' ? `Lukis ${s.name}!` : `Draw a ${s.name}!`}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{shapeIdx + 1}/{SHAPES.length}</div>
        <div style={{ textAlign: 'center', margin: '8px 0' }}><GI e={s.emoji} size={48}/></div>
        <div style={{ width: 220, height: 220, margin: '12px auto', position: 'relative', background: 'white', borderRadius: 20, boxShadow: 'var(--shadow-lg)' }}>
          {dots.map((d, i) => (
            <button key={i} onClick={() => handleDot(i)} style={{
              position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%,-50%)',
              width: i < dotsTapped ? 16 : 24, height: i < dotsTapped ? 16 : 24, borderRadius: '50%',
              background: i < dotsTapped ? '#3F51B5' : i === dotsTapped ? '#FFD93D' : '#E0E0E0',
              border: i === dotsTapped ? '3px solid #FF9800' : '2px solid rgba(0,0,0,0.1)',
              cursor: i === dotsTapped ? 'pointer' : 'default', transition: 'all 0.2s',
              boxShadow: i === dotsTapped ? '0 0 12px rgba(255,152,0,0.5)' : 'none',
              fontSize: '0.6rem', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{i < dotsTapped ? '✓' : i + 1}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// BUILD PICTURES GAME (Bina Gambar)
// Select shapes to build a picture!
// ============================================
export function BuildPicturesGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const PICTURES = [
    { name: lang === 'bm' ? 'Rumah' : 'House', emoji: '🏠', parts: ['⬜','🔺','⬜'], wrong: ['⭕','◆'] },
    { name: lang === 'bm' ? 'Kereta' : 'Car', emoji: '🚗', parts: ['⬜','⭕','⭕'], wrong: ['🔺','◆'] },
    { name: lang === 'bm' ? 'Robot' : 'Robot', emoji: '🤖', parts: ['⬜','⬜','⭕'], wrong: ['🔺','◆'] },
  ];
  
  const [picIdx, setPicIdx] = useState(0);
  const [partIdx, setPartIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [built, setBuilt] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handlePick = (shape) => {
    const correct = shape === PICTURES[picIdx].parts[partIdx];
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setBuilt([...built, shape]);
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setTimeout(() => {
        setFeedback(null);
        if (partIdx + 1 < PICTURES[picIdx].parts.length) setPartIdx(partIdx + 1);
        else {
          setScore(score + 1);
          if (picIdx + 1 < PICTURES.length) { setPicIdx(picIdx + 1); setPartIdx(0); setBuilt([]); }
          else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } completeGame('shapes', 'build-pictures', score + 1 >= 3 ? 3 : 2, (score + 1) * 30); setGameComplete(true); }
        }
      }, 600);
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); }
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) });
      setTimeout(() => setFeedback(null), 800);
    }
  };
  
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{lang === 'bm' ? 'Arkitek Hebat!' : 'Great Architect!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('shapes')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div>); }
  
  const pic = PICTURES[picIdx];
  const choices = [pic.parts[partIdx], ...pic.wrong].sort(() => Math.random() - 0.5);
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/build_pictures_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('shapes')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{lang === 'bm' ? `Bina ${pic.name}!` : `Build a ${pic.name}!`}</h2>
        <div style={{ textAlign: 'center', margin: '12px 0' }}><GI e={pic.emoji} size={64}/></div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 12 }}>{built.map((b, i) => <span key={i} style={{ fontSize: '1.5rem' }}>{b}</span>)}<span style={{ fontSize: '1.5rem', color: '#999' }}></span></div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12 }}>{lang === 'bm' ? `Bahagian ${partIdx + 1}:` : `Part ${partIdx + 1}:`}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {choices.map((c, i) => (<button key={i} onClick={() => handlePick(c)} style={{ fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>{c}</button>))}
        </div>
        {feedback && <div style={{ marginTop: 12, padding: '6px 14px', borderRadius: 10, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}
      </div>
    </div>
  );
}

// ============================================
// 3D SHAPES GAME (Bentuk 3D)
// Match 3D shapes to their real-world objects!
// ============================================
export function ThreeDShapesGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const SHAPES_3D = [
    { shape: lang === 'bm' ? 'Sfera' : 'Sphere', emoji: '🔮', object: '⚽', objectName: lang === 'bm' ? 'Bola' : 'Ball', choices: ['⚽','📦','🧊'] },
    { shape: lang === 'bm' ? 'Kubus' : 'Cube', emoji: '🧊', object: '📦', objectName: lang === 'bm' ? 'Kotak' : 'Box', choices: ['📦','⚽','🍦'] },
    { shape: lang === 'bm' ? 'Kon' : 'Cone', emoji: '🍦', object: '🍦', objectName: lang === 'bm' ? 'Aiskrim' : 'Ice cream', choices: ['🍦','⚽','📦'] },
    { shape: lang === 'bm' ? 'Silinder' : 'Cylinder', emoji: '🥫', object: '🥫', objectName: lang === 'bm' ? 'Tin' : 'Can', choices: ['🥫','⚽','🧊'] },
    { shape: lang === 'bm' ? 'Piramid' : 'Pyramid', emoji: '🔺', object: '🏔️', objectName: lang === 'bm' ? 'Gunung' : 'Mountain', choices: ['🏔️','📦','⚽'] },
  ];
  
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const handleChoice = (c) => {
    const correct = c === SHAPES_3D[idx].object;
    if (correct) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); setScore(score + 1); }
    else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); }
    setTimeout(() => { setFeedback(null); if (idx + 1 < SHAPES_3D.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = correct ? score + 1 : score; completeGame('shapes', '3d-shapes', f >= 4 ? 3 : f >= 2 ? 2 : 1, f * 20); setGameComplete(true); } }, 800);
  };
  
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', textAlign: 'center', padding: 40 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#283593' }}>{lang === 'bm' ? 'Pakar 3D!' : '3D Expert!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('shapes')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div>); }
  
  const s = SHAPES_3D[idx];
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src={assetPath('/images/game/tangram_puzzle_bg.jpg')} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.85, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('shapes')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#283593' }}>{lang === 'bm' ? 'Bentuk 3D' : '3D Shapes'}</h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{SHAPES_3D.length}</div>
        <div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={s.emoji} size={80}/></div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{s.shape}</div>
        <div style={{ fontSize: '0.9rem', color: '#555', margin: '8px 0 16px' }}>{lang === 'bm' ? 'Benda apa yang sama bentuk?' : 'What real object has this shape?'}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {shuffleWithSeed(s.choices, idx).map((c, i) => (<button key={i} onClick={() => handleChoice(c)} style={{ fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>{c}</button>))}
        </div>
        {feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}
      </div>
    </div>
  );
}

// ============================================
// ROLE PLAY GAME (Main Peranan)
// Try different professions!
// ============================================
export function RolePlayGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const JOBS = [
    { name: lang === 'bm' ? 'Doktor' : 'Doctor', emoji: '👨‍⚕️', task: lang === 'bm' ? 'Periksa pesakit!' : 'Check the patient!', answer: '🩺', choices: ['🩺','🔧','📚'] },
    { name: lang === 'bm' ? 'Bomba' : 'Firefighter', emoji: '🧑‍🚒', task: lang === 'bm' ? 'Padamkan api!' : 'Put out the fire!', answer: '🧯', choices: ['🧯','🔨','📱'] },
    { name: lang === 'bm' ? 'Guru' : 'Teacher', emoji: '👩‍🏫', task: lang === 'bm' ? 'Ajar murid!' : 'Teach students!', answer: '📚', choices: ['📚','🧯','🩺'] },
    { name: lang === 'bm' ? 'Polis' : 'Police', emoji: '👮', task: lang === 'bm' ? 'Jaga keselamatan!' : 'Keep people safe!', answer: '🚔', choices: ['🚔','🧯','📚'] },
    { name: lang === 'bm' ? 'Tukang Masak' : 'Chef', emoji: '👨‍🍳', task: lang === 'bm' ? 'Masak makanan!' : 'Cook food!', answer: '🍳', choices: ['🍳','🩺','🔧'] },
  ];
  const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (c) => { const ok = c === JOBS[idx].answer; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); setScore(score + 1); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); } setTimeout(() => { setFeedback(null); if (idx + 1 < JOBS.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('jobs', 'role-play', f >= 4 ? 3 : f >= 2 ? 2 : 1, f * 20); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/role_play_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pelakon Hebat!' : 'Great Actor!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('jobs')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const j = JOBS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/role_play_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('jobs')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{j.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{JOBS.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={j.emoji} size={80}/></div><div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>{j.task}</div><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(j.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>{c}</button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

// ============================================
// JOB TOOLS GAME (Alat Pekerjaan)
// ============================================
export function JobToolsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const MATCHES = [
    { job: '👨‍⚕️', name: lang === 'bm' ? 'Doktor' : 'Doctor', tool: '🩺', choices: ['🩺','🔨','🎨'] },
    { job: '👩‍🍳', name: lang === 'bm' ? 'Chef' : 'Chef', tool: '🍳', choices: ['🍳','📚','🔧'] },
    { job: '👩‍🎨', name: lang === 'bm' ? 'Pelukis' : 'Artist', tool: '🎨', choices: ['🎨','🩺','🔨'] },
    { job: '👷', name: lang === 'bm' ? 'Pembina' : 'Builder', tool: '🔨', choices: ['🔨','🍳','📚'] },
    { job: '👩‍🏫', name: lang === 'bm' ? 'Guru' : 'Teacher', tool: '📚', choices: ['📚','🎨','🍳'] },
    { job: '👨‍🌾', name: lang === 'bm' ? 'Petani' : 'Farmer', tool: '🌾', choices: ['🌾','🩺','🔨'] },
  ];
  const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (c) => { const ok = c === MATCHES[idx].tool; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); setScore(score + 1); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); } setTimeout(() => { setFeedback(null); if (idx + 1 < MATCHES.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('jobs', 'job-tools', f >= 5 ? 3 : f >= 3 ? 2 : 1, f * 15); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/job_tools_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Bijak Padankan!' : 'Tool Master!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('jobs')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const m = MATCHES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/job_tools_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('jobs')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{lang === 'bm' ? 'Padankan Alat!' : 'Match the Tool!'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{MATCHES.length}</div><div style={{ fontSize: '5rem', margin: '16px 0' }}>{m.job}</div><div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>{m.name}</div><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(m.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>{c}</button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

// ============================================
// VISIT WORKPLACE GAME (Lawat Tempat Kerja)
// ============================================
export function VisitWorkplaceGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const PLACES = [
    { place: '🏥', name: lang === 'bm' ? 'Hospital' : 'Hospital', worker: '👨‍⚕️', fact: lang === 'bm' ? 'Doktor merawat pesakit!' : 'Doctors treat patients!', q: lang === 'bm' ? 'Siapa bekerja di sini?' : 'Who works here?', choices: ['👨‍⚕️','👮','👩‍🍳'] },
    { place: '🏫', name: lang === 'bm' ? 'Sekolah' : 'School', worker: '👩‍🏫', fact: lang === 'bm' ? 'Guru mengajar murid!' : 'Teachers teach students!', q: lang === 'bm' ? 'Siapa bekerja di sini?' : 'Who works here?', choices: ['👩‍🏫','🧑‍🚒','👨‍🌾'] },
    { place: '🚒', name: lang === 'bm' ? 'Balai Bomba' : 'Fire Station', worker: '🧑‍🚒', fact: lang === 'bm' ? 'Bomba padam api!' : 'Firefighters put out fires!', q: lang === 'bm' ? 'Siapa bekerja di sini?' : 'Who works here?', choices: ['🧑‍🚒','👩‍🏫','👨‍⚕️'] },
    { place: '🏬', name: lang === 'bm' ? 'Kedai' : 'Shop', worker: '🧑‍💼', fact: lang === 'bm' ? 'Jurujual menjual barang!' : 'Shopkeepers sell things!', q: lang === 'bm' ? 'Siapa bekerja di sini?' : 'Who works here?', choices: ['🧑‍💼','🧑‍🚒','👨‍⚕️'] },
  ];
  const [idx, setIdx] = useState(0); const [showFact, setShowFact] = useState(true); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (c) => { const ok = c === PLACES[idx].worker; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setScore(score + 1); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } } setFeedback(ok ? 'correct' : 'wrong'); setTimeout(() => { setFeedback(null); setShowFact(true); if (idx + 1 < PLACES.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('jobs', 'visit-workplace', f >= 3 ? 3 : f >= 2 ? 2 : 1, f * 25); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/visit_workplace_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Penjelajah Hebat!' : 'Great Explorer!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('jobs')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const p = PLACES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/visit_workplace_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('jobs')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>{p.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{PLACES.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={p.place} size={80}/></div>{showFact ? (<div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}><p style={{ fontSize: '0.9rem', margin: 0 }}>{p.fact}</p><button onClick={() => setShowFact(false)} style={{ marginTop: 10, padding: '8px 20px', borderRadius: 12, background: '#43A047', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{lang === 'bm' ? 'Kuiz!' : 'Quiz!'}</button></div>) : (<div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}><p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>{p.q}</p><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{p.choices.map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}><GI e={c} size={40}/></button>))}</div>{feedback && <div style={{ marginTop: 10, fontWeight: 700, color: feedback === 'correct' ? '#4CAF50' : '#F44336' }}>{feedback === 'correct' ? '' : ''}</div>}</div>)}</div></div>);
}

// ============================================
// WHO AM I GAME (Siapa Saya?)
// ============================================
export function WhoAmIGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const RIDDLES = [
    { clue: lang === 'bm' ? 'Saya pakai uniform putih, saya tolong orang sakit.' : 'I wear white, I help sick people.', answer: '👨‍⚕️', choices: ['👨‍⚕️','👮','👩‍🍳'] },
    { clue: lang === 'bm' ? 'Saya masak makanan yang sedap!' : 'I cook delicious food!', answer: '👩‍🍳', choices: ['👩‍🍳','👩‍🏫','🧑‍🚒'] },
    { clue: lang === 'bm' ? 'Saya terbang kapal terbang!' : 'I fly airplanes!', answer: '👨‍✈️', choices: ['👨‍✈️','👮','👷'] },
    { clue: lang === 'bm' ? 'Saya jaga keselamatan!' : 'I keep people safe!', answer: '👮', choices: ['👮','👩‍🍳','👨‍⚕️'] },
    { clue: lang === 'bm' ? 'Saya mengajar di sekolah!' : 'I teach at school!', answer: '👩‍🏫', choices: ['👩‍🏫','👨‍✈️','🧑‍🚒'] },
    { clue: lang === 'bm' ? 'Saya padam api!' : 'I put out fires!', answer: '🧑‍🚒', choices: ['🧑‍🚒','👮','👩‍🍳'] },
  ];
  const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (c) => { const ok = c === RIDDLES[idx].answer; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); setScore(score + 1); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); } setTimeout(() => { setFeedback(null); if (idx + 1 < RIDDLES.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('jobs', 'who-am-i', f >= 5 ? 3 : f >= 3 ? 2 : 1, f * 15); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/who_am_i_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Bijak Meneka!' : 'Great Guesser!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('jobs')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const r = RIDDLES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/who_am_i_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('jobs')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>{lang === 'bm' ? 'Siapa Saya?' : 'Who Am I?'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{RIDDLES.length}</div><div style={{ margin: '20px 0' }}></div><div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '0 auto 16px', maxWidth: 300, fontSize: '1rem', fontWeight: 700 }}>{r.clue}</div><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(r.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}><GI e={c} size={40}/></button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

// ============================================
// INSTRUMENTS GAME (Alat Muzik)
// ============================================
export function InstrumentsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const INSTRUMENTS = [
    { name: lang === 'bm' ? 'Gendang' : 'Drum', emoji: '🥁', sound: 'DUM DUM!' },
    { name: lang === 'bm' ? 'Gitar' : 'Guitar', emoji: '🎸', sound: 'JENG JENG!' },
    { name: lang === 'bm' ? 'Piano' : 'Piano', emoji: '🎹', sound: 'TING TING!' },
    { name: lang === 'bm' ? 'Biola' : 'Violin', emoji: '🎻', sound: 'ZIIIING!' },
    { name: lang === 'bm' ? 'Trompet' : 'Trumpet', emoji: '🎺', sound: 'PAA PAA!' },
    { name: lang === 'bm' ? 'Seruling' : 'Flute', emoji: '🪈', sound: 'TUUUT!' },
  ];
  const [idx, setIdx] = useState(0); const [played, setPlayed] = useState(false); const [gameComplete, setGameComplete] = useState(false);
  const playInst = () => { if (soundEnabled) playTapSound(); setPlayed(true); };
  const next = () => { setPlayed(false); if (idx + 1 < INSTRUMENTS.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } completeGame('music', 'instruments', 3, INSTRUMENTS.length * 15); setGameComplete(true); } };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/instruments_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#7B1FA2', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pemuzik Hebat!' : 'Great Musician!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('music')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const inst = INSTRUMENTS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/instruments_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('music')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#7B1FA2' }}>{inst.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{INSTRUMENTS.length}</div><div style={{ textAlign: 'center', margin: '20px 0', cursor: 'pointer' }} onClick={playInst}><GI e={inst.emoji} size={96}/></div>{played && <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#9C27B0', animation: 'bounce 0.5s ease' }}>{inst.sound}</div>}<button onClick={played ? next : playInst} style={{ marginTop: 16, padding: '12px 28px', borderRadius: 16, background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>{played ? (lang === 'bm' ? 'Seterusnya →' : 'Next →') : (lang === 'bm' ? 'Main!' : 'Play!')}</button></div></div>);
}

// ============================================
// FOLLOW THE BEAT GAME (Ikut Rentak)
// ============================================
export function FollowBeatGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const PATTERNS = [
    { pattern: ['👏','👏','🤚'], name: 'clap-clap-stop' },
    { pattern: ['👏','🤚','👏','🤚'], name: 'clap-stop-clap-stop' },
    { pattern: ['👏','👏','👏','🤚','🤚'], name: 'clap-clap-clap-stop-stop' },
    { pattern: ['🤚','👏','🤚','👏','👏'], name: 'stop-clap-stop-clap-clap' },
  ];
  const [patIdx, setPatIdx] = useState(0); const [inputIdx, setInputIdx] = useState(0); const [score, setScore] = useState(0); const [showPattern, setShowPattern] = useState(true); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false); const [currentHighlight, setCurrentHighlight] = useState(-1);
  
  const showDemo = () => {
    setShowPattern(true); let i = 0;
    const interval = setInterval(() => { setCurrentHighlight(i); if (soundEnabled) playTapSound(); i++; if (i >= PATTERNS[patIdx].pattern.length) { clearInterval(interval); setTimeout(() => { setCurrentHighlight(-1); setShowPattern(false); }, 500); } }, 500);
  };
  
  useEffect(() => { showDemo(); }, [patIdx]);
  
  const handleInput = (type) => {
    const p = PATTERNS[patIdx];
    if (type === p.pattern[inputIdx]) {
      if (soundEnabled) playTapSound();
      const newIdx = inputIdx + 1;
      setInputIdx(newIdx);
      if (newIdx === p.pattern.length) {
        if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setScore(score + 1); setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
        setTimeout(() => { setFeedback(null); setInputIdx(0); if (patIdx + 1 < PATTERNS.length) setPatIdx(patIdx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } completeGame('music', 'follow-beat', score + 1 >= 3 ? 3 : 2, (score + 1) * 25); setGameComplete(true); } }, 800);
      }
    } else {
      if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); setInputIdx(0);
      setTimeout(() => setFeedback(null), 800);
    }
  };
  
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/music_room_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Rentak Hebat!' : 'Beat Master!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('music')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  
  const p = PATTERNS[patIdx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/music_room_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('music')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>{lang === 'bm' ? 'Ikut Rentak!' : 'Follow the Beat!'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{patIdx + 1}/{PATTERNS.length}</div><div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0' }}>{p.pattern.map((beat, i) => (<div key={i} style={{ padding: 8, borderRadius: 12, background: i === currentHighlight ? '#FFD93D' : i < inputIdx ? '#E91E63' : 'white', border: '2px solid rgba(0,0,0,0.08)', transform: i === currentHighlight ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.2s' }}><GI e={beat} size={32}/></div>))}</div>{!showPattern && (<div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}><button onClick={() => handleInput('👏')} style={{ padding: 16, borderRadius: 20, background: 'white', border: '2px solid rgba(0,0,0,0.1)', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}><GI e="👏" size={48}/></button><button onClick={() => handleInput('🤚')} style={{ padding: 16, borderRadius: 20, background: 'white', border: '2px solid rgba(0,0,0,0.1)', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}><GI e="🤚" size={48}/></button></div>)}{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

// ============================================
// CHILDREN SONGS GAME (Lagu Kanak-Kanak)
// ============================================
export function ChildrensSongsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const SONGS = [
    { title: lang === 'bm' ? 'Lagu ABC' : 'ABC Song', emoji: '🔤', lyrics: 'A B C D E F G...' },
    { title: lang === 'bm' ? 'Twinkle Star' : 'Twinkle Star', emoji: '⭐', lyrics: 'Twinkle twinkle little star...' },
    { title: lang === 'bm' ? 'Ikan Kecil' : 'Little Fish', emoji: '🐟', lyrics: lang === 'bm' ? 'Ikan kecil ikan kecil...' : 'Little fish, little fish...' },
    { title: lang === 'bm' ? 'Tepuk Amai-Amai' : 'Tepuk Amai-Amai', emoji: '👏', lyrics: lang === 'bm' ? 'Tepuk amai-amai belalang kupu-kupu...' : 'Clap, clap, butterfly...' },
  ];
  const [idx, setIdx] = useState(0); const [singing, setSinging] = useState(false); const [gameComplete, setGameComplete] = useState(false);
  const singAlong = () => { if (soundEnabled) playTapSound(); setSinging(true); setTimeout(() => { setSinging(false); if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } if (idx + 1 < SONGS.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } completeGame('music', 'childrens-songs', 3, SONGS.length * 25); setGameComplete(true); } }, 3000); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/childrens_songs_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pandai Menyanyi!' : 'Song Star!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('music')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const s = SONGS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/childrens_songs_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('music')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17' }}>{s.title}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{SONGS.length}</div><div style={{ textAlign: 'center', margin: '20px 0', animation: singing ? 'bounce 0.4s infinite alternate' : 'none' }}><GI e={s.emoji} size={80}/></div><div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}><p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#555' }}>{s.lyrics}</p></div><button onClick={singAlong} disabled={singing} style={{ marginTop: 12, padding: '14px 32px', borderRadius: 20, background: singing ? '#999' : 'linear-gradient(135deg, #FFD93D, #FFA726)', color: 'white', border: 'none', fontWeight: 800, cursor: singing ? 'default' : 'pointer', fontFamily: 'var(--font-heading)' }}>{singing ? '...' : '🎤'} {lang === 'bm' ? (singing ? 'Menyanyi...' : 'Nyanyi!') : (singing ? 'Singing...' : 'Sing!')}</button></div></div>);
}

// ============================================
// LEARN NOTES GAME (Belajar Nota)
// ============================================
export function LearnNotesGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const NOTES = ['Do','Re','Mi','Fa','Sol','La','Si','Do'];
  const COLORS = ['#FF6B6B','#FF9800','#FFD93D','#6BCB77','#4ECDC4','#42A5F5','#9B72CF','#FF6B6B'];
  const [playedNotes, setPlayedNotes] = useState([]); const [targetSeq, setTargetSeq] = useState([]); const [score, setScore] = useState(0); const [round, setRound] = useState(0); const [gameComplete, setGameComplete] = useState(false); const [feedback, setFeedback] = useState(null);
  const TOTAL_ROUNDS = 15;
  
  useEffect(() => { generateSequence(); }, []);
  const generateSequence = () => { const seq = Array.from({ length: 3 }, () => Math.floor(Math.random() * 8)); setTargetSeq(seq); setPlayedNotes([]); };
  
  const handleNote = (noteIdx) => {
    if (soundEnabled) playTapSound();
    const newPlayed = [...playedNotes, noteIdx];
    setPlayedNotes(newPlayed);
    if (newPlayed.length === targetSeq.length) {
      const correct = newPlayed.every((n, i) => n === targetSeq[i]);
      if (correct) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setScore(score + 1); setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); }
      else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); }
      setTimeout(() => { setFeedback(null); if (round + 1 < TOTAL_ROUNDS) { setRound(round + 1); generateSequence(); } else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = correct ? score + 1 : score; completeGame('music', 'learn-notes', f >= 3 ? 3 : f >= 2 ? 2 : 1, f * 25); setGameComplete(true); } }, 800);
    }
  };
  
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/learn_notes_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pemuzik Hebat!' : 'Music Master!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('music')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/learn_notes_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('music')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{lang === 'bm' ? 'Main nota!' : 'Play the notes!'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{round + 1}/{TOTAL_ROUNDS}</div><div style={{ margin: '16px 0', fontSize: '0.9rem', fontWeight: 700 }}>{lang === 'bm' ? 'Main:' : 'Play:'} {targetSeq.map(n => NOTES[n]).join(' → ')}</div><div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '12px 0' }}>{playedNotes.map((n, i) => <span key={i} style={{ background: COLORS[n], color: 'white', padding: '4px 8px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem' }}>{NOTES[n]}</span>)}</div><div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0' }}>{NOTES.map((note, i) => (<button key={i} onClick={() => handleNote(i)} style={{ width: 38, height: 50, borderRadius: 8, background: COLORS[i], color: 'white', border: 'none', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>{note}</button>))}</div>{feedback && <div style={{ marginTop: 12, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

// ============================================
// WORLD MAP GAME (Peta Dunia)
// ============================================
export function WorldMapGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const COUNTRIES = [
    { flag: '🇲🇾', name: 'Malaysia', fact: lang === 'bm' ? 'Negara kita!' : 'Our country!', q: lang === 'bm' ? 'Bendera mana milik Malaysia?' : 'Which flag is Malaysia?', choices: ['🇲🇾','🇮🇩','🇸🇬'] },
    { flag: '🇯🇵', name: 'Japan', fact: lang === 'bm' ? 'Negara matahari terbit!' : 'Land of the rising sun!', q: lang === 'bm' ? 'Bendera mana milik Jepun?' : 'Which flag is Japan?', choices: ['🇯🇵','🇰🇷','🇨🇳'] },
    { flag: '🇫🇷', name: lang === 'bm' ? 'Perancis' : 'France', fact: lang === 'bm' ? 'Menara Eiffel!' : 'Eiffel Tower!', q: lang === 'bm' ? 'Bendera mana milik Perancis?' : 'Which flag is France?', choices: ['🇫🇷','🇩🇪','🇮🇹'] },
    { flag: '🇧🇷', name: lang === 'bm' ? 'Brazil' : 'Brazil', fact: lang === 'bm' ? 'Negara bola sepak!' : 'Soccer country!', q: lang === 'bm' ? 'Bendera mana milik Brazil?' : 'Which flag is Brazil?', choices: ['🇧🇷','🇦🇷','🇲🇽'] },
  ];
  const [idx, setIdx] = useState(0); const [showFact, setShowFact] = useState(true); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (c) => { const ok = c === COUNTRIES[idx].flag; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setScore(score + 1); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } } setFeedback(ok ? 'correct' : 'wrong'); setTimeout(() => { setFeedback(null); setShowFact(true); if (idx + 1 < COUNTRIES.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('world-explorer', 'world-map', f >= 3 ? 3 : f >= 2 ? 2 : 1, f * 25); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/world_explorer_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#00695C', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Penjelajah Dunia!' : 'World Explorer!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('world-explorer')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const c = COUNTRIES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/world_explorer_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('world-explorer')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{c.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{COUNTRIES.length}</div><div style={{ fontSize: '5rem', margin: '16px 0' }}>{c.flag}</div>{showFact ? (<div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}><p style={{ margin: 0 }}>{c.fact}</p><button onClick={() => setShowFact(false)} style={{ marginTop: 10, padding: '8px 20px', borderRadius: 12, background: '#00897B', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{lang === 'bm' ? 'Kuiz!' : 'Quiz!'}</button></div>) : (<div><p style={{ fontWeight: 700 }}>{c.q}</p><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(c.choices, idx).map((ch, i) => (<button key={i} onClick={() => handle(ch)} style={{ fontSize: '3rem', padding: 12, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}>{ch}</button>))}</div>{feedback && <div style={{ marginTop: 10, fontWeight: 700, color: feedback === 'correct' ? '#4CAF50' : '#F44336' }}>{feedback === 'correct' ? '' : ''}</div>}</div>)}</div></div>);
}

// ============================================
// WORLD HOUSES GAME (Rumah Dunia)
// ============================================
export function WorldHousesGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const HOUSES = [
    { name: lang === 'bm' ? 'Igloo' : 'Igloo', emoji: '🏔️', country: '❄️ Arctic', desc: lang === 'bm' ? 'Rumah ais!' : 'Ice house!', answer: '❄️', choices: ['❄️','🌴','🏜️'] },
    { name: lang === 'bm' ? 'Rumah Kampung' : 'Village House', emoji: '🏡', country: 'Malaysia', desc: lang === 'bm' ? 'Rumah di atas tiang!' : 'House on stilts!', answer: '🇲🇾', choices: ['🇲🇾','🇯🇵','🇫🇷'] },
    { name: lang === 'bm' ? 'Apartmen' : 'Apartment', emoji: '🏢', country: 'Japan', desc: lang === 'bm' ? 'Bangunan tinggi di bandar!' : 'Tall city building!', answer: '🇯🇵', choices: ['🇯🇵','🇲🇾','❄️'] },
  ];
  const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (c) => { const ok = c === HOUSES[idx].answer; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setScore(score + 1); setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); } setTimeout(() => { setFeedback(null); if (idx + 1 < HOUSES.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('world-explorer', 'world-houses', f >= 3 ? 3 : 2, f * 30); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/world_houses_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#00695C', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pakar Rumah!' : 'House Expert!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('world-explorer')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const h = HOUSES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/world_houses_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('world-explorer')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{h.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{HOUSES.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={h.emoji} size={80}/></div><p style={{ fontWeight: 700 }}>{h.desc}</p><p>{lang === 'bm' ? 'Dari mana?' : 'Where is it from?'}</p><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(h.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 12, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}><GI e={c} size={32}/></button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

// ============================================
//  WORLD FESTIVALS GAME (Perayaan Dunia)
// ============================================
export function WorldFestivalsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const FESTIVALS = [
    { name: lang === 'bm' ? 'Hari Raya' : 'Hari Raya', emoji: '🕌', country: '🇲🇾', desc: lang === 'bm' ? 'Perayaan umat Islam!' : 'Muslim celebration!', choices: ['🇲🇾','🇯🇵','🇫🇷'] },
    { name: lang === 'bm' ? 'Tahun Baru Cina' : 'Chinese New Year', emoji: '🧧', country: '🇨🇳', desc: lang === 'bm' ? 'Singa menari!' : 'Lion dance!', choices: ['🇨🇳','🇲🇾','🇧🇷'] },
    { name: 'Diwali', emoji: '🪔', country: '🇮🇳', desc: lang === 'bm' ? 'Perayaan lampu!' : 'Festival of lights!', choices: ['🇮🇳','🇯🇵','🇫🇷'] },
    { name: 'Carnival', emoji: '🎭', country: '🇧🇷', desc: lang === 'bm' ? 'Pesta tarian hebat!' : 'Great dance party!', choices: ['🇧🇷','🇮🇳','🇨🇳'] },
  ];
  const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (c) => { const ok = c === FESTIVALS[idx].country; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setScore(score + 1); setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); } setTimeout(() => { setFeedback(null); if (idx + 1 < FESTIVALS.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('world-explorer', 'world-festivals', f >= 3 ? 3 : f >= 2 ? 2 : 1, f * 25); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/world_festivals_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pakar Perayaan!' : 'Festival Expert!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('world-explorer')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const f = FESTIVALS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/world_festivals_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('world-explorer')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17' }}> {f.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{FESTIVALS.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={f.emoji} size={80}/></div><p style={{ fontWeight: 700 }}>{f.desc}</p><p>{lang === 'bm' ? 'Perayaan dari negara mana?' : 'Which country celebrates this?'}</p><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(f.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 12, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}><GI e={c} size={40}/></button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

// ============================================
// 🌧️ WEATHER GAME (Cuaca)
// ============================================
export function WeatherGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const WEATHER_Q = [
    { weather: '☀️', name: lang === 'bm' ? 'Cerah' : 'Sunny', q: lang === 'bm' ? 'Pakai apa?' : 'What to wear?', answer: '🕶️', choices: ['🕶️','☂️','🧥'] },
    { weather: '🌧️', name: lang === 'bm' ? 'Hujan' : 'Rainy', q: lang === 'bm' ? 'Bawa apa?' : 'What to bring?', answer: '☂️', choices: ['☂️','🕶️','🩱'] },
    { weather: '❄️', name: lang === 'bm' ? 'Sejuk' : 'Cold', q: lang === 'bm' ? 'Pakai apa?' : 'What to wear?', answer: '🧥', choices: ['🧥','🩱','🕶️'] },
    { weather: '🌪️', name: lang === 'bm' ? 'Ribut' : 'Stormy', q: lang === 'bm' ? 'Apa yang patut buat?' : 'What should you do?', answer: '🏠', choices: ['🏠','🏖️','🛝'] },
    { weather: '🌈', name: lang === 'bm' ? 'Pelangi' : 'Rainbow', q: lang === 'bm' ? 'Pelangi muncul selepas...' : 'Rainbow appears after...', answer: '🌧️', choices: ['🌧️','❄️','🌪️'] },
  ];
  const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (c) => { const ok = c === WEATHER_Q[idx].answer; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setScore(score + 1); setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); } setTimeout(() => { setFeedback(null); if (idx + 1 < WEATHER_Q.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('science', 'weather', f >= 4 ? 3 : f >= 2 ? 2 : 1, f * 20); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/science_nature_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pakar Cuaca!' : 'Weather Expert!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('science')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const w = WEATHER_Q[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/science_nature_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('science')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{w.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{WEATHER_Q.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={w.weather} size={80}/></div><div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>{w.q}</div><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(w.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}><GI e={c} size={40}/></button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

// ============================================
// PLANTS GAME (Tumbuhan)
// Grow a plant step by step!
// ============================================
export function PlantsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const STAGES = [
    { stage: lang === 'bm' ? 'Tanam biji benih!' : 'Plant the seed!', emoji: '🌰', action: '🌰' },
    { stage: lang === 'bm' ? 'Beri air!' : 'Water it!', emoji: '💧', action: '💧' },
    { stage: lang === 'bm' ? 'Beri cahaya matahari!' : 'Give sunlight!', emoji: '☀️', action: '☀️' },
    { stage: lang === 'bm' ? 'Tunggul tumbuh!' : 'Watch it grow!', emoji: '🌱', action: '🌱' },
    { stage: lang === 'bm' ? 'Bunga mekar!' : 'Flower blooms!', emoji: '🌸', action: '🌸' },
  ];
  const [stageIdx, setStageIdx] = useState(0); const [gameComplete, setGameComplete] = useState(false);
  const handleAction = () => { if (soundEnabled) playTapSound(); if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setTimeout(() => { if (stageIdx + 1 < STAGES.length) setStageIdx(stageIdx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } completeGame('science', 'plants', 3, STAGES.length * 20); setGameComplete(true); } }, 600); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/plants_garden_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Tukang Kebun Hebat!' : 'Great Gardener!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('science')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const s = STAGES[stageIdx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/plants_garden_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('science')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>{lang === 'bm' ? 'Tanam Pokok!' : 'Grow a Plant!'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{stageIdx + 1}/{STAGES.length}</div><div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '12px 0' }}>{STAGES.map((st, i) => <span key={i} style={{ fontSize: i <= stageIdx ? '1.5rem' : '1rem', opacity: i <= stageIdx ? 1 : 0.3 }}><GI e={st.emoji} size={32}/></span>)}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={s.emoji} size={96}/></div><div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>{s.stage}</div><button onClick={handleAction} style={{ padding: '14px 32px', borderRadius: 20, background: 'linear-gradient(135deg, #66BB6A, #43A047)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>{s.action} {lang === 'bm' ? 'Lakukan!' : 'Do it!'}</button></div></div>);
}

// ============================================
// EXPERIMENTS GAME (Eksperimen - Sink or Float)
// ============================================
export function ExperimentsGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const ITEMS = [
    { item: '🪨', name: lang === 'bm' ? 'Batu' : 'Rock', answer: 'sink' },
    { item: '🪶', name: lang === 'bm' ? 'Bulu' : 'Feather', answer: 'float' },
    { item: '🧱', name: lang === 'bm' ? 'Bata' : 'Brick', answer: 'sink' },
    { item: '🏐', name: lang === 'bm' ? 'Bola' : 'Ball', answer: 'float' },
    { item: '🔑', name: lang === 'bm' ? 'Kunci' : 'Key', answer: 'sink' },
    { item: '🍎', name: lang === 'bm' ? 'Epal' : 'Apple', answer: 'float' },
  ];
  const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (answer) => { const ok = answer === ITEMS[idx].answer; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setScore(score + 1); setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: `${ITEMS[idx].name}: ${ITEMS[idx].answer === 'sink' ? (lang === 'bm' ? 'Tenggelam!' : 'Sinks!') : (lang === 'bm' ? 'Terapung!' : 'Floats!')}` }); } setTimeout(() => { setFeedback(null); if (idx + 1 < ITEMS.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('science', 'experiments', f >= 5 ? 3 : f >= 3 ? 2 : 1, f * 15); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/experiments_lab_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Saintis Hebat!' : 'Great Scientist!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('science')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const item = ITEMS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src={assetPath('/images/game/experiments_lab_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('science')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{lang === 'bm' ? 'Tenggelam atau Terapung?' : 'Sink or Float?'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{ITEMS.length}</div><div style={{ textAlign: 'center', margin: '20px 0' }}><GI e={item.item} size={80}/></div><div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>{item.name}</div><div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}><button onClick={() => handle('sink')} style={{ padding: '14px 24px', borderRadius: 16, background: '#42A5F5', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>⬇️ {lang === 'bm' ? 'Tenggelam' : 'Sink'}</button><button onClick={() => handle('float')} style={{ padding: '14px 24px', borderRadius: 16, background: '#FFD93D', color: '#333', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>⬆️ {lang === 'bm' ? 'Terapung' : 'Float'}</button></div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

// ============================================
// DAY & NIGHT GAME (Siang & Malam)
// ============================================
export function DayNightGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  const ITEMS_DN = [
    { item: '☀️', name: lang === 'bm' ? 'Matahari' : 'Sun', answer: 'day' },
    { item: '🌙', name: lang === 'bm' ? 'Bulan' : 'Moon', answer: 'night' },
    { item: '⭐', name: lang === 'bm' ? 'Bintang' : 'Stars', answer: 'night' },
    { item: '🐓', name: lang === 'bm' ? 'Ayam berkokok' : 'Rooster crows', answer: 'day' },
    { item: '🦉', name: lang === 'bm' ? 'Burung hantu' : 'Owl', answer: 'night' },
    { item: '🏫', name: lang === 'bm' ? 'Pergi sekolah' : 'Go to school', answer: 'day' },
    { item: '😴', name: lang === 'bm' ? 'Tidur' : 'Sleep', answer: 'night' },
    { item: '🌅', name: lang === 'bm' ? 'Matahari terbit' : 'Sunrise', answer: 'day' },
  ];
  const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [feedback, setFeedback] = useState(null); const [gameComplete, setGameComplete] = useState(false);
  const handle = (answer) => { const ok = answer === ITEMS_DN[idx].answer; if (ok) { if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); } setScore(score + 1); setFeedback({ type: 'correct', message: correctFeedback(lang, false) }); } else { if (soundEnabled) { if (lang === 'bm') playBMWrongFeedback(); else playWrongSound(); } setFeedback({ type: 'wrong', message: wrongFeedback(lang, false) }); } setTimeout(() => { setFeedback(null); if (idx + 1 < ITEMS_DN.length) setIdx(idx + 1); else { if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); } const f = ok ? score + 1 : score; completeGame('science', 'day-night', f >= 7 ? 3 : f >= 4 ? 2 : 1, f * 10); setGameComplete(true); } }, 800); };
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src={assetPath('/images/game/day_night_bg.jpg')} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#FFD93D', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{lang === 'bm' ? 'Pakar Siang Malam!' : 'Day & Night Expert!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('science')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const item = ITEMS_DN[idx];
  return (<div className="game-container" style={{ background: `linear-gradient(180deg, ${item.answer === 'day' ? '#87CEEB, #E3F2FD' : '#1A237E, #283593'})` }}><div style={{ padding: 16, textAlign: 'center' }}><button className="icon-btn" onClick={() => goToWorld('science')} style={{ position: 'absolute', left: 16, top: 16, color: item.answer === 'night' ? 'white' : undefined }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: item.answer === 'day' ? '#1565C0' : '#FFD93D' }}>{lang === 'bm' ? 'Siang atau Malam?' : 'Day or Night?'}</h2><div style={{ fontSize: '0.8rem', color: item.answer === 'day' ? '#999' : '#B0BEC5' }}>{idx + 1}/{ITEMS_DN.length}</div><div style={{ textAlign: 'center', margin: '20px 0' }}><GI e={item.item} size={80}/></div><div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: item.answer === 'night' ? 'white' : '#333' }}>{item.name}</div><div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}><button onClick={() => handle('day')} style={{ padding: '14px 24px', borderRadius: 16, position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', color: '#333', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>{lang === 'bm' ? 'Siang' : 'Day'}</button><button onClick={() => handle('night')} style={{ padding: '14px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #3F51B5, #1A237E)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>{lang === 'bm' ? 'Malam' : 'Night'}</button></div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

