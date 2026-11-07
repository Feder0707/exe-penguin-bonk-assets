/* EXE PENGUIN BONK · presenter v1.0.1 · form&soul.exe */
(function () {
  'use strict';
  const VERSION = '1.0.1';
  window.BlindBoxPresenters = window.BlindBoxPresenters || {};
  // native pixel scene, scaled x4 onto the 1000x1100 engine canvas
  const NW = 240, NH = 262, SC = 4, OX = Math.round((1000 - NW * SC) / 2), OY = 1100 - NH * SC - 20;
  const FONT = 'Silkscreen';
  const cl = v => Math.max(0, Math.min(1, v)), seg = (t, a, b) => cl((t - a) / (b - a)), eo = x => 1 - Math.pow(1 - x, 3);
  const eb = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // bonks per rarity (seconds from the start); the last one breaks the block. Legendary+ get the angry run-up.
  const BONKS = { common: [0.9], rare: [0.9, 1.8], epic: [0.9, 1.8, 2.7], legendary: [0.9, 1.9, 3.3], mythic: [0.9, 1.8, 2.7, 4.1] };
  const BIG = { legendary: 1, mythic: 1 };
  const RCOL = { common: '#8a8f99', rare: '#3f8fe0', epic: '#9a5ae0', legendary: '#d8962a', mythic: '#2fb8a0' };
  const GLOW = { common: [255, 255, 255], rare: [90, 170, 255], epic: [190, 110, 255], legendary: [255, 196, 70], mythic: [120, 255, 220] };
  const RLABEL = { common: 'COMMON', rare: 'RARE', epic: 'EPIC', legendary: 'LEGENDARY', mythic: 'MYTHIC' };
  const FILES = {
    box: 'ice_block.png', lid: 'ice_lid.png', bottom: 'ice_bottom.png', xbox: 'ice_block_xmas.png', xlid: 'ice_lid_xmas.png', xbottom: 'ice_bottom_xmas.png',
    plaque: 'ui_plaque.png', bar: 'ui_bar.png', bonk: 'fx_bonk.png', star: 'fx_star.png', anger: 'fx_anger.png', grr: 'fx_grr.png',
    tagNew: 'tag_new.png', tagShiny: 'tag_shiny.png', tagXmas: 'tag_xmas.png', pipOn: 'pip_on.png', pipOff: 'pip_off.png',
    chip: 'chip_fish.png', banner: 'ui_banner.png', sign: 'ui_sign.png', panel_frame: 'ui_panel_frame.png', panel_slot: 'ui_panel_slot.png',
    seal: 'gag_seal.png', hole: 'gag_hole.png', gfish: 'gag_fish.png', snowball: 'gag_snowball.png', puffL: 'gag_puffin_l.png', puffR: 'gag_puffin_r.png', puffFlyL: 'gag_puffin_fly_l.png', puffFlyR: 'gag_puffin_fly_r.png', snowman: 'deco_snowman.png', tree: 'deco_tree.png', p_slide: 'pose_slide.png',
    bear: 'gag_bear.png', walrus: 'gag_walrus.png', walrusWow: 'gag_walrus_wow.png', chickRun: 'gag_chick_run.png', chickBonk: 'gag_chick_bonk.png', gull: 'gag_gull.png', gullFish: 'gag_gull_fish.png', sleigh: 'gag_sleigh.png',
    p_run: 'pose_run.png', p_headbutt: 'pose_headbutt.png', p_dizzy: 'pose_dizzy.png', p_angry: 'pose_angry.png',
  };
  const R = {}; const silCache = new Map();
  function load(src) { return new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }
  async function init(base) {
    await Promise.all(Object.entries(FILES).map(async ([k, f]) => { R[k] = await load(base + f); }));
    if (R.gfish) { const c = document.createElement('canvas'), h = Math.round(R.gfish.height * 0.74); c.width = R.gfish.width; c.height = h; c.getContext('2d').drawImage(R.gfish, 0, 0); R.fishBody = c; }
    try { LAYOUTS = await (await fetch(base + 'panel_layouts.json')).json(); await Promise.all(Object.values(LAYOUTS).flatMap(l => [l.board, l.slot].filter(Boolean)).map(async f => { PIMG[f] = await load(base + f); })); } catch (e) { LAYOUTS = null; }
    try { await document.fonts.load('400 8px ' + FONT); await document.fonts.load('700 16px ' + FONT); } catch (e) {}
  }
  function alphaOf(img) { if (img.__a) return img.__a; const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); img.__a = x.getImageData(0, 0, img.width, img.height).data; return img.__a; }
  function edgeX(img, side, y0, y1) { const d = alphaOf(img), W = img.width; let best = side === 'left' ? W : -1; for (let y = Math.max(0, y0); y < Math.min(img.height, y1); y++) for (let xx = 0; xx < W; xx++) if (d[(y * W + xx) * 4 + 3] > 40) { if (side === 'left') { best = Math.min(best, xx); break; } else best = Math.max(best, xx); } return best; }
  function sil(img, col) { const key = (img.src || '') + '|' + col; let c = silCache.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); silCache.set(key, c); return c; }
  // Christmas outfits: 'auto' = Dec 1 → Jan 6, 'on', 'off'. Cosmetic only.
  function xmasOn(mode, now) { if (mode === 'on') return true; if (mode === 'off') return false; const d = now || new Date(), m = d.getMonth(), day = d.getDate(); return m === 11 || (m === 0 && day <= 6); }

  function timelineFor(s) {
    const rar = BONKS[s.rarity] ? s.rarity : 'common', big = !!BIG[rar] && !s.rm;
    const bonks = s.rm ? [0.5] : BONKS[rar], boom = bonks[bonks.length - 1] + (big ? 0.1 : 0.3);
    const fly = big ? 0.75 : 0.5, slide = big ? 0.7 : 0.45, land = boom + fly + slide;
    const hold = s.hold != null ? s.hold : 4;
    return { bonks, boom, fly, slide, land, big, pop: boom, plaqueIn: land - 0.45, settle: land + 0.7, end: land + 0.7 + hold, hold };
  }
  // sound cues the engine plays (key, seconds): one bonk per hit
  function cues(T) { const c = T.bonks.map(b => ['bonk', b]); if (T.big) c.push(['grr', T.bonks[T.bonks.length - 1] - 0.85]); return c; }

  let SCN = null;
  function scene() { if (!SCN) { SCN = document.createElement('canvas'); SCN.width = NW; SCN.height = NH; } const x = SCN.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, NW, NH); x.imageSmoothingEnabled = false; return x; }
  function txt(x, s, px, py, size, col, w, al) { x.font = `${w || 400} ${size}px ${FONT}`; x.textAlign = al || 'left'; x.textBaseline = 'top'; x.fillStyle = col; x.fillText(s, px, py); }
  function fit(x, s, size, maxW, w) { let f = size; x.font = `${w || 700} ${f}px ${FONT}`; while (x.measureText(s).width > maxW && f > 6) { f--; x.font = `${w || 700} ${f}px ${FONT}`; } return f; }
  function radial(x, cx, cy, r, rgb, a) { const g = x.createRadialGradient(cx, cy, 1, cx, cy, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }

  function bar(x, have, of) {
    const bx = (NW - R.bar.width) / 2; x.drawImage(R.bar, bx, 231); const fill = Math.round(129 * (of ? have / of : 0));
    if (fill > 0) { x.fillStyle = '#7fd3ff'; x.fillRect(bx + 25, 243, fill, 6); x.fillStyle = '#c9f0ff'; x.fillRect(bx + 25, 243, fill, 2); }
    txt(x, 'COLONY', bx + 7, 221, 8, '#ffffff', 700); txt(x, have + '/' + of, bx + R.bar.width - 7, 221, 8, '#ffffff', 700, 'right');
  }
  function hintLine(x, s, a) { if (R.sign && s) return signHint(x, s, a); if (!s || a <= 0.01) return; x.save(); x.globalAlpha = a; const f = fit(x, s.toUpperCase(), 8, 220, 700); x.fillStyle = 'rgba(10,18,32,0.55)'; const w = x.measureText(s.toUpperCase()).width; x.fillRect(Math.round((NW - w) / 2) - 4, 8, Math.round(w) + 8, f + 6); txt(x, s.toUpperCase(), NW / 2, 11, f, '#ffffff', 700, 'center'); x.restore(); }
  function signText(x, lines, cx, y, maxw) { lines.forEach((l, k) => { const f = fit(x, l, 8, maxw, 700); txt(x, l, cx, y + k * 10, f, k ? '#ffe2b0' : '#fff6dc', 700, 'center'); }); }
  function signHint(x, s, a) { if (a <= 0.01) return; const G = R.sign, gw = G.width * 2, gh = G.height * 2, gx = Math.round((NW - gw) / 2), sway = Math.round(Math.sin(Date.now() / 700) * 0), gy = 4 + sway;
    const up = s.toUpperCase(), m = up.match(/^(TYPE \S+)\s+(.*)$/), lines = m ? [m[1], m[2]] : [up];
    x.save(); x.globalAlpha = a; x.drawImage(G, gx, gy, gw, gh); signText(x, lines, NW / 2, gy + (lines.length > 1 ? 18 : 23), gw - 54); x.restore(); }
  function drawToast(ctx, text, age, k) { // "not enough fish" & co. on the hanging wooden sign
    if (busyN >= drawN - 1) { const m = text.match(/:\s*([^·]+)/); return labelPill(ctx, (m ? m[1] : text).trim().toUpperCase(), cl(age / 0.2) * (1 - cl((age - 3.6) / 0.4))); }
    const x = scene(), a = cl(age / 0.2) * (1 - cl((age - 3.6) / 0.4)), G = R.sign, gw = G.width * 2, gh = G.height * 2, gx = Math.round((NW - gw) / 2), drop = Math.round(-12 * (1 - eb(cl(age / 0.4)))), gy = 64 + drop - k * 60;
    const up = text.toUpperCase().replace(/\s+·\s+/, '|'), lines = up.split('|'); x.save(); x.globalAlpha = a; x.drawImage(G, gx, gy, gw, gh); signText(x, lines, NW / 2, gy + (lines.length > 1 ? 18 : 23), gw - 54); x.restore();
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(x.canvas, OX, OY, NW * SC, NH * SC); ctx.restore(); }
  function queuePill(x, q) { if (!q) return; const s = '+' + q + ' IN LINE'; x.font = `700 8px ${FONT}`; const w = x.measureText(s).width; x.fillStyle = 'rgba(10,18,32,0.7)'; x.fillRect(NW - w - 9, 4, w + 8, 12); txt(x, s, NW - 5, 6, 8, '#ffffff', 700, 'right'); }

  function plaque(x, s, T, u) { // u = seconds since landing
    const px = (NW - R.plaque.width) / 2, py = 118, pa = seg(u, 0.35, 0.7); if (pa <= 0) return; x.save(); x.globalAlpha = pa;
    // stickers on the top edge: NEW (or +N fish) left, SHINY / XMAS right
    if (s.isNew) x.drawImage(R.tagNew, px + 12, py - 6); else if (R.chip) { x.drawImage(R.chip, px + 10, py - 4); const f = '+' + (s.crumbs || 0), fs = fit(x, f, 8, 17, 700); txt(x, f, px + 10 + 26, py - 4 + Math.round((15 - fs) / 2), fs, '#ffffff', 700, 'center'); }
    const tag = s.shiny ? R.tagShiny : T.xmas ? R.tagXmas : null; if (tag) x.drawImage(tag, px + R.plaque.width - tag.width - 12, py - 6);
    const L = px + 17, RT = px + 154, W = RT - L;
    txt(x, '◆ ' + RLABEL[s.rarity], L, 145, 8, RCOL[s.rarity], 700);
    if (s.setName) { const st = 'SET ' + s.setHave + '/' + s.setOf; x.font = `700 8px ${FONT}`; const lw = x.measureText('◆ ' + RLABEL[s.rarity]).width + 6; const f = fit(x, st, 8, W - lw - 14, 400); txt(x, st, RT - 14, 145 + (8 - f), f, '#6a5a44', 400, 'right'); }
    const nm = (s.name || '').toUpperCase(), fs = fit(x, nm, 16, W, 700); txt(x, nm, L, 155 + (16 - fs) / 2, fs, '#2b2238', 700);
    const vw = '@' + (s.viewer || ''), vf = fit(x, vw, 8, W, 400); txt(x, vw, L, 174, vf, '#5a4a3a', 400);
    // luck: one pip per common in a row; full row = next one is rare+
    if (!s.isNew && R.gull && u > 0.7 && u < 3.2) { const v = u - 0.7; if (v > 0.55) emit('gag_gull', 'gull|' + s.seed + '|' + s.id); if (v < 0.1) emit('gag_splash', 'gfish|' + s.seed + '|' + s.id); const fx0 = px + 22, fy0 = py - 4;
      if (v < 0.5) { const f = v / 0.5; x.drawImage(R.gfish, Math.round(fx0 + 6 * f), Math.round(fy0 - 16 * Math.sin(Math.PI * f * 0.9) - 8)); }
      const gx = v < 0.6 ? NW + 20 - (NW + 20 - 70) * (v / 0.6) : v < 0.9 ? 70 - (70 - fx0) * ((v - 0.6) / 0.3) : fx0 - (v - 0.9) * 120, gy = v < 0.6 ? 24 : v < 0.9 ? 24 + (fy0 - 22 - 24) * ((v - 0.6) / 0.3) : fy0 - 22 - (v - 0.9) * 60, im = v < 0.85 ? R.gull : R.gullFish;
      if (v > 0.5 && v < 0.9) x.drawImage(R.gfish, Math.round(fx0 + 6), Math.round(fy0 - 12));
      x.drawImage(im, Math.round(gx - im.width / 2), Math.round(gy - im.height / 2)); }
    if (s.luckN) { const n = Math.min(9, s.luckN), lv = u > 0.9 && s.luckAfter != null ? s.luckAfter : s.luck || 0, on = Math.round(lv * n);
      txt(x, 'LUCK', L, 187, 8, '#6a5a44', 700); const p0 = L + 28, sp = Math.min(12, Math.floor((W - 28) / n));
      for (let k = 0; k < n; k++) x.drawImage(k < on ? R.pipOn : R.pipOff, p0 + k * sp, 185); }
    x.restore();
  }

  // ---- decor + micro gags (Gemini art): snowman / tree, ice hole with a seal, a fish, a puffin, snowballs, a belly-slider, snowfall
  const HX = 208, HB = 214, SMX = 17; let busyN = -9, celebN = -9, lastBusy = -99;
  function snowfall(x, c) { x.fillStyle = 'rgba(255,255,255,0.75)'; for (let q = 0; q < 26; q++) { const sp = 6 + rnd(q * 3) * 10, px = (rnd(q) * NW + Math.sin(c * 0.6 + q) * 6) % NW, py = (rnd(q * 7) * 230 + c * sp) % 230; x.fillRect(Math.round(px), Math.round(py), q % 4 ? 1 : 2, q % 4 ? 1 : 2); } }
  function decor(x, xm, c, a) { if (a <= 0.01) return; x.save(); x.globalAlpha = a;
    if (R.hole) x.drawImage(R.hole, HX - Math.round(R.hole.width / 2), HB - R.hole.height); x.restore();
  }
  const GAGS = [['seal', 3.4], ['snowball', 2.2], ['puffin', 5.0], ['fish', 1.6], ['slide', 3.0]], GAP = 8.5;
  function gagNow(c, xm) { const per = GAP, k = Math.floor(c / per), g = c - k * per; let G = GAGS[k % GAGS.length]; if (xm && G[0] === 'slide') G = ['sleigh', 4.0]; return g < G[1] ? { kind: G[0], u: g, dur: G[1], id: k } : null; }
  const SQ = [], SEEN = new Set(); function emit(k, id) { if (SEEN.has(id)) return; SEEN.add(id); if (SEEN.size > 400) SEEN.clear(); SQ.push(k); }
  function takeSfx() { return SQ.splice(0); }
  function cue(G, at, k) { if (G.u >= at && G.u < at + 0.25) emit(k, k + '|' + G.id + '|' + at); }
  function gag(x, G, BX, BY, BK) { // returns block shake offset
    if (!G) return 0; const u = G.u;
    if (G.id != null) { const C = { seal: [[0.3, 'gag_seal']], fish: [[0.05, 'gag_splash'], [1.45, 'gag_splash']], snowball: [[0.45, 'gag_snowball']], puffin: [[0.6, 'gag_puffin'], [3.6, 'gag_puffin']], slide: [[0.4, 'gag_slide']], sleigh: [[0.2, 'gag_sleigh']] }[G.kind] || []; C.forEach(([at, k]) => cue(G, at, k)); }
    if (G.kind === 'seal' && R.seal) { const up = u < 0.25 ? u / 0.25 : u > G.dur - 0.25 ? (G.dur - u) / 0.25 : 1, bob = Math.round(Math.sin(u * 6) * 1);
      if (up > 0.3) x.drawImage(R.seal, HX - Math.round(R.seal.width / 2), HB - R.seal.height + Math.round((1 - up) * 3) + (up > 0.9 ? bob : 0));
      if (up > 0.9 && Math.floor(u * 2) % 3 === 1) { x.fillStyle = '#ffffff'; x.fillRect(HX + 8, HB - 18, 1, 3); x.fillRect(HX + 7, HB - 17, 3, 1); } return 0; }
    if (G.kind === 'fish' && R.fishBody) { const F = R.fishBody, f = u / G.dur, wx = HX, wy = HB - 15, px = wx - 7 + 14 * f, py = wy - 40 * Math.sin(Math.PI * f);
      x.save(); x.beginPath(); x.rect(0, 0, NW, NH); x.rect(HX - 22, wy, 44, 30); x.clip('evenodd'); x.translate(Math.round(px), Math.round(py)); x.rotate(Math.PI * f); x.drawImage(F, -F.width / 2, -F.height * 0.35); x.restore();
      const rip = (cx, a) => { if (a <= 0) return; x.save(); x.globalAlpha = a; x.fillStyle = '#e6f6ff'; for (let q = 0; q < 10; q++) { const an = q / 10 * Math.PI * 2, r = 3 + (1 - a) * 6; x.fillRect(Math.round(cx + Math.cos(an) * r * 1.6), Math.round(wy + Math.sin(an) * r * 0.6), 1, 1); } x.restore(); };
      rip(wx - 7, 1 - f / 0.25); rip(wx + 7, (f - 0.8) / 0.2 > 0 ? 1 - (f - 0.8) / 0.2 * 0.6 : 0); return 0; }
    if (G.kind === 'snowball' && R.snowball) { const S0 = 0.45, fl = 0.7, sx = SMX + 10, sy = HB - 30, tx = BX + 12, ty = BY + 40, sm = R.snowman;
      if (sm) { // the snowman only exists for this gag: it rises out of the snow, throws, and sinks back
        const rise = u < 0.35 ? eo(u / 0.35) : u > G.dur - 0.45 ? 1 - eo((u - (G.dur - 0.45)) / 0.45) : 1, dy = Math.round((1 - rise) * sm.height);
        if (rise > 0.02) { x.save(); x.beginPath(); x.rect(0, 0, NW, HB); x.clip(); x.drawImage(sm, SMX - Math.round(sm.width / 2), HB - sm.height + dy); x.restore();
          if (rise < 0.98) { x.fillStyle = '#ffffff'; for (let q = 0; q < 6; q++) x.fillRect(Math.round(SMX - 9 + rnd(q + G.id * 7) * 18), HB - 1 - Math.round(rnd(q + 3) * 3), 2, 1); } } }
      if (u < S0) return 0;
      if (u < S0 + fl) { const f = (u - S0) / fl; x.drawImage(R.snowball, Math.round(sx + (tx - sx) * f - 7), Math.round(sy + (ty - sy) * f - 30 * Math.sin(Math.PI * f) - 7)); return 0; }
      const v = u - S0 - fl; x.fillStyle = '#ffffff'; for (let q = 0; q < 12; q++) { const a = rnd(q) * Math.PI * 2, r = 4 + 18 * v * (0.5 + rnd(q + 5)); x.fillRect(Math.round(tx + Math.cos(a) * r), Math.round(ty + Math.sin(a) * r + 20 * v * v), 2, 2); }
      return v < 0.35 ? Math.round(Math.sin(v * 60) * 2 * (1 - v / 0.35)) : 0; }
    if (G.kind === 'puffin' && R.puffL) { const top = BY + 6, land = BX + BK.width - 22;
      if (u < 1.2) { const f = eo(u / 1.2), im = R.puffFlyL; x.drawImage(im, Math.round(NW + 10 + (land - NW - 10) * f - im.width / 2), Math.round(30 + (top - 30) * f - im.height + Math.sin(u * 30) * 1)); }
      else if (u < 3.6) { const hop = Math.floor((u - 1.2) * 2) % 3 === 2 ? -1 : 0; x.drawImage((Math.floor(u * 1.2) % 2) ? R.puffL : R.puffR, land - R.puffL.width / 2, top - R.puffL.height + hop); }
      else { const f = (u - 3.6) / 1.4, im = R.puffFlyL; x.drawImage(im, Math.round(land - (land + 30) * f * f - im.width / 2), Math.round(top - im.height - 70 * f)); } return 0; }
    if (G.kind === 'sleigh' && R.sleigh) { const f = u / G.dur, im = R.sleigh, px = NW + 20 - (NW + 40 + im.width) * f, py = 26 + Math.sin(f * 9) * 3; x.drawImage(im, Math.round(px), Math.round(py));
      x.fillStyle = '#fff3a0'; for (let q = 0; q < 6; q++) { const sx = Math.round(px + im.width + 4 + q * 5), sy = Math.round(py + 20 + Math.sin(q + u * 8) * 2); if ((q + Math.floor(u * 12)) % 2) x.fillRect(sx, sy, 1, 1); } return 0; }
    if (G.kind === 'slide' && R.p_slide) { const f = u / G.dur, im = R.p_slide, px = -40 + (NW + 80) * f; x.drawImage(im, Math.round(px - im.width / 2), HB - im.height + 2);
      x.fillStyle = '#ffffff'; for (let q = 0; q < 5; q++) x.fillRect(Math.round(px - im.width / 2 - 3 - q * 3), HB - 2 - Math.round(rnd(q + Math.floor(u * 25)) * 4), 2, 2); return 0; }
    return 0;
  }
  function aurora(x, u, c) { const k = cl(u / 1.2); x.save(); x.globalCompositeOperation = 'lighter';
    for (let band = 0; band < 3; band++) { const col = ['70,255,170', '150,110,255', '90,220,255'][band]; for (let px = 0; px < NW; px += 2) { const y = 18 + band * 9 + Math.sin(px * 0.035 + c * 0.9 + band * 1.7) * 8 + Math.sin(px * 0.011 - c * 0.4) * 6, h = 16 + Math.sin(px * 0.05 + band + c) * 6;
        const g = x.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.5, `rgba(${col},${0.22 * k})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(px, Math.round(y), 2, Math.round(h)); } }
    x.restore(); }
  function frame(s) {
    const x = scene(), T = s.T, t = s.t, CX = NW / 2, FLOOR = 127, xm = T ? T.xmas : xmasOn(s.xmas);
    const BK = xm ? R.xbox : R.box, BX = Math.round((NW - BK.width) / 2), BY = 204 - BK.height;
    if (t == null) { // idle: the block breathes; the shadow of a penguin the channel has not found yet waits inside
      if (panelN >= drawN - 2) lastBusy = s.clock; // !collection panel open: decor + gags step aside (never half-hidden behind the panel)
      const bob = Math.round(Math.sin(s.clock * 1.6) * 1), da = cl((s.clock - lastBusy) / 0.6), G = celebN >= drawN - 2 || da < 1 ? null : gagNow(s.clock, xm);
      snowfall(x, s.clock); decor(x, xm, s.clock, da);
      const gsh = G && G.kind !== 'slide' && G.kind !== 'puffin' && G.kind !== 'sleigh' ? gag(x, G, BX, BY, BK) : 0;
      x.drawImage(BK, BX + gsh, BY + bob);
      if (G && (G.kind === 'slide' || G.kind === 'puffin' || G.kind === 'sleigh')) gag(x, G, BX, BY + bob, BK);
      if (s.tease) { const sh = Math.round(BK.height * 0.55), sw = Math.round(s.tease.width * sh / s.tease.height); x.save(); x.globalAlpha = 0.45 + 0.08 * Math.sin(s.clock * 2.3); x.drawImage(sil(s.tease, '#0d1a2c'), Math.round(BX + (BK.width - sw) / 2 + Math.sin(s.clock * 0.9) * 3), BY + BK.height - sh - 10 + bob, sw, sh); x.restore(); }
      hintLine(x, s.hint, 1); bar(x, s.chHave, s.chOf); queuePill(x, s.queue); return x.canvas;
    }
    const P = s.shiny && s.shinyImg ? s.shinyImg : xm && s.xmasImg ? s.xmasImg : s.img;
    const rar = s.rarity, [gr, gg, gb] = GLOW[rar] || GLOW.common, nb = T.bonks.length, lastB = T.bonks[nb - 1], big = T.big;
    let shake = 0, lean = 0; T.bonks.forEach((b, k) => { const d = t - b; if (d >= 0 && d < 0.45) shake += Math.round(Math.sin(d * 70) * (1 - d / 0.45) * (2 + k * 1.5)); });
    if (big) lean = -Math.round(4 * eo(seg(t, lastB - 0.8, lastB - 0.2)) * (1 - seg(t, lastB - 0.12, lastB)));
    if (rar === 'mythic' && t > T.boom - 0.3) aurora(x, t - (T.boom - 0.3), s.clock);
    lastBusy = s.clock; if (t >= T.boom - 0.3) busyN = drawN;
    snowfall(x, s.clock); decor(x, xm, s.clock, 1 - seg(t, T.boom - 0.15, T.boom + 0.25));
    if (big && R.walrus) { // a posh walrus surfaces in the ice hole to judge the big ones (monocle pops off on the last bonk), then fades out with the hole at the reveal
      const up = eo(seg(t, 0.4, 0.75)), fa = 1 - seg(t, T.boom - 0.15, T.boom + 0.25), W = t > lastB - 0.8 && R.walrusWow ? R.walrusWow : R.walrus, bob = Math.round(Math.sin(t * 2.6) * 1);
      if (up > 0.3 && fa > 0.01) { x.save(); x.globalAlpha = fa; x.drawImage(W, HX - Math.round(W.width / 2), HB - W.height + Math.round((1 - up) * 4) + (up > 0.9 ? bob : 0)); x.restore(); }
      if (t > 1.0) emit('gag_bear', 'bear|' + s.seed + '|' + s.id); }
    if (!big && R.chickRun && t < T.boom + 0.2) { const CB = R.chickBonk, CR = R.chickRun, headTop = 204 - CB.height, headBot = 204 - Math.round(CB.height * 0.4);
      const contact = BX + shake + lean + edgeX(BK, 'left', headTop - BY, headBot - BY) - edgeX(CB, 'right', 0, Math.round(CB.height * 0.6)) - 1 + 1; // chick's forehead meets the ice
      const restX = contact - 10; let pose = CR, ox = restX, star = false, hit = -1;
      T.bonks.forEach(b => { const d = t - b; if (d > -0.16 && d < 0) { pose = CB; ox = restX + 10 * eo((d + 0.16) / 0.16); } else if (d >= 0 && d < 0.18) { pose = CB; ox = contact + 4; hit = d; emit('gag_chick', 'chick|' + s.seed + '|' + b); } else if (d >= 0.18 && d < 0.4) { ox = contact - 10 * eo((d - 0.18) / 0.22); } if (d >= 0.18 && d < 0.8) star = true; });
      const enter = eo(seg(t, 0.1, 0.6)), left = Math.round(-40 + (ox + 40) * enter + (pose === CR && !star ? Math.sin(t * 20) * 1 : 0)), top = 204 - pose.height;
      if (hit >= 0) { const sq = hit < 0.1 ? 0.8 + 2 * hit : 1, w = Math.round(pose.width * sq), hh = Math.round(pose.height * (2 - sq) * 0.98 + pose.height * 0.02); x.drawImage(pose, left + pose.width - w, 204 - hh, w, hh); // squashes into the ice
        if (hit < 0.12) { const ix = left + pose.width - 2, iy = 204 - Math.round(pose.height * 0.62); x.fillStyle = '#ffffff'; [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.4], [0, 1.4]].forEach(([u, v]) => { for (let r = 3; r < 3 + 4 * (1 - hit / 0.12); r++) x.fillRect(Math.round(ix + u * r), Math.round(iy + v * r), 1, 1); }); } }
      else x.drawImage(pose, left, top);
      if (star && R.star) { const a = t * 6, hx = left + pose.width / 2; x.drawImage(R.star, Math.round(hx + Math.cos(a) * 8 - 4), Math.round(top - 6 + Math.sin(a) * 2)); } }
    hintLine(x, s.hint, 1 - seg(t, 0, 0.3));
    if (t < T.boom) {
      const glowK = Math.min(1, 0.15 + 0.3 * T.bonks.filter(b => t > b).length) * (0.8 + 0.2 * Math.sin(t * 9));
      radial(x, CX, BY + BK.height / 2, 70, `${gr},${gg},${gb}`, 0.55 * glowK);
      x.drawImage(BK, BX + shake + lean, BY);
      let push = 0; T.bonks.forEach(b => { const d = t - b; if (d > -0.15 && d < 0.2) push = Math.max(push, d < 0 ? (d + 0.15) / 0.15 : 1 - d / 0.2); });
      let pose = 'run'; T.bonks.forEach((b, k) => { const d = t - b; if (d > -0.18 && d < 0.22) pose = 'headbutt'; else if (d >= 0.22 && d < 0.75 && !(big && k === nb - 1)) pose = 'dizzy'; });
      if (big && t > lastB - 0.9 && t < lastB - 0.18) pose = 'angry';
      const SP = R['p_' + pose]; if (SP) { x.save(); x.globalAlpha = 0.6; const sw = Math.round(SP.width * 0.62), sh = Math.round(SP.height * 0.62);
        x.drawImage(sil(SP, '#0d1a2c'), Math.round(BX + shake + lean + (BK.width - sw) / 2 + push * 4), Math.round(BY + BK.height - sh - 12 - push * 3), sw, sh); x.restore(); }
      x.strokeStyle = '#ffffff'; x.lineWidth = 1; T.bonks.forEach((b, k) => { if (t < b) return; x.beginPath(); let qx = BX + 30 + k * 9 + shake, qy = BY + 28; x.moveTo(qx, qy); for (let q = 0; q < 5; q++) { qx += (rnd(k * 9 + q) - 0.5) * 10; qy += 6; x.lineTo(Math.round(qx) + 0.5, qy + 0.5); } x.stroke(); });
      T.bonks.forEach((b, k) => { const d = t - b; if (d < 0 || d > 0.9) return;
        if (d < 0.5 && R.bonk) { const sc = 1 + 0.35 * (1 - d / 0.5), w = Math.round(R.bonk.width * sc), h = Math.round(R.bonk.height * sc); x.drawImage(R.bonk, Math.round(CX + 30 - w / 2), Math.round(BY - 22 - d * 12 - (h - R.bonk.height) / 2), w, h); }
        if (!(big && k === nb - 1) && R.star) for (let q = 0; q < 3; q++) { const a = d * 6 + q * 2.09; x.drawImage(R.star, Math.round(CX + Math.cos(a) * 18 - 4), Math.round(BY - 14 + Math.sin(a) * 5 - 4)); } });
      if (big && t > lastB - 0.9 && t < lastB - 0.1 && R.anger) { x.save(); x.globalAlpha = seg(t, lastB - 0.9, lastB - 0.75);
        const beat = Math.sin(t * 18) > 0.3 ? 1.2 : 1, aw = Math.round(R.anger.width * beat), ah = Math.round(R.anger.height * beat);
        x.drawImage(R.anger, Math.round(BX + BK.width - 17 + shake + lean - (aw - R.anger.width) / 2), Math.round(BY - 6 - (ah - R.anger.height) / 2), aw, ah);
        x.drawImage(R.grr, BX + BK.width - 15 + Math.round(rnd(Math.floor(t * 20)) * 2 - 1), BY - 27 + Math.round(rnd(Math.floor(t * 20) + 7) * 2 - 1)); x.restore(); }
    } else {
      const u = t - T.boom, glowS = `${gr},${gg},${gb}`;
      if (u < 0.35) { const fa = 1 - u / 0.35, fr = 30 + 120 * u / 0.35, g = x.createRadialGradient(CX, BY + 40, 1, CX, BY + 40, fr); g.addColorStop(0, `rgba(255,255,255,${fa})`); g.addColorStop(0.5, `rgba(${glowS},${0.6 * fa})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, NW, NH); }
      for (let k = 0; k < (big ? 22 : 12); k++) { const a = rnd(k) * Math.PI * 2, sp = 60 + rnd(k + 9) * (big ? 130 : 80), qx = CX + Math.cos(a) * sp * u, qy = BY + 40 + Math.sin(a) * sp * u + 180 * u * u; if (qy > 214) continue; x.fillStyle = k % 3 ? '#cdeeff' : '#ffffff'; const z = 2 + (k % 3); x.fillRect(Math.round(qx), Math.round(qy), z, z); x.fillStyle = '#1b2433'; x.fillRect(Math.round(qx), Math.round(qy) + z, z, 1); }
      const LD = xm ? R.xlid : R.lid, BT = xm ? R.xbottom : R.bottom, lt = Math.min(u, 1);
      x.save(); x.globalAlpha = 1 - seg(u, 0.45, 0.8); x.drawImage(LD, Math.round(BX - 110 * lt), Math.round(BY - 10 - 120 * lt + 160 * lt * lt)); x.restore();
      x.save(); x.globalAlpha = 1 - seg(u, 0.1, 0.35); x.drawImage(BT, Math.round((NW - BT.width) / 2), 204 - BT.height + Math.round(30 * seg(u, 0.1, 0.35))); x.restore();
      const stage = eo(seg(u, 0.15, 0.55)); x.drawImage(R.plaque, (NW - R.plaque.width) / 2, Math.round(118 + 150 * (1 - stage)));
      if (P) {
        if (u < T.fly) { const f = u / T.fly, qx = CX + 50 * f, qy = BY + 30 - 75 * Math.sin(Math.PI * f) + (FLOOR - P.height / 2 - BY - 30) * f; x.save(); x.translate(qx, qy); x.rotate(f * Math.PI * (big ? 4 : 2));
          if (big) radial(x, 0, 0, 40, glowS, 0.9); x.drawImage(big ? sil(P, '#0b0f1a') : P, -P.width / 2, -P.height / 2); x.restore(); }
        else if (u < T.fly + T.slide) { const f = (u - T.fly) / T.slide, qx = CX + 50 - 50 * eo(f), qy = FLOOR - P.width / 2 + 4; x.save(); x.translate(Math.round(qx), qy); x.rotate(-Math.PI / 2 + 0.15); x.drawImage(big && f < 0.5 ? sil(P, '#0b0f1a') : P, -P.width / 2, -P.height / 2); x.restore();
          if (big && f >= 0.35 && f < 0.75) { const fa = 1 - Math.abs(f - 0.5) * 4, g = x.createRadialGradient(qx, qy, 1, qx, qy, 60); g.addColorStop(0, `rgba(255,255,255,${fa})`); g.addColorStop(0.45, `rgba(${glowS},${0.7 * fa})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, NW, NH); }
          for (let q = 0; q < 6; q++) { x.fillStyle = '#ffffff'; x.fillRect(Math.round(qx + 20 + q * 4 + rnd(q + u * 30) * 4), Math.round(FLOOR - 4 - rnd(q * 3 + u * 40) * 8), 2, 2); } }
        else { const v = u - T.fly - T.slide, pop = eb(seg(v, 0, 0.35)), sq = 1 + 0.25 * Math.sin(Math.PI * seg(v, 0, 0.3)) * (1 - seg(v, 0.3, 0.5)), pul = 0.75 + 0.25 * Math.sin(v * 5);
          radial(x, CX, FLOOR - 30, big ? 70 : 45, glowS, (big ? 0.75 : 0.45) * pul);
          const w = P.width * (1 / sq + (sq - 1) * 0.2), h = P.height * pop * sq; x.drawImage(P, Math.round(CX - w / 2), Math.round(FLOOR - h), Math.round(w), Math.round(h));
          for (let q = 0; q < (big ? 10 : 5) + (s.shiny ? 6 : 0); q++) { const ph = (v * 0.8 + rnd(q)) % 1, a = Math.sin(Math.PI * ph); if (a < 0.3) continue; const sx = Math.round(CX - 40 + rnd(q * 7) * 80), sy = Math.round(FLOOR - 70 + rnd(q * 3) * 60 - ph * 10); x.fillStyle = s.shiny ? ['#9ff', '#c9f', '#fff', '#9fc'][q % 4] : big ? '#ffe9a0' : '#ffffff'; x.fillRect(sx, sy - 1, 1, 3); x.fillRect(sx - 1, sy, 3, 1); }
          plaque(x, s, T, v); }
      }
    }
    const before = t < T.settle; bar(x, before ? s.chHaveBefore : s.chHave, s.chOf); queuePill(x, s.queue);
    return x.canvas;
  }

  let drawN = 0, panelN = -9, rainN = -9;
  function draw(ctx, s) {
    drawN++; if (panelN >= drawN - 2 || rainN >= drawN - 2 || celebN >= drawN - 2) s = Object.assign({}, s, { hint: '' });
    const T = s.t != null ? Object.assign(timelineFor(s), { xmas: xmasOn(s.xmas) }) : null;
    const c = frame(Object.assign({}, s, { T }));
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, OX, OY, NW * SC, NH * SC); ctx.restore();
  }

  // celebration / rain banners (pixel text over a dark band; Gemini art pending)
  const CELEB = { master: 'MASTER COLLECTOR!', channel: 'COLONY COMPLETE!' };
  function blit(ctx, x) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(x.canvas, OX, OY, NW * SC, NH * SC); ctx.restore(); }
  function celebDuration(cfg, queued) { return 3.8; }
  function drawCeleb(ctx, c) {
    celebN = drawN;
    const x = scene(), dur = c.dur || 3.4, a = seg(c.t, 0, 0.2) * (1 - seg(c.t, dur - 0.4, dur)), B = R.banner, bw = B.width * 2, bh = B.height * 2, bx = Math.round((NW - bw) / 2), drop = Math.round(-30 * (1 - eb(seg(c.t, 0, 0.45)))), by = 64 + drop;
    x.save(); x.globalAlpha = a;
    const top = (c.top || '').toUpperCase(), tf = fit(x, top, 8, 220, 700), tw = x.measureText(top).width; x.fillStyle = 'rgba(10,18,32,0.7)'; x.fillRect(Math.round((NW - tw) / 2) - 5, by - 16, Math.round(tw) + 10, tf + 6); txt(x, top, NW / 2, by - 13, tf, '#ffffff', 700, 'center');
    x.drawImage(B, bx, by, bw, bh);
    const big = (CELEB[c.kind] || c.big || 'COMPLETE!').toUpperCase(), bf = fit(x, big, 10, bw - 52, 700); txt(x, big, NW / 2, by + 15 + Math.round((10 - bf) / 2), bf, '#fff6dc', 700, 'center');
    for (let q = 0; q < 16; q++) { const ph = (c.t * 0.9 + rnd(q)) % 1; if (Math.sin(Math.PI * ph) < 0.4) continue; const sx = Math.round(bx - 10 + rnd(q * 5) * (bw + 20)), sy = Math.round(by - 8 + rnd(q * 9) * (bh + 16)); x.drawImage(R.star, sx - 4, sy - 4); }
    x.restore(); blit(ctx, x);
  }
  function labelPill(ctx, str, a) { const x = scene(); x.save(); x.globalAlpha = a; const bx = (NW - R.bar.width) / 2, f = fit(x, str, 8, R.bar.width - 16, 700); x.fillStyle = 'rgba(30,70,120,1)'; x.fillRect(bx + 2, 216, R.bar.width - 4, 14); txt(x, str, NW / 2, 218 + (8 - f) / 2, f, '#ffffff', 700, 'center'); x.restore(); blit(ctx, x); }
  function drawRain(ctx, st) {
    rainN = drawN;
    if (busyN >= drawN - 1) return labelPill(ctx, `RAIN ${(st.cmd || '!bonk').toUpperCase()} ${Math.max(0, Math.ceil(st.left))}S`, cl(st.left / 0.8));
    const x = scene(), G = R.sign, gw = G.width * 2, gh = G.height * 2, gx = Math.round((NW - gw) / 2), a = cl((st.t || 0) / 0.6) * cl(st.left / 0.8), sway = Math.round(Math.sin((st.t || 0) * 2) * 1), gy = 22 + sway;
    x.save(); x.globalAlpha = a; x.drawImage(G, gx, gy, gw, gh);
    txt(x, 'SNOW RAIN', NW / 2, gy + 21, 10, '#fff6dc', 700, 'center');
    const l2 = `${(st.cmd || '!bonk').toUpperCase()} · ${Math.max(0, Math.ceil(st.left))}S`; txt(x, l2, NW / 2, gy + 34, fit(x, l2, 8, gw - 50, 700), '#ffe2b0', 700, 'center');
    x.fillStyle = '#c9f0ff'; x.fillRect(gx + 26, gy + gh - 9, Math.round((gw - 52) * cl(st.left / (st.total || 60))), 2);
    for (let q = 0; q < 10; q++) { const sx = Math.round((rnd(q * 3) * NW + (st.t || 0) * 6 * (q % 3 + 1)) % NW), sy = Math.round((rnd(q * 7) * 200 + (st.t || 0) * 25 * (1 + q % 2)) % 200); x.fillStyle = '#ffffff'; x.fillRect(sx, sy, 2, 2); }
    x.restore(); blit(ctx, x);
  }
  // !collection panel: Gemini frame + slots, full-resolution layout on the 1000x1100 canvas
  const RLOOK = { common: '#a7b0bd', rare: '#3f8fe0', epic: '#9a5ae0', legendary: '#e0a33f', mythic: '#2fb8a0' };
  let LAYOUTS = null, panelStyle = 'cabin'; const PIMG = {};
  function hasPanel() { return !!(LAYOUTS && LAYOUTS[panelStyle] && PIMG[LAYOUTS[panelStyle].board]); }
  function setPanelStyle(n) { panelStyle = n; }
  function drawPanel(ctx, d, t, dur) {
    panelN = drawN; const L = LAYOUTS[panelStyle], BD = PIMG[L.board], SL = L.slot ? PIMG[L.slot] : null; dur = dur || 9;
    const a = seg(t, 0, 0.3) * (1 - seg(t, dur - 0.4, dur)), rise = Math.round(40 * (1 - eo(seg(t, 0, 0.4))));
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(8,14,26,0.72)'; ctx.fillRect(0, 0, 1000, 1100); ctx.imageSmoothingEnabled = false; ctx.translate(0, rise);
    ctx.drawImage(BD, L.bx, L.by);
    const T = (str, o, al) => { let f = o.size; ctx.font = `700 ${f}px ${FONT}`; while (ctx.measureText(str).width > o.maxw && f > 8) { f--; ctx.font = `700 ${f}px ${FONT}`; } ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; if (o.pill) { const w = ctx.measureText(str).width; ctx.fillStyle = 'rgba(14,22,36,0.82)'; ctx.fillRect(Math.round(o.x - w / 2 - 12), Math.round(o.y - f / 2 - 8), Math.round(w + 24), f + 16); } ctx.fillStyle = `rgb(${o.col})`; ctx.fillText(str, o.x, o.y); };
    T(('@' + d.name).toUpperCase(), L.title);
    ctx.globalAlpha = a * seg(t, 0.3, 0.6); T(`${d.found}/${d.total} FOUND · ${d.shiny} SHINY · ${d.embers} FISH (${d.craft.toUpperCase()} = ${d.cost})`, L.sum); ctx.globalAlpha = a;
    let idx = 0; const labels = [];
    d.sets.forEach((set, si) => { const have = set.items.filter(i => i.has).length, done = have === set.items.length && have > 0;
      if (L.labels[si]) labels.push([L.labels[si], set.name.toUpperCase() + '  ' + have + '/' + set.items.length + (done ? '  COMPLETE!' : ''), done, seg(t, 0.4 + si * 0.15, 0.7 + si * 0.15)]);
      set.items.forEach(it => { const i = idx++, C = L.cells[i]; if (!C) return; const ta = seg(t, 0.45 + i * 0.035, 0.7 + i * 0.035);
        ctx.globalAlpha = a * ta;
        if (SL && C.sx != null) ctx.drawImage(SL, C.sx, C.sy);
        const im = it.shiny && it.shinyImg ? it.shinyImg : it.img; if (im) {
          let w = im.width * 2, h = im.height * 2; if (w > 124) { h = Math.round(h * 124 / w); w = 124; }
          const pop = it.has ? 1 + 0.18 * Math.sin(Math.PI * seg(t, 0.55 + i * 0.035, 0.85 + i * 0.035)) : 1, pw = Math.round(w * pop), ph = Math.round(h * pop);
          if (it.has) ctx.drawImage(im, Math.round(C.cx - pw / 2), C.bottom - ph, pw, ph); else { ctx.globalAlpha = a * ta * 0.55; ctx.drawImage(sil(im, '#33465c'), Math.round(C.cx - w / 2), C.bottom - h, w, h); ctx.globalAlpha = a * ta; } }
        if (it.has) { ctx.fillStyle = RLOOK[it.rarity] || '#a7b0bd'; ctx.fillRect(C.dot[0], C.dot[1], 9, 9); ctx.fillStyle = 'rgba(10,18,32,0.6)'; ctx.fillRect(C.dot[0], C.dot[1] + 9, 9, 2); }
        if (it.has && it.shiny) { for (let q = 0; q < 3; q++) { const ph2 = (t * 1.1 + q / 3 + i * 0.37) % 1, al = Math.sin(Math.PI * ph2); if (al < 0.25) continue; ctx.save(); ctx.globalAlpha = a * ta * al; ctx.drawImage(R.star, Math.round(C.cx - 46 + rnd(i * 7 + q) * 80), Math.round(C.bottom - 120 + rnd(i * 3 + q) * 90), 16, 18); ctx.restore(); } } });
    });
    labels.forEach(([[lx, ly], str, done, la]) => { ctx.globalAlpha = a * la; ctx.font = `700 15px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; const w = ctx.measureText(str).width; ctx.fillStyle = 'rgba(14,22,36,0.75)'; ctx.fillRect(lx - 6, ly - 4, w + 12, 22); ctx.fillStyle = done ? '#6ee696' : '#f0f4fa'; ctx.fillText(str, lx, ly); });
    ctx.restore();
  }

  window.BlindBoxPresenters.penguinBonk = { VERSION, init, draw, timelineFor, cues, drawCeleb, drawRain, celebDuration, drawPanel, hasPanel, setPanelStyle, drawToast, takeSfx, celebAfter: 0.9, xmasOn, NW, NH, SC };
})();
