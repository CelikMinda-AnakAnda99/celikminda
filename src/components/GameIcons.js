'use client';
/**
 * GameIcons.js — Comprehensive SVG icon system for CelikMinda
 * Replaces ALL emojis with premium inline SVGs
 * 299 unique icons organized by category
 */

// Universal icon renderer — takes a name string, returns inline SVG JSX
// Usage: ico('apple') or ico('cat', 48)
export function ico(name, size) {
  const sz = size || 'inherit';
  const style = { 
    width: typeof sz === 'number' ? `${sz}px` : '1.2em', 
    height: typeof sz === 'number' ? `${sz}px` : '1.2em', 
    verticalAlign: 'middle', 
    display: 'inline-block',
    flexShrink: 0
  };
  
  const icon = ICON_MAP[name];
  if (!icon) {
    // Fallback: render the name as text with a colored circle
    return <span style={{...style, background: 'linear-gradient(135deg, #FFD93D, #FF9800)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5em', fontWeight: 700, color: '#fff'}}>{(name || '?')[0].toUpperCase()}</span>;
  }
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={icon.vb || '0 0 64 64'} style={style} aria-label={name}>
      {icon.d}
    </svg>
  );
}

// Shorthand for rendering icon with text label
export function icoLabel(name, label, size) {
  return <span style={{display:'inline-flex',alignItems:'center',gap:'6px'}}>{ico(name, size)}<span>{label}</span></span>;
}

// ═══ ICON DEFINITIONS ═══
// Each icon is {vb: viewBox, d: JSX paths}
const ICON_MAP = {
  // ─── FRUITS ───
  apple: { d: <><circle cx="32" cy="36" r="22" fill="#E53935"/><ellipse cx="32" cy="36" rx="22" ry="20" fill="#EF5350"/><path d="M32 14c2-6 8-8 12-7" stroke="#4CAF50" strokeWidth="3" fill="none"/><ellipse cx="36" cy="12" rx="6" ry="4" fill="#66BB6A"/></> },
  orange: { d: <><circle cx="32" cy="34" r="22" fill="#FF9800"/><circle cx="32" cy="34" r="20" fill="#FFB74D"/><path d="M32 12c1-4 5-6 8-5" stroke="#4CAF50" strokeWidth="2.5" fill="none"/><ellipse cx="36" cy="10" rx="5" ry="3" fill="#66BB6A"/></> },
  lemon: { d: <><ellipse cx="32" cy="34" rx="20" ry="18" fill="#FDD835" transform="rotate(-15 32 34)"/><ellipse cx="32" cy="34" rx="18" ry="16" fill="#FFEE58" transform="rotate(-15 32 34)"/><path d="M32 16c1-4 4-5 7-4" stroke="#7CB342" strokeWidth="2" fill="none"/></> },
  grapes: { d: <>{[0,1,2,3,4,5,6,7,8].map((i)=><circle key={i} cx={26+((i%3)*8)} cy={24+Math.floor(i/3)*9} r="6" fill={i%2?"#7B1FA2":"#9C27B0"}/>)}<path d="M32 14c2-6 6-7 9-5" stroke="#4CAF50" strokeWidth="2" fill="none"/></> },
  strawberry: { d: <><path d="M20 22c0-8 12-16 12-16s12 8 12 16c0 14-8 26-12 28s-12-14-12-28z" fill="#E53935"/><path d="M20 22c0-8 12-16 12-16s12 8 12 16" fill="#EF5350"/>{[0,1,2,3,4,5].map(i=><circle key={i} cx={26+((i%2)*12)} cy={26+Math.floor(i/2)*8} r="1.5" fill="#FFEE58"/>)}<path d="M28 8l4-4 4 4" stroke="#4CAF50" strokeWidth="2.5" fill="#66BB6A"/></> },
  blueberry: { d: <><circle cx="32" cy="34" r="18" fill="#3F51B5"/><circle cx="32" cy="34" r="16" fill="#5C6BC0"/><circle cx="32" cy="22" r="3" fill="#283593"/><path d="M29 20l3-2 3 2" stroke="#283593" strokeWidth="1.5" fill="none"/></> },
  peach: { d: <><circle cx="32" cy="36" r="20" fill="#FFB74D"/><circle cx="32" cy="36" r="18" fill="#FFCC80"/><path d="M32 16c3 0 5 4 4 8" stroke="#EF6C00" strokeWidth="1" fill="none"/><path d="M30 14c2-5 6-6 9-4" stroke="#66BB6A" strokeWidth="2" fill="none"/><ellipse cx="34" cy="12" rx="5" ry="3" fill="#81C784"/></> },
  kiwi: { d: <><ellipse cx="32" cy="34" rx="18" ry="20" fill="#795548"/><ellipse cx="32" cy="34" rx="15" ry="17" fill="#8BC34A"/><circle cx="32" cy="34" r="4" fill="#F5F5F5"/>{[0,1,2,3,4,5].map(i=><circle key={i} cx={32+Math.cos(i*1.05)*10} cy={34+Math.sin(i*1.05)*10} r="1" fill="#33691E"/>)}</> },
  cherry: { d: <><circle cx="24" cy="42" r="12" fill="#C62828"/><circle cx="40" cy="38" r="12" fill="#D32F2F"/><path d="M24 30c4-12 8-18 12-22" stroke="#4CAF50" strokeWidth="2.5" fill="none"/><path d="M40 26c0-10 2-16 4-20" stroke="#4CAF50" strokeWidth="2.5" fill="none"/><ellipse cx="40" cy="8" rx="6" ry="4" fill="#66BB6A"/></> },
  banana: { d: <><path d="M16 48c4-4 8-32 24-38s16 2 14 6-20 24-28 32z" fill="#FFD54F"/><path d="M16 48c4-4 8-32 24-38s16 2 14 6" fill="#FFEB3B"/></> },
  tomato: { d: <><circle cx="32" cy="36" r="20" fill="#E53935"/><circle cx="32" cy="36" r="18" fill="#EF5350"/><path d="M22 20l5-2 5 0 5 0 5 2" stroke="#4CAF50" strokeWidth="3" fill="#66BB6A"/></> },
  eggplant: { d: <><ellipse cx="32" cy="38" rx="14" ry="22" fill="#6A1B9A" transform="rotate(15 32 38)"/><ellipse cx="32" cy="38" rx="12" ry="20" fill="#7B1FA2" transform="rotate(15 32 38)"/><path d="M28 16c0-6 4-10 8-8" stroke="#4CAF50" strokeWidth="3" fill="#66BB6A"/></> },
  corn: { d: <><ellipse cx="32" cy="34" rx="12" ry="22" fill="#FDD835"/><ellipse cx="32" cy="34" rx="10" ry="20" fill="#FFEE58"/>{[0,1,2,3,4].map(i=><>{[0,1,2].map(j=><circle key={`${i}${j}`} cx={26+j*6} cy={18+i*8} r="3" fill="#F9A825"/>)}</>)}<path d="M22 14l-6-8M42 14l6-8" stroke="#66BB6A" strokeWidth="2" fill="none"/></> },
  avocado: { d: <><ellipse cx="32" cy="36" rx="18" ry="22" fill="#558B2F"/><ellipse cx="32" cy="36" rx="14" ry="18" fill="#8BC34A"/><circle cx="32" cy="40" r="10" fill="#795548"/></> },
  
  // ─── VEGETABLES ───
  carrot: { d: <><path d="M32 8l-12 44c0 4 24 4 24 0z" fill="#FF9800"/><path d="M32 8l-10 40" fill="#FFB74D"/><path d="M26 8c-4-6-2-8 2-6M32 4c0-6 4-6 6-2M38 8c4-4 6-2 4 2" stroke="#4CAF50" strokeWidth="2.5" fill="#66BB6A"/></> },
  broccoli: { d: <><rect x="28" y="36" width="8" height="20" rx="3" fill="#689F38"/><circle cx="24" cy="30" r="10" fill="#4CAF50"/><circle cx="36" cy="28" r="10" fill="#66BB6A"/><circle cx="30" cy="22" r="10" fill="#43A047"/></> },
  cucumber: { d: <><ellipse cx="32" cy="34" rx="10" ry="24" fill="#558B2F" transform="rotate(20 32 34)"/><ellipse cx="32" cy="34" rx="8" ry="22" fill="#689F38" transform="rotate(20 32 34)"/>{[0,1,2,3].map(i=><circle key={i} cx={30+i*1} cy={18+i*10} r="1.5" fill="#33691E"/>)}</> },
  lettuce: { d: <><ellipse cx="32" cy="34" rx="22" ry="18" fill="#7CB342"/><ellipse cx="32" cy="30" rx="18" ry="14" fill="#8BC34A"/><ellipse cx="32" cy="26" rx="14" ry="10" fill="#9CCC65"/><ellipse cx="32" cy="24" rx="10" ry="6" fill="#C5E1A5"/></> },
  garlic: { d: <><path d="M20 34c0-12 6-22 12-24s12 12 12 24c0 8-6 14-12 16s-12-8-12-16z" fill="#F5F5F5"/><path d="M32 10l0 8" stroke="#E0E0E0" strokeWidth="1"/><path d="M28 14l4-4 4 4" stroke="#9E9E9E" strokeWidth="2" fill="none"/></> },
  onion: { d: <><ellipse cx="32" cy="38" rx="18" ry="16" fill="#FFCC80"/><ellipse cx="32" cy="38" rx="16" ry="14" fill="#FFE0B2"/><path d="M30 22c2-8 4-12 2-16M34 22c-2-8-4-12-2-16" stroke="#8BC34A" strokeWidth="2" fill="none"/></> },
  potato: { d: <><ellipse cx="32" cy="36" rx="20" ry="16" fill="#8D6E63"/><ellipse cx="32" cy="36" rx="18" ry="14" fill="#A1887F"/>{[0,1,2,3].map(i=><circle key={i} cx={24+i*6} cy={34+((i%2)*4)} r="1.5" fill="#6D4C41"/>)}</> },
  pepper: { d: <><path d="M24 20c-4 12-2 28 8 32s16-16 12-32z" fill="#4CAF50"/><path d="M32 8c0-4 4-4 6 0" stroke="#388E3C" strokeWidth="2.5" fill="none"/></> },
  
  // ─── FOOD ───
  burger: { d: <><ellipse cx="32" cy="16" rx="22" ry="8" fill="#FF8F00"/><rect x="10" y="24" width="44" height="6" rx="2" fill="#4CAF50"/><rect x="10" y="30" width="44" height="6" rx="2" fill="#E53935"/><rect x="10" y="36" width="44" height="6" rx="2" fill="#FFD54F"/><ellipse cx="32" cy="48" rx="22" ry="8" fill="#FFA000"/></> },
  pizza: { d: <><path d="M32 8L8 52h48z" fill="#FDD835"/><path d="M32 8L8 52h48z" fill="#FFE082" opacity="0.5"/><circle cx="24" cy="36" r="4" fill="#E53935"/><circle cx="36" cy="32" r="4" fill="#E53935"/><circle cx="30" cy="44" r="4" fill="#E53935"/></> },
  fries: { d: <><rect x="16" y="28" width="32" height="28" rx="4" fill="#E53935"/>{[0,1,2,3,4].map(i=><rect key={i} x={20+i*5} y={8+i*2} width="5" height="28" rx="2" fill="#FDD835"/>)}</> },
  bread: { d: <><ellipse cx="32" cy="36" rx="24" ry="16" fill="#E8A735"/><ellipse cx="32" cy="32" rx="20" ry="12" fill="#F0C05A"/><path d="M18 32c8-4 20-4 28 0" stroke="#D4941A" strokeWidth="1.5" fill="none"/></> },
  rice: { d: <><path d="M12 24c0 0 4 28 20 28s20-28 20-28z" fill="#F5F5F5"/><ellipse cx="32" cy="24" rx="20" ry="4" fill="#E0E0E0"/>{[0,1,2,3,4].map(i=><ellipse key={i} cx={22+i*5} cy={32+i*3} rx="3" ry="2" fill="#FAFAFA"/>)}</> },
  egg: { d: <><circle cx="32" cy="34" r="24" fill="#F5F5F5"/><circle cx="32" cy="34" r="14" fill="#FFD54F"/></> },
  hotdog: { d: <><rect x="8" y="26" width="48" height="12" rx="6" fill="#D84315"/><path d="M10 28c8 4 16-2 24 2s12 2 18-2" stroke="#FDD835" strokeWidth="2" fill="none"/><ellipse cx="32" cy="24" rx="26" ry="4" fill="#FFE082"/><ellipse cx="32" cy="40" rx="26" ry="4" fill="#FFE082"/></> },
  cake: { d: <><rect x="12" y="28" width="40" height="24" rx="4" fill="#FFB74D"/><rect x="12" y="28" width="40" height="8" rx="4" fill="#F48FB1"/><path d="M12 36c4 4 8-2 12 2s8-2 12 2 8-2 12 0" fill="#E91E63" opacity="0.3"/><rect x="30" y="16" width="4" height="14" rx="2" fill="#FFEB3B"/><circle cx="32" cy="14" r="3" fill="#FF5722"/></> },
  donut: { d: <><circle cx="32" cy="32" r="22" fill="#E8A735"/><circle cx="32" cy="32" r="8" fill="#FFF9C4"/><circle cx="32" cy="32" r="22" fill="none" stroke="#F48FB1" strokeWidth="8" strokeDasharray="8 4"/></> },
  cookie: { d: <><circle cx="32" cy="32" r="22" fill="#D4941A"/><circle cx="32" cy="32" r="20" fill="#E8A735"/>{[0,1,2,3,4].map(i=><circle key={i} cx={24+((i%3)*8)} cy={24+Math.floor(i/2)*12} r="3" fill="#5D4037"/>)}</> },
  chocolate: { d: <><rect x="10" y="16" width="44" height="32" rx="4" fill="#5D4037"/><rect x="10" y="16" width="44" height="8" rx="4" fill="#795548"/>{[0,1,2].map(i=><>{[0,1].map(j=><rect key={`${i}${j}`} x={14+i*14} y={20+j*14} width="10" height="10" rx="2" fill="#4E342E"/>)}</>)}</> },
  candy: { d: <><circle cx="32" cy="32" r="14" fill="#E91E63"/><path d="M18 32c0-8 6-14 14-14" stroke="#F48FB1" strokeWidth="4" fill="none"/><path d="M14 28c-6-2-10-2-10 4s4 6 10 4" fill="#FFD54F"/><path d="M50 28c6-2 10-2 10 4s-4 6-10 4" fill="#FFD54F"/></> },
  lollipop: { d: <><rect x="30" y="40" width="4" height="20" rx="2" fill="#BDBDBD"/><circle cx="32" cy="28" r="16" fill="#E91E63"/><path d="M18 28c0-8 6-14 14-14" stroke="#F48FB1" strokeWidth="3" fill="none"/><path d="M22 20c4-4 12-4 16 0" stroke="#EC407A" strokeWidth="2" fill="none"/></> },
  honey: { d: <><rect x="16" y="20" width="32" height="28" rx="6" fill="#FFA000"/><rect x="16" y="20" width="32" height="8" rx="6" fill="#FFB300"/><ellipse cx="32" cy="16" rx="18" ry="4" fill="#FF8F00"/><path d="M28 28l4 8 4-8" stroke="#FF6F00" strokeWidth="1.5" fill="none"/></> },
  cupcake: { d: <><path d="M18 32l4 24h20l4-24z" fill="#FFE082"/><circle cx="32" cy="26" r="14" fill="#F48FB1"/><circle cx="32" cy="20" r="4" fill="#E53935"/></> },
  pie: { d: <><ellipse cx="32" cy="40" rx="24" ry="12" fill="#E8A735"/><ellipse cx="32" cy="36" rx="24" ry="12" fill="#F0C05A"/><path d="M8 36l24-22 24 22" fill="#E8A735"/></> },
  cheese: { d: <><path d="M8 48l24-36 24 36z" fill="#FDD835"/><path d="M8 48l24-36 24 36z" fill="#FFEE58" opacity="0.5"/><circle cx="24" cy="38" r="4" fill="#F9A825"/><circle cx="36" cy="42" r="3" fill="#F9A825"/></> },
  salt: { d: <><rect x="20" y="16" width="24" height="36" rx="4" fill="#ECEFF1"/><rect x="20" y="16" width="24" height="10" rx="4" fill="#B0BEC5"/>{[0,1,2].map(i=><circle key={i} cx={28+i*4} cy={12} r="1" fill="#78909C"/>)}</> },
  butter: { d: <><rect x="10" y="24" width="44" height="20" rx="4" fill="#FDD835"/><rect x="10" y="24" width="44" height="6" rx="4" fill="#FFEE58"/></> },
  eggwhole: { d: <><ellipse cx="32" cy="36" rx="16" ry="22" fill="#F5F5F5"/><ellipse cx="32" cy="36" rx="14" ry="20" fill="#FAFAFA"/></> },
  meat: { d: <><path d="M16 28c0-8 8-16 16-16s16 8 16 16c0 12-8 24-16 28s-16-16-16-28z" fill="#D32F2F"/><path d="M20 24c4-4 12-8 20-4" stroke="#B71C1C" strokeWidth="2" fill="none"/><circle cx="32" cy="40" r="4" fill="#FFCDD2"/></> },
  salad: { d: <><ellipse cx="32" cy="40" rx="24" ry="14" fill="#E0E0E0"/><circle cx="24" cy="34" r="8" fill="#66BB6A"/><circle cx="36" cy="32" r="8" fill="#81C784"/><circle cx="30" cy="28" r="6" fill="#EF5350"/><circle cx="38" cy="36" r="4" fill="#FFD54F"/></> },
  cereal: { d: <><path d="M12 24c0 0 4 28 20 28s20-28 20-28z" fill="#ECEFF1"/><ellipse cx="32" cy="24" rx="20" ry="4" fill="#B0BEC5"/>{[0,1,2].map(i=><circle key={i} cx={24+i*8} cy={32} r="4" fill="#E8A735"/>)}</> },
  cannedFood: { d: <><rect x="14" y="14" width="36" height="40" rx="4" fill="#B0BEC5"/><rect x="14" y="14" width="36" height="10" rx="4" fill="#90A4AE"/><rect x="18" y="28" width="28" height="16" rx="2" fill="#EF5350"/></> },
  birthdayCake: { d: <><rect x="8" y="32" width="48" height="24" rx="6" fill="#F48FB1"/><rect x="12" y="28" width="40" height="8" rx="4" fill="#FCE4EC"/><rect x="16" y="24" width="32" height="8" rx="4" fill="#F8BBD0"/>{[0,1,2].map(i=><><rect key={`c${i}`} x={22+i*8} y={14} width="3" height="12" rx="1" fill="#FFEB3B"/><circle key={`f${i}`} cx={23.5+i*8} cy={12} r="3" fill="#FF9800"/></>)}</> },
  dining: { d: <><circle cx="32" cy="36" r="22" fill="#ECEFF1" stroke="#BDBDBD" strokeWidth="2"/><circle cx="32" cy="36" r="16" fill="#F5F5F5"/><rect x="10" y="12" width="3" height="40" rx="1.5" fill="#9E9E9E"/><rect x="51" y="12" width="3" height="40" rx="1.5" fill="#9E9E9E"/></> },
  icecream: { d: <><path d="M22 32l10 28 10-28z" fill="#FFE082"/><circle cx="32" cy="26" r="12" fill="#F48FB1"/><circle cx="24" cy="24" r="10" fill="#CE93D8"/><circle cx="40" cy="24" r="10" fill="#90CAF9"/></> },
  
  // ─── DRINKS ───
  coffee: { d: <><rect x="14" y="18" width="28" height="32" rx="4" fill="#ECEFF1"/><rect x="14" y="18" width="28" height="8" rx="4" fill="#795548"/><path d="M42 26c6 0 10 4 10 8s-4 8-10 8" stroke="#BDBDBD" strokeWidth="3" fill="none"/><path d="M22 12c2-4 4-2 4 0s2 4 4 0" stroke="#9E9E9E" strokeWidth="1.5" fill="none"/></> },
  milk: { d: <><rect x="18" y="16" width="28" height="38" rx="4" fill="#F5F5F5"/><rect x="18" y="16" width="28" height="10" rx="4" fill="#42A5F5"/><rect x="22" y="30" width="20" height="16" rx="2" fill="#E3F2FD"/></> },
  juicebox: { d: <><rect x="18" y="14" width="28" height="40" rx="4" fill="#FF9800"/><rect x="18" y="14" width="28" height="10" rx="4" fill="#FFB74D"/><rect x="28" y="4" width="4" height="14" rx="2" fill="#BDBDBD"/></> },
  drink: { d: <><path d="M20 14l4 38c0 4 16 4 16 0l4-38z" fill="#E3F2FD"/><ellipse cx="32" cy="14" rx="12" ry="3" fill="#BBDEFB"/><rect x="30" y="4" width="3" height="14" rx="1" fill="#9E9E9E"/></> },
  coffeeMilk: { d: <><rect x="14" y="18" width="28" height="32" rx="4" fill="#ECEFF1"/><rect x="14" y="18" width="28" height="16" rx="4" fill="#A1887F"/><rect x="14" y="34" width="28" height="16" rx="4" fill="#F5F5F5"/><path d="M42 26c6 0 10 4 10 8s-4 8-10 8" stroke="#BDBDBD" strokeWidth="3" fill="none"/></> },
  teapot: { d: <><ellipse cx="30" cy="36" rx="18" ry="16" fill="#ECEFF1"/><path d="M48 32c6-2 10 0 10 6s-4 8-10 6" fill="#BDBDBD"/><path d="M14 28c-6-4-6-8 0-10" stroke="#BDBDBD" strokeWidth="3" fill="none"/><ellipse cx="30" cy="20" rx="6" ry="4" fill="#B0BEC5"/></> },
  jar: { d: <><rect x="16" y="20" width="32" height="32" rx="6" fill="#E8F5E9"/><rect x="16" y="16" width="32" height="10" rx="4" fill="#BDBDBD"/></> },
  
  // ─── ANIMALS ───
  cat: { d: <><circle cx="32" cy="36" r="20" fill="#FF9800"/><polygon points="16,20 12,4 24,16" fill="#FF9800"/><polygon points="48,20 52,4 40,16" fill="#FF9800"/><circle cx="24" cy="32" r="3" fill="#333"/><circle cx="40" cy="32" r="3" fill="#333"/><ellipse cx="32" cy="38" rx="4" ry="3" fill="#F48FB1"/><path d="M28 40c2 2 6 2 8 0" stroke="#333" strokeWidth="1.5" fill="none"/><line x1="10" y1="34" x2="22" y2="36" stroke="#333" strokeWidth="1"/><line x1="10" y1="38" x2="22" y2="38" stroke="#333" strokeWidth="1"/><line x1="42" y1="36" x2="54" y2="34" stroke="#333" strokeWidth="1"/><line x1="42" y1="38" x2="54" y2="38" stroke="#333" strokeWidth="1"/></> },
  dog: { d: <><circle cx="32" cy="36" r="20" fill="#A1887F"/><ellipse cx="14" cy="24" rx="8" ry="12" fill="#8D6E63" transform="rotate(-15 14 24)"/><ellipse cx="50" cy="24" rx="8" ry="12" fill="#8D6E63" transform="rotate(15 50 24)"/><circle cx="24" cy="32" r="3" fill="#333"/><circle cx="40" cy="32" r="3" fill="#333"/><ellipse cx="32" cy="40" rx="8" ry="5" fill="#EFEBE9"/><ellipse cx="32" cy="38" rx="4" ry="3" fill="#333"/></> },
  rabbit: { d: <><circle cx="32" cy="40" r="18" fill="#F5F5F5"/><ellipse cx="24" cy="12" rx="6" ry="18" fill="#F5F5F5"/><ellipse cx="24" cy="12" rx="4" ry="14" fill="#F8BBD0"/><ellipse cx="40" cy="12" rx="6" ry="18" fill="#F5F5F5"/><ellipse cx="40" cy="12" rx="4" ry="14" fill="#F8BBD0"/><circle cx="26" cy="36" r="2.5" fill="#333"/><circle cx="38" cy="36" r="2.5" fill="#333"/><ellipse cx="32" cy="42" rx="3" ry="2" fill="#F48FB1"/></> },
  frog: { d: <><ellipse cx="32" cy="40" rx="22" ry="16" fill="#4CAF50"/><circle cx="20" cy="24" r="8" fill="#4CAF50"/><circle cx="44" cy="24" r="8" fill="#4CAF50"/><circle cx="20" cy="22" r="4" fill="#fff"/><circle cx="44" cy="22" r="4" fill="#fff"/><circle cx="21" cy="22" r="2" fill="#333"/><circle cx="45" cy="22" r="2" fill="#333"/><path d="M22 44c4 4 16 4 20 0" stroke="#333" strokeWidth="2" fill="none"/></> },
  elephant: { d: <><circle cx="32" cy="36" r="22" fill="#90A4AE"/><path d="M32 40c0 0-2 16-8 20" stroke="#78909C" strokeWidth="6" fill="none" strokeLinecap="round"/><circle cx="22" cy="30" r="3" fill="#333"/><circle cx="42" cy="30" r="3" fill="#333"/><ellipse cx="16" cy="28" rx="8" ry="10" fill="#90A4AE"/><ellipse cx="48" cy="28" rx="8" ry="10" fill="#90A4AE"/></> },
  lion: { d: <><circle cx="32" cy="36" r="24" fill="#FF8F00"/><circle cx="32" cy="38" r="18" fill="#FFB74D"/><circle cx="24" cy="34" r="3" fill="#333"/><circle cx="40" cy="34" r="3" fill="#333"/><ellipse cx="32" cy="40" rx="5" ry="3" fill="#333"/><path d="M28 44c2 2 6 2 8 0" stroke="#333" strokeWidth="1.5" fill="none"/></> },
  fish: { d: <><ellipse cx="32" cy="32" rx="22" ry="14" fill="#42A5F5"/><polygon points="54,32 64,22 64,42" fill="#1E88E5"/><circle cx="20" cy="28" r="3" fill="#fff"/><circle cx="21" cy="28" r="1.5" fill="#333"/><path d="M28 36c4 2 8 2 12 0" stroke="#1E88E5" strokeWidth="1.5" fill="none"/></> },
  dolphin: { d: <><path d="M8 32c8-16 24-20 36-12s12 16 4 22-32 6-40-10z" fill="#42A5F5"/><circle cx="18" cy="30" r="2" fill="#fff"/><path d="M44 20c4-6 8-8 10-4" fill="#1E88E5"/></> },
  penguin: { d: <><ellipse cx="32" cy="38" rx="18" ry="22" fill="#37474F"/><ellipse cx="32" cy="42" rx="12" ry="16" fill="#F5F5F5"/><circle cx="26" cy="28" r="3" fill="#fff"/><circle cx="38" cy="28" r="3" fill="#fff"/><circle cx="26" cy="28" r="1.5" fill="#333"/><circle cx="38" cy="28" r="1.5" fill="#333"/><path d="M30 34l2 4 2-4" fill="#FF9800"/></> },
  bird: { d: <><ellipse cx="32" cy="36" rx="16" ry="14" fill="#42A5F5"/><circle cx="32" cy="24" r="10" fill="#64B5F6"/><circle cx="28" cy="22" r="2" fill="#333"/><path d="M34 26l6 0" fill="#FF9800"/><polygon points="34,26 42,24 38,28" fill="#FF9800"/></> },
  eagle: { d: <><ellipse cx="32" cy="36" rx="20" ry="16" fill="#795548"/><circle cx="32" cy="22" r="12" fill="#F5F5F5"/><circle cx="28" cy="20" r="2.5" fill="#333"/><circle cx="36" cy="20" r="2.5" fill="#333"/><path d="M30 26l2 4 2-4" fill="#FF9800"/><path d="M12 28l-8 8 12-2" fill="#795548"/><path d="M52 28l8 8-12-2" fill="#795548"/></> },
  bee: { d: <><ellipse cx="32" cy="34" rx="16" ry="14" fill="#FDD835"/>{[0,1,2].map(i=><rect key={i} x="16" y={26+i*6} width="32" height="3" rx="1" fill="#333"/>)}<circle cx="26" cy="30" r="2" fill="#333"/><circle cx="38" cy="30" r="2" fill="#333"/><ellipse cx="22" cy="20" rx="8" ry="6" fill="rgba(255,255,255,0.6)" transform="rotate(-20 22 20)"/><ellipse cx="42" cy="20" rx="8" ry="6" fill="rgba(255,255,255,0.6)" transform="rotate(20 42 20)"/></> },
  butterfly: { d: <><ellipse cx="20" cy="24" rx="14" ry="12" fill="#CE93D8" transform="rotate(-15 20 24)"/><ellipse cx="44" cy="24" rx="14" ry="12" fill="#F48FB1" transform="rotate(15 44 24)"/><ellipse cx="20" cy="42" rx="10" ry="8" fill="#90CAF9"/><ellipse cx="44" cy="42" rx="10" ry="8" fill="#80CBC4"/><rect x="30" y="14" width="4" height="36" rx="2" fill="#333"/><path d="M30 14c-4-6-8-6-8-2M34 14c4-6 8-6 8-2" stroke="#333" strokeWidth="1.5" fill="none"/></> },
  turtle: { d: <><ellipse cx="32" cy="38" rx="22" ry="14" fill="#4CAF50"/><ellipse cx="32" cy="36" rx="18" ry="10" fill="#66BB6A"/><path d="M32 26c6 0 12 4 14 10M32 26c-6 0-12 4-14 10" stroke="#388E3C" strokeWidth="2" fill="none"/><circle cx="12" cy="36" r="4" fill="#81C784"/><circle cx="52" cy="36" r="4" fill="#81C784"/><circle cx="16" cy="48" r="3" fill="#81C784"/><circle cx="48" cy="48" r="3" fill="#81C784"/><circle cx="10" cy="30" r="5" fill="#81C784"/><circle cx="8" cy="28" r="2" fill="#333"/></> },
  octopus: { d: <><circle cx="32" cy="24" r="16" fill="#7B1FA2"/><circle cx="26" cy="22" r="3" fill="#fff"/><circle cx="38" cy="22" r="3" fill="#fff"/><circle cx="26" cy="22" r="1.5" fill="#333"/><circle cx="38" cy="22" r="1.5" fill="#333"/>{[0,1,2,3].map(i=><path key={i} d={`M${20+i*8} 38c${i%2?-2:2} 8 ${i%2?2:-2} 16 0 22`} stroke="#9C27B0" strokeWidth="4" fill="none" strokeLinecap="round"/>)}</> },
  tropicalFish: { d: <><ellipse cx="32" cy="32" rx="20" ry="16" fill="#FF9800"/><polygon points="52,32 62,22 62,42" fill="#FF6F00"/><circle cx="22" cy="28" r="3" fill="#fff"/><circle cx="23" cy="28" r="1.5" fill="#333"/><path d="M16 32c8 2 16 2 24 0" stroke="#F57C00" strokeWidth="2" fill="none"/><path d="M16 28c8-2 16-2 24 0" stroke="#FFB74D" strokeWidth="3" fill="none"/></> },
  chick: { d: <><circle cx="32" cy="36" r="18" fill="#FDD835"/><circle cx="32" cy="22" r="12" fill="#FFEE58"/><circle cx="28" cy="20" r="2" fill="#333"/><circle cx="36" cy="20" r="2" fill="#333"/><polygon points="32,24 36,28 28,28" fill="#FF9800"/></> },
  babyChick: { d: <><circle cx="32" cy="38" r="16" fill="#FDD835"/><circle cx="32" cy="24" r="10" fill="#FFEE58"/><circle cx="28" cy="22" r="1.5" fill="#333"/><circle cx="36" cy="22" r="1.5" fill="#333"/><polygon points="32,26 35,29 29,29" fill="#FF9800"/></> },
  chicken: { d: <><ellipse cx="32" cy="40" rx="18" ry="16" fill="#F5F5F5"/><circle cx="32" cy="24" r="10" fill="#FAFAFA"/><circle cx="28" cy="22" r="2" fill="#333"/><polygon points="32,26 36,30 28,30" fill="#FF9800"/><path d="M30 14c2-4 4-4 4 0" fill="#E53935"/></> },
  rooster: { d: <><ellipse cx="32" cy="40" rx="18" ry="16" fill="#F5F5F5"/><circle cx="32" cy="24" r="10" fill="#FAFAFA"/><circle cx="28" cy="22" r="2" fill="#333"/><polygon points="32,26 38,28 28,28" fill="#FF9800"/><path d="M28 14c2-6 6-6 8-2s2 6 0 6" fill="#E53935"/><path d="M32 28c0 4 0 6-2 8" fill="#E53935"/></> },
  cow: { d: <><circle cx="32" cy="36" r="20" fill="#F5F5F5"/><ellipse cx="32" cy="44" rx="10" ry="6" fill="#FFCC80"/><circle cx="24" cy="32" r="3" fill="#333"/><circle cx="40" cy="32" r="3" fill="#333"/><circle cx="18" cy="20" r="6" fill="#333" opacity="0.3"/><circle cx="42" cy="24" r="8" fill="#333" opacity="0.3"/><ellipse cx="20" cy="18" rx="6" ry="4" fill="#F5F5F5"/><ellipse cx="44" cy="18" rx="6" ry="4" fill="#F5F5F5"/></> },
  pig: { d: <><circle cx="32" cy="36" r="20" fill="#F8BBD0"/><ellipse cx="32" cy="40" rx="10" ry="7" fill="#F48FB1"/><circle cx="28" cy="38" r="2" fill="#E91E63"/><circle cx="36" cy="38" r="2" fill="#E91E63"/><circle cx="24" cy="30" r="3" fill="#333"/><circle cx="40" cy="30" r="3" fill="#333"/><ellipse cx="22" cy="20" rx="6" ry="8" fill="#F8BBD0" transform="rotate(-15 22 20)"/><ellipse cx="42" cy="20" rx="6" ry="8" fill="#F8BBD0" transform="rotate(15 42 20)"/></> },
  horse: { d: <><ellipse cx="32" cy="38" rx="18" ry="20" fill="#8D6E63"/><path d="M32 18c0-8 4-14 4-14" stroke="#5D4037" strokeWidth="4" fill="none"/><circle cx="26" cy="32" r="2.5" fill="#333"/><ellipse cx="32" cy="44" rx="8" ry="5" fill="#6D4C41"/><circle cx="30" cy="42" r="1.5" fill="#333"/><circle cx="34" cy="42" r="1.5" fill="#333"/></> },
  sheep: { d: <><circle cx="32" cy="36" r="22" fill="#F5F5F5"/>{[0,1,2,3,4,5,6].map(i=><circle key={i} cx={18+i*4+((i%2)*2)} cy={22+Math.floor(i/3)*8} r="5" fill="#FAFAFA"/>)}<circle cx="32" cy="40" r="10" fill="#333"/><circle cx="28" cy="38" r="2" fill="#fff"/><circle cx="36" cy="38" r="2" fill="#fff"/></> },
  bear: { d: <><circle cx="32" cy="38" r="22" fill="#795548"/><circle cx="14" cy="20" r="8" fill="#795548"/><circle cx="14" cy="20" r="5" fill="#A1887F"/><circle cx="50" cy="20" r="8" fill="#795548"/><circle cx="50" cy="20" r="5" fill="#A1887F"/><circle cx="24" cy="34" r="3" fill="#333"/><circle cx="40" cy="34" r="3" fill="#333"/><ellipse cx="32" cy="42" rx="6" ry="4" fill="#A1887F"/><ellipse cx="32" cy="40" rx="4" ry="2.5" fill="#333"/></> },
  monkey: { d: <><circle cx="32" cy="36" r="20" fill="#795548"/><circle cx="12" cy="34" r="8" fill="#FFCC80"/><circle cx="52" cy="34" r="8" fill="#FFCC80"/><ellipse cx="32" cy="40" rx="14" ry="10" fill="#FFCC80"/><circle cx="26" cy="32" r="2.5" fill="#333"/><circle cx="38" cy="32" r="2.5" fill="#333"/><ellipse cx="32" cy="40" rx="4" ry="2" fill="#333"/></> },
  snake: { d: <><path d="M10 40c8-16 16 8 24-8s12 12 20-4" stroke="#4CAF50" strokeWidth="8" fill="none" strokeLinecap="round"/><circle cx="10" cy="40" r="6" fill="#66BB6A"/><circle cx="7" cy="38" r="1.5" fill="#333"/><path d="M14 42l4 2" stroke="#E53935" strokeWidth="1.5"/></> },
  dogFace: { d: <><circle cx="32" cy="36" r="20" fill="#A1887F"/><ellipse cx="32" cy="42" rx="8" ry="5" fill="#EFEBE9"/><ellipse cx="32" cy="38" rx="4" ry="3" fill="#333"/><circle cx="24" cy="32" r="3" fill="#333"/><circle cx="40" cy="32" r="3" fill="#333"/></> },
  cowBody: { d: <><ellipse cx="32" cy="36" rx="24" ry="18" fill="#F5F5F5"/><ellipse cx="20" cy="30" rx="8" ry="6" fill="#333" opacity="0.3"/><ellipse cx="40" cy="34" rx="10" ry="8" fill="#333" opacity="0.3"/></> },
  duck: { d: <><ellipse cx="32" cy="38" rx="18" ry="14" fill="#FFD54F"/><circle cx="32" cy="24" r="10" fill="#FFEE58"/><circle cx="28" cy="22" r="2" fill="#333"/><path d="M34 26l8 0c2 0 2 4 0 4l-8 0" fill="#FF9800"/></> },
  squid: { d: <><ellipse cx="32" cy="24" rx="14" ry="18" fill="#F48FB1"/><circle cx="26" cy="22" r="3" fill="#fff"/><circle cx="38" cy="22" r="3" fill="#fff"/><circle cx="26" cy="22" r="1.5" fill="#333"/><circle cx="38" cy="22" r="1.5" fill="#333"/>{[0,1,2,3].map(i=><path key={i} d={`M${22+i*6} 40c${i%2?-2:2} 8 ${i%2?2:-2} 14 0 20`} stroke="#EC407A" strokeWidth="3" fill="none" strokeLinecap="round"/>)}</> },
  crab: { d: <><ellipse cx="32" cy="36" rx="18" ry="12" fill="#E53935"/><circle cx="20" cy="22" r="5" fill="#EF5350"/><circle cx="44" cy="22" r="5" fill="#EF5350"/><circle cx="20" cy="20" r="2" fill="#333"/><circle cx="44" cy="20" r="2" fill="#333"/><path d="M8 28c-4-6-2-10 4-8" stroke="#E53935" strokeWidth="4" fill="none"/><path d="M56 28c4-6 2-10-4-8" stroke="#E53935" strokeWidth="4" fill="none"/></> },
  peacock: { d: <><path d="M32 8c-20 0-28 16-28 24s8 4 12 0 8-4 16-4 12 0 16 4 12 8 12 0-8-24-28-24z" fill="#1565C0"/>{[0,1,2,3,4].map(i=><circle key={i} cx={16+i*8} cy={16+i*(i<3?2:-2)} r="4" fill="#4CAF50"/>)}<circle cx="32" cy="44" r="10" fill="#1565C0"/><circle cx="28" cy="42" r="2" fill="#333"/><circle cx="36" cy="42" r="2" fill="#333"/><polygon points="32,46 34,50 30,50" fill="#FF9800"/></> },
  parrot: { d: <><ellipse cx="32" cy="38" rx="14" ry="18" fill="#4CAF50"/><circle cx="32" cy="22" r="10" fill="#66BB6A"/><circle cx="28" cy="20" r="2.5" fill="#fff"/><circle cx="28" cy="20" r="1.5" fill="#333"/><path d="M34 24c4 0 6-2 4-6" fill="#FF9800"/><path d="M18 44c-6 8-4 16 0 16" stroke="#E53935" strokeWidth="3" fill="none"/><path d="M22 42c-4 10-2 18 2 18" stroke="#FDD835" strokeWidth="3" fill="none"/></> },
  owl: { d: <><ellipse cx="32" cy="38" rx="20" ry="18" fill="#795548"/><circle cx="24" cy="30" r="8" fill="#F5F5F5"/><circle cx="40" cy="30" r="8" fill="#F5F5F5"/><circle cx="24" cy="30" r="4" fill="#FF9800"/><circle cx="40" cy="30" r="4" fill="#FF9800"/><circle cx="24" cy="30" r="2" fill="#333"/><circle cx="40" cy="30" r="2" fill="#333"/><polygon points="32,36 34,40 30,40" fill="#FF9800"/><path d="M18 20l6 6M46 20l-6 6" stroke="#795548" strokeWidth="3"/></> },
  shell: { d: <><path d="M12 44c0-16 10-32 20-32s20 16 20 32" fill="#F8BBD0"/><path d="M16 44c0-14 8-28 16-28" stroke="#F48FB1" strokeWidth="1.5" fill="none"/><path d="M22 44c0-10 6-22 10-22" stroke="#F48FB1" strokeWidth="1.5" fill="none"/></> },
  rabbitJump: { d: <><circle cx="32" cy="40" r="18" fill="#F5F5F5"/><ellipse cx="24" cy="12" rx="5" ry="16" fill="#F5F5F5"/><ellipse cx="40" cy="12" rx="5" ry="16" fill="#F5F5F5"/><circle cx="26" cy="36" r="2.5" fill="#333"/><circle cx="38" cy="36" r="2.5" fill="#333"/><path d="M28 56c-2 4 0 6 4 6s6-2 4-6" fill="#F8BBD0"/></> },
  catSmile: { d: <><circle cx="32" cy="36" r="20" fill="#FF9800"/><polygon points="16,20 12,4 24,16" fill="#FF9800"/><polygon points="48,20 52,4 40,16" fill="#FF9800"/><path d="M22 32c2-2 4-2 6 0" stroke="#333" strokeWidth="2" fill="none"/><path d="M36 32c2-2 4-2 6 0" stroke="#333" strokeWidth="2" fill="none"/><path d="M28 40c2 2 6 2 8 0" stroke="#333" strokeWidth="1.5" fill="none"/></> },

  // ─── NATURE & PLANTS ───
  seedling: { d: <><path d="M32 58V32" stroke="#4CAF50" strokeWidth="3"/><path d="M32 32c-8-4-14-12-8-20s14 4 8 20z" fill="#66BB6A"/><path d="M32 38c8-4 14-12 8-20s-14 4-8 20z" fill="#81C784"/></> },
  tree: { d: <><rect x="28" y="40" width="8" height="20" rx="2" fill="#795548"/><polygon points="32,6 12,30 52,30" fill="#2E7D32"/><polygon points="32,16 16,36 48,36" fill="#388E3C"/></> },
  palmTree: { d: <><rect x="29" y="30" width="6" height="30" rx="2" fill="#795548"/><path d="M32 30c-16 0-24-8-20-14" stroke="#4CAF50" strokeWidth="4" fill="none"/><path d="M32 30c16 0 24-8 20-14" stroke="#4CAF50" strokeWidth="4" fill="none"/><path d="M32 28c-12-6-14-16-8-18" stroke="#66BB6A" strokeWidth="3" fill="none"/><path d="M32 28c12-6 14-16 8-18" stroke="#66BB6A" strokeWidth="3" fill="none"/></> },
  cactus: { d: <><rect x="26" y="16" width="12" height="40" rx="6" fill="#4CAF50"/><path d="M26 30c-6 0-10-4-10-10" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" fill="none"/><path d="M38 24c6 0 10-4 10-10" stroke="#4CAF50" strokeWidth="8" strokeLinecap="round" fill="none"/></> },
  cherryBlossom: { d: <>{[0,1,2,3,4].map(i=><ellipse key={i} cx={32+Math.cos(i*1.256)*12} cy={32+Math.sin(i*1.256)*12} rx="8" ry="6" fill="#F8BBD0" transform={`rotate(${i*72} ${32+Math.cos(i*1.256)*12} ${32+Math.sin(i*1.256)*12})`}/>)}<circle cx="32" cy="32" r="5" fill="#FFD54F"/></> },
  rose: { d: <><circle cx="32" cy="28" r="16" fill="#E53935"/><circle cx="32" cy="28" r="12" fill="#EF5350"/><circle cx="32" cy="28" r="7" fill="#C62828"/><path d="M32 44V58" stroke="#4CAF50" strokeWidth="3"/><path d="M32 50c-6-2-10-6-8-10" stroke="#4CAF50" strokeWidth="2" fill="#66BB6A"/></> },
  hibiscus: { d: <>{[0,1,2,3,4].map(i=><ellipse key={i} cx={32+Math.cos(i*1.256)*14} cy={32+Math.sin(i*1.256)*14} rx="10" ry="7" fill="#E91E63" transform={`rotate(${i*72} ${32+Math.cos(i*1.256)*14} ${32+Math.sin(i*1.256)*14})`}/>)}<circle cx="32" cy="32" r="6" fill="#FFEB3B"/></> },
  sunflower: { d: <>{[0,1,2,3,4,5,6,7].map(i=><ellipse key={i} cx={32+Math.cos(i*0.785)*18} cy={32+Math.sin(i*0.785)*18} rx="8" ry="5" fill="#FDD835" transform={`rotate(${i*45} ${32+Math.cos(i*0.785)*18} ${32+Math.sin(i*0.785)*18})`}/>)}<circle cx="32" cy="32" r="10" fill="#5D4037"/></> },
  blossom: { d: <>{[0,1,2,3,4].map(i=><ellipse key={i} cx={32+Math.cos(i*1.256)*12} cy={32+Math.sin(i*1.256)*12} rx="8" ry="6" fill="#FFD54F" transform={`rotate(${i*72} ${32+Math.cos(i*1.256)*12} ${32+Math.sin(i*1.256)*12})`}/>)}<circle cx="32" cy="32" r="5" fill="#FF9800"/></> },
  tulip: { d: <><path d="M32 58V30" stroke="#4CAF50" strokeWidth="3"/><path d="M24 30c0-12 8-22 8-22s8 10 8 22c0 4-4 6-8 6s-8-2-8-6z" fill="#E91E63"/><path d="M18 28c-2-10 6-20 14-22" fill="#EC407A" opacity="0.5"/><path d="M46 28c2-10-6-20-14-22" fill="#EC407A" opacity="0.5"/></> },
  riceField: { d: <><path d="M4 40c12-8 24-4 36-8s16-4 24 0v24H4z" fill="#8BC34A"/><path d="M16 32l0-20" stroke="#689F38" strokeWidth="1.5"/><path d="M16 20c-4-2-6 0-4 4" stroke="#689F38" strokeWidth="1.5" fill="none"/><path d="M16 16c4-2 6 0 4 4" stroke="#689F38" strokeWidth="1.5" fill="none"/><path d="M32 28l0-18" stroke="#689F38" strokeWidth="1.5"/><path d="M48 30l0-16" stroke="#689F38" strokeWidth="1.5"/></> },
  herb: { d: <><path d="M32 58V24" stroke="#4CAF50" strokeWidth="2"/><path d="M32 40c-10-4-14-14-8-20" fill="#66BB6A"/><path d="M32 32c10-4 14-14 8-20" fill="#81C784"/><path d="M32 24c-8-2-10-10-4-14" fill="#A5D6A7"/></> },
  clover: { d: <><path d="M32 58V36" stroke="#4CAF50" strokeWidth="2.5"/>{[0,1,2,3].map(i=><ellipse key={i} cx={32+Math.cos((i*1.571)-0.785)*10} cy={28+Math.sin((i*1.571)-0.785)*10} rx="8" ry="10" fill={i%2?"#4CAF50":"#66BB6A"} transform={`rotate(${i*90} ${32+Math.cos((i*1.571)-0.785)*10} ${28+Math.sin((i*1.571)-0.785)*10})`}/>)}</> },
  potPlant: { d: <><rect x="18" y="36" width="28" height="22" rx="4" fill="#A1887F"/><path d="M32 36V20" stroke="#4CAF50" strokeWidth="3"/><path d="M32 28c-8-2-12-10-6-14" fill="#66BB6A"/><path d="M32 22c8-2 12-10 6-14" fill="#81C784"/></> },
  chestnut: { d: <><circle cx="32" cy="36" r="16" fill="#795548"/><path d="M16 36c0-10 8-20 16-24s16 14 16 24" fill="#8D6E63"/><circle cx="32" cy="38" r="6" fill="#6D4C41"/></> },
  feather: { d: <><path d="M48 8c-8 8-20 24-28 40" stroke="#BDBDBD" strokeWidth="2" fill="none"/><path d="M48 8c-12 4-24 16-28 40c8-20 16-28 28-40z" fill="#78909C"/><path d="M48 8c-4 8-10 18-16 26c10-12 14-20 16-26z" fill="#90A4AE"/></> },
  bouquet: { d: <><circle cx="24" cy="20" r="8" fill="#E91E63"/><circle cx="40" cy="20" r="8" fill="#F48FB1"/><circle cx="32" cy="16" r="8" fill="#EC407A"/><circle cx="28" cy="24" r="6" fill="#CE93D8"/><circle cx="36" cy="24" r="6" fill="#F06292"/><path d="M26 30l6 26 6-26" fill="#4CAF50"/><path d="M32 56c-4 0-8-2-8-4l8-22 8 22c0 2-4 4-8 4z" fill="#66BB6A"/></> },
  
  // ─── WEATHER ───
  sun: { d: <><circle cx="32" cy="32" r="14" fill="#FFD54F"/>{[0,1,2,3,4,5,6,7].map(i=><line key={i} x1={32+Math.cos(i*0.785)*18} y1={32+Math.sin(i*0.785)*18} x2={32+Math.cos(i*0.785)*26} y2={32+Math.sin(i*0.785)*26} stroke="#FDD835" strokeWidth="3" strokeLinecap="round"/>)}</> },
  moon: { d: <><path d="M40 8c-16 4-24 18-20 34s18 20 32 12c-12 4-24-4-24-20s8-22 12-26z" fill="#FDD835"/></> },
  star: { d: <><polygon points="32,4 38,24 58,24 42,36 48,56 32,44 16,56 22,36 6,24 26,24" fill="#FFD54F"/></> },
  glowStar: { d: <><polygon points="32,4 38,24 58,24 42,36 48,56 32,44 16,56 22,36 6,24 26,24" fill="#FDD835"/><polygon points="32,12 36,24 48,24 38,32 42,44 32,36 22,44 26,32 16,24 28,24" fill="#FFEE58"/></> },
  cloud: { d: <><ellipse cx="32" cy="36" rx="20" ry="12" fill="#ECEFF1"/><circle cx="22" cy="30" r="12" fill="#F5F5F5"/><circle cx="38" cy="26" r="14" fill="#FAFAFA"/><circle cx="48" cy="32" r="10" fill="#F5F5F5"/></> },
  rain: { d: <><ellipse cx="32" cy="24" rx="20" ry="10" fill="#90A4AE"/><circle cx="22" cy="20" r="10" fill="#B0BEC5"/><circle cx="40" cy="18" r="12" fill="#B0BEC5"/>{[0,1,2,3].map(i=><line key={i} x1={18+i*10} y1={36+i*2} x2={14+i*10} y2={48+i*2} stroke="#42A5F5" strokeWidth="2.5" strokeLinecap="round"/>)}</> },
  snow: { d: <>{[0,1,2].map(i=><g key={i}><line x1={20+i*12} y1={16+i*8} x2={20+i*12} y2={48+i*8-16} stroke="#90CAF9" strokeWidth="2"/><line x1={14+i*12} y1={24+i*4} x2={26+i*12} y2={32+i*4} stroke="#90CAF9" strokeWidth="2"/><line x1={26+i*12} y1={24+i*4} x2={14+i*12} y2={32+i*4} stroke="#90CAF9" strokeWidth="2"/></g>)}</> },
  umbrella: { d: <><path d="M8 32c0-14 12-24 24-24s24 10 24 24" fill="#E53935"/><path d="M8 32c0-14 12-24 24-24" fill="#EF5350"/><line x1="32" y1="8" x2="32" y2="52" stroke="#795548" strokeWidth="3"/><path d="M32 52c0 4-4 8-8 6" stroke="#795548" strokeWidth="3" fill="none"/></> },
  rainbow: { d: <>{['#E53935','#FF9800','#FDD835','#4CAF50','#2196F3','#7B1FA2'].map((c,i)=><path key={i} d={`M${8+i*3} 48 A${24-i*3} ${24-i*3} 0 0 1 ${56-i*3} 48`} stroke={c} strokeWidth="3" fill="none"/>)}</> },
  tornado: { d: <><path d="M10 16c20 0 40 4 44 8" stroke="#78909C" strokeWidth="3" fill="none"/><path d="M14 24c16 0 32 4 34 8" stroke="#90A4AE" strokeWidth="3" fill="none"/><path d="M20 32c10 0 22 4 22 8" stroke="#B0BEC5" strokeWidth="3" fill="none"/><path d="M26 40c6 0 14 4 12 8" stroke="#B0BEC5" strokeWidth="3" fill="none"/></> },
  thermometer: { d: <><rect x="28" y="8" width="8" height="36" rx="4" fill="#ECEFF1"/><circle cx="32" cy="48" r="8" fill="#E53935"/><rect x="30" y="24" width="4" height="24" rx="2" fill="#E53935"/></> },
  wave: { d: <><path d="M4 32c8-8 16 0 24-8s16 0 24-8" stroke="#1E88E5" strokeWidth="4" fill="none"/><path d="M4 44c8-8 16 0 24-8s16 0 24-8" stroke="#42A5F5" strokeWidth="3" fill="none"/><path d="M4 54c8-6 16 0 24-6s16 0 24-6" stroke="#90CAF9" strokeWidth="2" fill="none"/></> },
  droplet: { d: <><path d="M32 8c-12 16-18 24-18 32a18 18 0 0 0 36 0c0-8-6-16-18-32z" fill="#42A5F5"/><path d="M24 36c0-6 4-12 8-18" stroke="#90CAF9" strokeWidth="2" fill="none"/></> },
  sunrise: { d: <><rect x="0" y="40" width="64" height="24" fill="#FF8F00" opacity="0.3"/><circle cx="32" cy="40" r="14" fill="#FFD54F"/>{[0,1,2,3,4].map(i=><line key={i} x1={32+Math.cos((i*0.628)-1.57)*18} y1={40+Math.sin((i*0.628)-1.57)*18} x2={32+Math.cos((i*0.628)-1.57)*26} y2={40+Math.sin((i*0.628)-1.57)*26} stroke="#FDD835" strokeWidth="2.5" strokeLinecap="round"/>)}<line x1="4" y1="40" x2="60" y2="40" stroke="#E65100" strokeWidth="2"/></> },
  fire: { d: <><path d="M32 4c-8 16-20 24-16 36s12 16 16 20c4-4 16-8 16-20s-8-20-16-36z" fill="#FF9800"/><path d="M32 20c-4 10-10 16-6 26s6 10 6 14c0-4 6-4 6-14s-2-16-6-26z" fill="#FDD835"/></> },
  
  // ─── TRANSPORT ───
  car: { d: <><rect x="6" y="28" width="52" height="20" rx="6" fill="#E53935"/><path d="M16 28c2-10 8-14 16-14s14 4 16 14" fill="#42A5F5" opacity="0.6"/><circle cx="18" cy="48" r="6" fill="#333"/><circle cx="18" cy="48" r="3" fill="#9E9E9E"/><circle cx="46" cy="48" r="6" fill="#333"/><circle cx="46" cy="48" r="3" fill="#9E9E9E"/></> },
  bus: { d: <><rect x="8" y="14" width="48" height="36" rx="6" fill="#FDD835"/><rect x="12" y="18" width="16" height="12" rx="2" fill="#E3F2FD"/><rect x="36" y="18" width="16" height="12" rx="2" fill="#E3F2FD"/><circle cx="18" cy="50" r="5" fill="#333"/><circle cx="46" cy="50" r="5" fill="#333"/></> },
  train: { d: <><rect x="10" y="12" width="44" height="36" rx="8" fill="#42A5F5"/><rect x="14" y="16" width="36" height="14" rx="4" fill="#E3F2FD"/><circle cx="22" cy="48" r="5" fill="#333"/><circle cx="42" cy="48" r="5" fill="#333"/><rect x="28" y="6" width="8" height="8" rx="2" fill="#1E88E5"/></> },
  bulletTrain: { d: <><path d="M10 36c0-16 10-28 22-28s22 12 22 28" fill="#F5F5F5"/><rect x="10" y="36" width="44" height="14" rx="4" fill="#ECEFF1"/><rect x="14" y="22" width="14" height="10" rx="2" fill="#42A5F5"/><rect x="36" y="22" width="14" height="10" rx="2" fill="#42A5F5"/><path d="M10 50l-4 6h52l-4-6" fill="#E0E0E0"/></> },
  plane: { d: <><path d="M32 4l-4 24-20 8 20 4 0 16 6-8 6 8 0-16 20-4-20-8z" fill="#42A5F5"/><path d="M28 28l4-24 4 24" fill="#1E88E5"/></> },
  helicopter: { d: <><ellipse cx="32" cy="36" rx="18" ry="12" fill="#4CAF50"/><rect x="28" y="12" width="8" height="24" rx="4" fill="#388E3C"/><line x1="8" y1="14" x2="56" y2="14" stroke="#333" strokeWidth="3"/><path d="M48 40l12 14" stroke="#388E3C" strokeWidth="3" fill="none"/><line x1="56" y1="54" x2="64" y2="54" stroke="#333" strokeWidth="2"/></> },
  ship: { d: <><path d="M4 40l8-8h40l8 8c0 8-8 16-28 16s-28-8-28-16z" fill="#455A64"/><rect x="24" y="16" width="16" height="20" rx="2" fill="#F5F5F5"/><rect x="30" y="8" width="4" height="12" rx="1" fill="#BDBDBD"/><rect x="26" y="6" width="12" height="4" rx="1" fill="#E53935"/></> },
  sailboat: { d: <><path d="M4 44l12-4h32l12 4c-4 8-16 12-28 12s-24-4-28-12z" fill="#795548"/><polygon points="32,8 32,40 12,40" fill="#F5F5F5"/><polygon points="34,12 34,40 50,40" fill="#ECEFF1"/><line x1="32" y1="6" x2="32" y2="42" stroke="#BDBDBD" strokeWidth="2"/></> },
  bicycle: { d: <><circle cx="18" cy="42" r="10" fill="none" stroke="#333" strokeWidth="3"/><circle cx="46" cy="42" r="10" fill="none" stroke="#333" strokeWidth="3"/><path d="M18 42l14-18h14l-14 18" stroke="#E53935" strokeWidth="2.5" fill="none"/><circle cx="32" cy="24" r="3" fill="#333"/></> },
  rocket: { d: <><path d="M32 4c-8 12-12 24-12 36h24c0-12-4-24-12-36z" fill="#F5F5F5"/><path d="M32 4c-4 8-8 16-8 24" fill="#E0E0E0"/><circle cx="32" cy="28" r="4" fill="#42A5F5"/><path d="M20 40c-6 4-8 10-6 16" fill="#E53935"/><path d="M44 40c6 4 8 10 6 16" fill="#E53935"/><path d="M26 48l6 8 6-8" fill="#FF9800"/></> },
  ambulance: { d: <><rect x="6" y="22" width="52" height="24" rx="4" fill="#F5F5F5"/><rect x="6" y="22" width="52" height="8" rx="4" fill="#E53935"/><circle cx="18" cy="46" r="5" fill="#333"/><circle cx="46" cy="46" r="5" fill="#333"/><rect x="28" y="26" width="8" height="2" rx="1" fill="#F5F5F5"/><rect x="31" y="23" width="2" height="8" rx="1" fill="#F5F5F5"/></> },
  fireTruck: { d: <><rect x="6" y="22" width="52" height="24" rx="4" fill="#E53935"/><rect x="36" y="14" width="18" height="12" rx="2" fill="#42A5F5" opacity="0.6"/><circle cx="18" cy="46" r="5" fill="#333"/><circle cx="46" cy="46" r="5" fill="#333"/><rect x="8" y="14" width="24" height="4" rx="1" fill="#B0BEC5"/></> },
  policeCar: { d: <><rect x="6" y="28" width="52" height="20" rx="6" fill="#F5F5F5"/><path d="M16 28c2-10 8-14 16-14s14 4 16 14" fill="#42A5F5" opacity="0.6"/><circle cx="18" cy="48" r="5" fill="#333"/><circle cx="46" cy="48" r="5" fill="#333"/><rect x="26" y="20" width="6" height="4" rx="2" fill="#E53935"/><rect x="32" y="20" width="6" height="4" rx="2" fill="#1E88E5"/></> },
  motorcycle: { d: <><circle cx="16" cy="44" r="8" fill="none" stroke="#333" strokeWidth="3"/><circle cx="48" cy="44" r="8" fill="none" stroke="#333" strokeWidth="3"/><path d="M16 44l16-20h16l-8 20" stroke="#E53935" strokeWidth="3" fill="none"/><circle cx="32" cy="24" r="4" fill="#333"/></> },
  speedboat: { d: <><path d="M4 40l8-8h40l8 8c-4 6-12 10-28 10s-24-4-28-10z" fill="#1E88E5"/><rect x="24" y="24" width="16" height="12" rx="2" fill="#F5F5F5"/></> },
  canoe: { d: <><path d="M4 36c4-8 16-12 28-12s24 4 28 12c-4 4-16 8-28 8s-24-4-28-8z" fill="#A1887F"/></> },
  rowing: { d: <><path d="M8 40c4-6 12-8 24-8s20 2 24 8c-4 4-12 6-24 6s-20-2-24-6z" fill="#8D6E63"/><circle cx="32" cy="32" r="6" fill="#42A5F5"/><line x1="12" y1="28" x2="52" y2="44" stroke="#795548" strokeWidth="2"/></> },
  tukTuk: { d: <><rect x="12" y="20" width="40" height="26" rx="4" fill="#4CAF50"/><rect x="14" y="22" width="18" height="14" rx="2" fill="#E3F2FD"/><circle cx="20" cy="46" r="5" fill="#333"/><circle cx="44" cy="46" r="5" fill="#333"/></> },
  departure: { d: <><path d="M32 4l-4 24-20 8 20 4 0 16 6-8 6 8 0-16 20-4-20-8z" fill="#42A5F5"/><line x1="4" y1="56" x2="60" y2="56" stroke="#333" strokeWidth="2"/></> },
  anchor: { d: <><circle cx="32" cy="14" r="6" fill="none" stroke="#455A64" strokeWidth="3"/><line x1="32" y1="20" x2="32" y2="56" stroke="#455A64" strokeWidth="3"/><path d="M12 44c4 8 12 12 20 12s16-4 20-12" stroke="#455A64" strokeWidth="3" fill="none"/><line x1="22" y1="32" x2="42" y2="32" stroke="#455A64" strokeWidth="3"/></> },
  slide: { d: <><path d="M20 12l0 20c0 8 4 14 12 18s16 4 24 2" stroke="#E53935" strokeWidth="4" fill="none"/><line x1="20" y1="12" x2="20" y2="56" stroke="#455A64" strokeWidth="3"/><line x1="12" y1="32" x2="28" y2="32" stroke="#455A64" strokeWidth="2"/></> },
  wheel: { d: <><circle cx="32" cy="32" r="22" fill="none" stroke="#333" strokeWidth="4"/><circle cx="32" cy="32" r="6" fill="#333"/>{[0,1,2,3,4,5].map(i=><line key={i} x1={32+Math.cos(i*1.047)*6} y1={32+Math.sin(i*1.047)*6} x2={32+Math.cos(i*1.047)*22} y2={32+Math.sin(i*1.047)*22} stroke="#333" strokeWidth="2"/>)}</> },
  
  // ─── BODY PARTS ───
  eyes: { d: <><ellipse cx="20" cy="32" rx="12" ry="10" fill="#F5F5F5"/><ellipse cx="44" cy="32" rx="12" ry="10" fill="#F5F5F5"/><circle cx="22" cy="32" r="5" fill="#5D4037"/><circle cx="46" cy="32" r="5" fill="#5D4037"/><circle cx="23" cy="30" r="2" fill="#fff"/><circle cx="47" cy="30" r="2" fill="#fff"/></> },
  ear: { d: <><path d="M36 8c14 4 20 14 20 28s-8 22-16 22-10-8-10-16" stroke="#FFCC80" strokeWidth="6" fill="#FFE0B2"/><path d="M32 28c4 0 8 4 8 10s-4 8-8 8" stroke="#E8A735" strokeWidth="2" fill="none"/></> },
  nose: { d: <><path d="M32 8c0 16-12 28-12 36s6 12 12 12 12-4 12-12-12-20-12-36z" fill="#FFCC80"/><ellipse cx="26" cy="44" rx="4" ry="3" fill="#E8A735"/><ellipse cx="38" cy="44" rx="4" ry="3" fill="#E8A735"/></> },
  mouth: { d: <><path d="M12 28c4 12 16 20 20 20s16-8 20-20" fill="#E53935"/><path d="M12 28c4 4 16 8 20 8s16-4 20-8" fill="#F5F5F5"/></> },
  tongue: { d: <><path d="M16 24c0 0 4 8 16 8s16-8 16-8v8c0 12-8 24-16 24s-16-12-16-24z" fill="#E53935"/><path d="M32 36v16" stroke="#C62828" strokeWidth="2"/></> },
  hand: { d: <><path d="M22 52V28c0-2 2-4 4-4s4 2 4 4v-8c0-2 2-4 4-4s4 2 4 4v-4c0-2 2-4 4-4s4 2 4 4v4c0-2 2-4 4-4s4 2 4 4v20c0 8-6 16-14 16h-4c-6 0-10-4-10-8z" fill="#FFCC80"/></> },
  leg: { d: <><rect x="24" y="8" width="16" height="36" rx="8" fill="#FFCC80"/><path d="M24 44c0 8 4 14 14 14h14c2 0 4-2 4-4s-2-4-4-4h-8c-4 0-4-2-4-6" fill="#FFCC80"/></> },
  foot: { d: <><path d="M16 32c0-6 6-12 12-12h8c6 0 12 6 12 12v4c0 0 4 4 4 8s-2 8-6 8h-32c-4 0-6-4-6-8s4-8 4-8z" fill="#FFCC80"/>{[0,1,2,3,4].map(i=><circle key={i} cx={20+i*6} cy={26} r="3" fill="#FFE0B2"/>)}</> },
  tooth: { d: <><path d="M20 12c0-4 4-8 12-8s12 4 12 8c0 12-4 20-6 28s-2 12-6 12-4-4-6-12-6-16-6-28z" fill="#F5F5F5"/><path d="M32 12v40" stroke="#E0E0E0" strokeWidth="1"/></> },
  brain: { d: <><path d="M32 8c-12 0-20 8-20 20s4 16 8 20c2 2 6 4 12 4s10-2 12-4c4-4 8-8 8-20s-8-20-20-20z" fill="#F48FB1"/><path d="M32 8v48" stroke="#EC407A" strokeWidth="1.5"/><path d="M18 24c8 4 12-2 14 4" stroke="#EC407A" strokeWidth="1.5" fill="none"/><path d="M46 24c-8 4-12-2-14 4" stroke="#EC407A" strokeWidth="1.5" fill="none"/><path d="M16 36c10 2 12 6 16 2" stroke="#EC407A" strokeWidth="1.5" fill="none"/><path d="M48 36c-10 2-12 6-16 2" stroke="#EC407A" strokeWidth="1.5" fill="none"/></> },
  lungs: { d: <><rect x="30" y="8" width="4" height="24" rx="2" fill="#EF9A9A"/><path d="M30 20c-8 4-18 8-18 20s6 12 12 12 10-4 10-12" fill="#EF9A9A"/><path d="M34 20c8 4 18 8 18 20s-6 12-12 12-10-4-10-12" fill="#E57373"/></> },
  bone: { d: <><rect x="20" y="28" width="24" height="8" rx="4" fill="#F5F5F5"/><circle cx="18" cy="26" r="6" fill="#F5F5F5"/><circle cx="18" cy="38" r="6" fill="#F5F5F5"/><circle cx="46" cy="26" r="6" fill="#F5F5F5"/><circle cx="46" cy="38" r="6" fill="#F5F5F5"/></> },
  palms: { d: <><path d="M12 52V32c0-4 4-8 8-8s8 4 8 8v-12c0-2 2-4 4-4s4 2 4 4v12c0-4 4-8 8-8s8 4 8 8v20" fill="#FFCC80" stroke="#E8A735" strokeWidth="1"/></> },
  muscle: { d: <><path d="M16 40c0-12 8-28 16-28s8 8 8 16c4-4 10-4 12 2s0 16-8 22c-4 2-8 2-12 0s-16-4-16-12z" fill="#FFCC80"/><path d="M32 12c0 8 0 16 0 24" stroke="#E8A735" strokeWidth="2" fill="none"/></> },
  
  // ─── PEOPLE & JOBS ───
  doctor: { d: <><circle cx="32" cy="18" r="12" fill="#FFCC80"/><rect x="16" y="30" width="32" height="28" rx="4" fill="#F5F5F5"/><rect x="28" y="34" width="8" height="2" rx="1" fill="#E53935"/><rect x="31" y="31" width="2" height="8" rx="1" fill="#E53935"/><circle cx="32" cy="8" r="4" fill="#F5F5F5"/><circle cx="32" cy="8" r="2" fill="#E53935"/></> },
  chef: { d: <><circle cx="32" cy="22" r="12" fill="#FFCC80"/><rect x="18" y="34" width="28" height="24" rx="4" fill="#F5F5F5"/><ellipse cx="32" cy="10" rx="16" ry="10" fill="#F5F5F5"/><circle cx="32" cy="6" r="6" fill="#FAFAFA"/></> },
  artist: { d: <><circle cx="32" cy="18" r="12" fill="#FFCC80"/><rect x="18" y="30" width="28" height="28" rx="4" fill="#CE93D8"/><circle cx="32" cy="10" r="8" fill="#333" opacity="0.8"/><circle cx="28" cy="8" r="2" fill="#E53935"/></> },
  teacher: { d: <><circle cx="32" cy="18" r="12" fill="#FFCC80"/><rect x="18" y="30" width="28" height="28" rx="4" fill="#42A5F5"/><rect x="8" y="32" width="16" height="20" rx="2" fill="#4CAF50"/><rect x="10" y="36" width="12" height="12" rx="1" fill="#81C784"/></> },
  police: { d: <><circle cx="32" cy="20" r="12" fill="#FFCC80"/><rect x="18" y="32" width="28" height="26" rx="4" fill="#1E88E5"/><path d="M22 10l10-6 10 6" fill="#1E88E5"/><circle cx="32" cy="40" r="3" fill="#FFD54F"/></> },
  worker: { d: <><circle cx="32" cy="22" r="12" fill="#FFCC80"/><rect x="18" y="34" width="28" height="24" rx="4" fill="#FF9800"/><rect x="20" y="10" width="24" height="8" rx="2" fill="#FDD835"/><rect x="16" y="16" width="32" height="4" rx="1" fill="#F9A825"/></> },
  pilot: { d: <><circle cx="32" cy="20" r="12" fill="#FFCC80"/><rect x="18" y="32" width="28" height="26" rx="4" fill="#37474F"/><path d="M24 12l8-4 8 4" fill="#37474F"/><rect x="24" y="12" width="16" height="4" rx="1" fill="#455A64"/></> },
  farmer: { d: <><circle cx="32" cy="22" r="12" fill="#FFCC80"/><rect x="18" y="34" width="28" height="24" rx="4" fill="#8BC34A"/><ellipse cx="32" cy="12" rx="14" ry="4" fill="#A1887F"/><ellipse cx="32" cy="10" rx="10" ry="8" fill="#8D6E63"/></> },
  maleChef: { d: <><circle cx="32" cy="22" r="12" fill="#FFCC80"/><rect x="18" y="34" width="28" height="24" rx="4" fill="#F5F5F5"/><ellipse cx="32" cy="10" rx="14" ry="8" fill="#F5F5F5"/></> },
  office: { d: <><circle cx="32" cy="18" r="12" fill="#FFCC80"/><rect x="18" y="30" width="28" height="28" rx="4" fill="#455A64"/><rect x="26" y="34" width="12" height="16" rx="1" fill="#F5F5F5"/><path d="M30 34l2 6 2-6" fill="#E53935"/></> },
  firefighter: { d: <><circle cx="32" cy="22" r="12" fill="#FFCC80"/><rect x="18" y="34" width="28" height="24" rx="4" fill="#F9A825"/><rect x="20" y="10" width="24" height="10" rx="4" fill="#E53935"/><rect x="24" y="8" width="16" height="4" rx="2" fill="#C62828"/></> },
  woman: { d: <><circle cx="32" cy="18" r="12" fill="#FFCC80"/><path d="M20 14c0-10 8-14 12-14s12 4 12 14" fill="#333"/><rect x="18" y="30" width="28" height="28" rx="4" fill="#CE93D8"/></> },
  haircut: { d: <><circle cx="32" cy="20" r="12" fill="#FFCC80"/><path d="M20 16c0-10 8-14 12-14s12 4 12 14" fill="#5D4037"/><rect x="46" y="24" width="4" height="24" rx="1" fill="#BDBDBD"/><path d="M46 24l8-8M50 24l8-8" stroke="#BDBDBD" strokeWidth="2"/></> },
  crown: { d: <><polygon points="8,40 8,20 20,30 32,14 44,30 56,20 56,40" fill="#FDD835"/><rect x="8" y="40" width="48" height="8" rx="2" fill="#F9A825"/>{[0,1,2].map(i=><circle key={i} cx={20+i*12} cy={44} r="3" fill={['#E53935','#4CAF50','#42A5F5'][i]}/>)}</> },
  tophat: { d: <><ellipse cx="32" cy="44" rx="24" ry="6" fill="#333"/><rect x="18" y="12" width="28" height="32" rx="2" fill="#37474F"/><rect x="16" y="40" width="32" height="8" rx="2" fill="#333"/></> },
  
  // ─── MEDICAL ───
  syringe: { d: <><rect x="30" y="8" width="4" height="40" rx="2" fill="#ECEFF1"/><rect x="26" y="44" width="12" height="4" rx="1" fill="#BDBDBD"/><rect x="24" y="48" width="16" height="4" rx="1" fill="#90A4AE"/><rect x="30" y="52" width="4" height="8" rx="1" fill="#BDBDBD"/>{[0,1,2].map(i=><line key={i} x1="26" y1={18+i*8} x2="30" y2={18+i*8} stroke="#42A5F5" strokeWidth="1.5"/>)}</> },
  pill: { d: <><rect x="12" y="24" width="40" height="16" rx="8" fill="#E53935"/><rect x="32" y="24" width="20" height="16" rx="8" fill="#F5F5F5"/></> },
  bandage: { d: <><rect x="8" y="20" width="48" height="24" rx="4" fill="#FFCC80"/><rect x="22" y="20" width="20" height="24" rx="2" fill="#F5F5F5"/><circle cx="28" cy="30" r="2" fill="#E0E0E0"/><circle cx="36" cy="30" r="2" fill="#E0E0E0"/><circle cx="28" cy="38" r="2" fill="#E0E0E0"/><circle cx="36" cy="38" r="2" fill="#E0E0E0"/></> },
  stethoscope: { d: <><path d="M20 12v12c0 8 6 14 12 14s12-6 12-14v-12" stroke="#455A64" strokeWidth="3" fill="none"/><circle cx="20" cy="10" r="4" fill="#42A5F5"/><circle cx="44" cy="10" r="4" fill="#42A5F5"/><circle cx="32" cy="42" r="6" fill="#455A64"/><circle cx="32" cy="42" r="3" fill="#90A4AE"/></> },
  
  // ─── MUSIC ───
  guitar: { d: <><ellipse cx="24" cy="44" rx="14" ry="12" fill="#A1887F"/><ellipse cx="24" cy="44" rx="4" ry="4" fill="#333"/><rect x="34" y="8" width="4" height="36" rx="2" fill="#795548"/><rect x="30" y="6" width="12" height="6" rx="2" fill="#5D4037"/></> },
  piano: { d: <><rect x="6" y="16" width="52" height="32" rx="4" fill="#F5F5F5"/>{[0,1,2,3,4,5,6].map(i=><rect key={i} x={8+i*7.4} y="16" width="6" height="32" fill="none" stroke="#E0E0E0" strokeWidth="1"/>)}{[0,1,3,4,5].map(i=><rect key={`b${i}`} x={12+i*7.4} y="16" width="5" height="20" rx="1" fill="#333"/>)}</> },
  trumpet: { d: <><path d="M8 28c0-4 4-8 8-8h20c8 0 16 4 20 12s-4 16-12 12l-28 0c-4 0-8-4-8-8z" fill="#FFD54F"/><circle cx="52" cy="32" r="10" fill="#FDD835" stroke="#F9A825" strokeWidth="2"/></> },
  violin: { d: <><ellipse cx="28" cy="42" rx="12" ry="10" fill="#A1887F"/><ellipse cx="28" cy="24" rx="10" ry="8" fill="#A1887F"/><rect x="27" y="16" width="2" height="34" fill="#795548"/><rect x="38" y="4" width="2" height="48" rx="1" fill="#5D4037" transform="rotate(15 39 28)"/>{[0,1].map(i=><line key={i} x1="28" y1={22+i*8} x2="28" y2={26+i*8} stroke="#333" strokeWidth="0.5"/>)}</> },
  drum: { d: <><ellipse cx="32" cy="44" rx="22" ry="8" fill="#E53935"/><rect x="10" y="20" width="44" height="24" rx="0" fill="#EF5350"/><ellipse cx="32" cy="20" rx="22" ry="8" fill="#F5F5F5"/><ellipse cx="32" cy="20" rx="20" ry="6" fill="#ECEFF1"/><line x1="14" y1="24" x2="50" y2="40" stroke="#FFD54F" strokeWidth="2"/><line x1="50" y1="24" x2="14" y2="40" stroke="#FFD54F" strokeWidth="2"/></> },
  microphone: { d: <><circle cx="32" cy="18" r="12" fill="#455A64"/><rect x="30" y="30" width="4" height="20" rx="2" fill="#BDBDBD"/><path d="M22 50c0 4 4 6 10 6s10-2 10-6" fill="none" stroke="#BDBDBD" strokeWidth="3"/>{[0,1,2].map(i=><line key={i} x1="22" y1={12+i*5} x2="42" y2={12+i*5} stroke="#78909C" strokeWidth="1"/>)}</> },
  flute: { d: <><rect x="4" y="28" width="56" height="8" rx="4" fill="#BDBDBD"/>{[0,1,2,3,4,5].map(i=><circle key={i} cx={14+i*8} cy="32" r="2.5" fill="#78909C"/>)}</> },
  
  // ─── OBJECTS ───
  books: { d: <><rect x="10" y="12" width="12" height="40" rx="2" fill="#42A5F5" transform="rotate(-5 16 32)"/><rect x="22" y="10" width="12" height="42" rx="2" fill="#E53935"/><rect x="34" y="14" width="12" height="38" rx="2" fill="#4CAF50" transform="rotate(5 40 32)"/></> },
  openBook: { d: <><path d="M32 16c-8-4-16-6-24-4v36c8-2 16 0 24 4" fill="#F5F5F5"/><path d="M32 16c8-4 16-6 24-4v36c-8-2-16 0-24 4" fill="#ECEFF1"/><line x1="32" y1="16" x2="32" y2="52" stroke="#E0E0E0" strokeWidth="1"/>{[0,1,2].map(i=><line key={i} x1="14" y1={24+i*8} x2="28" y2={22+i*8} stroke="#BDBDBD" strokeWidth="1"/>)}</> },
  wrench: { d: <><path d="M44 8c-6 0-12 6-12 12 0 2 0 4 1 6L14 45c-2 2-2 6 0 8s6 2 8 0l19-19c2 1 4 1 6 1 6 0 12-6 12-12l-8 8-6-6 8-8c-2-1-6-1-9 1z" fill="#78909C"/></> },
  hammer: { d: <><rect x="28" y="28" width="6" height="28" rx="2" fill="#A1887F"/><rect x="12" y="12" width="38" height="16" rx="4" fill="#78909C"/><rect x="12" y="12" width="18" height="16" rx="4" fill="#90A4AE"/></> },
  knife: { d: <><path d="M32 4c-2 0-4 2-4 4v28h8V8c0-2-2-4-4-4z" fill="#BDBDBD"/><rect x="26" y="36" width="12" height="16" rx="2" fill="#5D4037"/><rect x="26" y="34" width="12" height="4" rx="1" fill="#455A64"/></> },
  box: { d: <><rect x="8" y="20" width="48" height="36" rx="4" fill="#A1887F"/><rect x="8" y="16" width="48" height="10" rx="4" fill="#8D6E63"/><rect x="26" y="20" width="12" height="8" rx="2" fill="#795548"/></> },
  extinguisher: { d: <><rect x="22" y="20" width="20" height="36" rx="4" fill="#E53935"/><rect x="28" y="8" width="8" height="14" rx="2" fill="#BDBDBD"/><rect x="24" y="4" width="16" height="6" rx="2" fill="#333"/><path d="M40 8c4-2 8 0 8 4" stroke="#333" strokeWidth="2" fill="none"/></> },
  brick: { d: <><rect x="4" y="16" width="56" height="32" rx="2" fill="#E53935"/>{[0,1].map(i=><>{[0,1,2].map(j=><rect key={`${i}${j}`} x={6+(i%2?14:0)+j*20} y={18+i*14} width="16" height="12" rx="1" fill="#EF5350" stroke="#C62828" strokeWidth="1"/>)}</>)}</> },
  teddyBear: { d: <><circle cx="32" cy="36" r="18" fill="#A1887F"/><circle cx="16" cy="22" r="8" fill="#A1887F"/><circle cx="48" cy="22" r="8" fill="#A1887F"/><circle cx="16" cy="22" r="5" fill="#BCAAA4"/><circle cx="48" cy="22" r="5" fill="#BCAAA4"/><ellipse cx="32" cy="42" rx="8" ry="6" fill="#BCAAA4"/><circle cx="26" cy="32" r="2.5" fill="#333"/><circle cx="38" cy="32" r="2.5" fill="#333"/><ellipse cx="32" cy="38" rx="3" ry="2" fill="#333"/></> },
  phone: { d: <><rect x="18" y="6" width="28" height="52" rx="4" fill="#37474F"/><rect x="20" y="12" width="24" height="38" rx="2" fill="#E3F2FD"/><circle cx="32" cy="54" r="2" fill="#546E7A"/></> },
  key: { d: <><circle cx="20" cy="24" r="10" fill="#FFD54F" stroke="#F9A825" strokeWidth="2"/><circle cx="20" cy="24" r="4" fill="none" stroke="#F9A825" strokeWidth="2"/><rect x="28" y="22" width="28" height="4" rx="2" fill="#FFD54F"/><rect x="48" y="22" width="4" height="10" rx="1" fill="#FFD54F"/><rect x="40" y="22" width="4" height="8" rx="1" fill="#FFD54F"/></> },
  crystalBall: { d: <><circle cx="32" cy="28" r="20" fill="#CE93D8" opacity="0.6"/><circle cx="32" cy="28" r="18" fill="#E1BEE7" opacity="0.4"/><ellipse cx="26" cy="22" rx="6" ry="4" fill="rgba(255,255,255,0.4)"/><rect x="20" y="48" width="24" height="8" rx="2" fill="#455A64"/></> },
  seat: { d: <><rect x="14" y="20" width="36" height="8" rx="3" fill="#1E88E5"/><rect x="16" y="28" width="32" height="20" rx="3" fill="#42A5F5"/><rect x="14" y="48" width="4" height="10" rx="1" fill="#BDBDBD"/><rect x="46" y="48" width="4" height="10" rx="1" fill="#BDBDBD"/></> },
  spoon: { d: <><ellipse cx="32" cy="16" rx="10" ry="12" fill="#BDBDBD"/><rect x="30" y="26" width="4" height="32" rx="2" fill="#9E9E9E"/></> },
  paintbrush: { d: <><rect x="30" y="28" width="4" height="28" rx="2" fill="#A1887F"/><path d="M28 8c0-2 2-4 4-4s4 2 4 4v22h-8z" fill="#E53935"/><rect x="28" y="26" width="8" height="4" rx="1" fill="#BDBDBD"/></> },
  frame: { d: <><rect x="8" y="12" width="48" height="40" rx="4" fill="#A1887F"/><rect x="12" y="16" width="40" height="32" rx="2" fill="#E3F2FD"/><path d="M12 48l16-16 8 8 12-12 4 4" stroke="#81C784" strokeWidth="2" fill="none"/><circle cx="42" cy="24" r="4" fill="#FFD54F"/></> },
  window: { d: <><rect x="10" y="10" width="44" height="44" rx="4" fill="#E3F2FD"/><line x1="32" y1="10" x2="32" y2="54" stroke="#BDBDBD" strokeWidth="3"/><line x1="10" y1="32" x2="54" y2="32" stroke="#BDBDBD" strokeWidth="3"/><rect x="10" y="10" width="44" height="44" rx="4" fill="none" stroke="#A1887F" strokeWidth="4"/></> },
  bucket: { d: <><path d="M14 24l4 28c0 4 24 4 24 0l4-28z" fill="#42A5F5"/><ellipse cx="32" cy="24" rx="18" ry="4" fill="#1E88E5"/><path d="M18 20c0-8 8-12 14-12s14 4 14 12" stroke="#BDBDBD" strokeWidth="3" fill="none"/></> },
  toothbrush: { d: <><rect x="28" y="8" width="8" height="48" rx="4" fill="#42A5F5"/><rect x="26" y="8" width="12" height="16" rx="2" fill="#E3F2FD"/>{[0,1,2,3].map(i=><rect key={i} x={28+i*2} y="10" width="1.5" height="10" rx="0.5" fill="#BDBDBD"/>)}</> },
  rock: { d: <><path d="M12 44c-2-8 4-20 12-28s16-8 22-4 8 12 6 24-8 16-18 18-20-2-22-10z" fill="#78909C"/><path d="M20 32c4-8 12-16 18-16" stroke="#90A4AE" strokeWidth="2" fill="none"/></> },
  lotion: { d: <><rect x="20" y="20" width="24" height="34" rx="4" fill="#F8BBD0"/><rect x="24" y="12" width="16" height="10" rx="2" fill="#ECEFF1"/><rect x="28" y="6" width="8" height="8" rx="2" fill="#BDBDBD"/></> },
  lamp: { d: <><ellipse cx="32" cy="48" rx="12" ry="4" fill="#A1887F"/><path d="M24 48c-2-8 0-20 8-28s8 20 8 28" fill="#FFD54F" opacity="0.8"/><circle cx="32" cy="32" r="4" fill="#FF9800"/></> },
  
  // ─── CLOTHING ───
  coat: { d: <><path d="M22 14c-6 4-12 12-14 22l12 0 0 20h24l0-20 12 0c-2-10-8-18-14-22" fill="#1E88E5"/><path d="M22 14c4-4 8-6 10-6s6 2 10 6" fill="#1565C0"/>{[0,1,2,3].map(i=><circle key={i} cx="32" cy={24+i*8} r="2" fill="#BBDEFB"/>)}</> },
  sock: { d: <><path d="M24 8v32c0 6-4 10-4 14s4 6 12 6 12-2 12-6c0-4-4-8-4-14V8z" fill="#E53935"/><path d="M24 8h16v6h-16z" fill="#ECEFF1"/></> },
  swimsuit: { d: <><path d="M20 16c4-4 8-6 12-6s8 2 12 6v12l-6 8h-12l-6-8z" fill="#E91E63"/><path d="M26 36v16h-8c0-8 2-12 8-16z" fill="#E91E63"/><path d="M38 36v16h8c0-8-2-12-8-16z" fill="#E91E63"/></> },
  sunglasses: { d: <><ellipse cx="20" cy="32" rx="14" ry="10" fill="#37474F"/><ellipse cx="44" cy="32" rx="14" ry="10" fill="#37474F"/><path d="M34 32c-2-4-4-4-4 0" stroke="#333" strokeWidth="2" fill="none"/><line x1="6" y1="28" x2="4" y2="24" stroke="#333" strokeWidth="2"/><line x1="58" y1="28" x2="60" y2="24" stroke="#333" strokeWidth="2"/></> },
  redSock: { d: <><path d="M24 8v32c0 6-4 10-4 14s4 6 12 6 12-2 12-6c0-4-4-8-4-14V8z" fill="#E53935"/><path d="M24 8h16v8h-16z" fill="#C62828"/></> },
  blueSock: { d: <><path d="M24 8v32c0 6-4 10-4 14s4 6 12 6 12-2 12-6c0-4-4-8-4-14V8z" fill="#1E88E5"/><path d="M24 8h16v8h-16z" fill="#1565C0"/></> },
  
  // ─── BUILDINGS ───
  house: { d: <><polygon points="32,8 6,32 58,32" fill="#E53935"/><rect x="14" y="32" width="36" height="24" fill="#FFE082"/><rect x="26" y="38" width="12" height="18" rx="1" fill="#A1887F"/><rect x="16" y="36" width="8" height="8" fill="#E3F2FD" stroke="#BDBDBD" strokeWidth="1"/></> },
  houseGarden: { d: <><polygon points="32,8 6,32 58,32" fill="#E53935"/><rect x="14" y="32" width="36" height="24" fill="#FFE082"/><rect x="26" y="38" width="12" height="18" rx="1" fill="#A1887F"/><circle cx="50" cy="50" r="4" fill="#4CAF50"/><circle cx="56" cy="48" r="5" fill="#66BB6A"/></> },
  building: { d: <><rect x="14" y="12" width="36" height="44" rx="2" fill="#78909C"/>{[0,1,2,3].map(i=><>{[0,1,2].map(j=><rect key={`${i}${j}`} x={18+j*10} y={16+i*10} width="6" height="6" rx="1" fill="#E3F2FD"/>)}</>)}</> },
  hospital: { d: <><rect x="12" y="14" width="40" height="42" rx="4" fill="#F5F5F5"/><rect x="28" y="18" width="8" height="2" rx="1" fill="#E53935"/><rect x="31" y="15" width="2" height="8" rx="1" fill="#E53935"/>{[0,1].map(i=><>{[0,1,2].map(j=><rect key={`${i}${j}`} x={16+j*12} y={30+i*12} width="8" height="8" rx="1" fill="#E3F2FD"/>)}</>)}</> },
  school: { d: <><rect x="8" y="24" width="48" height="32" rx="2" fill="#FFE082"/><polygon points="32,8 8,24 56,24" fill="#E53935"/>{[0,1,2,3].map(i=><rect key={i} x={14+i*12} y={32} width="8" height="8" rx="1" fill="#E3F2FD"/>)}<rect x="28" y="40" width="8" height="16" rx="1" fill="#A1887F"/></> },
  mall: { d: <><rect x="6" y="16" width="52" height="40" rx="4" fill="#ECEFF1"/><rect x="10" y="20" width="44" height="8" rx="2" fill="#42A5F5"/>{[0,1,2].map(i=><rect key={i} x={12+i*14} y="32" width="10" height="20" rx="2" fill="#E3F2FD"/>)}</> },
  mosque: { d: <><rect x="12" y="28" width="40" height="28" rx="2" fill="#F5F5F5"/><path d="M32 8c-10 0-16 10-16 20h32c0-10-6-20-16-20z" fill="#ECEFF1"/><circle cx="32" cy="14" r="4" fill="#FDD835"/><rect x="4" y="12" width="4" height="44" rx="2" fill="#BDBDBD"/><rect x="56" y="12" width="4" height="44" rx="2" fill="#BDBDBD"/><path d="M4 12c0-4 2-6 2-6s2 2 2 6" fill="#FDD835"/><path d="M56 12c0-4 2-6 2-6s2 2 2 6" fill="#FDD835"/></> },
  
  // ─── PLACES ───
  mountain: { d: <><polygon points="32,4 4,56 60,56" fill="#607D8B"/><polygon points="32,4 24,20 40,20" fill="#F5F5F5"/><polygon points="16,36 4,56 28,56" fill="#78909C"/></> },
  beach: { d: <><rect x="0" y="36" width="64" height="28" fill="#FFE082"/><rect x="0" y="0" width="64" height="36" fill="#42A5F5"/><path d="M0 36c16-4 32 2 48-2s12 2 16 2" fill="#64B5F6" opacity="0.5"/><rect x="44" y="16" width="3" height="40" rx="1" fill="#A1887F"/><path d="M46 16c8 2 12 8 8 14" stroke="#4CAF50" strokeWidth="3" fill="none"/><path d="M46 18c-8 2-12 8-8 14" stroke="#66BB6A" strokeWidth="3" fill="none"/></> },
  desert: { d: <><rect x="0" y="32" width="64" height="32" fill="#FFE082"/><rect x="0" y="0" width="64" height="32" fill="#42A5F5"/><circle cx="48" cy="16" r="8" fill="#FFD54F"/><path d="M0 36c16-8 32 4 48-4s12 4 16 4" fill="#FDD835" opacity="0.5"/></> },
  road: { d: <><rect x="0" y="16" width="64" height="32" fill="#616161"/>{[0,1,2,3,4].map(i=><rect key={i} x={4+i*12} y="30" width="8" height="4" rx="1" fill="#FFD54F"/>)}<rect x="0" y="16" width="64" height="2" fill="#F5F5F5"/><rect x="0" y="46" width="64" height="2" fill="#F5F5F5"/></> },
  railway: { d: <><rect x="0" y="26" width="64" height="12" fill="#795548"/>{[0,1,2,3,4,5].map(i=><rect key={i} x={2+i*10} y="22" width="6" height="20" rx="1" fill="#A1887F"/>)}<rect x="0" y="30" width="64" height="1.5" fill="#BDBDBD"/><rect x="0" y="34" width="64" height="1.5" fill="#BDBDBD"/></> },
  
  // ─── FLAGS ───
  flagMY: { d: <><rect x="8" y="8" width="48" height="48" rx="4" fill="#CC0001"/>{[0,1,2,3,4,5,6].map(i=><rect key={i} x="8" y={8+i*7} width="48" height="3.5" fill={i%2?"#FFF":"#CC0001"}/>)}<rect x="8" y="8" width="24" height="24" fill="#010066"/><circle cx="18" cy="20" r="6" fill="#FC0"/><path d="M22 20l-4-3v6z" fill="#010066"/><polygon points="22,12 23,16 27,16 24,18 25,22 22,20 19,22 20,18 17,16 21,16" fill="#FC0"/></> },
  flagJP: { d: <><rect x="8" y="12" width="48" height="40" rx="4" fill="#FFF"/><circle cx="32" cy="32" r="12" fill="#BC002D"/></> },
  flagFR: { d: <><rect x="8" y="12" width="16" height="40" rx="4" fill="#002395"/><rect x="24" y="12" width="16" height="40" fill="#FFF"/><rect x="40" y="12" width="16" height="40" rx="4" fill="#ED2939"/></> },
  flagBR: { d: <><rect x="8" y="12" width="48" height="40" rx="4" fill="#009C3B"/><polygon points="32,16 52,32 32,48 12,32" fill="#FFDF00"/><circle cx="32" cy="32" r="8" fill="#002776"/></> },
  flagCN: { d: <><rect x="8" y="12" width="48" height="40" rx="4" fill="#DE2910"/><polygon points="18,20 19,24 23,24 20,26 21,30 18,28 15,30 16,26 13,24 17,24" fill="#FFDE00"/></> },
  flagIN: { d: <><rect x="8" y="12" width="48" height="13" rx="4" fill="#FF9933"/><rect x="8" y="25" width="48" height="14" fill="#FFF"/><rect x="8" y="39" width="48" height="13" rx="4" fill="#138808"/><circle cx="32" cy="32" r="4" fill="#000080"/></> },
  flagAR: { d: <><rect x="8" y="12" width="48" height="13" rx="4" fill="#74ACDF"/><rect x="8" y="25" width="48" height="14" fill="#FFF"/><rect x="8" y="39" width="48" height="13" rx="4" fill="#74ACDF"/><circle cx="32" cy="32" r="4" fill="#F6B40E"/></> },
  flagDE: { d: <><rect x="8" y="12" width="48" height="13" rx="4" fill="#000"/><rect x="8" y="25" width="48" height="14" fill="#DD0000"/><rect x="8" y="39" width="48" height="13" rx="4" fill="#FFCE00"/></> },
  flagIT: { d: <><rect x="8" y="12" width="16" height="40" rx="4" fill="#009246"/><rect x="24" y="12" width="16" height="40" fill="#FFF"/><rect x="40" y="12" width="16" height="40" rx="4" fill="#CE2B37"/></> },
  flagKR: { d: <><rect x="8" y="12" width="48" height="40" rx="4" fill="#FFF"/><circle cx="32" cy="32" r="10" fill="#CD2E3A"/><path d="M22 32c0-6 4-10 10-10" fill="#0047A0"/></> },
  flagMX: { d: <><rect x="8" y="12" width="16" height="40" rx="4" fill="#006847"/><rect x="24" y="12" width="16" height="40" fill="#FFF"/><rect x="40" y="12" width="16" height="40" rx="4" fill="#CE1126"/></> },
  flagSG: { d: <><rect x="8" y="12" width="48" height="20" rx="4" fill="#ED2939"/><rect x="8" y="32" width="48" height="20" rx="4" fill="#FFF"/><circle cx="20" cy="22" r="4" fill="#FFF"/><circle cx="22" cy="22" r="4" fill="#ED2939"/></> },
  flagID: { d: <><rect x="8" y="12" width="48" height="20" rx="4" fill="#CE1126"/><rect x="8" y="32" width="48" height="20" rx="4" fill="#FFF"/></> },
  
  // ─── SHAPES ───
  triangle: { d: <><polygon points="32,8 56,52 8,52" fill="#FF5722" stroke="#E64A19" strokeWidth="2"/></> },
  triangleDown: { d: <><polygon points="8,12 56,12 32,56" fill="#FF5722" stroke="#E64A19" strokeWidth="2"/></> },
  circle: { d: <><circle cx="32" cy="32" r="24" fill="none" stroke="#1E88E5" strokeWidth="3"/></> },
  square: { d: <><rect x="8" y="8" width="48" height="48" rx="2" fill="none" stroke="#4CAF50" strokeWidth="3"/></> },
  redCircle: { d: <><circle cx="32" cy="32" r="22" fill="#E53935"/></> },
  blueCircle: { d: <><circle cx="32" cy="32" r="22" fill="#1E88E5"/></> },
  diamond: { d: <><polygon points="32,4 56,32 32,60 8,32" fill="#42A5F5" stroke="#1E88E5" strokeWidth="2"/></> },
  pentagon: { d: <><polygon points="32,6 58,26 48,56 16,56 6,26" fill="#9C27B0" stroke="#7B1FA2" strokeWidth="2"/></> },
  rectangle: { d: <><rect x="6" y="18" width="52" height="28" rx="2" fill="#FF9800" stroke="#E65100" strokeWidth="2"/></> },
  
  // ─── EXPRESSIONS ───
  clap: { d: <><path d="M16 36c-4-2-6-8-2-12l8-16c2-4 6-2 4 2l-4 8" fill="#FFCC80"/><path d="M28 24c-2-4-6-14-4-18s6-2 4 2l4 16" fill="#FFCC80"/><path d="M36 22c0-4 0-16 2-18s6 0 4 4l-2 14" fill="#FFE0B2"/><path d="M44 28c2-4 4-14 6-16s6 2 2 6l-6 12" fill="#FFCC80"/>{[0,1,2].map(i=><line key={i} x1={20+i*8} y1={44+i*2} x2={16+i*8} y2={56+i*(-2)} stroke="#FFD54F" strokeWidth="2"/>)}</> },
  smile: { d: <><circle cx="32" cy="32" r="24" fill="#FFD54F"/><circle cx="22" cy="26" r="3" fill="#333"/><circle cx="42" cy="26" r="3" fill="#333"/><path d="M20 38c4 6 12 8 24 0" stroke="#333" strokeWidth="2.5" fill="none"/></> },
  sleep: { d: <><circle cx="32" cy="32" r="24" fill="#FFD54F"/><path d="M18 28c4 0 8 0 12-2" stroke="#333" strokeWidth="2.5" fill="none"/><path d="M34 28c4 0 8 0 12-2" stroke="#333" strokeWidth="2.5" fill="none"/><ellipse cx="32" cy="42" rx="4" ry="5" fill="#333"/><path d="M46 10l8 0-4 4 8 0-4 4 6 0" stroke="#42A5F5" strokeWidth="2" fill="none"/></> },
  no: { d: <><circle cx="32" cy="36" r="20" fill="#FFCC80"/><line x1="12" y1="24" x2="52" y2="24" stroke="#E53935" strokeWidth="3"/><path d="M18 20c4-2 8-2 12 2" stroke="#333" strokeWidth="2" fill="none"/><path d="M34 22c4-4 8-4 12-2" stroke="#333" strokeWidth="2" fill="none"/></> },
  celebrate: { d: <><path d="M14 52V32c0-4 4-8 8-8v28" fill="#FFCC80"/><path d="M42 52V32c0-4 4-8 8-8v28" fill="#FFE0B2"/>{[0,1,2,3,4].map(i=><circle key={i} cx={12+i*10} cy={16+((i%2)*4)} r="2" fill={['#E53935','#4CAF50','#FFD54F','#42A5F5','#CE93D8'][i]}/>)}</> },
  writing: { d: <><path d="M44 8l-28 28-4 16 16-4 28-28z" fill="#FFD54F"/><path d="M44 8l8 8" stroke="#333" strokeWidth="2"/><path d="M12 52l4-16" stroke="#333" strokeWidth="1.5" fill="none"/></> },
  speaking: { d: <><circle cx="24" cy="32" r="14" fill="#FFCC80"/><circle cx="20" cy="28" r="2" fill="#333"/><path d="M18 36c2 2 6 4 10 2" stroke="#333" strokeWidth="1.5" fill="none"/><path d="M40 24c4-2 8 0 10 4s0 8-4 8" stroke="#42A5F5" strokeWidth="2.5" fill="none"/><path d="M44 20c6-2 12 2 14 8s0 12-6 12" stroke="#42A5F5" strokeWidth="2" fill="none"/></> },
  running: { d: <><circle cx="36" cy="12" r="6" fill="#FFCC80"/><path d="M36 18l-4 14-10 10" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M32 32l12 14" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M36 18l10 8" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M36 18l-12 4" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/></> },
  swimming: { d: <><circle cx="20" cy="28" r="6" fill="#FFCC80"/><path d="M26 28l18 4" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M20 34l4 10" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M4 42c8-4 16 2 24-2s16 2 24-2" stroke="#42A5F5" strokeWidth="2.5" fill="none"/><path d="M4 50c8-4 16 2 24-2s16 2 24-2" stroke="#42A5F5" strokeWidth="2" fill="none"/></> },
  gymnastics: { d: <><circle cx="32" cy="10" r="6" fill="#FFCC80"/><path d="M32 16l0 16" stroke="#333" strokeWidth="3" fill="none"/><path d="M32 32l-10 14" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M32 32l10 14" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M32 22l-14-4" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M32 22l14-4" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/></> },
  walking: { d: <><circle cx="32" cy="10" r="6" fill="#FFCC80"/><path d="M32 16l0 18" stroke="#333" strokeWidth="3" fill="none"/><path d="M32 34l-8 18" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M32 34l8 18" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M32 22l-10 6" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M32 22l10 6" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/></> },
  shower: { d: <><rect x="28" y="4" width="8" height="20" rx="4" fill="#BDBDBD"/><circle cx="32" cy="24" r="8" fill="#90A4AE"/>{[0,1,2,3,4].map(i=><line key={i} x1={22+i*5} y1="32" x2={22+i*5} y2={42+i*2} stroke="#42A5F5" strokeWidth="2" strokeLinecap="round"/>)}</> },
  bed: { d: <><rect x="4" y="28" width="56" height="20" rx="4" fill="#1E88E5"/><rect x="8" y="18" width="20" height="14" rx="6" fill="#F5F5F5"/><rect x="4" y="48" width="4" height="8" rx="1" fill="#795548"/><rect x="56" y="48" width="4" height="8" rx="1" fill="#795548"/><rect x="4" y="24" width="56" height="6" rx="2" fill="#A1887F"/></> },
  
  // ─── MISC ───
  clock: { d: <><circle cx="32" cy="32" r="24" fill="#F5F5F5" stroke="#BDBDBD" strokeWidth="3"/><line x1="32" y1="32" x2="32" y2="16" stroke="#333" strokeWidth="3" strokeLinecap="round"/><line x1="32" y1="32" x2="44" y2="32" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/><circle cx="32" cy="32" r="3" fill="#E53935"/></> },
  hourglass: { d: <><path d="M16 8h32v4c0 12-8 16-16 20 8 4 16 8 16 20v4h-32v-4c0-12 8-16 16-20-8-4-16-8-16-20z" fill="none" stroke="#A1887F" strokeWidth="3"/><path d="M20 48c0-8 6-12 12-16 6 4 12 8 12 16z" fill="#FFE082"/></> },
  balloon: { d: <><ellipse cx="32" cy="24" rx="14" ry="18" fill="#E53935"/><path d="M32 42l-2 4 4 0-2 4 4 0-2 12" stroke="#9E9E9E" strokeWidth="1.5" fill="none"/><ellipse cx="28" cy="18" rx="4" ry="6" fill="rgba(255,255,255,0.3)"/></> },
  palette: { d: <><ellipse cx="32" cy="32" rx="24" ry="22" fill="#A1887F"/><circle cx="20" cy="22" r="5" fill="#E53935"/><circle cx="32" cy="18" r="5" fill="#42A5F5"/><circle cx="44" cy="22" r="5" fill="#4CAF50"/><circle cx="44" cy="36" r="5" fill="#FFD54F"/><circle cx="20" cy="38" r="8" fill="#8D6E63"/></> },
  masks: { d: <><circle cx="22" cy="28" r="14" fill="#FFD54F"/><path d="M16 32c2 4 6 6 12 0" stroke="#333" strokeWidth="2" fill="none"/><circle cx="16" cy="24" r="2" fill="#333"/><circle cx="28" cy="24" r="2" fill="#333"/><circle cx="42" cy="32" r="14" fill="#42A5F5"/><path d="M36 36c2-4 6-6 12 0" stroke="#333" strokeWidth="2" fill="none"/><circle cx="36" cy="28" r="2" fill="#333"/><circle cx="48" cy="28" r="2" fill="#333"/></> },
  soccerBall: { d: <><circle cx="32" cy="32" r="22" fill="#F5F5F5"/><polygon points="32,14 40,22 36,32 28,32 24,22" fill="#333"/><polygon points="20,40 28,38 32,48 24,52 16,46" fill="#333" opacity="0.6"/><polygon points="44,40 36,38 32,48 40,52 48,46" fill="#333" opacity="0.6"/></> },
  soccerKick: { d: <><circle cx="48" cy="20" r="10" fill="#F5F5F5"/><polygon points="48,12 52,18 48,22 44,18" fill="#333"/><path d="M36 24l-12 8" stroke="#90A4AE" strokeWidth="2" strokeDasharray="4 2"/></> },
  lightbulb: { d: <><path d="M24 36c-4-4-8-10-8-18 0-10 8-16 16-16s16 6 16 16c0 8-4 14-8 18" fill="#FFD54F"/><rect x="24" y="38" width="16" height="8" rx="2" fill="#BDBDBD"/><rect x="26" y="46" width="12" height="4" rx="4" fill="#9E9E9E"/><path d="M28 10c-4 2-6 6-6 10" stroke="#FFEE58" strokeWidth="2" fill="none"/></> },
  gem: { d: <><polygon points="32,4 48,20 32,56 16,20" fill="#42A5F5"/><polygon points="32,4 16,20 32,20 48,20" fill="#64B5F6"/><polygon points="16,20 32,56 32,20" fill="#1E88E5"/></> },
  blueHeart: { d: <><path d="M32 56c-16-12-28-24-28-36 0-8 6-14 14-14 6 0 10 4 14 10 4-6 8-10 14-10 8 0 14 6 14 14 0 12-12 24-28 36z" fill="#42A5F5"/></> },
  redHeart: { d: <><path d="M32 56c-16-12-28-24-28-36 0-8 6-14 14-14 6 0 10 4 14 10 4-6 8-10 14-10 8 0 14 6 14 14 0 12-12 24-28 36z" fill="#E53935"/></> },
  checkmark: { d: <><path d="M12 32l12 14 28-28" stroke="#4CAF50" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></> },
  abc: { d: <><text x="8" y="44" fontFamily="Arial" fontWeight="900" fontSize="28" fill="#42A5F5">A</text><text x="24" y="44" fontFamily="Arial" fontWeight="900" fontSize="28" fill="#E53935">B</text><text x="40" y="44" fontFamily="Arial" fontWeight="900" fontSize="28" fill="#4CAF50">C</text></> },
  refresh: { d: <><path d="M48 16c-4-4-10-8-16-8-12 0-22 10-22 22s10 22 22 22c10 0 18-6 20-16" stroke="#42A5F5" strokeWidth="4" fill="none"/><polygon points="48,6 56,16 48,16" fill="#42A5F5"/></> },
  arrowUp: { d: <><polygon points="32,8 52,32 40,32 40,56 24,56 24,32 12,32" fill="#4CAF50"/></> },
  arrowDown: { d: <><polygon points="32,56 52,32 40,32 40,8 24,8 24,32 12,32" fill="#E53935"/></> },
  hole: { d: <><ellipse cx="32" cy="36" rx="22" ry="12" fill="#333"/><ellipse cx="32" cy="36" rx="18" ry="8" fill="#212121"/></> },
  wind: { d: <><path d="M8 24c12 0 20-4 24-8s8 0 4 6-12 6-4 0" stroke="#90CAF9" strokeWidth="3" fill="none"/><path d="M12 36c8 0 16-2 20-6s8 0 4 4-8 4 0 0" stroke="#B0BEC5" strokeWidth="2.5" fill="none"/><path d="M16 46c6 0 12-2 16-4s6 0 2 4" stroke="#90CAF9" strokeWidth="2" fill="none"/></> },
  shield: { d: <><path d="M32 4c-12 4-24 6-24 16 0 16 12 32 24 40 12-8 24-24 24-40 0-10-12-12-24-16z" fill="#42A5F5"/><path d="M32 4c-12 4-24 6-24 16 0 16 12 32 24 40" fill="#1E88E5"/></> },
  robot: { d: <><rect x="14" y="20" width="36" height="30" rx="6" fill="#78909C"/><rect x="20" y="26" width="10" height="8" rx="2" fill="#E3F2FD"/><rect x="34" y="26" width="10" height="8" rx="2" fill="#E3F2FD"/><circle cx="25" cy="30" r="3" fill="#42A5F5"/><circle cx="39" cy="30" r="3" fill="#42A5F5"/><rect x="24" y="40" width="16" height="4" rx="2" fill="#E0E0E0"/><rect x="30" y="10" width="4" height="10" rx="2" fill="#BDBDBD"/><circle cx="32" cy="8" r="4" fill="#FFD54F"/></> },
  ice: { d: <><rect x="14" y="14" width="36" height="36" rx="4" fill="#E3F2FD"/><rect x="14" y="14" width="36" height="36" rx="4" fill="#BBDEFB" opacity="0.5"/><path d="M20 20l24 24M44 20l-24 24" stroke="#E1F5FE" strokeWidth="2"/></> },
  rosette: { d: <>{[0,1,2,3,4,5,6,7].map(i=><ellipse key={i} cx={32+Math.cos(i*0.785)*12} cy={32+Math.sin(i*0.785)*12} rx="6" ry="4" fill="#F48FB1" transform={`rotate(${i*45} ${32+Math.cos(i*0.785)*12} ${32+Math.sin(i*0.785)*12})`}/>)}<circle cx="32" cy="32" r="6" fill="#FFD54F"/></> },
  tanabata: { d: <><rect x="30" y="4" width="4" height="56" rx="2" fill="#4CAF50"/><path d="M14 12l18 8 18-8" stroke="#4CAF50" strokeWidth="2" fill="none"/>{[0,1,2].map(i=><rect key={i} x={16+i*10} y={20+i*8} width="8" height="12" rx="1" fill={['#E53935','#FFD54F','#CE93D8'][i]}/>)}</> },
  redEnvelope: { d: <><rect x="12" y="8" width="40" height="48" rx="4" fill="#E53935"/><rect x="12" y="8" width="40" height="16" rx="4" fill="#C62828"/><circle cx="32" cy="32" r="10" fill="#FFD54F"/></> },
  picture: { d: <><rect x="6" y="10" width="52" height="44" rx="4" fill="#A1887F"/><rect x="10" y="14" width="44" height="36" rx="2" fill="#E3F2FD"/><circle cx="22" cy="24" r="5" fill="#FFD54F"/><path d="M10 42l14-12 10 8 14-14 6 6v20h-44z" fill="#81C784"/></> },
  
  // ─── DICE ───
  dice1: { d: <><rect x="8" y="8" width="48" height="48" rx="8" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="2"/><circle cx="32" cy="32" r="5" fill="#333"/></> },
  dice2: { d: <><rect x="8" y="8" width="48" height="48" rx="8" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="2"/><circle cx="20" cy="20" r="5" fill="#333"/><circle cx="44" cy="44" r="5" fill="#333"/></> },
  dice3: { d: <><rect x="8" y="8" width="48" height="48" rx="8" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="2"/><circle cx="20" cy="20" r="5" fill="#333"/><circle cx="32" cy="32" r="5" fill="#333"/><circle cx="44" cy="44" r="5" fill="#333"/></> },
  dice4: { d: <><rect x="8" y="8" width="48" height="48" rx="8" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="2"/><circle cx="20" cy="20" r="5" fill="#333"/><circle cx="44" cy="20" r="5" fill="#333"/><circle cx="20" cy="44" r="5" fill="#333"/><circle cx="44" cy="44" r="5" fill="#333"/></> },
  dice5: { d: <><rect x="8" y="8" width="48" height="48" rx="8" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="2"/><circle cx="20" cy="20" r="4" fill="#333"/><circle cx="44" cy="20" r="4" fill="#333"/><circle cx="32" cy="32" r="4" fill="#333"/><circle cx="20" cy="44" r="4" fill="#333"/><circle cx="44" cy="44" r="4" fill="#333"/></> },
  dice6: { d: <><rect x="8" y="8" width="48" height="48" rx="8" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="2"/><circle cx="20" cy="18" r="4" fill="#333"/><circle cx="44" cy="18" r="4" fill="#333"/><circle cx="20" cy="32" r="4" fill="#333"/><circle cx="44" cy="32" r="4" fill="#333"/><circle cx="20" cy="46" r="4" fill="#333"/><circle cx="44" cy="46" r="4" fill="#333"/></> },
  
  // ─── SPORTS ───
  volleyball: { d: <><circle cx="32" cy="32" r="22" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="2"/><path d="M10 32c12-8 20 0 22 0s10-8 22 0" stroke="#FFD54F" strokeWidth="2" fill="none"/><path d="M32 10c0 12 4 18 0 22s-8 10 0 22" stroke="#42A5F5" strokeWidth="2" fill="none"/></> },
};

// ═══ COMPONENT EXPORTS ═══
// Used by page.js for world/game icons, star ratings, thumbnails, badges

// Maps world IDs to representative icon names
const WORLD_ICON_MAP = {
  abc: 'letter_a', numbers: 'number1', animals: 'cat', colours: 'palette',
  shapes: 'circle', body: 'heart', food: 'apple', transport: 'car',
  careers: 'doctor', music: 'guitar', safety: 'trafficLight', nature: 'tree',
  world: 'earth', places: 'house', daily: 'clock',
};

// Maps game IDs to representative icon names
const GAME_ICON_MAP = {
  'letter-trail': 'letter_a', 'letter-tree': 'tree', 'bee-flower': 'bee',
  'syllable-factory': 'factory', 'letter-bubbles': 'bubble', 'letter-puzzle': 'puzzle',
  'abc-song': 'microphone', 'letter-stories': 'book',
  'block-tower': 'blocks', 'count-objects': 'number1', 'math-machine': 'calculator',
  'subtraction-shop': 'shop', 'number-trace': 'pencil', 'bigger-smaller': 'scales',
  'patterns': 'pattern', 'magic-dice': 'dice1',
  'animal-homes': 'house', 'animal-sounds': 'trumpet', 'animal-puzzle': 'puzzle',
  'animal-food': 'apple', 'animal-encyclopedia': 'book', 'mimic-animal': 'monkey',
  'colour-mixing': 'palette', 'magic-colouring': 'paintbrush', 'match-colour': 'rainbow',
  'sock-pairs': 'socks', 'colour-hunter': 'magnifyingGlass',
  'shape-hunt': 'magnifyingGlass', 'magic-tangram': 'triangle', 'draw-shapes': 'pencil',
  'build-pictures': 'blocks', 'three-d-shapes': 'cube',
  'label-body': 'heart', 'move-together': 'runner', 'healthy-habits': 'toothbrush',
  'little-doctor': 'doctor', 'body-song': 'microphone',
  'little-chef': 'chef', 'grocery-store': 'shop', 'healthy-or-not': 'apple',
  'fruit-or-veg': 'carrot', 'free-draw': 'paintbrush',
  'sort-transport': 'car', 'build-vehicle': 'wrench', 'world-vehicles': 'airplane',
  'role-play': 'hat', 'job-tools': 'wrench', 'visit-workplace': 'house', 'who-am-i': 'magnifyingGlass',
  'instruments': 'guitar', 'follow-beat': 'drum', 'childrens-songs': 'microphone', 'learn-notes': 'musicNote',
  'road-safety': 'trafficLight',
  'our-garden': 'flower', 'weather': 'sun', 'plants': 'seedling',
  'experiments': 'flask', 'day-night': 'moon',
  'world-map': 'earth', 'world-houses': 'house', 'world-festivals': 'flag',
};

export function GameIcon({ gameId, size = 48 }) {
  const iconName = GAME_ICON_MAP[gameId] || 'star';
  return ico(iconName, size);
}

export function WorldIcon({ worldId, size = 32 }) {
  const iconName = WORLD_ICON_MAP[worldId] || 'star';
  return ico(iconName, size);
}

export function StarRating({ stars = 0 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3].map(i => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" 
          style={{ width: '16px', height: '16px' }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= stars ? '#FFD700' : '#E0E0E0'}
            stroke={i <= stars ? '#FFA000' : '#BDBDBD'}
            strokeWidth="1"
          />
        </svg>
      ))}
    </span>
  );
}

export function GameThumbnail({ gameId, size = 48 }) {
  const scene = GAME_SCENE_MAP[gameId];
  if (scene) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style={{ width: `${size}px`, height: `${size}px` }}>
        {scene}
      </svg>
    );
  }
  // Fallback to old icon system
  const iconName = GAME_ICON_MAP[gameId] || 'gamepad';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: `${size}px`, height: `${size}px`,
    }}>
      {ico(iconName, size * 0.7)}
    </span>
  );
}

// ═══ GAME SCENE THUMBNAILS — Rich mini-illustrations for each game ═══
const GAME_SCENE_MAP = {
  // ── GUA HURUF (ABC World) ──
  'letter-trail': <>
    <rect width="64" height="64" rx="12" fill="url(#lt-bg)"/>
    <defs><linearGradient id="lt-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#667EEA"/><stop offset="100%" stopColor="#764BA2"/></linearGradient></defs>
    <text x="14" y="28" fontSize="20" fontWeight="900" fill="#FFD54F" fontFamily="sans-serif">A</text>
    <text x="30" y="38" fontSize="16" fontWeight="800" fill="#81D4FA" fontFamily="sans-serif">B</text>
    <text x="42" y="26" fontSize="14" fontWeight="800" fill="#A5D6A7" fontFamily="sans-serif">C</text>
    <path d="M10 42 Q20 35 30 42 Q40 49 54 40" stroke="#FFD54F" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="4 3"/>
    <circle cx="10" cy="42" r="3" fill="#FF8A65"/>
    <circle cx="54" cy="40" r="3" fill="#A5D6A7"/>
    {[0,1,2,3].map(i=><circle key={i} cx={12+i*14} cy={52+Math.sin(i)*3} r="1.5" fill="rgba(255,255,255,0.5)"/>)}
  </>,

  'letter-tree': <>
    <rect width="64" height="64" rx="12" fill="url(#ltree-bg)"/>
    <defs><linearGradient id="ltree-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#81D4FA"/><stop offset="100%" stopColor="#E8F5E9"/></linearGradient></defs>
    <rect x="29" y="34" width="6" height="20" rx="2" fill="#8D6E63"/>
    <ellipse cx="32" cy="26" rx="18" ry="16" fill="#4CAF50"/>
    <ellipse cx="26" cy="22" rx="10" ry="10" fill="#66BB6A"/>
    <ellipse cx="38" cy="20" rx="10" ry="9" fill="#43A047"/>
    <circle cx="22" cy="26" r="5" fill="#FF5252"/><text x="19.5" y="29" fontSize="7" fill="#fff" fontWeight="900" fontFamily="sans-serif">A</text>
    <circle cx="32" cy="18" r="5" fill="#FFD54F"/><text x="29.5" y="21" fontSize="7" fill="#795548" fontWeight="900" fontFamily="sans-serif">B</text>
    <circle cx="42" cy="24" r="5" fill="#42A5F5"/><text x="39.5" y="27" fontSize="7" fill="#fff" fontWeight="900" fontFamily="sans-serif">C</text>
    <rect x="0" y="54" width="64" height="10" rx="0" fill="#A5D6A7"/>
  </>,

  'bee-flower': <>
    <rect width="64" height="64" rx="12" fill="url(#bf-bg)"/>
    <defs><linearGradient id="bf-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E1F5FE"/><stop offset="100%" stopColor="#C8E6C9"/></linearGradient></defs>
    <rect x="0" y="48" width="64" height="16" fill="#A5D6A7"/>
    <rect x="28" y="30" width="4" height="20" fill="#66BB6A"/>
    {[0,1,2,3,4].map(i=><ellipse key={i} cx="30" cy="28" rx="8" ry="8" fill={['#FF80AB','#F48FB1','#FF80AB','#F48FB1','#FF80AB'][i]} transform={`rotate(${i*72} 30 28)`}/>)}
    <circle cx="30" cy="28" r="5" fill="#FFD54F"/>
    <ellipse cx="48" cy="20" rx="7" ry="5" fill="#FFD54F"/>
    <ellipse cx="48" cy="20" rx="5" ry="3.5" fill="#FFC107"/>
    <rect x="45" y="17" width="2" height="6" fill="#212121" rx="1"/>
    <rect x="49" y="17" width="2" height="6" fill="#212121" rx="1"/>
    <ellipse cx="52" cy="16" rx="5" ry="3" fill="rgba(255,255,255,0.5)" transform="rotate(-20 52 16)"/>
    <ellipse cx="52" cy="14" rx="5" ry="3" fill="rgba(255,255,255,0.4)" transform="rotate(20 52 14)"/>
    <text x="44" y="23" fontSize="4" fill="#fff" fontWeight="900" fontFamily="sans-serif">Aa</text>
  </>,

  'syllable-factory': <>
    <rect width="64" height="64" rx="12" fill="url(#sf-bg)"/>
    <defs><linearGradient id="sf-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#90CAF9"/><stop offset="100%" stopColor="#CE93D8"/></linearGradient></defs>
    <rect x="10" y="28" width="44" height="26" rx="4" fill="#78909C"/>
    <rect x="10" y="28" width="44" height="6" fill="#546E7A"/>
    <rect x="22" y="16" width="6" height="14" fill="#607D8B"/>
    <rect x="36" y="12" width="6" height="18" fill="#607D8B"/>
    <circle cx="25" cy="12" r="4" fill="#E0E0E0"/><ellipse cx="25" cy="8" rx="6" ry="3" fill="#BDBDBD"/>
    <circle cx="39" cy="8" r="4" fill="#E0E0E0"/><ellipse cx="39" cy="4" rx="6" ry="3" fill="#BDBDBD"/>
    <rect x="16" y="38" width="12" height="10" rx="2" fill="#FF8A65"/><text x="18" y="46" fontSize="7" fill="#fff" fontWeight="900" fontFamily="sans-serif">BA</text>
    <rect x="34" y="38" width="12" height="10" rx="2" fill="#81C784"/><text x="36" y="46" fontSize="7" fill="#fff" fontWeight="900" fontFamily="sans-serif">TU</text>
    <circle cx="14" cy="52" r="2" fill="#FFD54F"/><circle cx="50" cy="52" r="2" fill="#FFD54F"/>
  </>,

  'letter-bubbles': <>
    <rect width="64" height="64" rx="12" fill="url(#lb-bg)"/>
    <defs><linearGradient id="lb-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E3F2FD"/><stop offset="100%" stopColor="#BBDEFB"/></linearGradient></defs>
    <circle cx="18" cy="20" r="10" fill="rgba(66,165,245,0.3)" stroke="#42A5F5" strokeWidth="1.5"/>
    <text x="14" y="24" fontSize="11" fill="#1565C0" fontWeight="900" fontFamily="sans-serif">A</text>
    <circle cx="42" cy="16" r="8" fill="rgba(239,83,80,0.25)" stroke="#EF5350" strokeWidth="1.5"/>
    <text x="39" y="20" fontSize="9" fill="#C62828" fontWeight="900" fontFamily="sans-serif">B</text>
    <circle cx="28" cy="38" r="12" fill="rgba(102,187,106,0.25)" stroke="#66BB6A" strokeWidth="1.5"/>
    <text x="23" y="43" fontSize="13" fill="#2E7D32" fontWeight="900" fontFamily="sans-serif">C</text>
    <circle cx="50" cy="36" r="7" fill="rgba(255,183,77,0.3)" stroke="#FFB74D" strokeWidth="1.5"/>
    <text x="47" y="40" fontSize="8" fill="#E65100" fontWeight="900" fontFamily="sans-serif">D</text>
    <circle cx="14" cy="50" r="6" fill="rgba(186,104,200,0.25)" stroke="#BA68C8" strokeWidth="1.5"/>
    <text x="11" y="54" fontSize="7" fill="#6A1B9A" fontWeight="900" fontFamily="sans-serif">E</text>
    {[0,1,2,3,4,5].map(i=><circle key={i} cx={8+i*10} cy={56+Math.sin(i*2)*2} r="1" fill="rgba(100,181,246,0.4)"/>)}
  </>,

  'letter-puzzle': <>
    <rect width="64" height="64" rx="12" fill="url(#lp-bg)"/>
    <defs><linearGradient id="lp-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF3E0"/><stop offset="100%" stopColor="#FFE0B2"/></linearGradient></defs>
    <rect x="8" y="8" width="22" height="22" rx="4" fill="#FF7043" stroke="#E64A19" strokeWidth="1"/>
    <text x="14" y="24" fontSize="14" fill="#fff" fontWeight="900" fontFamily="sans-serif">A</text>
    <rect x="34" y="8" width="22" height="22" rx="4" fill="#42A5F5" stroke="#1565C0" strokeWidth="1"/>
    <text x="40" y="24" fontSize="14" fill="#fff" fontWeight="900" fontFamily="sans-serif">B</text>
    <rect x="8" y="34" width="22" height="22" rx="4" fill="#66BB6A" stroke="#2E7D32" strokeWidth="1"/>
    <text x="14" y="50" fontSize="14" fill="#fff" fontWeight="900" fontFamily="sans-serif">C</text>
    <rect x="34" y="34" width="22" height="22" rx="4" fill="#FFD54F" stroke="#F9A825" strokeWidth="1" strokeDasharray="3 2"/>
    <text x="40" y="50" fontSize="14" fill="#F57F17" fontWeight="900" fontFamily="sans-serif">?</text>
  </>,

  'abc-song': <>
    <rect width="64" height="64" rx="12" fill="url(#as-bg)"/>
    <defs><linearGradient id="as-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#7E57C2"/><stop offset="100%" stopColor="#AB47BC"/></linearGradient></defs>
    <circle cx="32" cy="30" r="16" fill="#CE93D8"/>
    <rect x="28" y="30" width="8" height="18" rx="3" fill="#9C27B0"/>
    <circle cx="32" cy="48" r="6" fill="#9C27B0"/>
    <circle cx="32" cy="30" r="12" fill="#E1BEE7"/>
    <text x="18" y="28" fontSize="10" fill="#4A148C" fontWeight="900" fontFamily="sans-serif">♪A</text>
    <text x="32" y="22" fontSize="8" fill="#6A1B9A" fontWeight="800" fontFamily="sans-serif">B</text>
    <text x="38" y="34" fontSize="8" fill="#6A1B9A" fontWeight="800" fontFamily="sans-serif">C</text>
    {[0,1,2].map(i=><circle key={i} cx={14+i*8} cy={12-i*2} r="2.5" fill={['#FFD54F','#81D4FA','#A5D6A7'][i]}/>)}
    {[0,1].map(i=><path key={i} d={`M${48+i*6} ${14+i*4} q2 -4 4 0`} stroke={['#FFD54F','#FF80AB'][i]} strokeWidth="1.5" fill="none"/>)}
  </>,

  'letter-stories': <>
    <rect width="64" height="64" rx="12" fill="url(#ls-bg)"/>
    <defs><linearGradient id="ls-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#FFF8E1"/><stop offset="100%" stopColor="#FFECB3"/></linearGradient></defs>
    <rect x="12" y="10" width="40" height="44" rx="4" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1"/>
    <rect x="12" y="10" width="20" height="44" rx="4" fill="#42A5F5"/>
    <rect x="14" y="12" width="16" height="40" rx="3" fill="#1E88E5"/>
    <text x="16" y="36" fontSize="18" fill="#fff" fontWeight="900" fontFamily="sans-serif">A</text>
    <rect x="36" y="18" width="12" height="2" rx="1" fill="#BDBDBD"/>
    <rect x="36" y="24" width="10" height="2" rx="1" fill="#BDBDBD"/>
    <rect x="36" y="30" width="12" height="2" rx="1" fill="#BDBDBD"/>
    <rect x="36" y="36" width="8" height="2" rx="1" fill="#BDBDBD"/>
    {[0,1,2].map(i=><circle key={i} cx={46+i*4} cy={8} r="2" fill={['#FF8A65','#66BB6A','#FFD54F'][i]}/>)}
  </>,

  // ── ISTANA NOMBOR (Numbers World) ──
  'block-tower': <>
    <rect width="64" height="64" rx="12" fill="url(#bt-bg)"/>
    <defs><linearGradient id="bt-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E8EAF6"/><stop offset="100%" stopColor="#C5CAE9"/></linearGradient></defs>
    <rect x="18" y="42" width="28" height="12" rx="3" fill="#EF5350"/>
    <rect x="22" y="30" width="20" height="12" rx="3" fill="#42A5F5"/>
    <rect x="26" y="18" width="12" height="12" rx="3" fill="#66BB6A"/>
    <rect x="29" y="8" width="6" height="10" rx="2" fill="#FFD54F"/>
    <text x="28" y="51" fontSize="8" fill="#fff" fontWeight="900" fontFamily="sans-serif">3</text>
    <text x="29" y="39" fontSize="8" fill="#fff" fontWeight="900" fontFamily="sans-serif">2</text>
    <text x="30" y="27" fontSize="8" fill="#fff" fontWeight="900" fontFamily="sans-serif">1</text>
    <rect x="0" y="54" width="64" height="10" fill="#9FA8DA"/>
  </>,

  'count-objects': <>
    <rect width="64" height="64" rx="12" fill="url(#co-bg)"/>
    <defs><linearGradient id="co-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E8F5E9"/><stop offset="100%" stopColor="#C8E6C9"/></linearGradient></defs>
    <text x="20" y="26" fontSize="22" fontWeight="900" fill="#2E7D32" fontFamily="sans-serif">123</text>
    <circle cx="14" cy="42" r="6" fill="#EF5350"/>
    <circle cx="28" cy="42" r="6" fill="#42A5F5"/>
    <circle cx="42" cy="42" r="6" fill="#FFD54F"/>
    <circle cx="21" cy="52" r="6" fill="#66BB6A"/>
    <circle cx="35" cy="52" r="6" fill="#CE93D8"/>
    <text x="12" y="45" fontSize="7" fill="#fff" fontWeight="800" fontFamily="sans-serif">1</text>
    <text x="26" y="45" fontSize="7" fill="#fff" fontWeight="800" fontFamily="sans-serif">2</text>
    <text x="40" y="45" fontSize="7" fill="#fff" fontWeight="800" fontFamily="sans-serif">3</text>
    <text x="19" y="55" fontSize="7" fill="#fff" fontWeight="800" fontFamily="sans-serif">4</text>
    <text x="33" y="55" fontSize="7" fill="#fff" fontWeight="800" fontFamily="sans-serif">5</text>
  </>,

  'math-machine': <>
    <rect width="64" height="64" rx="12" fill="url(#mm-bg)"/>
    <defs><linearGradient id="mm-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E3F2FD"/><stop offset="100%" stopColor="#BBDEFB"/></linearGradient></defs>
    <rect x="10" y="10" width="44" height="44" rx="8" fill="#546E7A" stroke="#37474F" strokeWidth="1.5"/>
    <rect x="14" y="14" width="36" height="12" rx="3" fill="#B2DFDB"/>
    <text x="18" y="24" fontSize="10" fontWeight="800" fill="#00695C" fontFamily="sans-serif">2+3=5</text>
    {[0,1,2].map(r=>[0,1,2].map(c=><rect key={`${r}${c}`} x={16+c*12} y={30+r*8} width="10" height="6" rx="2" fill={['#EF5350','#42A5F5','#66BB6A','#FFD54F','#CE93D8','#FF8A65','#78909C','#26A69A','#EC407A'][r*3+c]}/>))}
  </>,

  'subtraction-shop': <>
    <rect width="64" height="64" rx="12" fill="url(#ss-bg)"/>
    <defs><linearGradient id="ss-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#FFF3E0"/><stop offset="100%" stopColor="#FFE0B2"/></linearGradient></defs>
    <rect x="10" y="22" width="44" height="32" rx="4" fill="#8D6E63"/>
    <rect x="10" y="22" width="44" height="8" rx="4" fill="#795548"/>
    <text x="18" y="28" fontSize="6" fontWeight="800" fill="#FFD54F" fontFamily="sans-serif">KEDAI</text>
    <circle cx="20" cy="40" r="5" fill="#EF5350"/><circle cx="32" cy="40" r="5" fill="#FFD54F"/><circle cx="44" cy="40" r="5" fill="#66BB6A"/>
    <text x="18" y="43" fontSize="5" fill="#fff" fontWeight="800" fontFamily="sans-serif">5</text>
    <text x="28" y="16" fontSize="14" fontWeight="900" fill="#E65100" fontFamily="sans-serif">5-2</text>
    <circle cx="22" cy="50" r="3" fill="#FFCC80"/><circle cx="32" cy="50" r="3" fill="#FFCC80"/><circle cx="42" cy="50" r="3" fill="#FFCC80"/>
  </>,

  'number-trace': <>
    <rect width="64" height="64" rx="12" fill="url(#nt-bg)"/>
    <defs><linearGradient id="nt-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FCE4EC"/><stop offset="100%" stopColor="#F8BBD0"/></linearGradient></defs>
    <text x="12" y="44" fontSize="36" fontWeight="900" fill="rgba(233,30,99,0.2)" fontFamily="sans-serif">5</text>
    <path d="M24 14 Q22 20 20 28 Q18 34 24 38 Q30 42 34 36 Q38 30 34 24" stroke="#E91E63" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="5 4"/>
    <circle cx="24" cy="14" r="3" fill="#EC407A"/>
    <path d="M50 44 l-4-6 l8 0 z" fill="#E91E63"/>
    <text x="44" y="54" fontSize="8" fill="#880E4F" fontWeight="700" fontFamily="sans-serif">lukis!</text>
  </>,

  'bigger-smaller': <>
    <rect width="64" height="64" rx="12" fill="url(#bs-bg)"/>
    <defs><linearGradient id="bs-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E0F7FA"/><stop offset="100%" stopColor="#B2EBF2"/></linearGradient></defs>
    <circle cx="18" cy="32" r="14" fill="#42A5F5"/>
    <text x="12" y="37" fontSize="16" fontWeight="900" fill="#fff" fontFamily="sans-serif">3</text>
    <circle cx="46" cy="32" r="10" fill="#EF5350"/>
    <text x="42" y="36" fontSize="12" fontWeight="900" fill="#fff" fontFamily="sans-serif">7</text>
    <text x="28" y="38" fontSize="16" fontWeight="900" fill="#FFD54F" fontFamily="sans-serif">&lt;</text>
  </>,

  'patterns': <>
    <rect width="64" height="64" rx="12" fill="url(#pt-bg)"/>
    <defs><linearGradient id="pt-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#F3E5F5"/><stop offset="100%" stopColor="#E1BEE7"/></linearGradient></defs>
    {[0,1,2,3,4].map(i=><circle key={i} cx={10+i*11} cy="22" r="5" fill={i%2===0?'#EF5350':'#42A5F5'}/>)}
    {[0,1,2,3,4].map(i=><rect key={i} x={6+i*11} y="34" width="8" height="8" rx="2" fill={i%2===0?'#66BB6A':'#FFD54F'}/>)}
    {[0,1,2,3].map(i=><path key={i} d={`M${10+i*14} 54 l5 -6 l5 6 z`} fill={i%2===0?'#CE93D8':'#FF8A65'}/>)}
    <rect x={50} y="50" width="8" height="8" rx="4" fill="rgba(0,0,0,0.1)" strokeDasharray="2 2" stroke="#666" strokeWidth="1"/>
    <text x="52" y="56" fontSize="7" fill="#666" fontFamily="sans-serif">?</text>
  </>,

  'magic-dice': <>
    <rect width="64" height="64" rx="12" fill="url(#md-bg)"/>
    <defs><linearGradient id="md-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF9C4"/><stop offset="100%" stopColor="#FFF176"/></linearGradient></defs>
    <rect x="8" y="14" width="28" height="28" rx="6" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1.5" transform="rotate(-8 22 28)"/>
    <circle cx="16" cy="22" r="3" fill="#E53935"/><circle cx="28" cy="22" r="3" fill="#E53935"/>
    <circle cx="22" cy="28" r="3" fill="#E53935"/>
    <circle cx="16" cy="34" r="3" fill="#E53935"/><circle cx="28" cy="34" r="3" fill="#E53935"/>
    <rect x="30" y="26" width="24" height="24" rx="5" fill="#42A5F5" stroke="#1565C0" strokeWidth="1.5" transform="rotate(5 42 38)"/>
    <circle cx="36" cy="34" r="2.5" fill="#fff"/><circle cx="48" cy="34" r="2.5" fill="#fff"/>
    <circle cx="36" cy="44" r="2.5" fill="#fff"/><circle cx="48" cy="44" r="2.5" fill="#fff"/>
    {[0,1,2].map(i=><circle key={i} cx={18+i*14} cy={56} r="2" fill={['#FFD54F','#EF5350','#42A5F5'][i]}/>)}
  </>,

  // ── HUTAN HAIWAN (Animals World) ──
  'animal-sounds': <>
    <rect width="64" height="64" rx="12" fill="url(#asnd-bg)"/>
    <defs><linearGradient id="asnd-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E8F5E9"/><stop offset="100%" stopColor="#C8E6C9"/></linearGradient></defs>
    <circle cx="28" cy="30" r="14" fill="#FFD54F"/>
    <circle cx="22" cy="22" r="5" fill="#FFD54F"/><circle cx="34" cy="22" r="5" fill="#FFD54F"/>
    <circle cx="24" cy="28" r="2" fill="#333"/><circle cx="32" cy="28" r="2" fill="#333"/>
    <ellipse cx="28" cy="34" rx="4" ry="2.5" fill="#FF8A65"/>
    <text x="42" y="20" fontSize="10" fontWeight="800" fill="#FF7043" fontFamily="sans-serif">♪</text>
    <text x="46" y="32" fontSize="8" fontWeight="700" fill="#66BB6A" fontFamily="sans-serif">♪</text>
    <rect x="0" y="50" width="64" height="14" fill="#A5D6A7"/>
    <rect x="6" y="42" width="4" height="14" fill="#8D6E63"/><ellipse cx="8" cy="40" rx="8" ry="6" fill="#66BB6A"/>
    <rect x="50" y="44" width="4" height="12" fill="#8D6E63"/><ellipse cx="52" cy="42" rx="7" ry="5" fill="#4CAF50"/>
  </>,

  'animal-homes': <>
    <rect width="64" height="64" rx="12" fill="url(#ah-bg)"/>
    <defs><linearGradient id="ah-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#FFECB3"/><stop offset="100%" stopColor="#FFE082"/></linearGradient></defs>
    <path d="M8 38 L22 22 L36 38 z" fill="#8D6E63"/><rect x="12" y="38" width="20" height="16" fill="#A1887F"/>
    <rect x="18" y="42" width="8" height="12" rx="4" fill="#5D4037"/>
    <circle cx="52" cy="24" r="10" fill="#66BB6A"/><circle cx="46" cy="20" r="8" fill="#4CAF50"/><rect x="49" y="24" width="4" height="16" fill="#8D6E63"/>
    <circle cx="52" cy="36" r="4" fill="#795548"/>
    <circle cx="50" cy="34" r="1.5" fill="#333"/><circle cx="54" cy="34" r="1.5" fill="#333"/>
    <rect x="0" y="54" width="64" height="10" fill="#A5D6A7"/>
    <circle cx="10" cy="14" r="6" fill="#FFD54F"/>
    <circle cx="8" cy="12" r="2" fill="#FFD54F"/>
  </>,

  'animal-puzzle': <>
    <rect width="64" height="64" rx="12" fill="url(#ap-bg)"/>
    <defs><linearGradient id="ap-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FCE4EC"/><stop offset="100%" stopColor="#F8BBD0"/></linearGradient></defs>
    <rect x="6" y="6" width="24" height="24" rx="4" fill="#FFF9C4"/>
    <circle cx="18" cy="14" r="5" fill="#FFD54F"/><circle cx="15" cy="11" r="2" fill="#FFD54F"/><circle cx="21" cy="11" r="2" fill="#FFD54F"/>
    <circle cx="16" cy="14" r="1" fill="#333"/><circle cx="20" cy="14" r="1" fill="#333"/>
    <rect x="34" y="6" width="24" height="24" rx="4" fill="#E3F2FD"/>
    <ellipse cx="46" cy="16" rx="8" ry="6" fill="#90CAF9"/><circle cx="43" cy="14" r="1.5" fill="#333"/><circle cx="49" cy="14" r="1.5" fill="#333"/>
    <rect x="6" y="34" width="24" height="24" rx="4" fill="#E8F5E9"/>
    <circle cx="18" cy="44" r="7" fill="#A5D6A7"/><circle cx="15" cy="42" r="1.5" fill="#333"/><circle cx="21" cy="42" r="1.5" fill="#333"/>
    <rect x="34" y="34" width="24" height="24" rx="4" fill="#F3E5F5" strokeDasharray="3 2" stroke="#CE93D8" strokeWidth="1"/>
    <text x="42" y="50" fontSize="14" fill="#CE93D8" fontWeight="900" fontFamily="sans-serif">?</text>
  </>,

  'animal-food': <>
    <rect width="64" height="64" rx="12" fill="url(#af-bg)"/>
    <defs><linearGradient id="af-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E0F2F1"/><stop offset="100%" stopColor="#B2DFDB"/></linearGradient></defs>
    <circle cx="22" cy="24" r="10" fill="#FFD54F"/>
    <circle cx="18" cy="18" r="4" fill="#FFD54F"/><circle cx="26" cy="18" r="4" fill="#FFD54F"/>
    <circle cx="19" cy="22" r="2" fill="#333"/><circle cx="25" cy="22" r="2" fill="#333"/>
    <path d="M20 28 Q22 31 24 28" stroke="#333" strokeWidth="1.5" fill="none"/>
    <path d="M32 24 L42 18" stroke="#BDBDBD" strokeWidth="1" strokeDasharray="2 2"/>
    <circle cx="46" cy="16" r="5" fill="#FF9800"/><path d="M46 11c1-3 3-3 4-1" stroke="#4CAF50" strokeWidth="1.5" fill="none"/>
    <path d="M32 30 L44 36" stroke="#BDBDBD" strokeWidth="1" strokeDasharray="2 2"/>
    <circle cx="48" cy="38" r="4" fill="#66BB6A"/>
    <path d="M32 20 L46 26" stroke="#BDBDBD" strokeWidth="1" strokeDasharray="2 2"/>
    <rect x="46" y="24" width="8" height="5" rx="2" fill="#8D6E63"/>
    <rect x="0" y="54" width="64" height="10" fill="#A5D6A7"/>
  </>,

  'animal-encyclopedia': <>
    <rect width="64" height="64" rx="12" fill="url(#ae-bg)"/>
    <defs><linearGradient id="ae-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E8EAF6"/><stop offset="100%" stopColor="#C5CAE9"/></linearGradient></defs>
    <rect x="10" y="8" width="44" height="48" rx="4" fill="#3F51B5"/>
    <rect x="12" y="10" width="40" height="44" rx="3" fill="#5C6BC0"/>
    <rect x="16" y="16" width="18" height="14" rx="2" fill="#E8F5E9"/>
    <circle cx="25" cy="22" r="4" fill="#FFD54F"/><circle cx="23" cy="20" r="1.5" fill="#333"/><circle cx="27" cy="20" r="1.5" fill="#333"/>
    <rect x="16" y="34" width="28" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
    <rect x="16" y="40" width="22" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
    <rect x="16" y="46" width="26" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
    <circle cx="46" cy="20" r="6" fill="#FF8A65"/><text x="43" y="23" fontSize="7" fill="#fff" fontWeight="900" fontFamily="sans-serif">🐾</text>
  </>,

  'mimic-animal': <>
    <rect width="64" height="64" rx="12" fill="url(#ma-bg)"/>
    <defs><linearGradient id="ma-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF8E1"/><stop offset="100%" stopColor="#FFECB3"/></linearGradient></defs>
    <circle cx="24" cy="28" r="12" fill="#A1887F"/>
    <circle cx="18" cy="20" r="5" fill="#A1887F"/><circle cx="30" cy="20" r="5" fill="#A1887F"/>
    <circle cx="20" cy="26" r="2.5" fill="#333"/><circle cx="28" cy="26" r="2.5" fill="#333"/>
    <ellipse cx="24" cy="32" rx="3" ry="2" fill="#795548"/>
    <circle cx="46" cy="26" r="8" fill="#FFB74D"/>
    <circle cx="43" cy="24" r="1.5" fill="#333"/><circle cx="49" cy="24" r="1.5" fill="#333"/>
    <ellipse cx="46" cy="29" rx="2" ry="1.5" fill="#FF8A65"/>
    <text x="36" y="46" fontSize="8" fontWeight="700" fill="#FF7043" fontFamily="sans-serif">Grr!</text>
    <text x="14" y="50" fontSize="8" fontWeight="700" fill="#8D6E63" fontFamily="sans-serif">Grr!</text>
    <rect x="0" y="54" width="64" height="10" fill="#C8E6C9"/>
  </>,

  // ── STUDIO WARNA (Colours World) ──
  'colour-mixing': <>
    <rect width="64" height="64" rx="12" fill="url(#cm-bg)"/>
    <defs><linearGradient id="cm-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FCE4EC"/><stop offset="100%" stopColor="#F3E5F5"/></linearGradient></defs>
    <circle cx="22" cy="24" r="12" fill="rgba(244,67,54,0.6)"/>
    <circle cx="38" cy="24" r="12" fill="rgba(33,150,243,0.6)"/>
    <circle cx="30" cy="36" r="12" fill="rgba(255,235,59,0.6)"/>
    <circle cx="30" cy="24" r="5" fill="rgba(156,39,176,0.7)"/>
    <circle cx="24" cy="32" r="4" fill="rgba(255,152,0,0.7)"/>
    <circle cx="36" cy="32" r="4" fill="rgba(76,175,80,0.7)"/>
    <text x="22" y="54" fontSize="8" fontWeight="700" fill="#7B1FA2" fontFamily="sans-serif">mix!</text>
  </>,

  'magic-colouring': <>
    <rect width="64" height="64" rx="12" fill="url(#mc-bg)"/>
    <defs><linearGradient id="mc-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E1F5FE"/><stop offset="100%" stopColor="#B3E5FC"/></linearGradient></defs>
    <rect x="8" y="8" width="40" height="48" rx="3" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1"/>
    <path d="M14 20 Q22 12 30 20 Q38 28 46 20" stroke="#E0E0E0" strokeWidth="1.5" fill="none"/>
    <circle cx="20" cy="36" r="8" fill="#E0E0E0"/>
    <circle cx="20" cy="36" r="6" fill="#42A5F5"/>
    <path d="M48 14 L56 54" stroke="#FF9800" strokeWidth="5" strokeLinecap="round"/>
    <path d="M46 10 L58 10 L56 54 L48 54 z" fill="#FFD54F"/>
    <path d="M56 54 L58 58 L46 58 L48 54 z" fill="#FF9800"/>
    <circle cx="52" cy="56" r="3" fill="#42A5F5" opacity="0.5"/>
  </>,

  'match-colour': <>
    <rect width="64" height="64" rx="12" fill="url(#mcl-bg)"/>
    <defs><linearGradient id="mcl-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E0F7FA"/><stop offset="100%" stopColor="#B2EBF2"/></linearGradient></defs>
    <path d="M8 10 Q18 6 28 10 Q38 14 48 10 Q56 6 60 10 L60 20 Q48 16 38 20 Q28 24 18 20 Q10 16 8 20 z" fill="#EF5350"/>
    <path d="M8 20 Q18 16 28 20 Q38 24 48 20 Q56 16 60 20 L60 30 Q48 26 38 30 Q28 34 18 30 Q10 26 8 30 z" fill="#FF9800"/>
    <path d="M8 30 Q18 26 28 30 Q38 34 48 30 Q56 26 60 30 L60 40 Q48 36 38 40 Q28 44 18 40 Q10 36 8 40 z" fill="#FFEB3B"/>
    <path d="M8 40 Q18 36 28 40 Q38 44 48 40 Q56 36 60 40 L60 50 Q48 46 38 50 Q28 54 18 50 Q10 46 8 50 z" fill="#4CAF50"/>
    <path d="M8 50 Q18 46 28 50 Q38 54 48 50 Q56 46 60 50 L60 58 Q48 54 38 58 Q28 60 18 58 Q10 56 8 58 z" fill="#2196F3"/>
    {[0,1,2].map(i=><circle key={i} cx={16+i*16} cy={58} r="2" fill="rgba(255,255,255,0.6)"/>)}
  </>,

  'sock-pairs': <>
    <rect width="64" height="64" rx="12" fill="url(#sp-bg)"/>
    <defs><linearGradient id="sp-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF3E0"/><stop offset="100%" stopColor="#FFE0B2"/></linearGradient></defs>
    <path d="M10 10 L10 36 Q10 46 18 46 L22 46 Q28 46 28 36 L28 10" fill="#EF5350"/>
    <rect x="10" y="10" width="18" height="8" fill="#C62828"/>
    <path d="M36 10 L36 36 Q36 46 44 46 L48 46 Q54 46 54 36 L54 10" fill="#EF5350"/>
    <rect x="36" y="10" width="18" height="8" fill="#C62828"/>
    <rect x="12" y="22" width="14" height="3" rx="1" fill="#FFCDD2"/>
    <rect x="12" y="28" width="14" height="3" rx="1" fill="#FFCDD2"/>
    <rect x="38" y="22" width="14" height="3" rx="1" fill="#FFCDD2"/>
    <rect x="38" y="28" width="14" height="3" rx="1" fill="#FFCDD2"/>
    <text x="14" y="56" fontSize="7" fontWeight="700" fill="#E65100" fontFamily="sans-serif">Padan!</text>
    <circle cx="54" cy="54" r="4" fill="#66BB6A"/><text x="51.5" y="57" fontSize="7" fill="#fff" fontWeight="900" fontFamily="sans-serif">✓</text>
  </>,

  'colour-hunter': <>
    <rect width="64" height="64" rx="12" fill="url(#ch-bg)"/>
    <defs><linearGradient id="ch-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E8EAF6"/><stop offset="100%" stopColor="#C5CAE9"/></linearGradient></defs>
    <circle cx="30" cy="30" r="16" fill="none" stroke="#5C6BC0" strokeWidth="4"/>
    <line x1="42" y1="42" x2="54" y2="54" stroke="#5C6BC0" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="20" cy="24" r="4" fill="#EF5350"/>
    <circle cx="32" cy="20" r="3" fill="#42A5F5"/>
    <circle cx="36" cy="34" r="5" fill="#FFD54F"/>
    <circle cx="24" cy="36" r="3" fill="#66BB6A"/>
    {[0,1,2].map(i=><circle key={i} cx={8+i*6} cy={54} r="2.5" fill={['#EF5350','#FFD54F','#42A5F5'][i]}/>)}
  </>,

  'free-draw': <>
    <rect width="64" height="64" rx="12" fill="url(#fd-bg)"/>
    <defs><linearGradient id="fd-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#F3E5F5"/><stop offset="100%" stopColor="#E1BEE7"/></linearGradient></defs>
    <rect x="6" y="6" width="44" height="52" rx="3" fill="#fff" stroke="#E0E0E0" strokeWidth="1"/>
    <path d="M14 30 Q20 18 28 26 Q36 34 42 22" stroke="#EF5350" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M12 40 Q22 36 32 42 Q42 48 48 40" stroke="#42A5F5" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="18" cy="18" r="4" fill="#FFD54F"/>
    <path d="M52 8 L56 52" stroke="#FF9800" strokeWidth="4" strokeLinecap="round"/>
    <path d="M50 6 L58 6 L56 52 L52 52 z" fill="#FFD54F"/>
    <circle cx="54" cy="54" r="3" fill="#EF5350" opacity="0.6"/>
  </>,

  // ── TRANSPORT ──
  'sort-transport': <>
    <rect width="64" height="64" rx="12" fill="url(#st-bg)"/>
    <defs><linearGradient id="st-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E3F2FD"/><stop offset="100%" stopColor="#BBDEFB"/></linearGradient></defs>
    <rect x="8" y="26" width="24" height="14" rx="4" fill="#EF5350"/>
    <rect x="8" y="22" width="14" height="8" rx="3" fill="#C62828"/>
    <rect x="18" y="24" width="6" height="4" rx="1" fill="#90CAF9"/>
    <circle cx="14" cy="42" r="4" fill="#333"/><circle cx="14" cy="42" r="2" fill="#666"/>
    <circle cx="28" cy="42" r="4" fill="#333"/><circle cx="28" cy="42" r="2" fill="#666"/>
    <path d="M40 10 L56 10 L56 22 L44 22 z" fill="#42A5F5"/>
    <path d="M44 22 L56 22 L58 16 L46 14 z" fill="#1E88E5"/>
    <path d="M38 16 L44 22 L40 22 z" fill="#64B5F6"/>
    <rect x="0" y="46" width="64" height="4" fill="#90A4AE"/>
    <rect x="0" y="50" width="64" height="14" fill="#A5D6A7"/>
  </>,

  'build-vehicle': <>
    <rect width="64" height="64" rx="12" fill="url(#bv-bg)"/>
    <defs><linearGradient id="bv-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF3E0"/><stop offset="100%" stopColor="#FFE0B2"/></linearGradient></defs>
    <rect x="14" y="28" width="36" height="16" rx="4" fill="#78909C" strokeDasharray="3 2" stroke="#546E7A" strokeWidth="1"/>
    <rect x="18" y="24" width="16" height="8" rx="3" fill="#90A4AE" strokeDasharray="3 2" stroke="#546E7A" strokeWidth="1"/>
    <circle cx="22" cy="46" r="5" fill="#333" strokeDasharray="3 2" stroke="#546E7A" strokeWidth="1"/>
    <circle cx="42" cy="46" r="5" fill="#333" strokeDasharray="3 2" stroke="#546E7A" strokeWidth="1"/>
    <path d="M48 12 L56 12 L52 20 z" fill="#FF9800"/>
    <rect x="48" y="14" width="8" height="3" rx="1" fill="#FFD54F"/>
    <text x="12" y="20" fontSize="7" fontWeight="700" fill="#E65100" fontFamily="sans-serif">Bina!</text>
    <rect x="0" y="52" width="64" height="12" fill="#A5D6A7"/>
  </>,

  'world-vehicles': <>
    <rect width="64" height="64" rx="12" fill="url(#wv-bg)"/>
    <defs><linearGradient id="wv-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E1F5FE"/><stop offset="100%" stopColor="#B3E5FC"/></linearGradient></defs>
    <path d="M18 16 L32 8 L46 16 L46 28 L18 28 z" fill="#FFD54F"/>
    <rect x="18" y="28" width="28" height="4" fill="#F9A825"/>
    <circle cx="10" cy="22" r="6" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1"/>
    <circle cx="54" cy="22" r="6" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1"/>
    <rect x="12" y="38" width="20" height="10" rx="3" fill="#EF5350"/>
    <circle cx="16" cy="50" r="3" fill="#333"/><circle cx="28" cy="50" r="3" fill="#333"/>
    <path d="M38 38 Q44 34 50 38 L52 48 L36 48 z" fill="#42A5F5"/>
    <circle cx="44" cy="50" r="3" fill="#333"/>
    <rect x="0" y="54" width="64" height="10" fill="#A5D6A7"/>
  </>,

  'road-safety': <>
    <rect width="64" height="64" rx="12" fill="url(#rs-bg)"/>
    <defs><linearGradient id="rs-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#ECEFF1"/><stop offset="100%" stopColor="#CFD8DC"/></linearGradient></defs>
    <rect x="28" y="6" width="8" height="42" rx="4" fill="#37474F"/>
    <circle cx="32" cy="14" r="5" fill="#EF5350"/>
    <circle cx="32" cy="26" r="5" fill="#FFD54F"/>
    <circle cx="32" cy="38" r="5" fill="#4CAF50"/>
    <circle cx="32" cy="14" r="3" fill="#FF8A80"/>
    <rect x="4" y="50" width="56" height="8" fill="#546E7A"/>
    <rect x="12" y="53" width="8" height="2" fill="#FFD54F"/>
    <rect x="28" y="53" width="8" height="2" fill="#FFD54F"/>
    <rect x="44" y="53" width="8" height="2" fill="#FFD54F"/>
  </>,

  // ── SHAPES ──
  'shape-hunt': <>
    <rect width="64" height="64" rx="12" fill="url(#sh-bg)"/>
    <defs><linearGradient id="sh-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E8F5E9"/><stop offset="100%" stopColor="#C8E6C9"/></linearGradient></defs>
    <circle cx="16" cy="20" r="8" fill="#EF5350"/>
    <rect x="32" y="12" width="16" height="16" rx="2" fill="#42A5F5"/>
    <path d="M16 36 L24 52 L8 52 z" fill="#FFD54F"/>
    <rect x="34" y="36" width="20" height="12" rx="6" fill="#66BB6A"/>
    <circle cx="50" cy="14" r="5" fill="none" stroke="#CE93D8" strokeWidth="2" strokeDasharray="2 2"/>
    <circle cx="50" cy="14" r="2" fill="#CE93D8"/>
  </>,

  'magic-tangram': <>
    <rect width="64" height="64" rx="12" fill="url(#mt-bg)"/>
    <defs><linearGradient id="mt-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF3E0"/><stop offset="100%" stopColor="#FFE0B2"/></linearGradient></defs>
    <path d="M8 8 L36 8 L8 36 z" fill="#EF5350"/>
    <path d="M36 8 L56 8 L56 28 z" fill="#42A5F5"/>
    <path d="M8 36 L22 36 L22 56 L8 56 z" fill="#FFD54F"/>
    <path d="M22 36 L36 36 L22 56 z" fill="#66BB6A"/>
    <path d="M36 28 L56 28 L56 48 z" fill="#CE93D8"/>
    <path d="M36 36 L56 48 L36 56 z" fill="#FF8A65"/>
    <path d="M22 56 L36 56 L56 56 L56 48 z" fill="#26A69A"/>
  </>,

  'draw-shapes': <>
    <rect width="64" height="64" rx="12" fill="url(#ds-bg)"/>
    <defs><linearGradient id="ds-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E8EAF6"/><stop offset="100%" stopColor="#C5CAE9"/></linearGradient></defs>
    <rect x="6" y="6" width="42" height="52" rx="3" fill="#fff"/>
    <circle cx="24" cy="28" r="10" fill="none" stroke="#42A5F5" strokeWidth="2" strokeDasharray="4 3"/>
    <circle cx="24" cy="28" r="4" fill="#42A5F5" opacity="0.3"/>
    <path d="M52 8 L56 52" stroke="#FF9800" strokeWidth="4" strokeLinecap="round"/>
    <path d="M50 6 L58 6 L56 52 L52 52 z" fill="#FFD54F"/>
    <circle cx="54" cy="54" r="3" fill="#42A5F5"/>
    <path d="M14 44 l8 0 l-4 -7 z" fill="none" stroke="#EF5350" strokeWidth="1.5" strokeDasharray="3 2"/>
  </>,

  'build-pictures': <>
    <rect width="64" height="64" rx="12" fill="url(#bp-bg)"/>
    <defs><linearGradient id="bp-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E0F2F1"/><stop offset="100%" stopColor="#B2DFDB"/></linearGradient></defs>
    <rect x="8" y="30" width="14" height="14" rx="2" fill="#EF5350"/>
    <rect x="24" y="30" width="14" height="14" rx="2" fill="#42A5F5"/>
    <path d="M8 24 L22 12 L36 24 z" fill="#FFD54F"/>
    <rect x="40" y="22" width="16" height="22" rx="2" fill="#66BB6A"/>
    <circle cx="48" cy="16" r="6" fill="#FFD54F"/>
    <rect x="8" y="46" width="48" height="4" fill="#A5D6A7"/>
    <text x="14" y="56" fontSize="6" fontWeight="700" fill="#00695C" fontFamily="sans-serif">Rumah!</text>
  </>,

  'three-d-shapes': <>
    <rect width="64" height="64" rx="12" fill="url(#tds-bg)"/>
    <defs><linearGradient id="tds-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#EDE7F6"/><stop offset="100%" stopColor="#D1C4E9"/></linearGradient></defs>
    <path d="M16 20 L30 12 L44 20 L44 36 L30 44 L16 36 z" fill="#7E57C2" opacity="0.8"/>
    <path d="M16 20 L30 28 L44 20" fill="#9575CD" opacity="0.6"/>
    <path d="M30 28 L30 44" stroke="#B39DDB" strokeWidth="1"/>
    <path d="M16 20 L30 28 L16 36" fill="#B39DDB" opacity="0.4"/>
    <circle cx="50" cy="44" r="8" fill="#EF5350" opacity="0.7"/>
    <ellipse cx="50" cy="44" rx="8" ry="3" fill="#C62828" opacity="0.3"/>
    <path d="M40 14 L48 8 L56 14 L48 20 z" fill="#FFD54F"/>
  </>,

  // ── FOOD ──
  'little-chef': <>
    <rect width="64" height="64" rx="12" fill="url(#lc-bg)"/>
    <defs><linearGradient id="lc-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#FFF8E1"/><stop offset="100%" stopColor="#FFECB3"/></linearGradient></defs>
    <circle cx="32" cy="28" r="12" fill="#FFD54F"/>
    <circle cx="28" cy="26" r="2" fill="#333"/><circle cx="36" cy="26" r="2" fill="#333"/>
    <path d="M29 32 Q32 35 35 32" stroke="#333" strokeWidth="1.5" fill="none"/>
    <ellipse cx="32" cy="16" rx="14" ry="4" fill="#FFFFFF"/>
    <rect x="18" y="14" width="28" height="4" fill="#FFFFFF"/>
    <ellipse cx="32" cy="14" rx="14" ry="4" fill="#F5F5F5"/>
    <rect x="22" y="44" width="20" height="10" rx="3" fill="#78909C"/>
    <rect x="24" y="46" width="16" height="2" fill="#FFD54F"/>
    <rect x="24" y="50" width="16" height="2" fill="#FF8A65"/>
    <path d="M18 44 L16 56 L48 56 L46 44" stroke="#546E7A" strokeWidth="1.5" fill="none"/>
  </>,

  'grocery-store': <>
    <rect width="64" height="64" rx="12" fill="url(#gs-bg)"/>
    <defs><linearGradient id="gs-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E8F5E9"/><stop offset="100%" stopColor="#C8E6C9"/></linearGradient></defs>
    <rect x="10" y="20" width="44" height="34" rx="4" fill="#8D6E63"/>
    <rect x="10" y="20" width="44" height="8" rx="4" fill="#6D4C41"/>
    <text x="16" y="26" fontSize="6" fontWeight="800" fill="#FFD54F" fontFamily="sans-serif">KEDAI</text>
    <circle cx="20" cy="38" r="5" fill="#EF5350"/>
    <circle cx="32" cy="38" r="5" fill="#FF9800"/>
    <circle cx="44" cy="38" r="5" fill="#66BB6A"/>
    <circle cx="20" cy="48" r="4" fill="#FFD54F"/>
    <circle cx="32" cy="48" r="4" fill="#42A5F5"/>
    <circle cx="44" cy="48" r="4" fill="#CE93D8"/>
    <rect x="20" y="6" width="24" height="14" rx="2" fill="#FFECB3" stroke="#FFD54F" strokeWidth="1"/>
    <text x="24" y="16" fontSize="8" fontWeight="700" fill="#F57F17" fontFamily="sans-serif">RM</text>
  </>,

  'healthy-or-not': <>
    <rect width="64" height="64" rx="12" fill="url(#hon-bg)"/>
    <defs><linearGradient id="hon-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E8F5E9"/><stop offset="100%" stopColor="#FFEBEE"/></linearGradient></defs>
    <circle cx="20" cy="24" r="10" fill="#66BB6A"/>
    <circle cx="20" cy="24" r="8" fill="#81C784"/>
    <text x="16" y="28" fontSize="10" fill="#fff" fontWeight="900" fontFamily="sans-serif">✓</text>
    <circle cx="44" cy="24" r="10" fill="#EF5350"/>
    <circle cx="44" cy="24" r="8" fill="#E57373"/>
    <text x="40" y="28" fontSize="10" fill="#fff" fontWeight="900" fontFamily="sans-serif">✗</text>
    <circle cx="20" cy="46" r="6" fill="#4CAF50"/><path d="M20 40c1-3 3-3 4-1" stroke="#2E7D32" strokeWidth="1.5" fill="none"/>
    <rect x="38" y="40" width="12" height="8" rx="2" fill="#FFD54F"/><rect x="40" y="44" width="8" height="2" fill="#FF9800"/>
    <text x="14" y="58" fontSize="6" fontWeight="700" fill="#2E7D32" fontFamily="sans-serif">Sihat</text>
    <text x="37" y="58" fontSize="6" fontWeight="700" fill="#C62828" fontFamily="sans-serif">Tidak</text>
  </>,

  'fruit-or-veg': <>
    <rect width="64" height="64" rx="12" fill="url(#fov-bg)"/>
    <defs><linearGradient id="fov-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF3E0"/><stop offset="100%" stopColor="#E8F5E9"/></linearGradient></defs>
    <circle cx="18" cy="22" r="9" fill="#EF5350"/><path d="M18 13c1-4 4-5 6-3" stroke="#4CAF50" strokeWidth="2" fill="none"/>
    <path d="M36 10 L36 40 C36 44 44 44 44 40 L44 10" fill="#FF9800"/>
    <path d="M34 8 c-3-5 -1-8 3-5 M46 8 c3-5 1-8 -3-5" stroke="#4CAF50" strokeWidth="2" fill="#66BB6A"/>
    <line x1="32" y1="34" x2="32" y2="50" stroke="#BDBDBD" strokeWidth="1" strokeDasharray="2 2"/>
    <rect x="6" y="44" width="24" height="14" rx="3" fill="#66BB6A"/><text x="8" y="54" fontSize="7" fontWeight="800" fill="#fff" fontFamily="sans-serif">Buah</text>
    <rect x="34" y="44" width="24" height="14" rx="3" fill="#FF9800"/><text x="36" y="54" fontSize="7" fontWeight="800" fill="#fff" fontFamily="sans-serif">Sayur</text>
  </>,

  'our-garden': <>
    <rect width="64" height="64" rx="12" fill="url(#og-bg)"/>
    <defs><linearGradient id="og-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E1F5FE"/><stop offset="100%" stopColor="#C8E6C9"/></linearGradient></defs>
    <rect x="0" y="44" width="64" height="20" fill="#8D6E63"/>
    <rect x="16" y="26" width="4" height="22" fill="#66BB6A"/>
    {[0,1,2,3,4].map(i=><ellipse key={i} cx="18" cy="22" rx="6" ry="6" fill={['#EF5350','#EC407A','#EF5350','#EC407A','#EF5350'][i]} transform={`rotate(${i*72} 18 22)`}/>)}
    <circle cx="18" cy="22" r="3" fill="#FFD54F"/>
    <rect x="40" y="30" width="4" height="18" fill="#66BB6A"/>
    <circle cx="42" cy="24" r="8" fill="#FFEB3B"/>
    <circle cx="42" cy="24" r="4" fill="#8D6E63"/>
    <circle cx="54" cy="10" r="6" fill="#FFD54F"/>
    <path d="M8 12 Q12 6 18 10" stroke="#90CAF9" strokeWidth="1.5" fill="none"/>
    <circle cx="8" cy="12" r="3" fill="#E1F5FE"/>
    <path d="M4 38 Q10 34 16 38 Q22 42 28 38" stroke="#66BB6A" strokeWidth="2" fill="#A5D6A7"/>
    <path d="M34 38 Q40 34 46 38 Q52 42 58 38" stroke="#66BB6A" strokeWidth="2" fill="#A5D6A7"/>
  </>,

  // ── BODY ──
  'label-body': <>
    <rect width="64" height="64" rx="12" fill="url(#lbb-bg)"/>
    <defs><linearGradient id="lbb-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#FCE4EC"/><stop offset="100%" stopColor="#F8BBD0"/></linearGradient></defs>
    <circle cx="32" cy="16" r="8" fill="#FFD54F"/>
    <circle cx="29" cy="14" r="1.5" fill="#333"/><circle cx="35" cy="14" r="1.5" fill="#333"/>
    <path d="M30 18 Q32 20 34 18" stroke="#333" strokeWidth="1" fill="none"/>
    <rect x="26" y="24" width="12" height="18" rx="4" fill="#42A5F5"/>
    <rect x="18" y="26" width="8" height="3" rx="1.5" fill="#42A5F5"/>
    <rect x="38" y="26" width="8" height="3" rx="1.5" fill="#42A5F5"/>
    <rect x="28" y="42" width="4" height="12" rx="2" fill="#42A5F5"/>
    <rect x="34" y="42" width="4" height="12" rx="2" fill="#42A5F5"/>
    <path d="M10 16 L18 14" stroke="#EF5350" strokeWidth="1" strokeDasharray="2 1"/>
    <text x="2" y="16" fontSize="5" fill="#EF5350" fontWeight="700" fontFamily="sans-serif">mata</text>
    <path d="M48 28 L54 28" stroke="#66BB6A" strokeWidth="1" strokeDasharray="2 1"/>
    <text x="54" y="30" fontSize="5" fill="#66BB6A" fontWeight="700" fontFamily="sans-serif">tangan</text>
  </>,

  'move-together': <>
    <rect width="64" height="64" rx="12" fill="url(#mvt-bg)"/>
    <defs><linearGradient id="mvt-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E1F5FE"/><stop offset="100%" stopColor="#B3E5FC"/></linearGradient></defs>
    <circle cx="20" cy="16" r="6" fill="#FFD54F"/>
    <rect x="16" y="22" width="8" height="12" rx="3" fill="#EF5350"/>
    <path d="M14 26 L8 20" stroke="#EF5350" strokeWidth="3" strokeLinecap="round"/>
    <path d="M26 26 L32 20" stroke="#EF5350" strokeWidth="3" strokeLinecap="round"/>
    <path d="M18 34 L14 46" stroke="#42A5F5" strokeWidth="3" strokeLinecap="round"/>
    <path d="M22 34 L26 46" stroke="#42A5F5" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="44" cy="18" r="6" fill="#FFD54F"/>
    <rect x="40" y="24" width="8" height="12" rx="3" fill="#66BB6A"/>
    <path d="M38 28 L34 34" stroke="#66BB6A" strokeWidth="3" strokeLinecap="round"/>
    <path d="M50 28 L56 22" stroke="#66BB6A" strokeWidth="3" strokeLinecap="round"/>
    <path d="M42 36 L38 48" stroke="#42A5F5" strokeWidth="3" strokeLinecap="round"/>
    <path d="M46 36 L50 48" stroke="#42A5F5" strokeWidth="3" strokeLinecap="round"/>
    <rect x="0" y="52" width="64" height="12" fill="#A5D6A7"/>
    {[0,1,2].map(i=><text key={i} x={10+i*18} y={58} fontSize="6" fill="#2E7D32" fontWeight="700" fontFamily="sans-serif">♪</text>)}
  </>,

  'healthy-habits': <>
    <rect width="64" height="64" rx="12" fill="url(#hh-bg)"/>
    <defs><linearGradient id="hh-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E0F7FA"/><stop offset="100%" stopColor="#B2EBF2"/></linearGradient></defs>
    <rect x="24" y="10" width="6" height="24" rx="3" fill="#E0E0E0"/>
    <rect x="22" y="8" width="10" height="6" rx="3" fill="#FFFFFF" stroke="#BDBDBD" strokeWidth="1"/>
    <rect x="24" y="34" width="6" height="8" rx="2" fill="#42A5F5"/>
    <ellipse cx="27" cy="42" rx="4" ry="2" fill="#B3E5FC"/>
    <circle cx="48" cy="18" r="10" fill="#81D4FA" stroke="#4FC3F7" strokeWidth="1.5"/>
    <path d="M44 22 Q48 14 52 22" stroke="#29B6F6" strokeWidth="2" fill="none"/>
    <circle cx="44" cy="16" r="1.5" fill="#0288D1"/><circle cx="52" cy="16" r="1.5" fill="#0288D1"/>
    <circle cx="14" cy="44" r="8" fill="#FFD54F"/>
    <circle cx="11" cy="42" r="1.5" fill="#333"/><circle cx="17" cy="42" r="1.5" fill="#333"/>
    <path d="M12 46 Q14 48 16 46" stroke="#333" strokeWidth="1" fill="none"/>
    <text x="14" y="58" fontSize="6" fontWeight="700" fill="#00695C" fontFamily="sans-serif">Sihat!</text>
  </>,

  'little-doctor': <>
    <rect width="64" height="64" rx="12" fill="url(#ld-bg)"/>
    <defs><linearGradient id="ld-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E8F5E9"/><stop offset="100%" stopColor="#C8E6C9"/></linearGradient></defs>
    <circle cx="32" cy="20" r="10" fill="#FFD54F"/>
    <circle cx="29" cy="18" r="2" fill="#333"/><circle cx="35" cy="18" r="2" fill="#333"/>
    <path d="M30 23 Q32 25 34 23" stroke="#333" strokeWidth="1" fill="none"/>
    <rect x="24" y="10" width="16" height="4" rx="2" fill="#FFFFFF"/>
    <rect x="30" y="8" width="4" height="4" fill="#EF5350"/>
    <rect x="24" y="30" width="16" height="20" rx="4" fill="#FFFFFF"/>
    <rect x="30" y="34" width="4" height="8" fill="#EF5350"/>
    <rect x="28" y="36" width="8" height="4" fill="#EF5350"/>
    <path d="M18 40 Q14 36 10 40" stroke="#546E7A" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="10" cy="42" r="4" fill="#78909C"/>
    <rect x="0" y="54" width="64" height="10" fill="#A5D6A7"/>
  </>,

  'body-song': <>
    <rect width="64" height="64" rx="12" fill="url(#bsng-bg)"/>
    <defs><linearGradient id="bsng-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#F3E5F5"/><stop offset="100%" stopColor="#E1BEE7"/></linearGradient></defs>
    <circle cx="24" cy="18" r="8" fill="#FFD54F"/>
    <circle cx="21" cy="16" r="1.5" fill="#333"/><circle cx="27" cy="16" r="1.5" fill="#333"/>
    <path d="M22 20 Q24 22 26 20" stroke="#333" strokeWidth="1" fill="none"/>
    <rect x="18" y="26" width="12" height="14" rx="4" fill="#CE93D8"/>
    <path d="M14 30 L8 24" stroke="#CE93D8" strokeWidth="3" strokeLinecap="round"/>
    <path d="M34 30 L40 24" stroke="#CE93D8" strokeWidth="3" strokeLinecap="round"/>
    <path d="M20 40 L16 52" stroke="#7E57C2" strokeWidth="3" strokeLinecap="round"/>
    <path d="M28 40 L32 52" stroke="#7E57C2" strokeWidth="3" strokeLinecap="round"/>
    {[0,1,2,3].map(i=><text key={i} x={40+i*5} y={14+i*8} fontSize="8" fill={['#EF5350','#42A5F5','#FFD54F','#66BB6A'][i]} fontWeight="800" fontFamily="sans-serif">♪</text>)}
    <text x="38" y="54" fontSize="7" fontWeight="700" fill="#4A148C" fontFamily="sans-serif">Nyanyi!</text>
  </>,

  // ── JOBS ──
  'role-play': <>
    <rect width="64" height="64" rx="12" fill="url(#rp-bg)"/>
    <defs><linearGradient id="rp-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF8E1"/><stop offset="100%" stopColor="#FFECB3"/></linearGradient></defs>
    <circle cx="20" cy="22" r="9" fill="#FFD54F"/>
    <rect x="12" y="12" width="16" height="4" rx="2" fill="#E53935"/>
    <circle cx="17" cy="20" r="2" fill="#333"/><circle cx="23" cy="20" r="2" fill="#333"/>
    <path d="M18 26 Q20 28 22 26" stroke="#333" strokeWidth="1" fill="none"/>
    <rect x="14" y="32" width="12" height="16" rx="3" fill="#42A5F5"/>
    <circle cx="44" cy="22" r="9" fill="#FFD54F"/>
    <ellipse cx="44" cy="14" rx="10" ry="4" fill="#FFFFFF"/>
    <rect x="34" y="14" width="20" height="2" fill="#FFFFFF"/>
    <circle cx="41" cy="20" r="2" fill="#333"/><circle cx="47" cy="20" r="2" fill="#333"/>
    <rect x="38" y="32" width="12" height="16" rx="3" fill="#FFFFFF"/>
    <rect x="42" y="36" width="4" height="6" fill="#EF5350"/>
    <rect x="40" y="38" width="8" height="2" fill="#EF5350"/>
  </>,

  'job-tools': <>
    <rect width="64" height="64" rx="12" fill="url(#jt-bg)"/>
    <defs><linearGradient id="jt-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#ECEFF1"/><stop offset="100%" stopColor="#CFD8DC"/></linearGradient></defs>
    <rect x="8" y="8" width="20" height="20" rx="4" fill="#FFE082"/>
    <path d="M14 14 L22 22 M22 14 L14 22" stroke="#F57F17" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="36" y="8" width="20" height="20" rx="4" fill="#EF9A9A"/>
    <rect x="42" y="12" width="8" height="12" rx="2" fill="#C62828"/>
    <rect x="40" y="10" width="12" height="4" rx="1" fill="#EF5350"/>
    <rect x="8" y="36" width="20" height="20" rx="4" fill="#A5D6A7"/>
    <circle cx="18" cy="46" r="6" fill="none" stroke="#2E7D32" strokeWidth="2.5"/>
    <line x1="22" y1="50" x2="26" y2="54" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="36" y="36" width="20" height="20" rx="4" fill="#B3E5FC"/>
    <rect x="42" y="40" width="2" height="14" rx="1" fill="#0288D1"/>
    <path d="M40 42 L46 42" stroke="#0288D1" strokeWidth="2.5"/>
    <circle cx="43" cy="40" r="2" fill="#0288D1"/>
  </>,

  'visit-workplace': <>
    <rect width="64" height="64" rx="12" fill="url(#vw-bg)"/>
    <defs><linearGradient id="vw-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E3F2FD"/><stop offset="100%" stopColor="#BBDEFB"/></linearGradient></defs>
    <rect x="14" y="20" width="36" height="30" rx="2" fill="#78909C"/>
    <rect x="14" y="20" width="36" height="6" fill="#546E7A"/>
    <rect x="18" y="30" width="8" height="6" rx="1" fill="#90CAF9"/>
    <rect x="28" y="30" width="8" height="6" rx="1" fill="#90CAF9"/>
    <rect x="38" y="30" width="8" height="6" rx="1" fill="#90CAF9"/>
    <rect x="18" y="40" width="8" height="6" rx="1" fill="#FFECB3"/>
    <rect x="28" y="40" width="8" height="10" rx="1" fill="#8D6E63"/>
    <rect x="38" y="40" width="8" height="6" rx="1" fill="#FFECB3"/>
    <path d="M14 20 L32 8 L50 20" fill="#455A64"/>
    <rect x="0" y="50" width="64" height="14" fill="#A5D6A7"/>
  </>,

  'who-am-i': <>
    <rect width="64" height="64" rx="12" fill="url(#wai-bg)"/>
    <defs><linearGradient id="wai-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF3E0"/><stop offset="100%" stopColor="#FFE0B2"/></linearGradient></defs>
    <circle cx="32" cy="28" r="14" fill="#FFD54F"/>
    <circle cx="28" cy="26" r="2.5" fill="#333"/><circle cx="36" cy="26" r="2.5" fill="#333"/>
    <path d="M29 32 Q32 35 35 32" stroke="#333" strokeWidth="1.5" fill="none"/>
    <rect x="18" y="14" width="28" height="4" rx="2" fill="#E53935"/>
    <text x="16" y="52" fontSize="9" fontWeight="900" fill="#E65100" fontFamily="sans-serif">Siapa?</text>
    <circle cx="10" cy="14" r="3" fill="#42A5F5"/><circle cx="54" cy="14" r="3" fill="#66BB6A"/>
    <text x="8" y="16" fontSize="4" fill="#fff" fontWeight="900" fontFamily="sans-serif">?</text>
    <text x="52" y="16" fontSize="4" fill="#fff" fontWeight="900" fontFamily="sans-serif">?</text>
  </>,

  // ── MUSIC ──
  'instruments': <>
    <rect width="64" height="64" rx="12" fill="url(#ins-bg)"/>
    <defs><linearGradient id="ins-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FFF8E1"/><stop offset="100%" stopColor="#FFE082"/></linearGradient></defs>
    <ellipse cx="18" cy="44" rx="10" ry="8" fill="#8D6E63"/>
    <ellipse cx="18" cy="44" rx="8" ry="6" fill="#A1887F"/>
    <circle cx="18" cy="44" r="2" fill="#5D4037"/>
    <rect x="26" y="12" width="3" height="34" fill="#8D6E63"/>
    <rect x="24" y="10" width="7" height="4" rx="1" fill="#5D4037"/>
    {[0,1,2,3].map(i=><circle key={i} cx="25" cy={16+i*6} r="1.5" fill="#FFD54F"/>)}
    <path d="M38 18 C42 14 50 14 54 18 L54 44 C50 48 42 48 38 44 z" fill="#FFD54F"/>
    <path d="M38 18 C42 22 50 22 54 18" fill="#F9A825"/>
    <path d="M38 30 C42 34 50 34 54 30" stroke="#F9A825" strokeWidth="1" fill="none"/>
  </>,

  'follow-beat': <>
    <rect width="64" height="64" rx="12" fill="url(#fb-bg)"/>
    <defs><linearGradient id="fb-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FCE4EC"/><stop offset="100%" stopColor="#F8BBD0"/></linearGradient></defs>
    <ellipse cx="22" cy="38" rx="12" ry="10" fill="#EF5350"/>
    <ellipse cx="22" cy="38" rx="10" ry="8" fill="#E53935"/>
    <circle cx="22" cy="38" r="3" fill="#C62828"/>
    <rect x="32" y="14" width="3" height="26" fill="#8D6E63" transform="rotate(-5 33 27)"/>
    <rect x="32" y="14" width="3" height="26" fill="#8D6E63" transform="rotate(5 33 27)"/>
    <circle cx="44" cy="14" r="4" fill="#FFD54F"/>
    <circle cx="50" cy="18" r="4" fill="#FFD54F"/>
    <path d="M44 14 L44 10" stroke="#8D6E63" strokeWidth="2"/><circle cx="44" cy="8" r="3" fill="#FFD54F"/>
    <path d="M50 18 L50 14" stroke="#8D6E63" strokeWidth="2"/><circle cx="50" cy="12" r="3" fill="#FFD54F"/>
    <text x="8" y="56" fontSize="8" fontWeight="700" fill="#880E4F" fontFamily="sans-serif">DUM!</text>
    <text x="38" y="56" fontSize="8" fontWeight="700" fill="#880E4F" fontFamily="sans-serif">TAK!</text>
  </>,

  'childrens-songs': <>
    <rect width="64" height="64" rx="12" fill="url(#cs-bg)"/>
    <defs><linearGradient id="cs-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E8EAF6"/><stop offset="100%" stopColor="#C5CAE9"/></linearGradient></defs>
    <circle cx="32" cy="26" r="14" fill="#7E57C2"/>
    <circle cx="32" cy="26" r="12" fill="#9575CD"/>
    <rect x="28" y="26" width="8" height="18" rx="3" fill="#5E35B1"/>
    <circle cx="32" cy="44" r="6" fill="#5E35B1"/>
    <circle cx="32" cy="26" r="8" fill="#B39DDB"/>
    {[0,1,2,3,4].map(i=><text key={i} x={6+i*12} y={14+Math.sin(i*1.5)*6} fontSize="10" fill={['#FFD54F','#FF8A65','#81D4FA','#A5D6A7','#CE93D8'][i]} fontWeight="800" fontFamily="sans-serif">♪</text>)}
    <text x="14" y="58" fontSize="7" fontWeight="700" fill="#311B92" fontFamily="sans-serif">Nyanyi!</text>
  </>,

  'learn-notes': <>
    <rect width="64" height="64" rx="12" fill="url(#ln-bg)"/>
    <defs><linearGradient id="ln-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#FFFDE7"/><stop offset="100%" stopColor="#FFF9C4"/></linearGradient></defs>
    <rect x="8" y="16" width="48" height="32" rx="4" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1"/>
    {[0,1,2,3,4].map(i=><line key={i} x1="12" y1={22+i*5} x2="52" y2={22+i*5} stroke="#E0E0E0" strokeWidth="1"/>)}
    <circle cx="18" cy="27" r="4" fill="#EF5350"/>
    <line x1="22" y1="27" x2="22" y2="18" stroke="#EF5350" strokeWidth="2"/>
    <circle cx="30" cy="32" r="4" fill="#42A5F5"/>
    <line x1="34" y1="32" x2="34" y2="22" stroke="#42A5F5" strokeWidth="2"/>
    <circle cx="42" cy="22" r="4" fill="#66BB6A"/>
    <line x1="46" y1="22" x2="46" y2="14" stroke="#66BB6A" strokeWidth="2"/>
    <text x="10" y="58" fontSize="7" fontWeight="700" fill="#F57F17" fontFamily="sans-serif">Do Re Mi</text>
  </>,

  // ── SCIENCE/NATURE ──
  'weather': <>
    <rect width="64" height="64" rx="12" fill="url(#wt-bg)"/>
    <defs><linearGradient id="wt-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E3F2FD"/><stop offset="100%" stopColor="#90CAF9"/></linearGradient></defs>
    <circle cx="22" cy="20" r="10" fill="#FFD54F"/>
    {[0,1,2,3,4,5].map(i=><line key={i} x1={22+Math.cos(i*1.05)*14} y1={20+Math.sin(i*1.05)*14} x2={22+Math.cos(i*1.05)*18} y2={20+Math.sin(i*1.05)*18} stroke="#FFD54F" strokeWidth="2.5" strokeLinecap="round"/>)}
    <ellipse cx="42" cy="32" rx="12" ry="8" fill="#E0E0E0"/>
    <ellipse cx="36" cy="28" rx="8" ry="6" fill="#EEEEEE"/>
    <ellipse cx="48" cy="28" rx="8" ry="6" fill="#F5F5F5"/>
    <path d="M36 40 L34 50" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round"/>
    <path d="M42 40 L40 50" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round"/>
    <path d="M48 40 L46 50" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round"/>
  </>,

  'plants': <>
    <rect width="64" height="64" rx="12" fill="url(#pl-bg)"/>
    <defs><linearGradient id="pl-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E8F5E9"/><stop offset="100%" stopColor="#A5D6A7"/></linearGradient></defs>
    <rect x="28" y="20" width="4" height="28" fill="#4CAF50"/>
    <ellipse cx="22" cy="28" rx="10" ry="6" fill="#66BB6A" transform="rotate(-30 22 28)"/>
    <ellipse cx="38" cy="22" rx="10" ry="6" fill="#43A047" transform="rotate(30 38 22)"/>
    <ellipse cx="24" cy="16" rx="8" ry="5" fill="#81C784" transform="rotate(-15 24 16)"/>
    <rect x="20" y="48" width="20" height="12" rx="3" fill="#8D6E63"/>
    <rect x="22" y="46" width="16" height="4" rx="2" fill="#A1887F"/>
  </>,

  'experiments': <>
    <rect width="64" height="64" rx="12" fill="url(#exp-bg)"/>
    <defs><linearGradient id="exp-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#EDE7F6"/><stop offset="100%" stopColor="#D1C4E9"/></linearGradient></defs>
    <path d="M24 10 L24 28 L12 50 L52 50 L40 28 L40 10" fill="none" stroke="#7E57C2" strokeWidth="2.5"/>
    <rect x="22" y="8" width="20" height="4" rx="2" fill="#9575CD"/>
    <path d="M24 28 L12 50 L52 50 L40 28" fill="#CE93D8" opacity="0.4"/>
    <circle cx="22" cy="40" r="4" fill="#EF5350" opacity="0.7"/>
    <circle cx="32" cy="44" r="3" fill="#42A5F5" opacity="0.7"/>
    <circle cx="40" cy="40" r="3.5" fill="#66BB6A" opacity="0.7"/>
    <circle cx="18" cy="18" r="3" fill="#FFD54F"/><circle cx="20" cy="14" r="2" fill="#FFD54F"/>
    <circle cx="46" cy="18" r="3" fill="#81D4FA"/><circle cx="44" cy="14" r="2" fill="#81D4FA"/>
  </>,

  'day-night': <>
    <rect width="64" height="64" rx="12" fill="url(#dn-bg)"/>
    <defs><linearGradient id="dn-bg" x1="0" y1="0" x2="64" y2="0"><stop offset="0%" stopColor="#FFF9C4"/><stop offset="50%" stopColor="#FFE082"/><stop offset="50%" stopColor="#1A237E"/><stop offset="100%" stopColor="#283593"/></linearGradient></defs>
    <circle cx="18" cy="20" r="10" fill="#FFD54F"/>
    {[0,1,2,3].map(i=><line key={i} x1={18+Math.cos(i*1.57)*14} y1={20+Math.sin(i*1.57)*14} x2={18+Math.cos(i*1.57)*17} y2={20+Math.sin(i*1.57)*17} stroke="#FFD54F" strokeWidth="2" strokeLinecap="round"/>)}
    <path d="M42 14 Q52 14 52 24 Q48 20 42 24 Q38 28 42 32 Q36 28 40 20 Q42 14 42 14" fill="#FFF9C4"/>
    {[0,1,2,3].map(i=><circle key={i} cx={36+i*7} cy={38+Math.sin(i*2)*4} r="1.5" fill="#FFF9C4"/>)}
    <rect x="4" y="44" width="28" height="20" fill="#A5D6A7"/>
    <rect x="32" y="44" width="28" height="20" fill="#1B5E20"/>
  </>,

  // ── WORLD/CULTURE ──
  'world-map': <>
    <rect width="64" height="64" rx="12" fill="url(#wm-bg)"/>
    <defs><linearGradient id="wm-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E3F2FD"/><stop offset="100%" stopColor="#BBDEFB"/></linearGradient></defs>
    <circle cx="32" cy="32" r="22" fill="#42A5F5"/>
    <circle cx="32" cy="32" r="20" fill="#64B5F6"/>
    <ellipse cx="24" cy="24" rx="10" ry="8" fill="#66BB6A" transform="rotate(-10 24 24)"/>
    <ellipse cx="40" cy="36" rx="8" ry="12" fill="#81C784" transform="rotate(15 40 36)"/>
    <ellipse cx="20" cy="40" rx="6" ry="4" fill="#4CAF50"/>
    <circle cx="14" cy="14" r="3" fill="#FFD54F"/><circle cx="50" cy="14" r="3" fill="#EF5350"/>
    <circle cx="50" cy="50" r="3" fill="#CE93D8"/><circle cx="14" cy="50" r="3" fill="#FF8A65"/>
  </>,

  'world-houses': <>
    <rect width="64" height="64" rx="12" fill="url(#wh-bg)"/>
    <defs><linearGradient id="wh-bg" x1="0" y1="0" x2="0" y2="64"><stop offset="0%" stopColor="#E0F7FA"/><stop offset="100%" stopColor="#B2DFDB"/></linearGradient></defs>
    <path d="M6 34 L16 22 L26 34 z" fill="#EF5350"/>
    <rect x="8" y="34" width="16" height="14" fill="#FFCDD2"/>
    <rect x="12" y="38" width="6" height="10" rx="3" fill="#8D6E63"/>
    <path d="M30 30 L40 18 L50 30 z" fill="#FFD54F"/>
    <rect x="32" y="30" width="16" height="18" fill="#FFF9C4"/>
    <rect x="36" y="34" width="4" height="4" fill="#90CAF9"/>
    <rect x="42" y="34" width="4" height="4" fill="#90CAF9"/>
    <rect x="0" y="48" width="64" height="16" fill="#A5D6A7"/>
    <circle cx="54" cy="12" r="6" fill="#FFD54F"/>
  </>,

  'world-festivals': <>
    <rect width="64" height="64" rx="12" fill="url(#wf-bg)"/>
    <defs><linearGradient id="wf-bg" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#FCE4EC"/><stop offset="100%" stopColor="#F3E5F5"/></linearGradient></defs>
    <rect x="28" y="24" width="4" height="32" fill="#8D6E63"/>
    <path d="M32 24 L52 14 L52 30 L32 40 z" fill="#EF5350"/>
    <path d="M32 24 L52 14 L52 22 L32 32 z" fill="#C62828"/>
    {[0,1,2,3,4,5].map(i=><circle key={i} cx={10+i*9} cy={8+Math.sin(i*1.2)*4} r="3" fill={['#EF5350','#FFD54F','#42A5F5','#66BB6A','#CE93D8','#FF8A65'][i]}/>)}
    <path d="M4 6 Q10 14 16 6 Q22 14 28 6 Q34 14 40 6 Q46 14 52 6 Q58 14 60 6" stroke="#FFD54F" strokeWidth="1.5" fill="none"/>
    <circle cx="14" cy="44" r="4" fill="#FFD54F"/><circle cx="14" cy="44" r="2" fill="#FF9800"/>
    <circle cx="48" cy="48" r="4" fill="#CE93D8"/><circle cx="48" cy="48" r="2" fill="#9C27B0"/>
  </>,
};

export function AchievementBadge({ type = 'bronze', size = 48 }) {
  const colors = {
    bronze: { bg: '#CD7F32', ring: '#A0522D' },
    silver: { bg: '#C0C0C0', ring: '#808080' },
    gold: { bg: '#FFD700', ring: '#FFA000' },
    diamond: { bg: '#B9F2FF', ring: '#00BCD4' },
  };
  const c = colors[type] || colors.bronze;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" 
      style={{ width: `${size}px`, height: `${size}px` }}>
      <circle cx="32" cy="32" r="28" fill={c.bg} stroke={c.ring} strokeWidth="3"/>
      <path d="M32 14l5.5 11.2 12.3 1.8-8.9 8.7 2.1 12.3L32 42.5l-11 5.5 2.1-12.3-8.9-8.7 12.3-1.8z"
        fill="#fff" opacity="0.9"/>
    </svg>
  );
}

export default ico;
