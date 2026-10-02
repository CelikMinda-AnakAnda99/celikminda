'use client';

// ============================================
// 🎨 SVG GAME ASSETS — Handcrafted kawaii vectors
// Replaces emoji with proper illustrations!
// ============================================

// === FRUIT SVGs ===
export const FruitSVG = ({ type, size = 60 }) => {
  const fruits = {
    apple: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <ellipse cx="50" cy="58" rx="35" ry="38" fill="#FF4444" />
        <ellipse cx="38" cy="45" rx="8" ry="12" fill="rgba(255,255,255,0.3)" />
        <path d="M50 20 Q55 5 65 10" stroke="#6B8E23" strokeWidth="3" fill="none" />
        <ellipse cx="55" cy="15" rx="8" ry="5" fill="#6B8E23" />
      </svg>
    ),
    orange: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="55" r="38" fill="#FF8C00" />
        <ellipse cx="40" cy="42" rx="6" ry="10" fill="rgba(255,255,255,0.3)" />
        <circle cx="50" cy="15" r="5" fill="#6B8E23" />
        <path d="M50 20 L50 30" stroke="#6B8E23" strokeWidth="2" />
      </svg>
    ),
    grape: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="40" cy="45" r="12" fill="#8B2FA0" />
        <circle cx="60" cy="45" r="12" fill="#8B2FA0" />
        <circle cx="30" cy="60" r="12" fill="#7B1FA2" />
        <circle cx="50" cy="58" r="12" fill="#9C27B0" />
        <circle cx="70" cy="60" r="12" fill="#7B1FA2" />
        <circle cx="40" cy="73" r="12" fill="#6A1B9A" />
        <circle cx="60" cy="73" r="12" fill="#6A1B9A" />
        <circle cx="50" cy="85" r="12" fill="#4A148C" />
        <path d="M50 35 Q55 15 60 20" stroke="#6B8E23" strokeWidth="2" fill="none" />
        <ellipse cx="55" cy="20" rx="8" ry="4" fill="#6B8E23" />
      </svg>
    ),
    strawberry: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M50 20 Q25 40 30 70 Q35 95 50 95 Q65 95 70 70 Q75 40 50 20Z" fill="#FF1744" />
        <circle cx="40" cy="50" r="2" fill="#FFEB3B" />
        <circle cx="55" cy="55" r="2" fill="#FFEB3B" />
        <circle cx="45" cy="65" r="2" fill="#FFEB3B" />
        <circle cx="58" cy="70" r="2" fill="#FFEB3B" />
        <circle cx="50" cy="80" r="2" fill="#FFEB3B" />
        <path d="M40 22 L50 20 L60 22" stroke="#6B8E23" strokeWidth="2" fill="#6B8E23" />
        <path d="M42 18 L50 15 L58 18" stroke="#8BC34A" strokeWidth="2" fill="#8BC34A" />
      </svg>
    ),
    banana: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M30 80 Q20 50 40 25 Q55 10 65 20 Q55 15 45 30 Q30 55 35 80Z" fill="#FFD600" stroke="#F9A825" strokeWidth="2" />
        <path d="M38 75 Q28 50 43 28" stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" />
      </svg>
    ),
    watermelon: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M15 60 A40 40 0 0 1 85 60 Z" fill="#4CAF50" />
        <path d="M20 60 A35 35 0 0 1 80 60 Z" fill="#FF1744" />
        <circle cx="35" cy="52" r="2.5" fill="#333" />
        <circle cx="50" cy="48" r="2.5" fill="#333" />
        <circle cx="65" cy="52" r="2.5" fill="#333" />
        <circle cx="43" cy="42" r="2" fill="#333" />
        <circle cx="57" cy="42" r="2" fill="#333" />
      </svg>
    ),
  };
  
  return fruits[type] || fruits.apple;
};

// === VEHICLE SVGs ===
export const VehicleSVG = ({ type, size = 70 }) => {
  const vehicles = {
    car: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <rect x="10" y="35" width="100" height="30" rx="8" fill="#FF5252" />
        <path d="M30 35 Q35 10 60 10 Q85 10 90 35" fill="#42A5F5" />
        <line x1="60" y1="10" x2="60" y2="35" stroke="#333" strokeWidth="2" />
        <circle cx="30" cy="68" r="10" fill="#333" />
        <circle cx="30" cy="68" r="5" fill="#999" />
        <circle cx="90" cy="68" r="10" fill="#333" />
        <circle cx="90" cy="68" r="5" fill="#999" />
        <rect x="12" y="42" width="15" height="8" rx="3" fill="#FFEB3B" />
        <rect x="93" y="42" width="15" height="8" rx="3" fill="#FF1744" />
      </svg>
    ),
    bus: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <rect x="5" y="10" width="110" height="55" rx="10" fill="#FFC107" />
        <rect x="15" y="18" width="20" height="18" rx="4" fill="#E3F2FD" />
        <rect x="42" y="18" width="20" height="18" rx="4" fill="#E3F2FD" />
        <rect x="70" y="18" width="20" height="18" rx="4" fill="#E3F2FD" />
        <rect x="5" y="42" width="110" height="5" fill="#E65100" />
        <circle cx="25" cy="68" r="10" fill="#333" />
        <circle cx="25" cy="68" r="5" fill="#999" />
        <circle cx="95" cy="68" r="10" fill="#333" />
        <circle cx="95" cy="68" r="5" fill="#999" />
      </svg>
    ),
    airplane: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <ellipse cx="60" cy="40" rx="45" ry="12" fill="#90CAF9" />
        <polygon points="15,40 5,20 5,60" fill="#64B5F6" />
        <polygon points="50,28 70,10 80,28" fill="#42A5F5" />
        <polygon points="50,52 70,70 80,52" fill="#42A5F5" />
        <circle cx="95" cy="40" r="5" fill="#E3F2FD" />
        <circle cx="75" cy="33" r="3" fill="#E3F2FD" />
        <circle cx="65" cy="33" r="3" fill="#E3F2FD" />
      </svg>
    ),
    ship: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <path d="M10 55 L20 75 L100 75 L110 55 Z" fill="#795548" />
        <rect x="40" y="25" width="40" height="30" rx="4" fill="#ECEFF1" />
        <rect x="55" y="10" width="4" height="40" fill="#5D4037" />
        <polygon points="59,12 59,35 90,25" fill="#FF5252" />
        <path d="M0 60 Q15 50 30 60 Q45 70 60 60 Q75 50 90 60 Q105 70 120 60" stroke="#42A5F5" strokeWidth="3" fill="none" />
      </svg>
    ),
    helicopter: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <ellipse cx="50" cy="45" rx="30" ry="18" fill="#66BB6A" />
        <circle cx="45" cy="40" r="10" fill="#E3F2FD" />
        <line x1="20" y1="25" x2="80" y2="25" stroke="#333" strokeWidth="3" />
        <line x1="80" y1="45" x2="105" y2="35" stroke="#333" strokeWidth="3" />
        <ellipse cx="108" cy="35" rx="3" ry="10" fill="#333" />
        <line x1="35" y1="63" x2="65" y2="63" stroke="#333" strokeWidth="4" />
      </svg>
    ),
    train: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <rect x="10" y="15" width="40" height="45" rx="8" fill="#F44336" />
        <rect x="55" y="25" width="25" height="35" rx="4" fill="#2196F3" />
        <rect x="85" y="25" width="25" height="35" rx="4" fill="#4CAF50" />
        <circle cx="25" cy="65" r="8" fill="#333" />
        <circle cx="40" cy="65" r="8" fill="#333" />
        <circle cx="70" cy="65" r="8" fill="#333" />
        <circle cx="100" cy="65" r="8" fill="#333" />
        <circle cx="30" cy="30" r="8" fill="#E3F2FD" />
      </svg>
    ),
    bicycle: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <circle cx="25" cy="55" r="18" fill="none" stroke="#333" strokeWidth="4" />
        <circle cx="95" cy="55" r="18" fill="none" stroke="#333" strokeWidth="4" />
        <line x1="25" y1="55" x2="55" y2="30" stroke="#FF5252" strokeWidth="3" />
        <line x1="55" y1="30" x2="95" y2="55" stroke="#FF5252" strokeWidth="3" />
        <line x1="55" y1="30" x2="70" y2="30" stroke="#FF5252" strokeWidth="3" />
        <line x1="70" y1="30" x2="95" y2="55" stroke="#FF5252" strokeWidth="3" />
        <line x1="55" y1="30" x2="50" y2="15" stroke="#333" strokeWidth="2" />
        <line x1="45" y1="15" x2="55" y2="15" stroke="#333" strokeWidth="3" />
      </svg>
    ),
    rocket: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M50 5 Q40 30 40 60 L60 60 Q60 30 50 5Z" fill="#E0E0E0" />
        <rect x="42" y="30" width="16" height="12" rx="4" fill="#42A5F5" />
        <polygon points="40,60 30,75 40,70" fill="#FF5252" />
        <polygon points="60,60 70,75 60,70" fill="#FF5252" />
        <path d="M42 65 Q50 80 58 65" fill="#FF9800" />
        <path d="M45 65 Q50 75 55 65" fill="#FFEB3B" />
      </svg>
    ),
    sailboat: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <path d="M20 55 L50 55 L100 55 L80 75 L25 75Z" fill="#795548" />
        <line x1="55" y1="55" x2="55" y2="10" stroke="#5D4037" strokeWidth="3" />
        <polygon points="55,12 55,50 90,50" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1" />
        <path d="M0 68 Q15 58 30 68 Q45 78 60 68 Q75 58 90 68 Q105 78 120 68" stroke="#42A5F5" strokeWidth="3" fill="none" />
      </svg>
    ),
    balloon: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <ellipse cx="50" cy="35" rx="30" ry="35" fill="#FF5252" />
        <ellipse cx="42" cy="25" rx="6" ry="10" fill="rgba(255,255,255,0.3)" />
        <polygon points="35,68 50,75 65,68 55,72 45,72" fill="#795548" />
        <line x1="38" y1="70" x2="35" y2="85" stroke="#795548" strokeWidth="1.5" />
        <line x1="50" y1="75" x2="50" y2="90" stroke="#795548" strokeWidth="1.5" />
        <line x1="62" y1="70" x2="65" y2="85" stroke="#795548" strokeWidth="1.5" />
        <rect x="33" y="85" width="34" height="12" rx="3" fill="#8D6E63" />
      </svg>
    ),
    motorcycle: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <circle cx="25" cy="55" r="16" fill="none" stroke="#333" strokeWidth="4" />
        <circle cx="95" cy="55" r="16" fill="none" stroke="#333" strokeWidth="4" />
        <path d="M25 55 Q40 25 60 30 L95 55" stroke="#FF5252" strokeWidth="4" fill="none" />
        <rect x="50" y="25" width="20" height="12" rx="4" fill="#FF5252" />
        <line x1="60" y1="25" x2="55" y2="12" stroke="#333" strokeWidth="3" />
        <line x1="50" y1="12" x2="60" y2="12" stroke="#333" strokeWidth="3" />
      </svg>
    ),
    ambulance: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <rect x="5" y="20" width="110" height="42" rx="8" fill="white" stroke="#E0E0E0" strokeWidth="2" />
        <rect x="5" y="20" width="40" height="42" rx="8" fill="#FF5252" />
        <rect x="80" y="28" width="25" height="15" rx="4" fill="#E3F2FD" />
        <line x1="55" y1="30" x2="55" y2="50" stroke="#FF5252" strokeWidth="4" />
        <line x1="45" y1="40" x2="65" y2="40" stroke="#FF5252" strokeWidth="4" />
        <circle cx="25" cy="65" r="10" fill="#333" />
        <circle cx="95" cy="65" r="10" fill="#333" />
      </svg>
    ),
    speedboat: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <path d="M10 45 L30 55 L100 55 L110 45 Z" fill="#1565C0" />
        <rect x="40" y="30" width="30" height="18" rx="5" fill="white" />
        <rect x="60" y="20" width="3" height="25" fill="#333" />
        <path d="M0 58 Q15 50 30 58 Q45 66 60 58 Q75 50 90 58 Q105 66 120 58" stroke="#42A5F5" strokeWidth="2" fill="none" />
      </svg>
    ),
    kayak: (
      <svg width={size} height={size} viewBox="0 0 120 80">
        <ellipse cx="60" cy="50" rx="50" ry="10" fill="#FF9800" />
        <line x1="50" y1="25" x2="70" y2="55" stroke="#795548" strokeWidth="3" />
        <circle cx="60" cy="42" r="6" fill="#FFD54F" />
        <path d="M0 58 Q15 50 30 58 Q45 66 60 58 Q75 50 90 58 Q105 66 120 58" stroke="#42A5F5" strokeWidth="2" fill="none" />
      </svg>
    ),
  };

  return vehicles[type] || vehicles.car;
};

// === HABITAT SVGs ===
export const HabitatSVG = ({ type, size = 60 }) => {
  const habitats = {
    farm: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="0" y="60" width="100" height="40" fill="#8BC34A" rx="5" />
        <rect x="25" y="30" width="50" height="40" rx="3" fill="#F44336" />
        <polygon points="20,30 50,8 80,30" fill="#D32F2F" />
        <rect x="42" y="45" width="16" height="25" fill="#795548" />
        <rect x="30" y="38" width="12" height="10" fill="#E3F2FD" />
        <rect x="58" y="38" width="12" height="10" fill="#E3F2FD" />
        <circle cx="85" cy="55" r="8" fill="#66BB6A" />
        <rect x="83" y="55" width="4" height="15" fill="#5D4037" />
      </svg>
    ),
    jungle: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="0" y="70" width="100" height="30" fill="#4CAF50" rx="5" />
        <rect x="20" y="30" width="8" height="50" fill="#795548" />
        <ellipse cx="24" cy="25" rx="20" ry="18" fill="#2E7D32" />
        <rect x="60" y="20" width="8" height="60" fill="#6D4C41" />
        <ellipse cx="64" cy="15" rx="25" ry="15" fill="#388E3C" />
        <ellipse cx="50" cy="80" rx="8" ry="5" fill="#66BB6A" />
        <path d="M10 70 Q20 62 30 70" fill="#43A047" />
        <path d="M70 70 Q80 62 90 70" fill="#43A047" />
      </svg>
    ),
    ocean: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="0" y="0" width="100" height="100" fill="#1565C0" rx="8" />
        <path d="M0 40 Q15 30 30 40 Q45 50 60 40 Q75 30 90 40 L100 40 L100 55 L0 55Z" fill="#1976D2" />
        <path d="M0 55 Q15 45 30 55 Q45 65 60 55 Q75 45 90 55 L100 55 L100 70 L0 70Z" fill="#1E88E5" />
        <path d="M0 70 Q15 60 30 70 Q45 80 60 70 Q75 60 90 70 L100 70 L100 100 L0 100Z" fill="#42A5F5" />
        <circle cx="70" cy="25" r="3" fill="rgba(255,255,255,0.4)" />
        <circle cx="30" cy="30" r="2" fill="rgba(255,255,255,0.3)" />
      </svg>
    ),
    sky: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="0" y="0" width="100" height="100" fill="#64B5F6" rx="8" />
        <circle cx="75" cy="25" r="15" fill="#FFD600" />
        <ellipse cx="30" cy="40" rx="20" ry="10" fill="white" opacity="0.8" />
        <ellipse cx="35" cy="35" rx="12" ry="8" fill="white" opacity="0.9" />
        <ellipse cx="70" cy="65" rx="18" ry="8" fill="white" opacity="0.7" />
        <ellipse cx="75" cy="60" rx="10" ry="7" fill="white" opacity="0.8" />
      </svg>
    ),
  };

  return habitats[type] || habitats.farm;
};

// === SHAPE SVGs ===
export const ShapeSVG = ({ type, size = 60, color = '#4CAF50' }) => {
  const shapes = {
    circle: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill={color} />
        <circle cx="38" cy="38" r="8" fill="rgba(255,255,255,0.3)" />
      </svg>
    ),
    square: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" rx="4" fill={color} />
        <rect x="18" y="18" width="15" height="15" rx="2" fill="rgba(255,255,255,0.25)" />
      </svg>
    ),
    triangle: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon points="50,8 95,90 5,90" fill={color} />
        <polygon points="50,25 38,55 62,55" fill="rgba(255,255,255,0.2)" />
      </svg>
    ),
    star: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon points="50,5 61,35 95,35 68,55 79,90 50,68 21,90 32,55 5,35 39,35" fill={color} />
        <polygon points="50,18 56,35 42,35" fill="rgba(255,255,255,0.25)" />
      </svg>
    ),
    diamond: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon points="50,5 95,50 50,95 5,50" fill={color} />
        <polygon points="50,20 35,50 50,50" fill="rgba(255,255,255,0.2)" />
      </svg>
    ),
    heart: (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <path d="M50 90 Q10 55 15 30 Q20 10 50 25 Q80 10 85 30 Q90 55 50 90Z" fill={color} />
        <ellipse cx="35" cy="30" rx="8" ry="6" fill="rgba(255,255,255,0.3)" />
      </svg>
    ),
  };

  return shapes[type] || shapes.circle;
};

// === MAPPING HELPERS ===
export const FRUIT_TYPES = ['apple', 'orange', 'grape', 'strawberry', 'banana', 'watermelon'];

export const VEHICLE_TYPES_MAP = {
  'kereta': 'car', 'car': 'car',
  'bas': 'bus', 'bus': 'bus',
  'kapal terbang': 'airplane', 'airplane': 'airplane',
  'kapal': 'ship', 'ship': 'ship',
  'helikopter': 'helicopter', 'helicopter': 'helicopter',
  'keretapi': 'train', 'train': 'train',
  'basikal': 'bicycle', 'bicycle': 'bicycle',
  'roket': 'rocket', 'rocket': 'rocket',
  'perahu layar': 'sailboat', 'sailboat': 'sailboat',
  'belon udara': 'balloon', 'hot air balloon': 'balloon',
  'motosikal': 'motorcycle', 'motorcycle': 'motorcycle',
  'ambulans': 'ambulance', 'ambulance': 'ambulance',
  'bot laju': 'speedboat', 'speedboat': 'speedboat',
  'kayak': 'kayak',
};
