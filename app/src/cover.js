// Neon Coast Cover Studio: the cover renderer.
//
// Turns one photo into multi-panel poster cover art: the photo is split across bold panels,
// each panel a different crop of the same picture with its own zoom, then the whole cover is
// colour-graded (sunset, neon or vice), framed with thick panel borders, and lettered with a
// heavy title at the top and a caption banner at the foot. Pure canvas 2D, no libraries.

export const EXPORT_SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const HEAVY_FONT = '"Arial Black", "Franklin Gothic Heavy", Impact, "Segoe UI", sans-serif';

// Each grade: a canvas filter for the photo, an overlay gradient (top, middle, bottom stops),
// and the accent colours the lettering picks up.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
    overlay: [[0, 'rgba(255, 94, 40, 0.10)'], [0.55, 'rgba(255, 0, 110, 0.16)'], [1, 'rgba(24, 0, 54, 0.38)']],
    accent: '#ffb347',
    titleStops: ['#ffffff', '#ffd76a'],
    glow: 'rgba(255, 110, 60, 0.55)',
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.5) contrast(1.16) brightness(1.0)',
    overlay: [[0, 'rgba(0, 240, 255, 0.15)'], [0.5, 'rgba(90, 0, 200, 0.12)'], [1, 'rgba(255, 0, 140, 0.24)']],
    accent: '#00f0ff',
    titleStops: ['#ffffff', '#7df9ff'],
    glow: 'rgba(0, 240, 255, 0.6)',
  },
  vice: {
    label: 'Vice',
    filter: 'saturate(1.22) contrast(1.03) brightness(1.07)',
    overlay: [[0, 'rgba(255, 150, 200, 0.20)'], [0.55, 'rgba(160, 120, 255, 0.10)'], [1, 'rgba(40, 200, 190, 0.20)']],
    accent: '#ff9ecf',
    titleStops: ['#ffffff', '#ffd7ec'],
    glow: 'rgba(255, 120, 190, 0.5)',
  },
};

// Panel layouts in relative coordinates. fx/fy is the point of the photo the panel centres on,
// zoom how far it punches in past a plain cover-fit. The first panel is the hero: it follows the
// person's own pan and zoom from the editor.
export const LAYOUTS = {
  hero: {
    label: 'Hero Grid',
    panels: [
      { x: 0, y: 0, w: 0.66, h: 1, fx: 0.5, fy: 0.45, zoom: 1, hero: true },
      { x: 0.66, y: 0, w: 0.34, h: 0.5, fx: 0.78, fy: 0.22, zoom: 1.7 },
      { x: 0.66, y: 0.5, w: 0.34, h: 0.5, fx: 0.60, fy: 0.84, zoom: 1.6 },
    ],
  },
  mosaic: {
    label: 'Mosaic',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.52, fx: 0.3, fy: 0.3, zoom: 1.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.52, fx: 0.72, fy: 0.28, zoom: 1.5 },
      { x: 0, y: 0.52, w: 0.5, h: 0.48, fx: 0.68, fy: 0.75, zoom: 1.6 },
      { x: 0.5, y: 0.52, w: 0.5, h: 0.48, fx: 0.5, fy: 0.5, zoom: 1, hero: true },
    ],
  },
  strip: {
    label: 'Film Strip',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1, fx: 0.18, fy: 0.45, zoom: 1.45 },
      { x: 0.34, y: 0, w: 0.33, h: 1, fx: 0.5, fy: 0.5, zoom: 1.1, hero: true },
      { x: 0.67, y: 0, w: 0.33, h: 1, fx: 0.84, fy: 0.45, zoom: 1.45 },
    ],
  },
};

const panelCanvas = document.createElement('canvas');

/** The source rectangle of `photo` that fills a panel of pw x ph, centred on the focus point. */
function panelSourceRect(photo, pw, ph, fx, fy, zoom) {
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const sw = pw / scale;
  const sh = ph / scale;
  const cx = Math.min(Math.max(fx * iw, sw / 2), iw - sw / 2);
  const cy = Math.min(Math.max(fy * ih, sh / 2), ih - sh / 2);
  return [cx - sw / 2, cy - sh / 2, sw, sh];
}

/** Paints one panel: the graded crop of the photo, or a drawn backdrop when there is no photo. */
function drawPanel(ctx, photo, rect, panel, grade, state) {
  const { x, y, w, h } = rect;
  panelCanvas.width = Math.max(2, Math.round(w));
  panelCanvas.height = Math.max(2, Math.round(h));
  const pctx = panelCanvas.getContext('2d');
  if (photo) {
    const zoom = panel.zoom * (panel.hero ? state.zoom : 1);
    const fx = panel.hero ? 0.5 + state.panX : panel.fx;
    const fy = panel.hero ? 0.5 + state.panY : panel.fy;
    const [sx, sy, sw, sh] = panelSourceRect(photo, w, h, fx, fy, zoom);
    pctx.filter = grade.filter;
    pctx.drawImage(photo, sx, sy, sw, sh, 0, 0, panelCanvas.width, panelCanvas.height);
    pctx.filter = 'none';
  } else {
    drawBackdrop(pctx, panelCanvas.width, panelCanvas.height, grade, panel.fx);
  }
  const grad = pctx.createLinearGradient(0, 0, 0, panelCanvas.height);
  for (const [stop, colour] of grade.overlay) grad.addColorStop(stop, colour);
  pctx.fillStyle = grad;
  pctx.fillRect(0, 0, panelCanvas.width, panelCanvas.height);
  ctx.drawImage(panelCanvas, x, y);
}

/** A drawn sunset-bay backdrop for the empty state, so a fresh cover still looks like a poster. */
function drawBackdrop(ctx, w, h, grade, seed) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2a1052');
  sky.addColorStop(0.55, '#b03080');
  sky.addColorStop(0.78, '#ff7a40');
  sky.addColorStop(0.781, '#1d5f74');
  sky.addColorStop(1, '#0d2f4a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(w * (0.3 + seed * 0.4), h * 0.72, h * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#160a28';
  let bx = -w * 0.05;
  let n = 0;
  while (bx < w) {
    const bw = w * (0.06 + ((n * 37 + seed * 91) % 10) / 90);
    const bh = h * (0.16 + ((n * 53 + seed * 29) % 12) / 40);
    ctx.fillRect(bx, h * 0.78 - bh, bw, bh);
    bx += bw + w * 0.015;
    n += 1;
  }
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [stop, colour] of grade.overlay) grad.addColorStop(stop, colour);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Thick dark panel borders with a hairline of light inside each, plus the outer frame. */
function drawPanelBorders(ctx, w, h, panels, grade) {
  const thick = Math.max(6, w * 0.009);
  ctx.lineWidth = thick;
  ctx.strokeStyle = '#0b0b12';
  for (const p of panels) {
    ctx.strokeRect(p.x * w, p.y * h, p.w * w, p.h * h);
  }
  ctx.lineWidth = Math.max(1.5, w * 0.0016);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  for (const p of panels) {
    const inset = thick * 0.9;
    ctx.strokeRect(p.x * w + inset, p.y * h + inset, p.w * w - inset * 2, p.h * h - inset * 2);
  }
  ctx.lineWidth = thick * 1.6;
  ctx.strokeStyle = '#0b0b12';
  ctx.strokeRect(0, 0, w, h);
  ctx.lineWidth = Math.max(2, w * 0.0022);
  ctx.strokeStyle = grade.accent;
  ctx.strokeRect(thick * 1.1, thick * 1.1, w - thick * 2.2, h - thick * 2.2);
}

/** Soft darkening at the edges, so the lettering and the middle of the cover carry the eye. */
function drawVignette(ctx, w, h) {
  const rad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  rad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  rad.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, w, h);
}

/** Fits `text` in `font` at the biggest size up to startSize that stays inside maxWidth. */
function fitFontSize(ctx, text, startSize, maxWidth, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${HEAVY_FONT}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size *= 0.94;
    ctx.font = `${weight} ${size}px ${HEAVY_FONT}`;
  }
  return size;
}

/** The big title across the top: gradient-filled heavy capitals with an outline and a glow. */
function drawTitleTreatment(ctx, w, h, title, grade) {
  const text = title.trim().toUpperCase();
  if (!text) return;
  const scrim = ctx.createLinearGradient(0, 0, 0, h * 0.30);
  scrim.addColorStop(0, 'rgba(5, 0, 16, 0.55)');
  scrim.addColorStop(1, 'rgba(5, 0, 16, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h * 0.30);
  const size = fitFontSize(ctx, text, h * 0.115, w * 0.92, 900);
  ctx.font = `900 ${size}px ${HEAVY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older engines */ }
  const grad = ctx.createLinearGradient(0, h * 0.035, 0, h * 0.035 + size);
  grad.addColorStop(0, grade.titleStops[0]);
  grad.addColorStop(1, grade.titleStops[1]);
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = size * 0.35;
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = '#12061f';
  ctx.lineJoin = 'round';
  const ty = h * 0.038;
  ctx.strokeText(text, w / 2, ty);
  ctx.fillStyle = grad;
  ctx.fillText(text, w / 2, ty);
  ctx.shadowBlur = 0;
  try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
  const ruleY = ty + size * 1.22;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(w * 0.30, ruleY, w * 0.40, Math.max(3, h * 0.006));
}

/** The caption along the foot: white heavy capitals on a dark band with an accent top edge. */
function drawCaptionBanner(ctx, w, h, caption, grade) {
  const text = caption.trim().toUpperCase();
  if (!text) return;
  const bandH = h * 0.135;
  const bandY = h - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, 'rgba(6, 2, 14, 0)');
  band.addColorStop(0.35, 'rgba(6, 2, 14, 0.78)');
  band.addColorStop(1, 'rgba(6, 2, 14, 0.92)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandY + bandH * 0.28, w, Math.max(3, h * 0.005));
  const size = fitFontSize(ctx, text, bandH * 0.52, w * 0.9, 900);
  ctx.font = `900 ${size}px ${HEAVY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = size * 0.22;
  ctx.lineWidth = size * 0.14;
  ctx.strokeStyle = '#0d0518';
  ctx.lineJoin = 'round';
  const cy = bandY + bandH * 0.66;
  ctx.strokeText(text, w / 2, cy);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, cy);
  ctx.shadowBlur = 0;
}

/**
 * Renders the whole cover onto `canvas` (already sized to the export size).
 * state: { photo, title, caption, layout, grade, zoom, panX, panY }.
 */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero;
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, w, h);
  for (const panel of layout.panels) {
    drawPanel(ctx, state.photo, { x: panel.x * w, y: panel.y * h, w: panel.w * w, h: panel.h * h }, panel, grade, state);
  }
  drawVignette(ctx, w, h);
  drawPanelBorders(ctx, w, h, layout.panels, grade);
  drawTitleTreatment(ctx, w, h, state.title, grade);
  drawCaptionBanner(ctx, w, h, state.caption, grade);
}
