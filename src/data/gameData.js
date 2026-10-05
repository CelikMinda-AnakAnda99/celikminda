import { assetPath } from '@/utils/assetPath';
// CelikMinda Toddlers — Game Data
// All 12 worlds and their games
// Access tiers: 'mini' (RM49.90) = Worlds 1-6, 'complete' (RM99.90) = All 12

export const WORLDS = [
  {
    id: 'abc',
    name: 'Gua Huruf',
    nameEn: 'Letter Cave',
    icon: '',
    image: assetPath('/worlds/abc.jpg'),
    color: 'blue',
    guide: 'minda',
    description: 'Belajar ABC dengan Minda!',
    requiredPlan: 'mini',
    games: [
      { id: 'letter-trail', name: 'Jejak Huruf', nameEn: 'Letter Trail', icon: '', description: 'Trace letters that come alive!' },
      { id: 'letter-tree', name: 'Pokok Huruf', nameEn: 'Letter Tree', icon: '', description: 'Pick the right letter fruit!' },
      { id: 'bee-flower', name: 'Lebah & Bunga', nameEn: 'Bee & Flower', icon: '', description: 'Match uppercase to lowercase!' },
      { id: 'syllable-factory', name: 'Bijak Suku Kata', nameEn: 'Syllable Factory', icon: '', description: 'Build words in the factory!' },
      { id: 'letter-bubbles', name: 'Tembak Huruf', nameEn: 'Letter Bubbles', icon: '', description: 'Pop the right letter bubble!' },
      { id: 'letter-puzzle', name: 'Puzzle Huruf', nameEn: 'Letter Puzzle', icon: '', description: 'Complete the letter puzzle!' },
      { id: 'abc-song', name: 'Nyanyian ABC', nameEn: 'ABC Song', icon: '', description: 'Sing along with MINDA!' },
      { id: 'letter-stories', name: 'Cerita Huruf', nameEn: 'Letter Stories', icon: '', description: 'Read fun letter adventures!' },
    ]
  },
  {
    id: 'numbers',
    name: 'Istana Nombor',
    nameEn: 'Number Castle',
    icon: '',
    image: assetPath('/worlds/numbers.jpg'),
    color: 'pink',
    guide: 'kira',
    description: 'Kira bersama Kira!',
    requiredPlan: 'mini',
    games: [
      { id: 'block-tower', name: 'Menara Blok', nameEn: 'Block Tower', icon: '', description: 'Stack the right number of blocks!' },
      { id: 'count-objects', name: 'Kira Benda', nameEn: 'Count Objects', icon: '', description: 'Count moving objects!' },
      { id: 'math-machine', name: 'Mesin Matematik', nameEn: 'Math Machine', icon: '', description: 'Addition vending machine!' },
      { id: 'subtraction-shop', name: 'Kedai Tolak', nameEn: 'Subtraction Shop', icon: '', description: 'Sell items at the stall!' },
      { id: 'number-trace', name: 'Jejak Nombor', nameEn: 'Number Tracing', icon: '', description: 'Trace numbers 0-9!' },
      { id: 'bigger-smaller', name: 'Besar & Kecil', nameEn: 'Bigger & Smaller', icon: '', description: 'Which group has more?' },
      { id: 'patterns', name: 'Corak & Pola', nameEn: 'Patterns', icon: '', description: 'Complete the pattern!' },
      { id: 'magic-dice', name: 'Dadu Ajaib', nameEn: 'Magic Dice', icon: '', description: 'Roll and count!' },
    ]
  },
  {
    id: 'animals',
    name: 'Hutan Haiwan',
    nameEn: 'Animal Forest',
    icon: '',
    image: assetPath('/worlds/animals.jpg'),
    color: 'green',
    guide: 'bumi',
    description: 'Jelajah dunia haiwan!',
    requiredPlan: 'mini',
    games: [
      { id: 'animal-homes', name: 'Rumah Haiwan', nameEn: 'Animal Homes', icon: '', description: 'Drag animals to habitats!' },
      { id: 'animal-sounds', name: 'Bunyi Haiwan', nameEn: 'Animal Sounds', icon: '', description: 'Hear and identify!' },
      { id: 'animal-puzzle', name: 'Lengkap Haiwan', nameEn: 'Animal Puzzle', icon: '', description: 'Complete the animal!' },
      { id: 'animal-food', name: 'Apa Dia Makan?', nameEn: 'What Do They Eat?', icon: '', description: 'Feed the animals!' },
      { id: 'animal-encyclopedia', name: 'Ensaiklopedia', nameEn: 'Encyclopedia', icon: '', description: 'Collect animal badges!' },
      { id: 'mimic-animal', name: 'Tiru Haiwan', nameEn: 'Mimic Animal', icon: '', description: 'Act like an animal!' },
    ]
  },
  {
    id: 'colours',
    name: 'Studio Warna',
    nameEn: 'Colour Studio',
    icon: '',
    image: assetPath('/worlds/colours.jpg'),
    color: 'purple',
    guide: 'warna',
    description: 'Dunia warna-warni!',
    requiredPlan: 'mini',
    games: [
      { id: 'colour-mixing', name: 'Campur Warna', nameEn: 'Colour Mixing', icon: '', description: 'Mix colours in the lab!' },
      { id: 'magic-colouring', name: 'Mewarna Ajaib', nameEn: 'Magic Colouring', icon: '', description: 'Colour and watch it animate!' },
      { id: 'match-colour', name: 'Padankan Warna', nameEn: 'Match Colour', icon: '', description: 'Match names to colours!' },
      { id: 'sock-pairs', name: 'Pasangan Stokin', nameEn: 'Sock Pairs', icon: '', description: 'Find matching socks!' },
      { id: 'colour-hunter', name: 'Pemburu Warna', nameEn: 'Colour Hunter', icon: '', description: 'Find colours around you!' },
      { id: 'free-draw', name: 'Lukis Bersama', nameEn: 'Draw Together', icon: '', description: 'Free drawing canvas!' },
    ]
  },
  {
    id: 'transport',
    name: 'Stesen Pengangkutan',
    nameEn: 'Transport Station',
    icon: '',
    image: assetPath('/worlds/transport.jpg'),
    color: 'orange',
    guide: 'bumi',
    description: 'Kenderaan di mana-mana!',
    requiredPlan: 'mini',
    games: [
      { id: 'build-vehicle', name: 'Bina Kenderaan', nameEn: 'Build Vehicle', icon: '', description: 'Build your own vehicle!' },
      { id: 'sort-transport', name: 'Susun Kenderaan', nameEn: 'Sort Transport', icon: '', description: 'Land, Air, or Water?' },
      { id: 'road-safety', name: 'Jalan Raya', nameEn: 'Road Safety', icon: '', description: 'Control the traffic light!' },
      { id: 'world-vehicles', name: 'Kenderaan Dunia', nameEn: 'World Vehicles', icon: '', description: 'Explore unique vehicles!' },
    ]
  },
  {
    id: 'food',
    name: 'Pasar Buah',
    nameEn: 'Fruit Market',
    icon: '',
    image: assetPath('/worlds/food.jpg'),
    color: 'red',
    guide: 'sihat',
    description: 'Makanan sihat & sedap!',
    requiredPlan: 'mini',
    games: [
      { id: 'grocery-store', name: 'Kedai Runcit', nameEn: 'Grocery Store', icon: '', description: 'Shop for ingredients!' },
      { id: 'our-garden', name: 'Kebun Kita', nameEn: 'Our Garden', icon: '', description: 'Grow your own food!' },
      { id: 'little-chef', name: 'Chef Kecil', nameEn: 'Little Chef', icon: '', description: 'Cook a delicious meal!' },
      { id: 'healthy-or-not', name: 'Sihat atau Tidak?', nameEn: 'Healthy or Not?', icon: '', description: 'Sort healthy foods!' },
      { id: 'fruit-or-veg', name: 'Buah atau Sayur?', nameEn: 'Fruit or Veg?', icon: '', description: 'Classify the food!' },
    ]
  },
  {
    id: 'body',
    name: 'Badan Saya',
    nameEn: 'My Body',
    icon: '',
    image: assetPath('/worlds/body.jpg'),
    color: 'teal',
    guide: 'sihat',
    description: 'Kenali badan kita!',
    requiredPlan: 'complete',
    games: [
      { id: 'label-body', name: 'Labelkan Badan', nameEn: 'Label the Body', icon: '', description: 'Drag labels to body parts!' },
      { id: 'move-together', name: 'Bergerak Bersama', nameEn: 'Move Together', icon: '', description: 'Follow the movements!' },
      { id: 'healthy-habits', name: 'Tabiat Sihat', nameEn: 'Healthy Habits', icon: '', description: 'Morning routine game!' },
      { id: 'little-doctor', name: 'Doktor Kecil', nameEn: 'Little Doctor', icon: '', description: 'Help sick animal friends!' },
      { id: 'body-song', name: 'Lagu Badan', nameEn: 'Body Song', icon: '', description: 'Head, shoulders, knees!' },
    ]
  },
  {
    id: 'shapes',
    name: 'Taman Bentuk',
    nameEn: 'Shape Garden',
    icon: '',
    image: assetPath('/worlds/shapes.jpg'),
    color: 'blue',
    guide: 'kira',
    description: 'Bentuk ada di mana-mana!',
    requiredPlan: 'complete',
    games: [
      { id: 'shape-hunt', name: 'Cari Bentuk', nameEn: 'Shape Hunt', icon: '', description: 'Find shapes in scenes!' },
      { id: 'magic-tangram', name: 'Tangram Ajaib', nameEn: 'Magic Tangram', icon: '', description: 'Classic tangram puzzles!' },
      { id: 'draw-shapes', name: 'Lukis Bentuk', nameEn: 'Draw Shapes', icon: '', description: 'Trace and transform!' },
      { id: 'build-pictures', name: 'Bina Gambar', nameEn: 'Build Pictures', icon: '', description: 'Create with shapes!' },
      { id: '3d-shapes', name: 'Bentuk 3D', nameEn: '3D Shapes', icon: '', description: 'Explore 3D shapes!' },
    ]
  },
  {
    id: 'jobs',
    name: 'Kampung Pekerjaan',
    nameEn: 'Job Village',
    icon: '',
    image: assetPath('/worlds/jobs.jpg'),
    color: 'orange',
    guide: 'bumi',
    description: 'Nak jadi apa?',
    requiredPlan: 'complete',
    games: [
      { id: 'role-play', name: 'Main Peranan', nameEn: 'Role Play', icon: '', description: '10 profession mini-games!' },
      { id: 'job-tools', name: 'Alat Pekerjaan', nameEn: 'Job Tools', icon: '', description: 'Match tools to jobs!' },
      { id: 'visit-workplace', name: 'Lawat Tempat Kerja', nameEn: 'Visit Workplace', icon: '', description: 'Explore workplaces!' },
      { id: 'who-am-i', name: 'Siapa Saya?', nameEn: 'Who Am I?', icon: '', description: 'Riddle guessing game!' },
    ]
  },
  {
    id: 'music',
    name: 'Dewan Muzik',
    nameEn: 'Music Hall',
    icon: '',
    image: assetPath('/worlds/music.jpg'),
    color: 'purple',
    guide: 'minda',
    description: 'Muzik di mana-mana!',
    requiredPlan: 'complete',
    games: [
      { id: 'instruments', name: 'Alat Muzik', nameEn: 'Instruments', icon: '', description: 'Play virtual instruments!' },
      { id: 'follow-beat', name: 'Ikut Rentak', nameEn: 'Follow the Beat', icon: '', description: 'Repeat the rhythm!' },
      { id: 'childrens-songs', name: 'Lagu Kanak-Kanak', nameEn: 'Children Songs', icon: '', description: 'Sing along!' },
      { id: 'learn-notes', name: 'Belajar Nota', nameEn: 'Learn Notes', icon: '', description: 'Do Re Mi!' },
    ]
  },
  {
    id: 'world-explorer',
    name: 'Penjelajah Dunia',
    nameEn: 'World Explorer',
    icon: '',
    image: assetPath('/worlds/world-explorer.jpg'),
    color: 'teal',
    guide: 'bumi',
    description: 'Jelajah seluruh dunia!',
    requiredPlan: 'complete',
    games: [
      { id: 'world-map', name: 'Peta Dunia', nameEn: 'World Map', icon: '', description: 'Explore countries!' },
      { id: 'world-houses', name: 'Rumah Dunia', nameEn: 'World Houses', icon: '', description: 'See different homes!' },
      { id: 'world-festivals', name: 'Perayaan Dunia', nameEn: 'World Festivals', icon: '', description: 'Learn celebrations!' },
    ]
  },
  {
    id: 'science',
    name: 'Makmal Sains',
    nameEn: 'Science Lab',
    icon: '',
    image: assetPath('/worlds/science.jpg'),
    color: 'yellow',
    guide: 'kira',
    description: 'Eksperimen seru!',
    requiredPlan: 'complete',
    games: [
      { id: 'weather', name: 'Cuaca', nameEn: 'Weather', icon: '', description: 'Control the weather!' },
      { id: 'plants', name: 'Tumbuhan', nameEn: 'Plants', icon: '', description: 'Grow a plant!' },
      { id: 'experiments', name: 'Eksperimen', nameEn: 'Experiments', icon: '', description: 'Sink or Float?' },
      { id: 'day-night', name: 'Siang & Malam', nameEn: 'Day & Night', icon: '', description: 'Explore day and night!' },
    ]
  }
];

export const GUIDES = {
  minda: { name: 'Minda', image: assetPath('/characters/minda.jpg'), color: '#4A90D9' },
  kira: { name: 'Kira', image: assetPath('/characters/kira.jpg'), color: '#FF6B9D' },
  bumi: { name: 'Bumi', image: assetPath('/characters/bumi.jpg'), color: '#6BCB77' },
  warna: { name: 'Warna', image: assetPath('/characters/warna.jpg'), color: '#9B72CF' },
  sihat: { name: 'Sihat', image: assetPath('/characters/sihat.jpg'), color: '#FF8C42' },
};

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const BUBBLE_COLORS = [
  'linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%)',
  'linear-gradient(135deg, #4A90D9 0%, #667eea 100%)',
  'linear-gradient(135deg, #6BCB77 0%, #48C9B0 100%)',
  'linear-gradient(135deg, #9B72CF 0%, #764ba2 100%)',
  'linear-gradient(135deg, #FFD93D 0%, #FFA726 100%)',
  'linear-gradient(135deg, #FF6B6B 0%, #ee5a24 100%)',
  'linear-gradient(135deg, #48C9B0 0%, #00b894 100%)',
  'linear-gradient(135deg, #FF8C42 0%, #e17055 100%)',
];

// ════════════════════════════════════════════
// 💰 PACKAGE DEFINITIONS — Two-Tier Model
// ════════════════════════════════════════════
export const PACKAGES = {
  mini: {
    id: 'mini',
    name: 'CelikMinda Mini',
    nameEn: 'CelikMinda Mini',
    icon: '',
    price: 49.90,
    priceFormatted: 'RM49.90',
    worlds: 6,
    games: 37,
    description: '6 Dunia Pembelajaran • 37 Permainan',
    descriptionEn: '6 Learning Worlds • 37 Games',
    color: '#6BCB77',
  },
  complete: {
    id: 'complete',
    name: 'CelikMinda Lengkap',
    nameEn: 'CelikMinda Complete',
    icon: '',
    price: 99.90,
    priceFormatted: 'RM99.90',
    worlds: 12,
    games: 62,
    description: '12 Dunia Pembelajaran • 62 Permainan',
    descriptionEn: '12 Learning Worlds • 62 Games',
    color: '#FFD93D',
    upgradePrice: 50.00,
    upgradePriceFormatted: 'RM50.00',
    upgradeDescription: 'Naik Taraf: Tambah 6 Dunia + 25 Permainan',
    upgradeDescriptionEn: 'Upgrade: Add 6 Worlds + 25 Games',
  },
};

// Plan hierarchy: complete > mini > free
const PLAN_HIERARCHY = { free: 0, mini: 1, complete: 2 };

// Centralized entitlement: does user's plan cover this world?
export function canAccessWorld(userPlan, worldId) {
  const world = WORLDS.find(w => w.id === worldId);
  if (!world) return false;
  const userLevel = PLAN_HIERARCHY[userPlan] || 0;
  const requiredLevel = PLAN_HIERARCHY[world.requiredPlan] || 0;
  return userLevel >= requiredLevel;
}

// Centralized entitlement: does user's plan cover this game?
export function canAccessGame(userPlan, worldId, gameId) {
  return canAccessWorld(userPlan, worldId);
}

// Get worlds filtered by plan tier
export const MINI_WORLDS = WORLDS.filter(w => w.requiredPlan === 'mini');
export const COMPLETE_ONLY_WORLDS = WORLDS.filter(w => w.requiredPlan === 'complete');

// Count games per tier
export const MINI_GAME_COUNT = MINI_WORLDS.reduce((sum, w) => sum + w.games.length, 0);
export const COMPLETE_GAME_COUNT = WORLDS.reduce((sum, w) => sum + w.games.length, 0);
export const COMPLETE_ONLY_GAME_COUNT = COMPLETE_ONLY_WORLDS.reduce((sum, w) => sum + w.games.length, 0);
