'use client';

import { useMemo } from 'react';
import { assetPath } from '@/utils/assetPath';
import { getEmojiIcon, getEmojiInfo } from '@/utils/gameIcons';

/**
 * Emoji → real image mapping.
 * When a generated image exists, use it instead of SVG.
 * These are beautiful kawaii 3D renders generated via AI.
 */
const EMOJI_TO_IMAGE = {
  // Animals
  '🐱': assetPath('/images/game/cat.jpg'),
  '🐶': assetPath('/images/game/dog.jpg'),
  '🐮': assetPath('/images/game/cow.jpg'),
  '🐄': assetPath('/images/game/cow.jpg'),
  '🦆': assetPath('/images/game/duck.jpg'),
  '🐓': assetPath('/images/game/chicken.jpg'),
  '🐔': assetPath('/images/game/chicken.jpg'),
  '🐑': assetPath('/images/game/sheep.jpg'),
  '🐸': assetPath('/images/game/frog.jpg'),
  '🦁': assetPath('/images/game/lion.jpg'),
  '🐘': assetPath('/images/game/elephant.jpg'),
  '🐦': assetPath('/images/game/bird.jpg'),
  '🐧': assetPath('/images/game/penguin.jpg'),
  '🐒': assetPath('/images/game/monkey.jpg'),
  '🐍': assetPath('/images/game/snake.jpg'),
  '🐠': assetPath('/images/game/fish.jpg'),
  '🐟': assetPath('/images/game/fish.jpg'),
  '🐢': assetPath('/images/game/turtle.jpg'),
  '🐬': assetPath('/images/game/dolphin.jpg'),
  '🦅': assetPath('/images/game/eagle.jpg'),
  '🦋': assetPath('/images/game/butterfly.jpg'),
  '🐝': assetPath('/images/game/bee.jpg'),
  '🐷': assetPath('/images/game/pig.jpg'),
  '🐐': assetPath('/images/game/goat.jpg'),
  '🐻': assetPath('/images/game/bear.jpg'),
  '🦉': assetPath('/images/game/owl.jpg'),
  '🐰': assetPath('/images/game/rabbit.jpg'),
  '🐇': assetPath('/images/game/rabbit.jpg'),
  '🦚': assetPath('/images/game/peacock.jpg'),
  '🦑': assetPath('/images/game/squid.jpg'),
  '🐙': assetPath('/images/game/squid.jpg'),
  '🦜': assetPath('/images/game/bird.jpg'),
  '🐣': assetPath('/images/game/chicken.jpg'),
  '🐤': assetPath('/images/game/chicken.jpg'),
  '🐕': assetPath('/images/game/dog.jpg'),
  '😺': assetPath('/images/game/cat.jpg'),
  
  // Fruits
  '🍎': assetPath('/images/game/apple.jpg'),
  '🍊': assetPath('/images/game/orange.jpg'),
  '🍋': assetPath('/images/game/lemon.jpg'),
  '🍇': assetPath('/images/game/grape.jpg'),
  '🍓': assetPath('/images/game/strawberry.jpg'),
  '🫐': assetPath('/images/game/blueberry.jpg'),
  '🍑': assetPath('/images/game/peach.jpg'),
  '🍌': assetPath('/images/game/banana.jpg'),
  '🍅': assetPath('/images/game/tomato.jpg'),
  '🥝': assetPath('/images/game/kiwi.jpg'),
  '🍒': assetPath('/images/game/cherry.jpg'),
  
  // Vegetables
  '🥦': assetPath('/images/game/broccoli.jpg'),
  '🥕': assetPath('/images/game/carrot.jpg'),
  '🌽': assetPath('/images/game/corn.jpg'),
  
  // Flowers
  '🌻': assetPath('/images/game/sunflower.jpg'),
  '🌹': assetPath('/images/game/rose.jpg'),
  
  // Nature
  '🌈': assetPath('/images/game/rainbow.jpg'),
  '☀️': assetPath('/images/game/sun.jpg'),
  '🌙': assetPath('/images/game/moon.jpg'),
  
  // Food/Sweets
  '🧁': assetPath('/images/game/cupcake.jpg'),
  '🍪': assetPath('/images/game/cookie.jpg'),
  '🍩': assetPath('/images/game/donut.jpg'),
  '🎂': assetPath('/images/game/cake.jpg'),
  '🍰': assetPath('/images/game/cake.jpg'),
  '🍫': assetPath('/images/game/chocolate.jpg'),
  
  // Transport
  '🚗': assetPath('/images/game/car.jpg'),
  '🚌': assetPath('/images/game/bus.jpg'),
  '🚂': assetPath('/images/game/train.jpg'),
  '🚄': assetPath('/images/game/train.jpg'),
  '✈️': assetPath('/images/game/airplane.jpg'),
  '🛫': assetPath('/images/game/airplane.jpg'),
  '🚁': assetPath('/images/game/helicopter.jpg'),
  '🚀': assetPath('/images/game/rocket.jpg'),
  
  // Instruments
  '🎸': assetPath('/images/game/guitar.jpg'),
  '🎹': assetPath('/images/game/piano.jpg'),
  '🎺': assetPath('/images/game/trumpet.jpg'),
  '🎻': assetPath('/images/game/violin.jpg'),
  '🥁': assetPath('/images/game/drum.jpg'),
  '🪈': assetPath('/images/game/flute.jpg'),
  '🎤': assetPath('/images/game/microphone.jpg'),
  
  // More Animals
  '🐴': assetPath('/images/game/horse.jpg'),
  
  // Toys
  '🧸': assetPath('/images/game/teddy_bear.jpg'),
  
  // More Food
  '🍔': assetPath('/images/game/hamburger.jpg'),
  '🍕': assetPath('/images/game/pizza.jpg'),
  '🍦': assetPath('/images/game/ice_cream.jpg'),
  '🍬': assetPath('/images/game/candy.jpg'),
  '🍭': assetPath('/images/game/lollipop.jpg'),
  '🍟': assetPath('/images/game/french_fries.jpg'),
  
  // More Transport
  '🚲': assetPath('/images/game/bicycle.jpg'),
  '🚢': assetPath('/images/game/ship.jpg'),
  '⛵': assetPath('/images/game/ship.jpg'),
  '🚣': assetPath('/images/game/ship.jpg'),
  '🚤': assetPath('/images/game/ship.jpg'),
  '🛶': assetPath('/images/game/ship.jpg'),
  '🚑': assetPath('/images/game/ambulance.jpg'),
  '🚒': assetPath('/images/game/fire_engine.jpg'),
  '🚔': assetPath('/images/game/police_car.jpg'),
  
  // Misc
  '🎈': assetPath('/images/game/balloon.jpg'),
  '🦀': assetPath('/images/game/crab.jpg'),
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
