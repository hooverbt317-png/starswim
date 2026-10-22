/* StarSwim rules (the game was called Star Catcher until 2026-10-21): the numbers and small calculations, kept apart from the drawing so they can be tuned in one place
   and checked by the tests (tests/rules.test.js). game.js uses them.
   Step 1 (2026-10-21): the fish and the falling stars, with the new controls.
   Step 2 (2026-10-21): jellyfish, homing jellyfish, the squid, 3 hearts and never-ending stages (by stars caught).
   Step 3 (2026-10-21): points with a combo multiplier, gold stars and a top-score list. */
(function(root) {
  // --- Controls: the fish sits just above the finger and follows it closely (Bryan's pick, 2026-10-21) ---
  const FINGER_OFFSET = 25;   // on a touch screen the fish stays this many points above the fingertip, so the thumb doesn't hide it
                              // (Bryan on his iPhone, 2026-10-21: 70 was too far, didn't feel in control; 40 still a little far)
  const FOLLOW_RATE = 28;     // how snappily the fish closes the gap to its spot (bigger = tighter; 28 covers 90% in about 0.08 s)
  const MAX_SPEED = 1600;     // points per second at most, so tapping far away is a quick swim, not a teleport

  // Where the fish wants to be for a finger (or mouse) at x, y: just above a finger, right on a mouse pointer, and
  // always fully inside the play area.
  function fishTarget(x, y, isTouch, area, radius) {
    const ty = isTouch ? y - FINGER_OFFSET : y;
    return {x: clamp(x, area.left + radius, area.right - radius), y: clamp(ty, area.top + radius, area.bottom - radius)};
  }
  // One frame of swimming: move from `fish` toward `target`, quickly but never faster than MAX_SPEED.
  function follow(fish, target, dt) {
    const dx = target.x - fish.x, dy = target.y - fish.y, distance = Math.hypot(dx, dy);
    if (distance < .5) return {x: target.x, y: target.y};
    const step = Math.min(distance * (1 - Math.exp(-FOLLOW_RATE * dt)), MAX_SPEED * dt);
    return {x: fish.x + dx / distance * step, y: fish.y + dy / distance * step};
  }

  // --- Stars ---
  const STAR_GAP = .7;                  // a new star bubble about every 0.7 seconds
  const STAR_SPEED = [70, 110];         // falling speed range, points per second (Little Fin: 45-70)
  const STAR_RADIUS = 22;
  // Caught when the fish's body overlaps most of the bubble (same feel as Little Fin).
  const touchesStar = (fish, star) => Math.hypot(fish.x - star.x, fish.y - star.y) < fish.radius + star.radius * .75;

  // --- Stages: a new stage for every 25 stars caught (Bryan, 2026-10-21; it was every 25 seconds, then 15 stars) ---
  // The intro stages are shorter (Bryan, 2026-10-21): 15 stars each, then 25.
  const STARS_PER_STAGE = 25;
  const STARS_PER_INTRO = 15;
  const INTRO_STAGES = 9;  // stages 1-9 (the squid, then each monster)
  const starsIn = stage => stage <= INTRO_STAGES ? STARS_PER_INTRO : STARS_PER_STAGE;
  // Stars caught before a stage starts (stage 1: 0, stage 2: 15, ..., stage 10: 135, stage 11: 160, ...).
  const starsBefore = stage => stage <= INTRO_STAGES + 1 ? (stage - 1) * STARS_PER_INTRO
    : INTRO_STAGES * STARS_PER_INTRO + (stage - INTRO_STAGES - 1) * STARS_PER_STAGE;
  function stageFor(stars) {
    stars = Math.max(0, stars);
    if (stars < INTRO_STAGES * STARS_PER_INTRO) return 1 + Math.floor(stars / STARS_PER_INTRO);
    return INTRO_STAGES + 1 + Math.floor((stars - INTRO_STAGES * STARS_PER_INTRO) / STARS_PER_STAGE);
  }

  // --- The course (Bryan, 2026-10-21): the same for everyone, so scores can be compared (a leaderboard, head to head).
  //     The squid is on every stage. Stage 1: the squid alone; stages 2-9 bring in one new monster each, announced by a
  //     "Beware" sign; stages 10-37: every pair of monsters (+ squid); stages 38-93: every trio (+ squid). Pairs and trios
  //     go from gentler to nastier. After stage 93 the trios repeat. ---
  // (Bryan, 2026-10-22: currents moved up to stage 3, and the shark is the last intro.)
  const INTRO_ORDER = ['squid', 'jellyfish', 'current', 'homing', 'puffer', 'piranha', 'mine', 'eel', 'shark'];  // stages 1-9
  // The 8 besides the squid, in the order the pairs and trios were first laid out in (it breaks ties in TOUGHNESS, so
  // keeping it means reordering the intros doesn't change stages 10-93).
  const MONSTERS = ['jellyfish', 'homing', 'puffer', 'piranha', 'mine', 'current', 'shark', 'eel'];
  // How tough each monster is on its own, to put the gentler combinations first (ties keep the intro order).
  const TOUGHNESS = {jellyfish: 1, homing: 2, mine: 2, puffer: 3, current: 3, piranha: 3, eel: 4, shark: 4};
  function combinations(size, from = 0) {
    if (size === 0) return [[]];
    const all = [];
    for (let i = from; i <= MONSTERS.length - size; i++) for (const rest of combinations(size - 1, i + 1)) all.push([MONSTERS[i], ...rest]);
    return all;
  }
  const byToughness = groups => groups.map((group, i) => ({group, i, score: group.reduce((sum, kind) => sum + TOUGHNESS[kind], 0)}))
    .sort((a, b) => a.score - b.score || a.i - b.i).map(x => x.group);
  const PAIRS = byToughness(combinations(2));   // 28 of them: stages 10-37
  const TRIOS = byToughness(combinations(3));   // 56 of them: stages 38-93, then again
  const PAIRS_FROM = INTRO_ORDER.length + 1, TRIOS_FROM = PAIRS_FROM + PAIRS.length, LAST_STAGE = TRIOS_FROM + TRIOS.length - 1;
  // What's in a stage: {kinds: ['squid', ...], intro: the monster it introduces (or null), group, place: how far through
  // its group (0 at the start, nearly 1 at the end)}.
  function course(stage) {
    if (stage < PAIRS_FROM) {
      const intro = INTRO_ORDER[Math.max(1, stage) - 1];
      return {intro, kinds: intro === 'squid' ? ['squid'] : ['squid', intro], group: 'intro', place: 0};
    }
    if (stage < TRIOS_FROM) return {intro: null, kinds: ['squid', ...PAIRS[stage - PAIRS_FROM]], group: 'pairs', place: (stage - PAIRS_FROM) / PAIRS.length};
    const i = (stage - TRIOS_FROM) % TRIOS.length;
    return {intro: null, kinds: ['squid', ...TRIOS[i]], group: 'trios', place: i / TRIOS.length};
  }
  const has = (stage, kind) => course(stage).kinds.includes(kind);
  const FALLING = ['jellyfish', 'homing', 'puffer', 'mine'];      // the monsters that sink down from the top
  const fallingKinds = stage => course(stage).kinds.filter(kind => FALLING.includes(kind));
  // With more monsters on screen each one comes a little less often (1 for a single monster, 1.3 for two, 1.6 for three).
  const mixSpacing = stage => 1 + .3 * (course(stage).kinds.length - 2);
  // How much busier (more often) and quicker (faster) things are: 2% more each stage, with no top (Bryan, 2026-10-21; it
  // was 12% and 5%, then 6% and 3%, then 1%: he reached stage 84 and the fun only came near the end). An intro stage is a
  // little calmer, so the new monster is a lesson.
  const SPEED_UP = 1.02;
  const INTRO_CALM = .85;
  const busier = stage => Math.pow(SPEED_UP, stage - 1) * (stage > 1 && course(stage).intro ? INTRO_CALM : 1);
  const quicker = stage => Math.pow(SPEED_UP, stage - 1);
  // The shark break comes at the end of every stage from the last intro on (Bryan, 2026-10-21: not between the intros;
  // there the leftover monsters just vanish and the next sign comes up).
  const sharkBreakAfter = stage => stage >= INTRO_STAGES;
  // A clear start and end to each stage (Bryan, 2026-10-21): an intro stage ends with everything popping away and
  // "Stage N complete!" for a moment of empty sea; every stage starts with its banner and a short calm "Ready..." before
  // "Go!" and the first stars and monsters.
  const STAGE_DONE_PAUSE = 1.6;   // seconds of empty sea after "Stage N complete!"
  const READY_TIME = 1.4;         // seconds of "Ready..." before "Go!"
  const NAMES = {squid: 'the squid', jellyfish: 'jellyfish', homing: 'homing jellyfish', puffer: 'pufferfish',
    piranha: 'piranhas', mine: 'sea mines', current: 'currents', shark: 'sharks', eel: 'electric eels'};
  // The line under "Stage N": the new monster, or what's mixed together this stage.
  function stageNews(stage) {
    const {intro, kinds} = course(stage);
    if (intro) return intro === 'squid' ? 'Catch the stars!' : `New: ${NAMES[intro]}!`;
    const names = kinds.filter(kind => kind !== 'squid').map(kind => NAMES[kind]);
    const list = names.slice(0, -1).join(', ') + ' and ' + names.at(-1);
    return list[0].toUpperCase() + list.slice(1) + '!';
  }
  // The "Beware" beach sign before each intro stage: the monster's name and what it does.
  const SIGNS = {
    squid: {title: 'The Squid', tip: 'Lurks on the sea floor. When a glowing dotted line appears, a leg is about to shoot up!'},
    jellyfish: {title: 'Jellyfish', tip: 'They drift down slowly. Bump one and it stings!'},
    homing: {title: 'Homing Jellyfish', tip: 'The coral ones follow you while they\'re above you. Lead them, then slip past.'},
    puffer: {title: 'Pufferfish', tip: 'Get too close and they shake... then puff up big and spiky!'},
    piranha: {title: 'Piranhas', tip: 'Red arrows on one side mean a school is coming. Find the gap!'},
    mine: {title: 'Sea Mines', tip: 'Slow and steady. Touch one and BOOM.'},
    current: {title: 'Currents', tip: 'Faint streaks show where the water will push you sideways. Fight it or get out!'},
    shark: {title: 'Sharks', tip: 'A red arrow marks their lane. They swim back and forth, so stay out of the way!'},
    eel: {title: 'Electric Eels', tip: 'They zip in from the side, twisting up and down. A yellow spark on the wall shows where one is coming!'},
  };
  // Power-up tips (Bryan, 2026-10-22): the first time each power-up appears, the game pauses for a moment with a small
  // card saying what it is. At most one per stage, and each only once ever on a device (returning players don't see them).
  const TIPS = {
    gold: {title: 'Gold Star', tip: 'Rare and fast. Worth 5 stars, and missing one won\'t break your combo.'},
    heart: {title: 'Heart', tip: 'One more life (up to 5). With a full row, it\'s 100 bonus points.'},
    bomb: {title: 'TNT', tip: 'Catch it to blow up every monster around you.'},
    bombH: {title: 'Sideways TNT', tip: 'Blasts a bar right across the screen at that height.'},
    bombV: {title: 'Up-and-down TNT', tip: 'Blasts a column from top to bottom.'},
    rainbow: {title: 'Rainbow Bubble', tip: '5 seconds where nothing can hurt you. Monsters bounce right off!'},
    jaw: {title: 'Shark Jaw', tip: 'Eat it to become a shark, and chomp the leftover monsters for bonus points!'},
  };
  // The tutorial schedule (Bryan, 2026-10-22: every power-up tip during the intro stages, none after): in stages 1-6 one
  // power-up is sure to appear a few seconds after "Go!" (for everyone, so it's part of the fixed course); the shark jaw
  // comes at the end of stage 9 as always. During the intros TNT and rainbow bubbles come only from this schedule, so
  // nothing steals a stage's one tip; from stage 10 they drop on their usual random timers, and no tips show at all.
  const TUTORIAL = {1: 'gold', 2: 'heart', 3: 'bomb', 4: 'bombH', 5: 'bombV', 6: 'rainbow'};
  const TUTORIAL_AT = 4;                              // seconds after "Go!"
  const tipsAllowed = stage => stage <= INTRO_STAGES;
  const randomPickupsAt = stage => stage > INTRO_STAGES;  // TNT and rainbow bubbles on their timers
  const BOMB_AFTER_INTROS = 8, RAINBOW_AFTER_INTROS = 25; // seconds into stage 10 before the first of each
  const SIGN_AUTO = 6;  // seconds before the sign goes away by itself (a tap starts the round sooner)

  // --- Hearts and bumps ---
  const HEARTS = 3;
  const SAFE_AFTER_BUMP = 1.5;  // seconds the fish blinks and can't be hit again
  const RESUME_SAFE = 1;       // after a pause, the fish can't be hit for this long (time to find it again)
  const RESTART_PAUSE = .8;     // after the last heart, taps are ignored this long so a stray tap doesn't restart at once

  // --- Jellyfish ---
  const JELLY_RADIUS = 22;
  const jellyGap = stage => 2.2 / busier(stage);         // seconds between jellyfish (2.2 s, then 1.96, 1.75, ...)
  const jellySpeed = stage => 50 * quicker(stage);       // falling speed, points per second (Little Fin starts at 34)
  // Homing jellyfish (coral colored; stage 3 introduces them).
  const HOMING_FALL = .8;                                // they sink a little slower than the others...
  const homingPull = stage => 45 * quicker(stage);       // ...and drift sideways toward the fish at this speed
  // A homing jellyfish only steers while it is still above the fish; once it has passed, it just sinks (so you can dodge it).
  function homingDrift(jelly, fish, stage, dt) {
    if (jelly.y > fish.y) return 0;
    const gap = fish.x - jelly.x, step = homingPull(stage) * dt;
    return Math.abs(gap) < step ? gap : Math.sign(gap) * step;
  }

  // --- Pufferfish (Bryan, 2026-10-21; stage 4 introduces them). A pufferfish drifts down;
  //     when the fish comes near, it shakes (the warning), then blows up big and spiky for a moment, shrinks back, and
  //     rests before it can puff again. ---
  const PUFFER_RADIUS = 20;
  const PUFFER_FALL = .8;       // they sink a little slower than jellyfish did
  const PUFF_TRIGGER = 115;     // points: the fish this close (center to center) sets a pufferfish off
  const PUFF_SHAKE = .6;        // seconds of shaking before it puffs: your warning
  const PUFF_GROW = .15;        // seconds to blow up
  const PUFF_HOLD = 1.4;        // seconds it stays puffed up
  const PUFF_SHRINK = .4;       // seconds to shrink back
  const PUFF_REST = 1.5;        // seconds before it can puff again
  const PUFF_SIZE = 2.1;        // how much bigger it gets
  // One step of a pufferfish's mood: drift -> shake -> puff -> shrink -> rest -> drift. `distance` is to the fish.
  function pufferStep(puffer, distance, dt) {
    puffer.t += dt;
    const next = {drift: null, shake: PUFF_SHAKE, puff: PUFF_GROW + PUFF_HOLD, shrink: PUFF_SHRINK, rest: PUFF_REST}[puffer.state];
    if (puffer.state === 'drift') { if (distance < PUFF_TRIGGER) { puffer.state = 'shake'; puffer.t = 0; } return; }
    if (puffer.t < next) return;
    puffer.t = 0;
    puffer.state = {shake: 'puff', puff: 'shrink', shrink: 'rest', rest: 'drift'}[puffer.state];
  }
  // How swollen it is right now (1 = normal, PUFF_SIZE = all the way).
  function pufferSwell(puffer) {
    if (puffer.state === 'puff') return 1 + (PUFF_SIZE - 1) * Math.min(1, puffer.t / PUFF_GROW);
    if (puffer.state === 'shrink') return PUFF_SIZE - (PUFF_SIZE - 1) * Math.min(1, puffer.t / PUFF_SHRINK);
    return 1;
  }
  const pufferTouches = (puffer, fish) => Math.hypot(fish.x - puffer.x, fish.y - puffer.y) < puffer.radius * pufferSwell(puffer) * .95 + fish.radius * .85;

  // --- Piranha schools (Bryan, 2026-10-21; stage 5 introduces them): now and then arrows flash on one side, then a wavy column of
  //     piranhas swims across with one gap in it. Slip through the gap or go around the ends. ---
  const schoolGap = stage => 9 / busier(stage) * mixSpacing(stage);   // seconds between schools (about 8 s at stage 5)
  const FIRST_SCHOOL = 4;                                 // seconds into a stage before the first one
  const SCHOOL_WARN = 1.3;                                // seconds of warning arrows before it swims in
  const schoolSpeed = stage => 115 * quicker(stage);      // points per second across the screen
  const PIRANHA_RADIUS = 15;
  const SCHOOL_SPACING = 38;                              // points between piranhas in the column
  const SCHOOL_COVER = [.5, .7];                          // the column covers this share of the play area's height
  const SCHOOL_GAP = 2;                                   // piranhas missing from the column to make the gap
  // Where the piranhas sit in a new column, top to bottom: [{y, gap}] with the gap somewhere in the middle part.
  // `cover`, `place` and `gapAt` are 0-1 picks (random in the game, fixed in the tests).
  // With `center` (the fish's height; Bryan, 2026-10-21: side monsters seek out the player) the column is centered on it,
  // as far as the play area allows; `place` is then not used.
  function schoolLayout(top, bottom, cover, place, gapAt, spacing = SCHOOL_SPACING, center = null) {
    const span = (bottom - top) * (SCHOOL_COVER[0] + (SCHOOL_COVER[1] - SCHOOL_COVER[0]) * cover);
    const count = Math.max(SCHOOL_GAP + 3, Math.round(span / spacing) + 1), height = (count - 1) * spacing;
    const first = center === null ? top + (bottom - top - height) * place : clamp(center - height / 2, top, Math.max(top, bottom - height));
    const choices = count - SCHOOL_GAP - 1, gapStart = 1 + Math.min(choices - 1, Math.floor(gapAt * choices));  // never the very first or last slot
    return Array.from({length: count}, (_, i) => ({y: first + i * spacing, gap: i >= gapStart && i < gapStart + SCHOOL_GAP}));
  }
  const piranhaTouches = (piranha, fish) => Math.hypot(fish.x - piranha.x, fish.y - piranha.y) < piranha.radius + fish.radius * .75;

  // --- Sea mines (Bryan, 2026-10-21; they replaced the octopuses, which were too tough): stage 6 introduces them. Spiky mines on short broken chains sink slowly. They never lunge, but a current
  //     sweeps them sideways, so the safe spots keep moving. Bumping one costs a heart and blows it up. ---
  const MINE_RADIUS = 19;
  const MINE_FALL = .55;          // they sink slowly...
  const MINE_SPACING = 1.15;      // ...and come a little less often than jellyfish (this times the usual gap)
  const MINE_CARRY = .7;          // how much of a current's push carries a mine along (1 = as much as the fish)
  const MINE_NEAR = 130;          // points: closer than this, a mine's red light blinks faster (just a warning look)
  const mineTouches = (mine, fish) => Math.hypot(fish.x - mine.x, fish.y - mine.y) < mine.radius * 1.05 + fish.radius * .8;

  // --- Currents (Bryan, 2026-10-21; stage 7 introduces them). Faint streaks show a
  //     band across the screen first; then the current flows and pushes the fish sideways while it's inside, so you
  //     have to fight it with your finger. Out of the current, the fish drifts back under your finger. ---
  const currentGap = stage => 8 / quicker(stage) * mixSpacing(stage);  // seconds between currents (about 6.6 s at stage 7)
  const FIRST_CURRENT = 3;
  const CURRENT_WARN = 1;          // seconds of faint streaks before it flows
  const CURRENT_FLOW = 4;          // seconds it flows
  const CURRENT_FADE = .8;         // seconds it fades out
  const CURRENT_HEIGHT = 120;      // points: how tall the band is
  const CURRENT_PUSH = 170;        // points per second the fish is pushed while inside
  // From the trios (stage 38; Bryan, 2026-10-21: the later stages felt too easy) currents are fiercer: they push harder
  // and flow longer. (They always start right where the fish is.)
  const CURRENT_FIERCE_STAGE = TRIOS_FROM;  // stage 38: the trios
  const currentPushAt = stage => stage >= CURRENT_FIERCE_STAGE ? 260 : CURRENT_PUSH;
  const currentFlowAt = stage => stage >= CURRENT_FIERCE_STAGE ? 5 : CURRENT_FLOW;
  const currentAimsAt = stage => true;  // the band is centered on the fish when it appears (every stage now: Bryan, 2026-10-21)
  const DRIFT_RECOVER = 2.5;       // how quickly the fish drifts back under the finger once out (bigger = quicker)
  function currentStrength(current) {
    if (current.state === 'flow') return 1;
    if (current.state === 'fade') return Math.max(0, 1 - current.t / CURRENT_FADE);
    return 0;
  }
  const inCurrent = (current, y) => Math.abs(y - current.y) < current.height / 2;
  // The fish's sideways drift from currents: grows while pushed, eases back to 0 when not.
  const driftStep = (drift, push, dt) => push ? drift + push * dt : drift * Math.exp(-DRIFT_RECOVER * dt);

  // --- Sharks (Bryan, 2026-10-21; stage 8 introduces them). An arrow flashes on one edge, then a shark swims in along a lane,
  //     turns around at the far wall (you see it flip), comes back, and so on: three crossings, then it swims off.
  //     Up to two at a time, in different lanes. ---
  const SHARK_RADIUS = 22;
  const MAX_SHARKS = 2;
  const sharkGap = stage => 5 / Math.sqrt(quicker(stage)) * mixSpacing(stage);  // seconds between new sharks (about 4.5 s at stage 8)
  const FIRST_SHARK = 2;
  const SHARK_WARN = 1.2;                                       // seconds of warning arrow before it swims in
  const sharkSpeed = stage => 150 * Math.sqrt(quicker(stage));  // points per second (about 165 at stage 8)
  const SHARK_PASSES = 3;                                       // crossings before it leaves
  const SHARK_TURN = .35;                                       // seconds to turn around at a wall
  const SHARK_LANE_GAP = 3.2;                                   // two sharks' lanes are at least this many shark radii apart
  // A lane (height) for a new shark between top and bottom, away from the other sharks' lanes. `pick` is 0-1.
  // With `prefer` (the fish's height) it tries that first, then nearby heights a little above and below.
  function sharkLane(top, bottom, pick, otherLanes, radius, prefer = null) {
    const near = prefer === null ? [] : Array.from({length: 9}, (_, i) => clamp(prefer + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * radius * SHARK_LANE_GAP / 2, top, bottom));
    const tries = [...near, ...Array.from({length: 12}, (_, i) => top + (bottom - top) * ((pick + i / 12) % 1))];
    return tries.find(y => otherLanes.every(o => Math.abs(o - y) >= radius * SHARK_LANE_GAP)) ?? tries[0];
  }
  // One step of a shark: warn (arrow) -> swim -> turn at the wall -> swim back ... -> after the last crossing it swims
  // off and is 'gone'. `width` is the screen's width; `speed` in points per second.
  // With `aimY` (the fish's height, kept inside the play area by the game), a turning shark glides to that height while
  // it turns, so it comes back at the fish (Bryan, 2026-10-21: side monsters seek out the player).
  function sharkStep(shark, width, speed, dt, aimY = null) {
    shark.t += dt;
    if (shark.state === 'warn') { if (shark.t >= SHARK_WARN) { shark.state = 'swim'; shark.t = 0; } return; }
    if (shark.state === 'turn') {
      if (shark.toY !== undefined) { const k = Math.min(1, shark.t / SHARK_TURN), ease = k * k * (3 - 2 * k); shark.y = shark.fromY + (shark.toY - shark.fromY) * ease; }
      if (shark.t >= SHARK_TURN) { shark.state = 'swim'; shark.t = 0; shark.direction *= -1; }
      return;
    }
    shark.x += shark.direction * speed * dt;
    const nose = shark.radius * 1.7, offLeft = shark.x < -shark.radius * 3, offRight = shark.x > width + shark.radius * 3;
    if (shark.passesLeft > 1 && ((shark.direction > 0 && shark.x > width - nose) || (shark.direction < 0 && shark.x < nose))) {
      shark.passesLeft--; shark.state = 'turn'; shark.t = 0;
      if (aimY !== null) { shark.fromY = shark.y; shark.toY = aimY; }
    } else if (shark.passesLeft <= 1 && (offLeft || offRight)) shark.state = 'gone';
  }
  // The shark's body as two overlapping circles (front and back half), so a bump matches the drawing well enough.
  function sharkTouches(shark, fish) {
    const r = shark.radius, facing = shark.state === 'turn' ? 0 : shark.direction;
    return [.55, -.55].some(k => Math.hypot(fish.x - (shark.x + facing * k * r), fish.y - shark.y) < r * .78 + fish.radius * .75);
  }

  // --- Electric eels (Bryan, 2026-10-21; stage 9 introduces them): a yellow spark flickers on one wall, then an eel zips
  //     in from that side and across the screen on a twisting path, up and down like a snake, and out the other side. ---
  const EEL_THICK = 9;               // points: how thick the eel's body is (its radius)
  const EEL_SEGMENTS = 11;           // body pieces from head to tail...
  const EEL_SPACING = 11;            // ...this many points apart (so the eel is about 110 points long)
  const EEL_WAVE = 230;              // points along the path for one full up-and-down twist
  const EEL_SWING = 75;              // points it swings up and down from its middle line
  const EEL_WARN = 1;                // seconds of the spark before it comes in
  const eelGap = stage => 6 / busier(stage) * mixSpacing(stage);   // seconds between eels (about 4.4 s at stage 9)
  const FIRST_EEL = 2;
  const eelSpeed = stage => 190 * Math.sqrt(quicker(stage));       // points per second along its path
  // Where each piece of an eel is: the head has gone `traveled` points along the path from where it entered (at
  // `startX`, moving `direction`, twisting around the height `lane`), and every piece behind follows a little later.
  function eelSegments(eel) {
    return Array.from({length: EEL_SEGMENTS}, (_, i) => {
      const d = eel.traveled - i * EEL_SPACING * eel.scale;
      return {x: eel.startX + eel.direction * d, y: eel.lane + Math.sin(d / (EEL_WAVE * eel.scale) * Math.PI * 2 + eel.phase) * EEL_SWING * eel.scale};
    });
  }
  // A bump with any piece of the body counts (the head is a little bigger).
  const eelTouches = (eel, fish) => eelSegments(eel).some((piece, i) =>
    Math.hypot(fish.x - piece.x, fish.y - piece.y) < EEL_THICK * eel.scale * (i ? 1 : 1.3) + fish.radius * .75);
  // Gone once its tail has left the far side.
  const eelGone = (eel, width) => { const tail = eelSegments(eel).at(-1); return eel.direction > 0 ? tail.x > width + 40 : tail.x < -40; };

  // --- The squid on the sea floor ---
  const strikeGap = stage => 5 / busier(stage);          // seconds of calm after a strike before the next one
  // Legs per strike (Bryan, 2026-10-21): 1 through the intros; through the pairs 1, then 2, then 3 (a third of the way
  // each); then back to 1 for the trios and up to 3 again.
  const legsFor = stage => { const {group, place} = course(stage); return group === 'intro' ? 1 : 1 + Math.floor(place * 3); };
  const LEG_ROOM = 90;                                   // legs are always at least this far apart, so there's a gap to swim through
  const maxLegs = width => Math.max(1, Math.floor((width - 80) / LEG_ROOM));
  const warnTime = stage => Math.max(.7, 1.2 / quicker(stage));   // the glow and dotted line before a leg shoots up
  const legStagger = stage => Math.max(.25, .6 / busier(stage));  // seconds between the legs of one strike
  const RISE = 2.5;        // how fast a leg shoots up (share of its height per second)
  const LEG_UP = 1.6;      // seconds a leg stays up
  const LEG_REACH = .25;   // a raised leg reaches up to a quarter of the way down from the top of the screen

  // --- Score (step 3): points, a combo multiplier and gold stars ---
  // Each star is worth 10 points times the combo multiplier. Every 5 stars caught in a row raise the multiplier by one
  // (catches 1-5 are x1, 6-10 x2, ... up to x5). Letting a star fall past, or a bump, ends the combo.
  const STAR_POINTS = 10;
  const COMBO_STEP = 5;
  const MAX_MULTIPLIER = 5;
  const multiplierFor = streak => Math.min(MAX_MULTIPLIER, 1 + Math.floor(Math.max(0, streak) / COMBO_STEP));  // streak: catches in a row so far
  // Gold stars: about 1 in 12 stars, falling much faster, worth 5 normal stars (times the combo). Missing a gold star
  // doesn't end the combo (it's a bonus chance), and it counts as one star toward the next stage.
  const GOLD_CHANCE = 1 / 12;
  const GOLD_SPEED = 1.9;
  const GOLD_POINTS = 50;
  const pointsFor = (gold, streak) => (gold ? GOLD_POINTS : STAR_POINTS) * multiplierFor(streak);

  // --- Extra hearts and bombs (Bryan, 2026-10-21) ---
  // A heart bubble falls after every 15 stars caught; catching it gives back a heart (5 at most; when full it's worth
  // bonus points instead). Missing it costs nothing.
  const HEART_EVERY = 15;
  const MAX_HEARTS = 5;
  const FULL_HEART_POINTS = 100;
  const heartDue = (caughtBefore, caughtAfter) => Math.floor(caughtAfter / HEART_EVERY) > Math.floor(caughtBefore / HEART_EVERY);
  // A cartoon bomb falls now and then (the first after 15 seconds, then every 18-28 seconds). Catching it clears out
  // every jellyfish within BLAST_RADIUS points of the catch, each worth a few points. It never hurts the fish.
  const FIRST_BOMB = 15;
  const BOMB_GAP = [18, 28];
  const BLAST_RADIUS = 170;
  const BLAST_POINTS = 25;  // per jellyfish cleared
  const inBlast = (blast, jelly, radius = BLAST_RADIUS) => Math.hypot(jelly.x - blast.x, jelly.y - blast.y) < radius + jelly.radius;
  // Two more kinds of TNT (Bryan, 2026-10-21): one blasts a horizontal bar right across the screen at its height, the
  // other a vertical bar from top to bottom. A falling bomb is one of the three, picked by the seed.
  const BOMB_KINDS = ['bomb', 'bombH', 'bombV'];
  const BAR_HALF = 40;  // points: the bar reaches this far either side of the catch (80 points thick, plus the creature's size)
  // Is a creature caught in a bar blast? `axis` 'h' (a horizontal bar: same height) or 'v' (vertical: same x).
  const inBar = (blast, creature, axis, half = BAR_HALF) =>
    Math.abs(axis === 'h' ? creature.y - blast.y : creature.x - blast.x) < half + creature.radius;
  // The rainbow bubble (Bryan, 2026-10-22): a rarer pickup. Catch it and a rainbow bubble surrounds the fish for 5
  // seconds: nothing can hurt it, and monsters that touch the bubble get bumped away, so you can clear a path.
  const FIRST_RAINBOW = 40;          // seconds of play before the first one...
  const RAINBOW_GAP = [35, 50];      // ...then one every 35-50 seconds (picked by the seed)
  const RAINBOW_TIME = 5;            // seconds the bubble lasts
  const RAINBOW_WARN = 1.2;          // it flickers for this long before it pops
  const RAINBOW_SIZE = 2.4;          // the bubble's radius, in fish radii
  const BOUNCE_SPEED = 260;          // points per second a monster is bumped away at...
  const BOUNCE_FADE = 4;             // ...slowing down quickly (bigger = shorter bounce)
  // If a creature touches the bubble, how fast it's bumped away (straight out from the fish's center), else null.
  function bounceOff(fish, creature, bubbleRadius, creatureRadius = creature.radius) {
    const dx = creature.x - fish.x, dy = creature.y - fish.y, d = Math.hypot(dx, dy);
    if (d >= bubbleRadius + creatureRadius) return null;
    const nx = d ? dx / d : 0, ny = d ? dy / d : -1;
    return {vx: nx * BOUNCE_SPEED, vy: ny * BOUNCE_SPEED, nx, ny, overlap: bubbleRadius + creatureRadius - d};
  }
  const PICKUP_SPEED = 85;  // hearts and bombs fall at a steady, catchable speed

  // --- Stage clear: the shark break (Bryan, 2026-10-21) ---
  // When a stage's last star is caught, no new stars, jellyfish, squid strikes or bombs come; a fossil shark jaw falls
  // instead. Catch it and the fish turns into a chomping shark: it can't be hurt, and every jellyfish it touches is
  // eaten for a small bonus. Once the sea is clear (and the jaw is caught or gone), the next stage starts.
  const SNACK_POINTS = 30;     // per jellyfish eaten as a shark
  const SHARK_SIZE = 1.3;      // the shark is this much bigger than the fish
  const SHARK_MIN_TIME = 2;    // seconds the shark lasts at least, even if there's nothing left to eat
  const MORPH_TIME = .8;       // seconds the change into a shark takes (shake, glow, flash, pop); turning back is quicker
  const MORPH_BACK_TIME = .5;
  const stageEnded = (stage, starsTowardStages) => stageFor(starsTowardStages) > stage;
  function breakOver({jellies, jawFalling, strikes, sharkTime}) {
    return jellies === 0 && !jawFalling && strikes === 0 && (sharkTime === null || sharkTime >= SHARK_MIN_TIME);
  }

  // --- Music: Little Fin's Star Catcher song, "Aquatic Dreamland 4" (packed in music-data.js) ---
  const MUSIC_VOLUME = .18;   // the music's starting loudness (0 to 1) next to the game's sounds
  const MUSIC_MAX = .4;       // the loudest the volume slider on the pause screen goes (the slider's 100%)
  const sliderForVolume = volume => Math.round(Math.min(1, Math.max(0, volume / MUSIC_MAX)) * 100);  // .18 -> 45
  const volumeForSlider = percent => Math.min(100, Math.max(0, percent)) / 100 * MUSIC_MAX;
  const MUSIC_FADE_IN = 2;    // seconds to fade in at the start
  // Where the sound really starts and ends in a song (skipping silence at either end), so it loops without a gap.
  // `samples` is one channel's sound, `rate` how many samples per second; returns seconds.
  function soundBounds(samples, rate, threshold = .01) {
    let first = 0, last = samples.length - 1;
    while (first < last && Math.abs(samples[first]) < threshold) first++;
    while (last > first && Math.abs(samples[last]) < threshold) last--;
    return {start: first / rate, end: (last + 1) / rate};
  }

  // --- Seeds (Bryan, 2026-10-21, for leaderboards and challenges): a run's seed decides all of its randomness, so the
  //     same seed plays out the same way for everyone. Each kind of thing (stars, falling monsters, the squid, ...) gets
  //     its own stream of random numbers, started fresh at every stage from (seed, stage, name): that way catching stars
  //     faster or slower doesn't change what comes next. ---
  // A small, fast random-number generator (mulberry32): the same seed always gives the same numbers, from 0 to 1.
  function makeRandom(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Turn any mix of numbers and words into a seed number (FNV-1a hash).
  function seedFor(...parts) {
    let h = 2166136261;
    for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return h;
  }
  // The daily challenge: one seed per calendar day (UTC, so it's the same day for everyone in the world at once).
  const dayKey = date => date.toISOString().slice(0, 10);   // '2026-10-21'
  const dailySeed = date => seedFor('daily', dayKey(date));
  const newSeed = () => Math.floor(Math.random() * 4294967296);  // an ordinary run: a fresh seed

  // --- The scenery (Bryan, 2026-10-22): 25 ocean scenes, a new one with each stage, in the same order for everyone; after
  //     stage 25 they come round again. The scenes themselves are in scenery.js. Returns 0-24. ---
  const SCENE_COUNT = 25;
  const sceneFor = stage => (Math.max(1, stage) - 1) % SCENE_COUNT;

  // --- The top-score list (this device): the 10 best runs, highest score first; a tie keeps the earlier run first.
  //     Returns the new list and where this run landed (0 = the best; -1 = not on the list). Same idea as Little Fin. ---
  const TOP = 10;
  function addScore(list, entry) {
    const all = [...(Array.isArray(list) ? list : []).filter(e => e && Number.isFinite(e.score)), entry];
    const sorted = all.map((e, i) => ({e, i})).sort((a, b) => b.e.score - a.e.score || a.i - b.i).map(x => x.e).slice(0, TOP);
    return {list: sorted, rank: sorted.indexOf(entry)};
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const api = {FINGER_OFFSET, FOLLOW_RATE, MAX_SPEED, fishTarget, follow, STAR_GAP, STAR_SPEED, STAR_RADIUS, touchesStar,
    STARS_PER_STAGE, STARS_PER_INTRO, INTRO_STAGES, starsIn, starsBefore, stageFor, SPEED_UP, sharkBreakAfter, STAGE_DONE_PAUSE, READY_TIME, INTRO_ORDER, MONSTERS, TOUGHNESS, PAIRS, TRIOS, PAIRS_FROM, TRIOS_FROM, LAST_STAGE, course, has, FALLING, fallingKinds, mixSpacing, INTRO_CALM, busier, quicker,
    NAMES, stageNews, SIGNS, SIGN_AUTO, TIPS, TUTORIAL, TUTORIAL_AT, tipsAllowed, randomPickupsAt, BOMB_AFTER_INTROS, RAINBOW_AFTER_INTROS, HEARTS, SAFE_AFTER_BUMP, RESTART_PAUSE, RESUME_SAFE,
    JELLY_RADIUS, jellyGap, jellySpeed, HOMING_FALL, homingPull, homingDrift,
    strikeGap, legsFor, LEG_ROOM, maxLegs, warnTime, legStagger, RISE, LEG_UP, LEG_REACH,
    STAR_POINTS, COMBO_STEP, MAX_MULTIPLIER, multiplierFor, GOLD_CHANCE, GOLD_SPEED, GOLD_POINTS, pointsFor, TOP, addScore, clamp, makeRandom, seedFor, dayKey, dailySeed, newSeed, SCENE_COUNT, sceneFor,
    HEART_EVERY, MAX_HEARTS, FULL_HEART_POINTS, heartDue, FIRST_BOMB, BOMB_GAP, BLAST_RADIUS, BLAST_POINTS, inBlast, BOMB_KINDS, BAR_HALF, inBar, PICKUP_SPEED,
    FIRST_RAINBOW, RAINBOW_GAP, RAINBOW_TIME, RAINBOW_WARN, RAINBOW_SIZE, BOUNCE_SPEED, BOUNCE_FADE, bounceOff,
    PUFFER_RADIUS, PUFFER_FALL, PUFF_TRIGGER, PUFF_SHAKE, PUFF_GROW, PUFF_HOLD, PUFF_SHRINK, PUFF_REST, PUFF_SIZE,
    pufferStep, pufferSwell, pufferTouches, schoolGap, FIRST_SCHOOL, SCHOOL_WARN, schoolSpeed, PIRANHA_RADIUS,
    SCHOOL_SPACING, SCHOOL_COVER, SCHOOL_GAP, schoolLayout, piranhaTouches,
    SHARK_RADIUS, MAX_SHARKS,
    sharkGap, FIRST_SHARK, SHARK_WARN, sharkSpeed, SHARK_PASSES, SHARK_TURN, SHARK_LANE_GAP, sharkLane, sharkStep, sharkTouches,
    MINE_RADIUS, MINE_FALL, MINE_SPACING, MINE_CARRY, MINE_NEAR, mineTouches,
    currentGap, FIRST_CURRENT, CURRENT_WARN, CURRENT_FLOW, CURRENT_FADE, CURRENT_HEIGHT, CURRENT_PUSH,
    CURRENT_FIERCE_STAGE, currentPushAt, currentFlowAt, currentAimsAt,
    EEL_THICK, EEL_SEGMENTS, EEL_SPACING, EEL_WAVE, EEL_SWING, EEL_WARN, eelGap, FIRST_EEL, eelSpeed, eelSegments, eelTouches, eelGone,
    DRIFT_RECOVER, currentStrength, inCurrent, driftStep,
    MUSIC_VOLUME, MUSIC_MAX, sliderForVolume, volumeForSlider, MUSIC_FADE_IN, soundBounds, SNACK_POINTS, SHARK_SIZE, SHARK_MIN_TIME, MORPH_TIME, MORPH_BACK_TIME, stageEnded, breakOver};
  if (typeof module === 'object' && module.exports) module.exports = api; else root.StarRules = api;
})(typeof window === 'object' ? window : globalThis);
