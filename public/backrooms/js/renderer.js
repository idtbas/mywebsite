/*
 * Abbildungen fuer das Referat.
 * Kleiner Raycaster, der Level 0 als "Foto" rendert: Tapete, Teppich,
 * Deckenplatten, Leuchtstoffroehren, weiches Licht mit Schatten, Bloom, Korn.
 * Laeuft als klassisches Skript im Worker (importScripts) und im Hauptthread.
 */
(function (root) {
  'use strict';

  var CELL = 0.5;     // Kantenlaenge einer Rasterzelle (m)
  var N = 96;         // Rastergroesse (Zellen)
  var WALL_H = 2.6;   // Raumhoehe (m)
  var LSP = 3;        // Abstand der Deckenleuchten (m)
  var LOFF = 1.5;
  var L = Math.round((N * CELL) / LSP); // Leuchten pro Achse
  var KN = 5;         // 5x5 Leuchten-Nachbarschaft pro Zelle
  var LR = 7.5;       // Reichweite einer Leuchte (m)

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash2(x, y) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }

  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function fbm(x, y) {
    return (vnoise(x, y) * 0.5 + vnoise(x * 2.03 + 17, y * 2.03) * 0.25 +
      vnoise(x * 4.1, y * 4.1 + 31) * 0.125 + vnoise(x * 8.3 + 5, y * 8.3) * 0.0625) / 0.9375;
  }

  function smooth(a, b, x) {
    var t = (x - a) / (b - a);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }

  /* ------------------------------------------------------------------ Welt */

  var world = null;

  function buildWorld() {
    var rnd = mulberry32(20190512);
    var map = new Uint8Array(N * N);

    function set(x, y, v) { if (x >= 0 && y >= 0 && x < N && y < N) map[y * N + x] = v; }
    function rect(x0, y0, x1, y1, v) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) set(x, y, v); }

    for (var i = 0; i < N; i++) { set(i, 0, 1); set(i, N - 1, 1); set(0, i, 1); set(N - 1, i, 1); }

    // unregelmaessige Trennwaende mit Durchgaengen
    var x = 7;
    while (x < N - 5) {
      var y = 1;
      while (y < N - 1) {
        var len = 3 + Math.floor(rnd() * 13), skip = rnd() < 0.24;
        for (var k = 0; k < len && y < N - 1; k++, y++) if (!skip) set(x, y, 1);
        y += 3 + Math.floor(rnd() * 5);
      }
      x += 7 + Math.floor(rnd() * 7);
    }
    var yy = 6;
    while (yy < N - 5) {
      var xx = 1;
      while (xx < N - 1) {
        var len2 = 3 + Math.floor(rnd() * 12), skip2 = rnd() < 0.3;
        for (var k2 = 0; k2 < len2 && xx < N - 1; k2++, xx++) if (!skip2) set(xx, yy, 1);
        xx += 3 + Math.floor(rnd() * 6);
      }
      yy += 7 + Math.floor(rnd() * 7);
    }
    for (var p = 0; p < 26; p++) {
      var px = 3 + Math.floor(rnd() * (N - 6)), py = 3 + Math.floor(rnd() * (N - 6));
      set(px, py, 1);
    }

    // Abb. 1: der Raum aus dem Foto
    rect(6, 40, 40, 70, 0);
    rect(6, 40, 40, 40, 1);      // Rueckwand ganz hinten
    rect(18, 41, 18, 50, 1);     // Trennwand links, laeuft nach hinten
    rect(18, 54, 18, 62, 1);
    rect(26, 48, 36, 48, 1);     // Querwand rechts mit Durchgang
    rect(22, 48, 23, 48, 1);
    rect(30, 56, 30, 56, 1);     // Pfeiler
    rect(12, 52, 12, 52, 1);
    rect(6, 70, 40, 70, 1);
    rect(40, 40, 40, 70, 1);
    rect(40, 52, 40, 57, 0);     // Ausgang nach rechts
    rect(6, 58, 6, 63, 0);       // Ausgang nach links
    rect(26, 40, 29, 40, 0);     // Durchgang in der Rueckwand
    rect(10, 40, 12, 40, 0);

    // Abb. 2: langer Flur, an dessen Ende ein dunkler Raum liegt
    rect(54, 6, 74, 78, 0);
    rect(60, 20, 60, 78, 1);
    rect(65, 20, 65, 78, 1);
    rect(53, 19, 74, 19, 1);
    rect(62, 19, 63, 19, 0);     // Tuer am Ende
    rect(53, 6, 74, 6, 1);
    rect(53, 6, 53, 19, 1);
    rect(74, 6, 74, 19, 1);
    rect(60, 43, 60, 45, 0);     // seitliche Oeffnungen
    rect(65, 33, 65, 34, 0);
    rect(65, 58, 65, 60, 0);

    // Leuchten
    var power = new Float32Array(L * L);
    var panel = new Uint8Array(L * L);
    for (var j = 0; j < L; j++) {
      for (var ii = 0; ii < L; ii++) {
        var lx = ii * LSP + LOFF, ly = j * LSP + LOFF;
        var cx = Math.floor(lx / CELL), cy = Math.floor(ly / CELL);
        if (map[cy * N + cx]) continue;
        panel[j * L + ii] = 1;
        var r = rnd();
        var pw = r < 0.08 ? 0 : r < 0.16 ? 0.55 : 1;
        if (lx > 26.5 && lx < 37.5 && ly < 10) pw = 0; // dunkler Raum hinter dem Flur
        power[j * L + ii] = pw * (0.92 + 0.16 * rnd());
      }
    }
    power[Math.floor(63 * CELL / LSP) + Math.floor(52 * CELL / LSP) * L] = 0.5;

    // Sichtbarkeit Zelle -> Leuchte (2D, weil die Waende bis zur Decke gehen)
    function los(ax, ay, bx, by) {
      var dx = bx - ax, dy = by - ay;
      var d = Math.sqrt(dx * dx + dy * dy), steps = Math.ceil(d / (CELL * 0.2));
      for (var s = 1; s < steps; s++) {
        var t = s / steps;
        var gx = Math.floor((ax + dx * t) / CELL), gy = Math.floor((ay + dy * t) / CELL);
        if (gx < 0 || gy < 0 || gx >= N || gy >= N || map[gy * N + gx]) return 0;
      }
      return 1;
    }
    var vis = new Float32Array(N * N * KN * KN);
    var cellLI = new Int16Array(N * N), cellLJ = new Int16Array(N * N);
    var ambient = new Float32Array(N * N);
    for (var cyy = 0; cyy < N; cyy++) {
      for (var cxx = 0; cxx < N; cxx++) {
        var c = cyy * N + cxx;
        if (map[c]) continue;
        var mx = (cxx + 0.5) * CELL, my = (cyy + 0.5) * CELL;
        var bi = Math.round((mx - LOFF) / LSP), bj = Math.round((my - LOFF) / LSP);
        cellLI[c] = bi; cellLJ[c] = bj;
        var amb = 0;
        for (var dj = -2; dj <= 2; dj++) {
          for (var di = -2; di <= 2; di++) {
            var li = bi + di, lj = bj + dj;
            if (li < 0 || lj < 0 || li >= L || lj >= L || !power[lj * L + li]) continue;
            var lxx = li * LSP + LOFF, lyy = lj * LSP + LOFF;
            var v = (los(mx, my, lxx, lyy) * 2 + los(mx, my, lxx - 0.55, lyy) + los(mx, my, lxx + 0.55, lyy)) / 4;
            vis[c * 25 + (dj + 2) * 5 + (di + 2)] = v;
            var ddx = lxx - mx, ddy = lyy - my, d2 = ddx * ddx + ddy * ddy + WALL_H * WALL_H;
            amb += v * power[lj * L + li] / (d2 + 1);
          }
        }
        ambient[c] = amb;
      }
    }
    return { map: map, power: power, panel: panel, vis: vis, cellLI: cellLI, cellLJ: cellLJ, ambient: ambient };
  }

  function getWorld() { return world || (world = buildWorld()); }

  /* ----------------------------------------------------------------- Licht */

  function irradiance(W, c, px, py, pz, nx, ny, nz) {
    var base = c * 25, bi = W.cellLI[c], bj = W.cellLJ[c], E = 0;
    for (var dj = -2; dj <= 2; dj++) {
      for (var di = -2; di <= 2; di++) {
        var v = W.vis[base + (dj + 2) * 5 + (di + 2)];
        if (!v) continue;
        var li = bi + di, lj = bj + dj;
        var P = W.power[lj * L + li];
        var dx = li * LSP + LOFF - px, dy = lj * LSP + LOFF - py, dz = WALL_H - 0.04 - pz;
        var d2 = dx * dx + dy * dy + dz * dz;
        var w = 1 - d2 / (LR * LR);
        if (w <= 0) continue;
        var d = Math.sqrt(d2);
        var cosS = (nx * dx + ny * dy + nz * dz) / d;
        if (cosS <= 0) continue;
        E += P * v * (dz / d) * cosS * w * w / (d2 + 0.35);
      }
    }
    return E;
  }

  function cellAt(W, x, y) {
    var gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
    if (gx < 0 || gy < 0 || gx >= N || gy >= N) return -1;
    return gy * N + gx;
  }

  // Abstand zur naechsten Wand in der Ebene (fuer Ecken-Verschattung)
  function wallDist(W, x, y) {
    var gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
    var fx = x / CELL - gx, fy = y / CELL - gy, m = W.map, d = 9;
    if (gx > 0 && m[gy * N + gx - 1]) d = Math.min(d, fx);
    if (gx < N - 1 && m[gy * N + gx + 1]) d = Math.min(d, 1 - fx);
    if (gy > 0 && m[(gy - 1) * N + gx]) d = Math.min(d, fy);
    if (gy < N - 1 && m[(gy + 1) * N + gx]) d = Math.min(d, 1 - fy);
    return d * CELL;
  }

  /* ------------------------------------------------------------ Silhouette */

  function segDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var ex = px - ax - dx * t, ey = py - ay - dy * t;
    return Math.sqrt(ex * ex + ey * ey);
  }

  // Signierte Distanz zu einer zu langen, zu duennen Gestalt (Meter, Z = Hoehe)
  function figureSDF(X, Z) {
    var ax = Math.abs(X);
    var hx = X / 0.085, hz = (Z - 2.08) / 0.115;
    var d = (Math.sqrt(hx * hx + hz * hz) - 1) * 0.085;
    d = Math.min(d, segDist(ax, Z, 0, 1.9, 0, 1.99) - 0.048);
    d = Math.min(d, segDist(ax, Z, 0, 1.28, 0, 1.7) - 0.15);
    d = Math.min(d, segDist(ax, Z, 0, 1.8, 0.16, 1.75) - 0.072);
    d = Math.min(d, segDist(ax, Z, 0.2, 1.74, 0.225, 1.27) - 0.05);
    d = Math.min(d, segDist(ax, Z, 0.225, 1.27, 0.235, 0.74) - 0.04);
    d = Math.min(d, segDist(ax, Z, 0, 1.12, 0.06, 1.12) - 0.13);
    d = Math.min(d, segDist(ax, Z, 0.08, 1.08, 0.085, 0.05) - 0.066);
    return d;
  }

  /* ------------------------------------------------------------- Rendering */

  function boxBlur(src, dst, w, h, r) {
    // horizontal + vertikal, 3 Kanaele
    var tmp = new Float32Array(src.length), x, y, k, acc0, acc1, acc2, inv = 1 / (2 * r + 1);
    for (y = 0; y < h; y++) {
      var row = y * w * 3;
      acc0 = acc1 = acc2 = 0;
      for (k = -r; k <= r; k++) {
        var xi = (k < 0 ? 0 : k >= w ? w - 1 : k) * 3 + row;
        acc0 += src[xi]; acc1 += src[xi + 1]; acc2 += src[xi + 2];
      }
      for (x = 0; x < w; x++) {
        var o = row + x * 3;
        tmp[o] = acc0 * inv; tmp[o + 1] = acc1 * inv; tmp[o + 2] = acc2 * inv;
        var xa = x + r + 1, xr = x - r;
        xa = (xa >= w ? w - 1 : xa) * 3 + row; xr = (xr < 0 ? 0 : xr) * 3 + row;
        acc0 += src[xa] - src[xr]; acc1 += src[xa + 1] - src[xr + 1]; acc2 += src[xa + 2] - src[xr + 2];
      }
    }
    for (x = 0; x < w; x++) {
      acc0 = acc1 = acc2 = 0;
      for (k = -r; k <= r; k++) {
        var yi = (k < 0 ? 0 : k >= h ? h - 1 : k) * w * 3 + x * 3;
        acc0 += tmp[yi]; acc1 += tmp[yi + 1]; acc2 += tmp[yi + 2];
      }
      for (y = 0; y < h; y++) {
        var o2 = y * w * 3 + x * 3;
        dst[o2] = acc0 * inv; dst[o2 + 1] = acc1 * inv; dst[o2 + 2] = acc2 * inv;
        var ya = y + r + 1, yr = y - r;
        ya = (ya >= h ? h - 1 : ya) * w * 3 + x * 3; yr = (yr < 0 ? 0 : yr) * w * 3 + x * 3;
        acc0 += tmp[ya] - tmp[yr]; acc1 += tmp[ya + 1] - tmp[yr + 1]; acc2 += tmp[ya + 2] - tmp[yr + 2];
      }
    }
  }

  /*
   * opts: { w, h, x, y, angle (Grad, 0 = +x, 90 = +y), z (Kamerahoehe),
   *         fov (Grad horizontal), pitch (Pixel), exposure, seed,
   *         figure: { x, y, scale } | null }
   */
  function render(opts) {
    var W = getWorld();
    var w = opts.w || 720, h = opts.h || 480;
    var a = (opts.angle || 0) * Math.PI / 180;
    var dirX = Math.cos(a), dirY = Math.sin(a);
    var tanH = Math.tan(((opts.fov || 74) * Math.PI / 180) / 2);
    var planeX = -dirY * tanH, planeY = dirX * tanH;
    var focal = (w / 2) / tanH;
    var camZ = opts.z || 1.55;
    var horizon = h / 2 + (opts.pitch || 0);
    var posX = opts.x, posY = opts.y;
    var seed = opts.seed || 1;
    var hdr = new Float32Array(w * h * 3);
    var zbuf = new Float32Array(w);
    var map = W.map;

    for (var x = 0; x < w; x++) {
      var camX = 2 * (x + 0.5) / w - 1;
      var rdx = dirX + planeX * camX, rdy = dirY + planeY * camX;
      var mapX = Math.floor(posX / CELL), mapY = Math.floor(posY / CELL);
      var ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
      var stepX, stepY, sdx, sdy;
      if (rdx < 0) { stepX = -1; sdx = (posX / CELL - mapX) * ddx; } else { stepX = 1; sdx = (mapX + 1 - posX / CELL) * ddx; }
      if (rdy < 0) { stepY = -1; sdy = (posY / CELL - mapY) * ddy; } else { stepY = 1; sdy = (mapY + 1 - posY / CELL) * ddy; }
      var side = 0, prevX = mapX, prevY = mapY, guard = 0;
      while (guard++ < 400) {
        prevX = mapX; prevY = mapY;
        if (sdx < sdy) { sdx += ddx; mapX += stepX; side = 0; } else { sdy += ddy; mapY += stepY; side = 1; }
        if (mapX < 0 || mapY < 0 || mapX >= N || mapY >= N || map[mapY * N + mapX]) break;
      }
      var perp = (side === 0 ? sdx - ddx : sdy - ddy) * CELL;
      if (perp < 0.01) perp = 0.01;
      zbuf[x] = perp;
      var hitX = posX + rdx * perp, hitY = posY + rdy * perp;
      var wallTop = horizon - (WALL_H - camZ) * focal / perp;
      var wallBot = horizon + camZ * focal / perp;
      var nX = side === 0 ? -stepX : 0, nY = side === 1 ? -stepY : 0;
      var u = side === 0 ? hitY : hitX;
      var faceSeed = side === 0 ? mapX * 7.31 : mapY * 3.17 + 40;
      var prevC = prevY * N + prevX;
      // innere Ecken entlang der Wand
      var tAlong = side === 0 ? hitY / CELL - Math.floor(hitY / CELL) : hitX / CELL - Math.floor(hitX / CELL);
      var cornerA = 9, cornerB = 9;
      if (side === 0) {
        if (prevY > 0 && map[(prevY - 1) * N + prevX]) cornerA = tAlong * CELL;
        if (prevY < N - 1 && map[(prevY + 1) * N + prevX]) cornerB = (1 - tAlong) * CELL;
      } else {
        if (prevX > 0 && map[prevY * N + prevX - 1]) cornerA = tAlong * CELL;
        if (prevX < N - 1 && map[prevY * N + prevX + 1]) cornerB = (1 - tAlong) * CELL;
      }
      var cornerAO = 0.7 + 0.3 * smooth(0, 0.35, Math.min(cornerA, cornerB));

      for (var y = 0; y < h; y++) {
        var o = (y * w + x) * 3, r, g, b;
        var jx = (hash2(x * 3 + seed, y * 7) - 0.5) * CELL * 0.9;
        var jy = (hash2(x * 5, y * 11 + seed) - 0.5) * CELL * 0.9;
        if (y < wallTop || y > wallBot) {
          var floor = y > wallBot;
          var rowDist = floor ? camZ * focal / (y + 0.5 - horizon) : (WALL_H - camZ) * focal / (horizon - y - 0.5);
          var fx = posX + rdx * rowDist, fy = posY + rdy * rowDist;
          var c = cellAt(W, fx, fy);
          if (c < 0 || map[c]) c = prevC;
          var cj = cellAt(W, fx + jx, fy + jy);
          if (cj < 0 || map[cj]) cj = c;
          var wd = wallDist(W, fx, fy);
          var amb = 0.05 + 0.5 * W.ambient[cj];
          if (floor) {
            var E = irradiance(W, cj, fx, fy, 0, 0, 0, 1);
            var grain = 0.93 + 0.14 * hash2(Math.floor(fx * 70), Math.floor(fy * 70));
            var stain = fbm(fx * 0.55 + 3, fy * 0.55);
            var damp = 1 - 0.22 * smooth(0.55, 0.8, stain);
            var ao = 0.6 + 0.4 * smooth(0, 0.5, wd);
            var mf = ao * grain * damp, Ed = E * 1.05, Ea = amb * 0.9;
            r = 0.56 * (Ed + Ea) * mf; g = 0.45 * (Ed * 0.96 + Ea * 0.9) * mf; b = 0.21 * (Ed * 0.8 + Ea * 0.55) * mf;
          } else {
            var li = Math.round((fx - LOFF) / LSP), lj = Math.round((fy - LOFF) / LSP);
            var lxl = fx - (li * LSP + LOFF), lyl = fy - (lj * LSP + LOFF);
            var inPanel = li >= 0 && lj >= 0 && li < L && lj < L && W.panel[lj * L + li] &&
              Math.abs(lxl) < 0.62 && Math.abs(lyl) < 0.32;
            if (inPanel) {
              var P = W.power[lj * L + li];
              if (Math.abs(lxl) > 0.585 || Math.abs(lyl) > 0.285) {
                r = g = b = 0.55 * (amb + 0.3);
              } else if (P > 0) {
                var em = 2.6 * P * (0.93 + 0.07 * Math.cos(lyl * 9) * Math.cos(lxl * 4));
                r = em * 1.0; g = em * 0.98; b = em * 0.86;
              } else {
                r = g = b = 0.42 * (amb + 0.15);
              }
            } else {
              var glow = 0;
              for (var gj = -1; gj <= 1; gj++) for (var gi = -1; gi <= 1; gi++) {
                var qi = li + gi, qj = lj + gj;
                if (qi < 0 || qj < 0 || qi >= L || qj >= L) continue;
                var Pq = W.power[qj * L + qi];
                if (!Pq) continue;
                var ex = fx - (qi * LSP + LOFF), ey = fy - (qj * LSP + LOFF);
                ex = Math.max(0, Math.abs(ex) - 0.6); ey = Math.max(0, Math.abs(ey) - 0.3);
                glow += Pq * 0.09 / (ex * ex + ey * ey + 0.12);
              }
              var tx = fx / 0.6 - Math.floor(fx / 0.6), ty = fy / 0.6 - Math.floor(fy / 0.6);
              var grid = (tx < 0.022 || tx > 0.978 || ty < 0.022 || ty > 0.978) ? 0.78 : 1;
              var speck = 0.95 + 0.07 * hash2(Math.floor(fx * 90), Math.floor(fy * 90));
              var cao = 0.72 + 0.28 * smooth(0, 0.45, wd);
              var mc = grid * speck * cao, Ac = amb * 1.25, Gc = glow * 0.55;
              r = 0.88 * (Ac + Gc) * mc; g = 0.84 * (Ac * 0.92 + Gc * 0.97) * mc; b = 0.66 * (Ac * 0.62 + Gc * 0.85) * mc;
            }
          }
          var fogF = Math.exp(-rowDist * 0.02);
          r = r * fogF + 0.06 * (1 - fogF); g = g * fogF + 0.052 * (1 - fogF); b = b * fogF + 0.03 * (1 - fogF);
        } else {
          var hz = camZ + (horizon - y - 0.5) * perp / focal;
          var cw = prevC;
          var cwj = cellAt(W, hitX + nX * 0.2 + jx * 0.5 * Math.abs(nY), hitY + nY * 0.2 + jy * 0.5 * Math.abs(nX));
          if (cwj < 0 || map[cwj]) cwj = cw;
          var Ew = irradiance(W, cwj, hitX + nX * 0.01, hitY + nY * 0.01, hz, nX, nY, 0);
          var ambw = 0.05 + 0.55 * W.ambient[cwj];
          var stripe = 1 + 0.045 * Math.cos(u * 59.8);
          var mu = u / 0.21 - Math.floor(u / 0.21), mv = hz / 0.28 - Math.floor(hz / 0.28);
          var motif = (Math.abs(mu - 0.5) + Math.abs(mv - 0.5)) < 0.16 ? 0.95 : 1;
          var st = fbm(u * 1.1 + faceSeed, hz * 1.6);
          var stains = 0.9 + 0.12 * st;
          var damp2 = hz < 0.7 ? 1 - 0.12 * (1 - hz / 0.7) * smooth(0.45, 0.75, fbm(u * 2.2 + 9, hz * 2 + faceSeed)) : 1;
          var ar = 0.88, ag = 0.74, ab = 0.3;
          if (hz < 0.085) { ar = 0.62; ag = 0.52; ab = 0.28; stripe = 1; motif = hz > 0.075 ? 1.15 : 1; }
          var wao = (0.66 + 0.34 * smooth(0, 0.5, hz)) * (0.8 + 0.2 * smooth(0, 0.3, WALL_H - hz)) * cornerAO;
          var shade = side === 1 ? 0.94 : 1;
          var mw = stripe * motif * stains * damp2 * wao * shade, Ewd = Ew * 1.15;
          r = ar * (Ewd + ambw) * mw; g = ag * (Ewd * 0.96 + ambw * 0.9) * mw; b = ab * (Ewd * 0.8 + ambw * 0.55) * mw;
          var fogW = Math.exp(-perp * 0.02);
          r = r * fogW + 0.06 * (1 - fogW); g = g * fogW + 0.052 * (1 - fogW); b = b * fogW + 0.03 * (1 - fogW);
        }
        hdr[o] = r; hdr[o + 1] = g; hdr[o + 2] = b;
      }
    }

    // die Gestalt
    var fig = opts.figure;
    if (fig) {
      var rx = fig.x - posX, ry = fig.y - posY;
      var inv = 1 / (planeX * dirY - dirX * planeY);
      var tX = inv * (dirY * rx - dirX * ry);
      var tY = inv * (-planeY * rx + planeX * ry);
      if (tY > 0.2) {
        var sc = fig.scale || 1;
        var sx = (w / 2) * (1 + tX / tY);
        var mPerPx = tY / focal;
        var half = 0.32 * sc / mPerPx;
        var top = horizon - (2.3 * sc - camZ) / mPerPx;
        var bot = horizon + camZ / mPerPx;
        var soft = Math.max(mPerPx * 1.6, 0.028) + (fig.blur || 0);
        var fc = cellAt(W, fig.x, fig.y);
        var fE = fc >= 0 && !map[fc] ? W.ambient[fc] : 0.1;
        for (var px0 = Math.max(0, Math.floor(sx - half)); px0 < Math.min(w, Math.ceil(sx + half)); px0++) {
          if (zbuf[px0] < tY) continue;
          var X = ((px0 + 0.5) - sx) * mPerPx / sc;
          for (var py0 = Math.max(0, Math.floor(top)); py0 < Math.min(h, Math.ceil(bot)); py0++) {
            var Z = (bot - (py0 + 0.5)) * mPerPx / sc;
            var sd = figureSDF(X, Z);
            if (sd > soft) continue;
            var al = 1 - smooth(-soft, soft, sd);
            al *= fig.opacity == null ? 1 : fig.opacity;
            var oo = (py0 * w + px0) * 3;
            var fl = 0.014 + (0.015 + 0.07 * fE) * smooth(0.6, 2.25, Z) * (0.85 + 0.3 * smooth(-0.25, 0.25, X));
            hdr[oo] += (fl * 1.0 - hdr[oo]) * al;
            hdr[oo + 1] += (fl * 0.9 - hdr[oo + 1]) * al;
            hdr[oo + 2] += (fl * 0.65 - hdr[oo + 2]) * al;
          }
        }
      }
    }

    // Bloom
    var n = w * h * 3;
    var bright = new Float32Array(n), blurA = new Float32Array(n), blurB = new Float32Array(n);
    for (var q = 0; q < n; q += 3) {
      var lumq = 0.3 * hdr[q] + 0.59 * hdr[q + 1] + 0.11 * hdr[q + 2];
      var k = Math.max(0, lumq - 0.85) / (lumq + 1e-4);
      bright[q] = hdr[q] * k; bright[q + 1] = hdr[q + 1] * k; bright[q + 2] = hdr[q + 2] * k;
    }
    var rad = Math.max(2, Math.round(w / 90));
    boxBlur(bright, blurA, w, h, rad);
    boxBlur(blurA, blurB, w, h, rad);
    boxBlur(blurB, blurA, w, h, rad * 2);
    // leichter Dunst wie bei einer Handykamera
    boxBlur(hdr, blurB, w, h, Math.max(1, Math.round(w / 240)));

    var out = new Uint8ClampedArray(w * h * 4);
    var exposure = opts.exposure || 1.35;
    var rng = mulberry32(seed * 7919);
    var cx0 = w / 2, cy0 = h / 2, maxR = Math.sqrt(cx0 * cx0 + cy0 * cy0);
    for (var yy = 0; yy < h; yy++) {
      for (var xx = 0; xx < w; xx++) {
        var i3 = (yy * w + xx) * 3, i4 = (yy * w + xx) * 4;
        var rr = hdr[i3] * 0.7 + blurB[i3] * 0.3 + blurA[i3] * 0.9;
        var gg = hdr[i3 + 1] * 0.7 + blurB[i3 + 1] * 0.3 + blurA[i3 + 1] * 0.9;
        var bb = hdr[i3 + 2] * 0.7 + blurB[i3 + 2] * 0.3 + blurA[i3 + 2] * 0.85;
        rr = 1 - Math.exp(-rr * exposure); gg = 1 - Math.exp(-gg * exposure); bb = 1 - Math.exp(-bb * exposure);
        // Look: angehobene Schatten, leicht gruenstichiges Gelb, etwas entsaettigt
        var lum2 = 0.3 * rr + 0.59 * gg + 0.11 * bb;
        rr = lum2 + (rr - lum2) * 1.08; gg = lum2 + (gg - lum2) * 1.05; bb = lum2 + (bb - lum2) * 1.05;
        rr = 0.035 + rr * 0.96; gg = 0.03 + gg * 0.95; bb = 0.012 + bb * 0.86;
        var dxv = (xx - cx0) / maxR, dyv = (yy - cy0) / maxR;
        var vig = 1 - 0.42 * (dxv * dxv + dyv * dyv);
        var gr = (rng() + rng() - 1) * 0.035;
        rr = Math.pow(Math.max(0, rr * vig + gr), 0.4545);
        gg = Math.pow(Math.max(0, gg * vig + gr), 0.4545);
        bb = Math.pow(Math.max(0, bb * vig + gr * 1.3), 0.4545);
        out[i4] = rr * 255; out[i4 + 1] = gg * 255; out[i4 + 2] = bb * 255; out[i4 + 3] = 255;
      }
    }
    // chromatische Aberration am Rand
    var copy = new Uint8ClampedArray(out);
    for (var y2 = 0; y2 < h; y2++) {
      for (var x2 = 0; x2 < w; x2++) {
        var shift = Math.round(((x2 - cx0) / cx0) * 1.6);
        var sxr = x2 + shift;
        if (sxr < 0 || sxr >= w) continue;
        out[(y2 * w + x2) * 4] = copy[(y2 * w + sxr) * 4];
      }
    }
    return { w: w, h: h, data: out };
  }

  root.BR_RENDER = { render: render, _world: getWorld, N: N, CELL: CELL };
})(typeof self !== 'undefined' ? self : this);
