/* Shapes COPIED from Little Fin (~/Projects/LittleFin/LittleFin/Game/game.js, 2026-10-21): the outlines of the fish,
   the jellyfish, the shark and the piranha, used both to draw them and to tell when they bump (so a hit only counts when the drawings really touch).
   Outlines are lists of [x, y] points in units of the creature's radius, centered on the creature.
   Kept apart from the drawing code so the tests can check bumps (tests/shapes.test.js). */
(function(root) {
  function ellipseOutline(rx, ry, x = 0, y = 0) {
    return Array.from({length: 48}, (_, i) => { const a = i / 48 * Math.PI * 2; return [x + Math.cos(a) * rx, y + Math.sin(a) * ry]; });
  }
  // A smooth curve through a control point (or two), as 25 points.
  function curveOutline(start, control, end, secondControl) {
    return Array.from({length: 25}, (_, i) => {
      const t = i / 24, u = 1 - t;
      return [0, 1].map(axis => secondControl
        ? u ** 3 * start[axis] + 3 * u * u * t * control[axis] + 3 * u * t * t * secondControl[axis] + t ** 3 * end[axis]
        : u * u * start[axis] + 2 * u * t * control[axis] + t * t * end[axis]);
    });
  }
  // A thick line with round ends, as an outline (jellyfish tentacles).
  function ribbonOutline(points, thickness) {
    const sides = points.map((p, i) => {
      const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
      const angle = Math.atan2(after[1] - before[1], after[0] - before[0]) + Math.PI / 2;
      const dx = Math.cos(angle) * thickness / 2, dy = Math.sin(angle) * thickness / 2;
      return {left: [p[0] + dx, p[1] + dy], right: [p[0] - dx, p[1] - dy], angle};
    });
    const cap = (p, angle) => Array.from({length: 9}, (_, i) => [p[0] + Math.cos(angle - i / 8 * Math.PI) * thickness / 2, p[1] + Math.sin(angle - i / 8 * Math.PI) * thickness / 2]);
    return [...sides.map(s => s.left), ...cap(points.at(-1), sides.at(-1).angle), ...sides.map(s => s.right).reverse(), ...cap(points[0], sides[0].angle - Math.PI)];
  }

  // The fish: a wagging tail, the body and the top fin.
  function fishOutlines(radius, time) {
    const flick = -.65 + Math.sin(time * 12) * 2 / radius;
    const tail = [[-.7, 0], [-1.55, flick], ...curveOutline([-1.55, flick], [-1.75, 0], [-1.55, .65]).slice(1)];
    const body = ellipseOutline(1.15, .77), crest = curveOutline([-.35, -.62], [0, -1.1], [.45, -.62]);
    return {tail, body, crest, all: [tail, body, crest]};
  }
  // A jellyfish: a gently pulsing bell and five swaying tentacles.
  function jellyfishOutlines(age) {
    const pulse = 1 + Math.sin(age * 2.2) * .06;
    const dome = Array.from({length: 25}, (_, i) => { const angle = Math.PI + i / 24 * Math.PI; return [Math.cos(angle) * pulse, Math.sin(angle) * .8 * pulse]; });
    const bell = [...dome, ...curveOutline([pulse, 0], [0, .24], [-pulse, 0]).slice(1)];
    const tentacles = [-.7, -.35, 0, .35, .7].map((x, i) => {
      const sway = Math.sin(age * 1.5 + i * .65) * .22;
      return ribbonOutline(curveOutline([x, .03], [x + sway, .65], [x + sway * .7, 1.55 + (i % 2) * .2], [x - sway, 1.15]), .09);
    });
    return {bell, tentacles, all: [bell, ...tentacles]};
  }

  // A shark (Little Fin's sharkOutlines): tail, back fin, side fin and body. Used when the fish turns into a shark.
  function sharkOutlines(age) {
    const tail = [[-1.15, 0], [-2, -.9 + Math.sin(age * 11) * .06], [-1.8, 0], [-2, .7]];
    const dorsal = [[-.75, -.35], [-.35, -1.25], [.15, -.48]];
    const fin = [[.1, .25], [-.25, .95], [.75, .38]];
    const body = [...curveOutline([-1.35, 0], [-.4, -.95], [1.65, 0], [.8, -.7]),
      ...curveOutline([1.65, 0], [.7, .6], [-1.35, 0], [-.65, .7]).slice(1)];
    return {tail, dorsal, fin, body, all: [tail, dorsal, fin, body]};
  }

  // A piranha (Little Fin's piranhaOutlines): wagging tail, spiky back fin, body, orange belly and an angry brow.
  function piranhaOutlines(age, radius) {
    const tail = [[-.8, 0], [-1.65, -.7], [-1.4, Math.sin(age * 13) * 3 / radius], [-1.65, .7]];
    const fin = [[-.65, -.55], [-.45, -1.2], [-.1, -.75], [.2, -1.05], [.45, -.5]];
    const body = ellipseOutline(1.2, .85), belly = ellipseOutline(.95, .42, .08, .35);
    const brow = ribbonOutline([[.22, -.58], [.75, -.4]], 2.5 / radius);
    return {tail, fin, body, belly, brow, all: [tail, fin, body, belly, brow]};
  }

  // Do two outlines (in screen points) overlap? Edges crossing, or one sitting inside the other.
  function polygonsTouch(a, b) {
    const cross = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
      const p = a[i], q = a[(i + 1) % a.length], r = b[j], s = b[(j + 1) % b.length];
      if (cross(p, q, r) * cross(p, q, s) < 0 && cross(r, s, p) * cross(r, s, q) < 0) return true;
    }
    const inside = (p, polygon) => {
      let result = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const c = polygon[i], d = polygon[j];
        if ((c[1] > p[1]) !== (d[1] > p[1]) && p[0] < (d[0] - c[0]) * (p[1] - c[1]) / (d[1] - c[1]) + c[0]) result = !result;
      }
      return result;
    };
    return inside(a[0], b) || inside(b[0], a);
  }
  const bounds = points => ({left: Math.min(...points.map(p => p[0])), right: Math.max(...points.map(p => p[0])),
    top: Math.min(...points.map(p => p[1])), bottom: Math.max(...points.map(p => p[1]))});
  const boundsTouch = (a, b) => a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
  // Place an outline on screen: scale by the radius, flip for the way the creature faces, move to its spot.
  const place = (points, who, facing = 1) => points.map(([x, y]) => [who.x + x * who.radius * facing, who.y + y * who.radius]);

  // Is the fish touching this jellyfish? (A quick distance check first, then the real outlines.)
  function fishTouchesJelly(fish, jelly, time) {
    if (Math.abs(fish.x - jelly.x) > fish.radius * 2 + jelly.radius * 1.2 || Math.abs(fish.y - jelly.y) > fish.radius * 1.2 + jelly.radius * 1.9) return false;
    const fishParts = fishOutlines(fish.radius, time).all.map(p => place(p, fish, fish.facing));
    const jellyParts = jellyfishOutlines(jelly.age).all.map(p => place(p, jelly)), jellyBounds = jellyParts.map(bounds);
    return fishParts.some(p => { const b = bounds(p); return jellyParts.some((j, i) => boundsTouch(b, jellyBounds[i]) && polygonsTouch(p, j)); });
  }

  const api = {ellipseOutline, curveOutline, ribbonOutline, fishOutlines, jellyfishOutlines, sharkOutlines, piranhaOutlines, polygonsTouch, fishTouchesJelly};
  if (typeof module === 'object' && module.exports) module.exports = api; else root.Shapes = api;
})(typeof window === 'object' ? window : globalThis);
