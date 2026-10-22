/* Stand-ins for two newer browser features the game uses, for phones with an older browser (2026-10-22: a friend's
   Android phone in Chrome played the music but the game never moved). Where the browser has them already, these do
   nothing. Loaded before everything else. */

// list.at(-1): the last item (Chrome 92+, Safari 15.4+).
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {configurable: true, writable: true, value(i) {
    i = Math.trunc(i) || 0; if (i < 0) i += this.length;
    return i < 0 || i >= this.length ? undefined : this[i];
  }});
}

// ctx.roundRect(x, y, w, h, radius or [radii]): a box with rounded corners (Chrome 99+, Safari 16+).
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii = 0) {
    // One radius for all corners, or [all], [top-left & bottom-right, top-right & bottom-left], or [tl, tr, br, bl].
    const list = Array.isArray(radii) ? radii : [radii];
    const [tl, tr, br, bl] = list.length === 1 ? [list[0], list[0], list[0], list[0]] : list.length === 2 ? [list[0], list[1], list[0], list[1]]
      : list.length === 3 ? [list[0], list[1], list[2], list[1]] : list;
    const fit = r => Math.max(0, Math.min(r || 0, Math.abs(w) / 2, Math.abs(h) / 2));
    const [a, b, c, d] = [tl, tr, br, bl].map(fit);
    this.moveTo(x + a, y);
    this.arcTo(x + w, y, x + w, y + h, b); this.arcTo(x + w, y + h, x, y + h, c);
    this.arcTo(x, y + h, x, y, d); this.arcTo(x, y, x + w, y, a);
    this.closePath();
  };
}
