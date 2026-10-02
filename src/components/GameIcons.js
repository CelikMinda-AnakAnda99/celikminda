'use client';

// ============================================
// GAME ICON GENERATOR
// Premium SVG icons for all 76 games
// Replaces emoji with beautiful vector graphics
// ============================================

// Color palettes for each world
const WORLD_PALETTES = {
  abc: { primary: '#4361EE', secondary: '#7B2FFF', accent: '#F72585', bg: '#EDE7F6' },
  numbers: { primary: '#F72585', secondary: '#FF6B6B', accent: '#4361EE', bg: '#FCE4EC' },
  animals: { primary: '#2D6A4F', secondary: '#40916C', accent: '#95D5B2', bg: '#E8F5E9' },
  colours: { primary: '#7B2FFF', secondary: '#C77DFF', accent: '#E0AAFF', bg: '#F3E5F5' },
  transport: { primary: '#FF6B35', secondary: '#F7931A', accent: '#FFD166', bg: '#FFF3E0' },
  food: { primary: '#E63946', secondary: '#FF6B6B', accent: '#2D6A4F', bg: '#FFEBEE' },
  body: { primary: '#00B4D8', secondary: '#48CAE4', accent: '#ADE8F4', bg: '#E0F7FA' },
  shapes: { primary: '#283593', secondary: '#5C6BC0', accent: '#9FA8DA', bg: '#E8EAF6' },
  jobs: { primary: '#F57F17', secondary: '#FFB300', accent: '#FFF176', bg: '#FFF8E1' },
  music: { primary: '#7B1FA2', secondary: '#AB47BC', accent: '#CE93D8', bg: '#F3E5F5' },
  world_explorer: { primary: '#0097A7', secondary: '#00BCD4', accent: '#80DEEA', bg: '#E0F7FA' },
  science: { primary: '#1565C0', secondary: '#42A5F5', accent: '#90CAF9', bg: '#E3F2FD' },
};

// SVG path data for each game icon
const GAME_ICONS = {
  // === ABC World ===
  'letter-trail': {
    paths: [
      { d: 'M4 18L8 6h2l4 12h-2.5l-1-3H7.5l-1 3H4zm4.5-5h3L10 8l-1.5 5z', fill: '#4361EE' },
      { d: 'M16 18V6h2v5h3V6h2v12h-2v-5h-3v5h-2z', fill: '#7B2FFF' },
    ],
    bg: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)',
  },
  'letter-tree': {
    paths: [
      { d: 'M12 2C8 2 5 5 5 9c0 3 2 5 4 6v5h6v-5c2-1 4-3 4-6 0-4-3-7-7-7z', fill: '#4CAF50' },
      { d: 'M10 20h4v2h-4z', fill: '#795548' },
      { d: 'M11 8.5v3h2v-3l1.5-1.5-1-1L12 8l-1.5-1.5-1 1L11 8.5z', fill: '#FFF' },
    ],
    bg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  },
  'bee-flower': {
    paths: [
      { d: 'M12 4c-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2 3.5V14h4v-2.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4z', fill: '#FFD93D' },
      { d: 'M10 8h4M10 10h4', stroke: '#333', strokeWidth: '1', fill: 'none' },
      { d: 'M6 17c0-1.7 2.7-3 6-3s6 1.3 6 3c0 2-2.7 4-6 4s-6-2-6-4z', fill: '#E91E63' },
    ],
    bg: 'linear-gradient(135deg, #FFF9C4, #F0F4C3)',
  },
  'syllable-factory': {
    paths: [
      { d: 'M4 10h16v10H4z', fill: '#90A4AE' },
      { d: 'M6 4h4v6H6z', fill: '#F44336' },
      { d: 'M14 4h4v6h-4z', fill: '#2196F3' },
      { d: 'M8 14h8v2H8z', fill: '#FFC107' },
    ],
    bg: 'linear-gradient(135deg, #ECEFF1, #CFD8DC)',
  },
  'letter-bubbles': {
    paths: [
      { d: 'M7 7a5 5 0 1 0 10 0 5 5 0 0 0-10 0z', fill: '#42A5F5', opacity: '0.7' },
      { d: 'M3 14a4 4 0 1 0 8 0 4 4 0 0 0-8 0z', fill: '#7E57C2', opacity: '0.7' },
      { d: 'M13 15a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0z', fill: '#EC407A', opacity: '0.7' },
    ],
    bg: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
  },
  'letter-puzzle': {
    paths: [
      { d: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3z', fill: '#4361EE', opacity: '0.8' },
      { d: 'M13 13h8v8h-8z', fill: '#7B2FFF', opacity: '0.8' },
    ],
    bg: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)',
  },
  'abc-song': {
    paths: [
      { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z', fill: '#4361EE' },
    ],
    bg: 'linear-gradient(135deg, #E8EAF6, #C5CAE9)',
  },
  'letter-stories': {
    paths: [
      { d: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z', fill: '#4361EE' },
      { d: 'M7 7h10v2H7zM7 11h10v2H7zM7 15h6v2H7z', fill: '#FFF' },
    ],
    bg: 'linear-gradient(135deg, #C5CAE9, #9FA8DA)',
  },

  // === Numbers World ===
  'count-objects': {
    paths: [
      { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', fill: '#F72585' },
      { d: 'M10 7h4v10h-2v-8h-2V7z', fill: '#FFF' },
    ],
    bg: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  },
  'math-machine': {
    paths: [
      { d: 'M4 4h16v16H4z', fill: '#FF6B6B', rx: '3' },
      { d: 'M7 8h10v3H7z', fill: '#1A1A2E' },
      { d: 'M7 13h4v2H7zM13 13h4v2h-4zM7 16h4v2H7zM13 16h4v2h-4z', fill: '#FFF' },
    ],
    bg: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  },
  'subtraction-shop': {
    paths: [
      { d: 'M4 8h16l-2 12H6L4 8z', fill: '#FF6B6B' },
      { d: 'M2 4h20v4H2z', fill: '#E63946' },
      { d: 'M9 14h6v2H9z', fill: '#FFF' },
    ],
    bg: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
  },
  'number-trace': {
    paths: [
      { d: 'M8 4c2-2 6-2 8 0s2 6 0 8l-4 4-4-4c-2-2-2-6 0-8z', fill: 'none', stroke: '#F72585', strokeWidth: '2', strokeDasharray: '3,2' },
    ],
    bg: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  },
  'bigger-smaller': {
    paths: [
      { d: 'M4 12l8-8v5h8v6h-8v5L4 12z', fill: '#F72585' },
    ],
    bg: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  },
  'patterns': {
    paths: [
      { d: 'M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4z', fill: '#F72585' },
      { d: 'M4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4z', fill: '#4361EE' },
      { d: 'M4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z', fill: '#F72585' },
    ],
    bg: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
  },
  'magic-dice': {
    paths: [
      { d: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z', fill: '#FFF', stroke: '#F72585', strokeWidth: '2' },
      { d: 'M8 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', fill: '#F72585' },
    ],
    bg: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
  },

  // === Animals World ===
  'animal-puzzle': {
    paths: [
      { d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z', fill: '#40916C', opacity: '0.8' },
      { d: 'M14 14h7v7h-7z', fill: '#2D6A4F' },
    ],
    bg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  },
  'animal-food': {
    paths: [
      { d: 'M12 2c-3 0-5 2-5 5v3h10V7c0-3-2-5-5-5z', fill: '#8D6E63' },
      { d: 'M5 12h14v2H5z', fill: '#FFB300' },
      { d: 'M4 15h16v5H4z', fill: '#F4511E' },
    ],
    bg: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
  },
  'animal-encyclopedia': {
    paths: [
      { d: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z', fill: '#2D6A4F' },
      { d: 'M12 7c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z', fill: '#FFF' },
      { d: 'M7 16h10v2H7z', fill: '#95D5B2' },
    ],
    bg: 'linear-gradient(135deg, #E8F5E9, #A5D6A7)',
  },
  'mimic-animal': {
    paths: [
      { d: 'M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z', fill: '#FFD93D' },
      { d: 'M8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', fill: '#333' },
      { d: 'M8 14c0 2 1.8 4 4 4s4-2 4-4H8z', fill: '#333' },
    ],
    bg: 'linear-gradient(135deg, #FFF9C4, #FFF176)',
  },

  // === Colours World ===
  'colour-mixing': {
    paths: [
      { d: 'M7 5a5 5 0 1 0 5 8.66A5 5 0 1 0 17 5 5 5 0 1 0 7 5z', fill: '#E91E63', opacity: '0.6' },
      { d: 'M12 13.66A5 5 0 0 0 17 5', fill: '#2196F3', opacity: '0.6' },
    ],
    bg: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
  },
  'magic-colouring': {
    paths: [
      { d: 'M20.71 4.63l-1.34-1.34a1 1 0 0 0-1.42 0L3 18.25V21h2.75L20.71 6.04a1 1 0 0 0 0-1.41z', fill: '#7B2FFF' },
    ],
    bg: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)',
  },
  'match-colour': {
    paths: [
      { d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', fill: '#7B2FFF' },
      { d: 'M5 5h5v5H5z', fill: '#E91E63' },
      { d: 'M14 5h5v5h-5z', fill: '#4CAF50' },
      { d: 'M5 14h5v5H5z', fill: '#4CAF50' },
      { d: 'M14 14h5v5h-5z', fill: '#E91E63' },
    ],
    bg: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
  },
  'sock-pairs': {
    paths: [
      { d: 'M6 2h4v12c0 4-4 6-4 8H4c0-2 2-4 2-8V2z', fill: '#E91E63' },
      { d: 'M14 2h4v12c0 4-4 6-4 8h-2c0-2 2-4 2-8V2z', fill: '#E91E63' },
      { d: 'M6 4h4v2H6zM14 4h4v2h-4z', fill: '#FFF' },
    ],
    bg: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  },
  'colour-hunter': {
    paths: [
      { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', fill: '#7B2FFF' },
      { d: 'M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z', fill: '#FFF' },
      { d: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#E91E63' },
    ],
    bg: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
  },

  // === Transport World ===
  'build-vehicle': {
    paths: [
      { d: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z', fill: '#FF6B35' },
      { d: 'M6.5 16a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 16a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', fill: '#333' },
      { d: 'M5 10l1.5-4.5h11L19 10H5z', fill: '#B3E5FC' },
    ],
    bg: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
  },
  'world-vehicles': {
    paths: [
      { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', fill: '#42A5F5' },
      { d: 'M2 12h20M12 2c-3 3-4.5 7-4.5 10s1.5 7 4.5 10c3-3 4.5-7 4.5-10S15 5 12 2z', stroke: '#FFF', strokeWidth: '1.5', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
  },

  // === Food World ===
  'grocery-store': {
    paths: [
      { d: 'M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM17 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z', fill: '#E63946' },
      { d: 'M1 2h3.27l.94 2H20c.55 0 1 .45 1 1 0 .17-.04.34-.12.5l-3.58 6.47c-.34.61-1 1.03-1.75 1.03H8.1l-.9 1.63-.03.12c0 .28.22.5.5.5H19v2H7c-1.1 0-2-.9-2-2 0-.35.09-.68.25-.96L6.6 11.59 3 4H1V2z', fill: '#E63946' },
    ],
    bg: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
  },
  'our-garden': {
    paths: [
      { d: 'M12 22c-4 0-8-3-8-7 0-2 1-4 3-5 0-3 2-5 5-5s5 2 5 5c2 1 3 3 3 5 0 4-4 7-8 7z', fill: '#4CAF50' },
      { d: 'M12 10v12', stroke: '#795548', strokeWidth: '2', fill: 'none' },
      { d: 'M8 16l4-4 4 4', stroke: '#388E3C', strokeWidth: '1.5', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  },
  'healthy-or-not': {
    paths: [
      { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', fill: '#4CAF50' },
    ],
    bg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  },
  'fruit-or-veg': {
    paths: [
      { d: 'M12 2c-3 0-5.5 2.5-5.5 5.5 0 5 5.5 9.5 5.5 9.5s5.5-4.5 5.5-9.5C17.5 4.5 15 2 12 2z', fill: '#E63946' },
      { d: 'M12 2c0 0-1-1-3-1', stroke: '#4CAF50', strokeWidth: '2', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
  },

  // === Body World ===
  'label-body': {
    paths: [
      { d: 'M12 2C10.34 2 9 3.34 9 5s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z', fill: '#FFB74D' },
      { d: 'M10 10h4v6h-4z', fill: '#42A5F5' },
      { d: 'M8 10h2v8H8zM14 10h2v8h-2z', fill: '#42A5F5' },
      { d: 'M9 18h2v4H9zM13 18h2v4h-2z', fill: '#1565C0' },
    ],
    bg: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
  },
  'move-together': {
    paths: [
      { d: 'M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#FFB74D' },
      { d: 'M15 22l-3-8-3 8M8 12l4 2 4-2M6 10l3 2M18 10l-3 2', stroke: '#00B4D8', strokeWidth: '2', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #E0F7FA, #B2EBF2)',
  },
  'healthy-habits': {
    paths: [
      { d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', fill: '#E91E63' },
    ],
    bg: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  },
  'little-doctor': {
    paths: [
      { d: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z', fill: '#FFF', stroke: '#E91E63', strokeWidth: '2' },
      { d: 'M11 7h2v10h-2zM7 11h10v2H7z', fill: '#E91E63' },
    ],
    bg: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  },
  'body-song': {
    paths: [
      { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z', fill: '#00B4D8' },
    ],
    bg: 'linear-gradient(135deg, #E0F7FA, #B2EBF2)',
  },

  // === Shapes World ===
  'magic-tangram': {
    paths: [
      { d: 'M2 2l10 10H2z', fill: '#E91E63' },
      { d: 'M22 2L12 12h10z', fill: '#4361EE' },
      { d: 'M2 22l10-10v10z', fill: '#4CAF50' },
      { d: 'M12 12l5 5h-5z', fill: '#FF9800' },
      { d: 'M17 17l5 5h-5z', fill: '#9C27B0' },
    ],
    bg: 'linear-gradient(135deg, #E8EAF6, #C5CAE9)',
  },
  'draw-shapes': {
    paths: [
      { d: 'M3 21h18v-2H3v2zM20.71 4.63l-1.34-1.34a1 1 0 0 0-1.42 0L3 18.25V21h2.75L20.71 6.04a1 1 0 0 0 0-1.41z', fill: '#283593' },
    ],
    bg: 'linear-gradient(135deg, #E8EAF6, #C5CAE9)',
  },
  'build-pictures': {
    paths: [
      { d: 'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z', fill: '#5C6BC0' },
      { d: 'M5 15l3.5-4.5 2.5 3L14.5 9l4.5 6H5z', fill: '#FFF' },
    ],
    bg: 'linear-gradient(135deg, #E8EAF6, #C5CAE9)',
  },
  '3d-shapes': {
    paths: [
      { d: 'M12 2L3 7v10l9 5 9-5V7L12 2z', fill: 'none', stroke: '#283593', strokeWidth: '2' },
      { d: 'M12 2v20M3 7l9 5 9-5', stroke: '#5C6BC0', strokeWidth: '1.5', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #C5CAE9, #9FA8DA)',
  },

  // === Jobs World ===
  'role-play': {
    paths: [
      { d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z', fill: '#FFB74D' },
      { d: 'M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', fill: '#F57F17' },
    ],
    bg: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
  },
  'job-tools': {
    paths: [
      { d: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z', fill: '#F57F17' },
    ],
    bg: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
  },
  'visit-workplace': {
    paths: [
      { d: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z', fill: '#F57F17' },
      { d: 'M18 11h-2v2h2v-2zm0 4h-2v2h2v-2z', fill: '#FFF' },
    ],
    bg: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
  },
  'who-am-i': {
    paths: [
      { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', fill: '#FFB300' },
      { d: 'M11 7h2v6h-2zM11 15h2v2h-2z', fill: '#FFF' },
    ],
    bg: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
  },

  // === Music World ===
  'instruments': {
    paths: [
      { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z', fill: '#7B1FA2' },
    ],
    bg: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
  },
  'follow-beat': {
    paths: [
      { d: 'M2 12h4l3-9 4 18 3-9h4', stroke: '#7B1FA2', strokeWidth: '2', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
  },
  'childrens-songs': {
    paths: [
      { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z', fill: '#AB47BC' },
      { d: 'M3 9v6h4l5 5V4L7 9H3z', fill: '#7B1FA2' },
    ],
    bg: 'linear-gradient(135deg, #F3E5F5, #CE93D8)',
  },
  'learn-notes': {
    paths: [
      { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z', fill: '#CE93D8' },
      { d: 'M4 10h16M4 14h16', stroke: '#7B1FA2', strokeWidth: '0.5', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)',
  },

  // === World Explorer ===
  'world-map': {
    paths: [
      { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', fill: '#42A5F5' },
      { d: 'M2 12h20M12 2c-3 3-4.5 7-4.5 10s1.5 7 4.5 10c3-3 4.5-7 4.5-10S15 5 12 2z', stroke: '#FFF', strokeWidth: '1', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #E0F7FA, #B2EBF2)',
  },
  'world-houses': {
    paths: [
      { d: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z', fill: '#0097A7' },
    ],
    bg: 'linear-gradient(135deg, #E0F7FA, #B2EBF2)',
  },
  'world-festivals': {
    paths: [
      { d: 'M12 2l1 7h7l-5.5 4.5L16 21l-4-3.5L8 21l1.5-7.5L4 9h7l1-7z', fill: '#FF6F00' },
    ],
    bg: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
  },

  // === Science World ===
  'weather': {
    paths: [
      { d: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2z', fill: '#FFA726' },
      { d: 'M12 5.5c-3.31 0-6 2.69-6 6 0 .74.13 1.44.38 2.1C7.16 14.45 8 15 9 15.5c.37.19.5.67.5 1.08V18h5v-1.42c0-.41.13-.89.5-1.08 1-.5 1.84-1.05 2.62-1.9.25-.66.38-1.36.38-2.1 0-3.31-2.69-6-6-6z', fill: '#FFA726' },
    ],
    bg: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
  },
  'plants': {
    paths: [
      { d: 'M12 22c-4 0-8-3-8-7 0-2 1-4 3-5 0-3 2-5 5-5s5 2 5 5c2 1 3 3 3 5 0 4-4 7-8 7z', fill: '#4CAF50' },
      { d: 'M12 10v12', stroke: '#795548', strokeWidth: '2', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  },
  'experiments': {
    paths: [
      { d: 'M7 2v2h1v6l-4 8c-.6 1.2.2 2.6 1.5 2.6h13c1.3 0 2.1-1.4 1.5-2.6L15 10V4h1V2H7z', fill: '#42A5F5' },
      { d: 'M10 14c0 0 1-1 2-1s2 1 2 1', stroke: '#FFF', strokeWidth: '1.5', fill: 'none' },
    ],
    bg: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
  },
  'day-night': {
    paths: [
      { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', fill: '#1A237E' },
      { d: 'M12 2v20c5.52 0 10-4.48 10-10S17.52 2 12 2z', fill: '#FFA726' },
    ],
    bg: 'linear-gradient(135deg, #E8EAF6, #C5CAE9)',
  },
};

// Generates an SVG icon for a game
export function GameIcon({ gameId, size = 64, className = '' }) {
  const iconData = GAME_ICONS[gameId];
  
  if (!iconData) {
    // Default fallback: a sparkle icon
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.2,
          background: 'linear-gradient(135deg, #E8EAF6, #C5CAE9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="#6C63FF">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        background: iconData.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        {iconData.paths.map((path, i) => (
          <path
            key={i}
            d={path.d}
            fill={path.fill || 'none'}
            stroke={path.stroke}
            strokeWidth={path.strokeWidth}
            strokeDasharray={path.strokeDasharray}
            opacity={path.opacity}
          />
        ))}
      </svg>
    </div>
  );
}

// GameThumbnail — shows game thumbnail image with SVG fallback
export function GameThumbnail({ gameId, size = 48, className = '' }) {
  const thumbName = gameId.replace(/-/g, '_');
  const imgSrc = `/games/${thumbName}.jpg`;
  
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <img
        src={imgSrc}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <div style={{ display: 'none', position: 'absolute', inset: 0 }}>
        <GameIcon gameId={gameId} size={size} />
      </div>
    </div>
  );
}

// StarRating — displays star rating (0-3)
export function StarRating({ stars = 0, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= stars ? '#FFD93D' : '#DDD'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// WorldIcon — SVG icon for a world category
const WORLD_ICON_DATA = {
  abc: { d: 'M4 18L8 6h2l4 12h-2.5l-1-3H7.5l-1 3H4zm4.5-5h3L10 8l-1.5 5zM16 18V6h2v5h3V6h2v12h-2v-5h-3v5h-2z', fill: '#4361EE' },
  numbers: { d: 'M10 7h4v10h-2v-8h-2V7zM6 11h4v2H8v2h2v2H6v-4h-2v-2h2zM14 11h4v6h-4v-2h2v-2h-2v-2z', fill: '#F72585' },
  animals: { d: 'M4.5 9.5C4.5 5.36 7.86 2 12 2s7.5 3.36 7.5 7.5c0 5.5-7.5 12.5-7.5 12.5S4.5 15 4.5 9.5z', fill: '#2D6A4F' },
  colours: { d: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1.01 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z', fill: '#7B2FFF' },
  transport: { d: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z', fill: '#FF6B35' },
  food: { d: 'M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z', fill: '#E63946' },
  body: { d: 'M12 2C10.34 2 9 3.34 9 5s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 14.5c-2.67 0-8 1.34-8 4v1.5h16v-1.5c0-2.66-5.33-4-8-4z', fill: '#00B4D8' },
  shapes: { d: 'M12 2L3 7v10l9 5 9-5V7L12 2z', fill: '#283593' },
  jobs: { d: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z', fill: '#F57F17' },
  music: { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z', fill: '#7B1FA2' },
  world_explorer: { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', fill: '#0097A7' },
  science: { d: 'M7 2v2h1v6l-4 8c-.6 1.2.2 2.6 1.5 2.6h13c1.3 0 2.1-1.4 1.5-2.6L15 10V4h1V2H7z', fill: '#1565C0' },
};

export function WorldIcon({ worldId, size = 32, className = '' }) {
  const data = WORLD_ICON_DATA[worldId] || WORLD_ICON_DATA.abc;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={data.fill}>
      <path d={data.d} />
    </svg>
  );
}

// AchievementBadge — displays a trophy/badge
export function AchievementBadge({ type = 'trophy', size = 32, className = '' }) {
  const badges = {
    trophy: { d: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z', fill: '#FFD93D' },
    star: { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', fill: '#FFD93D' },
    medal: { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z', fill: '#FFD93D' },
  };
  const badge = badges[type] || badges.trophy;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={badge.fill}>
      <path d={badge.d} />
    </svg>
  );
}

export default GameIcon;
