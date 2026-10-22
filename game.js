/* StarSwim (formerly Star Catcher): the fish follows your finger (just above it) or the mouse and catches falling star bubbles, while
   jellyfish drift down, homing jellyfish steer toward it and a squid on the sea floor shoots its legs up. 3 hearts;
   a new stage for every 25 stars caught, and it never stops getting harder. Each star scores points times a combo
   multiplier that grows while you catch stars in a row; rare gold stars are worth more. After the last heart: the
   score, the top-score list, and tap to play again.
   The numbers live in rules.js, the shapes in shapes.js, the drawings in drawings.js.
   Tip: add ?stage=5 to the address to start at stage 5 (handy for trying the later stages). */
const canvas = document.getElementById('sea');
let ctx = canvas.getContext('2d');  // `let` so the Beware sign can borrow the drawings for its own little picture
const rules = StarRules;
let width = 0, height = 0, sizeScale = 1, clock = 0;

// Fill the whole window, sharp on Retina screens. Bigger screens (iPad) get slightly bigger creatures, like Little Fin.
function fitCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth; height = window.innerHeight;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  sizeScale = Math.min(width, height) >= 700 ? 1.32 : 1;
  if (fish) { fish.radius = 18 * sizeScale; Object.assign(target, rules.fishTarget(target.x, target.y, false, playArea(), fish.radius)); }
}
// Where the fish may swim: the whole screen except a strip at the top for the hearts and star count.
const playArea = () => ({left: 0, right: width, top: 50, bottom: height - 10});
const seaFloor = () => height - 30;
const legTip = () => height * rules.LEG_REACH;

// Everything about the current run.
const startStage = Math.max(1, parseInt(new URLSearchParams(location.search).get('stage')) || 1);
let fish = null, target = null, run = null, particles = [];
// --- Starting a run. A run is a normal game (a fresh seed) or today's Daily Challenge (the day's seed, the same for
//     everyone); `mode` remembers which, so "play again" and "Start over" repeat it. ---
let mode = 'play', inMenu = true;
function makeRun(seed) {
  fish = {x: width / 2, y: height * .7, radius: 18 * sizeScale, facing: 1, color: '#ffbb7e', safe: 0, wiggle: 0, shark: null, morph: null, rainbow: 0};
  target = {x: fish.x, y: fish.y};
  run = {seed, streams: {}, time: 0, stage: startStage, hearts: rules.HEARTS, caught: 0, missed: 0, score: 0, streak: 0, bestStreak: 0,
    stars: [], jellies: [], strikes: [], floaters: [], pickups: [], blasts: [], starTimer: 0, jellyTimer: 1.5, strikeTimer: 3,
    bombTimer: rules.FIRST_BOMB, rainbowTimer: rules.FIRST_RAINBOW, schools: [], schoolTimer: rules.FIRST_SCHOOL,
    currents: [], currentTimer: rules.FIRST_CURRENT, drift: 0, sharks: [], sharkTimer: rules.FIRST_SHARK, eels: [], eelTimer: rules.FIRST_EEL,
    stageBreak: null, stageDone: null, ready: null, sign: null, pendingSign: null, tutorialTimer: null, paused: false, over: false, overFor: 0};
  particles = [];
  clock = 0;  // the sea's clock starts over too (stars sway and tails wag by it), so a seed replays exactly
}
function startGame(newMode = mode) {
  mode = newMode; inMenu = false;
  makeRun(mode === 'daily' ? rules.dailySeed(new Date()) : rules.newSeed());
  for (const id of ['over', 'paused', 'sign', 'menu', 'tip']) document.getElementById(id).classList.add('hidden');
  document.getElementById('pause').classList.remove('hidden');
  document.body.classList.remove('in-menu');
  updateHud();
  beginStage();
}
// This run's random numbers, one stream per kind of thing, started fresh each stage (see the "Seeds" part of rules.js).
const rand = name => (run.streams[name] ||= rules.makeRandom(rules.seedFor(run.seed, run.stage, name)))();

// --- The start menu (Bryan, 2026-10-21): the title over the moving sea, Play, and the Daily Challenge with today's best. ---
function showMenu() {
  inMenu = true; makeRun(0);
  setScene(0);
  for (const id of ['over', 'paused', 'sign', 'tip']) document.getElementById(id).classList.add('hidden');
  document.getElementById('menu-tips').textContent = 'Show power-up tips again';
  document.body.classList.add('in-menu');
  const today = new Date(), daily = loadDaily(), best = loadScores()[0];
  document.getElementById('menu-daily-date').textContent = today.toLocaleDateString(undefined, {timeZone: 'UTC', month: 'short', day: 'numeric'});
  document.getElementById('menu-daily-best').textContent = daily.day === rules.dayKey(today) ? `Today's best: ${daily.best.toLocaleString()}` : 'Not played yet today';
  document.getElementById('menu-best').textContent = best ? `Your best: ${best.score.toLocaleString()} · stage ${best.stage}` : '';
  document.getElementById('menu').classList.remove('hidden');
}
// In the menu the fish just swims lazily back and forth.
function idleFish(dt) {
  clock += dt;
  setScene(Math.floor(clock / 8) % rules.SCENE_COUNT);  // the menu shows off a new scene every 8 seconds
  const x = width / 2 + Math.sin(clock * .5) * width * .28;
  fish.facing = Math.cos(clock * .5) >= 0 ? 1 : -1;
  fish.x = x; fish.y = height * .66 + Math.sin(clock * 1.3) * 10;
}
for (const [id, m] of [['menu-play', 'play'], ['menu-daily', 'daily']]) {
  document.getElementById(id).addEventListener('pointerdown', event => { event.stopPropagation(); unlockSound(); haptic('catch'); startGame(m); });
}
document.getElementById('over-menu').addEventListener('pointerdown', event => { event.stopPropagation(); haptic('catch'); showMenu(); });
// Today's best in the Daily Challenge (this device).
const DAILY_KEY = 'starswim.daily';
function loadDaily() { try { return JSON.parse(localStorage.getItem(DAILY_KEY)) || {}; } catch (_) { return {}; } }
function saveDaily(score) {
  const today = rules.dayKey(new Date()), daily = loadDaily();
  const best = daily.day === today ? Math.max(daily.best, score) : score;
  try { localStorage.setItem(DAILY_KEY, JSON.stringify({day: today, best})); } catch (_) {}
  return {best, isNew: best === score && (daily.day !== today || score > daily.best)};
}

// --- Controls ---
// Mouse: the fish follows the pointer whenever it moves over the game (no click needed).
// Touch: put a finger down anywhere and drag; the fish swims to just above the fingertip and stays put when you let go.
function aimAt(event) {
  const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen';
  Object.assign(target, rules.fishTarget(event.clientX, event.clientY, isTouch, playArea(), fish.radius));
  hideHint();
}
canvas.addEventListener('pointerdown', event => {
  unlockSound();
  if (inMenu) return;  // the menu's buttons handle themselves
  if (run.paused) { resumeGame(); return; }  // the tap that ends the pause doesn't move the fish
  if (run.sign) { closeSign(); return; }     // ...nor the tap that puts the Beware sign away
  if (run.tip) { closeTip(); return; }       // ...or a power-up tip
  if (run.over) { if (run.overFor >= rules.RESTART_PAUSE) startGame(); return; }  // instant restart
  canvas.setPointerCapture(event.pointerId); aimAt(event);
});
canvas.addEventListener('pointermove', event => { if (!inMenu && !run.over && (event.pointerType === 'mouse' || event.buttons)) aimAt(event); });
canvas.addEventListener('pointerup', event => { if (!inMenu && !run.over) aimAt(event); });  // the spot where the finger lifted counts too
// The arrow keys nudge the fish too (handy on a Mac without a mouse); Space or Enter restarts after the last heart.
document.addEventListener('keydown', event => {
  if (inMenu) { if (event.key === ' ' || event.key === 'Enter') startGame('play'); return; }
  if (event.key === 'Escape' || event.key === 'p') { run.paused ? resumeGame() : pauseGame(); return; }
  if (run.paused) { if (event.key === ' ' || event.key === 'Enter') resumeGame(); return; }
  if (run.sign) { if (event.key === ' ' || event.key === 'Enter') closeSign(); return; }
  if (run.tip) { if (event.key === ' ' || event.key === 'Enter') closeTip(); return; }
  if (run.over && (event.key === ' ' || event.key === 'Enter')) { if (run.overFor >= rules.RESTART_PAUSE) startGame(); return; }
  const moves = {ArrowLeft: [-60, 0], ArrowRight: [60, 0], ArrowUp: [0, -60], ArrowDown: [0, 60]}[event.key];
  if (!moves || run.over) return;
  event.preventDefault(); hideHint();
  Object.assign(target, rules.fishTarget(target.x + moves[0], target.y + moves[1], false, playArea(), fish.radius));
});

// --- Pause (Bryan, 2026-10-21): the ⏸ button, or leaving the app mid-run, freezes the game and shows the stage and
//     score. A tap anywhere keeps playing, with a short moment of safety so nothing can hit the fish straight away. ---
function pauseGame() {
  if (!run || inMenu || run.over || run.paused) return;
  run.paused = true;
  const $ = id => document.getElementById(id);
  $('paused-stage').textContent = `Stage ${run.stage}`;
  $('paused-score').textContent = run.score.toLocaleString();
  const hearts = Math.max(0, run.hearts);
  $('paused-details').textContent = `★ ${run.caught} · ${'♥'.repeat(hearts)}${'♡'.repeat(Math.max(0, rules.HEARTS - hearts))} · ${formatTime(run.time)}`;
  $('paused').classList.remove('hidden');
  document.getElementById('volume').value = rules.sliderForVolume(musicLevel);
  resetStartOver();
  if (musicOn) fadeMusic(musicLevel * .35, .3);  // the music drops back while paused (until the slider is touched)
}
function resumeGame() {
  if (!run.paused) return;
  run.paused = false;
  document.getElementById('paused').classList.add('hidden');
  fish.safe = Math.max(fish.safe, rules.RESUME_SAFE);
  if (musicOn) fadeMusic(musicLevel, .5);
}
// Start over (on the pause screen, Bryan 2026-10-21): the first tap asks "Tap again to start over", a second tap within
// 3 seconds starts a new run. The run being left still goes on the top-score list if it scored anything.
const startOverButton = document.getElementById('start-over');
let startOverArmed = 0;
startOverButton.addEventListener('pointerdown', event => {
  event.stopPropagation(); unlockSound(); haptic('catch');
  if (performance.now() - startOverArmed > 3000) {
    startOverArmed = performance.now(); startOverButton.textContent = 'Tap again to start over'; startOverButton.classList.add('armed');
    setTimeout(() => { if (performance.now() - startOverArmed >= 3000) resetStartOver(); }, 3000);  // changed your mind: back to normal
    return;
  }
  if (run.score > 0) recordRun();
  startGame();
  if (musicOn) fadeMusic(musicLevel, .5);
});
function resetStartOver() { startOverArmed = 0; startOverButton.textContent = 'Start over'; startOverButton.classList.remove('armed'); }
document.getElementById('pause').addEventListener('pointerdown', event => { event.stopPropagation(); unlockSound(); pauseGame(); });
// Leaving the app (or the browser tab) mid-run pauses it; the iPhone app also calls StarCatcherPause when a call,
// Control Center or a notification covers the game.
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
window.addEventListener('blur', pauseGame);
window.StarCatcherPause = pauseGame;

// --- One frame of play ---
function update(dt) {
  if (run.paused) return;  // everything stands still while paused
  if (run.sign) { run.sign.t += dt; if (run.sign.t >= rules.SIGN_AUTO) closeSign(); return; }  // ...and while a Beware sign is up
  if (run.tip) return;  // ...and while a power-up tip is showing
  if (run.pendingSign && !fish.morph) { showSign(run.pendingSign); run.pendingSign = null; return; }
  if (run.stageDone && (run.stageDone.t += dt) >= rules.STAGE_DONE_PAUSE) { run.stageDone = null; nextStage(); }
  if (run.ready && (run.ready.t += dt) >= rules.READY_TIME) { run.ready = null; go(); }
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.age += dt; }
  particles = particles.filter(p => p.life > 0);
  for (const f of run.floaters) { f.y -= 40 * dt; f.life -= dt; }
  run.floaters = run.floaters.filter(f => f.life > 0);
  if (run.hurt && (run.hurt.t += dt) > .7) run.hurt = null;
  for (const blast of run.blasts) blast.age += dt;
  run.blasts = run.blasts.filter(blast => blast.age < .5);
  if (run.over) { run.overFor += dt; return; }
  run.time += dt;
  // A stage's last star starts the shark break; the next stage begins once the sea is clear (see startBreak).
  if (!run.stageBreak && !run.stageDone && !run.ready && rules.stageEnded(run.stage, run.caught + rules.starsBefore(startStage))) {  // ?stage=N counts the stars before it
    if (rules.sharkBreakAfter(run.stage)) startBreak(); else clearAndContinue();
  }  // ?stage=N counts as stars already caught
  const stage = run.stage;
  if (fish.shark) fish.shark.time += dt;
  updateMorph(dt);
  fish.safe = Math.max(0, fish.safe - dt); fish.wiggle = Math.max(0, fish.wiggle - dt);

  // The fish swims toward its spot and turns to face the way it is going.
  // A current pushes the fish sideways off its spot under the finger (run.drift; see updateCurrents).
  const aim = rules.fishTarget(target.x + run.drift, target.y, false, playArea(), fish.radius);
  run.drift = aim.x - target.x;
  const next = rules.follow(fish, aim, dt);
  if (Math.abs(next.x - fish.x) > .3) fish.facing = next.x > fish.x ? 1 : -1;
  fish.x = next.x; fish.y = next.y;

  updateStars(dt); updatePickups(dt); updateJellies(dt, stage); updateSchools(dt, stage); updateCurrents(dt, stage); updateSharks(dt, stage); updateEels(dt, stage); updateSquid(dt, stage);
  updateRainbow(dt);
  if (run.stageBreak) updateBreak();

  // A bump: a wiggle, a blink and one heart; the third ends the run.
  // As a shark the fish can't be hurt; it eats the jellyfish instead.
  if (fish.shark) eatJellies();
  else if (fish.safe <= 0 && !(fish.rainbow > 0) && (run.jellies.some(touchesCreature) || livePiranhas().some(p => rules.piranhaTouches(p, fish)) || liveSharks().some(sh => rules.sharkTouches(sh, fish)) || liveEels().some(eel => rules.eelTouches(eel, fish)) || squidLegTouching())) {
    const mine = run.jellies.find(c => c.kind === 'mine' && touchesCreature(c));
    if (mine) {  // a sea mine blows up when bumped (and is gone)
      run.jellies = run.jellies.filter(c => c !== mine);
      sparkleBurst(particles, mine.x, mine.y, creatureColors(mine)); run.blasts.push({x: mine.x, y: mine.y, radius: mine.radius * 3.5, age: 0}); mineBoom();
    }
    run.hearts--; fish.safe = rules.SAFE_AFTER_BUMP; fish.wiggle = .8; breakCombo(fish.x, fish.y - fish.radius * 2, true);
    ouch();
    if (run.hearts <= 0) endGame();
  }
}
// A new star bubble along the top (gold ones are rarer and faster). The tutorial's gold star uses its own random stream,
// so it doesn't shift the ordinary stars.
function spawnStar(gold, stream = 'stars') {
  const [slow, fast] = rules.STAR_SPEED, radius = rules.STAR_RADIUS * sizeScale;
  run.stars.push({x: 40 + rand(stream) * (width - 80), y: playArea().top - radius, radius, gold, phase: rand(stream) * 6,
    speed: (slow + rand(stream) * (fast - slow)) * (gold ? rules.GOLD_SPEED : 1)});
  if (gold) maybeTip('gold');
}
function updateStars(dt) {
  if (!quiet() && (run.starTimer -= dt) <= 0) {
    run.starTimer = rules.STAR_GAP;
    spawnStar(rand('stars') < rules.GOLD_CHANCE);
  }
  // Stars fall with a gentle sway; catch one by swimming into it.
  for (const star of run.stars) {
    star.age = (star.age || 0) + dt;  // each star sways by its own age, so a seed replays the same whenever the stage began
    star.y += star.speed * dt; star.x += Math.sin(star.age * 1.3 + star.phase) * 12 * dt;
    if (!star.caught && rules.touchesStar(fish, star)) { star.caught = true; catchStar(star); }
    else if (star.y - star.radius > height) { star.gone = true; run.missed++; if (!star.gold) breakCombo(star.x, height - 60); }
  }
  run.stars = run.stars.filter(star => !star.caught && !star.gone);
}
// --- Hearts and bombs that fall (Bryan, 2026-10-21) ---
// A heart falls after every 15 stars caught; a bomb now and then. Catch either by swimming into it; missing one is fine.
function dropPickup(kind) {
  const radius = rules.STAR_RADIUS * sizeScale * {heart: 1.05, bomb: 1.15, bombH: 1.15, bombV: 1.15, rainbow: 1.1, jaw: 1.45}[kind];
  run.pickups.push({kind, x: 40 + rand(kind) * (width - 80), y: playArea().top - radius, radius, speed: rules.PICKUP_SPEED, phase: rand(kind) * 6});
  maybeTip(kind);
}
function updatePickups(dt) {
  // The tutorial schedule in the intro stages: one sure power-up a few seconds after "Go!" (see TUTORIAL in rules.js).
  if (!quiet() && run.tutorialTimer !== null && (run.tutorialTimer -= dt) <= 0) {
    const kind = rules.TUTORIAL[run.stage];
    run.tutorialTimer = null;
    if (kind === 'gold') spawnStar(true, 'tutorial'); else dropPickup(kind);
  }
  // TNT and rainbow bubbles on their random timers, from stage 10 on (during the intros only the schedule drops them).
  if (!rules.randomPickupsAt(run.stage)) { /* not yet */ }
  else if (!quiet() && (run.bombTimer -= dt) <= 0) {
    const [shortest, longest] = rules.BOMB_GAP;
    run.bombTimer = shortest + rand('bomb') * (longest - shortest);
    dropPickup(rules.BOMB_KINDS[Math.floor(rand('bomb') * rules.BOMB_KINDS.length)]);  // round blast, or a bar across or up-and-down
  }
  if (rules.randomPickupsAt(run.stage) && !quiet() && (run.rainbowTimer -= dt) <= 0) {  // the rarer rainbow bubble
    const [shortest, longest] = rules.RAINBOW_GAP;
    run.rainbowTimer = shortest + rand('rainbow') * (longest - shortest);
    dropPickup('rainbow');
  }
  for (const pickup of run.pickups) {
    pickup.age = (pickup.age || 0) + dt;
    pickup.y += pickup.speed * dt; pickup.x += Math.sin(pickup.age * 1.1 + pickup.phase) * 10 * dt;
    if (rules.touchesStar(fish, pickup)) { pickup.used = true; ({heart: catchHeart, bomb: catchBomb, bombH: catchBomb, bombV: catchBomb, rainbow: catchRainbow, jaw: becomeShark})[pickup.kind](pickup); }
    else if (pickup.y - pickup.radius > height) pickup.used = true;
  }
  run.pickups = run.pickups.filter(pickup => !pickup.used);
}
// One more heart (5 at most; with a full row it's bonus points instead).
function catchHeart(heart) {
  sparkleBurst(particles, heart.x, heart.y, ['#ffd0da', '#ff8fa0', '#ffffff']);
  if (run.hearts < rules.MAX_HEARTS) { run.hearts++; floater('+1 heart', heart.x, heart.y - heart.radius, '#ff9fb2', 20); }
  else { run.score += rules.FULL_HEART_POINTS; floater(`+${rules.FULL_HEART_POINTS}`, heart.x, heart.y - heart.radius, '#ff9fb2', 20); }
  heartSound(); haptic('heart'); updateHud();
}
// Boom: every jellyfish near the catch pops (squid legs stay; they're part of the sea floor).
// The arrow TNTs blast a bar instead (Bryan, 2026-10-21): bombH right across the screen at the catch's height, bombV from
// top to bottom at its x. An eel counts if any piece of its body is in the blast.
function catchBomb(bomb) {
  const axis = {bombH: 'h', bombV: 'v'}[bomb.kind];
  const blast = axis ? {x: bomb.x, y: bomb.y, axis, half: rules.BAR_HALF * sizeScale, age: 0} : {x: bomb.x, y: bomb.y, radius: rules.BLAST_RADIUS * sizeScale, age: 0};
  run.blasts.push(blast);
  const hit = c => axis ? rules.inBar(blast, c, axis, blast.half) : rules.inBlast(blast, c, blast.radius);
  const caught = c => c.kind === 'eel' ? rules.eelSegments(c).some(piece => hit({x: piece.x, y: piece.y, radius: c.radius})) : hit(c);
  const cleared = [...run.jellies, ...livePiranhas(), ...liveSharks(), ...liveEels()].filter(caught);
  for (const jelly of cleared) { jelly.eaten = true; sparkleBurst(particles, jelly.x, jelly.y, creatureColors(jelly)); }
  run.jellies = run.jellies.filter(jelly => !jelly.eaten);
  run.sharks = run.sharks.filter(shark => !shark.eaten); run.eels = run.eels.filter(eel => !eel.eaten);
  const points = cleared.length * rules.BLAST_POINTS;
  run.score += points;
  floater(cleared.length ? `Boom! +${points}` : 'Boom!', bomb.x, bomb.y - bomb.radius, '#ffe08a', 24);
  boom(); haptic('bomb'); updateHud();
}

// --- The shark break between stages (Bryan, 2026-10-21) ---
// The stage's last star: nothing new comes in (no stars, jellyfish, squid strikes or bombs) and a fossil shark jaw falls.
function startBreak() {
  run.stageBreak = {};
  // Sharks still waiting to come in don't; the others finish the crossing they're on and swim off.
  run.sharks = run.sharks.filter(shark => shark.state !== 'warn');
  for (const shark of run.sharks) shark.passesLeft = 1;
  run.eels = run.eels.filter(eel => eel.state !== 'warn');  // eels still waiting don't come in; the others zip on out
  dropPickup('jaw');
  announceStage(`Stage ${run.stage} clear!`, 'Grab the shark jaw!'); chime();
}
// Eat the jaw: the fish turns into a chomping shark.
function becomeShark(jaw) {
  // A rainbow bubble pops when the jaw is eaten, so the shark can get at the monsters (Bryan, 2026-10-22).
  if (fish.rainbow > 0) { fish.rainbow = 0; popSound(); sparkleBurst(particles, fish.x, fish.y, ['#ff5c5c', '#ffe14d', '#6ee07a', '#4dc3ff', '#e07bff']); }
  fish.shark = {time: 0}; fish.safe = 0;
  fish.morph = {to: 'shark', t: 0, length: rules.MORPH_TIME, popped: false};
  sparkleBurst(particles, jaw.x, jaw.y, ['#efe2c2', '#ffcf7a', '#ffffff']);
  floater('Shark time!', fish.x, fish.y - fish.radius * 3, '#ffd0a0', 24);
  sharkSound(); haptic('jaw');
}
// The change between fish and shark, so it's obvious: the old shape shakes, glows and swells, then at the halfway point
// there's a flash ring and a burst of sparkles, and the new shape pops out a little too big and settles (drawPlayer).
function updateMorph(dt) {
  const morph = fish.morph;
  if (!morph) return;
  morph.t += dt;
  if (!morph.popped && morph.t >= morph.length / 2) {
    morph.popped = true;
    const colors = ['#ffffff', '#ffe0b8', fish.color];
    sparkleBurst(particles, fish.x, fish.y, colors); sparkleBurst(particles, fish.x, fish.y, colors);
    run.blasts.push({x: fish.x, y: fish.y, radius: fish.radius * (morph.to === 'shark' ? 4 : 3), age: 0});
    poof(); if (morph.to === 'shark') haptic('chomp');
  }
  if (morph.t >= morph.length) fish.morph = null;
}
function eatJellies() {
  let eatenNow = false;
  const reach = fish.radius * rules.SHARK_SIZE * 1.3;
  for (const jelly of [...run.jellies, ...livePiranhas(), ...liveSharks(), ...liveEels()]) {
    if (Math.hypot(jelly.x - fish.x, jelly.y - fish.y) > reach + jelly.radius) continue;
    jelly.eaten = true; eatenNow = true; run.score += rules.SNACK_POINTS;
    sparkleBurst(particles, jelly.x, jelly.y, creatureColors(jelly));
    floater(`+${rules.SNACK_POINTS}`, jelly.x, jelly.y - jelly.radius, '#bfe3f2', 20);
    chomp(); haptic('chomp');
  }
  if (run.jellies.some(jelly => jelly.eaten)) run.jellies = run.jellies.filter(jelly => !jelly.eaten);
  run.sharks = run.sharks.filter(shark => !shark.eaten); run.eels = run.eels.filter(eel => !eel.eaten);
  if (eatenNow) updateHud();  // only when something was eaten: rewriting the top bar every frame is slow on a phone
}
// Once the sea is clear (and the jaw is caught or gone), the shark turns back into the fish and the next stage begins.
function updateBreak() {
  const clear = rules.breakOver({jellies: run.jellies.length + livePiranhas().length + run.schools.filter(s => s.warn > 0).length + run.sharks.length + run.eels.length, jawFalling: run.pickups.some(p => p.kind === 'jaw'),
    strikes: run.strikes.length, sharkTime: fish.shark ? fish.shark.time : null});
  if (!clear) return;
  if (fish.shark) { fish.shark = null; fish.morph = {to: 'fish', t: 0, length: rules.MORPH_BACK_TIME, popped: false}; fish.safe = 1; }
  run.stageBreak = null;
  chime(); haptic('stage');
  nextStage();
}
// Between the intro stages there's no shark break: the leftover monsters vanish in a puff and the next stage (and its
// Beware sign) comes straight away.
function clearAndContinue() {
  // Everything pops away: monsters, stars and bombs (a falling heart is given to you, so it's never lost).
  const leftovers = [...run.jellies, ...livePiranhas(), ...liveSharks(), ...liveEels()];
  for (const c of leftovers) sparkleBurst(particles, c.x, c.y, creatureColors(c));
  for (const star of run.stars) sparkleBurst(particles, star.x, star.y);
  for (const pickup of run.pickups) {
    if (pickup.kind === 'heart') catchHeart(pickup); else sparkleBurst(particles, pickup.x, pickup.y, ['#c9d2e8', '#ffffff', '#ffdf5e']);
  }
  run.jellies = []; run.schools = []; run.sharks = []; run.eels = []; run.currents = []; run.strikes = []; run.stars = []; run.pickups = []; run.drift = 0;
  poof();
  // "Stage N complete!" and a moment of empty sea, then the next stage (and its Beware sign).
  run.stageDone = {t: 0};
  announceStage(`Stage ${run.stage} complete!`, 'Nice swimming!');
  chime(); haptic('stage');
}
function nextStage() {
  run.stage++;
  updateHud();
  beginStage();
}
// A new stage: if it brings in a new monster, its Beware sign comes up first (once the fish has finished changing back);
// otherwise the "Stage N" banner right away.
function beginStage() {
  setScene(rules.sceneFor(run.stage));  // a new sea for every stage (scenery.js)
  const intro = rules.course(run.stage).intro;
  if (intro) run.pendingSign = intro; else startRound();
}
// The start of a round (after the sign, if there is one): the "Stage N" banner and a calm "Ready..." with nothing coming
// in, then "Go!" and the first stars and monsters soon after.
function startRound() {
  run.streams = {};  // fresh random streams for this stage, from (seed, stage, name)
  announceStage();
  run.ready = {t: 0};
  floater('Ready...', width / 2, height * .55, '#fff7d6', 30);
  run.starTimer = .3; run.jellyTimer = 1.2; run.strikeTimer = 2; run.schoolTimer = rules.FIRST_SCHOOL; run.currentTimer = rules.FIRST_CURRENT;
  run.sharkTimer = rules.FIRST_SHARK; run.eelTimer = rules.FIRST_EEL;
  run.tutorialTimer = rules.TUTORIAL[run.stage] ? rules.TUTORIAL_AT : null;
  if (run.stage === rules.INTRO_STAGES + 1) { run.bombTimer = rules.BOMB_AFTER_INTROS; run.rainbowTimer = rules.RAINBOW_AFTER_INTROS; }
}
function go() {
  floater('Go!', width / 2, height * .55, '#9ff3d8', 46);
  goSound(); haptic('combo');
}
// Nothing new comes in during the shark break, the "Stage N complete!" moment, or "Ready...".
const quiet = () => run.stageBreak || run.stageDone || run.ready;

// A catch: points times the combo multiplier, then the combo grows (a new multiplier every 5 in a row).
function catchStar(star) {
  const points = rules.pointsFor(star.gold, run.streak), before = rules.multiplierFor(run.streak);
  if (rules.heartDue(run.caught, run.caught + 1)) dropPickup('heart');  // every 15 stars, a heart falls
  run.score += points; run.caught++; run.streak++; run.bestStreak = Math.max(run.bestStreak, run.streak);
  sparkleBurst(particles, star.x, star.y); if (star.gold) sparkleBurst(particles, star.x, star.y);
  floater(`+${points}`, star.x, star.y - star.radius, star.gold ? '#ffc940' : '#fff3c4', star.gold ? 26 : 18);
  const after = rules.multiplierFor(run.streak);
  if (after > before) { floater(`x${after} combo!`, fish.x, fish.y - fish.radius * 2.6, '#9ff3d8', 22); comboUp(); haptic('combo'); }
  else if (star.gold) { goldDing(); haptic('gold'); }
  else { ding(); haptic('catch'); }
  updateHud();
}
// A star slipped by, or a bump: the combo starts over (only worth a message once it had built up). A bump already has
// its own sound and rumble, so then it's just the message.
function breakCombo(x, y, bumped = false) {
  if (rules.multiplierFor(run.streak) > 1) { floater('Combo lost', x, y, '#ffa3a3', 16); if (!bumped) { comboLost(); haptic('comboLost'); } }
  run.streak = 0; updateHud();
}
const floater = (text, x, y, color, size) => run.floaters.push({text, x: rules.clamp(x, 60, width - 60), y, color, size, life: 1});
function updateJellies(dt, stage) {
  // A new jellyfish now and then along the top; from stage 2 some of them are homing ones.
  if (!quiet() && (run.jellyTimer -= dt) <= 0) {
    const kinds = rules.fallingKinds(stage);  // which sinking monsters this stage has (from the course)
    const kind = kinds[Math.floor(rand('falling') * kinds.length)];
    run.jellyTimer = rules.jellyGap(stage) * rules.mixSpacing(stage) * (kind === 'mine' ? rules.MINE_SPACING : 1);
    const x = 40 + rand('falling') * (width - 80), wobble = .9 + rand('falling') * .2, age = rand('falling') * 6, phase = rand('falling') * 6;
    if (kind === 'mine') {
      const radius = rules.MINE_RADIUS * sizeScale;
      run.jellies.push({kind: 'mine', x, y: playArea().top - radius * 2, radius, age, phase, speed: rules.jellySpeed(stage) * rules.MINE_FALL * wobble});
    } else if (kind === 'puffer') {
      const radius = rules.PUFFER_RADIUS * sizeScale;
      run.jellies.push({kind: 'puffer', state: 'drift', t: 0, x, y: playArea().top - radius * 2, radius, age, phase, speed: rules.jellySpeed(stage) * rules.PUFFER_FALL * wobble});
    } else if (kind) {  // jellyfish, plain or homing
      const radius = rules.JELLY_RADIUS * sizeScale, homing = kind === 'homing';
      run.jellies.push({kind: 'jellyfish', x, y: playArea().top - radius * 2, radius, homing, age, phase, speed: rules.jellySpeed(stage) * (homing ? rules.HOMING_FALL : 1) * wobble});
    }
  }
  for (const jelly of run.jellies) {
    jelly.age += dt; jelly.y += jelly.speed * dt;
    if (jelly.kind === 'mine') jelly.x += Math.sin(jelly.age * .5 + jelly.phase) * 6 * dt;  // a slow bob (currents carry them: updateCurrents)
    else if (jelly.kind === 'puffer') {
      jelly.x += Math.sin(jelly.age * .7 + jelly.phase) * 10 * dt;
      const before = jelly.state;
      rules.pufferStep(jelly, Math.hypot(fish.x - jelly.x, fish.y - jelly.y) / sizeScale, dt);
      if (jelly.state !== before && jelly.state === 'shake') rattle();
      if (jelly.state !== before && jelly.state === 'puff') { puffSound(); haptic('puff'); }
    } else jelly.x += jelly.homing ? rules.homingDrift(jelly, fish, stage, dt) : Math.sin(jelly.age * .8 + jelly.phase) * 14 * dt;
  }
  run.jellies = run.jellies.filter(jelly => jelly.y < height + jelly.radius * (jelly.kind === 'puffer' ? rules.PUFF_SIZE * 1.4 : jelly.kind === 'mine' ? 3 : 2));
}
// Is the fish touching this jellyfish, pufferfish or sea mine?
const touchesCreature = c => c.kind === 'mine' ? rules.mineTouches(c, fish) : c.kind === 'puffer' ? rules.pufferTouches(c, fish) : Shapes.fishTouchesJelly(fish, c, clock);
// Sparkle colors when a creature is eaten or blown up.
const creatureColors = c => c.kind === 'eel' ? ['#f2e45a', '#9fd34a', '#ffffff'] : c.kind === 'shark' ? ['#84adc3', '#d9e9e9', '#ffffff'] : c.kind === 'mine' ? ['#ffb04d', '#ff6a4d', '#ffffff'] : c.kind === 'puffer' ? ['#f3c878', '#ffb070', '#ffffff'] : c.kind === 'piranha' ? ['#b674ad', '#ef907e', '#ffffff']
  : c.homing ? ['#ffd0b8', '#ff9a8a', '#ffffff'] : ['#edc1fa', '#c7a6f0', '#ffffff'];

// --- Piranha schools (from stage 5): arrows flash on one side, then a wavy column of piranhas swims across with a gap. ---
const livePiranhas = () => run.schools.flatMap(school => school.warn > 0 ? [] : school.members.filter(p => !p.eaten));
function updateSchools(dt, stage) {
  if (rules.has(stage, 'piranha') && !quiet() && (run.schoolTimer -= dt) <= 0) {
    run.schoolTimer = rules.schoolGap(stage);
    const direction = rand('piranha') < .5 ? 1 : -1, radius = rules.PIRANHA_RADIUS * sizeScale;
    // The column is centered on the fish, so you have to find the gap (or get round an end).
    const slots = rules.schoolLayout(playArea().top + 30, seaFloor() - 70, rand('piranha'), rand('piranha'), rand('piranha'), rules.SCHOOL_SPACING * sizeScale, fish.y);
    const startX = direction > 0 ? -radius * 2 : width + radius * 2;
    run.schools.push({direction, slots, warn: rules.SCHOOL_WARN, x: startX, speed: rules.schoolSpeed(stage),
      members: slots.filter(slot => !slot.gap).map((slot, i) => ({kind: 'piranha', baseY: slot.y, x: startX, y: slot.y, radius, direction, age: i * .37, lag: (i % 2) * radius * .8}))});
    alarm(); haptic('warn');
  }
  for (const school of run.schools) {
    if (school.warn > 0) { school.warn -= dt; continue; }
    school.x += school.direction * school.speed * dt;
    for (const [i, p] of school.members.entries()) {
      p.age += dt;
      p.x = school.x - school.direction * p.lag + (p.ox || 0);  // every other one a little behind, so the column looks like a school
      p.y = p.baseY + Math.sin(p.age * 3 + i * .7) * 7 * sizeScale + (p.oy || 0);  // (ox, oy: bumped by the rainbow bubble)
    }
  }
  run.schools = run.schools.filter(school => school.warn > 0 || (school.direction > 0 ? school.x < width + 80 : school.x > -80));
}

// --- Currents (from stage 10): faint streaks show a band first, then it flows and pushes the fish sideways while it's
//     inside (and the stars in it a little too). ---
function updateCurrents(dt, stage) {
  if (rules.has(stage, 'current') && !quiet() && !run.currents.length && (run.currentTimer -= dt) <= 0) {
    run.currentTimer = rules.currentGap(stage);
    const tall = rules.CURRENT_HEIGHT * sizeScale, top = playArea().top + tall / 2 + 20, bottom = seaFloor() - tall / 2 - 50;
    // The band appears right where the fish is.
    const y = rules.currentAimsAt(stage) ? rules.clamp(fish.y, top, Math.max(top, bottom)) : top + rand('current') * Math.max(0, bottom - top);
    run.currents.push({y, height: tall, direction: rand('current') < .5 ? 1 : -1, state: 'warn', t: 0,
      push: rules.currentPushAt(stage), flow: rules.currentFlowAt(stage)});
  }
  let push = 0;
  for (const current of run.currents) {
    current.t += dt;
    const length = {warn: rules.CURRENT_WARN, flow: current.flow, fade: rules.CURRENT_FADE}[current.state];
    if (current.t >= length) {
      current.t = 0; current.state = {warn: 'flow', flow: 'fade', fade: 'gone'}[current.state];
      if (current.state === 'flow') { currentSound(); haptic('current'); }
    }
    const force = current.direction * current.push * sizeScale * rules.currentStrength(current);
    if (force && rules.inCurrent(current, fish.y)) push += force;
    if (force) for (const star of run.stars) if (rules.inCurrent(current, star.y)) star.x += force * .4 * dt;
    if (force) for (const mine of run.jellies) if (mine.kind === 'mine' && rules.inCurrent(current, mine.y)) mine.x += force * rules.MINE_CARRY * dt;
  }
  run.currents = run.currents.filter(current => current.state !== 'gone');
  run.drift = rules.driftStep(run.drift, push, dt);
}

// --- Sharks (from stage 15): an arrow flashes at a lane on one edge, then a shark swims back and forth along it,
//     turning at the walls, and leaves after three crossings. Up to two at a time, in different lanes. ---
const liveSharks = () => run.sharks.filter(shark => shark.state !== 'warn' && !shark.eaten);
function updateSharks(dt, stage) {
  if (rules.has(stage, 'shark') && !quiet() && run.sharks.length < rules.MAX_SHARKS && (run.sharkTimer -= dt) <= 0) {
    run.sharkTimer = rules.sharkGap(stage);
    const radius = rules.SHARK_RADIUS * sizeScale, direction = rand('shark') < .5 ? 1 : -1;
    // Its lane is at the fish's height (or as near as it can be without sharing another shark's lane).
    const y = rules.sharkLane(playArea().top + radius * 1.5, seaFloor() - radius * 3, rand('shark'), run.sharks.map(sh => sh.y), radius, fish.y);
    run.sharks.push({kind: 'shark', state: 'warn', t: 0, x: direction > 0 ? -radius * 3 : width + radius * 3, y, radius, direction,
      passesLeft: rules.SHARK_PASSES, age: rand('shark') * 6});
    alarm(); haptic('warn');
  }
  for (const shark of run.sharks) {
    const before = shark.state;
    shark.age += dt;
    // At each wall it turns toward the fish's height, so it comes back at you.
    const aimY = rules.clamp(fish.y, playArea().top + shark.radius * 1.5, seaFloor() - shark.radius * 3);
    rules.sharkStep(shark, width, rules.sharkSpeed(stage) * sizeScale, dt, aimY);
    if (before === 'warn' && shark.state === 'swim') sharkWhoosh();
  }
  run.sharks = run.sharks.filter(shark => shark.state !== 'gone');
}

// --- Electric eels (stage 9 introduces them): a yellow spark on one wall, then an eel zips across on a twisting path. ---
const liveEels = () => run.eels.filter(eel => eel.state !== 'warn' && !eel.eaten);
function updateEels(dt, stage) {
  if (rules.has(stage, 'eel') && !quiet() && run.eels.length < 2 && (run.eelTimer -= dt) <= 0) {
    run.eelTimer = rules.eelGap(stage);
    const direction = rand('eel') < .5 ? 1 : -1, swing = rules.EEL_SWING * sizeScale;
    const top = playArea().top + swing + 30, bottom = seaFloor() - swing - 60;
    // It twists along a path centered on the fish's height.
    const startX = direction > 0 ? -30 : width + 30, lane = rules.clamp(fish.y, top, Math.max(top, bottom)), phase = rand('eel') * Math.PI * 2;
    const eel = {kind: 'eel', state: 'warn', t: 0, direction, startX, lane, phase, traveled: 0, scale: sizeScale, radius: rules.EEL_THICK * sizeScale};
    const head = rules.eelSegments(eel)[0]; eel.x = head.x; eel.y = head.y;
    run.eels.push(eel);
    crackle(); haptic('warn');
  }
  for (const eel of run.eels) {
    eel.t += dt;
    if (eel.state === 'warn') { if (eel.t >= rules.EEL_WARN) { eel.state = 'swim'; zap(); } continue; }
    eel.traveled += rules.eelSpeed(stage) * sizeScale * dt;
    const head = rules.eelSegments(eel)[0]; eel.x = head.x; eel.y = head.y;
    if (rules.eelGone(eel, width)) eel.state = 'gone';
  }
  run.eels = run.eels.filter(eel => eel.state !== 'gone');
}

// The squid: a strike is one or more legs, each in its own slice of the sea floor (so there is always room to swim
// between them), starting one after another in a shuffled order. Each leg glows with a dotted line first (warn), then
// shoots up, stays a moment, and sinks back. The next strike comes after a calm spell.
function updateSquid(dt, stage) {
  if (!quiet() && !run.strikes.length && (run.strikeTimer -= dt) <= 0) {
    run.strikeTimer = rules.strikeGap(stage);
    const legs = Math.min(rules.legsFor(stage), rules.maxLegs(width)), slice = (width - 80) / legs;
    const spots = Array.from({length: legs}, (_, k) => 40 + slice * (k + .5) + (rand('squid') - .5) * (slice - rules.LEG_ROOM));
    for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(rand('squid') * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
    run.strikes = spots.map((x, i) => ({x, stage: 'wait', left: i * rules.legStagger(stage), reach: 0}));
  }
  for (const strike of run.strikes) {
    strike.left -= dt;
    if (strike.stage === 'wait' && strike.left <= 0) { strike.stage = 'warn'; strike.left += rules.warnTime(stage); }
    else if (strike.stage === 'warn' && strike.left <= 0) { strike.stage = 'up'; strike.left = rules.LEG_UP; whoosh(); }
    else if (strike.stage === 'up') { strike.reach = Math.min(1, strike.reach + dt * rules.RISE); if (strike.left <= 0) strike.stage = 'down'; }
    else if (strike.stage === 'down') strike.reach -= dt * 2.5;
  }
  run.strikes = run.strikes.filter(strike => strike.stage !== 'down' || strike.reach > 0);
}
function squidLegTouching() {
  const floor = seaFloor();
  return run.strikes.some(strike => {
    if (strike.stage === 'wait' || strike.stage === 'warn' || strike.reach < .3) return false;
    const top = floor - (floor - legTip()) * strike.reach;
    return Math.abs(fish.x - strike.x) < 14 * sizeScale + fish.radius * .8 && fish.y + fish.radius * .6 > top;
  });
}
// After the last heart: the score, how the run went, and the top-score list with this run highlighted.
// Runs started with ?stage=N are practice and don't go on the list.
function endGame() {
  run.over = true; run.overFor = 0; hideHint(); document.getElementById('pause').classList.add('hidden'); haptic('gameOver');
  const {list, rank} = recordRun();
  const $ = id => document.getElementById(id);
  const daily = mode === 'daily' && startStage === 1 ? saveDaily(run.score) : null;
  $('over-title').textContent = startStage > 1 ? `Practice run (from stage ${startStage})` : daily ? (daily.isNew ? 'New daily best!' : 'Daily Challenge')
    : rank === 0 ? 'New best!' : 'Out of hearts';
  $('over-title').classList.toggle('best', rank === 0 || !!(daily && daily.isNew));
  $('over-daily').textContent = daily ? `Today's best: ${daily.best.toLocaleString()}` : '';
  $('over-score').textContent = run.score.toLocaleString();
  $('over-details').textContent = `★ ${run.caught} · Stage ${run.stage} · ${formatTime(run.time)} · best combo ${run.bestStreak}`;
  $('over-list').innerHTML = list.map((e, i) => `<li class="${i === rank ? 'mine' : ''}"><span>${i + 1}</span><b>${e.score.toLocaleString()}</b>` +
    `<span>stage ${e.stage}</span><span>${formatDate(e.date)}</span></li>`).join('');
  $('over').classList.remove('hidden');
}
// Put this run on the top-score list (practice runs from ?stage=N aren't saved). Returns the list and where it landed.
function recordRun() {
  const entry = {score: run.score, stars: run.caught, stage: run.stage, time: Math.round(run.time), combo: run.bestStreak, date: new Date().toISOString()};
  if (startStage > 1) return {list: loadScores(), rank: -1};
  const result = rules.addScore(loadScores(), entry);
  saveScores(result.list);
  return result;
}
const formatDate = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'}); };
// The top-score list lives in this browser's storage (it can be missing, e.g. in a private window; then it's just empty).
const SCORES_KEY = 'starcatcher.scores';
function loadScores() { try { return JSON.parse(localStorage.getItem(SCORES_KEY) || '[]'); } catch (_) { return []; } }
function saveScores(list) { try { localStorage.setItem(SCORES_KEY, JSON.stringify(list)); } catch (_) {} }
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function draw(dt) {
  // After a hit the whole picture shakes for a moment (see ouch).
  const shake = run.hurt ? Math.max(0, 1 - run.hurt.t / .4) * 9 * sizeScale : 0;
  ctx.save();
  if (shake) ctx.translate((Math.random() - .5) * shake * 2, (Math.random() - .5) * shake * 2);
  drawScene(dt);
  ctx.restore();
  if (run.hurt) drawHurtFlash(run.hurt.t);
}
function drawScene(dt) {
  drawSea(dt);
  for (const current of run.currents) drawCurrent(current, rules.currentStrength(current));
  drawSquid(run.strikes, seaFloor(), legTip());
  run.stars.forEach(drawStarBubble);
  run.pickups.forEach(drawPickup);
  run.jellies.forEach(jelly => jelly.kind === 'mine' ? drawMine(jelly, Math.max(0, 1 - Math.hypot(fish.x - jelly.x, fish.y - jelly.y) / (rules.MINE_NEAR * sizeScale)))
    : jelly.kind === 'puffer' ? drawPuffer(jelly, fish, rules.pufferSwell(jelly)) : drawJellyfish(jelly, fish));
  for (const school of run.schools) school.warn > 0 ? drawSchoolWarning(school) : school.members.forEach(p => { if (!p.eaten) drawPiranha(p); });
  run.sharks.forEach(drawPatrolShark);
  run.eels.forEach(drawEel);
  drawPlayer();
  if (fish.rainbow > 0) drawRainbowShield(fish, fish.radius * rules.RAINBOW_SIZE, fish.rainbow);
  drawBlasts(run.blasts);
  drawParticles(particles);
  drawFloaters(run.floaters);
}
// The fish or the shark, mid-change if it's changing (see updateMorph).
function drawPlayer() {
  const morph = fish.morph;
  if (!morph) { fish.shark ? drawSharkFish(fish, rules.SHARK_SIZE) : drawFish(fish); return; }
  const half = morph.length / 2, first = morph.t < half, k = Math.min(1, first ? morph.t / half : (morph.t - half) / half);
  const showShark = first ? morph.to === 'fish' : morph.to === 'shark';
  // First half: swell up to 1.35x while shaking harder and glowing brighter. Second half: pop out at 1.35x and bounce back to size.
  const scale = first ? 1 + .35 * k : 1 + .35 * (1 - k) * Math.cos(k * Math.PI * 1.5), glow = first ? k : 1 - k;
  ctx.save();
  ctx.translate(fish.x, fish.y); ctx.scale(scale, scale);
  if (first) ctx.rotate(Math.sin(morph.t * 70) * .18 * k);
  ctx.translate(-fish.x, -fish.y);
  ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 30 * glow;
  showShark ? drawSharkFish(fish, rules.SHARK_SIZE) : drawFish(fish);
  ctx.restore();
}
let last = performance.now();
// The game moves in steady 1/120-second ticks, however fast the screen refreshes, so the same seed plays out the same
// on every phone. 120 a second matches the iPhone's 120 Hz screen, so things move every frame there (at 1/60 they moved
// every other frame, which looked laggy); a 60 Hz screen simply runs two ticks per frame. (A long pause, like switching
// apps, counts as at most a few ticks.)
const TICK = 1 / 120;
let behind = 0;
function frame(now) {
  const elapsed = Math.min(.1, (now - last) / 1000); last = now;
  behind += elapsed;
  while (behind >= TICK) {
    behind -= TICK;
    if (!run.paused && !inMenu) clock += TICK;
    if (!inMenu) update(TICK);
  }
  if (inMenu) idleFish(elapsed);
  draw(elapsed); checkSound(elapsed);
  requestAnimationFrame(frame);
}

// --- The rainbow bubble (Bryan, 2026-10-22): 5 seconds when nothing can hurt the fish, and monsters that touch the
//     bubble get bumped away, so you can clear a path through a crowd. ---
function catchRainbow(bubble) {
  if (fish.shark) { sparkleBurst(particles, bubble.x, bubble.y); return; }  // a shark doesn't need it (it would push away its food)
  fish.rainbow = rules.RAINBOW_TIME;
  sparkleBurst(particles, bubble.x, bubble.y, ['#ff5c5c', '#ffe14d', '#6ee07a', '#4dc3ff', '#e07bff']);
  floater('Rainbow shield!', fish.x, fish.y - fish.radius * 3.2, '#fff6c8', 24);
  rainbowSound(); haptic('rainbow');
}
function updateRainbow(dt) {
  // Bumped monsters drift away from their bump and slow down (this runs whether or not the bubble is still up).
  const fade = Math.exp(-rules.BOUNCE_FADE * dt);
  const coast = (c, move) => { if (!c.bvx && !c.bvy) return; move(c.bvx * dt, c.bvy * dt); c.bvx *= fade; c.bvy *= fade; if (Math.hypot(c.bvx, c.bvy) < 5) c.bvx = c.bvy = 0; };
  for (const c of run.jellies) coast(c, (dx, dy) => { c.x += dx; c.y += dy; });
  for (const school of run.schools) for (const p of school.members) coast(p, (dx, dy) => { p.ox = (p.ox || 0) + dx; p.oy = (p.oy || 0) + dy; });
  for (const c of run.sharks) coast(c, (dx, dy) => { c.x += dx; c.y += dy; });
  for (const c of run.eels) coast(c, (dx, dy) => { c.startX += dx; c.lane += dy; });
  if (!(fish.rainbow > 0)) return;
  fish.rainbow -= dt;
  if (fish.rainbow <= 0) { fish.rainbow = 0; fish.safe = Math.max(fish.safe, .6); popSound(); return; }  // a moment to get clear after it pops
  // Anything touching the bubble gets bumped straight out from the fish (pushed clear of the bubble so it can't stick).
  const radius = fish.radius * rules.RAINBOW_SIZE;
  const bump = (c, size, push) => {
    const b = rules.bounceOff(fish, c, radius, size);
    if (!b) return;
    if (!c.bvx && !c.bvy) boing();
    c.bvx = b.vx; c.bvy = b.vy; push(b.nx * b.overlap, b.ny * b.overlap);
  };
  for (const c of run.jellies) bump(c, c.radius * (c.kind === 'puffer' ? rules.pufferSwell(c) : 1), (dx, dy) => { c.x += dx; c.y += dy; });
  for (const p of livePiranhas()) bump(p, p.radius, (dx, dy) => { p.ox = (p.ox || 0) + dx; p.oy = (p.oy || 0) + dy; p.x += dx; p.y += dy; });
  for (const c of liveSharks()) bump(c, c.radius * 1.2, (dx, dy) => { c.x += dx; c.y += dy; });
  for (const c of liveEels()) {  // an eel is long: it bounces when the part of its body nearest the fish touches the bubble
    const near = rules.eelSegments(c).reduce((best, p) => Math.hypot(p.x - fish.x, p.y - fish.y) < Math.hypot(best.x - fish.x, best.y - fish.y) ? p : best);
    const b = rules.bounceOff(fish, near, radius, c.radius * 1.3);
    if (!b) continue;
    if (!c.bvx && !c.bvy) boing();
    c.bvx = b.vx; c.bvy = b.vy; c.startX += b.nx * b.overlap; c.lane += b.ny * b.overlap;
  }
}

// --- Losing a heart, made hard to miss (Bryan, 2026-10-21): the sound, a red flash round the edges, a shake, "-1 ♥" at
//     the fish, the hearts at the top flashing, a strong vibration; on the last heart, "Last heart!" and a pulsing heart. ---
function ouch() {
  run.hurt = {t: 0};
  hurtSound(); haptic('bump');
  floater('-1 \u2665', fish.x, fish.y - fish.radius * 2.2, '#ff5c6c', 28);
  if (run.hearts === 1) floater('Last heart!', width / 2, height * .45, '#ff8090', 30);
  const hearts = document.getElementById('hearts');
  hearts.classList.remove('hit'); void hearts.offsetWidth; hearts.classList.add('hit');
  updateHud();
}

// --- The Beware sign (Bryan, 2026-10-21): before a stage that brings in a new monster, an old wooden beach sign pops
//     up with its name, a picture and what it does. A tap (or a few seconds) puts it away and the round starts. ---
function showSign(kind) {
  const sign = rules.SIGNS[kind];
  run.sign = {kind, t: 0};
  document.getElementById('sign-title').textContent = sign.title;
  document.getElementById('sign-tip').textContent = sign.tip;
  drawSignPicture(kind);
  document.getElementById('hint').classList.add('under-sign');  // out of the way of "Tap to start"
  const box = document.getElementById('sign');
  box.classList.remove('hidden', 'show'); void box.offsetWidth; box.classList.add('show');
  creak();
}
function closeSign() {
  if (!run.sign) return;
  run.sign = null;
  document.getElementById('sign').classList.add('hidden');
  document.getElementById('hint').classList.remove('under-sign');
  fish.safe = Math.max(fish.safe, rules.RESUME_SAFE);
  startRound();
}
// --- Power-up tips (Bryan, 2026-10-22): the first time a power-up appears, a quick pause with a small card saying what
//     it is; tap to keep going. At most one per stage, and each only once ever on this device, so returning players
//     aren't slowed down. "Show power-up tips again" on the menu forgets which have been seen. ---
const TIPS_KEY = 'starswim.tipsSeen';
const tipsSeen = () => { try { return new Set(JSON.parse(localStorage.getItem(TIPS_KEY)) || []); } catch (_) { return new Set(); } };
function maybeTip(kind) {
  if (!rules.TIPS[kind] || !rules.tipsAllowed(run.stage) || run.tip || run.sign || run.tipStage === run.stage || tipsSeen().has(kind)) return;
  run.tip = {kind}; run.tipStage = run.stage;
  try { localStorage.setItem(TIPS_KEY, JSON.stringify([...tipsSeen(), kind])); } catch (_) {}
  document.getElementById('tip-title').textContent = rules.TIPS[kind].title;
  document.getElementById('tip-text').textContent = rules.TIPS[kind].tip;
  drawTipPicture(kind);
  document.getElementById('hint').classList.add('under-sign');
  const card = document.getElementById('tip');
  card.classList.remove('hidden', 'show'); void card.offsetWidth; card.classList.add('show');
  tone(880, 1175, .18, 'sine', .07);
}
function closeTip() {
  if (!run.tip) return;
  run.tip = null;
  document.getElementById('tip').classList.add('hidden');
  document.getElementById('hint').classList.remove('under-sign');
  fish.safe = Math.max(fish.safe, .5);
}
document.getElementById('menu-tips').addEventListener('pointerdown', event => {
  event.stopPropagation(); haptic('catch');
  try { localStorage.removeItem(TIPS_KEY); } catch (_) {}
  event.currentTarget.textContent = 'Power-up tips will show again';
});
function drawTipPicture(kind) {
  const art = document.getElementById('tip-art'), ratio = window.devicePixelRatio || 1, size = 76;
  art.width = size * ratio; art.height = size * ratio;
  const saved = {ctx, width, height, sizeScale};
  ctx = art.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); width = size; height = size; sizeScale = 1;
  try {
    if (kind === 'gold') drawStarBubble({x: size / 2, y: size / 2, radius: 26, gold: true, phase: 0});
    else drawPickup({kind, x: size / 2, y: size / 2 + (kind === 'jaw' ? 0 : 4), radius: kind === 'jaw' ? 24 : 24, phase: 0});
  } finally { ({ctx, width, height, sizeScale} = saved); }
}

// The picture on the sign: the game's own drawing of the monster, borrowed onto the sign's little canvas.
function drawSignPicture(kind) {
  const art = document.getElementById('sign-art'), ratio = window.devicePixelRatio || 1, w = 200, h = 110;
  art.width = w * ratio; art.height = h * ratio;
  const saved = {ctx, width, height, sizeScale};
  ctx = art.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); width = w; height = h; sizeScale = 1;
  try {
    const fakeFish = {x: w * .8, y: h * .5};
    if (kind === 'squid') drawSquid([{x: w * .78, stage: 'up', reach: 1}], h - 8, 18);
    else if (kind === 'jellyfish' || kind === 'homing') drawJellyfish({x: w / 2, y: h * .38, radius: 28, age: 1, homing: kind === 'homing'}, fakeFish);
    else if (kind === 'puffer') drawPuffer({x: w / 2, y: h / 2, radius: 21, state: 'puff', t: 1}, fakeFish, 2);
    else if (kind === 'piranha') [[-1, .3], [0, .5], [1, .7]].forEach(([k, y]) => drawPiranha({x: w / 2 + k * 42, y: h * y, radius: 17, direction: 1, age: k}));
    else if (kind === 'mine') drawMine({x: w / 2, y: h * .45, radius: 24, age: 0, phase: 0}, .5);
    else if (kind === 'current') drawCurrent({y: h / 2, height: h * .8, direction: 1, state: 'flow'}, 1);
    else if (kind === 'shark') drawPatrolShark({state: 'swim', x: w / 2, y: h / 2, radius: 30, direction: 1, age: 0});
    else if (kind === 'eel') drawEel({kind: 'eel', state: 'swim', direction: 1, startX: -10, lane: h / 2, phase: 2.2, traveled: w * .78 + 10, scale: .62, radius: 6});
  } finally { ({ctx, width, height, sizeScale} = saved); }
}

// --- Hearts, star count, stage and the stage banner ---
function updateHud() {
  const hearts = Math.max(0, run.hearts);  // extra hearts beyond the first 3 just add on
  document.getElementById('hearts').textContent = '♥'.repeat(hearts) + '♡'.repeat(Math.max(0, rules.HEARTS - hearts));
  document.getElementById('hearts').classList.toggle('last', hearts === 1);
  document.getElementById('score').textContent = run.score.toLocaleString();
  // The combo: the multiplier and five dots filling toward the next one (shown once there's a streak going).
  const multiplier = rules.multiplierFor(run.streak), filled = run.streak % rules.COMBO_STEP, combo = document.getElementById('combo');
  combo.innerHTML = multiplier >= rules.MAX_MULTIPLIER ? `<b>x${multiplier}</b> max`
    : `<b>x${multiplier}</b> ${'●'.repeat(filled)}${'○'.repeat(rules.COMBO_STEP - filled)}`;
  combo.classList.toggle('hidden', run.streak === 0);
  document.getElementById('stage').textContent = (mode === 'daily' ? 'Daily · ' : '') + `Stage ${run.stage}`;
}
function announceStage(title = `Stage ${run.stage}`, news = rules.stageNews(run.stage)) {
  const banner = document.getElementById('banner');
  banner.innerHTML = `<b>${title}</b><span>${news}</span>`;
  banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');  // restart the fade
}
function hideHint() { document.getElementById('hint').classList.add('gone'); }

// --- Sounds (made on the fly; no sound files yet). Phones only allow sound after the first touch. ---
// --- Sound. iOS can break the game's sound while the app is in the background (Bryan, 2026-10-21: after leaving mid-game
//     and coming back, no music or sound effects; Little Fin had the same problem). So whenever the game comes back, on
//     every touch, and when the iPhone app says it's active again, check the sound really works, and if not, build it
//     fresh. A watchdog also catches sound that says it's running but has frozen. ---
let audio = null;
function makeSound() {
  try { audio = new AudioContext(); } catch (_) { audio = null; }
  musicGain = null; lastSoundTime = -1; stuckFor = 0;
  if (audio) startMusic();
}
function rebuildSound() {
  const old = audio;
  makeSound();
  try { old?.close(); } catch (_) {}
}
// The first touch starts the sound; later touches repair it if iOS stopped it (a touch always allows a fresh start).
function unlockSound() {
  if (!audio) { haptic('prepare'); makeSound(); return; }
  if (audio.state !== 'running') rebuildSound();
}
// Coming back to the game: try to wake the sound; if it won't wake, the next frame's watchdog or touch rebuilds it.
function recoverSound() {
  if (!audio || document.hidden) return;
  if (audio.state === 'running') return;
  audio.resume().then(() => { if (audio.state !== 'running') rebuildSound(); }, () => rebuildSound());
}
window.StarCatcherSoundRecover = recoverSound;  // the iPhone app calls this when it becomes active or a call ends
// The watchdog, every frame while the game is on screen: if the sound says it's running but its clock hasn't moved for
// 1.5 seconds, it's frozen: rebuild it (at most every 3 seconds, so a broken speaker can't make it loop).
let lastSoundTime = -1, stuckFor = 0, lastRebuild = -10;
function checkSound(dt) {
  if (!audio || document.hidden || audio.state !== 'running') { stuckFor = 0; return; }
  if (audio.currentTime !== lastSoundTime) { lastSoundTime = audio.currentTime; stuckFor = 0; return; }
  if ((stuckFor += dt) > 1.5 && clock - lastRebuild > 3) { lastRebuild = clock; rebuildSound(); }
}

// --- Music: Little Fin's Star Catcher song, looping, started by the first touch. The ♪ button turns it off and on
//     (remembered on this device); the game's sounds stay on either way. ---
const MUSIC_KEY = 'starcatcher.music';
let musicOn = (() => { try { return localStorage.getItem(MUSIC_KEY) !== 'off'; } catch (_) { return true; } })();
// The music volume from the pause screen's slider, remembered on this device (Bryan, 2026-10-21).
const VOLUME_KEY = 'starcatcher.musicVolume';
let musicLevel = (() => { try { const v = parseFloat(localStorage.getItem(VOLUME_KEY)); return Number.isFinite(v) ? v : rules.MUSIC_VOLUME; } catch (_) { return rules.MUSIC_VOLUME; } })();
let musicGain = null, song = null;  // song: the decoded music, kept so a rebuilt sound doesn't have to decode it again
function startMusic() {
  if (!audio || musicGain || !window.StarMusic) return;
  const context = audio, gain = musicGain = context.createGain();
  gain.gain.value = 0; gain.connect(context.destination);
  const decoded = song ? Promise.resolve(song)
    : context.decodeAudioData(Uint8Array.from(atob(window.StarMusic), c => c.charCodeAt(0)).buffer).then(buffer => (song = buffer));
  decoded.then(buffer => {
    if (audio !== context) return;  // the sound was rebuilt meanwhile
    const source = context.createBufferSource(), bounds = rules.soundBounds(buffer.getChannelData(0), buffer.sampleRate);
    source.buffer = buffer; source.loop = true; source.loopStart = bounds.start; source.loopEnd = bounds.end;
    source.connect(gain); source.start(0, bounds.start);
    if (musicOn) fadeMusic(musicLevel, rules.MUSIC_FADE_IN);
  }).catch(() => {});  // no music is better than a broken game
}
function fadeMusic(to, seconds) {
  if (!musicGain) return;
  const now = audio.currentTime, gain = musicGain.gain;
  gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value, now); gain.linearRampToValueAtTime(to, now + seconds);
}
function setMusic(on) {
  musicOn = on;
  try { localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off'); } catch (_) {}
  fadeMusic(on ? musicLevel : 0, on ? .6 : .25);
  showMusicButton();
}
function showMusicButton() {
  const button = document.getElementById('music');
  button.classList.toggle('off', !musicOn);
  button.setAttribute('aria-label', musicOn ? 'Turn music off' : 'Turn music on');
}
// The volume slider (on the pause screen): you hear the new level right away, at full strength rather than the
// paused quiet. Turning it up while the music is off turns the music back on.
const volumeSlider = document.getElementById('volume');
volumeSlider.addEventListener('pointerdown', event => { event.stopPropagation(); unlockSound(); });
volumeSlider.addEventListener('input', () => {
  musicLevel = rules.volumeForSlider(+volumeSlider.value);
  try { localStorage.setItem(VOLUME_KEY, String(musicLevel)); } catch (_) {}
  if (!musicOn && musicLevel > 0) setMusic(true); else fadeMusic(musicOn ? musicLevel : 0, .08);
});
document.getElementById('music').addEventListener('pointerdown', event => {
  event.stopPropagation(); unlockSound(); setMusic(!musicOn); haptic('catch');
});
// Pause the sound while the game isn't on screen (another app, the phone locked), and wake it again on return.
document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) audio.suspend().catch(() => {}); else recoverSound();
});
showMusicButton();
function tone(from, to, length, type = 'sine', volume = .12, delay = 0) {
  if (!audio) return;
  const now = audio.currentTime + delay, osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = type; osc.frequency.setValueAtTime(from, now); osc.frequency.exponentialRampToValueAtTime(to, now + length * .4);
  gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + length);
  osc.connect(gain).connect(audio.destination); osc.start(now); osc.stop(now + length);
}
const ding = () => tone(880, 1320, .25);                       // a star
const goldDing = () => { tone(1175, 1760, .3, 'sine', .14); tone(1568, 2350, .35, 'sine', .08, .07); };  // a gold star
const comboUp = () => [0, .07, .14].forEach((d, i) => tone(660 * [1, 1.25, 1.5][i], 660 * [1, 1.25, 1.5][i], .22, 'triangle', .1, d));  // a higher multiplier
const comboLost = () => tone(440, 260, .3, 'sine', .07);       // the combo ran out
const heartSound = () => [523, 659, 784].forEach((f, i) => tone(f, f, .3, 'sine', .1, i * .08));  // an extra heart
const sharkSound = () => { tone(180, 520, .5, 'sawtooth', .07); tone(260, 780, .5, 'triangle', .08, .05); };  // turning into a shark
const poof = () => { tone(900, 300, .25, 'triangle', .1); tone(1400, 2200, .2, 'sine', .06, .03); };   // the flash of changing
const rattle = () => [0, .09, .18].forEach(d => tone(520, 380, .07, 'square', .05, d));         // a pufferfish shaking
const puffSound = () => { tone(140, 420, .3, 'triangle', .14); tone(300, 700, .25, 'sine', .06, .04); };   // ...and puffing up
const alarm = () => { tone(880, 880, .12, 'square', .05); tone(880, 880, .12, 'square', .05, .2); };      // a piranha school is coming
const sharkWhoosh = () => { tone(240, 90, .45, 'sawtooth', .06); tone(160, 70, .5, 'triangle', .08); };  // a shark swims in
const goSound = () => { tone(523, 523, .12, 'triangle', .1); tone(784, 1046, .3, 'triangle', .12, .12); };  // "Go!"
const crackle = () => [0, .05, .1, .16].forEach(d => tone(1800 + Math.random() * 900, 900, .04, 'square', .04, d));  // an eel's spark
const zap = () => { tone(900, 160, .25, 'sawtooth', .06); tone(1400, 300, .2, 'square', .03, .02); };  // ...and in it zips
const creak = () => { tone(180, 140, .35, 'triangle', .06); tone(260, 220, .3, 'sine', .04, .12); };   // the wooden sign pops up
const rainbowSound = () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, f * 1.01, .25, 'sine', .08, i * .06));  // the rainbow bubble
let lastBoing = 0;
const boing = () => { if (clock - lastBoing < .12) return; lastBoing = clock; tone(300, 620, .16, 'sine', .07); };  // a monster bounces off it
const popSound = () => { tone(900, 300, .12, 'triangle', .08); };  // ...and it pops
const mineBoom = () => { tone(130, 45, .45, 'sawtooth', .12); tone(80, 35, .5, 'triangle', .16); };  // a sea mine going off
const currentSound = () => { tone(110, 170, .9, 'triangle', .09); tone(220, 330, .8, 'sine', .03, .1); };  // a current starts to flow
const chomp = () => { tone(420, 140, .09, 'square', .08); tone(380, 120, .09, 'square', .07, .1); };     // chomp-chomp
const boom = () => { tone(160, 40, .6, 'sawtooth', .18); tone(90, 30, .7, 'triangle', .25); };   // a bomb
// Losing a heart (Bryan, 2026-10-21: it was hard to tell): a loud falling "ouch", a deep thump, and the music dips.
const hurtSound = () => {
  tone(620, 160, .32, 'square', .16); tone(480, 120, .38, 'sawtooth', .1, .03); tone(110, 45, .45, 'triangle', .35);
  if (musicOn && musicGain) { fadeMusic(musicLevel * .3, .05); setTimeout(() => { if (!run.paused) fadeMusic(musicLevel, .7); }, 450); }
};
const whoosh = () => tone(300, 520, .3, 'sawtooth', .04);      // a squid leg shoots up
const chime = () => { tone(660, 660, .3, 'sine', .08); tone(990, 990, .4, 'sine', .08, .12); };  // a new stage
// Vibrations: in the iPhone app the game names the moment and the app plays its own feel for it (see
// StarCatcher/StarCatcherApp.swift). In a browser only some Android phones can vibrate, and only for bumps.
function haptic(effect) {
  try { if (window.webkit?.messageHandlers?.starCatcherHaptics) { window.webkit.messageHandlers.starCatcherHaptics.postMessage(effect); return; } } catch (_) {}
  if (effect === 'bump' && audio) try { navigator.vibrate?.(60); } catch (_) {}
}

window.addEventListener('resize', fitCanvas);
fitCanvas(); if (startStage > 1) startGame('play'); else showMenu();  // ?stage=N (practice) skips the menu
requestAnimationFrame(frame);
