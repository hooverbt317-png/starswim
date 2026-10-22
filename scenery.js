/* The 25 ocean scenes (Bryan, 2026-10-22: "about 25 unique backgrounds that can be rotated through .. they change with
   each new stage"). Stage 1 has scene 1, stage 2 scene 2, ... and after stage 25 they come round again (rules.sceneFor),
   so everyone sees the same sea on the same stage. A new scene fades in over the old one.
   Each scene is a palette plus a few pieces of scenery. The still parts are painted once, into a picture of their own,
   when the scene comes in (cheap to show every frame); only the small moving touches (swaying kelp, drifting specks,
   rising bubbles) are drawn every frame. The busy parts stay along the sea floor and the sides, and the water stays
   darkish in the middle, so the stars and the monsters are always easy to see. */

// water: top, middle, bottom of the sea. light/rays: the color and strength of the light rays (0 = none). floor/detail:
// the sea floor and the rocks and such on it. pieces: the still scenery; live: the moving touches (see STILL and LIVE).
const SCENES = [
  {name: 'Home Waters', water: ['#124f62', '#083449', '#06273e'], light: '#d4fff1', rays: .035, floor: '#092d40', detail: '#0f3a4e',
    floorShape: 'hill', plants: ['#17515a', '#11404d'], pieces: [], live: ['plants']},
  {name: 'Kelp Forest', water: ['#1d5a4a', '#0c3a35', '#072a2a'], light: '#e6ffd4', rays: .05, floor: '#0b3028', detail: '#164236',
    floorShape: 'dunes', plants: ['#3d7a3a', '#2c6331', '#4a8a40'], pieces: ['rocks'], live: ['kelp']},
  {name: 'Sandy Shallows', water: ['#1f7d86', '#0f5266', '#0a3b52'], light: '#fffbe0', rays: .06, floor: '#5c5644', detail: '#6e6650',
    floorShape: 'dunes', plants: ['#2f7a6a', '#24685c'], accents: ['#8a7a6a', '#9a8070', '#7a6a62'], pieces: ['ripples', 'shells'], live: ['plants']},
  {name: 'Coral Reef', water: ['#155a78', '#0a3a5a', '#072a45'], light: '#d9f6ff', rays: .045, floor: '#0d3346', detail: '#164a5c',
    floorShape: 'hill', plants: ['#1d5a64', '#164a55'], accents: ['#b8574d', '#c98a4b', '#8b5bb5', '#b04f7a'], pieces: ['coral', 'brain'], live: ['plants']},
  {name: 'Shipwreck', water: ['#20505a', '#0f343f', '#0a2530'], light: '#d4f0e8', rays: .04, floor: '#0d2a30', detail: '#1a3a40',
    floorShape: 'dunes', plants: ['#1f4a48', '#18403e'], accents: ['#3e3024', '#2a2018', '#8a8070'], pieces: ['rocks', 'wreck'], live: ['plants']},
  {name: 'Rocky Ledges', water: ['#1b4766', '#0c2f4a', '#08223a'], light: '#d8ecff', rays: .035, floor: '#0f2a3d', detail: '#25496a',
    floorShape: 'rocky', plants: ['#1d4a5a', '#163e4c'], pieces: ['ledges', 'rocks'], live: ['plants']},
  {name: 'Sunset Lagoon', water: ['#7a4a5e', '#3a3256', '#152a45'], light: '#ffd9a8', rays: .06, glow: '#ffb36b', floor: '#1d2a40', detail: '#2b3550',
    floorShape: 'hill', plants: ['#4b4a6a', '#3a3a58'], pieces: ['sun', 'rocks'], live: ['plants']},
  {name: 'Twilight Zone', water: ['#1e2a5a', '#121a40', '#0a1030'], light: '#b9c6ff', rays: .025, floor: '#0d1430', detail: '#18204a',
    floorShape: 'flat', plants: ['#2a3a6a', '#22305a'], mote: '#7fe8ff', pieces: [], live: ['plants', 'plankton']},
  {name: 'Sunken Ruins', water: ['#24576a', '#123a4c', '#0b2a3a'], light: '#e0f4ff', rays: .045, floor: '#123040', detail: '#1c4050',
    floorShape: 'flat', plants: ['#1f5058', '#18444c'], accents: ['#3f5a66', '#324a55'], pieces: ['columns'], live: ['plants']},
  {name: 'Volcanic Vents', water: ['#4a3040', '#2b1f33', '#1a1424'], light: '#ffcf9e', rays: .02, glow: '#ff6a2a', floor: '#1d1316', detail: '#33201f',
    floorShape: 'rocky', plants: ['#3a2a30', '#2e2228'], pieces: ['rocks', 'vents'], live: ['ventBubbles']},
  {name: 'Ice Cave', water: ['#3f7f9c', '#1f5577', '#123c5c'], light: '#ffffff', rays: .05, floor: '#4f7d96', detail: '#7aa9c0',
    floorShape: 'flat', plants: ['#3a6a85', '#2f5c76'], mote: '#ffffff', pieces: ['icicles', 'ice'], live: ['snow']},
  {name: 'Midnight Abyss', water: ['#0b1a2e', '#060f1e', '#030913'], light: '#8fb0ff', rays: 0, floor: '#050d18', detail: '#0c1828',
    floorShape: 'flat', plants: ['#0e2030', '#0b1a28'], mote: '#5cf2c2', pieces: ['rocks'], live: ['plankton', 'snow']},
  {name: 'Seagrass Meadow', water: ['#2a6a5c', '#164638', '#0d3328'], light: '#f0ffd0', rays: .05, floor: '#1e3a2a', detail: '#2a4a34',
    floorShape: 'flat', plants: ['#4d8a4a', '#3b7340', '#5a9a52'], pieces: [], live: ['grass']},
  {name: 'Pink Lagoon', water: ['#6a3a6e', '#3e2452', '#25183a'], light: '#ffd1f0', rays: .04, floor: '#2c1a3a', detail: '#3d2550',
    floorShape: 'hill', plants: ['#6a3a7a', '#55306a'], accents: ['#b0507a', '#c06a8a', '#9a4a8a'], pieces: ['coral'], live: ['plants']},
  {name: 'Pearl Bay', water: ['#1f5f7a', '#103d55', '#0a2c42'], light: '#f0fbff', rays: .045, floor: '#3c4a55', detail: '#4c5c68',
    floorShape: 'dunes', plants: ['#1f5260', '#184654'], accents: ['#8a7c90', '#7a6c80', '#6a6070'], pieces: ['shells', 'clams'], live: ['plants']},
  {name: 'Stormy Sea', water: ['#3a4a50', '#1f2c33', '#141d24'], light: '#c8d4d8', rays: 0, floor: '#1a2328', detail: '#28343b',
    floorShape: 'rocky', plants: ['#26363a', '#1f2e32'], mote: '#c8d4d8', pieces: ['waves', 'rocks'], live: ['snow', 'plants']},
  {name: 'Treasure Cove', water: ['#1b5560', '#0d3842', '#082a33'], light: '#fff4d0', rays: .045, floor: '#4a4436', detail: '#5c5442',
    floorShape: 'dunes', plants: ['#1f4f50', '#184446'], accents: ['#8a7a6a', '#7a6a5a'], pieces: ['rocks', 'shells', 'chest'], live: ['plants']},
  {name: 'Bubble Fields', water: ['#1a5a80', '#0d3a5e', '#082a48'], light: '#e0f6ff', rays: .04, floor: '#0b2c45', detail: '#153c58',
    floorShape: 'hill', plants: ['#1a4a62', '#143e55'], pieces: ['rocks'], live: ['bubbleColumns']},
  {name: 'Anemone Garden', water: ['#1d4a6a', '#0f3050', '#0a223c'], light: '#e4f0ff', rays: .04, floor: '#132a40', detail: '#1d3a52',
    floorShape: 'dunes', plants: ['#c4607a', '#d08a4a', '#7a6ac4'], pieces: ['rocks'], live: ['anemones']},
  {name: 'Moonlit Waters', water: ['#203a6a', '#122650', '#0a1838'], light: '#e8eeff', rays: .045, floor: '#0e1a36', detail: '#1a2a4c',
    floorShape: 'hill', plants: ['#1e3460', '#182c52'], pieces: ['moon', 'rocks'], live: ['plants']},
  {name: 'Sponge Reef', water: ['#2a5560', '#16383f', '#0e282e'], light: '#f4ffe8', rays: .045, floor: '#1a3330', detail: '#26443e',
    floorShape: 'dunes', plants: ['#2a4a40', '#224038'], accents: ['#b58a3a', '#a0503a', '#7a6a3a', '#8a5a6a'], pieces: ['sponges', 'brain'], live: ['plants']},
  {name: 'Deep Canyon', water: ['#173a5a', '#0b2540', '#06182c'], light: '#cfe4ff', rays: .03, floor: '#0a1a2a', detail: '#1b3652',
    floorShape: 'rocky', plants: ['#14304a', '#10283e'], mote: '#cfe4ff', pieces: ['cliffs'], live: ['snow']},
  {name: 'Sunken City', water: ['#1c4555', '#0e2c3a', '#08202c'], light: '#e0f4ff', rays: .04, floor: '#0c2430', detail: '#1e4656',
    floorShape: 'flat', plants: ['#1a4450', '#143a46'], accents: ['#ffd27a'], pieces: ['city'], live: ['plants']},
  {name: 'Crystal Caves', water: ['#2a2a5a', '#18183f', '#0f0f2c'], light: '#e0d8ff', rays: .025, floor: '#15153a', detail: '#22224e',
    floorShape: 'rocky', plants: ['#2a2a60', '#222252'], mote: '#c2a8ff', accents: ['#7ad0ff', '#b08cff', '#7affd6'], pieces: ['crystals'], live: ['plankton']},
  {name: 'Rainbow Reef', water: ['#185a7a', '#0b3b5c', '#072b47'], light: '#e8fbff', rays: .045, floor: '#0d3046', detail: '#164560',
    floorShape: 'hill', plants: ['#1a5468', '#14485a'], accents: ['#c0504d', '#c98a3d', '#c9b84a', '#5aa05a', '#4a8ac0', '#8a6ac0'],
    pieces: ['coral', 'sponges', 'brain'], live: ['plants']},
];
const SCENE_FADE = 1.2;  // seconds for one scene to fade into the next

// The sea floor's shape: how far above the bottom of the screen it is, across the screen (t from 0 at the left to 1).
const FLOORS = {
  hill: t => 46 + 22 * Math.sin(t * Math.PI * 1.3),
  dunes: t => 50 + 10 * Math.sin(t * Math.PI * 3 + .5) + 6 * Math.sin(t * Math.PI * 7),
  flat: t => 46 + 6 * Math.sin(t * Math.PI * 2 + 1),
  rocky: t => 52 + 12 * Math.sin(t * Math.PI * 2.4),
};

// --- Laying out a scene: where its rocks, kelp and so on go. The same scene always comes out the same (its own seed). ---
function planScene(index) {
  const scene = SCENES[index], r = StarRules.makeRandom(7919 * (index + 1)), S = sizeScale;
  const jag = Array.from({length: 11}, () => scene.floorShape === 'rocky' ? r() * 18 - 9 : 0);
  const floor = Array.from({length: 41}, (_, i) => {
    const t = i / 40, k = t * 10, j = Math.min(9, Math.floor(k));
    return [t * width, height - FLOORS[scene.floorShape](t) - (jag[j] + (jag[j + 1] - jag[j]) * (k - j))];
  });
  const plan = {scene, r, floor};
  const edgeX = () => r() < .5 ? r() * width * .16 : width - r() * width * .16;
  const live = new Set(scene.live);
  if (live.has('kelp')) plan.kelp = Array.from({length: 10}, (_, i) => {
    const middle = i >= 8, x = middle ? width * (.35 + r() * .3) : edgeX();
    return {x, tall: middle ? height * (.08 + r() * .05) : height * (.28 + r() * .3), phase: r() * 6, color: scene.plants[i % 3]};
  });
  if (live.has('grass')) plan.grass = Array.from({length: 46}, (_, i) => {
    const x = (i + r() * .8) / 46 * width, edge = Math.min(x, width - x) < width * .2;
    return {x, tall: (edge ? 30 + r() * 34 : 12 + r() * 18) * S, phase: r() * 6, color: i % 3};
  });
  if (live.has('anemones')) plan.anemones = [.07, .24, .52, .8, .94].map((k, i) =>
    ({x: width * k, size: (i === 2 ? 10 : 15 + r() * 6) * S, phase: r() * 6, color: scene.plants[i % 3]}));
  if (live.has('plankton')) plan.motes = Array.from({length: 40}, () => ({x: r(), y: r(), phase: r() * 6, speed: .004 + r() * .01, size: (1 + r() * 1.4) * S}));
  if (live.has('snow')) plan.snow = Array.from({length: 55}, () => ({x: r(), y: r(), phase: r() * 6, speed: .008 + r() * .012, size: (1 + r() * 1.2) * S}));
  if (scene.pieces.includes('vents')) plan.vents = [[.12, 105], [.52, 34], [.87, 80]].map(([k, tall]) => ({x: width * k, tall: tall * S, phase: r()}));
  if (live.has('bubbleColumns')) plan.columns = [.09, .3, .7, .92].map(k => ({x: width * k + (r() - .5) * 20, phase: r(), speed: .1 + r() * .06}));
  return plan;
}
// How high the sea floor is at x (in screen points from the top).
function floorY(plan, x) {
  const k = Math.max(0, Math.min(40, x / width * 40)), i = Math.min(39, Math.floor(k)), [, a] = plan.floor[i], [, b] = plan.floor[i + 1];
  return a + (b - a) * (k - i);
}

// --- The still pieces, painted once per scene. Each gets the scene and its plan (with plan.r, the scene's own random). ---
const BEHIND_FLOOR = new Set(['sun', 'moon', 'waves', 'cliffs', 'city', 'icicles', 'ledges']);
const STILL = {
  sun(s) {
    const glow = ctx.createRadialGradient(width * .5, -height * .1, 0, width * .5, -height * .1, height * .75);
    glow.addColorStop(0, s.glow + '66'); glow.addColorStop(1, s.glow + '00');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
  },
  moon() {
    const x = width * .78, y = 100 * sizeScale, R = 22 * sizeScale;
    const halo = ctx.createRadialGradient(x, y, R, x, y, R * 6);
    halo.addColorStop(0, '#e8eeff30'); halo.addColorStop(1, '#e8eeff00');
    ctx.fillStyle = halo; ctx.fillRect(x - R * 6, y - R * 6, R * 12, R * 12);
    ctx.fillStyle = '#e9eef880'; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8d0e440'; ctx.beginPath(); ctx.arc(x - R * .3, y - R * .2, R * .25, 0, Math.PI * 2); ctx.arc(x + R * .35, y + R * .3, R * .18, 0, Math.PI * 2); ctx.fill();
  },
  waves(s) {
    ctx.fillStyle = shadeColor(s.water[0], '#000000', .4) + 'b0'; ctx.beginPath(); ctx.moveTo(0, 0);
    for (let x = 0; x <= width + 10; x += 10) ctx.lineTo(x, 34 + Math.sin(x * .05) * 7 + Math.sin(x * .013) * 8);
    ctx.lineTo(width, 0); ctx.fill();
    ctx.strokeStyle = '#d8e4e830'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= width + 10; x += 10) ctx.lineTo(x, 36 + Math.sin(x * .05) * 7 + Math.sin(x * .013) * 8);
    ctx.stroke();
  },
  rocks(s, plan) {
    const r = plan.r, light = shadeColor(s.detail, '#ffffff', .08);
    for (let i = 0; i < 6; i++) {
      const x = i % 2 ? width - r() * width * .3 : r() * width * .3, size = (10 + r() * 18) * sizeScale, y = floorY(plan, x) + size * .3;
      ctx.fillStyle = s.detail; ctx.beginPath(); ctx.ellipse(x, y, size * 1.3, size, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(x - size * .3, y - size * .6, size * .5, size * .18, -.2, 0, Math.PI * 2); ctx.fill();
    }
  },
  ripples(s, plan) {
    const r = plan.r; ctx.strokeStyle = shadeColor(s.floor, '#ffffff', .1); ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      const x = r() * width, y = floorY(plan, x) + 8 + r() * 22, w = (14 + r() * 22) * sizeScale;
      ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x, y - 4, x + w / 2, y); ctx.stroke();
    }
  },
  shells(s, plan) {
    const r = plan.r;
    for (let i = 0; i < 6; i++) {
      const x = (i + .2 + r() * .6) / 6 * width, y = floorY(plan, x) + 10 + r() * 10, R = (5 + r() * 4) * sizeScale, color = s.accents[i % s.accents.length];
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, R, Math.PI, 0); ctx.lineTo(x + R * .3, y + R * .35); ctx.lineTo(x - R * .3, y + R * .35); ctx.fill();
      ctx.strokeStyle = shadeColor(color, '#000000', .3); ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 1; k < 5; k++) { const a = Math.PI + k / 5 * Math.PI; ctx.moveTo(x, y + R * .2); ctx.lineTo(x + Math.cos(a) * R * .9, y + Math.sin(a) * R * .9); }
      ctx.stroke();
    }
  },
  coral(s, plan) {
    const r = plan.r;
    function branch(x, y, length, angle, depth) {
      const x2 = x + Math.cos(angle) * length, y2 = y + Math.sin(angle) * length;
      ctx.lineWidth = Math.max(2, depth * 2.2) * sizeScale; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      if (depth > 1) for (const turn of [-.45, .4]) branch(x2, y2, length * .72, angle + turn + (r() - .5) * .35, depth - 1);
    }
    ctx.lineCap = 'round';
    [.05, .17, .4, .62, .84, .95].forEach((k, i) => {
      const middle = k > .3 && k < .7, x = width * k + (r() - .5) * 16, y = floorY(plan, x) + 6;
      ctx.strokeStyle = s.accents[i % s.accents.length];
      branch(x, y, (middle ? 12 : 22 + r() * 8) * sizeScale, -Math.PI / 2 + (r() - .5) * .3, middle ? 3 : 4);
    });
  },
  brain(s, plan) {
    const r = plan.r;
    [.12, .48, .9].forEach((k, i) => {
      const x = width * k + (r() - .5) * 30, R = (k === .48 ? 11 : 17) * sizeScale, y = floorY(plan, x) + 6, color = s.accents[(i + 1) % s.accents.length];
      ctx.fillStyle = shadeColor(color, '#000000', .25); ctx.beginPath(); ctx.ellipse(x, y, R * 1.3, R, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = shadeColor(color, '#000000', .5); ctx.lineWidth = 1.5; ctx.beginPath();
      for (let k2 = 1; k2 < 4; k2++) { const yy = y - R * k2 / 4; ctx.moveTo(x - R * 1.1 * Math.sqrt(1 - (k2 / 4) ** 2), yy);
        for (let t = -1; t <= 1; t += .2) ctx.lineTo(x + t * R * 1.1 * Math.sqrt(1 - (k2 / 4) ** 2), yy + Math.sin(t * 9 + k2) * 2); }
      ctx.stroke();
    });
  },
  wreck(s, plan) {
    const S = sizeScale, x0 = width * .5, x1 = width * 1.05, y0 = floorY(plan, x0) + 8, y1 = floorY(plan, width) + 8;
    const deck0 = y0 - 44 * S, deck1 = y1 - 72 * S, [wood, dark, sail] = s.accents;
    // The mast and its torn sail (behind the hull).
    const mx = x0 + (x1 - x0) * .55, my = deck0 + (deck1 - deck0) * .55, angle = -Math.PI / 2 + .28, L = 150 * S;
    const tx = mx + Math.cos(angle) * L, ty = my + Math.sin(angle) * L, cx = mx + Math.cos(angle) * L * .72, cy = my + Math.sin(angle) * L * .72;
    ctx.fillStyle = sail + '55'; ctx.beginPath(); ctx.moveTo(cx - 24 * S, cy + 6 * S); ctx.lineTo(cx + 26 * S, cy - 6 * S); ctx.lineTo(cx + 10 * S, cy + 60 * S); ctx.lineTo(cx - 6 * S, cy + 34 * S); ctx.fill();
    ctx.strokeStyle = wood; ctx.lineCap = 'round'; ctx.lineWidth = 7 * S; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.lineWidth = 5 * S; ctx.beginPath(); ctx.moveTo(cx - 28 * S, cy + 7 * S); ctx.lineTo(cx + 30 * S, cy - 7 * S); ctx.stroke();
    // The hull, tilted into the sand.
    ctx.beginPath(); ctx.moveTo(x0, deck0); ctx.lineTo(x1, deck1); ctx.lineTo(x1, y1 + 12 * S);
    ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 22 * S, x0 + 20 * S, y0 + 6 * S); ctx.closePath();
    ctx.fillStyle = wood; ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = dark; ctx.lineWidth = 2;
    for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x0, deck0 + k * 11 * S); ctx.lineTo(x1, deck1 + k * 11 * S); ctx.stroke(); }
    // A hole in its side.
    ctx.fillStyle = '#081418'; ctx.beginPath(); const hx = x0 + (x1 - x0) * .3, hy = deck0 + (deck1 - deck0) * .3 + 26 * S;
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, d = (k % 2 ? 7 : 13) * S; ctx.lineTo(hx + Math.cos(a) * d * 1.3, hy + Math.sin(a) * d); }
    ctx.fill(); ctx.restore();
    for (const k of [.55, .72, .88]) {
      const px = x0 + (x1 - x0) * k, py = deck0 + (deck1 - deck0) * k + 18 * S;
      ctx.fillStyle = '#0a1a20'; ctx.strokeStyle = dark; ctx.lineWidth = 2.5 * S; ctx.beginPath(); ctx.arc(px, py, 5 * S, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle = shadeColor(wood, '#ffffff', .12); ctx.lineWidth = 2.5 * S; ctx.beginPath(); ctx.moveTo(x0, deck0); ctx.lineTo(x1, deck1); ctx.stroke();
  },
  ledges(s) {
    const S = sizeScale, light = shadeColor(s.detail, '#ffffff', .1);
    for (const [side, k, length] of [[0, .3, .17], [1, .5, .14], [0, .7, .12], [1, .8, .09]]) {
      const edge = side ? width : 0, dir = side ? -1 : 1, y = height * k, L = width * length, T = 24 * S;
      ctx.fillStyle = s.detail; ctx.beginPath(); ctx.moveTo(edge, y - T * 1.2); ctx.lineTo(edge + dir * L * .6, y - T * .9); ctx.lineTo(edge + dir * L, y - T * .3);
      ctx.lineTo(edge + dir * L * .85, y + T * .4); ctx.lineTo(edge + dir * L * .35, y + T * .9); ctx.lineTo(edge, y + T * 1.5); ctx.fill();
      ctx.strokeStyle = light; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(edge, y - T * 1.2); ctx.lineTo(edge + dir * L * .6, y - T * .9); ctx.lineTo(edge + dir * L, y - T * .3); ctx.stroke();
    }
  },
  columns(s, plan) {
    const S = sizeScale, [stone, shade] = s.accents, w = 22 * S;
    function column(x, tall, broken) {
      const base = floorY(plan, x) + 6, top = base - tall;
      ctx.fillStyle = stone; ctx.fillRect(x - w / 2, top, w, tall);
      ctx.strokeStyle = shade; ctx.lineWidth = 2; ctx.beginPath();
      for (const k of [-.25, 0, .25]) { ctx.moveTo(x + k * w, top + 4); ctx.lineTo(x + k * w, base - 8 * S); }
      ctx.stroke();
      ctx.fillStyle = shade; ctx.fillRect(x - w * .75, base - 8 * S, w * 1.5, 8 * S);
      if (broken) { ctx.fillStyle = stone; ctx.beginPath(); ctx.moveTo(x - w / 2, top); ctx.lineTo(x - w * .2, top - 9 * S); ctx.lineTo(x, top - 3 * S); ctx.lineTo(x + w * .3, top - 12 * S); ctx.lineTo(x + w / 2, top); ctx.fill(); }
      else { ctx.fillStyle = stone; ctx.fillRect(x - w * .85, top - 10 * S, w * 1.7, 10 * S); ctx.fillStyle = shade; ctx.fillRect(x - w * .85, top - 3 * S, w * 1.7, 3 * S); }
    }
    column(width * .09, height * .32, false); column(width * .24, 60 * S, true); column(width * .9, height * .2, true);
    // A fallen piece of column lying on the floor.
    const fx = width * .62, fy = floorY(plan, fx) - 3 * S;
    ctx.fillStyle = stone; ctx.fillRect(fx - 26 * S, fy - 9 * S, 52 * S, 18 * S);
    ctx.fillStyle = shade; ctx.beginPath(); ctx.ellipse(fx + 26 * S, fy, 4 * S, 9 * S, 0, 0, Math.PI * 2); ctx.fill();
  },
  vents(s, plan) {
    const S = sizeScale;
    // Hot cracks in the floor.
    ctx.strokeStyle = s.glow + '55'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 7; i++) { let x = plan.r() * width, y = floorY(plan, x) + 10 + plan.r() * 15; ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (plan.r() * 2 - .5) * 10 * S; y += (plan.r() - .5) * 6; ctx.lineTo(x, y); } }
    ctx.stroke();
    for (const vent of plan.vents) {
      const base = floorY(plan, vent.x) + 8, top = base - vent.tall; vent.top = top;
      ctx.fillStyle = s.detail; ctx.beginPath(); ctx.moveTo(vent.x - 18 * S, base); ctx.lineTo(vent.x - 8 * S, top); ctx.lineTo(vent.x + 8 * S, top); ctx.lineTo(vent.x + 18 * S, base); ctx.fill();
      for (let k = 1; k < 4; k++) { const y = base - vent.tall * k / 4, half = (18 - k * 2.5) * S; ctx.beginPath(); ctx.ellipse(vent.x, y, half, 5 * S, 0, 0, Math.PI * 2); ctx.fill(); }
      const glow = ctx.createRadialGradient(vent.x, top, 0, vent.x, top, 42 * S);
      glow.addColorStop(0, s.glow + '70'); glow.addColorStop(1, s.glow + '00');
      ctx.fillStyle = glow; ctx.fillRect(vent.x - 42 * S, top - 42 * S, 84 * S, 84 * S);
      ctx.fillStyle = s.glow + 'cc'; ctx.beginPath(); ctx.ellipse(vent.x, top, 8 * S, 3 * S, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
  icicles(s, plan) {
    const r = plan.r, S = sizeScale;
    ctx.fillStyle = '#dff4ff26'; ctx.fillRect(0, 0, width, 14 * S);
    ctx.fillStyle = '#dff4ff40'; ctx.beginPath();
    for (let x = 0; x < width;) { const w = (10 + r() * 14) * S, len = (10 + r() * r() * 60) * S; ctx.moveTo(x, 10 * S); ctx.lineTo(x + w / 2, 10 * S + len); ctx.lineTo(x + w, 10 * S); x += w + r() * 8 * S; }
    ctx.fill();
  },
  ice(s, plan) {
    const r = plan.r, S = sizeScale, light = shadeColor(s.detail, '#ffffff', .25);
    for (let i = 0; i < 7; i++) {
      const x = i % 2 ? width - r() * width * .35 : r() * width * .35, w = (16 + r() * 22) * S, h = (12 + r() * (Math.min(x, width - x) < width * .15 ? 40 : 14)) * S, y = floorY(plan, x) + 8;
      ctx.fillStyle = s.detail + 'cc'; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w * .4, y - h); ctx.lineTo(x + w * .1, y - h * 1.15); ctx.lineTo(x + w / 2, y - h * .6); ctx.lineTo(x + w / 2, y); ctx.fill();
      ctx.strokeStyle = light; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - w * .4, y - h); ctx.lineTo(x + w * .1, y - h * 1.15); ctx.lineTo(x + w / 2, y - h * .6); ctx.stroke();
    }
  },
  clams(s, plan) {
    const S = sizeScale;
    [.14, .5, .84].forEach((k, i) => {
      const x = width * k, R = (k === .5 ? 11 : 16) * S, y = floorY(plan, x) + 4, color = s.accents[i % s.accents.length], dark = shadeColor(color, '#000000', .35);
      // The top shell, open and tipped back.
      ctx.save(); ctx.translate(x - R * .9, y); ctx.rotate(-.55);
      ctx.fillStyle = shadeColor(color, '#ffffff', .1); ctx.beginPath(); ctx.ellipse(R * .9, 0, R * .95, R * .6, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = dark; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let k2 = 1; k2 < 6; k2++) { const a = Math.PI + k2 / 6 * Math.PI; ctx.moveTo(R * .9, 0); ctx.lineTo(R * .9 + Math.cos(a) * R * .9, Math.sin(a) * R * .55); }
      ctx.stroke(); ctx.restore();
      // The pearl, then the bottom shell in front of it.
      ctx.fillStyle = '#efe8f0'; ctx.beginPath(); ctx.arc(x, y - R * .25, R * .32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - R * .1, y - R * .35, R * .09, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, R, R * .5, 0, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = dark; ctx.beginPath(); ctx.moveTo(x - R, y); ctx.lineTo(x + R, y); ctx.stroke();
    });
  },
  chest(s, plan) {
    const S = sizeScale, x = width * .2, y = floorY(plan, x) + 6, w = 50 * S, h = 28 * S, wood = '#4e3420', band = '#7a6230', coin = '#a8883a';
    // The lid, open and leaning back.
    ctx.save(); ctx.translate(x - w / 2, y - h); ctx.rotate(-1.05);
    ctx.fillStyle = shadeColor(wood, '#000000', .2); ctx.fillRect(0, -16 * S, w, 16 * S); ctx.fillStyle = band; ctx.fillRect(w * .2, -16 * S, 5 * S, 16 * S); ctx.fillRect(w * .75, -16 * S, 5 * S, 16 * S);
    ctx.restore();
    // A heap of coins inside, a few spilled on the sand.
    ctx.fillStyle = coin; ctx.beginPath(); ctx.ellipse(x, y - h, w * .45, 8 * S, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = wood; ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = band; ctx.fillRect(x - w / 2, y - h, w, 4 * S); ctx.fillRect(x - w * .3, y - h, 5 * S, h); ctx.fillRect(x + w * .25, y - h, 5 * S, h);
    ctx.fillRect(x - 4 * S, y - h * .65, 8 * S, 9 * S);
    ctx.fillStyle = coin;
    for (const [dx, dy] of [[34, -2], [42, 2], [50, -1], [-34, 1], [58, 3]]) { ctx.beginPath(); ctx.ellipse(x + dx * S, y + dy * S, 4 * S, 2 * S, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  sponges(s, plan) {
    const r = plan.r, S = sizeScale;
    [.06, .2, .5, .78, .93].forEach((k, i) => {
      const middle = k > .3 && k < .7, color = s.accents[(i + 2) % s.accents.length], count = middle ? 2 : 3;
      for (let t = 0; t < count; t++) {
        const x = width * k + (t - (count - 1) / 2) * 15 * S, tall = (middle ? 16 + r() * 10 : 30 + r() * 45) * S, w = (11 + r() * 4) * S, base = floorY(plan, x) + 8, lean = (t - 1) * .12;
        ctx.save(); ctx.translate(x, base); ctx.rotate(lean);
        ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-w / 2, -tall, w, tall, [w / 2, w / 2, 0, 0]); ctx.fill();
        ctx.fillStyle = shadeColor(color, '#000000', .55); ctx.beginPath(); ctx.ellipse(0, -tall + 3 * S, w * .32, 2.5 * S, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    });
  },
  cliffs(s, plan) {
    const r = plan.r, S = sizeScale;
    for (const side of [0, 1]) {
      const edge = side ? width : 0, dir = side ? -1 : 1;
      for (const [reach, color] of [[.14, shadeColor(s.detail, '#000000', .3)], [.09, s.detail]]) {
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(edge, 0);
        for (let y = 0; y <= height + 40 * S; y += 36 * S) ctx.lineTo(edge + dir * width * reach * (.45 + r() * .55), y);
        ctx.lineTo(edge, height); ctx.fill();
      }
      ctx.strokeStyle = shadeColor(s.detail, '#ffffff', .07); ctx.lineWidth = 1.5; ctx.beginPath();
      for (let y = 60; y < height; y += (50 + r() * 60) * S) { ctx.moveTo(edge, y); ctx.lineTo(edge + dir * width * (.02 + r() * .03), y + 6); }
      ctx.stroke();
    }
  },
  city(s, plan) {
    const r = plan.r, S = sizeScale, lit = s.accents[0];
    let domeDone = false;
    for (let x = -10; x < width;) {
      const w = (28 + r() * 30) * S, mid = x + w / 2, edge = Math.min(mid, width - mid) < width * .22;
      const tall = (edge ? 70 + r() * 110 : 22 + r() * 30) * S, base = height, top = floorY(plan, mid) - tall;
      ctx.fillStyle = s.detail; ctx.fillRect(x, top, w - 4 * S, base - top);
      if (edge && !domeDone && x > width * .6) { domeDone = true; ctx.beginPath(); ctx.arc(x + (w - 4 * S) / 2, top, (w - 4 * S) / 2, Math.PI, 0); ctx.fill();
        ctx.fillRect(x + (w - 4 * S) / 2 - 1.5 * S, top - (w / 2 + 16 * S), 3 * S, 18 * S); }
      ctx.fillStyle = lit + '48';
      for (let wy = top + 8 * S; wy < floorY(plan, mid) - 6 * S; wy += 13 * S)
        for (let wx = x + 6 * S; wx < x + w - 12 * S; wx += 11 * S) if (r() < .35) ctx.fillRect(wx, wy, 5 * S, 6 * S);
      x += w;
    }
  },
  crystals(s, plan) {
    const r = plan.r, S = sizeScale;
    function crystal(x, y, length, w, angle, color) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
      ctx.fillStyle = color + '80'; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -length * .75); ctx.lineTo(0, -length); ctx.lineTo(w / 2, -length * .75); ctx.lineTo(w / 2, 0); ctx.fill();
      ctx.strokeStyle = color + 'c0'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -length); ctx.stroke();
      ctx.restore();
    }
    const clusters = [[width * .06, null, 0], [width * .25, null, 0], [width * .55, null, 0], [width * .8, null, 0], [width * .95, null, 0],
      [0, height * .42, Math.PI / 2], [width, height * .6, -Math.PI / 2]];
    clusters.forEach(([x, wallY, turn], i) => {
      const y = wallY ?? floorY(plan, x) + 8, middle = wallY === null && x > width * .3 && x < width * .7, color = s.accents[i % s.accents.length];
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 50 * S); glow.addColorStop(0, color + '30'); glow.addColorStop(1, color + '00');
      ctx.fillStyle = glow; ctx.fillRect(x - 50 * S, y - 50 * S, 100 * S, 100 * S);
      for (let k = 0; k < 4; k++) crystal(x + (k - 1.5) * 7 * S, y, (middle ? 14 + r() * 10 : 24 + r() * 40) * S, (8 + r() * 5) * S, turn + (k - 1.5) * .28 + (r() - .5) * .2, color);
    });
  },
};

// --- The moving touches, drawn every frame (a = how see-through, for the fade between scenes). ---
const LIVE = {
  plants(s, plan, a) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const x = i < 6 ? i * 11 : width - (i - 6) * 12, tall = 35 + (i % 4) * 20, sway = Math.sin(clock * .8 + i) * 8;
      ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x, height + 5); ctx.bezierCurveTo(x - 10, height - 20, x + sway, height - tall / 2, x + sway, height - tall);
      ctx.strokeStyle = s.plants[i % 2]; ctx.lineWidth = 5 + i % 3; ctx.stroke();
    }
  },
  kelp(s, plan, a) {
    const S = sizeScale; ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (const k of plan.kelp) {
      const base = floorY(plan, k.x) + 10, points = [];
      for (let i = 0; i <= 12; i++) points.push([k.x + Math.sin(clock * .6 + k.phase + i * .35) * i * 1.3 * S, base - k.tall * i / 12]);
      ctx.strokeStyle = k.color; ctx.fillStyle = k.color; ctx.lineWidth = 4 * S; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      ctx.beginPath();
      for (let i = 2; i <= 12; i += 2) { const [x, y] = points[i], side = i % 4 ? 1 : -1;
        ctx.ellipse(x + side * 7 * S, y + 2 * S, 9 * S, 3.2 * S, side * .55 + Math.sin(clock + i) * .15, 0, Math.PI * 2); }
      ctx.fill();
    }
  },
  grass(s, plan, a) {
    ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineWidth = 3 * sizeScale;
    for (let c = 0; c < 3; c++) {
      ctx.strokeStyle = s.plants[c]; ctx.beginPath();
      for (const g of plan.grass) if (g.color === c) {
        const base = floorY(plan, g.x) + 6, sway = Math.sin(clock * 1.1 + g.phase + g.x * .01) * g.tall * .25;
        ctx.moveTo(g.x, base); ctx.quadraticCurveTo(g.x, base - g.tall * .6, g.x + sway, base - g.tall);
      }
      ctx.stroke();
    }
  },
  anemones(s, plan, a) {
    ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (const an of plan.anemones) {
      const base = floorY(plan, an.x) + 4, R = an.size;
      ctx.fillStyle = shadeColor(an.color, '#000000', .35); ctx.beginPath(); ctx.ellipse(an.x, base, R * .8, R * .55, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = an.color; ctx.lineWidth = 3 * sizeScale; ctx.beginPath();
      const tips = [];
      for (let i = 0; i < 11; i++) {
        const angle = -Math.PI * (.12 + .76 * i / 10), sway = Math.sin(clock * 1.4 + an.phase + i * .6) * .25, sx = an.x + Math.cos(angle) * R * .6, sy = base - R * .45;
        const ex = an.x + Math.cos(angle + sway) * R * 1.8, ey = sy + Math.sin(angle + sway) * R * 1.7;
        ctx.moveTo(sx, sy); ctx.quadraticCurveTo(an.x + Math.cos(angle) * R * 1.2, sy + Math.sin(angle) * R, ex, ey); tips.push([ex, ey]);
      }
      ctx.stroke();
      ctx.fillStyle = shadeColor(an.color, '#ffffff', .3); ctx.beginPath();
      for (const [x, y] of tips) { ctx.moveTo(x + 2.2 * sizeScale, y); ctx.arc(x, y, 2.2 * sizeScale, 0, Math.PI * 2); }
      ctx.fill();
    }
  },
  plankton(s, plan, a) {
    ctx.fillStyle = s.mote;
    for (const m of plan.motes) {
      const x = m.x * width + Math.sin(clock * .3 + m.phase) * 20, y = ((m.y - clock * m.speed) % 1 + 1) % 1 * height, twinkle = .3 + .3 * Math.sin(clock * 2 + m.phase);
      ctx.globalAlpha = a * twinkle * .3; ctx.beginPath(); ctx.arc(x, y, m.size * 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = a * twinkle; ctx.beginPath(); ctx.arc(x, y, m.size, 0, Math.PI * 2); ctx.fill();
    }
  },
  snow(s, plan, a) {
    ctx.globalAlpha = a * .3; ctx.fillStyle = s.mote; ctx.beginPath();
    for (const m of plan.snow) { const x = m.x * width + Math.sin(clock * .5 + m.phase) * 12, y = (m.y + clock * m.speed) % 1 * height; ctx.rect(x, y, m.size, m.size); }
    ctx.fill();
  },
  ventBubbles(s, plan, a) {
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#ffd8b8';
    for (const vent of plan.vents) for (let k = 0; k < 7; k++) {
      const t = (clock * .22 + k / 7 + vent.phase) % 1, y = vent.top - t * height * .45, x = vent.x + Math.sin(t * 12 + k) * 6 * sizeScale;
      ctx.globalAlpha = a * (1 - t) * .55; ctx.beginPath(); ctx.arc(x, y, (1.5 + t * 3) * sizeScale, 0, Math.PI * 2); ctx.stroke();
    }
  },
  bubbleColumns(s, plan, a) {
    ctx.lineWidth = 1; ctx.strokeStyle = '#cfefff';
    for (const column of plan.columns) for (let k = 0; k < 12; k++) {
      const t = (clock * column.speed + k / 12 + column.phase) % 1, y = floorY(plan, column.x) - t * height * .92, x = column.x + Math.sin(t * 16 + k) * 5 * sizeScale;
      ctx.globalAlpha = a * .55 * (1 - t * .7); ctx.beginPath(); ctx.arc(x, y, (1.4 + t * 2.4) * sizeScale, 0, Math.PI * 2); ctx.stroke();
    }
  },
};

// --- Painting a scene's still picture (once), and showing the scene each frame. ---
function paintScene(index) {
  const s = SCENES[index], plan = planScene(index), ratio = window.devicePixelRatio || 1;
  const picture = document.createElement('canvas');
  picture.width = Math.round(width * ratio); picture.height = Math.round(height * ratio);
  const saved = ctx; ctx = picture.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  try {
    const water = ctx.createLinearGradient(0, 0, width * .35, height);
    water.addColorStop(0, s.water[0]); water.addColorStop(.5, s.water[1]); water.addColorStop(1, s.water[2]);
    ctx.fillStyle = water; ctx.fillRect(0, 0, width, height);
    if (s.rays) {
      ctx.globalAlpha = s.rays; ctx.fillStyle = s.light;
      for (let i = 0; i < 4; i++) { const x = width * (.12 + i * .25); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + width * .35, height); ctx.lineTo(x + width * .04, height); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    for (const piece of s.pieces) if (BEHIND_FLOOR.has(piece)) STILL[piece](s, plan);
    ctx.fillStyle = s.floor; ctx.beginPath(); ctx.moveTo(0, height);
    for (const [x, y] of plan.floor) ctx.lineTo(x, y);
    ctx.lineTo(width, height); ctx.fill();
    ctx.strokeStyle = shadeColor(s.floor, '#ffffff', .06); ctx.lineWidth = 2; ctx.beginPath();
    plan.floor.forEach(([x, y], i) => i ? ctx.lineTo(x, y + 1) : ctx.moveTo(x, y + 1)); ctx.stroke();
    for (const piece of s.pieces) if (!BEHIND_FLOOR.has(piece)) STILL[piece](s, plan);
  } finally { ctx = saved; }
  return {index, picture, plan, width, height};
}

const seaBubbles = Array.from({length: 28}, () => ({x: Math.random(), y: Math.random(), radius: 1 + Math.random() * 3, speed: .015 + Math.random() * .025}));
let sceneNow = null, sceneOld = null, sceneFade = 1, sceneWanted = 0;
// Change to scene `index` (0-24), fading in over a moment.
function setScene(index) {
  sceneWanted = index;
  if (!sceneNow || sceneNow.index === index || !width) return;
  sceneOld = sceneNow; sceneNow = paintScene(index); sceneFade = 0;
}
function showScene(scene, alpha) {
  ctx.globalAlpha = alpha; ctx.drawImage(scene.picture, 0, 0, width, height);
  const s = SCENES[scene.index];
  for (const live of s.live) LIVE[live](s, scene.plan, alpha);
  ctx.globalAlpha = alpha; ctx.strokeStyle = '#b7e6e626'; ctx.lineWidth = 1;
  for (const bubble of seaBubbles) { ctx.beginPath(); ctx.arc(bubble.x * width + Math.sin(clock * .4 + bubble.x * 10) * 8, bubble.y * height, bubble.radius, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
function drawSea(dt) {
  // (Re)paint after the screen changes size, or for the very first scene.
  if (!sceneNow || sceneNow.width !== width || sceneNow.height !== height) { sceneNow = paintScene(sceneWanted); sceneOld = null; }
  if (sceneOld && (sceneFade += dt / SCENE_FADE) >= 1) sceneOld = null;
  for (const bubble of seaBubbles) { bubble.y -= dt * bubble.speed; if (bubble.y < -.01) bubble.y = 1.01; }
  ctx.save();
  if (sceneOld) showScene(sceneOld, 1);
  showScene(sceneNow, sceneOld ? sceneFade : 1);
  ctx.restore();
}

if (typeof module === 'object' && module.exports) module.exports = {SCENES, STILL, LIVE, FLOORS, BEHIND_FLOOR};
