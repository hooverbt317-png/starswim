/* Drawings COPIED from Little Fin (~/Projects/LittleFin/LittleFin/Game/game.js and beach.js, 2026-10-21) so this game
   keeps the same cute look. They are copies on purpose: changing them here never touches Little Fin.
   Trimmed to what StarSwim needs: the "Storybook" fish (plain shape, no power-ups), star bubbles, jellyfish, the
   squid, sparkles and the sea. The fish and jellyfish outlines are in shapes.js.
   They draw with the shared `ctx`, `clock`, `width` and `height` from game.js. */

// --- The sea (Little Fin's background(), default water) ---
const seaBubbles = Array.from({length: 28}, () => ({x: Math.random(), y: Math.random(), radius: 1 + Math.random() * 3, speed: .015 + Math.random() * .025}));
function drawSea(dt) {
  const gradient = ctx.createLinearGradient(0, 0, width * .35, height);
  gradient.addColorStop(0, '#124f62'); gradient.addColorStop(.5, '#083449'); gradient.addColorStop(1, '#06273e');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  // Soft light rays.
  ctx.save(); ctx.globalAlpha = .035; ctx.fillStyle = '#d4fff1';
  for (let i = 0; i < 4; i++) { const x = width * (.12 + i * .25); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + width * .35, height); ctx.lineTo(x + width * .04, height); ctx.fill(); }
  ctx.restore();
  for (const bubble of seaBubbles) {
    bubble.y -= dt * bubble.speed; if (bubble.y < -.01) bubble.y = 1.01;
    ctx.beginPath(); ctx.arc(bubble.x * width + Math.sin(clock * .4 + bubble.x * 10) * 8, bubble.y * height, bubble.radius, 0, Math.PI * 2); ctx.strokeStyle = '#b7e6e626'; ctx.lineWidth = 1; ctx.stroke();
  }
  // Rolling sea floor and swaying plants.
  ctx.fillStyle = '#092d40'; ctx.beginPath(); ctx.moveTo(0, height); ctx.lineTo(0, height - 40);
  ctx.bezierCurveTo(width * .25, height - 85, width * .6, height + 5, width, height - 46); ctx.lineTo(width, height); ctx.fill();
  for (let i = 0; i < 12; i++) {
    const x = (i < 6 ? i * 11 : width - (i - 6) * 12), plantHeight = 35 + (i % 4) * 20, sway = Math.sin(clock * .8 + i) * 8;
    ctx.beginPath(); ctx.moveTo(x, height + 5); ctx.bezierCurveTo(x - 10, height - 20, x + sway, height - plantHeight / 2, x + sway, height - plantHeight); ctx.strokeStyle = i % 2 ? '#17515a' : '#11404d'; ctx.lineWidth = 5 + i % 3; ctx.lineCap = 'round'; ctx.stroke();
  }
}

// --- The fish (Little Fin's drawFish(), "Storybook" look, plain shape; outlines in shapes.js) ---
function paintOutline(points, radius, color) {
  ctx.fillStyle = color; ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x * radius, y * radius) : ctx.moveTo(x * radius, y * radius));
  ctx.closePath(); ctx.fill();
}
// Mix a color toward another (k = 0 keeps it, 1 is the other).
function shadeColor(hex, to, k) {
  const a = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)), b = [1, 3, 5].map(i => parseInt(to.slice(i, i + 2), 16));
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
// After a bump the fish wiggles for a moment and blinks while it is safe (fish.wiggle and fish.safe count down in seconds).
function drawFish(fish) {
  ctx.save(); ctx.translate(fish.x, fish.y);
  if (fish.wiggle > 0) ctx.rotate(Math.sin(fish.wiggle * 30) * .45 * Math.min(1, fish.wiggle * 2));
  if (fish.safe > 0) ctx.globalAlpha = .55 + .35 * Math.sin(clock * 20);
  ctx.scale(fish.facing, 1);
  const r = fish.radius, bodyHeight = .77, base = fish.color;
  const fin = shadeColor(base, '#ffffff', .32), tailColor = shadeColor(base, '#10283a', .08);
  const bodyColor = ctx.createLinearGradient(0, -r * bodyHeight, 0, r * bodyHeight);
  bodyColor.addColorStop(0, shadeColor(base, '#ffffff', .25)); bodyColor.addColorStop(.55, base); bodyColor.addColorStop(1, shadeColor(base, '#10283a', .22));
  const outlines = Shapes.fishOutlines(r, clock);
  paintOutline(outlines.tail, r, tailColor);
  // Tail lines, following the wag.
  const wag = Math.sin(clock * 12) * 2 / r;
  ctx.strokeStyle = shadeColor(base, '#ffffff', .5); ctx.lineWidth = Math.max(.8, r * .03); ctx.lineCap = 'round';
  for (const k of [-.42, 0, .42]) { ctx.beginPath(); ctx.moveTo(-.85 * r, 0); ctx.lineTo(-1.5 * r, (k * 1.25 + wag * (k < 0 ? 1 : .3)) * r); ctx.stroke(); }
  paintOutline(outlines.crest, r, fin);  // the top fin sits behind the body
  paintOutline(outlines.body, r, bodyColor);
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.15, r * bodyHeight, 0, 0, Math.PI * 2); ctx.clip();
  ctx.strokeStyle = shadeColor(base, '#10283a', .22); ctx.lineWidth = r * .045;
  ctx.beginPath(); ctx.arc(.2 * r, 0, .5 * r, -1, 1); ctx.stroke();  // gill
  ctx.fillStyle = '#ffffff40'; ctx.beginPath(); ctx.ellipse(-.2 * r, -bodyHeight * .55 * r, .55 * r, .14 * r, 0, 0, Math.PI * 2); ctx.fill();  // shine
  ctx.restore();
  // Side fin, flapping as it swims.
  ctx.save(); ctx.translate(-.05 * r, .22 * r); ctx.rotate(.5 + Math.sin(clock * 5) * .25);
  ctx.fillStyle = fin; ctx.beginPath(); ctx.ellipse(-.22 * r, 0, .3 * r, .13 * r, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#ff8fa055'; ctx.beginPath(); ctx.ellipse(.62 * r, .2 * r, .16 * r, .1 * r, 0, 0, Math.PI * 2); ctx.fill();  // rosy cheek
  ctx.fillStyle = '#fff9ed'; ctx.beginPath(); ctx.arc(r * .58, -r * .22, r * .24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#143b48'; ctx.beginPath(); ctx.ellipse(r * .65, -r * .21, r * .125, r * .14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(r * .69, -r * .29, r * .05, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#143b48aa'; ctx.lineWidth = Math.max(1, r * .045); ctx.beginPath(); ctx.arc(r * .86, r * .1, r * .13, .2, Math.PI * .8); ctx.stroke();
  ctx.restore();
}

// --- The fish as a chomping shark (new; the shape is Little Fin's drawShark()), after it eats the fossil jaw. It keeps
//     the fish's own color (Bryan, 2026-10-21): lighter on top, darker below, a pale belly. Its mouth snaps open and
//     shut; `size` is how much bigger than the fish it is. ---
function drawSharkFish(fish, size) {
  ctx.save(); ctx.translate(fish.x, fish.y); ctx.scale(fish.facing, 1);
  const r = fish.radius * size, outlines = Shapes.sharkOutlines(clock), base = fish.color;
  const finColor = shadeColor(base, '#10283a', .12), line = shadeColor(base, '#10283a', .4);
  [outlines.tail, outlines.dorsal, outlines.fin].forEach(outline => paintOutline(outline, r, finColor));
  const bodyColor = ctx.createLinearGradient(0, -r * .8, 0, r * .6);
  bodyColor.addColorStop(0, shadeColor(base, '#ffffff', .25)); bodyColor.addColorStop(.55, base); bodyColor.addColorStop(1, shadeColor(base, '#10283a', .22));
  paintOutline(outlines.body, r, bodyColor);
  ctx.save(); ctx.beginPath(); outlines.body.forEach(([px, py], i) => i ? ctx.lineTo(px * r, py * r) : ctx.moveTo(px * r, py * r)); ctx.clip();
  ctx.fillStyle = shadeColor(base, '#ffffff', .6); ctx.beginPath(); ctx.ellipse(0, r * .3, r * 1.2, r * .3, 0, 0, Math.PI * 2); ctx.fill();  // pale belly
  ctx.strokeStyle = line; ctx.lineWidth = 1.3;  // gills
  for (let i = 0; i < 3; i++) { const gx = r * (.15 + i * .13); ctx.beginPath(); ctx.moveTo(gx, -r * .25); ctx.lineTo(gx - r * .05, r * .05); ctx.stroke(); }
  // The chomping mouth: a dark wedge at the snout that opens and shuts, with teeth along both jaws.
  const open = (Math.sin(clock * 16) + 1) / 2, top = px => .1 - (px - .9) / .85 * (.06 + open * .38), bottom = px => .1 + (px - .9) / .85 * (open * .32);
  ctx.fillStyle = '#4a2420';
  ctx.beginPath(); ctx.moveTo(.9 * r, .1 * r); ctx.lineTo(1.8 * r, top(1.8) * r); ctx.lineTo(1.8 * r, bottom(1.8) * r); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff9ed';
  for (const tx of [1.02, 1.17, 1.32, 1.47]) {
    ctx.beginPath(); ctx.moveTo((tx - .06) * r, top(tx - .06) * r); ctx.lineTo((tx + .06) * r, top(tx + .06) * r); ctx.lineTo(tx * r, (top(tx) + .13) * r); ctx.fill();
    ctx.beginPath(); ctx.moveTo((tx - .06) * r, bottom(tx - .06) * r); ctx.lineTo((tx + .06) * r, bottom(tx + .06) * r); ctx.lineTo(tx * r, (bottom(tx) - .11) * r); ctx.fill();
  }
  ctx.fillStyle = '#ffffff40'; ctx.beginPath(); ctx.ellipse(-.1 * r, -.45 * r, .6 * r, .1 * r, 0, 0, Math.PI * 2); ctx.fill();  // shine, like the fish
  ctx.restore();
  // The fish's own eye and rosy cheek, with a determined brow.
  ctx.fillStyle = '#ff8fa055'; ctx.beginPath(); ctx.ellipse(r * .75, r * .02, r * .12, r * .07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff9ed'; ctx.beginPath(); ctx.arc(r * .88, -r * .24, r * .14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#143b48'; ctx.beginPath(); ctx.arc(r * .93, -r * .23, r * .075, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(r * .95, -r * .27, r * .028, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = line; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r * .7, -r * .45); ctx.lineTo(r * 1.04, -r * .33); ctx.stroke();
  ctx.restore();
}

// --- Star bubbles (Little Fin's drawStarBubble()) ---
function drawStarShape(x, y, r, color) {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, d = k % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#e09a2e'; ctx.lineWidth = 1.5; ctx.stroke();
}
// A gold star (new): a warm gold bubble with a pulsing glow and a short trail, so it stands out as it zips down.
function drawStarBubble(bubble) {
  ctx.save();
  if (bubble.gold) {
    ctx.strokeStyle = '#ffcf5a33'; ctx.lineWidth = bubble.radius * 1.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bubble.x, bubble.y - bubble.radius * .4); ctx.lineTo(bubble.x, bubble.y - bubble.radius * 2.6); ctx.stroke();
    ctx.shadowColor = '#ffc940'; ctx.shadowBlur = 16 + Math.sin(clock * 8) * 6;
  }
  ctx.beginPath(); ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
  ctx.fillStyle = bubble.gold ? '#ffd76a30' : '#ffffff12'; ctx.fill();
  ctx.strokeStyle = bubble.gold ? '#ffe08aee' : '#d8f6ffaa'; ctx.lineWidth = bubble.gold ? 3 : 2; ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.ellipse(bubble.x - bubble.radius * .35, bubble.y - bubble.radius * .45, bubble.radius * .25, bubble.radius * .12, -.5, 0, Math.PI * 2); ctx.fill();
  drawStarShape(bubble.x, bubble.y + Math.sin(clock * 3 + bubble.phase) * 1.5, bubble.radius * (bubble.gold ? .72 : .62), bubble.gold ? '#ffb92e' : '#ffd95a');
  ctx.restore();
}

// --- Falling pickups (new, 2026-10-21): a heart in a bubble (one more heart) and a bundle of TNT (clears monsters; with
//     arrows, it blasts a bar across or up-and-down the screen instead of a circle) ---
function drawHeartShape(x, y, size, color) {
  ctx.beginPath(); ctx.moveTo(x, y + size * .9);
  ctx.bezierCurveTo(x - size * 1.3, y + size * .05, x - size * .75, y - size * .95, x, y - size * .3);
  ctx.bezierCurveTo(x + size * .75, y - size * .95, x + size * 1.3, y + size * .05, x, y + size * .9);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#c94a68'; ctx.lineWidth = 1.5; ctx.stroke();
}
function drawPickup(pickup) {
  const {x, radius: r} = pickup, y = pickup.y + Math.sin(clock * 3 + pickup.phase) * 1.5;
  ctx.save();
  if (pickup.kind === 'heart') {
    ctx.shadowColor = '#ff8fa0'; ctx.shadowBlur = 12 + Math.sin(clock * 4) * 4;
    ctx.beginPath(); ctx.arc(x, pickup.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff8fa022'; ctx.fill(); ctx.strokeStyle = '#ffc2cdcc'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.shadowBlur = 0;
    const beat = 1 + Math.max(0, Math.sin(clock * 6)) * .08;  // a little heartbeat
    drawHeartShape(x, y, r * .64 * beat, '#ff7d96');
    ctx.fillStyle = '#ffffff70'; ctx.beginPath(); ctx.ellipse(x - r * .26, y - r * .22, r * .1, r * .06, -.6, 0, Math.PI * 2); ctx.fill();
  } else if (pickup.kind === 'rainbow') {
    // The rainbow bubble pickup (new): a clear bubble with a turning rainbow ring and a twinkling star inside.
    ctx.translate(x, y);
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 12 + Math.sin(clock * 6) * 5;
    ctx.fillStyle = '#ffffff1c'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    drawRainbowRing(0, 0, r, 4, clock * 2);
    ctx.fillStyle = '#ffffff66'; ctx.beginPath(); ctx.ellipse(-r * .35, -r * .45, r * .25, r * .12, -.5, 0, Math.PI * 2); ctx.fill();
    drawStarShape(0, 0, r * .42 * (1 + Math.sin(clock * 8) * .12), '#fff6c8');
  } else if (pickup.kind === 'jaw') {
    // The fossil shark jaw, drawn after Bryan's photo of a real one (2026-10-21): seen from the front, an arched upper
    // jaw with a row of teeth pointing down, a wide lower jaw with flared corners and teeth pointing up, the sea
    // showing through the open mouth, all in pale greenish bone. It wobbles as it falls, with a warm glow.
    ctx.translate(x, y); ctx.rotate(Math.sin(clock * 2 + pickup.phase) * .12);
    const u = r * .95, P = (px, py) => [px * u, py * u];
    const bez = (a, b, c, d, t) => [0, 1].map(i => (1 - t) ** 3 * a[i] + 3 * (1 - t) ** 2 * t * b[i] + 3 * (1 - t) * t * t * c[i] + t ** 3 * d[i]);
    // The inside edges (where the teeth sit), as curves: the upper arch's two halves and the lower jaw's top edge.
    const archLeft = [[-.78, .3], [-.82, -.4], [-.35, -.74], [0, -.74]], archRight = [[0, -.74], [.35, -.74], [.82, -.4], [.78, .3]];
    const lowLeft = [[-1, .34], [-.6, .56], [-.3, .58], [0, .55]], lowRight = [[0, .55], [.3, .58], [.6, .56], [1, .34]];
    const curve = (pts, first) => { if (first) ctx.moveTo(...P(...pts[0])); ctx.bezierCurveTo(...P(...pts[1]), ...P(...pts[2]), ...P(...pts[3])); };
    // The open mouth, darkened a little so the jaw stands out.
    ctx.beginPath(); curve(archLeft, true); curve(archRight); ctx.lineTo(...P(1, .34)); curve([...lowRight].reverse()); curve([...lowLeft].reverse());
    ctx.closePath(); ctx.fillStyle = '#081420a0'; ctx.fill();
    const bone = ctx.createLinearGradient(0, -u, 0, u);
    bone.addColorStop(0, '#eeecd0'); bone.addColorStop(1, '#c3bf93');
    ctx.shadowColor = '#ffe9a8'; ctx.shadowBlur = 14 + Math.sin(clock * 5) * 5;
    ctx.fillStyle = bone; ctx.strokeStyle = '#7f7b55'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    // Upper jaw: an arch, thick at the top and narrowing down the sides.
    ctx.beginPath(); ctx.moveTo(...P(-.95, .4));
    ctx.bezierCurveTo(...P(-.99, -.52), ...P(-.44, -.9), ...P(0, -.9)); ctx.bezierCurveTo(...P(.44, -.9), ...P(.99, -.52), ...P(.95, .4));
    ctx.lineTo(...P(.78, .3)); curve([...archRight].reverse()); curve([...archLeft].reverse()); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.stroke();
    // Lower jaw: wide, with flared wings at both ends and a small notch in the middle of the chin.
    ctx.beginPath(); curve(lowLeft, true); curve(lowRight);
    ctx.lineTo(...P(1.32, .38)); ctx.bezierCurveTo(...P(1.4, .64), ...P(1.3, .92), ...P(1.05, .93));
    ctx.bezierCurveTo(...P(.62, .8), ...P(.26, .75), ...P(.08, .73)); ctx.lineTo(...P(0, .67)); ctx.lineTo(...P(-.08, .73));
    ctx.bezierCurveTo(...P(-.26, .75), ...P(-.62, .8), ...P(-1.05, .93)); ctx.bezierCurveTo(...P(-1.3, .92), ...P(-1.4, .64), ...P(-1.32, .38));
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Teeth: triangles along the inside edges, pointing into the mouth; bigger in the front, smaller toward the corners.
    const tooth = (pts, t, size, toward) => {
      const [bx, by] = bez(...pts, t), [ax, ay] = bez(...pts, Math.max(0, t - .06)), [cx, cy] = bez(...pts, Math.min(1, t + .06));
      const dx = toward[0] - bx, dy = toward[1] - by, d = Math.hypot(dx, dy);
      ctx.beginPath(); ctx.moveTo(...P(ax, ay)); ctx.lineTo(...P(cx, cy)); ctx.lineTo(...P(bx + dx / d * size, by + dy / d * size)); ctx.closePath();
      ctx.fill(); ctx.stroke();
    };
    ctx.fillStyle = '#fbf8ea'; ctx.strokeStyle = '#a39f78'; ctx.lineWidth = 1;
    for (const t of [.12, .27, .42, .57, .72, .87]) {
      const front = .14 + .1 * t;  // archLeft runs from the corner (t = 0) to the front (t = 1)
      tooth(archLeft, t, front, [0, .1]); tooth(archRight, 1 - t, front, [0, .1]);
      tooth(lowLeft, t, .07 + .05 * t, [0, -.3]); tooth(lowRight, 1 - t, .07 + .05 * t, [0, -.3]);
    }
  } else {
    // The bomb (Bryan, 2026-10-21: a bundle of TNT, so it doesn't look like the sea mines): three red sticks tied with
    // a dark band stamped "TNT", paper caps on top, and a fizzing fuse. It wobbles as it falls, with a warm glow.
    ctx.translate(x, y); ctx.rotate(Math.sin(clock * 2.5 + pickup.phase) * .2);
    const stickW = r * .5, stickH = r * 1.55;
    ctx.shadowColor = '#ffb23e'; ctx.shadowBlur = 14 + Math.sin(clock * 8) * 5;
    for (const k of [-1, 1, 0]) {  // the middle stick last, so it sits in front
      const sx = k * stickW * .82, sy = k === 0 ? -r * .08 : 0;
      const stick = ctx.createLinearGradient(sx - stickW / 2, 0, sx + stickW / 2, 0);
      stick.addColorStop(0, '#9e1d1d'); stick.addColorStop(.4, '#e5413a'); stick.addColorStop(1, '#a8201e');
      ctx.fillStyle = stick; ctx.beginPath(); ctx.roundRect(sx - stickW / 2, sy - stickH / 2, stickW, stickH, stickW * .25); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f2e3c4'; ctx.beginPath(); ctx.ellipse(sx, sy - stickH / 2 + 1, stickW / 2 - 1, stickW * .16, 0, 0, Math.PI * 2); ctx.fill();  // paper cap
    }
    // The band round the middle, with "TNT" on it.
    ctx.fillStyle = '#2b2b33'; ctx.fillRect(-stickW * 1.38, -r * .2, stickW * 2.76, r * .42);
    ctx.fillStyle = '#ffd34d'; ctx.font = `bold ${Math.round(r * .36)}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TNT', 0, r * .02);
    // The fuse from the middle stick, curling up, with a fizzing spark.
    ctx.strokeStyle = '#c9a26b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const top = -r * .08 - stickH / 2, fuseEnd = [r * .55, top - r * .55];
    ctx.beginPath(); ctx.moveTo(0, top); ctx.quadraticCurveTo(-r * .1, top - r * .5, fuseEnd[0], fuseEnd[1]); ctx.stroke();
    const flicker = 1 + Math.sin(clock * 30) * .25;
    ctx.shadowColor = '#ffb23e'; ctx.shadowBlur = 12;
    drawStarShape(fuseEnd[0], fuseEnd[1], r * .32 * flicker, '#ffdf5e');
    ctx.shadowBlur = 0;
    // The bar TNTs (Bryan, 2026-10-21): bright arrows pointing the way the blast goes, left and right or up and down.
    if (pickup.kind === 'bombH' || pickup.kind === 'bombV') {
      const pulse = 1 + Math.sin(clock * 9) * .08, reach = r * 1.05 * pulse;
      const dirs = pickup.kind === 'bombH' ? [[1, 0], [-1, 0]] : [[0, -1], [0, 1]];
      ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      for (const [dx, dy] of dirs) {
        ctx.save(); ctx.translate(dx * reach, dy * reach * (dy < 0 ? 1.35 : 1.1)); ctx.rotate(Math.atan2(dy, dx));
        const L = r * .62, W = r * .2, H = r * .42;  // shaft length, shaft half-width, head half-height
        ctx.beginPath(); ctx.moveTo(-L * .2, -W); ctx.lineTo(L * .45, -W); ctx.lineTo(L * .45, -H); ctx.lineTo(L, 0);
        ctx.lineTo(L * .45, H); ctx.lineTo(L * .45, W); ctx.lineTo(-L * .2, W); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
  }
  ctx.restore();
}
// A ring of rainbow colors (red to violet all the way round), turned by `spin` radians.
const RAINBOW = ['#ff5c5c', '#ffa94d', '#ffe14d', '#6ee07a', '#4dc3ff', '#8f7bff', '#e07bff'];
function drawRainbowRing(x, y, r, lineWidth, spin) {
  ctx.save(); ctx.lineWidth = lineWidth; ctx.lineCap = 'butt';
  RAINBOW.forEach((color, i) => {
    const a = spin + i / RAINBOW.length * Math.PI * 2;
    ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(x, y, r, a, a + Math.PI * 2 / RAINBOW.length + .02); ctx.stroke();
  });
  ctx.restore();
}
// The rainbow bubble around the fish while it's protected: a soft clear bubble with a turning rainbow rim and a shine.
// In its last moments (`timeLeft` under RAINBOW_WARN) it flickers, so you know it's about to pop.
function drawRainbowShield(fish, radius, timeLeft) {
  if (timeLeft < StarRules.RAINBOW_WARN && Math.sin(timeLeft * 30) < 0) return;
  ctx.save();
  const glow = ctx.createRadialGradient(fish.x, fish.y, radius * .6, fish.x, fish.y, radius);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0)'); glow.addColorStop(1, 'rgba(200, 235, 255, .22)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(fish.x, fish.y, radius, 0, Math.PI * 2); ctx.fill();
  drawRainbowRing(fish.x, fish.y, radius, 4, clock * 1.5);
  ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.ellipse(fish.x - radius * .4, fish.y - radius * .5, radius * .25, radius * .1, -.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// A bright ring that spreads out to blast.radius and fades (blast.age counts up to .5 s): the bomb's blast, and the
// flash when the fish turns into a shark and back.
function drawBlasts(blasts) {
  for (const blast of blasts) {
    if (blast.axis) { drawBarBlast(blast); continue; }
    const t = Math.min(1, blast.age / .5), radius = blast.radius;
    ctx.save(); ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#fff1b8'; ctx.globalAlpha = (1 - t) * .25; ctx.beginPath(); ctx.arc(blast.x, blast.y, radius * t, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1 - t; ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 6 * (1 - t) + 1;
    ctx.beginPath(); ctx.arc(blast.x, blast.y, radius * (.15 + .85 * Math.sqrt(t)), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

// --- The red flash round the edges of the screen when the fish loses a heart (`t` seconds since the hit). ---
function drawHurtFlash(t) {
  const strength = Math.max(0, 1 - t / .7);
  if (!strength) return;
  const edge = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .25, width / 2, height / 2, Math.max(width, height) * .75);
  edge.addColorStop(0, 'rgba(255, 40, 60, 0)'); edge.addColorStop(1, `rgba(255, 40, 60, ${.55 * strength})`);
  ctx.save(); ctx.fillStyle = edge; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = `rgba(255, 60, 80, ${.12 * strength * strength})`; ctx.fillRect(0, 0, width, height);  // a quick all-over blush
  ctx.restore();
}

// A bar blast (the arrow TNTs): a bright stripe shoots out from the catch point to both edges of the screen, then fades.
// `blast.axis` is 'h' or 'v'; `blast.half` is half the bar's thickness.
function drawBarBlast(blast) {
  const t = Math.min(1, blast.age / .5), grow = Math.min(1, blast.age / .12), fade = 1 - t, h = blast.axis === 'h';
  const length = (h ? width : height) * grow, along = h ? blast.x : blast.y;
  ctx.save();
  const start = Math.max(0, along - length), end = Math.min(h ? width : height, along + length);
  // The wide soft glow of the whole bar...
  ctx.fillStyle = `rgba(255, 225, 120, ${.35 * fade})`;
  if (h) ctx.fillRect(start, blast.y - blast.half, end - start, blast.half * 2); else ctx.fillRect(blast.x - blast.half, start, blast.half * 2, end - start);
  // ...and a hot bright core.
  ctx.fillStyle = `rgba(255, 250, 220, ${.9 * fade})`; const core = blast.half * .25 * (1 + fade);
  if (h) ctx.fillRect(start, blast.y - core, end - start, core * 2); else ctx.fillRect(blast.x - core, start, core * 2, end - start);
  ctx.restore();
}

// --- Floating points (new): "+20" rises and fades where a star was caught; "Combo lost" where one slipped by. ---
function drawFloaters(floaters) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const f of floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.font = `bold ${f.size}px -apple-system, system-ui, sans-serif`;
    ctx.lineWidth = 4; ctx.strokeStyle = '#06273eaa'; ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
}

// --- Jellyfish (Little Fin's drawJellyfish()). Homing ones are coral instead of lilac, with a soft glow and eyes that
//     look toward the fish, so they stand out at a glance. ---
const JELLY_COLORS = {plain: {tentacles: '#d7a6ef', top: '#edc1fa', bottom: '#9879cf', eyes: '#493a6a'},
  homing: {tentacles: '#ffb199', top: '#ffd0b8', bottom: '#ef6f6c', eyes: '#5a2333'}};
function drawJellyfish(jelly, fish) {
  const colors = jelly.homing ? JELLY_COLORS.homing : JELLY_COLORS.plain, r = jelly.radius;
  ctx.save(); ctx.translate(jelly.x, jelly.y);
  if (jelly.homing) { ctx.shadowColor = '#ff8a7a'; ctx.shadowBlur = 14 + Math.sin(clock * 5) * 5; }
  const outlines = Shapes.jellyfishOutlines(jelly.age);
  outlines.tentacles.forEach(outline => paintOutline(outline, r, colors.tentacles));
  const gradient = ctx.createLinearGradient(0, -r, 0, r * .15);
  gradient.addColorStop(0, colors.top); gradient.addColorStop(1, colors.bottom);
  paintOutline(outlines.bell, r, gradient);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff5ff80'; ctx.beginPath(); ctx.ellipse(-r * .25, -r * .39, r * .33, r * .13, -.35, 0, Math.PI * 2); ctx.fill();
  const look = jelly.homing ? Math.max(-1, Math.min(1, (fish.x - jelly.x) / 80)) * r * .05 : 0;
  ctx.fillStyle = colors.eyes;
  for (const x of [-.23, .23]) { ctx.beginPath(); ctx.arc(x * r + look, -r * .15, r * .07, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// --- Pufferfish (new for stage 5; the look is Little Fin's puffer): a round sandy body ringed with spikes, spots and a
//     big eye. While it shakes (the warning) it jitters and flushes red; puffed up it's twice the size with long spikes
//     and an angry brow. `swell` comes from rules.pufferSwell. It faces the fish. ---
function drawPuffer(puffer, fish, swell) {
  const r = puffer.radius, shaking = puffer.state === 'shake', puffed = (swell - 1) / (StarRules.PUFF_SIZE - 1);
  ctx.save();
  ctx.translate(puffer.x + (shaking ? Math.sin(puffer.t * 70) * 3.5 * sizeScale : 0), puffer.y);
  ctx.scale(fish.x >= puffer.x ? 1 : -1, 1);
  if (shaking) ctx.rotate(Math.sin(puffer.t * 55) * .12);
  const flush = shaking ? Math.min(1, puffer.t / StarRules.PUFF_SHAKE) : puffed;
  // Resting it's a warm orange-red (Bryan, 2026-10-21: the color a puffed one used to be); shaking and puffed up it
  // turns a deep red.
  const bodyColor = shadeColor('#f2825c', '#e0322e', flush * .85), spikeColor = shadeColor('#c05a3a', '#9e1f1f', flush * .8);
  // Spikes all around: short while drifting, long when puffed.
  const spikeOut = swell * (1.12 + .3 * puffed), spikes = 14;
  ctx.fillStyle = spikeColor;
  for (let i = 0; i < spikes; i++) {
    const a = i / spikes * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - .14) * swell * .9 * r, Math.sin(a - .14) * swell * .82 * r);
    ctx.lineTo(Math.cos(a) * spikeOut * r, Math.sin(a) * spikeOut * .95 * r);
    ctx.lineTo(Math.cos(a + .14) * swell * .9 * r, Math.sin(a + .14) * swell * .82 * r);
    ctx.fill();
  }
  ctx.fillStyle = spikeColor; ctx.beginPath(); ctx.moveTo(-.8 * swell * r, 0); ctx.lineTo(-1.45 * swell * r, -.38 * r); ctx.lineTo(-1.45 * swell * r, .38 * r); ctx.fill();  // tail
  const body = ctx.createRadialGradient(-.25 * swell * r, -.3 * swell * r, r * .1, 0, 0, swell * r);
  body.addColorStop(0, shadeColor(bodyColor, '#ffffff', .35)); body.addColorStop(1, bodyColor);
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, swell * r, swell * .9 * r, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff3dc88'; ctx.beginPath(); ctx.ellipse(0, swell * .35 * r, swell * .7 * r, swell * .38 * r, 0, 0, Math.PI * 2); ctx.fill();  // pale belly
  ctx.fillStyle = shadeColor('#b0593a', '#7a1414', flush * .7);
  for (const [sx, sy] of [[-.3, -.25], [.05, -.5], [-.55, .1], [-.15, .05]]) { ctx.beginPath(); ctx.arc(sx * swell * r, sy * swell * r, r * .1, 0, Math.PI * 2); ctx.fill(); }
  // The eye (and an angry brow when puffed or about to puff), and a little round mouth.
  const ex = .48 * swell * r, ey = -.2 * swell * r;
  ctx.fillStyle = '#fff7e0'; ctx.beginPath(); ctx.arc(ex, ey, r * .22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#263b50'; ctx.beginPath(); ctx.arc(ex + r * .05, ey, r * .1, 0, Math.PI * 2); ctx.fill();
  if (shaking || puffed > 0) { ctx.strokeStyle = '#5a2a1f'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex - r * .25, ey - r * .32); ctx.lineTo(ex + r * .2, ey - r * .2); ctx.stroke(); }
  ctx.fillStyle = '#7a3f2a'; ctx.beginPath(); ctx.ellipse(swell * .88 * r, swell * .18 * r, r * .09, r * .07 + puffed * r * .05, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// --- Piranhas (Little Fin's drawPiranha()): purple with an orange belly, sharp teeth and a frown. `direction` is +1
//     swimming right, -1 swimming left. ---
function drawPiranha(piranha) {
  const r = piranha.radius;
  ctx.save(); ctx.translate(piranha.x, piranha.y); ctx.scale(piranha.direction, 1);
  const outlines = Shapes.piranhaOutlines(piranha.age, r);
  paintOutline(outlines.tail, r, '#b674ad'); paintOutline(outlines.fin, r, '#b674ad');
  paintOutline(outlines.body, r, '#88619b'); paintOutline(outlines.belly, r, '#ef907e');
  ctx.fillStyle = '#fff1b4'; ctx.beginPath(); ctx.arc(r * .5, -r * .28, r * .22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#263448'; ctx.beginPath(); ctx.arc(r * .57, -r * .25, r * .095, 0, Math.PI * 2); ctx.fill();
  paintOutline(outlines.brow, r, '#463654');
  ctx.fillStyle = '#482e48'; ctx.beginPath(); ctx.ellipse(r * .69, r * .23, r * .45, r * .27, -.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff9ea';
  for (let i = 0; i < 3; i++) { const tx = r * (.38 + i * .23); ctx.beginPath(); ctx.moveTo(tx, r * .02); ctx.lineTo(tx + r * .17, r * .02); ctx.lineTo(tx + r * .085, r * .23); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// The warning before a school swims in: flashing arrows on that side, one per piranha, so the gap shows as a gap.
function drawSchoolWarning(school) {
  const edgeX = school.direction > 0 ? 14 : width - 14, blink = .55 + .45 * Math.sin(clock * 14);
  ctx.save(); ctx.globalAlpha = blink; ctx.fillStyle = '#ff8a7a'; ctx.strokeStyle = '#ffd0c4'; ctx.lineWidth = 1.5;
  for (const slot of school.slots) {
    if (slot.gap) continue;
    const s = 9 * sizeScale;
    ctx.beginPath(); ctx.moveTo(edgeX + school.direction * s * 1.4, slot.y); ctx.lineTo(edgeX, slot.y - s); ctx.lineTo(edgeX, slot.y + s); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// --- Sea mines (new for stage 10): a round dark-metal ball with stubby spikes, a band of rivets, a short broken chain
//     swaying below, and a red light on top that blinks faster when the fish is near (`near` is 0 to 1). ---
function drawMine(mine, near) {
  const r = mine.radius, sway = Math.sin(mine.age * 1.6 + mine.phase) * .25;
  ctx.save(); ctx.translate(mine.x, mine.y);
  // The chain: a few links hanging from the bottom, swinging gently.
  ctx.strokeStyle = '#7d8a94'; ctx.lineWidth = Math.max(1.5, r * .1);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 2 + sway * (i + 1) * .35, d = r * (1.15 + i * .42);
    ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(a + (i % 2 ? Math.PI / 2 : 0));
    ctx.beginPath(); ctx.ellipse(0, 0, r * .2, r * .12, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  ctx.rotate(Math.sin(mine.age * .9 + mine.phase) * .12);
  // Spikes: short posts with rounded, lighter tips, all around.
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    ctx.strokeStyle = '#3c4a55'; ctx.lineWidth = r * .24; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8); ctx.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45); ctx.stroke();
    ctx.fillStyle = '#9aa8b3'; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.47, Math.sin(a) * r * 1.47, r * .15, 0, Math.PI * 2); ctx.fill();
  }
  const shell = ctx.createRadialGradient(-r * .35, -r * .35, r * .1, 0, 0, r);
  shell.addColorStop(0, '#7a8b97'); shell.addColorStop(1, '#2b3640');
  ctx.fillStyle = shell; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 1.5; ctx.stroke();
  // A band of rivets around the middle, and a shine.
  ctx.strokeStyle = '#4c5b66'; ctx.lineWidth = r * .12; ctx.beginPath(); ctx.ellipse(0, 0, r * .98, r * .3, 0, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = '#a9b6c0';
  for (let i = 0; i < 5; i++) { const a = (i + .5) / 5 * Math.PI; ctx.beginPath(); ctx.arc(Math.cos(a) * r * .92, Math.sin(a) * r * .28, r * .06, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#ffffff40'; ctx.beginPath(); ctx.ellipse(-r * .35, -r * .45, r * .3, r * .14, -.6, 0, Math.PI * 2); ctx.fill();
  // The red light on top: a slow blink, faster and brighter when the fish is close.
  const on = Math.sin(clock * (3 + near * 14) + mine.phase) > 0;
  ctx.fillStyle = '#2b3640'; ctx.fillRect(-r * .16, -r * 1.08, r * .32, r * .2);
  ctx.fillStyle = on ? '#ff4d4d' : '#7a2a2a';
  if (on) { ctx.shadowColor = '#ff4d4d'; ctx.shadowBlur = 8 + near * 10; }
  ctx.beginPath(); ctx.arc(0, -r * 1.1, r * .16, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// --- Currents (new for stage 10): a band across the screen with flowing streaks and specks. Faint and thin while it's
//     about to start (current.state 'warn'), bright while it flows, fading at the end. `strength` is 0 to 1. ---
function drawCurrent(current, strength) {
  const half = current.height / 2, warn = current.state === 'warn', glow = warn ? .35 + .25 * Math.sin(clock * 10) : strength;
  ctx.save();
  const band = ctx.createLinearGradient(0, current.y - half, 0, current.y + half);
  band.addColorStop(0, '#9fe8ff00'); band.addColorStop(.5, `rgba(159, 232, 255, ${.12 * glow})`); band.addColorStop(1, '#9fe8ff00');
  ctx.fillStyle = band; ctx.fillRect(0, current.y - half, width, current.height);
  // Streaks: rows of dashes sliding the way the water flows.
  ctx.strokeStyle = `rgba(220, 248, 255, ${.55 * glow})`; ctx.lineCap = 'round';
  for (let row = 0; row < 5; row++) {
    const y = current.y - half * .75 + row * half * .375, speed = 220 + row * 30, length = warn ? 14 : 34;
    ctx.lineWidth = warn ? 1.5 : 2.5;
    for (let k = -1; k < width / 90 + 1; k++) {
      const x = ((k * 90 + row * 37 + clock * speed * current.direction) % (width + 90) + width + 90) % (width + 90) - 45;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - current.direction * length, y + Math.sin(x * .03 + row) * 2); ctx.stroke();
    }
  }
  // An arrow at each end pointing the way it pushes.
  ctx.fillStyle = `rgba(220, 248, 255, ${.7 * glow})`;
  for (const ax of [28, width - 28]) {
    const d = current.direction * 9;
    ctx.beginPath(); ctx.moveTo(ax + d, current.y); ctx.lineTo(ax - d, current.y - 9); ctx.lineTo(ax - d, current.y + 9); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// --- Patrolling sharks (new for stage 15; Little Fin's blue-grey shark): before it swims in, a big arrow flashes on
//     the edge at its lane. While turning around at a wall it squashes through a flip, so you can see it coming back. ---
function drawPatrolShark(shark) {
  if (shark.state === 'warn') {
    const edgeX = shark.direction > 0 ? 18 : width - 18, s = 15 * sizeScale, blink = .5 + .5 * Math.sin(clock * 14);
    ctx.save(); ctx.globalAlpha = blink; ctx.fillStyle = '#ff6f61'; ctx.strokeStyle = '#ffd0c4'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(edgeX + shark.direction * s * 1.5, shark.y); ctx.lineTo(edgeX, shark.y - s); ctx.lineTo(edgeX, shark.y + s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = blink * .35; ctx.setLineDash([8, 10]); ctx.strokeStyle = '#ffb3a8';  // a faint dashed line along its lane
    ctx.beginPath(); ctx.moveTo(edgeX, shark.y); ctx.lineTo(shark.direction > 0 ? width : 0, shark.y); ctx.stroke();
    ctx.restore();
    return;
  }
  const r = shark.radius, outlines = Shapes.sharkOutlines(shark.age);
  // Turning: the shark's width goes from one way, through zero, to the other.
  // (never thinner than a third, so it stays visible mid-flip)
  const flip = Math.cos(Math.min(1, shark.t / StarRules.SHARK_TURN) * Math.PI);
  const facing = shark.state === 'turn' ? shark.direction * Math.sign(flip || 1) * Math.max(.35, Math.abs(flip)) : shark.direction;
  ctx.save(); ctx.translate(shark.x, shark.y); ctx.scale(facing, 1);
  [outlines.tail, outlines.dorsal, outlines.fin].forEach(outline => paintOutline(outline, r, '#648ca7'));
  paintOutline(outlines.body, r, '#84adc3');
  ctx.save(); ctx.beginPath(); outlines.body.forEach(([px, py], i) => i ? ctx.lineTo(px * r, py * r) : ctx.moveTo(px * r, py * r)); ctx.clip();
  ctx.fillStyle = '#d9e9e9'; ctx.beginPath(); ctx.ellipse(0, r * .3, r * 1.2, r * .3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff6db'; ctx.beginPath(); ctx.arc(r * .88, -r * .22, r * .12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#183849'; ctx.beginPath(); ctx.arc(r * .92, -r * .21, r * .055, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#304e67'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r * .7, -r * .43); ctx.lineTo(r * 1.03, -r * .3); ctx.stroke();
  ctx.fillStyle = '#294356'; ctx.beginPath(); ctx.ellipse(r * 1.08, r * .14, r * .38, r * .13, -.08, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 3; i++) { const x = .83 + i * .18; paintOutline([[x, .04], [x + .14, .04], [x + .07, .19]], r, '#fff9ed'); }
  ctx.strokeStyle = '#52758c'; ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) { const x = r * (.15 + i * .13); ctx.beginPath(); ctx.moveTo(x, -r * .25); ctx.lineTo(x - r * .05, r * .05); ctx.stroke(); }
  ctx.restore(); ctx.restore();
}

// --- Electric eels (new): before one comes in, a yellow spark crackles on the wall where it will appear. Then a long
//     yellow-green body twists along its path (pieces from rules.eelSegments), with dark spots, a head with an eye and
//     a grin, and little electric crackles flickering around it. ---
function drawEel(eel) {
  const pieces = StarRules.eelSegments(eel), r = StarRules.EEL_THICK * eel.scale;
  if (eel.state === 'warn') {
    const p = pieces[0], edgeX = eel.direction > 0 ? 10 : width - 10;
    ctx.save(); ctx.strokeStyle = '#fff36b'; ctx.shadowColor = '#fff36b'; ctx.shadowBlur = 12; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    for (let k = 0; k < 3; k++) {  // a few jagged sparks
      if (Math.sin(clock * 40 + k * 2) < -.2) continue;
      ctx.beginPath(); let x = edgeX, y = p.y - 18 + k * 18;
      ctx.moveTo(x, y);
      for (let j = 0; j < 4; j++) { x += eel.direction * (5 + Math.random() * 6); y += (Math.random() - .5) * 14; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.fillStyle = '#fff36b'; ctx.globalAlpha = .5 + .5 * Math.sin(clock * 20); ctx.beginPath(); ctx.arc(edgeX, p.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); pieces.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); };
  // The body: a dark outline, then the yellow-green, then a lighter belly stripe, thinner toward the tail.
  ctx.strokeStyle = '#3d4a1c'; ctx.lineWidth = r * 2.3; path(); ctx.stroke();
  ctx.strokeStyle = '#c7d64a'; ctx.lineWidth = r * 1.9; path(); ctx.stroke();
  ctx.strokeStyle = '#eef29a'; ctx.lineWidth = r * .6; path(); ctx.stroke();
  const tail = pieces.at(-1), beforeTail = pieces.at(-2);  // a little tail fin
  ctx.fillStyle = '#9fb53a'; ctx.beginPath(); ctx.moveTo(tail.x, tail.y);
  const ta = Math.atan2(tail.y - beforeTail.y, tail.x - beforeTail.x);
  ctx.lineTo(tail.x + Math.cos(ta + .6) * r * 1.8, tail.y + Math.sin(ta + .6) * r * 1.8); ctx.lineTo(tail.x + Math.cos(ta - .6) * r * 1.8, tail.y + Math.sin(ta - .6) * r * 1.8); ctx.fill();
  ctx.fillStyle = '#5d6e22';  // spots
  pieces.forEach((p, i) => { if (i > 1 && i % 2 === 0) { ctx.beginPath(); ctx.arc(p.x, p.y - r * .35, r * .28, 0, Math.PI * 2); ctx.fill(); } });
  // The head: a bigger rounded end with an eye and a grin, pointing the way it's going.
  const head = pieces[0], neck = pieces[1], a = Math.atan2(head.y - neck.y, head.x - neck.x);
  ctx.translate(head.x, head.y); ctx.rotate(a);
  ctx.fillStyle = '#c7d64a'; ctx.strokeStyle = '#3d4a1c'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(r * .3, 0, r * 1.45, r * 1.05, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(r * .7, -r * .4, r * .38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1e2a10'; ctx.beginPath(); ctx.arc(r * .82, -r * .4, r * .18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3d4a1c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(r * 1, r * .25, r * .45, .2, 1.6); ctx.stroke();
  ctx.restore();
  // Electric crackles: short bright zigzags that flicker along the body.
  ctx.save(); ctx.strokeStyle = '#fff7a0'; ctx.shadowColor = '#fff36b'; ctx.shadowBlur = 8; ctx.lineWidth = 1.6;
  for (let i = 1; i < pieces.length; i += 3) {
    if (Math.sin(clock * 30 + i * 1.7 + eel.phase) < .3) continue;
    const p = pieces[i], side = i % 2 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(p.x, p.y + side * r);
    ctx.lineTo(p.x + 4, p.y + side * (r + 6)); ctx.lineTo(p.x - 3, p.y + side * (r + 9)); ctx.lineTo(p.x + 5, p.y + side * (r + 14)); ctx.stroke();
  }
  ctx.restore();
}

// --- The squid on the sea floor (Little Fin's drawSquid()). Each strike leg glows with a dotted line and a "!" first
//     (warn), then shoots up. `floor` is the sea floor's y, `tip` how high a raised leg reaches. ---
function drawSquid(strikes, floor, tip) {
  const cx = width / 2, legColor = '#e58fb0', legs = 8;
  ctx.save();
  for (let i = 0; i < legs; i++) {  // the legs lying flat along the bottom
    const side = i < legs / 2 ? -1 : 1, k = i % (legs / 2), reach = width * (.18 + k * .1);
    const tipX = cx + side * reach, sway = Math.sin(clock * 1.6 + i) * 3;
    const warned = strikes.some(strike => strike.stage === 'warn' && Math.abs(strike.x - tipX) < width * .06);
    ctx.strokeStyle = warned ? '#ffe0a5' : legColor; ctx.lineWidth = 9 - k; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + side * 12, floor - 4); ctx.quadraticCurveTo(cx + side * reach * .55, floor + 6 + sway, tipX, floor - 2 + sway); ctx.stroke();
  }
  for (const strike of strikes) {
    if (strike.stage === 'wait') continue;
    if (strike.stage === 'warn') {
      ctx.strokeStyle = '#ffe0a5ee'; ctx.lineWidth = 3.5; ctx.setLineDash([7, 8]);
      ctx.beginPath(); ctx.moveTo(strike.x, floor); ctx.lineTo(strike.x, tip); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ffe5ad'; ctx.font = 'bold 18px -apple-system,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', strike.x, tip - 8);
      ctx.strokeStyle = '#ffe0a5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(strike.x, floor - 6, 12 + Math.sin(clock * 12) * 3, 0, Math.PI * 2); ctx.stroke();
    } else {
      // The raised leg: wavy, with a curl and little suckers.
      const top = floor - (floor - tip) * strike.reach, sway = Math.sin(clock * 6) * 6;
      ctx.strokeStyle = legColor; ctx.lineWidth = 14 * sizeScale; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(strike.x, floor); ctx.bezierCurveTo(strike.x - 10 + sway, floor - (floor - top) * .35, strike.x + 10 - sway, floor - (floor - top) * .7, strike.x, top); ctx.stroke();
      ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(strike.x + 9, top, 9, Math.PI, Math.PI * 2.6); ctx.stroke();
      ctx.fillStyle = '#f7c6d6';
      for (let y = floor - 20; y > top + 16; y -= 22) { ctx.beginPath(); ctx.arc(strike.x + 3, y, 2.6, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  // Mantle, fins and eyes (a bit bigger on iPad, like everything in play).
  ctx.translate(cx, floor); ctx.scale(sizeScale, sizeScale); ctx.translate(-cx, -floor);
  ctx.fillStyle = '#d4789c';
  ctx.beginPath(); ctx.moveTo(cx - 22, floor - 52); ctx.lineTo(cx - 40, floor - 38); ctx.lineTo(cx - 20, floor - 34); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 22, floor - 52); ctx.lineTo(cx + 40, floor - 38); ctx.lineTo(cx + 20, floor - 34); ctx.fill();
  ctx.fillStyle = '#e58fb0';
  ctx.beginPath(); ctx.moveTo(cx - 20, floor - 4); ctx.bezierCurveTo(cx - 26, floor - 40, cx - 12, floor - 70, cx, floor - 74); ctx.bezierCurveTo(cx + 12, floor - 70, cx + 26, floor - 40, cx + 20, floor - 4); ctx.closePath(); ctx.fill();
  for (const x of [-8, 8]) { ctx.fillStyle = '#fff7e0'; ctx.beginPath(); ctx.arc(cx + x, floor - 18, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#263b50'; ctx.beginPath(); ctx.arc(cx + x + 1, floor - 18, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// --- Sparkles when a star is caught (Little Fin's sparkleBurst() and drawParticles()) ---
const MAX_SPARKLES = 220;  // on screen at once, at most (a big TNT blast used to make 400+, which lagged on a phone)
function sparkleBurst(particles, x, y, sparkleColors = ['#fff7cf', '#ffe18c', '#ffffff']) {
  if (particles.length > MAX_SPARKLES - 14) particles.splice(0, particles.length - (MAX_SPARKLES - 14));  // the oldest go first
  for (let i = 0; i < 14; i++) {
    const angle = i / 14 * Math.PI * 2 + (Math.random() - .5) * .2, speed = 45 + Math.random() * 65;
    particles.push({x: x + Math.cos(angle) * 12, y: y + Math.sin(angle) * 12, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 12,
      life: .9, maxLife: .9, age: 0, size: 5 + Math.random() * 4, phase: Math.random() * Math.PI * 2, rotation: angle, color: sparkleColors[i % 3]});
  }
}
function drawParticles(particles) {
  for (const p of particles) {
    const remaining = Math.max(0, p.life / p.maxLife);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation + p.age * .6);
    ctx.globalAlpha = Math.min(1, p.age / .06, remaining * 3) * (.75 + .25 * Math.sin(p.age * 24 + p.phase));
    ctx.fillStyle = p.color;  // (no glow: a blurred shadow on hundreds of sparkles was the slowest thing on a phone)
    const size = p.size * (.7 + .3 * remaining);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? size * .23 : size; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
}
