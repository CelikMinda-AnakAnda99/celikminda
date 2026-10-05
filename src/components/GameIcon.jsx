'use client';

import { useMemo } from 'react';
import { getEmojiIcon, getEmojiInfo } from '@/utils/gameIcons';

/**
 * Emoji → real image mapping.
 * When a generated image exists, use it instead of SVG.
 * These are beautiful kawaii 3D renders generated via AI.
 */
const EMOJI_TO_IMAGE = {
  // Animals
  '🐱': '/images/game/cat.jpg',
  '🐶': '/images/game/dog.jpg',
  '🐮': '/images/game/cow.jpg',
  '🐄': '/images/game/cow.jpg',
  '🦆': '/images/game/duck.jpg',
  '🐓': '/images/game/chicken.jpg',
  '🐔': '/images/game/chicken.jpg',
  '🐑': '/images/game/sheep.jpg',
  '🐸': '/images/game/frog.jpg',
  '🦁': '/images/game/lion.jpg',
  '🐘': '/images/game/elephant.jpg',
  '🐦': '/images/game/bird.jpg',
  '🐧': '/images/game/penguin.jpg',
  '🐒': '/images/game/monkey.jpg',
  '🐍': '/images/game/snake.jpg',
  '🐠': '/images/game/fish.jpg',
  '🐟': '/images/game/fish.jpg',
  '🐢': '/images/game/turtle.jpg',
  '🐬': '/images/game/dolphin.jpg',
  '🦅': '/images/game/eagle.jpg',
  '🦋': '/images/game/butterfly.jpg',
  '🐝': '/images/game/bee.jpg',
  '🐷': '/images/game/pig.jpg',
  '🐐': '/images/game/goat.jpg',
  '🐻': '/images/game/bear.jpg',
  '🦉': '/images/game/owl.jpg',
  '🐰': '/images/game/rabbit.jpg',
  '🐇': '/images/game/rabbit.jpg',
  '🦚': '/images/game/peacock.jpg',
  '🦑': '/images/game/squid.jpg',
  '🐙': '/images/game/squid.jpg',
  '🦜': '/images/game/bird.jpg',
  '🐣': '/images/game/chicken.jpg',
  '🐤': '/images/game/chicken.jpg',
  '🐕': '/images/game/dog.jpg',
  '😺': '/images/game/cat.jpg',
  
  // Fruits
  '🍎': '/images/game/apple.jpg',
  '🍊': '/images/game/orange.jpg',
  '🍋': '/images/game/lemon.jpg',
  '🍇': '/images/game/grape.jpg',
  '🍓': '/images/game/strawberry.jpg',
  '🫐': '/images/game/blueberry.jpg',
  '🍑': '/images/game/peach.jpg',
  '🍌': '/images/game/banana.jpg',
  '🍅': '/images/game/tomato.jpg',
  '🥝': '/images/game/kiwi.jpg',
  '🍒': '/images/game/cherry.jpg',
  
  // Vegetables
  '🥦': '/images/game/broccoli.jpg',
  '🥕': '/images/game/carrot.jpg',
  '🌽': '/images/game/corn.jpg',
  
  // Flowers
  '🌻': '/images/game/sunflower.jpg',
  '🌹': '/images/game/rose.jpg',
  
  // Nature
  '🌈': '/images/game/rainbow.jpg',
  '☀️': '/images/game/sun.jpg',
  '🌙': '/images/game/moon.jpg',
  
  // Food/Sweets
  '🧁': '/images/game/cupcake.jpg',
  '🍪': '/images/game/cookie.jpg',
  '🍩': '/images/game/donut.jpg',
  '🎂': '/images/game/cake.jpg',
  '🍰': '/images/game/cake.jpg',
  '🍫': '/images/game/chocolate.jpg',
  
  // Transport
  '🚗': '/images/game/car.jpg',
  '🚌': '/images/game/bus.jpg',
  '🚂': '/images/game/train.jpg',
  '🚄': '/images/game/train.jpg',
  '✈️': '/images/game/airplane.jpg',
  '🛫': '/images/game/airplane.jpg',
  '🚁': '/images/game/helicopter.jpg',
  '🚀': '/images/game/rocket.jpg',
  
  // Instruments
  '🎸': '/images/game/guitar.jpg',
  '🎹': '/images/game/piano.jpg',
  '🎺': '/images/game/trumpet.jpg',
  '🎻': '/images/game/violin.jpg',
  '🥁': '/images/game/drum.jpg',
  '🪈': '/images/game/flute.jpg',
  '🎤': '/images/game/microphone.jpg',
  
  // More Animals
  '🐴': '/images/game/horse.jpg',
  
  // Toys
  '🧸': '/images/game/teddy_bear.jpg',
  
  // More Food
  '🍔': '/images/game/hamburger.jpg',
  '🍕': '/images/game/pizza.jpg',
  '🍦': '/images/game/ice_cream.jpg',
  '🍬': '/images/game/candy.jpg',
  '🍭': '/images/game/lollipop.jpg',
  '🍟': '/images/game/french_fries.jpg',
  
  // More Transport
  '🚲': '/images/game/bicycle.jpg',
  '🚢': '/images/game/ship.jpg',
  '⛵': '/images/game/ship.jpg',
  '🚣': '/images/game/ship.jpg',
  '🚤': '/images/game/ship.jpg',
  '🛶': '/images/game/ship.jpg',
  '🚑': '/images/game/ambulance.jpg',
  '🚒': '/images/game/fire_engine.jpg',
  '🚔': '/images/game/police_car.jpg',
  
  // Misc
  '🎈': '/images/game/balloon.jpg',
  '🦀': '/images/game/crab.jpg',
};

/**
 * GameIcon (GI) — The ultimate emoji-to-image converter.
 * 
 * Priority:
 * 1. Real generated image (if mapped in EMOJI_TO_IMAGE)
 * 2. SVG icon fallback (from gameIcons.js)
 * 
 * Usage: <GI e="🍎" /> or <GI e="🍎" size={64} />
 */
export function GI({ e, size = 48, style = {}, className = '', onClick, alt }) {
  const imageSrc = EMOJI_TO_IMAGE[e];
  const svgSrc = useMemo(() => !imageSrc ? getEmojiIcon(e, size) : null, [e, size, imageSrc]);
  const info = useMemo(() => getEmojiInfo(e), [e]);
  
  const src = imageSrc || svgSrc;
  
  return (
    <img
      src={src}
      alt={alt || info.name || e}
      width={size}
      height={size}
      className={className}
      onClick={onClick}
      draggable={false}
      loading="lazy"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'cover',
        borderRadius: imageSrc ? '12px' : '0',
        ...style,
      }}
    />
  );
}

/**
 * Inline version that inherits font-size from parent.
 */
export function GIInline({ e, style = {}, className = '', onClick }) {
  const imageSrc = EMOJI_TO_IMAGE[e];
  const svgSrc = useMemo(() => !imageSrc ? getEmojiIcon(e, 48) : null, [e, imageSrc]);
  const info = useMemo(() => getEmojiInfo(e), [e]);

  return (
    <img
      src={imageSrc || svgSrc}
      alt={info.name || e}
      className={className}
      onClick={onClick}
      draggable={false}
      loading="lazy"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        width: '1em',
        height: '1em',
        objectFit: 'cover',
        borderRadius: imageSrc ? '6px' : '0',
        ...style,
      }}
    />
  );
}

export default GI;
