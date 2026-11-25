export function urnArt(id = 'urn', small = false) {
  return `<svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ${small ? 'class="ground-urn-art"' : ''}>
    <defs><linearGradient id="${id}" x1="0" x2="1"><stop stop-color="#d79542"/><stop offset=".45" stop-color="#ffdc8b"/><stop offset="1" stop-color="#e8ad53"/></linearGradient></defs>
    <ellipse cx="50" cy="101" rx="31" ry="5" fill="#3d5232" opacity=".12"/>
    <path d="M27 33C2 25 6 66 27 65M73 33c25-8 21 33 0 32" fill="none" stroke="#b77b3e" stroke-width="8"/>
    <path d="M28 25q6 14-3 29C9 80 25 99 50 99s41-19 25-45q-9-15-3-29" fill="url(#${id})" stroke="#9e6636" stroke-width="3"/>
    <path d="M22 67q28 12 56 0v12q-28 12-56 0Z" fill="#5e9a9d"/>
    <path d="M31 72l5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5" fill="none" stroke="#c6e7dc" stroke-width="2.5"/>
    <ellipse cx="50" cy="25" rx="25" ry="9" fill="#dda955" stroke="#9e6636" stroke-width="3"/><ellipse cx="50" cy="25" rx="17" ry="5" fill="#805238"/>
    <path d="M31 47q-9 14-5 20" fill="none" stroke="#ffe7ac" stroke-width="5" stroke-linecap="round" opacity=".7"/>
  </svg>`;
}

export function bearArt(id) {
  // Cycle the palette, but keep each bear's SVG gradient ID unique.
  const coat = ['#ae7046', '#cb915b', '#88583d'][id % 3];
  const highlight = ['#d99f68', '#e8b77f', '#b88659'][id % 3];
  return `<svg class="bear-art" viewBox="0 0 180 166" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="coat-${id}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${highlight}"/><stop offset="1" stop-color="${coat}"/></linearGradient></defs>
    <ellipse class="bear-shadow" cx="92" cy="140" rx="63" ry="8" fill="#365237" opacity=".15"/>
    <g class="pee-art"><path d="M65 109Q26 79 9 129" fill="none" stroke="#efc748" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 6"/><ellipse cx="11" cy="134" rx="10" ry="3" fill="#f3d75a" opacity=".65"/><path d="M4 132q-7-12 3-17q10-8 18 6l-1 11Z" fill="#9ba697"/><path d="M7 119l8-1" stroke="#c7d0bf" stroke-width="3" stroke-linecap="round"/></g>
    <g class="fart-art" fill="#b7d880" opacity=".8"><circle cx="147" cy="100" r="10"/><circle cx="159" cy="93" r="13"/><circle cx="169" cy="108" r="8"/><path d="M152 81q-5-7 2-12m11 11q9-7 3-13" fill="none" stroke="#87ad58" stroke-width="3" stroke-linecap="round"/></g>
    <g class="bear-body">
      <g class="back-leg"><path d="M112 104l-1 29q2 10 17 5q6-2 4-9l-1-27" fill="${coat}" stroke="#70482f" stroke-width="2.5"/><path d="M115 134h12" stroke="#e1b584" stroke-width="3" stroke-linecap="round"/></g>
      <ellipse cx="94" cy="94" rx="43" ry="35" fill="url(#coat-${id})" stroke="#70482f" stroke-width="2.5"/>
      <ellipse cx="126" cy="94" rx="12" ry="18" fill="${highlight}"/><path d="M129 88q-6 6-1 14" fill="none" stroke="#8e583a" stroke-width="2" stroke-linecap="round"/>
      <g class="front-leg"><path d="M57 103l-5 28q-1 11 15 9q9-1 8-8l3-25" fill="url(#coat-${id})" stroke="#70482f" stroke-width="2.5"/><path d="M56 134h13" stroke="#e1b584" stroke-width="3" stroke-linecap="round"/></g>
      <circle cx="38" cy="49" r="13" fill="${coat}" stroke="#70482f" stroke-width="2.5"/><circle cx="38" cy="49" r="7" fill="#e0ac81"/>
      <circle cx="67" cy="48" r="12" fill="${coat}" stroke="#70482f" stroke-width="2.5"/><circle cx="67" cy="48" r="6" fill="#e0ac81"/>
      <path d="M26 61q2-19 27-19q27 1 28 25l-1 22q-4 20-30 13q-24-4-26-20Z" fill="url(#coat-${id})" stroke="#70482f" stroke-width="2.5"/>
      <ellipse cx="31" cy="80" rx="18" ry="13" fill="#efd0a0"/><ellipse cx="19" cy="76" rx="7" ry="5" fill="#4e362b"/>
      <path class="bear-smile" d="M27 87q8 7 16 0" fill="none" stroke="#694433" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="43" cy="65" r="3.5" fill="#382a25"/><circle cx="44" cy="64" r="1" fill="#fff"/>
      <path class="worried-brow" d="M38 57l9-2" stroke="#70482f" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="53" cy="83" rx="7" ry="4" fill="#e89677" opacity=".65"/>
      <path d="M80 83q-5 11 0 20" fill="none" stroke="${highlight}" stroke-width="5" stroke-linecap="round"/>
    </g>
    <g class="urn-piece">
      <path d="M137 74q22-15 29 2q4 13-13 20" fill="none" stroke="#a86f39" stroke-width="6"/>
      <path d="M125 73q7-5 19 1l13 18q18 25-4 37q-20 10-36-9l-4-16Z" fill="#f2c16d" stroke="#9e6636" stroke-width="2.5"/>
      <path d="M117 103q19 4 42-10l5 11q-24 17-42 9Z" fill="#5e9a9d"/>
      <path d="M124 107l6 2 3-6 7 2 2-6 7 2 3-6" fill="none" stroke="#d0ede1" stroke-width="2"/>
      <ellipse cx="122" cy="87" rx="8" ry="19" transform="rotate(19 122 87)" fill="#d99a47" stroke="#9e6636" stroke-width="2.5"/><path d="M120 75q-6 13-2 22" fill="none" stroke="#825237" stroke-width="5" stroke-linecap="round"/>
      <path d="M146 80l6 9" stroke="#ffe7ab" stroke-width="4" stroke-linecap="round"/>
    </g>
    <g class="stuck-lines" stroke="#bf7241" stroke-width="3" stroke-linecap="round"><path d="M155 58l5-7m6 16l9-3m-24 73l4 7"/></g>
  </svg>`;
}

const tree = (x, y, scale, color, fruit = false) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-9 20l-5 91h28L8 20" fill="#957752"/><path d="M0 65l-23-22m23 9l25-21" fill="none" stroke="#957752" stroke-width="9" stroke-linecap="round"/><path d="M-45 8c-35-43 7-84 41-68c37-29 75 9 53 36c36 27 0 64-32 55c-28 21-66 5-62-23Z" fill="${color}"/><path d="M-28-32q13-19 36-14" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="13" stroke-linecap="round"/>${fruit ? '<g fill="#f5a373"><circle cx="-28" cy="4" r="8"/><circle cx="28" cy="-15" r="8"/><circle cx="2" cy="17" r="8"/></g>' : ''}</g>`;
const flower = (x, y, color = '#fff5ce', s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0v16m0-4q-9-7-10-2" stroke="#6c9560" stroke-width="3" fill="none"/><g fill="${color}"><ellipse cy="-5" rx="4" ry="6"/><ellipse cy="5" rx="4" ry="6"/><ellipse cx="-5" rx="6" ry="4"/><ellipse cx="5" rx="6" ry="4"/></g><circle r="3.5" fill="#e5af4b"/></g>`;

export function sceneryArt(theme) {
  const palettes = {
    meadow: { sky: '#dfefdc', hill: '#bbd8a6', ground: '#cde3b5', tree: '#75a678', accent: '#e6efca' },
    pond: { sky: '#d6edf0', hill: '#9fcbb9', ground: '#bce0ca', tree: '#629e8c', accent: '#def0d1' },
    orchard: { sky: '#fae3cb', hill: '#d3d69d', ground: '#e4e5b7', tree: '#8da576', accent: '#f4efc9' },
    night: { sky: '#35496b', hill: '#5e7790', ground: '#8bada0', tree: '#4a726e', accent: '#a1bca4' },
  };
  const p = palettes[theme];
  const night = theme === 'night';
  return `<svg viewBox="0 0 1000 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1000" height="600" fill="${p.sky}"/>
    ${night ? '<g fill="#f9e7ad"><path d="M840 30a35 35 0 1 0 32 45a29 29 0 0 1-32-45Z"/><circle cx="380" cy="30" r="2"/><circle cx="610" cy="55" r="3"/><circle cx="960" cy="80" r="2"/><path d="M500 23v12m-6-6h12m224 27v12m-6-6h12" stroke="#f9e7ad" stroke-width="2"/></g>' : '<g fill="#fff" opacity=".58"><path d="M269 60q-10-25 16-30q16-19 33 0q27-3 26 22q14 5 8 15h-82Z"/><path d="M723 41q-7-18 15-22q21-25 38-3q27-2 28 22q18 0 18 15h-99Z"/></g>'}
    <path d="M0 163Q155 64 365 146T715 124T1000 155V600H0Z" fill="${p.hill}"/>
    <path d="M0 260Q216 179 476 224T1000 196V600H0Z" fill="${p.ground}"/>
    <path d="M390 191Q689 245 508 360T797 600H541Q298 457 441 346T284 212Z" fill="${p.accent}" opacity=".65"/>
    ${tree(66, 117, 1.2, p.tree, theme === 'orchard')}${tree(952, 144, 1.6, p.tree, theme === 'orchard')}${tree(157, 51, .55, p.tree, theme === 'orchard')}${tree(592, 77, .55, p.tree, theme === 'orchard')}
    ${theme === 'pond' ? '<ellipse cx="760" cy="444" rx="172" ry="80" fill="#8ec7d1"/><ellipse cx="760" cy="442" rx="154" ry="65" fill="#a5d9df"/><g stroke="#d8f4eb" stroke-width="3" fill="none" stroke-linecap="round"><path d="M685 421h35m44 49h56m-2-47h29m-159 33h25"/></g><g transform="translate(760 431)"><ellipse cy="4" rx="16" ry="9" fill="#ffe198"/><circle cx="11" cy="-7" r="9" fill="#ffe198"/><path d="M18-7h9l-7 6" fill="#e9a657"/><circle cx="13" cy="-10" r="1.6" fill="#5f5342"/></g>' : ''}
    ${theme === 'night' ? '<path d="M670 388l139 3 45 76-157 2Z" fill="#d5a38d"/><g stroke="#f4ccb0" stroke-width="3" opacity=".8"><path d="M691 391l27 77m9-77l29 77m9-77l30 77m-109-47h141m-134 25h148"/></g><path d="M737 394v-16q0-22 23-22t23 22v16" stroke="#d7b574" stroke-width="5" fill="none"/><path d="M733 390h53l-5 31h-42Z" fill="#c7975b"/>' : ''}
    <g fill="${p.tree}" opacity=".42"><path d="M102 381l-6-11m6 11l7-14m0 14l6-8M509 494l-6-11m6 11l7-14m0 14l6-8M841 283l-6-11m6 11l7-14m0 14l6-8M443 266l-6-11m6 11l7-14m0 14l6-8M178 511l-6-11m6 11l7-14m0 14l6-8" stroke="${p.tree}" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    ${flower(59, 478)}${flower(88, 492, '#f5c4a6', .7)}${flower(480, 547)}${flower(920, 529, '#fff5ce', 1.2)}${flower(896, 552, '#f5c4a6', .8)}${flower(402, 329, '#fff5ce', .6)}
    <g fill="#a6b298"><path d="M143 326q-18-30 8-38q28-15 39 20l-3 18Z"/><path d="M846 554q-15-26 8-32q25-13 36 18l-3 14Z"/></g>
    <g fill="#fff" opacity=".3"><ellipse cx="155" cy="300" rx="11" ry="4"/><ellipse cx="860" cy="529" rx="10" ry="3"/></g>
    <g transform="translate(845 210)"><path d="M0 0v22" stroke="#f2dfbe" stroke-width="9"/><path d="M-16 0q0-28 17-28T17 0Z" fill="#d89579"/><g fill="#f7ebce"><circle cx="-5" cy="-10" r="3"/><circle cx="6" cy="-18" r="3"/></g></g>
    <path d="M0 572q43-39 81 4q32-28 62 24H0Zm1000-3q-49-38-90 5q-26-15-48 26h138Z" fill="${p.tree}" opacity=".55"/>
  </svg>`;
}

export function stickerArt(type) {
  const icons = {
    leaf: '<path d="M23 57Q8 23 65 17q12 45-20 48" fill="#80ab6a" stroke="#547c50" stroke-width="3"/><path d="M25 69l30-37m-21 22l-3-15m11 9l15 1" stroke="#e2edba" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M65 47q12 1 10 9m-5 5q11 3 7 10" stroke="#80ab6a" stroke-width="3" fill="none" stroke-linecap="round"/>',
    duck: '<path d="M16 46q6 32 44 17q17-4 8-28" fill="#ffd16a" stroke="#bb8843" stroke-width="3"/><circle cx="58" cy="32" r="17" fill="#ffd16a" stroke="#bb8843" stroke-width="3"/><path d="M72 32h12l-13 8" fill="#ea9455"/><circle cx="61" cy="28" r="3" fill="#5b4437"/><path d="M29 48q5 15 21 6" fill="none" stroke="#e8ab50" stroke-width="3"/><path d="M17 75h51" stroke="#8cb9ba" stroke-width="4" stroke-linecap="round"/>',
    urn: '<path d="M31 27q5 11-2 22q-16 26 15 29q33-2 19-29q-8-11-4-22" fill="#f1bf69" stroke="#a57843" stroke-width="3"/><ellipse cx="45" cy="27" rx="19" ry="6" fill="#d99c53" stroke="#a57843" stroke-width="3"/><path d="M25 58h39v11H27Z" fill="#6d9f9c"/><path d="M14 39l-7-5m9 21l-9 2m66-22l7-6m-5 22l9 1" stroke="#a57843" stroke-width="3" stroke-linecap="round"/><path d="M42 39l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#fff2c4"/>',
    crown: '<path d="M18 30l16 13 11-24 13 24 16-13-6 38H25Z" fill="#f8c650" stroke="#ad7b3b" stroke-width="3" stroke-linejoin="round"/><path d="M26 58h42" stroke="#ffe6a0" stroke-width="4"/><circle cx="46" cy="49" r="5" fill="#df9274"/><g fill="#f8c650" stroke="#ad7b3b" stroke-width="2"><circle cx="18" cy="27" r="4"/><circle cx="45" cy="17" r="4"/><circle cx="75" cy="27" r="4"/></g><path d="M20 78h53" stroke="#dcc8a0" stroke-width="3" stroke-linecap="round"/>',
  };
  return `<svg viewBox="0 0 92 92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M46 4l10 5 11-1 7 9 10 4 1 12 5 10-5 10-1 12-10 4-7 9-11-1-10 5-10-5-11 1-7-9-10-4-1-12-5-10 5-10 1-12 10-4 7-9 11 1Z" fill="#fff8df" stroke="#e6d6b1" stroke-width="2"/>${icons[type]}</svg>`;
}
