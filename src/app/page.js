'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { WORLDS, GUIDES, LETTERS, BUBBLE_COLORS, PACKAGES, MINI_WORLDS, COMPLETE_ONLY_WORLDS, MINI_GAME_COUNT, COMPLETE_GAME_COUNT, COMPLETE_ONLY_GAME_COUNT } from '@/data/gameData';
import { t, getRandomEncouragement, getRandomWrongResponse, getGreeting } from '@/data/translations';
import { LetterTreeGame, BeeFlowerGame, CountObjectsGame, ColourMixingGame, AnimalSoundsGame, ShapeHuntGame, BlockTowerGame, AnimalHomesGame, MatchColourGame, SortTransportGame, MathMachineGame, AnimalFoodGame, FreeDrawGame, SubtractionShopGame, RoadSafetyGame, GroceryStoreGame, OurGardenGame, LittleChefGame, HealthyOrNotGame, FruitOrVegGame, LetterTrailGame, SyllableFactoryGame, LetterPuzzleGame, NumberTraceGame, BiggerSmallerGame, PatternsGame, MagicDiceGame, MagicColouringGame, SockPairsGame, ColourHunterGame, BuildVehicleGame, WorldVehiclesGame, AnimalPuzzleGame, AnimalEncyclopediaGame, MimicAnimalGame, AbcSongGame, LetterStoriesGame, LabelBodyGame, MoveTogetherGame, HealthyHabitsGame, LittleDoctorGame, BodySongGame, MagicTangramGame, DrawShapesGame, BuildPicturesGame, ThreeDShapesGame, RolePlayGame, JobToolsGame, VisitWorkplaceGame, WhoAmIGame, InstrumentsGame, FollowBeatGame, ChildrensSongsGame, LearnNotesGame, WorldMapGame, WorldHousesGame, WorldFestivalsGame, WeatherGame, PlantsGame, ExperimentsGame, DayNightGame } from '@/components/Games';
import { initAudio, playCorrectSound, playWrongSound, playCelebrationSound, playTapSound, playNavigateSound } from '@/utils/audio';
import { GameIcon, WorldIcon, StarRating, GameThumbnail, AchievementBadge } from '@/components/GameIcons';
import { StarIcon, LockIcon, GearIcon, SparkleIcon, TrophyIcon, GamepadIcon, RefreshIcon, ChartIcon, CheckIcon, CloseIcon, BackspaceIcon, SeedlingIcon, CrownIcon, GradCapIcon, CloudIcon, DiamondIcon, FamilyIcon, PencilIcon, LightbulbIcon, BubbleIcon, FlagMY, FlagEN } from '@/components/Icons';

// ============================================
// CelikMinda Toddlers — Main App (Premium v3)
// ============================================

export default function Home() {
  const store = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showParentDash, setShowParentDash] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Pre-bake all audio during splash screen
    const audioTimer = setTimeout(() => initAudio(), 500);
    const splashTimer = setTimeout(() => setShowSplash(false), 2800);
    return () => { clearTimeout(audioTimer); clearTimeout(splashTimer); };
  }, []);

  if (!mounted) return null;

  if (showSplash) return <SplashScreen />;

  // Parent Dashboard (PIN protected)
  if (showParentDash) {
    if (!pinVerified) {
      return <PinLockScreen onSuccess={() => setPinVerified(true)} onClose={() => setShowParentDash(false)} />;
    }
    return <ParentDashboard onClose={() => { setShowParentDash(false); setPinVerified(false); }} />;
  }

  switch (store.currentView) {
    case 'world':
      return <WorldDetail onOpenParent={() => setShowParentDash(true)} />;
    case 'game':
      return <GameRouter />;
    default:
      return <WorldMap onOpenParent={() => setShowParentDash(true)} />;
  }
}

// ════════════════════════════════════════════
// ✨ SPLASH SCREEN — Premium with Particles
// ════════════════════════════════════════════
function SplashScreen() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 3 + Math.random() * 6,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
  }));

  return (
    <div className="splash-screen">
      <div className="splash-particles">
        {particles.map(p => (
          <div key={p.id} className="sparkle" style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }} />
        ))}
      </div>
      <img src="/characters/minda.jpg" alt="Minda" className="splash-logo" />
      <h1 className="splash-title" style={{ fontFamily: 'var(--font-heading)' }}>CelikMinda</h1>
      <p className="splash-subtitle" style={{ fontFamily: 'var(--font-body)' }}>Dunia Ajaib Pembelajaran <SparkleIcon size={18} /></p>
    </div>
  );
}

// ════════════════════════════════════════════
// 🔒 PIN LOCK SCREEN — Parent Access
// ════════════════════════════════════════════
function PinLockScreen({ onSuccess, onClose }) {
  const { language } = useGameStore();
  const lang = language;
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const CORRECT_PIN = '1234';

  const handleKey = (num) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      if (newPin === CORRECT_PIN) {
        setTimeout(() => onSuccess(), 300);
      } else {
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 800);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="parent-overlay">
      <div className="pin-modal">
        <div style={{ marginBottom: 'var(--space-md)' }}><LockIcon size={48} color='#8B5CF6' /></div>
        <h2>{lang === 'bm' ? 'Kawasan Ibu Bapa' : 'Parent Area'}</h2>
        <p>{lang === 'bm' ? 'Masukkan PIN 4 digit (1234)' : 'Enter 4-digit PIN (1234)'}</p>

        <div className="pin-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
              style={error ? { borderColor: 'var(--cm-red)', background: i < pin.length ? 'var(--cm-red)' : 'transparent' } : {}} />
          ))}
        </div>

        {error && (
          <p style={{ color: 'var(--cm-red)', fontSize: '0.85rem', fontWeight: 700, marginBottom: 'var(--space-md)', animation: 'bubbleShake 0.5s ease' }}>
            {lang === 'bm' ? 'PIN salah! Cuba lagi.' : 'Wrong PIN! Try again.'}
          </p>
        )}

        <div className="pin-keypad">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} className="pin-key" onClick={() => handleKey(String(n))}>{n}</button>
          ))}
          <button className="pin-key" onClick={onClose} style={{ fontSize: '1.5rem' }}><CloseIcon size={20} /></button>
          <button className="pin-key" onClick={() => handleKey('0')}>0</button>
          <button className="pin-key delete" onClick={handleDelete}><BackspaceIcon size={20} /></button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// 👨‍👩‍👧 PARENT DASHBOARD — Premium Analytics
// ════════════════════════════════════════════
function ParentDashboard({ onClose }) {
  const store = useGameStore();
  const lang = store.language;

  const totalGamesPlayed = Object.values(store.progress).filter(p => p.attempts > 0).length;
  const totalAttempts = Object.values(store.progress).reduce((sum, p) => sum + p.attempts, 0);
  const avgScore = totalAttempts > 0 
    ? Math.round(Object.values(store.progress).reduce((sum, p) => sum + p.bestScore, 0) / Math.max(1, totalGamesPlayed))
    : 0;

  const worldStats = WORLDS.map(w => {
    const progress = store.getWorldProgress(w.id);
    return { ...w, ...progress, totalGames: w.games.length };
  });

  return (
    <>
      <TopBar onOpenParent={() => {}} />
      <div className="parent-dashboard">
        <div className="parent-dashboard-header">
          <h1>{lang === 'bm' ? <><FamilyIcon size={24} /> Dashboard Ibu Bapa</> : <><FamilyIcon size={24} /> Parent Dashboard</>}</h1>
          <p>{lang === 'bm' ? 'Pantau perkembangan anak anda' : 'Monitor your child\'s progress'}</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value"><StarIcon size={18} /> {store.totalStars}</div>
            <div className="stat-label">{lang === 'bm' ? 'Jumlah Bintang' : 'Total Stars'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value"><GamepadIcon size={18} /> {totalGamesPlayed}</div>
            <div className="stat-label">{lang === 'bm' ? 'Permainan Dimain' : 'Games Played'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value"><RefreshIcon size={18} /> {totalAttempts}</div>
            <div className="stat-label">{lang === 'bm' ? 'Jumlah Percubaan' : 'Total Attempts'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value"><ChartIcon size={18} /> {avgScore}</div>
            <div className="stat-label">{lang === 'bm' ? 'Purata Markah' : 'Average Score'}</div>
          </div>
        </div>

        {/* World Progress */}
        <div style={{ padding: '0 var(--space-md)', maxWidth: 600, margin: '0 auto var(--space-xl)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
            {lang === 'bm' ? <><ChartIcon size={18} /> Kemajuan Mengikut Dunia</> : <><ChartIcon size={18} /> Progress by World</>}
          </h3>
          {worldStats.map(ws => {
            const pct = ws.totalGames > 0 ? Math.round((ws.gamesPlayed / ws.totalGames) * 100) : 0;
            return (
              <div key={ws.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                background: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-sm)', boxShadow: 'var(--shadow-sm)',
              }}>
                <WorldIcon worldId={ws.id} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {lang === 'bm' ? ws.name : ws.nameEn}
                  </div>
                  <div style={{
                    height: 8, background: '#F0F0F0', borderRadius: 'var(--radius-full)',
                    overflow: 'hidden', marginTop: 4,
                  }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 'var(--radius-full)',
                      background: 'var(--grad-royal)', transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--cm-purple)' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Settings */}
        <div style={{ padding: '0 var(--space-md)', maxWidth: 600, margin: '0 auto var(--space-xl)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
            {lang === 'bm' ? <><GearIcon size={18} /> Tetapan</> : <><GearIcon size={18} /> Settings</>}
          </h3>

          <div className="setting-item">
            <div>
              <div className="setting-label">{lang === 'bm' ? 'Bahasa' : 'Language'}</div>
              <div className="setting-desc">{lang === 'bm' ? 'Bahasa Melayu / English' : 'Malay / English'}</div>
            </div>
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={store.toggleLanguage}>
              {lang === 'bm' ? <><FlagMY size={16} /> BM</> : <><FlagEN size={16} /> EN</>}
            </button>
          </div>

          <div className="setting-item">
            <div>
              <div className="setting-label">{lang === 'bm' ? 'Nama Anak' : 'Child Name'}</div>
              <div className="setting-desc">{store.childName}</div>
            </div>
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => {
                const name = prompt(lang === 'bm' ? 'Masukkan nama anak:' : 'Enter child name:');
                if (name?.trim()) store.setChildName(name.trim());
              }}>
              <PencilIcon size={16} />
            </button>
          </div>

          <div className="setting-item">
            <div>
              <div className="setting-label">{lang === 'bm' ? 'Bunyi' : 'Sound'}</div>
              <div className="setting-desc">{store.soundEnabled ? (lang === 'bm' ? 'Hidup' : 'On') : (lang === 'bm' ? 'Mati' : 'Off')}</div>
            </div>
            <div className={`toggle-switch ${store.soundEnabled ? 'active' : ''}`}
              onClick={store.toggleSound} />
          </div>
        </div>

        {/* Back Button */}
        <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
          <button className="btn-premium" onClick={onClose}>
            {lang === 'bm' ? '← Kembali ke Aplikasi' : '← Back to App'}
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════
// 🎯 TOP BAR (HUD) — Premium Glassmorphism
// ════════════════════════════════════════════
function TopBar({ onOpenParent }) {
  const { childName, totalStars, language, toggleLanguage, goHome } = useGameStore();
  const lang = language;

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="avatar-circle" onClick={goHome} style={{ cursor: 'pointer' }}>
          <img src="/characters/minda.jpg" alt={childName} />
        </div>
        <span className="child-name">{t('greeting', lang)}, {childName}!</span>
      </div>
      <div className="top-bar-right">
        <div className="star-badge">
          <span className="star-icon"><StarIcon size={16} /></span>
          <span className="star-count">{totalStars}</span>
        </div>
        <button className="icon-btn" onClick={toggleLanguage} title={t('switchLang', lang)}
          style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          {t('currentLang', lang)}
        </button>
        <button className="icon-btn" onClick={onOpenParent} title={lang === 'bm' ? 'Ibu Bapa' : 'Parents'}><GearIcon size={18} /></button>
      </div>
    </div>
  );
}

// ── Character Guide (floating mascot) ──
function CharacterGuide({ guideId, message }) {
  const [showBubble, setShowBubble] = useState(true);
  const guide = GUIDES[guideId] || GUIDES.minda;

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(false), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="character-guide" onClick={() => setShowBubble(!showBubble)}>
      {showBubble && message && (
        <div className="speech-bubble">{message}</div>
      )}
      <img src={guide.image} alt={guide.name} />
    </div>
  );
}

// ════════════════════════════════════════════
// 🗺️ WORLD MAP (Home Screen) — Two-Tier Sections
// ════════════════════════════════════════════
function WorldMap({ onOpenParent }) {
  const store = useGameStore();
  const lang = store.language;
  const greeting = getGreeting(lang);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const userPlan = store.subscription.plan;

  const handleWorldClick = (world) => {
    if (store.canAccessWorld(world.id)) {
      store.goToWorld(world.id);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const renderWorldCard = (world, idx, isLocked) => {
    const worldTranslation = t(`worlds.${world.id}`, lang);
    const progress = store.getWorldProgress(world.id);
    const totalGames = world.games.length;
    const progressPercent = totalGames > 0 ? (progress.gamesPlayed / totalGames) * 100 : 0;

    return (
      <div
        key={world.id}
        className={`world-card ${isLocked ? 'locked' : ''}`}
        data-color={world.color}
        onClick={() => handleWorldClick(world)}
        style={{ animationDelay: `${idx * 0.06}s` }}
      >
        {isLocked && <div className="lock-badge"><LockIcon size={20} color='white' /></div>}
        <div className="world-icon">
          <img src={world.image} alt={typeof worldTranslation === 'object' ? worldTranslation.name : world.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
        </div>
        <span className="world-name">
          {typeof worldTranslation === 'object' ? worldTranslation.name : world.name}
        </span>
        <span className="world-games-count">
          {totalGames} {t('games', lang)}
        </span>
        <div className="world-progress">
          <div className="world-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    );
  };

  return (
    <>
      <TopBar onOpenParent={onOpenParent} />
      <div className="world-map-container">
        {/* Floating clouds */}
        <div className="cloud"><CloudIcon size={40} /></div>
        <div className="cloud"><CloudIcon size={50} /></div>
        <div className="cloud"><CloudIcon size={35} /></div>

        <div className="world-map-title">
          <h1>{t('worldMapTitle', lang)}</h1>
          <p>{greeting} {t('worldMapSubtitle', lang)}</p>
        </div>

        {/* ── SECTION 1: CelikMinda Mini (Worlds 1-6) ── */}
        <div style={{
          textAlign: 'center', padding: 'var(--space-md) var(--space-md) var(--space-sm)',
          position: 'relative', zIndex: 2,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)',
            background: 'linear-gradient(135deg, rgba(107,203,119,0.15), rgba(107,203,119,0.08))',
            padding: '10px 24px', borderRadius: 'var(--radius-full)',
            border: '2px solid rgba(107,203,119,0.3)',
          }}>
            <SeedlingIcon size={22} />
            <span style={{ 
              fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem',
              color: '#2D8B4E',
            }}>
              {lang === 'bm' ? 'CELIKMINDA MINI' : 'CELIKMINDA MINI'}
            </span>
            <span style={{
              fontSize: '0.75rem', color: '#5A9E6F', fontWeight: 600,
              background: 'rgba(107,203,119,0.2)', padding: '2px 10px', borderRadius: 12,
            }}>
              {MINI_WORLDS.length} {lang === 'bm' ? 'Dunia' : 'Worlds'} • {MINI_GAME_COUNT} {lang === 'bm' ? 'Permainan' : 'Games'}
            </span>
            {userPlan !== 'free' && (
              <span style={{ fontSize: '0.7rem', color: '#6BCB77', fontWeight: 800 }}>
                <CheckIcon size={14} /> {lang === 'bm' ? 'AKTIF' : 'ACTIVE'}
              </span>
            )}
          </div>
        </div>

        <div className="worlds-grid">
          {MINI_WORLDS.map((world, idx) => {
            const isLocked = userPlan === 'free'; // Mini worlds locked only for free users
            return renderWorldCard(world, idx, isLocked);
          })}
        </div>

        {/* ── SECTION 2: CelikMinda Lengkap (Worlds 7-12) ── */}
        <div style={{
          textAlign: 'center', padding: 'var(--space-xl) var(--space-md) var(--space-sm)',
          position: 'relative', zIndex: 2,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)',
            background: userPlan === 'complete' 
              ? 'linear-gradient(135deg, rgba(255,217,61,0.2), rgba(255,165,0,0.1))'
              : 'linear-gradient(135deg, rgba(150,150,150,0.1), rgba(100,100,100,0.05))',
            padding: '10px 24px', borderRadius: 'var(--radius-full)',
            border: userPlan === 'complete' 
              ? '2px solid rgba(255,217,61,0.4)'
              : '2px solid rgba(150,150,150,0.2)',
          }}>
            {userPlan === 'complete' ? <CrownIcon size={22} /> : <LockIcon size={22} />}
            <span style={{ 
              fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem',
              color: userPlan === 'complete' ? '#CC8800' : '#888',
            }}>
              {lang === 'bm' ? 'CELIKMINDA LENGKAP' : 'CELIKMINDA COMPLETE'}
            </span>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600,
              color: userPlan === 'complete' ? '#B8860B' : '#999',
              background: userPlan === 'complete' ? 'rgba(255,217,61,0.2)' : 'rgba(150,150,150,0.1)',
              padding: '2px 10px', borderRadius: 12,
            }}>
              +{COMPLETE_ONLY_WORLDS.length} {lang === 'bm' ? 'Dunia' : 'Worlds'} • +{COMPLETE_ONLY_GAME_COUNT} {lang === 'bm' ? 'Permainan' : 'Games'}
            </span>
            {userPlan === 'complete' && (
              <span style={{ fontSize: '0.7rem', color: '#FFD93D', fontWeight: 800 }}>
                <StarIcon size={14} /> {lang === 'bm' ? 'AKTIF' : 'ACTIVE'}
              </span>
            )}
          </div>
        </div>

        <div className="worlds-grid">
          {COMPLETE_ONLY_WORLDS.map((world, idx) => {
            const isLocked = userPlan !== 'complete';
            return renderWorldCard(world, idx + MINI_WORLDS.length, isLocked);
          })}
        </div>

        {/* ── Package Status / CTA ── */}
        <div style={{
          textAlign: 'center', padding: 'var(--space-xl) var(--space-md) var(--space-lg)',
          position: 'relative', zIndex: 2,
        }}>
          {userPlan === 'free' && (
            <div style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)',
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
              padding: 'var(--space-lg) var(--space-2xl)', borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-card)', border: '1px solid rgba(255,255,255,0.5)',
              maxWidth: 420, margin: '0 auto',
            }}>
              <GradCapIcon size={24} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {lang === 'bm' ? 'Mulakan Pembelajaran Anak Anda!' : 'Start Your Child\'s Learning!'}
              </span>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn-premium" onClick={() => setShowUpgradeModal(true)}
                  style={{ padding: '10px 20px', fontSize: '0.85rem', background: 'var(--cm-green)' }}>
                  <SeedlingIcon size={14} /> Mini — RM49.90
                </button>
                <button className="btn-premium" onClick={() => setShowUpgradeModal(true)}
                  style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                  <CrownIcon size={14} /> Lengkap — RM99.90
                </button>
              </div>
            </div>
          )}
          {userPlan === 'mini' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)',
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
              padding: 'var(--space-md) var(--space-xl)', borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-card)', border: '1px solid rgba(255,255,255,0.5)',
            }}>
              <SeedlingIcon size={20} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {lang === 'bm' ? 'CelikMinda Mini aktif' : 'CelikMinda Mini active'}
              </span>
              <button className="btn-premium" style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                onClick={() => setShowUpgradeModal(true)}>
                {lang === 'bm' ? <><StarIcon size={14} /> Naik Taraf — RM50</> : <><StarIcon size={14} /> Upgrade — RM50</>}
              </button>
            </div>
          )}
          {userPlan === 'complete' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)',
              background: 'linear-gradient(135deg, rgba(255,217,61,0.15), rgba(255,165,0,0.1))',
              backdropFilter: 'blur(12px)',
              padding: 'var(--space-md) var(--space-xl)', borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-card)', border: '2px solid rgba(255,217,61,0.3)',
            }}>
              <CrownIcon size={20} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem', color: '#CC8800' }}>
                {lang === 'bm' ? 'CelikMinda Lengkap — Semua Dunia Terbuka!' : 'CelikMinda Complete — All Worlds Unlocked!'}
              </span>
            </div>
          )}
        </div>
      </div>

      <CharacterGuide guideId="minda" message={t('letsPlay', lang)} />

      {/* ── Upgrade Modal ── */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          userPlan={userPlan}
        />
      )}
    </>
  );
}

// ════════════════════════════════════════════
// 💰 UPGRADE MODAL — Premium Package Selection
// ════════════════════════════════════════════
function UpgradeModal({ onClose, userPlan }) {
  const { language, activateSubscription } = useGameStore();
  const lang = language;

  const handlePurchase = (plan) => {
    // TODO: In production, this will redirect to ToyyibPay payment page
    // and only call activateSubscription after server-verified webhook
    // For now, demo activation:
    activateSubscription(plan, `DEMO-${Date.now()}`, 'demo');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-md)',
      animation: 'fadeIn 0.3s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 28, maxWidth: 440, width: '100%',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        overflow: 'hidden', animation: 'popIn 0.3s ease',
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
          padding: 'var(--space-xl) var(--space-lg)',
          textAlign: 'center', color: 'white', position: 'relative',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 16,
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, color: 'white', fontSize: '1.1rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><CloseIcon size={18} /></button>
          <div style={{ marginBottom: 8 }}><GradCapIcon size={40} /></div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', margin: 0 }}>
            {lang === 'bm' ? 'Buka Dunia Pembelajaran' : 'Unlock Learning Worlds'}
          </h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: 4 }}>
            {lang === 'bm' ? 'Satu pembelian • Seisi keluarga' : 'One purchase • Whole family'}
          </p>
        </div>

        {/* Package Cards */}
        <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* Mini Package */}
          {userPlan === 'free' && (
            <div style={{
              border: '2px solid rgba(107,203,119,0.3)', borderRadius: 20,
              padding: 'var(--space-md)', position: 'relative',
              background: 'linear-gradient(135deg, rgba(107,203,119,0.05), transparent)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <SeedlingIcon size={24} />
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem' }}>
                    CelikMinda Mini
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {PACKAGES.mini.worlds} {lang === 'bm' ? 'Dunia' : 'Worlds'} • {PACKAGES.mini.games} {lang === 'bm' ? 'Permainan' : 'Games'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.3rem', color: '#2D8B4E' }}>
                    RM49.90
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#999' }}>
                    {lang === 'bm' ? 'sekali bayar' : 'one-time'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 12 }}>
                <CheckIcon size={14} /> {lang === 'bm' ? 'Gua Huruf, Istana Nombor, Hutan Haiwan, Studio Warna, Pengangkutan, Pasar Buah' : 'Letter Cave, Number Castle, Animal Forest, Colour Studio, Transport, Fruit Market'}
              </div>
              <button onClick={() => handlePurchase('mini')} style={{
                width: '100%', padding: '12px', borderRadius: 14,
                background: '#6BCB77', color: 'white', border: 'none',
                fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem',
                cursor: 'pointer', transition: 'transform 0.15s ease',
              }}>
                <SeedlingIcon size={14} /> {lang === 'bm' ? 'Beli Mini — RM49.90' : 'Buy Mini — RM49.90'}
              </button>
            </div>
          )}

          {/* Complete Package */}
          <div style={{
            border: '2px solid rgba(255,217,61,0.4)', borderRadius: 20,
            padding: 'var(--space-md)', position: 'relative',
            background: 'linear-gradient(135deg, rgba(255,217,61,0.08), rgba(255,165,0,0.04))',
          }}>
            {/* Best Value Badge */}
            <div style={{
              position: 'absolute', top: -10, right: 16,
              background: 'linear-gradient(135deg, #FFD93D, #FFA726)', color: '#8B4513',
              padding: '3px 12px', borderRadius: 10, fontSize: '0.65rem',
              fontWeight: 900, fontFamily: 'var(--font-heading)',
              boxShadow: '0 2px 8px rgba(255,165,0,0.3)',
            }}>
              {lang === 'bm' ? <><StarIcon size={12} /> NILAI TERBAIK</> : <><StarIcon size={12} /> BEST VALUE</>}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <CrownIcon size={24} />
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem' }}>
                  CelikMinda Lengkap
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {PACKAGES.complete.worlds} {lang === 'bm' ? 'Dunia' : 'Worlds'} • {PACKAGES.complete.games} {lang === 'bm' ? 'Permainan' : 'Games'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.3rem', color: '#CC8800' }}>
                  {userPlan === 'mini' ? 'RM50.00' : 'RM99.90'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#999' }}>
                  {userPlan === 'mini' 
                    ? (lang === 'bm' ? 'naik taraf' : 'upgrade')
                    : (lang === 'bm' ? 'sekali bayar' : 'one-time')}
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 12 }}>
              <CheckIcon size={14} /> {lang === 'bm' ? 'SEMUA 12 dunia termasuk: Badan Saya, Taman Bentuk, Kampung Pekerjaan, Dewan Muzik, Penjelajah Dunia, Makmal Sains' : 'ALL 12 worlds including: My Body, Shape Garden, Job Village, Music Hall, World Explorer, Science Lab'}
            </div>
            
            <button onClick={() => handlePurchase('complete')} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: 'linear-gradient(135deg, #FFD93D, #FFA726)', color: '#8B4513',
              border: 'none', fontFamily: 'var(--font-heading)', fontWeight: 900,
              fontSize: '1rem', cursor: 'pointer', transition: 'transform 0.15s ease',
              boxShadow: '0 4px 16px rgba(255,165,0,0.3)',
            }}>
              <CrownIcon size={14} /> {userPlan === 'mini' 
                ? (lang === 'bm' ? 'Naik Taraf — Tambah RM50' : 'Upgrade — Add RM50')
                : (lang === 'bm' ? 'Beli Lengkap — RM99.90' : 'Buy Complete — RM99.90')}
            </button>

            {userPlan === 'mini' && (
              <div style={{ 
                fontSize: '0.7rem', color: '#999', textAlign: 'center', marginTop: 8,
                fontStyle: 'italic',
              }}>
                {lang === 'bm' 
                  ? <><LightbulbIcon size={14} /> Anda sudah membayar RM49.90. Hanya perlu tambah RM50 sahaja!</>
                  : <><LightbulbIcon size={14} /> You already paid RM49.90. Just add RM50 more!</>}
              </div>
            )}
          </div>

          {/* Family note */}
          <div style={{
            textAlign: 'center', padding: '8px', borderRadius: 12,
            background: 'rgba(74,144,217,0.08)', fontSize: '0.75rem', color: '#4A90D9',
          }}>
            <FamilyIcon size={16} /> {lang === 'bm' 
              ? 'Satu pembelian untuk semua anak dalam akaun keluarga anda'
              : 'One purchase for all children in your family account'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── World Detail (Game List) ──
function WorldDetail({ onOpenParent }) {
  const { currentWorldId, language, goHome, goToGame, getGameProgress } = useGameStore();
  const lang = language;
  const world = WORLDS.find(w => w.id === currentWorldId);
  if (!world) return null;

  const guide = GUIDES[world.guide];
  const worldTranslation = t(`worlds.${world.id}`, lang);

  return (
    <>
      <TopBar onOpenParent={onOpenParent} />
      <div className="world-detail" style={{ 
        background: `linear-gradient(180deg, ${guide.color}15 0%, var(--bg-sky) 100%)` 
      }}>
        <div className="world-detail-header">
          <button className="icon-btn" onClick={goHome} style={{ 
            position: 'absolute', left: 16, top: 80, zIndex: 10 
          }}>
            ←
          </button>
          <img src={guide.image} alt={guide.name} className="world-mascot" />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${world.image})`, backgroundSize: 'cover',
            backgroundPosition: 'center', opacity: 0.15, borderRadius: 'var(--radius-xl)',
          }} />
          <h1>{typeof worldTranslation === 'object' ? worldTranslation.name : world.name}</h1>
          <p>{typeof worldTranslation === 'object' ? worldTranslation.desc : world.description}</p>
        </div>

        <div className="games-list">
          {world.games.map((game, idx) => {
            const progress = getGameProgress(world.id, game.id);
            const gameTranslation = t(`gameNames.${game.id}`, lang);
            
            return (
              <div
                key={game.id}
                className="game-list-item"
                onClick={() => goToGame(world.id, game.id)}
                style={{ 
                  animation: `bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.08}s both` 
                }}
              >
                <div className="game-icon" style={{ 
                  background: `linear-gradient(135deg, ${guide.color}30, ${guide.color}60)`,
                  border: `2px solid ${guide.color}40`,
                  boxShadow: `0 4px 12px ${guide.color}25`,
                }}>
                  <GameThumbnail gameId={game.id} size={48} />
                </div>
                <div className="game-info">
                  <h3>{typeof gameTranslation === 'object' ? gameTranslation.name : game.name}</h3>
                  <p>{typeof gameTranslation === 'object' ? gameTranslation.desc : game.description}</p>
                </div>
                <div className="game-stars-mini">
                  <StarRating stars={progress.stars} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CharacterGuide guideId={world.guide} message={t('letsLearn', lang)} />
    </>
  );
}

// ── Game Router ──
function GameRouter() {
  const store = useGameStore();
  const { currentWorldId, currentGameId } = store;
  
  // ── Entitlement Guard: Block direct URL access to locked games ──
  if (!store.canAccessWorld(currentWorldId)) {
    store.goHome();
    return null;
  }
  
  // Playable games
  if (currentWorldId === 'abc' && currentGameId === 'letter-bubbles') return <LetterBubblesGame />;
  if (currentWorldId === 'abc' && currentGameId === 'letter-tree') return <LetterTreeGame />;
  if (currentWorldId === 'abc' && currentGameId === 'bee-flower') return <BeeFlowerGame />;
  if (currentWorldId === 'numbers' && currentGameId === 'count-objects') return <CountObjectsGame />;
  if (currentWorldId === 'numbers' && currentGameId === 'block-tower') return <BlockTowerGame />;
  if (currentWorldId === 'colours' && currentGameId === 'colour-mixing') return <ColourMixingGame />;
  if (currentWorldId === 'colours' && currentGameId === 'match-colour') return <MatchColourGame />;
  if (currentWorldId === 'animals' && currentGameId === 'animal-sounds') return <AnimalSoundsGame />;
  if (currentWorldId === 'animals' && currentGameId === 'animal-homes') return <AnimalHomesGame />;
  if (currentWorldId === 'shapes' && currentGameId === 'shape-hunt') return <ShapeHuntGame />;
  if (currentWorldId === 'transport' && currentGameId === 'sort-transport') return <SortTransportGame />;
  if (currentWorldId === 'numbers' && currentGameId === 'math-machine') return <MathMachineGame />;
  if (currentWorldId === 'numbers' && currentGameId === 'subtraction-shop') return <SubtractionShopGame />;
  if (currentWorldId === 'animals' && currentGameId === 'animal-food') return <AnimalFoodGame />;
  if (currentWorldId === 'colours' && currentGameId === 'free-draw') return <FreeDrawGame />;
  if (currentWorldId === 'transport' && currentGameId === 'road-safety') return <RoadSafetyGame />;
  // Food world
  if (currentWorldId === 'food' && currentGameId === 'grocery-store') return <GroceryStoreGame />;
  if (currentWorldId === 'food' && currentGameId === 'our-garden') return <OurGardenGame />;
  if (currentWorldId === 'food' && currentGameId === 'little-chef') return <LittleChefGame />;
  if (currentWorldId === 'food' && currentGameId === 'healthy-or-not') return <HealthyOrNotGame />;
  if (currentWorldId === 'food' && currentGameId === 'fruit-or-veg') return <FruitOrVegGame />;
  // ABC world (additional)
  if (currentWorldId === 'abc' && currentGameId === 'letter-trail') return <LetterTrailGame />;
  if (currentWorldId === 'abc' && currentGameId === 'syllable-factory') return <SyllableFactoryGame />;
  if (currentWorldId === 'abc' && currentGameId === 'letter-puzzle') return <LetterPuzzleGame />;
  // Numbers world (additional)
  if (currentWorldId === 'numbers' && currentGameId === 'number-trace') return <NumberTraceGame />;
  if (currentWorldId === 'numbers' && currentGameId === 'bigger-smaller') return <BiggerSmallerGame />;
  if (currentWorldId === 'numbers' && currentGameId === 'patterns') return <PatternsGame />;
  if (currentWorldId === 'numbers' && currentGameId === 'magic-dice') return <MagicDiceGame />;
  // Colours world (additional)
  if (currentWorldId === 'colours' && currentGameId === 'magic-colouring') return <MagicColouringGame />;
  if (currentWorldId === 'colours' && currentGameId === 'sock-pairs') return <SockPairsGame />;
  if (currentWorldId === 'colours' && currentGameId === 'colour-hunter') return <ColourHunterGame />;
  // Transport world (additional)
  if (currentWorldId === 'transport' && currentGameId === 'build-vehicle') return <BuildVehicleGame />;
  if (currentWorldId === 'transport' && currentGameId === 'world-vehicles') return <WorldVehiclesGame />;
  // Animals world (additional)
  if (currentWorldId === 'animals' && currentGameId === 'animal-puzzle') return <AnimalPuzzleGame />;
  if (currentWorldId === 'animals' && currentGameId === 'animal-encyclopedia') return <AnimalEncyclopediaGame />;
  if (currentWorldId === 'animals' && currentGameId === 'mimic-animal') return <MimicAnimalGame />;
  // ABC world (additional)
  if (currentWorldId === 'abc' && currentGameId === 'abc-song') return <AbcSongGame />;
  if (currentWorldId === 'abc' && currentGameId === 'letter-stories') return <LetterStoriesGame />;
  // ── COMPLETE TIER WORLDS ──
  // Body world
  if (currentWorldId === 'body' && currentGameId === 'label-body') return <LabelBodyGame />;
  if (currentWorldId === 'body' && currentGameId === 'move-together') return <MoveTogetherGame />;
  if (currentWorldId === 'body' && currentGameId === 'healthy-habits') return <HealthyHabitsGame />;
  if (currentWorldId === 'body' && currentGameId === 'little-doctor') return <LittleDoctorGame />;
  if (currentWorldId === 'body' && currentGameId === 'body-song') return <BodySongGame />;
  // Shapes world (complete-only games)
  if (currentWorldId === 'shapes' && currentGameId === 'magic-tangram') return <MagicTangramGame />;
  if (currentWorldId === 'shapes' && currentGameId === 'draw-shapes') return <DrawShapesGame />;
  if (currentWorldId === 'shapes' && currentGameId === 'build-pictures') return <BuildPicturesGame />;
  if (currentWorldId === 'shapes' && currentGameId === '3d-shapes') return <ThreeDShapesGame />;
  // Jobs world
  if (currentWorldId === 'jobs' && currentGameId === 'role-play') return <RolePlayGame />;
  if (currentWorldId === 'jobs' && currentGameId === 'job-tools') return <JobToolsGame />;
  if (currentWorldId === 'jobs' && currentGameId === 'visit-workplace') return <VisitWorkplaceGame />;
  if (currentWorldId === 'jobs' && currentGameId === 'who-am-i') return <WhoAmIGame />;
  // Music world
  if (currentWorldId === 'music' && currentGameId === 'instruments') return <InstrumentsGame />;
  if (currentWorldId === 'music' && currentGameId === 'follow-beat') return <FollowBeatGame />;
  if (currentWorldId === 'music' && currentGameId === 'childrens-songs') return <ChildrensSongsGame />;
  if (currentWorldId === 'music' && currentGameId === 'learn-notes') return <LearnNotesGame />;
  // World Explorer
  if (currentWorldId === 'world-explorer' && currentGameId === 'world-map') return <WorldMapGame />;
  if (currentWorldId === 'world-explorer' && currentGameId === 'world-houses') return <WorldHousesGame />;
  if (currentWorldId === 'world-explorer' && currentGameId === 'world-festivals') return <WorldFestivalsGame />;
  // Science world
  if (currentWorldId === 'science' && currentGameId === 'weather') return <WeatherGame />;
  if (currentWorldId === 'science' && currentGameId === 'plants') return <PlantsGame />;
  if (currentWorldId === 'science' && currentGameId === 'experiments') return <ExperimentsGame />;
  if (currentWorldId === 'science' && currentGameId === 'day-night') return <DayNightGame />;
  
  return <ComingSoonGame />;
}

// ── Coming Soon Placeholder ──
function ComingSoonGame() {
  const { currentWorldId, currentGameId, language, goToWorld } = useGameStore();
  const lang = language;
  const world = WORLDS.find(w => w.id === currentWorldId);
  const game = world?.games.find(g => g.id === currentGameId);
  const guide = world ? GUIDES[world.guide] : GUIDES.minda;
  const gameTranslation = t(`gameNames.${currentGameId}`, lang);

  return (
    <div className="game-screen" style={{ background: 'var(--bg-sky)' }}>
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld(currentWorldId)}>←</button>
        <span className="game-title">
          {typeof gameTranslation === 'object' ? gameTranslation.name : game?.name || 'Game'}
        </span>
        <div style={{ width: 44 }} />
      </div>
      <div className="game-body" style={{ textAlign: 'center', gap: 'var(--space-lg)' }}>
        <img src={guide.image} alt={guide.name} style={{ 
          width: 150, height: 150, borderRadius: '50%', objectFit: 'cover',
          border: '4px solid white', boxShadow: 'var(--shadow-lg)',
          animation: 'characterBob 3s ease-in-out infinite'
        }} />
        <GameIcon gameId={game?.id} size={64} />
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--cm-purple)' }}>
          {lang === 'bm' ? 'Akan Datang!' : 'Coming Soon!'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 300, fontWeight: 600 }}>
          {lang === 'bm' 
            ? 'Permainan ini sedang dalam pembangunan. Nantikan ya!'
            : 'This game is under development. Stay tuned!'}
        </p>
        <button className="btn-primary" onClick={() => goToWorld(currentWorldId)}>
          {t('backToWorld', lang)}
        </button>
      </div>
    </div>
  );
}

// ============================================
// 🫧 LETTER BUBBLES GAME (Tembak Huruf)
// ============================================
function LetterBubblesGame() {
  const { language, completeGame, goToWorld, soundEnabled } = useGameStore();
  const lang = language;
  
  const TOTAL_ROUNDS = 8;
  const BUBBLES_PER_ROUND = 6;
  const GAME_AREA_REF = useRef(null);
  
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [targetLetter, setTargetLetter] = useState('');
  const [bubbles, setBubbles] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [plusPoints, setPlusPoints] = useState([]);

  // Generate a new round
  const generateRound = useCallback((roundNum) => {
    // Pick a random target letter
    const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setTargetLetter(target);

    // Generate bubbles with one correct and rest wrong
    const wrongLetters = LETTERS.filter(l => l !== target);
    const shuffledWrong = wrongLetters.sort(() => Math.random() - 0.5).slice(0, BUBBLES_PER_ROUND - 1);
    const allLetters = [target, ...shuffledWrong].sort(() => Math.random() - 0.5);

    const newBubbles = allLetters.map((letter, i) => ({
      id: `${roundNum}-${i}`,
      letter,
      isTarget: letter === target,
      x: 15 + Math.random() * 65, // % position
      y: 20 + Math.random() * 55,
      size: 55 + Math.random() * 25,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      delay: i * 0.1,
      popped: false,
      wrong: false,
    }));

    setBubbles(newBubbles);
    setFeedback(null);
  }, []);

  // Init first round
  useEffect(() => {
    generateRound(1);
  }, [generateRound]);

  // Handle bubble tap
  const handleBubbleTap = (bubble) => {
    if (bubble.popped || feedback) return;

    if (bubble.isTarget) {
      // CORRECT!
      const points = 10;
      setScore(prev => prev + points);
      
      // Show +points animation
      setPlusPoints(prev => [...prev, { 
        id: Date.now(), x: bubble.x, y: bubble.y, points 
      }]);
      setTimeout(() => {
        setPlusPoints(prev => prev.filter(p => p.id !== Date.now()));
      }, 1000);

      // Pop the bubble
      setBubbles(prev => prev.map(b => 
        b.id === bubble.id ? { ...b, popped: true } : b
      ));

      // Audio + visual feedback
      if (soundEnabled) playCorrectSound();
      setFeedback({ type: 'correct', message: getRandomEncouragement(lang) });

      // Next round or complete
      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          // Game complete!
          const finalScore = score + points;
          const stars = finalScore >= 70 ? 3 : finalScore >= 40 ? 2 : 1;
          completeGame('abc', 'letter-bubbles', stars, finalScore);
          setGameComplete(true);
          if (soundEnabled) playCelebrationSound();
          spawnConfetti();
        } else {
          setRound(prev => prev + 1);
          generateRound(round + 1);
        }
      }, 1200);
    } else {
      // WRONG
      setBubbles(prev => prev.map(b => 
        b.id === bubble.id ? { ...b, wrong: true } : b
      ));
      if (soundEnabled) playWrongSound();
      setFeedback({ type: 'wrong', message: getRandomWrongResponse(lang) });
      
      setTimeout(() => {
        setBubbles(prev => prev.map(b => 
          b.id === bubble.id ? { ...b, wrong: false } : b
        ));
        setFeedback(null);
      }, 800);
    }
  };

  // Confetti explosion
  const spawnConfetti = () => {
    const colors = ['#FF6B9D', '#FFD93D', '#4A90D9', '#6BCB77', '#9B72CF', '#FF8C42'];
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 8,
    }));
    setConfettiPieces(pieces);
  };

  // Calculate stars
  const getStars = () => {
    if (score >= 70) return 3;
    if (score >= 40) return 2;
    return 1;
  };

  return (
    <div className="game-screen">
      {/* Header */}
      <div className="game-header">
        <button className="back-btn" onClick={() => goToWorld('abc')}>←</button>
        <span className="game-title">
          {lang === 'bm' ? 'Tembak Huruf' : 'Letter Bubbles'}
        </span>
        <div className="game-stars">
          {[1, 2, 3].map(s => (
            <span key={s} className={s <= getStars() ? 'star-earned' : 'star-empty'}><StarIcon size={20} /></span>
          ))}
        </div>
      </div>

      {/* Game Area */}
      <div className="game-body" style={{ padding: 0 }}>
        <div className="bubbles-game" ref={GAME_AREA_REF}>
          {/* Instruction */}
          <div className="instruction">
            {lang === 'bm' ? 'Cari huruf' : 'Find letter'}{' '}
            <span className="target-letter">{targetLetter}</span>
          </div>

          {/* Score */}
          <div className="game-score">
            <span className="score-icon"><DiamondIcon size={20} /></span>
            <span className="score-value">{score}</span>
          </div>

          {/* Round counter */}
          <div className="round-counter">
            {t('round', lang)} {round}/{TOTAL_ROUNDS}
          </div>

          {/* Bubbles */}
          {bubbles.map(bubble => (
            <div
              key={bubble.id}
              className={`bubble ${bubble.popped ? 'popping' : ''} ${bubble.wrong ? 'wrong' : ''}`}
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: bubble.size,
                height: bubble.size,
                background: bubble.color,
                boxShadow: `0 4px 15px rgba(0,0,0,0.15), inset 0 -3px 6px rgba(0,0,0,0.1)`,
                animation: bubble.popped ? undefined : `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${bubble.delay}s`,
              }}
              onClick={() => handleBubbleTap(bubble)}
            >
              <span className="bubble-letter" style={{ fontSize: bubble.size * 0.45 }}>
                {bubble.letter}
              </span>
            </div>
          ))}

          {/* Feedback toast */}
          {feedback && (
            <div style={{
              position: 'absolute',
              bottom: 30,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              background: feedback.type === 'correct' 
                ? 'linear-gradient(135deg, #6BCB77, #48C9B0)' 
                : 'linear-gradient(135deg, #FF6B6B, #ee5a24)',
              color: 'white',
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1.1rem',
              boxShadow: 'var(--shadow-md)',
              animation: 'fadeInUp 0.3s ease-out',
              whiteSpace: 'nowrap',
            }}>
              {feedback.message}
            </div>
          )}

          {/* Plus points animations */}
          {plusPoints.map(p => (
            <div key={p.id} className="plus-points" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              +{p.points}
            </div>
          ))}

          {/* Seabed decorations */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'linear-gradient(0deg, #2D8B72 0%, transparent 100%)',
            opacity: 0.3,
            borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
          }} />
        </div>
      </div>

      {/* Game Complete Modal */}
      {gameComplete && (
        <>
          <div className="confetti-container">
            {confettiPieces.map(piece => (
              <div
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: `${piece.left}%`,
                  background: piece.color,
                  width: piece.size,
                  height: piece.size,
                  animationDelay: `${piece.delay}s`,
                  transform: `rotate(${piece.rotation}deg)`,
                }}
              />
            ))}
          </div>
          <div className="game-complete-overlay">
            <div className="game-complete-modal">
              <div className="trophy"><TrophyIcon size={48} /></div>
              <h2>{lang === 'bm' ? 'Syabas!' : 'Well Done!'}</h2>
              <p>
                {t('youEarned', lang)} {getStars()} {t('starsEarned', lang)}!
              </p>
              <div className="stars-row">
                {[1, 2, 3].map(s => (
                  <span key={s} className="star" style={{ 
                    opacity: s <= getStars() ? 1 : 0.3 
                  }}>
                    <StarIcon size={24} />
                  </span>
                ))}
              </div>
              <p style={{ 
                fontFamily: 'var(--font-heading)', fontWeight: 700, 
                color: 'var(--cm-purple)', fontSize: '1.2rem' 
              }}>
                {t('score', lang)}: {score}
              </p>
              <div className="action-buttons" style={{ marginTop: 'var(--space-lg)' }}>
                <button className="btn-secondary" onClick={() => {
                  setRound(1);
                  setScore(0);
                  setGameComplete(false);
                  setConfettiPieces([]);
                  generateRound(1);
                }}>
                  <RefreshIcon size={16} /> {t('playAgain', lang)}
                </button>
                <button className="btn-success" onClick={() => goToWorld('abc')}>
                  <CheckIcon size={16} /> {t('backToWorld', lang)}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
