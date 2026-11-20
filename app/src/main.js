// Neon Coast Cover Studio: the editor wiring.
//
// Pick a photo (file picker or drag-and-drop), choose a panel layout and a colour grade, drag
// the cover to reposition the hero crop, type a title and a caption, and export a PNG at
// 1080 x 1080, 1080 x 1350 or 1920 x 1080. Everything happens on this machine: the photo is
// read into the page and never uploaded. `?sample=1` loads the bundled sample photo, and
// `?shot=cover` sets up a fixed scene for screenshots.
import { EXPORT_SIZES, renderCover } from './cover.js';

const canvas = document.getElementById('cover');
const stage = document.getElementById('stage');
const status = document.getElementById('status');
const sizeSelect = document.getElementById('size');

const state = {
  photo: null,
  title: 'Neon Coast',
  caption: 'Palm City Heat',
  layout: 'hero',
  grade: 'sunset',
  zoom: 1,
  panX: 0,
  panY: 0,
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  const [w, h] = EXPORT_SIZES[sizeSelect.value] ?? EXPORT_SIZES['1080x1080'];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  renderCover(canvas, state);
}

/** Renders a cover at an exact size with any overrides, and returns it as a PNG data URL. */
export function exportCoverPNG(width, height, overrides = {}) {
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  renderCover(out, { ...state, ...overrides });
  return out.toDataURL('image/png');
}

async function loadPhotoFile(file) {
  if (!file) return;
  state.photo = await loadImage(URL.createObjectURL(file));
  state.panX = 0;
  state.panY = 0;
  status.textContent = `Photo loaded: ${file.name}`;
  redraw();
}

document.getElementById('photo').addEventListener('change', (e) => loadPhotoFile(e.target.files[0]));
document.getElementById('sample').addEventListener('click', async () => {
  state.photo = await loadImage('sample.jpg');
  status.textContent = 'Sample photo loaded.';
  redraw();
});

for (const id of ['title', 'caption']) {
  document.getElementById(id).addEventListener('input', (e) => {
    state[id] = e.target.value;
    redraw();
  });
}
for (const id of ['layout', 'grade', 'size']) {
  document.getElementById(id).addEventListener('change', (e) => {
    if (id !== 'size') state[id] = e.target.value;
    redraw();
  });
}
document.getElementById('zoom').addEventListener('input', (e) => {
  state.zoom = Number(e.target.value);
  redraw();
});

// Drag on the cover to reposition the hero panel's crop; the wheel zooms it.
let dragFrom = null;
canvas.addEventListener('pointerdown', (e) => {
  dragFrom = { x: e.clientX, y: e.clientY, panX: state.panX, panY: state.panY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragFrom) return;
  const rect = canvas.getBoundingClientRect();
  state.panX = Math.min(0.45, Math.max(-0.45, dragFrom.panX - (e.clientX - dragFrom.x) / rect.width * 0.6));
  state.panY = Math.min(0.45, Math.max(-0.45, dragFrom.panY - (e.clientY - dragFrom.y) / rect.height * 0.6));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragFrom = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  state.zoom = Math.min(3, Math.max(1, state.zoom - Math.sign(e.deltaY) * 0.12));
  document.getElementById('zoom').value = state.zoom;
  redraw();
}, { passive: false });

// Drag-and-drop a photo anywhere onto the stage.
for (const event of ['dragenter', 'dragover']) {
  stage.addEventListener(event, (e) => {
    e.preventDefault();
    stage.classList.add('dragover');
  });
}
for (const event of ['dragleave', 'drop']) {
  stage.addEventListener(event, (e) => {
    e.preventDefault();
    stage.classList.remove('dragover');
  });
}
stage.addEventListener('drop', (e) => loadPhotoFile(e.dataTransfer.files[0]));

document.getElementById('export').addEventListener('click', () => {
  const [w, h] = EXPORT_SIZES[sizeSelect.value] ?? EXPORT_SIZES['1080x1080'];
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  renderCover(out, state);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved neon-coast-cover-${w}x${h}.png`;
  }, 'image/png');
});

// Fixed scenes and the bundled sample, for trying the app and for screenshots.
const query = new URLSearchParams(location.search);
async function setup() {
  if (query.get('sample') === '1' || query.get('shot')) {
    state.photo = await loadImage('sample.jpg');
  }
  if (query.get('shot') === 'cover') {
    document.body.classList.add('shot-cover');
    const [w, h] = EXPORT_SIZES[query.get('size')] ?? EXPORT_SIZES['1920x1080'];
    sizeSelect.value = `${w}x${h}`;
    if (query.get('layout')) state.layout = query.get('layout');
    if (query.get('grade')) state.grade = query.get('grade');
    if (query.get('title')) state.title = query.get('title');
    if (query.get('caption')) state.caption = query.get('caption');
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

window.CoverStudio = { exportCoverPNG, state };
setup();
