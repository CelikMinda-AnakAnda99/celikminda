'use client';
// CelikMinda — Inline SVG Icons (replaces ALL emoji throughout the app)
// Every icon is a clean SVG element, no emoji anywhere

import React from 'react';

// Reusable icon wrapper
const I = ({ children, size = 16, color = 'currentColor', style = {}, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...props}>
    {children}
  </svg>
);

// ── Star icon (golden) ──
export const StarIcon = ({ size = 16 }) => (
  <I size={size} color="#FFD93D">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </I>
);

// ── Lock icon ──
export const LockIcon = ({ size = 16, color = '#9CA3AF' }) => (
  <I size={size} color={color}>
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </I>
);

// ── Gear/Settings icon ──
export const GearIcon = ({ size = 16 }) => (
  <I size={size} color="#6B7280">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </I>
);

// ── Sparkle/Magic icon ──
export const SparkleIcon = ({ size = 16, color = '#FFD93D' }) => (
  <I size={size} color={color}>
    <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" />
  </I>
);

// ── Trophy icon ──
export const TrophyIcon = ({ size = 24, color = '#FFD93D' }) => (
  <I size={size} color={color}>
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </I>
);

// ── Gamepad icon ──
export const GamepadIcon = ({ size = 16, color = '#8B5CF6' }) => (
  <I size={size} color={color}>
    <path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z" />
  </I>
);

// ── Refresh/Replay icon ──
export const RefreshIcon = ({ size = 16, color = '#6C63FF' }) => (
  <I size={size} color={color}>
    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
  </I>
);

// ── Chart/Analytics icon ──
export const ChartIcon = ({ size = 16, color = '#10B981' }) => (
  <I size={size} color={color}>
    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
  </I>
);

// ── Checkmark icon ──
export const CheckIcon = ({ size = 16, color = '#22C55E' }) => (
  <I size={size} color={color}>
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </I>
);

// ── Close (X) icon ──
export const CloseIcon = ({ size = 16, color = '#6B7280' }) => (
  <I size={size} color={color}>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
  </I>
);

// ── Backspace/Delete icon ──  
export const BackspaceIcon = ({ size = 16, color = '#EF4444' }) => (
  <I size={size} color={color}>
    <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" />
  </I>
);

// ── Seedling/Plant icon ──
export const SeedlingIcon = ({ size = 16, color = '#22C55E' }) => (
  <I size={size} color={color}>
    <path d="M12 22c4.97 0 9-4.03 9-9A9 9 0 0012 4c0 4.97-4.03 9-9 9a9 9 0 009 9z" />
  </I>
);

// ── Crown/Premium icon ──
export const CrownIcon = ({ size = 16, color = '#FFD93D' }) => (
  <I size={size} color={color}>
    <path d="M12 1l3 6 6 2-4 5 1 6-6-3-6 3 1-6-4-5 6-2z" />
  </I>
);

// ── Graduation cap icon ──
export const GradCapIcon = ({ size = 16, color = '#8B5CF6' }) => (
  <I size={size} color={color}>
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
  </I>
);

// ── Cloud icon ──
export const CloudIcon = ({ size = 24, color = 'white' }) => (
  <I size={size} color={color} style={{ opacity: 0.6 }}>
    <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
  </I>
);

// ── Diamond/Gem icon ──
export const DiamondIcon = ({ size = 16, color = '#60A5FA' }) => (
  <I size={size} color={color}>
    <path d="M6 3l-6 8 12 11L24 11l-6-8H6zm11.46 1.5L20 8h-4l1.46-3.5zM12 19.34L5.5 9h13L12 19.34zM8 8l1.46-3.5h5.08L16 8H8z" />
  </I>
);

// ── Family icon ──
export const FamilyIcon = ({ size = 16, color = '#8B5CF6' }) => (
  <I size={size} color={color}>
    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.01 2.01 0 0018.06 7h-.12c-.74 0-1.41.42-1.73 1.08L14.7 12h2.8v10h2.5zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9l-1.5-5H4L2.5 15H4v7h3.5zM14 22v-4h1l-1.5-6h-2L10 16h1v6h3z" />
  </I>
);

// ── Pencil/Edit icon ──
export const PencilIcon = ({ size = 16, color = '#F59E0B' }) => (
  <I size={size} color={color}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </I>
);

// ── Lightbulb/Tip icon ──
export const LightbulbIcon = ({ size = 16, color = '#FBBF24' }) => (
  <I size={size} color={color}>
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
  </I>
);

// ── Bubble icon ──
export const BubbleIcon = ({ size = 16, color = '#67E8F9' }) => (
  <I size={size} color={color}>
    <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" />
    <circle cx="9" cy="9" r="2" fill={color} opacity="0.5" />
  </I>
);

// ── Flag icons ──
export const FlagMY = ({ size = 16 }) => (
  <svg width={size} height={size * 0.67} viewBox="0 0 30 20" style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
    <rect width="30" height="20" fill="#CC0001" />
    <rect y="1.43" width="30" height="1.43" fill="white" />
    <rect y="4.29" width="30" height="1.43" fill="white" />
    <rect y="7.14" width="30" height="1.43" fill="white" />
    <rect y="10" width="30" height="1.43" fill="white" />
    <rect y="12.86" width="30" height="1.43" fill="white" />
    <rect y="15.71" width="30" height="1.43" fill="white" />
    <rect y="18.57" width="30" height="1.43" fill="white" />
    <rect width="15" height="11.43" fill="#010066" />
    <circle cx="6.5" cy="5.71" r="3.5" fill="#FC0" />
    <circle cx="7.5" cy="5.71" r="3" fill="#010066" />
    <path d="M8 3l.5 1.5H10l-1.2.9.5 1.5L8 6l-1.3.9.5-1.5L6 4.5h1.5z" fill="#FC0" />
  </svg>
);

export const FlagEN = ({ size = 16 }) => (
  <svg width={size} height={size * 0.67} viewBox="0 0 30 20" style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
    <rect width="30" height="20" fill="#012169" />
    <path d="M0 0l30 20M30 0L0 20" stroke="white" strokeWidth="3" />
    <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.5" />
    <path d="M15 0v20M0 10h30" stroke="white" strokeWidth="5" />
    <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3" />
  </svg>
);
