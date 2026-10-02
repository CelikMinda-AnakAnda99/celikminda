// CelikMinda Toddlers — Bilingual Language System
// Bahasa Melayu MALAYSIA + English

const translations = {
  bm: {
    // App
    appName: 'CelikMinda Toddlers',
    tagline: 'Dunia Ajaib Pembelajaran',
    
    // Navigation
    home: 'Laman Utama',
    back: 'Kembali',
    settings: 'Tetapan',
    
    // World Map
    worldMapTitle: 'Pilih Dunia Pembelajaran',
    worldMapSubtitle: 'Jom belajar sambil bermain!',
    games: 'permainan',
    locked: 'Terkunci',
    unlockWith: 'Buka kunci dengan',
    stars: 'bintang',
    
    // Game UI
    score: 'Markah',
    round: 'Pusingan',
    of: 'daripada',
    findLetter: 'Cari huruf',
    tapBubble: 'Ketuk gelembung yang betul!',
    greatJob: 'Bagus sekali!',
    tryAgain: 'Cuba lagi!',
    awesome: 'Hebat!',
    perfect: 'Sempurna!',
    wellDone: 'Syabas!',
    oops: 'Alamak!',
    
    // Game Complete
    gameComplete: 'Tamat!',
    youEarned: 'Anda dapat',
    starsEarned: 'bintang',
    playAgain: 'Main Lagi',
    nextGame: 'Permainan Seterusnya',
    backToWorld: 'Kembali ke Dunia',
    
    // Characters
    mindaSays: 'Minda cakap:',
    kiraSays: 'Kira cakap:',
    bumiSays: 'Bumi cakap:',
    warnaSays: 'Warna cakap:',
    sihatSays: 'Sihat cakap:',
    
    // Greetings
    greeting: 'Hai',
    welcome: 'Selamat datang!',
    letsLearn: 'Jom belajar!',
    letsPlay: 'Jom main!',
    goodMorning: 'Selamat pagi!',
    goodAfternoon: 'Selamat tengah hari!',
    goodEvening: 'Selamat petang!',
    
    // World Names
    worlds: {
      abc: { name: 'Gua Huruf', desc: 'Belajar ABC dengan Minda!' },
      numbers: { name: 'Istana Nombor', desc: 'Kira bersama Kira!' },
      animals: { name: 'Hutan Haiwan', desc: 'Jelajah dunia haiwan!' },
      colours: { name: 'Studio Warna', desc: 'Dunia warna-warni!' },
      transport: { name: 'Stesen Pengangkutan', desc: 'Kenderaan di mana-mana!' },
      food: { name: 'Pasar Buah', desc: 'Makanan sihat & sedap!' },
      body: { name: 'Badan Saya', desc: 'Kenali badan kita!' },
      shapes: { name: 'Taman Bentuk', desc: 'Bentuk ada di mana-mana!' },
      jobs: { name: 'Kampung Pekerjaan', desc: 'Nak jadi apa bila besar?' },
      music: { name: 'Dewan Muzik', desc: 'Muzik di mana-mana!' },
      'world-explorer': { name: 'Penjelajah Dunia', desc: 'Jelajah seluruh dunia!' },
      science: { name: 'Makmal Sains', desc: 'Eksperimen yang seru!' },
    },
    
    // Game Names (ABC World)
    gameNames: {
      'letter-trail': { name: 'Jejak Huruf', desc: 'Lukis huruf yang hidup!' },
      'letter-tree': { name: 'Pokok Huruf', desc: 'Petik buah huruf yang betul!' },
      'bee-flower': { name: 'Lebah & Bunga', desc: 'Padankan huruf besar dan kecil!' },
      'syllable-factory': { name: 'Bijak Suku Kata', desc: 'Bina perkataan di kilang!' },
      'letter-bubbles': { name: 'Tembak Huruf', desc: 'Pecahkan gelembung huruf!' },
      'letter-puzzle': { name: 'Puzzle Huruf', desc: 'Lengkapkan puzzle huruf!' },
      'abc-song': { name: 'Nyanyian ABC', desc: 'Nyanyi bersama Minda!' },
      'letter-stories': { name: 'Cerita Huruf', desc: 'Baca cerita huruf!' },
      'block-tower': { name: 'Menara Blok', desc: 'Susun blok yang betul!' },
      'count-objects': { name: 'Kira Benda', desc: 'Kira benda yang bergerak!' },
      'math-machine': { name: 'Mesin Matematik', desc: 'Mesin penambahan!' },
      'subtraction-shop': { name: 'Kedai Tolak', desc: 'Jual barang di gerai!' },
      'number-trace': { name: 'Jejak Nombor', desc: 'Lukis nombor 0-9!' },
      'bigger-smaller': { name: 'Besar & Kecil', desc: 'Mana yang lebih banyak?' },
      'patterns': { name: 'Corak & Pola', desc: 'Lengkapkan corak!' },
      'magic-dice': { name: 'Dadu Ajaib', desc: 'Goncang dan kira!' },
      'animal-homes': { name: 'Rumah Haiwan', desc: 'Seret haiwan ke habitat!' },
      'animal-sounds': { name: 'Bunyi Haiwan', desc: 'Dengar dan kenal pasti!' },
      'animal-puzzle': { name: 'Lengkap Haiwan', desc: 'Lengkapkan gambar haiwan!' },
      'animal-food': { name: 'Apa Dia Makan?', desc: 'Beri makan haiwan!' },
      'animal-encyclopedia': { name: 'Ensaiklopedia', desc: 'Kumpul lencana haiwan!' },
      'mimic-animal': { name: 'Tiru Haiwan', desc: 'Berlakon macam haiwan!' },
    },
    
    // Encouragements (random)
    encouragements: [
      'Pandainya!',
      'Betul!',
      'Hebat sangat!',
      'Bijak!',
      'Tepat sekali!',
      'Tahniah!',
      'Wah, pandai!',
      'Terbaik!',
    ],
    
    // Wrong answer responses (gentle)
    wrongResponses: [
      'Cuba lagi, sayang!',
      'Hampir betul!',
      'Tak apa, cuba sekali lagi!',
      'Jangan putus asa!',
    ],
    
    // Screen time
    timeForBreak: 'Masa untuk berehat!',
    takeBreak: 'Jom berehat sebentar ya!',
    
    // Language toggle
    switchLang: 'English',
    currentLang: 'BM',
  },
  
  en: {
    // App
    appName: 'CelikMinda Toddlers',
    tagline: 'The Magical World of Learning',
    
    // Navigation
    home: 'Home',
    back: 'Back',
    settings: 'Settings',
    
    // World Map
    worldMapTitle: 'Choose a Learning World',
    worldMapSubtitle: 'Let\'s learn while having fun!',
    games: 'games',
    locked: 'Locked',
    unlockWith: 'Unlock with',
    stars: 'stars',
    
    // Game UI
    score: 'Score',
    round: 'Round',
    of: 'of',
    findLetter: 'Find the letter',
    tapBubble: 'Tap the correct bubble!',
    greatJob: 'Great job!',
    tryAgain: 'Try again!',
    awesome: 'Awesome!',
    perfect: 'Perfect!',
    wellDone: 'Well done!',
    oops: 'Oops!',
    
    // Game Complete
    gameComplete: 'Complete!',
    youEarned: 'You earned',
    starsEarned: 'stars',
    playAgain: 'Play Again',
    nextGame: 'Next Game',
    backToWorld: 'Back to World',
    
    // Characters
    mindaSays: 'Minda says:',
    kiraSays: 'Kira says:',
    bumiSays: 'Bumi says:',
    warnaSays: 'Warna says:',
    sihatSays: 'Sihat says:',
    
    // Greetings
    greeting: 'Hi',
    welcome: 'Welcome!',
    letsLearn: 'Let\'s learn!',
    letsPlay: 'Let\'s play!',
    goodMorning: 'Good morning!',
    goodAfternoon: 'Good afternoon!',
    goodEvening: 'Good evening!',
    
    // World Names
    worlds: {
      abc: { name: 'Letter Cave', desc: 'Learn ABC with Minda!' },
      numbers: { name: 'Number Castle', desc: 'Count with Kira!' },
      animals: { name: 'Animal Forest', desc: 'Explore the animal world!' },
      colours: { name: 'Colour Studio', desc: 'A colourful world!' },
      transport: { name: 'Transport Station', desc: 'Vehicles everywhere!' },
      food: { name: 'Fruit Market', desc: 'Healthy & yummy food!' },
      body: { name: 'My Body', desc: 'Know our body!' },
      shapes: { name: 'Shape Garden', desc: 'Shapes are everywhere!' },
      jobs: { name: 'Job Village', desc: 'What do you want to be?' },
      music: { name: 'Music Hall', desc: 'Music everywhere!' },
      'world-explorer': { name: 'World Explorer', desc: 'Explore the whole world!' },
      science: { name: 'Science Lab', desc: 'Fun experiments!' },
    },
    
    // Game Names
    gameNames: {
      'letter-trail': { name: 'Letter Trail', desc: 'Trace letters that come alive!' },
      'letter-tree': { name: 'Letter Tree', desc: 'Pick the right letter fruit!' },
      'bee-flower': { name: 'Bee & Flower', desc: 'Match upper to lowercase!' },
      'syllable-factory': { name: 'Syllable Factory', desc: 'Build words in the factory!' },
      'letter-bubbles': { name: 'Letter Bubbles', desc: 'Pop the right letter bubble!' },
      'letter-puzzle': { name: 'Letter Puzzle', desc: 'Complete the letter puzzle!' },
      'abc-song': { name: 'ABC Song', desc: 'Sing along with Minda!' },
      'letter-stories': { name: 'Letter Stories', desc: 'Read fun letter adventures!' },
      'block-tower': { name: 'Block Tower', desc: 'Stack the right blocks!' },
      'count-objects': { name: 'Count Objects', desc: 'Count moving objects!' },
      'math-machine': { name: 'Math Machine', desc: 'Addition vending machine!' },
      'subtraction-shop': { name: 'Subtraction Shop', desc: 'Sell items at the stall!' },
      'number-trace': { name: 'Number Tracing', desc: 'Trace numbers 0-9!' },
      'bigger-smaller': { name: 'Bigger & Smaller', desc: 'Which group has more?' },
      'patterns': { name: 'Patterns', desc: 'Complete the pattern!' },
      'magic-dice': { name: 'Magic Dice', desc: 'Roll and count!' },
      'animal-homes': { name: 'Animal Homes', desc: 'Drag animals to habitats!' },
      'animal-sounds': { name: 'Animal Sounds', desc: 'Hear and identify!' },
      'animal-puzzle': { name: 'Animal Puzzle', desc: 'Complete the animal!' },
      'animal-food': { name: 'What Do They Eat?', desc: 'Feed the animals!' },
      'animal-encyclopedia': { name: 'Encyclopedia', desc: 'Collect animal badges!' },
      'mimic-animal': { name: 'Mimic Animal', desc: 'Act like an animal!' },
    },
    
    // Encouragements
    encouragements: [
      'So clever!',
      'Correct!',
      'Amazing!',
      'Brilliant!',
      'Spot on!',
      'Congratulations!',
      'Wow, smart!',
      'The best!',
    ],
    
    // Wrong answer responses
    wrongResponses: [
      'Try again, sweetie!',
      'Almost right!',
      'That\'s okay, try once more!',
      'Don\'t give up!',
    ],
    
    // Screen time
    timeForBreak: 'Time for a break!',
    takeBreak: 'Let\'s take a short rest!',
    
    // Language toggle
    switchLang: 'Melayu',
    currentLang: 'EN',
  }
};

export function t(key, lang = 'bm') {
  const keys = key.split('.');
  let result = translations[lang];
  for (const k of keys) {
    if (result && result[k] !== undefined) {
      result = result[k];
    } else {
      return key; // fallback to key if not found
    }
  }
  return result;
}

export function getRandomEncouragement(lang = 'bm') {
  const list = translations[lang].encouragements;
  return list[Math.floor(Math.random() * list.length)];
}

export function getRandomWrongResponse(lang = 'bm') {
  const list = translations[lang].wrongResponses;
  return list[Math.floor(Math.random() * list.length)];
}

export function getGreeting(lang = 'bm') {
  const hour = new Date().getHours();
  if (hour < 12) return translations[lang].goodMorning;
  if (hour < 17) return translations[lang].goodAfternoon;
  return translations[lang].goodEvening;
}

export default translations;
