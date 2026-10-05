'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
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
// LETTER TREE GAME (Pokok Huruf)
// Pick the correct letter fruit from the tree!
// ============================================
export function LetterTreeGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 8;
  const FRUITS_PER_ROUND = 5;
  const FRUIT_EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍑', '🥝', '🍒', '🍌'];

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetLetter, setTargetLetter] = useState('');
  const [fruits, setFruits] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [shakeTree, setShakeTree] = useState(false);
  const [fruitOffsets, setFruitOffsets] = useState({});
  const animFrameRef = useRef(null);
  const driftDataRef = useRef({});

  // Multi-directional floating animation loop
  useEffect(() => {
    let lastTime = performance.now();
    const drift = driftDataRef.current;

    // Initialise drift vectors for each fruit
    fruits.forEach(f => {
      if (!drift[f.id]) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 8 + Math.random() * 12; // px per second
        drift[f.id] = {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          ox: 0, oy: 0,
        };
      }
    });

    function tick(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const newOffsets = {};
      const BOUND = 30; // max drift px from origin

      fruits.forEach(f => {
        if (f.picked) return;
        const d = drift[f.id];
        if (!d) return;

        d.ox += d.vx * dt;
        d.oy += d.vy * dt;

        // Bounce off invisible boundary
        if (Math.abs(d.ox) > BOUND) { d.vx *= -1; d.ox = Math.sign(d.ox) * BOUND; }
        if (Math.abs(d.oy) > BOUND) { d.vy *= -1; d.oy = Math.sign(d.oy) * BOUND; }

        // Occasional random direction nudge for organic feel
        if (Math.random() < 0.005) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 8 + Math.random() * 12;
          d.vx = Math.cos(angle) * speed;
          d.vy = Math.sin(angle) * speed;
        }

        newOffsets[f.id] = { x: d.ox, y: d.oy };
      });

      setFruitOffsets(prev => ({ ...prev, ...newOffsets }));
      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [fruits]);

  // Reset drift data between rounds
  const generateRound = useCallback((roundNum) => {
    driftDataRef.current = {};
    setFruitOffsets({});
    const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setTargetLetter(target);

    const wrongLetters = LETTERS.filter(l => l !== target)
      .sort(() => Math.random() - 0.5)
      .slice(0, FRUITS_PER_ROUND - 1);
    const allLetters = [target, ...wrongLetters].sort(() => Math.random() - 0.5);

    // Positions arranged in a ring around the tree (avoiding center)
    const positions = [
      { x: 5 + Math.random() * 8, y: 22 + Math.random() * 6 },   // far left top
      { x: 8 + Math.random() * 8, y: 52 + Math.random() * 6 },   // far left bottom
      { x: 30 + Math.random() * 8, y: 12 + Math.random() * 5 },  // center-left top
      { x: 58 + Math.random() * 8, y: 12 + Math.random() * 5 },  // center-right top
      { x: 82 + Math.random() * 8, y: 22 + Math.random() * 6 },  // far right top
      { x: 80 + Math.random() * 8, y: 52 + Math.random() * 6 },  // far right bottom
    ];
    const shuffledPos = positions.sort(() => Math.random() - 0.5);

    const newFruits = allLetters.map((letter, i) => ({
      id: `${roundNum}-${i}`,
      letter,
      isTarget: letter === target,
      emoji: FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
      x: shuffledPos[i % shuffledPos.length].x,
      y: shuffledPos[i % shuffledPos.length].y,
      picked: false,
      wrong: false,
    }));
    setFruits(newFruits);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleFruitTap = (fruit) => {
    if (fruit.picked || feedback?.type === 'correct') return;

    if (fruit.isTarget) {
      setScore(prev => prev + 10);
      setFruits(prev => prev.map(f => f.id === fruit.id ? { ...f, picked: true } : f));
      setShakeTree(true);
      setTimeout(() => setShakeTree(false), 500);
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
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
      setFruits(prev => prev.map(f => f.id === fruit.id ? { ...f, wrong: true } : f));
      setFeedback({ type: 'wrong', message: wrongFeedback(lang, soundEnabled) });
      setTimeout(() => {
        setFruits(prev => prev.map(f => f.id === fruit.id ? { ...f, wrong: false } : f));
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

  const getStars = () => score >= 70 ? 3 : score >= 40 ? 2 : 1;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('abc')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Pokok Huruf' : 'Letter Tree'}
        </span>
        <div className="game-stars">
          {[1,2,3].map(s => <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>)}
        </div>
      </div>

      <div className="game-body" style={{ padding: 0 }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          background: 'linear-gradient(180deg, #87CEEB 0%, #b5e8b5 60%, #228B22 100%)',
          borderRadius: 0, overflow: 'hidden',
        }}>
          {/* Instruction */}
          <div style={{
            position: 'absolute', top: 'var(--space-lg)', left: '50%',
            transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)', padding: 'var(--space-sm) var(--space-xl)',
            borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-lg)',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem',
            whiteSpace: 'nowrap',
          }}>
            {lang === 'bm' ? 'Petik buah huruf' : 'Pick the letter fruit'}{' '}
            <span style={{ color: 'var(--cm-green)', fontSize: '1.8rem', fontWeight: 900 }}>{targetLetter}</span>
          </div>

          {/* Score & Round */}
          <div className="game-score">
            <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#60A5FA" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 3l-6 8 12 11L24 11l-6-8H6z"/></svg></span>
            <span className="score-value">{score}</span>
          </div>
          <div className="round-counter">
            {t('round', lang)} {round}/{TOTAL_ROUNDS}
          </div>

          {/* Beautiful generated tree image */}
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            width: '50%', maxWidth: 320, zIndex: 1,
            animation: shakeTree ? 'bubbleShake 0.5s ease' : 'none',
            filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.1))',
            overflow: 'hidden',
            borderRadius: 24,
          }}>
            <img
              src="/images/game/magic_tree.jpg"
              alt="Magic Tree"
              style={{
                width: '100%', height: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          {/* Floating fruit buttons — multi-directional movement */}
          {fruits.map(fruit => {
            const off = fruitOffsets[fruit.id] || { x: 0, y: 0 };
            const isActive = !fruit.picked && !fruit.wrong;
            return (
              <div
                key={fruit.id}
                onClick={() => handleFruitTap(fruit)}
                style={{
                  position: 'absolute',
                  left: `${fruit.x}%`, top: `${fruit.y}%`,
                  transform: isActive ? `translate(${off.x}px, ${off.y}px)` : undefined,
                  width: 78, height: 78,
                  background: fruit.picked
                    ? 'rgba(107,203,119,0.3)'
                    : 'rgba(255,255,255,0.92)',
                  borderRadius: 'var(--radius-lg)',
                  border: fruit.picked ? '3px solid rgba(107,203,119,0.5)' : '2px solid rgba(255,255,255,0.8)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 2,
                  boxShadow: fruit.picked
                    ? 'none'
                    : '0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
                  cursor: fruit.picked ? 'default' : 'pointer',
                  transition: fruit.wrong ? 'none' : 'box-shadow 0.3s ease, background 0.3s ease, opacity 0.4s ease',
                  animationName: fruit.wrong ? 'bubbleShake' : fruit.picked ? 'bubblePop' : 'none',
                  animationDuration: fruit.wrong ? '0.5s' : fruit.picked ? '0.4s' : '0s',
                  animationTimingFunction: 'ease',
                  animationFillMode: fruit.picked ? 'forwards' : 'none',
                  opacity: fruit.picked ? 0.4 : 1,
                  zIndex: 5,
                  backdropFilter: 'blur(6px)',
                }}
              >
                <GI e={fruit.emoji} size={25}/>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.2rem',
                  color: 'var(--text-primary)',
                }}>{fruit.letter}</span>
              </div>
            );
          })}

          {/* Feedback */}
          {feedback && (
            <div style={{
              position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
              zIndex: 20,
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', padding: '12px 28px', borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.15rem',
              boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
              animationName: 'fadeInUp',
              animationDuration: '0.3s',
              animationTimingFunction: 'ease-out',
            }}>
              {feedback.message}
            </div>
          )}

          {/* Grass */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
            background: 'linear-gradient(0deg, #228B22 0%, #32CD32 50%, transparent 100%)',
            borderRadius: 0,
            zIndex: 0,
          }} />
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-green)"
          onPlayAgain={() => { setRound(1); setScore(0); setGameComplete(false); setConfettiPieces([]); generateRound(1); }}
          onBack={() => goToWorld('abc')}
          confettiPieces={confettiPieces}
        />
      )}
    </div>
  );
}

// ============================================
// BEE & FLOWER GAME (Lebah & Bunga)
// Match uppercase to lowercase letters!
// ============================================
export function BeeFlowerGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 8;
  const FLOWERS_PER_ROUND = 4;
  const FLOWER_EMOJIS = ['🌸', '🌺', '🌻', '🌷', '🌼', '💐', '🏵️', '🌹'];

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetUpper, setTargetUpper] = useState('');
  const [flowers, setFlowers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [beePosition, setBeePosition] = useState({ x: 50, y: 15 });
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [beeFlying, setBeeFlying] = useState(false);

  const generateRound = useCallback((roundNum) => {
    const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setTargetUpper(target);
    setBeePosition({ x: 45 + Math.random() * 10, y: 8 });
    setBeeFlying(false);

    const wrongLetters = LETTERS.filter(l => l !== target)
      .sort(() => Math.random() - 0.5)
      .slice(0, FLOWERS_PER_ROUND - 1);
    const allLetters = [target, ...wrongLetters].sort(() => Math.random() - 0.5);

    const newFlowers = allLetters.map((letter, i) => ({
      id: `${roundNum}-${i}`,
      upperLetter: letter,
      lowerLetter: letter.toLowerCase(),
      isTarget: letter === target,
      emoji: FLOWER_EMOJIS[Math.floor(Math.random() * FLOWER_EMOJIS.length)],
      x: 8 + i * (80 / FLOWERS_PER_ROUND) + Math.random() * 5,
      matched: false,
      wrong: false,
    }));
    setFlowers(newFlowers);
    setFeedback(null);
  }, []);

  useEffect(() => { generateRound(1); }, [generateRound]);

  const handleFlowerTap = (flower) => {
    if (flower.matched || feedback?.type === 'correct') return;

    if (flower.isTarget) {
      // Bee flies to flower!
      setBeeFlying(true);
      setBeePosition({ x: flower.x + 5, y: 55 });
      setScore(prev => prev + 10);
      setFlowers(prev => prev.map(f => f.id === flower.id ? { ...f, matched: true } : f));
      setFeedback({ type: 'correct', message: correctFeedback(lang, soundEnabled) });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          const finalScore = score + 10;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
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

  const getStars = () => score >= 70 ? 3 : score >= 40 ? 2 : 1;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('abc')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Lebah & Bunga' : 'Bee & Flower'}
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
          {/* Full background image */}
          <img src="/images/game/bee_garden_bg.jpg" alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
          }} />
          {/* Instruction */}
          <div style={{
            position: 'absolute', top: 'var(--space-lg)', left: '50%',
            transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)', padding: 'var(--space-sm) var(--space-xl)',
            borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-md)',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem',
            whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.5)',
          }}>
            {lang === 'bm' ? 'Bantu lebah cari huruf kecil' : 'Help bee find lowercase'}{' '}
            <span style={{ color: 'var(--cm-blue)', fontSize: '1.8rem', fontWeight: 900 }}>{targetUpper}</span>
            {' → '}
            <span style={{ color: 'var(--cm-purple)', fontSize: '1.8rem', fontWeight: 900 }}>{targetUpper.toLowerCase()}</span>
          </div>

          {/* Score & Round */}
          <div className="game-score">
            <span className="score-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>
            <span className="score-value">{score}</span>
          </div>
          <div className="round-counter">
            {t('round', lang)} {round}/{TOTAL_ROUNDS}
          </div>

          {/* Bee */}
          <div style={{
            position: 'absolute',
            left: `${beePosition.x}%`, top: `${beePosition.y}%`,
            fontSize: '3rem', zIndex: 15,
            transition: beeFlying ? 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            animation: beeFlying ? 'none' : 'characterBob 2s ease-in-out infinite',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          }}>
          </div>

          {/* Flowers */}
          {flowers.map((flower, idx) => (
            <div
              key={flower.id}
              onClick={() => handleFlowerTap(flower)}
              style={{
                position: 'absolute',
                left: `${flower.x}%`, bottom: '15%',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: flower.matched ? 'default' : 'pointer',
                zIndex: 5,
                animation: flower.wrong ? 'bubbleShake 0.5s ease' : flower.matched ? 'none' : `float ${3 + idx * 0.3}s ease-in-out infinite`,
                opacity: flower.matched ? 0.5 : 1,
                transition: 'opacity 0.5s ease',
              }}
            >
              {/* Flower head */}
              <div style={{
                width: 90, height: 90, borderRadius: 'var(--radius-full)',
                background: flower.matched ? 'rgba(107,203,119,0.4)' : 'rgba(255,255,255,0.9)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: flower.matched ? 'none' : 'var(--shadow-md)',
                border: flower.matched ? '3px solid var(--cm-green)' : '3px solid rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease',
              }}>
                <GI e={flower.emoji} size={28}/>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.3rem',
                  color: flower.matched ? 'var(--cm-green)' : 'var(--cm-purple)',
                }}>
                  {flower.lowerLetter}
                </span>
              </div>
              {/* Stem */}
              <div style={{
                width: 6, height: 40, background: '#228B22',
                borderRadius: 3,
              }} />
            </div>
          ))}

          {/* Feedback */}
          {feedback && (
            <div style={{
              position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
              zIndex: 20,
              background: feedback.type === 'correct'
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)'
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white', padding: '10px 24px', borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem',
              boxShadow: 'var(--shadow-md)',
            }}>
              {feedback.message}
            </div>
          )}

          {/* Grass */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            background: 'linear-gradient(0deg, #228B22 0%, #32CD32 50%, transparent 100%)',
            borderRadius: 0,
          }} />

          {/* Sun */}
          <div style={{
            position: 'absolute', top: 15, right: 20, fontSize: '3rem',
            animation: 'float 6s ease-in-out infinite',
            filter: 'drop-shadow(0 0 20px rgba(255,200,0,0.5))',
          }}><svg width="32" height="32" viewBox="0 0 24 24" fill="#FBBF24" style={{display:"inline-block"}}><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="#FBBF24" strokeWidth="2" fill="none"/></svg></div>
        </div>
      </div>

      {gameComplete && (
        <GameCompleteModal
          lang={lang} stars={getStars()} score={score}
          accentColor="var(--cm-blue)"
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

  const TOTAL_ROUNDS = 8;
  const OBJECT_SETS = [
    { emoji: '🐱', image: '/animals/cat.jpg', nameBm: 'kucing', nameEn: 'cats' },
    { emoji: '🐶', image: '/animals/dog.jpg', nameBm: 'anjing', nameEn: 'dogs' },
    { emoji: '🦋', image: '/animals/butterfly.jpg', nameBm: 'rama-rama', nameEn: 'butterflies' },
    { emoji: '🐠', image: '/animals/fish.jpg', nameBm: 'ikan', nameEn: 'fish' },
    { emoji: '🌺', nameBm: 'bunga', nameEn: 'flowers' },
    { emoji: '⭐', nameBm: 'bintang', nameEn: 'stars' },
    { emoji: '🍎', nameBm: 'epal', nameEn: 'apples' },
    { emoji: '🐸', image: '/animals/frog.jpg', nameBm: 'katak', nameEn: 'frogs' },
    { emoji: '🐣', image: '/animals/rooster.jpg', nameBm: 'anak ayam', nameEn: 'chicks' },
    { emoji: '🐝', image: '/animals/bee.jpg', nameBm: 'lebah', nameEn: 'bees' },
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
          <img src="/images/game/counting_classroom.jpg" alt="" style={{
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

  const TOTAL_ROUNDS = 6;

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
          <img src="/images/game/colour_mixing_lab.jpg" alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.25,
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
    { id: 'cat', emoji: '🐱', image: '/animals/cat.jpg', nameBm: 'Kucing', nameEn: 'Cat', soundBm: 'Meow! Meow!', soundEn: 'Meow! Meow!', bgColor: '#FFF0E5' },
    { id: 'dog', emoji: '🐶', image: '/animals/dog.jpg', nameBm: 'Anjing', nameEn: 'Dog', soundBm: 'Woof! Woof!', soundEn: 'Woof! Woof!', bgColor: '#FFF5E0' },
    { id: 'cow', emoji: '🐮', image: '/animals/cow.jpg', nameBm: 'Lembu', nameEn: 'Cow', soundBm: 'Moo! Moo!', soundEn: 'Moo! Moo!', bgColor: '#E8F5E9' },
    { id: 'duck', emoji: '🦆', image: '/animals/duck.jpg', nameBm: 'Itik', nameEn: 'Duck', soundBm: 'Kwek! Kwek!', soundEn: 'Quack! Quack!', bgColor: '#E3F2FD' },
    { id: 'rooster', emoji: '🐓', image: '/animals/rooster.jpg', nameBm: 'Ayam Jantan', nameEn: 'Rooster', soundBm: 'Kukuruyuk!', soundEn: 'Cock-a-doodle-doo!', bgColor: '#FFF3E0' },
    { id: 'sheep', emoji: '🐑', image: '/animals/sheep.jpg', nameBm: 'Kambing Biri-biri', nameEn: 'Sheep', soundBm: 'Baa! Baa!', soundEn: 'Baa! Baa!', bgColor: '#F3E5F5' },
    { id: 'frog', emoji: '🐸', image: '/animals/frog.jpg', nameBm: 'Katak', nameEn: 'Frog', soundBm: 'Koak! Koak!', soundEn: 'Ribbit! Ribbit!', bgColor: '#E8F5E9' },
    { id: 'lion', emoji: '🦁', image: '/animals/lion.jpg', nameBm: 'Singa', nameEn: 'Lion', soundBm: 'Aum! Aum!', soundEn: 'Roar! Roar!', bgColor: '#FFF8E1' },
    { id: 'elephant', emoji: '🐘', image: '/animals/elephant.jpg', nameBm: 'Gajah', nameEn: 'Elephant', soundBm: 'Prruut!', soundEn: 'Trumpet!', bgColor: '#ECEFF1' },
    { id: 'bird', emoji: '🐦', image: '/animals/bird.jpg', nameBm: 'Burung', nameEn: 'Bird', soundBm: 'Cip! Cip!', soundEn: 'Tweet! Tweet!', bgColor: '#E0F7FA' },
  ];

  const TOTAL_ROUNDS = 8;
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
          <img src="/images/game/safari_jungle_bg.jpg" alt="" style={{
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
          <img src="/images/game/shape_hunt_bg.jpg" alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.2,
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

  const TOTAL_ROUNDS = 8;
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
          <img src="/images/game/block_tower_bg.jpg" alt="" style={{
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
    { emoji: '🐮', image: '/animals/cow.jpg', nameBm: 'Lembu', nameEn: 'Cow', habitat: 'farm' },
    { emoji: '🐔', image: '/animals/rooster.jpg', nameBm: 'Ayam', nameEn: 'Chicken', habitat: 'farm' },
    { emoji: '🐷', image: '/animals/pig.jpg', nameBm: 'Babi', nameEn: 'Pig', habitat: 'farm' },
    { emoji: '🐑', image: '/animals/sheep.jpg', nameBm: 'Kambing', nameEn: 'Sheep', habitat: 'farm' },
    { emoji: '🦁', image: '/animals/lion.jpg', nameBm: 'Singa', nameEn: 'Lion', habitat: 'jungle' },
    { emoji: '🐒', image: '/animals/monkey.jpg', nameBm: 'Monyet', nameEn: 'Monkey', habitat: 'jungle' },
    { emoji: '🐍', image: '/animals/snake.jpg', nameBm: 'Ular', nameEn: 'Snake', habitat: 'jungle' },
    { emoji: '🦜', image: '/animals/bird.jpg', nameBm: 'Burung', nameEn: 'Bird', habitat: 'sky' },
    { emoji: '🐠', image: '/animals/fish.jpg', nameBm: 'Ikan', nameEn: 'Fish', habitat: 'ocean' },
    { emoji: '🐙', image: '/animals/octopus.jpg', nameBm: 'Sotong', nameEn: 'Octopus', habitat: 'ocean' },
    { emoji: '🐢', image: '/animals/turtle.jpg', nameBm: 'Penyu', nameEn: 'Turtle', habitat: 'ocean' },
    { emoji: '🐬', image: '/animals/dolphin.jpg', nameBm: 'Lumba-lumba', nameEn: 'Dolphin', habitat: 'ocean' },
    { emoji: '🦅', image: '/animals/eagle.jpg', nameBm: 'Helang', nameEn: 'Eagle', habitat: 'sky' },
    { emoji: '🦋', image: '/animals/butterfly.jpg', nameBm: 'Rama-rama', nameEn: 'Butterfly', habitat: 'sky' },
    { emoji: '🐝', image: '/animals/bee.jpg', nameBm: 'Lebah', nameEn: 'Bee', habitat: 'sky' },
    { emoji: '🐱', image: '/animals/cat.jpg', nameBm: 'Kucing', nameEn: 'Cat', habitat: 'farm' },
    { emoji: '🐶', image: '/animals/dog.jpg', nameBm: 'Anjing', nameEn: 'Dog', habitat: 'farm' },
    { emoji: '🦆', image: '/animals/duck.jpg', nameBm: 'Itik', nameEn: 'Duck', habitat: 'farm' },
    { emoji: '🐸', image: '/animals/frog.jpg', nameBm: 'Katak', nameEn: 'Frog', habitat: 'jungle' },
    { emoji: '🐘', image: '/animals/elephant.jpg', nameBm: 'Gajah', nameEn: 'Elephant', habitat: 'jungle' },
  ];

  const TOTAL_ROUNDS = 8;

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
          <img src="/images/game/safari_jungle_bg.jpg" alt="" style={{
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

  const TOTAL_ROUNDS = 8;

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
          <img src="/images/game/sock_room_bg.jpg" alt="" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.25,
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
    { emoji: '🚗', image: '/transport/car.jpg', nameBm: 'Kereta', nameEn: 'Car', category: 'land' },
    { emoji: '🚌', image: '/transport/bus.jpg', nameBm: 'Bas', nameEn: 'Bus', category: 'land' },
    { emoji: '🚲', image: '/transport/bicycle.jpg', nameBm: 'Basikal', nameEn: 'Bicycle', category: 'land' },
    { emoji: '🏍️', image: '/transport/motorcycle.jpg', nameBm: 'Motosikal', nameEn: 'Motorcycle', category: 'land' },
    { emoji: '🚂', image: '/transport/train.jpg', nameBm: 'Keretapi', nameEn: 'Train', category: 'land' },
    { emoji: '🚑', image: '/transport/ambulance.jpg', nameBm: 'Ambulans', nameEn: 'Ambulance', category: 'land' },
    { emoji: '✈️', image: '/transport/airplane.jpg', nameBm: 'Kapal Terbang', nameEn: 'Airplane', category: 'air' },
    { emoji: '🚁', image: '/transport/helicopter.jpg', nameBm: 'Helikopter', nameEn: 'Helicopter', category: 'air' },
    { emoji: '🎈', image: '/transport/balloon.jpg', nameBm: 'Belon Udara', nameEn: 'Hot Air Balloon', category: 'air' },
    { emoji: '🚀', image: '/transport/rocket.jpg', nameBm: 'Roket', nameEn: 'Rocket', category: 'air' },
    { emoji: '🚢', image: '/transport/ship.jpg', nameBm: 'Kapal', nameEn: 'Ship', category: 'water' },
    { emoji: '⛵', image: '/transport/sailboat.jpg', nameBm: 'Perahu Layar', nameEn: 'Sailboat', category: 'water' },
    { emoji: '🛶', image: '/transport/kayak.jpg', nameBm: 'Kayak', nameEn: 'Kayak', category: 'water' },
    { emoji: '🚤', image: '/transport/speedboat.jpg', nameBm: 'Bot Laju', nameEn: 'Speedboat', category: 'water' },
  ];

  const TOTAL_ROUNDS = 10;

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
          <img src="/images/game/transport_bg.jpg" alt="" style={{
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
function GameCompleteModal({ lang, stars, score, accentColor, onPlayAgain, onBack, confettiPieces }) {
  return (
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
    </>
  );
}

// ============================================
// MATH MACHINE GAME (Mesin Matematik)
// Addition vending machine — toddler-friendly!
// ============================================
export function MathMachineGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;

  const TOTAL_ROUNDS = 8;
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
      <img src="/images/game/dice_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.2 }} />
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
    { nameBm: 'Kucing', nameEn: 'Cat', image: '/animals/cat.jpg', food: 'fish', foodEmoji: '🐟', foodBm: 'Ikan', foodEn: 'Fish' },
    { nameBm: 'Arnab', nameEn: 'Rabbit', image: '/animals/rabbit.jpg', food: 'carrot', foodEmoji: '🥕', foodBm: 'Lobak', foodEn: 'Carrot' },
    { nameBm: 'Monyet', nameEn: 'Monkey', image: '/animals/monkey.jpg', food: 'banana', foodEmoji: '🍌', foodBm: 'Pisang', foodEn: 'Banana' },
    { nameBm: 'Gajah', nameEn: 'Elephant', image: '/animals/elephant.jpg', food: 'leaves', foodEmoji: '🌿', foodBm: 'Daun', foodEn: 'Leaves' },
    { nameBm: 'Anjing', nameEn: 'Dog', image: '/animals/dog.jpg', food: 'bone', foodEmoji: '🦴', foodBm: 'Tulang', foodEn: 'Bone' },
    { nameBm: 'Burung', nameEn: 'Bird', image: '/animals/bird.jpg', food: 'seeds', foodEmoji: '🌾', foodBm: 'Biji', foodEn: 'Seeds' },
    { nameBm: 'Panda', nameEn: 'Panda', image: '/animals/panda.jpg', food: 'bamboo', foodEmoji: '🎋', foodBm: 'Buluh', foodEn: 'Bamboo' },
    { nameBm: 'Singa', nameEn: 'Lion', image: '/animals/lion.jpg', food: 'meat', foodEmoji: '🥩', foodBm: 'Daging', foodEn: 'Meat' },
  ];

  const TOTAL_ROUNDS = 6;
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
      <img src="/images/game/safari_jungle_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.2 }} />
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
      <img src="/images/game/drawing_studio_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.2 }} />
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

  const TOTAL_ROUNDS = 8;
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
      <img src="/images/game/grocery_store_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.2 }} />
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
      <img src="/images/game/road_scene_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.2 }} />
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
      <img src="/images/game/grocery_store_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/garden_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/kitchen_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/kitchen_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/kitchen_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
  
  const TRACE_LETTERS = ['A','B','C','D','E','F','G','H'];
  const [letterIdx, setLetterIdx] = useState(0);
  const [dotsTapped, setDotsTapped] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const DOTS_PER_LETTER = 5;
  
  const handleDotTap = (dotIdx) => {
    if (dotIdx === dotsTapped) {
      if (soundEnabled) playTapSound();
      const newDots = dotsTapped + 1;
      setDotsTapped(newDots);
      
      if (newDots === DOTS_PER_LETTER) {
        if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
        setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
        const newScore = score + 1;
        setScore(newScore);
        
        setTimeout(() => {
          setFeedback(null);
          if (letterIdx + 1 < TRACE_LETTERS.length) {
            setLetterIdx(letterIdx + 1);
            setDotsTapped(0);
          } else {
            if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
            const stars = newScore >= 7 ? 3 : newScore >= 5 ? 2 : 1;
            completeGame('abc', 'letter-trail', stars, newScore * 10);
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
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>
          {lang === 'bm' ? 'Huruf kamu cantik!' : 'Beautiful letters!'}
        </h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('abc')}>
          {lang === 'bm' ? '← Kembali' : '← Back'}
        </button>
      </div>
    );
  }
  
  const letter = TRACE_LETTERS[letterIdx];
  // Generate dot positions in a letter-like pattern
  const dotPositions = Array.from({ length: DOTS_PER_LETTER }, (_, i) => ({
    left: 30 + (i % 3) * 25 + (Math.sin(i) * 10),
    top: 20 + Math.floor(i / 2) * 20 + (Math.cos(i) * 5),
  }));
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src="/images/game/letter_trail_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('abc')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>
          {lang === 'bm' ? `Jejak huruf ${letter}!` : `Trace letter ${letter}!`}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{letterIdx + 1}/{TRACE_LETTERS.length}</div>
        
        {/* Trace canvas */}
        <div style={{
          margin: '20px auto', width: 250, height: 250,
          background: 'white', borderRadius: 24,
          position: 'relative', boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Big ghost letter */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '8rem', color: 'rgba(74,144,217,0.12)',
            fontFamily: 'var(--font-heading)', fontWeight: 900,
          }}>{letter}</div>
          
          {/* Dots to tap */}
          {dotPositions.map((pos, i) => (
            <button key={i} onClick={() => handleDotTap(i)} style={{
              position: 'absolute', left: `${pos.left}%`, top: `${pos.top}%`,
              width: i < dotsTapped ? 20 : 28, height: i < dotsTapped ? 20 : 28,
              borderRadius: '50%',
              background: i < dotsTapped ? '#4A90D9' : i === dotsTapped ? '#FFD93D' : '#E0E0E0',
              border: i === dotsTapped ? '3px solid #FF9800' : '2px solid rgba(0,0,0,0.1)',
              cursor: i === dotsTapped ? 'pointer' : 'default',
              transform: 'translate(-50%, -50%)',
              transition: 'all 0.2s ease',
              fontSize: '0.7rem', color: 'white', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: i === dotsTapped ? '0 0 12px rgba(255,152,0,0.5)' : 'none',
            }}>
              {i < dotsTapped ? '✓' : i + 1}
            </button>
          ))}
        </div>
        
        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: 8 }}>
          {lang === 'bm' ? `Ketik titik ${dotsTapped + 1}!` : `Tap dot ${dotsTapped + 1}!`}
        </div>
        
        {feedback && (
          <div style={{
            marginTop: 12, padding: '8px 16px', borderRadius: 12,
            background: '#6BCB77', color: 'white', fontWeight: 700,
            display: 'inline-block',
          }}><CheckIcon size={14} /> {feedback.message}</div>
        )}
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
  
  const WORDS = [
    { word: 'BUKU', syllables: ['BU','KU'], wrong: ['MA','TI','LA'] },
    { word: 'MAMA', syllables: ['MA','MA'], wrong: ['BU','KU','SI'] },
    { word: 'BOLA', syllables: ['BO','LA'], wrong: ['KE','RI','TA'] },
    { word: 'KUDA', syllables: ['KU','DA'], wrong: ['PI','SA','NG'] },
    { word: 'SUSU', syllables: ['SU','SU'], wrong: ['BA','JU','TE'] },
    { word: 'TOPI', syllables: ['TO','PI'], wrong: ['RU','MA','HI'] },
  ];
  
  const [wordIdx, setWordIdx] = useState(0);
  const [built, setBuilt] = useState([]);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  const setupWord = useCallback((idx) => {
    const w = WORDS[idx];
    const allSyllables = [...w.syllables, ...w.wrong.slice(0, 3)].sort(() => Math.random() - 0.5);
    setOptions(allSyllables);
    setBuilt([]);
  }, []);
  
  useEffect(() => { setupWord(0); }, []);
  
  const handlePick = (syllable) => {
    const w = WORDS[wordIdx];
    const nextIdx = built.length;
    
    if (nextIdx < w.syllables.length && syllable === w.syllables[nextIdx]) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      const newBuilt = [...built, syllable];
      setBuilt(newBuilt);
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      
      if (newBuilt.length === w.syllables.length) {
        const newScore = score + 1;
        setScore(newScore);
        setTimeout(() => {
          setFeedback(null);
          if (wordIdx + 1 < WORDS.length) {
            setWordIdx(wordIdx + 1);
            setupWord(wordIdx + 1);
          } else {
            if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
            const stars = newScore >= 5 ? 3 : newScore >= 3 ? 2 : 1;
            completeGame('abc', 'syllable-factory', stars, newScore * 15);
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
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#4527A0' }}>
          {lang === 'bm' ? 'Bijak Membina Perkataan!' : 'Word Building Master!'}
        </h1>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('abc')}>
          {lang === 'bm' ? '← Kembali' : '← Back'}
        </button>
      </div>
    );
  }
  
  const w = WORDS[wordIdx];
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src="/images/game/letter_trail_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('abc')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#4527A0' }}>
          {lang === 'bm' ? 'Bina Perkataan!' : 'Build the Word!'}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{wordIdx + 1}/{WORDS.length}</div>
        
        {/* Target word display */}
        <div style={{
          margin: '16px auto', display: 'flex', gap: 8, justifyContent: 'center',
        }}>
          {w.syllables.map((syl, i) => (
            <div key={i} style={{
              width: 70, height: 50, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
              background: i < built.length ? 'linear-gradient(135deg, #6BCB77, #48C9B0)' : 'rgba(255,255,255,0.5)',
              border: i < built.length ? '2px solid #4CAF50' : '2px dashed #9E9E9E',
              color: i < built.length ? 'white' : '#BBB',
            }}>
              {i < built.length ? built[i] : '?'}
            </div>
          ))}
        </div>
        
        {/* Conveyor belt (options) */}
        <div style={{
          background: 'rgba(0,0,0,0.05)', borderRadius: 16, padding: 16,
          margin: '16px auto', maxWidth: 350,
        }}>
          <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 8 }}>
            {lang === 'bm' ? 'Pilih suku kata yang betul:' : 'Pick the correct syllable:'}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {options.map((syl, i) => (
              <button key={i} onClick={() => handlePick(syl)} style={{
                padding: '10px 20px', borderRadius: 14,
                background: 'white', border: '2px solid rgba(0,0,0,0.1)',
                fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)',
                cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.15s ease',
              }}>{syl}</button>
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
// LETTER PUZZLE GAME (Puzzle Huruf)
// Fill in the missing letter in a word!
// ============================================
export function LetterPuzzleGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const PUZZLES = [
    { word: 'BUKU', missing: 1, hint: '📖', choices: ['U','A','I','O'] },
    { word: 'MAMA', missing: 0, hint: '👩', choices: ['M','B','K','S'] },
    { word: 'KUDA', missing: 2, hint: '🐴', choices: ['D','B','G','P'] },
    { word: 'BOLA', missing: 3, hint: '⚽', choices: ['A','U','E','I'] },
    { word: 'NASI', missing: 0, hint: '🍚', choices: ['N','R','T','L'] },
    { word: 'IKAN', missing: 2, hint: '🐟', choices: ['A','U','E','O'] },
    { word: 'KUIH', missing: 3, hint: '🍰', choices: ['H','N','K','S'] },
    { word: 'SAPI', missing: 1, hint: '🐄', choices: ['A','U','I','E'] },
  ];
  
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [revealed, setRevealed] = useState(false);
  
  const handleChoice = (letter) => {
    if (revealed) return;
    const puzzle = PUZZLES[puzzleIdx];
    const correct = letter === puzzle.word[puzzle.missing];
    
    if (correct) {
      if (soundEnabled) { if (lang === 'bm') playBMCorrectFeedback(); else playCorrectSound(); }
      setFeedback({ type: 'correct', message: correctFeedback(lang, false) });
      setScore(score + 1);
      setRevealed(true);
      
      setTimeout(() => {
        setFeedback(null);
        setRevealed(false);
        if (puzzleIdx + 1 < PUZZLES.length) {
          setPuzzleIdx(puzzleIdx + 1);
        } else {
          if (soundEnabled) { if (lang === 'bm') playBMCelebration(); else playCelebrationSound(); }
          const stars = score + 1 >= 7 ? 3 : score + 1 >= 4 ? 2 : 1;
          completeGame('abc', 'letter-puzzle', stars, (score + 1) * 10);
          setGameComplete(true);
        }
      }, 1000);
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
        <h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>
          {lang === 'bm' ? 'Bijak Mengeja!' : 'Spelling Star!'}
        </h1>
        <p>{score}/{PUZZLES.length} {lang === 'bm' ? 'betul' : 'correct'}</p>
        <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div>
        <button className="btn-premium" onClick={() => goToWorld('abc')}>
          {lang === 'bm' ? '← Kembali' : '← Back'}
        </button>
      </div>
    );
  }
  
  const puzzle = PUZZLES[puzzleIdx];
  
  return (
    <div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <img src="/images/game/letter_trail_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
      <div style={{ padding: 16, textAlign: 'center' }}>
        <button className="icon-btn" onClick={() => goToWorld('abc')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>
          {lang === 'bm' ? 'Huruf Mana Yang Hilang?' : 'Which Letter is Missing?'}
        </h2>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>{puzzleIdx + 1}/{PUZZLES.length}</div>
        
        {/* Hint */}
        <div style={{ fontSize: '3rem', margin: '12px 0' }}>{puzzle.hint}</div>
        
        {/* Word with missing letter */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
          {puzzle.word.split('').map((char, i) => (
            <div key={i} style={{
              width: 55, height: 60, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
              background: i === puzzle.missing
                ? (revealed ? 'linear-gradient(135deg, #6BCB77, #48C9B0)' : 'linear-gradient(135deg, #FFD93D, #FFA726)')
                : 'white',
              color: i === puzzle.missing ? (revealed ? 'white' : '#FF9800') : '#333',
              border: i === puzzle.missing ? '3px solid #FF9800' : '2px solid #E0E0E0',
              boxShadow: i === puzzle.missing ? '0 4px 12px rgba(255,152,0,0.3)' : 'var(--shadow-sm)',
            }}>
              {i === puzzle.missing ? (revealed ? char : '?') : char}
            </div>
          ))}
        </div>
        
        {/* Letter choices */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          {shuffleWithSeed(puzzle.choices, puzzleIdx).map((letter, i) => (
            <button key={i} onClick={() => handleChoice(letter)} style={{
              width: 55, height: 55, borderRadius: 14,
              fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
              background: 'white', border: '2px solid rgba(0,0,0,0.1)',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.15s ease',
            }}>{letter}</button>
          ))}
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
      <img src="/images/game/dice_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
  const TOTAL_ROUNDS = 8;
  
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
      <img src="/images/game/block_tower_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/dice_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
  const TOTAL_ROUNDS = 8;
  
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
      <img src="/images/game/dice_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/drawing_studio_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/sock_room_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/sock_room_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/transport_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/transport_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/safari_jungle_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/safari_jungle_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/safari_jungle_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/music_room_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/music_room_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/body_parts_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/body_parts_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/healthy_habits_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/doctor_clinic_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/body_parts_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/drawing_studio_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/drawing_studio_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/drawing_studio_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
      <img src="/images/game/block_tower_bg.jpg" alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, opacity: 0.2, pointerEvents: "none" }} />
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/workplace_town_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pelakon Hebat!' : 'Great Actor!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('jobs')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const j = JOBS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/workplace_town_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('jobs')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{j.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{JOBS.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={j.emoji} size={80}/></div><div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>{j.task}</div><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(j.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>{c}</button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/workplace_town_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#E65100', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Bijak Padankan!' : 'Tool Master!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('jobs')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const m = MATCHES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/workplace_town_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('jobs')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#E65100' }}>{lang === 'bm' ? 'Padankan Alat!' : 'Match the Tool!'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{MATCHES.length}</div><div style={{ fontSize: '5rem', margin: '16px 0' }}>{m.job}</div><div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>{m.name}</div><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(m.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ fontSize: '2.5rem', padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>{c}</button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/workplace_town_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Penjelajah Hebat!' : 'Great Explorer!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('jobs')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const p = PLACES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/workplace_town_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('jobs')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>{p.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{PLACES.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={p.place} size={80}/></div>{showFact ? (<div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}><p style={{ fontSize: '0.9rem', margin: 0 }}>{p.fact}</p><button onClick={() => setShowFact(false)} style={{ marginTop: 10, padding: '8px 20px', borderRadius: 12, background: '#43A047', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{lang === 'bm' ? 'Kuiz!' : 'Quiz!'}</button></div>) : (<div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}><p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>{p.q}</p><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{p.choices.map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}><GI e={c} size={40}/></button>))}</div>{feedback && <div style={{ marginTop: 10, fontWeight: 700, color: feedback === 'correct' ? '#4CAF50' : '#F44336' }}>{feedback === 'correct' ? '' : ''}</div>}</div>)}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/workplace_town_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Bijak Meneka!' : 'Great Guesser!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('jobs')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const r = RIDDLES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/workplace_town_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('jobs')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>{lang === 'bm' ? 'Siapa Saya?' : 'Who Am I?'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{RIDDLES.length}</div><div style={{ margin: '20px 0' }}></div><div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '0 auto 16px', maxWidth: 300, fontSize: '1rem', fontWeight: 700 }}>{r.clue}</div><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(r.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}><GI e={c} size={40}/></button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/music_room_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#7B1FA2', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pemuzik Hebat!' : 'Great Musician!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('music')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const inst = INSTRUMENTS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/music_room_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('music')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#7B1FA2' }}>{inst.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{INSTRUMENTS.length}</div><div style={{ textAlign: 'center', margin: '20px 0', cursor: 'pointer' }} onClick={playInst}><GI e={inst.emoji} size={96}/></div>{played && <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#9C27B0', animation: 'bounce 0.5s ease' }}>{inst.sound}</div>}<button onClick={played ? next : playInst} style={{ marginTop: 16, padding: '12px 28px', borderRadius: 16, background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>{played ? (lang === 'bm' ? 'Seterusnya →' : 'Next →') : (lang === 'bm' ? 'Main!' : 'Play!')}</button></div></div>);
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
  
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/music_room_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Rentak Hebat!' : 'Beat Master!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('music')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  
  const p = PATTERNS[patIdx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/music_room_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('music')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#AD1457' }}>{lang === 'bm' ? 'Ikut Rentak!' : 'Follow the Beat!'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{patIdx + 1}/{PATTERNS.length}</div><div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0' }}>{p.pattern.map((beat, i) => (<div key={i} style={{ padding: 8, borderRadius: 12, background: i === currentHighlight ? '#FFD93D' : i < inputIdx ? '#E91E63' : 'white', border: '2px solid rgba(0,0,0,0.08)', transform: i === currentHighlight ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.2s' }}><GI e={beat} size={32}/></div>))}</div>{!showPattern && (<div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}><button onClick={() => handleInput('👏')} style={{ padding: 16, borderRadius: 20, background: 'white', border: '2px solid rgba(0,0,0,0.1)', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}><GI e="👏" size={48}/></button><button onClick={() => handleInput('🤚')} style={{ padding: 16, borderRadius: 20, background: 'white', border: '2px solid rgba(0,0,0,0.1)', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}><GI e="🤚" size={48}/></button></div>)}{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/music_room_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pandai Menyanyi!' : 'Song Star!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('music')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const s = SONGS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/music_room_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('music')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17' }}>{s.title}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{SONGS.length}</div><div style={{ textAlign: 'center', margin: '20px 0', animation: singing ? 'bounce 0.4s infinite alternate' : 'none' }}><GI e={s.emoji} size={80}/></div><div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}><p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#555' }}>{s.lyrics}</p></div><button onClick={singAlong} disabled={singing} style={{ marginTop: 12, padding: '14px 32px', borderRadius: 20, background: singing ? '#999' : 'linear-gradient(135deg, #FFD93D, #FFA726)', color: 'white', border: 'none', fontWeight: 800, cursor: singing ? 'default' : 'pointer', fontFamily: 'var(--font-heading)' }}>{singing ? '...' : '🎤'} {lang === 'bm' ? (singing ? 'Menyanyi...' : 'Nyanyi!') : (singing ? 'Singing...' : 'Sing!')}</button></div></div>);
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
  const TOTAL_ROUNDS = 4;
  
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
  
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/music_room_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pemuzik Hebat!' : 'Music Master!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('music')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/music_room_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('music')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{lang === 'bm' ? 'Main nota!' : 'Play the notes!'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{round + 1}/{TOTAL_ROUNDS}</div><div style={{ margin: '16px 0', fontSize: '0.9rem', fontWeight: 700 }}>{lang === 'bm' ? 'Main:' : 'Play:'} {targetSeq.map(n => NOTES[n]).join(' → ')}</div><div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '12px 0' }}>{playedNotes.map((n, i) => <span key={i} style={{ background: COLORS[n], color: 'white', padding: '4px 8px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem' }}>{NOTES[n]}</span>)}</div><div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0' }}>{NOTES.map((note, i) => (<button key={i} onClick={() => handleNote(i)} style={{ width: 38, height: 50, borderRadius: 8, background: COLORS[i], color: 'white', border: 'none', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>{note}</button>))}</div>{feedback && <div style={{ marginTop: 12, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/world_explorer_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#00695C', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Penjelajah Dunia!' : 'World Explorer!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('world-explorer')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const c = COUNTRIES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/world_explorer_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('world-explorer')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{c.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{COUNTRIES.length}</div><div style={{ fontSize: '5rem', margin: '16px 0' }}>{c.flag}</div>{showFact ? (<div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 16, margin: '12px auto', maxWidth: 300 }}><p style={{ margin: 0 }}>{c.fact}</p><button onClick={() => setShowFact(false)} style={{ marginTop: 10, padding: '8px 20px', borderRadius: 12, background: '#00897B', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>{lang === 'bm' ? 'Kuiz!' : 'Quiz!'}</button></div>) : (<div><p style={{ fontWeight: 700 }}>{c.q}</p><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(c.choices, idx).map((ch, i) => (<button key={i} onClick={() => handle(ch)} style={{ fontSize: '3rem', padding: 12, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}>{ch}</button>))}</div>{feedback && <div style={{ marginTop: 10, fontWeight: 700, color: feedback === 'correct' ? '#4CAF50' : '#F44336' }}>{feedback === 'correct' ? '' : ''}</div>}</div>)}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/world_explorer_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#00695C', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pakar Rumah!' : 'House Expert!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('world-explorer')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const h = HOUSES[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/world_explorer_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('world-explorer')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#00695C' }}>{h.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{HOUSES.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={h.emoji} size={80}/></div><p style={{ fontWeight: 700 }}>{h.desc}</p><p>{lang === 'bm' ? 'Dari mana?' : 'Where is it from?'}</p><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(h.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 12, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}><GI e={c} size={32}/></button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/world_explorer_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pakar Perayaan!' : 'Festival Expert!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('world-explorer')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const f = FESTIVALS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/world_explorer_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('world-explorer')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#F57F17' }}> {f.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{FESTIVALS.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={f.emoji} size={80}/></div><p style={{ fontWeight: 700 }}>{f.desc}</p><p>{lang === 'bm' ? 'Perayaan dari negara mana?' : 'Which country celebrates this?'}</p><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(f.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 12, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer' }}><GI e={c} size={40}/></button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/science_nature_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Pakar Cuaca!' : 'Weather Expert!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('science')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const w = WEATHER_Q[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/science_nature_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('science')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{w.name}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{WEATHER_Q.length}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={w.weather} size={80}/></div><div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>{w.q}</div><div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>{shuffleWithSeed(w.choices, idx).map((c, i) => (<button key={i} onClick={() => handle(c)} style={{ padding: 14, borderRadius: 18, background: 'white', border: '2px solid rgba(0,0,0,0.08)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}><GI e={c} size={40}/></button>))}</div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/science_nature_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Tukang Kebun Hebat!' : 'Great Gardener!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('science')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const s = STAGES[stageIdx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/science_nature_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('science')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>{lang === 'bm' ? 'Tanam Pokok!' : 'Grow a Plant!'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{stageIdx + 1}/{STAGES.length}</div><div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '12px 0' }}>{STAGES.map((st, i) => <span key={i} style={{ fontSize: i <= stageIdx ? '1.5rem' : '1rem', opacity: i <= stageIdx ? 1 : 0.3 }}><GI e={st.emoji} size={32}/></span>)}</div><div style={{ textAlign: 'center', margin: '16px 0' }}><GI e={s.emoji} size={96}/></div><div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>{s.stage}</div><button onClick={handleAction} style={{ padding: '14px 32px', borderRadius: 20, background: 'linear-gradient(135deg, #66BB6A, #43A047)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>{s.action} {lang === 'bm' ? 'Lakukan!' : 'Do it!'}</button></div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/science_nature_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0', textShadow: '0 2px 8px rgba(255,255,255,0.8)' }}>{lang === 'bm' ? 'Saintis Hebat!' : 'Great Scientist!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('science')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const item = ITEMS[idx];
  return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}><img src="/images/game/science_nature_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ padding: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}><button className="icon-btn" onClick={() => goToWorld('science')} style={{ position: 'absolute', left: 16, top: 16 }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: '#1565C0' }}>{lang === 'bm' ? 'Tenggelam atau Terapung?' : 'Sink or Float?'}</h2><div style={{ fontSize: '0.8rem', color: '#999' }}>{idx + 1}/{ITEMS.length}</div><div style={{ textAlign: 'center', margin: '20px 0' }}><GI e={item.item} size={80}/></div><div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>{item.name}</div><div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}><button onClick={() => handle('sink')} style={{ padding: '14px 24px', borderRadius: 16, background: '#42A5F5', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>⬇️ {lang === 'bm' ? 'Tenggelam' : 'Sink'}</button><button onClick={() => handle('float')} style={{ padding: '14px 24px', borderRadius: 16, background: '#FFD93D', color: '#333', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>⬆️ {lang === 'bm' ? 'Terapung' : 'Float'}</button></div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
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
  if (gameComplete) { return (<div className="game-container" style={{ position: 'relative', overflow: 'hidden', background: 'transparent', textAlign: 'center', padding: 40 }}><img src="/images/game/science_nature_bg.jpg" alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} /><div style={{ position: 'relative', zIndex: 1 }}><div style={{ marginBottom: 16 }}><TrophyIcon size={48} /></div><h1 style={{ fontFamily: 'var(--font-heading)', color: '#FFD93D', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{lang === 'bm' ? 'Pakar Siang Malam!' : 'Day & Night Expert!'}</h1><div style={{ margin: "16px 0", display: "flex", justifyContent: "center", gap: 4 }}><StarIcon size={28} /><StarIcon size={28} /><StarIcon size={28} /></div><button className="btn-premium" onClick={() => goToWorld('science')}>{lang === 'bm' ? '← Kembali' : '← Back'}</button></div></div>); }
  const item = ITEMS_DN[idx];
  return (<div className="game-container" style={{ background: `linear-gradient(180deg, ${item.answer === 'day' ? '#87CEEB, #E3F2FD' : '#1A237E, #283593'})` }}><div style={{ padding: 16, textAlign: 'center' }}><button className="icon-btn" onClick={() => goToWorld('science')} style={{ position: 'absolute', left: 16, top: 16, color: item.answer === 'night' ? 'white' : undefined }}>←</button><h2 style={{ fontFamily: 'var(--font-heading)', color: item.answer === 'day' ? '#1565C0' : '#FFD93D' }}>{lang === 'bm' ? 'Siang atau Malam?' : 'Day or Night?'}</h2><div style={{ fontSize: '0.8rem', color: item.answer === 'day' ? '#999' : '#B0BEC5' }}>{idx + 1}/{ITEMS_DN.length}</div><div style={{ textAlign: 'center', margin: '20px 0' }}><GI e={item.item} size={80}/></div><div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: item.answer === 'night' ? 'white' : '#333' }}>{item.name}</div><div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}><button onClick={() => handle('day')} style={{ padding: '14px 24px', borderRadius: 16, position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.9))', color: '#333', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>{lang === 'bm' ? 'Siang' : 'Day'}</button><button onClick={() => handle('night')} style={{ padding: '14px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #3F51B5, #1A237E)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>{lang === 'bm' ? 'Malam' : 'Night'}</button></div>{feedback && <div style={{ marginTop: 14, padding: '8px 16px', borderRadius: 12, background: feedback.type === 'correct' ? '#6BCB77' : '#FF6B6B', color: 'white', fontWeight: 700, display: 'inline-block' }}>{feedback.type === 'correct' ? '' : ''} {feedback.message}</div>}</div></div>);
}

