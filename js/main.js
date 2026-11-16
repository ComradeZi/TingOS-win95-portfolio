/* =============================================================================
   GRID//LOOP — bootstrap, theme + UI wiring
   ========================================================================== */

import { Corridor } from './corridor.js';
import { initTuningEditor } from './tuning-editor.js';

const THEMES = {
  green: {
    label: 'Neon Green',
    accent: '#00ff9c',
    accentDim: '#0a5c46',
    accentSoft: 'rgba(0, 255, 156, 0.55)',
    text: '#00ff9c',
    textDim: 'rgba(0, 255, 156, 0.6)',
    bg: '#02050a',
    solid: '#07160e',
  },
  orange: {
    label: 'Neon Orange',
    accent: '#ff9e1f',
    accentDim: '#5c3a10',
    accentSoft: 'rgba(255, 158, 31, 0.55)',
    text: '#ff9e1f',
    textDim: 'rgba(255, 158, 31, 0.6)',
    bg: '#0a0502',
    solid: '#170d04',
  },
  cyan: {
    label: 'Neon Cyan',
    accent: '#22e0ff',
    accentDim: '#0b4a5e',
    accentSoft: 'rgba(34, 224, 255, 0.55)',
    text: '#22e0ff',
    textDim: 'rgba(34, 224, 255, 0.6)',
    bg: '#020609',
    solid: '#06141c',
  },
};

let projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];

// UI effects tunables (main.js)
const UI_FX = {
  pickerTilt: -18,
  pickerOpacity: 0.14,
  scrambleDuration: 640,
};
let currentAccent = '#00ff9c';

const el = (id) => document.getElementById(id);
const viewport = el('viewport');
const boot = el('boot');
const popup = el('popup');
const fullscreen = el('fullscreen');

const corridor = new Corridor(viewport, projects);

// apply persisted tunings (tunings.js) if present
if (window.__TUNINGS) {
  const T = window.__TUNINGS;
  ['eyeHeight', 'fov', 'fogNear', 'fogFar', 'idleDrift', 'scrollGain', 'dragGain', 'friction', 'maxVel', 'bloomStrength', 'bloomRadius', 'bloomThreshold']
    .forEach((k) => { if (typeof T[k] === 'number') corridor.cfg[k] = T[k]; });
  Object.keys(corridor.fx).forEach((k) => { if (typeof T[k] === 'number') corridor.fx[k] = T[k]; });
  ['pickerTilt', 'pickerOpacity', 'scrambleDuration'].forEach((k) => { if (typeof T[k] === 'number') UI_FX[k] = T[k]; });
  corridor.applyTunings();
  if (typeof T.accentHex === 'string') applyAccent(T.accentHex);
}

const themeApi = { applyAccent, getAccent: () => currentAccent, isCustom: () => document.documentElement.dataset.theme === 'custom' };
const tuningEditor = initTuningEditor(corridor, UI_FX, themeApi);

/* ----------------------------- theme ------------------------------- */
function applyTheme(key) {
  const t = THEMES[key] || THEMES.green;
  document.documentElement.dataset.theme = key;
  const s = document.documentElement.style;
  s.setProperty('--accent', t.accent);
  s.setProperty('--accent-dim', t.accentDim);
  s.setProperty('--accent-soft', t.accentSoft);
  s.setProperty('--text', t.text);
  s.setProperty('--text-dim', t.textDim);
  s.setProperty('--bg', t.bg);
  corridor.setTheme(t);
  currentAccent = t.accent;

  document.querySelectorAll('.theme-btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.theme === key));
  });
  try { localStorage.setItem('gridloop-theme', key); } catch (_) { /* ignore */ }
}

document.querySelectorAll('.theme-btn').forEach((b) => {
  b.addEventListener('click', () => { applyTheme(b.dataset.theme); glitch(); });
});

/* ---- custom accent (color wheel) ---- */
function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
}
function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function applyAccent(hex) {
  const [r, g, b] = hexToRgb(hex);
  const t = {
    label: 'Custom',
    accent: hex,
    accentDim: rgbToHex(r * 0.35, g * 0.35, b * 0.35),
    accentSoft: rgba(hex, 0.55),
    text: hex,
    textDim: rgba(hex, 0.6),
    bg: rgbToHex(r * 0.04, g * 0.04, b * 0.04),
    solid: rgbToHex(r * 0.12, g * 0.12, b * 0.12),
  };
  currentAccent = hex;
  document.documentElement.dataset.theme = 'custom';
  const s = document.documentElement.style;
  s.setProperty('--accent', t.accent);
  s.setProperty('--accent-dim', t.accentDim);
  s.setProperty('--accent-soft', t.accentSoft);
  s.setProperty('--text', t.text);
  s.setProperty('--text-dim', t.textDim);
  s.setProperty('--bg', t.bg);
  corridor.setTheme(t);
  document.querySelectorAll('.theme-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
}

/* ----------------------------- popup ------------------------------- */
const popupKicker = el('popup-kicker');
const popupTitle = el('popup-title');
const popupDesc = el('popup-desc');
const popupTags = el('popup-tags');
const popupLink = el('popup-link');
const popupMedia = el('popup-media');
const popupRole = el('popup-role');
const popupClient = el('popup-client');
const popupTools = el('popup-tools');
const popupDuration = el('popup-duration');
const popupCase = el('popup-case');
const fullscreenContent = el('fullscreen-content');
const fullscreenHint = el('fullscreen-hint');
const fullscreenBackdrop = el('fullscreen-backdrop');
const fsPrev = el('fs-prev');
const fsNext = el('fs-next');
const fullscreenCount = el('fullscreen-count');
const editor = el('editor');
const picker = el('picker');
const viewAllBtn = el('view-all');
const pickerViewport = el('picker-viewport');
const pickerWheel = el('picker-wheel');
const nearTitleEl = el('near-title');
const nearSubEl = el('near-sub');

function resolveGalleryItems(project) {
  const list = Array.isArray(project.gallery) ? project.gallery : [];
  return list
    .map((item) => {
      if (typeof item === 'string') {
        const isVideo = /\.(mp4|webm|mov|m4v|ogv|ogg)([?#]|$)/i.test(item);
        return { type: isVideo ? 'video' : 'image', src: item, thumb: null, title: '' };
      }
      if (item && typeof item === 'object') {
        return {
          type: item.type === 'video' ? 'video' : 'image',
          src: item.src || '',
          thumb: item.thumb || null,
          title: item.title || '',
        };
      }
      return null;
    })
    .filter((item) => item && item.src);
}

// muted auto-playing preview tile (no controls, no poster) — tap to expand
function previewVideo(gallery, index, fallbackTitle) {
  const item = gallery[index];
  const v = document.createElement('video');
  v.src = item.src;
  v.muted = true;
  v.loop = true;
  v.autoplay = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('muted', '');
  v.addEventListener('click', () => openFullscreen(gallery, index, fallbackTitle));
  return v;
}

function openPopup(project) {
  if (!project) return;
  glitch();
  popupKicker.textContent = [project.category, project.year].filter(Boolean).join('  \u2014  ');
  popupTitle.textContent = project.title || '';
  popupDesc.textContent = project.description || '';

  popupTags.innerHTML = '';
  (project.tags || []).forEach((tag) => {
    const li = document.createElement('li');
    li.textContent = tag;
    popupTags.appendChild(li);
  });

  // richer detail sidebar
  const setFact = (dd, value) => {
    const fact = dd.closest('.popup__fact');
    if (value) { dd.textContent = value; fact.style.display = ''; }
    else fact.style.display = 'none';
  };
  setFact(popupRole, project.role);
  setFact(popupClient, project.client);
  setFact(popupTools, Array.isArray(project.tools) ? project.tools.join(', ') : project.tools);
  setFact(popupDuration, project.duration);

  popupCase.innerHTML = '';
  const paragraphs = Array.isArray(project.caseStudy) ? project.caseStudy : (project.caseStudy ? [project.caseStudy] : []);
  paragraphs.forEach((text) => {
    const p = document.createElement('p');
    p.textContent = text;
    popupCase.appendChild(p);
  });
  popupCase.style.display = paragraphs.length ? '' : 'none';

  if (project.link) {
    popupLink.href = project.link;
    popupLink.hidden = false;
  } else {
    popupLink.hidden = true;
  }

  popupMedia.innerHTML = '';
  const gallery = resolveGalleryItems(project);
  if (gallery.length) {
    const grid = document.createElement('div');
    grid.className = 'gallery';
    gallery.forEach((item, i) => {
      const cell = document.createElement('div');
      cell.className = 'gallery__cell';
      if (item.type === 'video') {
        cell.appendChild(previewVideo(gallery, i, project.title));
      } else {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.title || project.title || '';
        img.loading = 'lazy';
        img.draggable = false;
        img.addEventListener('click', () => openFullscreen(gallery, i, project.title));
        cell.appendChild(img);
      }
      grid.appendChild(cell);
    });
    popupMedia.appendChild(grid);
  } else if (project.type === 'video') {
    popupMedia.appendChild(previewVideo([{ type: 'video', src: project.media, title: project.title }], 0, project.title));
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'popup__img-wrap';
    const img = document.createElement('img');
    img.src = project.media;
    img.alt = project.title || '';
    img.draggable = false;
    img.addEventListener('click', () => openFullscreen([{ type: 'image', src: project.media, title: project.title }], 0, project.title));
    wrap.appendChild(img);
    popupMedia.appendChild(wrap);
  }

  popup.setAttribute('aria-hidden', 'false');
  if (project.id) history.replaceState(null, '', '#' + project.id);
}

function closePopup() {
  popup.setAttribute('aria-hidden', 'true');
  popupMedia.querySelectorAll('video').forEach((v) => { v.pause(); });
}

let fullscreenCtx = null;

function openFullscreen(gallery, index, fallbackTitle) {
  fullscreenCtx = {
    gallery: Array.isArray(gallery) ? gallery : [],
    index: Math.max(0, Math.min(index || 0, (gallery || []).length - 1)),
    fallbackTitle: fallbackTitle || '',
  };
  renderFullscreen();
  fullscreen.setAttribute('aria-hidden', 'false');
}

function renderFullscreen() {
  fullscreenContent.innerHTML = '';
  const ctx = fullscreenCtx;
  if (!ctx || !ctx.gallery.length) return;
  const item = ctx.gallery[ctx.index];
  if (!item) return;
  const n = ctx.gallery.length;
  const multi = n > 1;

  if (item.type === 'video') {
    const v = document.createElement('video');
    v.src = item.src;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    const p = v.play();
    if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => {}); });
    fullscreenContent.appendChild(v);
    fullscreenHint.textContent = multi ? '\u2190 / \u2192 TO BROWSE \u00b7 ESC TO CLOSE' : 'ESC / CLICK OUTSIDE TO CLOSE';
  } else {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.title || ctx.fallbackTitle || '';
    img.draggable = false;
    fullscreenContent.appendChild(img);
    fullscreenHint.textContent = multi ? '\u2190 / \u2192 / SWIPE TO BROWSE \u00b7 CLICK TO CLOSE' : 'CLICK ANYWHERE TO CLOSE';
  }

  fsPrev.hidden = !multi;
  fsNext.hidden = !multi;
  fullscreenCount.style.display = multi ? '' : 'none';
  fullscreenCount.textContent = (ctx.index + 1) + ' / ' + n;
  if (multi) showFsNav();
}

function fullscreenStep(dir) {
  const ctx = fullscreenCtx;
  if (!ctx || ctx.gallery.length <= 1) return;
  ctx.index = (ctx.index + dir + ctx.gallery.length) % ctx.gallery.length;
  renderFullscreen();
}

function closeFullscreen() {
  fullscreen.setAttribute('aria-hidden', 'true');
  fullscreenContent.innerHTML = '';
  hideFsNav();
}

el('popup-close').addEventListener('click', closePopup);
document.querySelectorAll('[data-close]').forEach((n) => n.addEventListener('click', closePopup));

fsPrev.addEventListener('click', () => fullscreenStep(-1));
fsNext.addEventListener('click', () => fullscreenStep(1));

/* gallery arrows: auto-fade after 1s, reappear when the cursor nears an edge */
let fsNavTimer = null;
function showFsNav() {
  fsPrev.classList.remove('fs-nav--hidden');
  fsNext.classList.remove('fs-nav--hidden');
  clearTimeout(fsNavTimer);
  fsNavTimer = setTimeout(() => {
    fsPrev.classList.add('fs-nav--hidden');
    fsNext.classList.add('fs-nav--hidden');
  }, 1000);
}
function hideFsNav() {
  clearTimeout(fsNavTimer);
  fsPrev.classList.add('fs-nav--hidden');
  fsNext.classList.add('fs-nav--hidden');
}
if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (e) => {
    if (fullscreen.getAttribute('aria-hidden') !== 'false') return;
    if (fsPrev.hidden) return;
    const edge = 90;
    if (e.clientX < edge || e.clientX > window.innerWidth - edge) showFsNav();
  });
}

// fullscreen backdrop: tap to close (or step near the edges), swipe to step
let fsTouch = null;
fullscreenBackdrop.addEventListener('pointerdown', (e) => {
  fsTouch = { x: e.clientX, y: e.clientY, dx: 0, moved: false };
});
fullscreenBackdrop.addEventListener('pointermove', (e) => {
  if (!fsTouch) return;
  fsTouch.dx = e.clientX - fsTouch.x;
  if (Math.abs(fsTouch.dx) > 20 || Math.abs(e.clientY - fsTouch.y) > 20) fsTouch.moved = true;
});
fullscreenBackdrop.addEventListener('pointerup', () => {
  if (!fsTouch) return;
  const t = fsTouch;
  fsTouch = null;
  if (t.moved && Math.abs(t.dx) > 60) {
    fullscreenStep(t.dx < 0 ? 1 : -1);
  } else if (!t.moved) {
    const edge = 70;
    const multi = fullscreenCtx && fullscreenCtx.gallery.length > 1;
    if (multi && t.x < edge) fullscreenStep(-1);
    else if (multi && t.x > window.innerWidth - edge) fullscreenStep(1);
    else closeFullscreen();
  }
});

/* ----------------------------- input ------------------------------- */
let active = false;
let moved = false;
let lastX = 0;
let lastY = 0;
let startX = 0;
let startY = 0;
let startTime = 0;

viewport.addEventListener('pointerdown', (e) => {
  active = true;
  moved = false;
  startX = lastX = e.clientX;
  startY = lastY = e.clientY;
  startTime = performance.now();
});

window.addEventListener('pointermove', (e) => {
  if (!active) return;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
  if (dist > 8) moved = true;
  if (moved) corridor.addScroll(-dy * corridor.cfg.dragGain);
});

window.addEventListener('pointerup', (e) => {
  if (!active) return;
  active = false;
  const quick = performance.now() - startTime < 500;
  if (!moved && quick && popup.getAttribute('aria-hidden') === 'true') {
    const project = corridor.pick(e.clientX, e.clientY);
    if (project) openPopup(project);
  }
});

window.addEventListener('wheel', (e) => {
  if (editor.getAttribute('aria-hidden') === 'false') return;
  if (popup.getAttribute('aria-hidden') === 'false') return;
  if (picker.getAttribute('aria-hidden') === 'false') return;
  corridor.addScroll(e.deltaY * corridor.cfg.scrollGain);
}, { passive: true });

/* frame hover highlight (desktop mouse) */
function anyOverlayOpen() {
  return popup.getAttribute('aria-hidden') === 'false'
    || editor.getAttribute('aria-hidden') === 'false'
    || picker.getAttribute('aria-hidden') === 'false'
    || fullscreen.getAttribute('aria-hidden') === 'false';
}
if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (e) => {
    if (anyOverlayOpen()) return;
    const inter = e.target && e.target.closest && e.target.closest('button, a, input, select, textarea, video');
    corridor.setFrameHighlight(inter ? -1 : corridor.pickIndex(e.clientX, e.clientY));
  });
  document.documentElement.addEventListener('mouseleave', () => {
    if (!anyOverlayOpen()) corridor.setFrameHighlight(-1);
  });
}

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
    e.preventDefault();
    toggleEditor();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'T' || e.key === 't')) {
    e.preventDefault();
    tuningEditor.toggle();
    return;
  }
  if (e.key === '?' || e.key === 'h' || e.key === 'H') {
    if (!isTypingTarget(e.target)) { e.preventDefault(); toggleHelp(); }
    return;
  }
  if (e.key === 'Escape') {
    if (fullscreen.getAttribute('aria-hidden') === 'false') closeFullscreen();
    else if (editor.getAttribute('aria-hidden') === 'false') closeEditor();
    else if (tuningEditor.isOpen()) tuningEditor.close();
    else if (picker.getAttribute('aria-hidden') === 'false') closePicker();
    else if (el('about').getAttribute('aria-hidden') === 'false') closeAbout();
    else if (el('help').getAttribute('aria-hidden') === 'false') closeHelp();
    else closePopup();
    return;
  }
  if (editor.getAttribute('aria-hidden') === 'false') return;
  if (tuningEditor.isOpen()) return;
  if (picker.getAttribute('aria-hidden') === 'false') {
    if (e.key === 'ArrowDown') { e.preventDefault(); setPickerIndex(pickerIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setPickerIndex(pickerIndex - 1); }
    return;
  }
  if (fullscreen.getAttribute('aria-hidden') === 'false') {
    if (e.key === 'ArrowLeft') { e.preventDefault(); fullscreenStep(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); fullscreenStep(1); }
    return;
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    corridor.gotoDelta(-corridor.getProjectSpacing());
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    corridor.gotoDelta(corridor.getProjectSpacing());
  } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    corridor.addScroll(60 * corridor.cfg.scrollGain);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    corridor.addScroll(-60 * corridor.cfg.scrollGain);
  }
});

window.addEventListener('resize', () => corridor.resize());
window.addEventListener('orientationchange', () => corridor.resize());

/* ------------------------------ boot ------------------------------- */
function buildTicker() {
  const track = el('ticker-track');
  if (!track) return;
  const parts = ['GRID//LOOP'];
  projects.forEach((p) => { if (p && p.title) parts.push(p.title); });
  parts.push('SCROLL  //  SWIPE  TO  TRAVERSE');
  const line = parts.join('   ///   ') + '   ///   ';
  const repeated = line.repeat(3);
  track.textContent = '';
  [0, 1].forEach((k) => {
    const span = document.createElement('span');
    span.className = 'ticker__item';
    span.textContent = repeated;
    if (k === 1) span.setAttribute('aria-hidden', 'true');
    track.appendChild(span);
  });
}

el('hud-count').textContent = String(projects.length);
buildTicker();

let savedTheme = 'green';
try { savedTheme = localStorage.getItem('gridloop-theme') || 'green'; } catch (_) { /* ignore */ }
if (!THEMES[savedTheme]) savedTheme = 'green';
applyTheme(savedTheme);

/* ---------- nearest-project heading (cypher scramble on switch) ---------- */
const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let nearProject = null;

function scrambleText(node, target, duration = UI_FX.scrambleDuration) {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!node) return;
  if (node._scrambleRaf) cancelAnimationFrame(node._scrambleRaf);
  if (reduced || !target) { node.textContent = target || ''; return; }
  const len = target.length;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const reveal = Math.floor(p * len);
    let out = '';
    for (let i = 0; i < len; i++) {
      const ch = target[i];
      if (i < reveal) out += ch;
      else if (ch === ' ') out += ' ';
      else out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }
    node.textContent = out;
    if (p < 1) node._scrambleRaf = requestAnimationFrame(tick);
    else { node.textContent = target; node._scrambleRaf = null; }
  };
  node._scrambleRaf = requestAnimationFrame(tick);
}

function updateNearProject() {
  const p = corridor.getClosestProject();
  if (!p) return;
  if (nearProject && nearProject.id === p.id) return;
  nearProject = p;
  scrambleText(nearTitleEl, p.title || '');
  scrambleText(nearSubEl, [p.category, p.year].filter(Boolean).join(' — '), 500);
}

/* ---------------- live reload + drag-and-drop + admin editor ---------------- */
let draft = [];
let toastTimer = null;

function toast(msg) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function galleryToText(g) {
  return (g || []).map((it) => (typeof it === 'string' ? it : JSON.stringify(it))).join('\n');
}
function textToGallery(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      if (line[0] === '{') { try { return JSON.parse(line); } catch (_) { return null; } }
      return line;
    })
    .filter((x) => x !== null);
}

function loadProjects(data) {
  const arr = Array.isArray(data) ? data : (data && Array.isArray(data.projects) ? data.projects : null);
  if (!arr) { toast('INVALID PROJECTS FILE'); return false; }
  closePopup();
  projects = arr;
  window.PROJECTS = arr;
  corridor.setProjects(arr);
  nearProject = null;
  el('hud-count').textContent = String(arr.length);
  buildTicker();
  buildMinimap();
  toast('LOADED ' + arr.length + ' PROJECTS');
  return true;
}

// drop a projects.json (or any JSON array) anywhere on the page
window.addEventListener('dragover', (e) => { e.preventDefault(); });
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { loadProjects(JSON.parse(reader.result)); }
    catch (_) { toast('INVALID JSON'); }
  };
  reader.readAsText(file);
});

function makeInput(value, onInput, placeholder) {
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.value = value || '';
  if (placeholder) inp.placeholder = placeholder;
  inp.addEventListener('input', onInput);
  return inp;
}
function makeField(label, input) {
  const wrap = document.createElement('div');
  wrap.className = 'editor-field';
  const lab = document.createElement('label');
  lab.textContent = label;
  wrap.appendChild(lab);
  wrap.appendChild(input);
  return wrap;
}

function projectCard(p, i) {
  const card = document.createElement('div');
  card.className = 'editor-card';

  const head = document.createElement('div');
  head.className = 'editor-card__head';
  const idx = document.createElement('span');
  idx.className = 'editor-card__index';
  idx.textContent = String(i + 1).padStart(2, '0');
  const titleInput = makeInput(p.title, (e) => { draft[i].title = e.target.value; }, 'Title');
  titleInput.className = 'editor-card__title-input';
  const btns = document.createElement('div');
  btns.className = 'editor-card__btns';
  const up = document.createElement('button'); up.textContent = '\u25B2'; up.title = 'Move up'; up.onclick = () => moveProject(i, -1);
  const dn = document.createElement('button'); dn.textContent = '\u25BC'; dn.title = 'Move down'; dn.onclick = () => moveProject(i, 1);
  const del = document.createElement('button'); del.textContent = '\u2715'; del.title = 'Delete'; del.onclick = () => deleteProject(i);
  btns.append(up, dn, del);
  head.append(idx, titleInput, btns);
  card.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'editor-grid';
  grid.appendChild(makeField('ID', makeInput(p.id, (e) => { draft[i].id = e.target.value; })));
  grid.appendChild(makeField('Category', makeInput(p.category, (e) => { draft[i].category = e.target.value; })));
  grid.appendChild(makeField('Year', makeInput(p.year, (e) => { draft[i].year = e.target.value; })));
  const sel = document.createElement('select');
  sel.innerHTML = '<option value="image">image</option><option value="video">video</option>';
  sel.value = p.type === 'video' ? 'video' : 'image';
  sel.addEventListener('change', () => { draft[i].type = sel.value; });
  grid.appendChild(makeField('Type', sel));
  grid.appendChild(makeField('Thumb (wall frame)', makeInput(p.thumb, (e) => { draft[i].thumb = e.target.value; })));
  grid.appendChild(makeField('Media (cover)', makeInput(p.media, (e) => { draft[i].media = e.target.value; })));
  grid.appendChild(makeField('Link', makeInput(p.link, (e) => { draft[i].link = e.target.value; })));
  grid.appendChild(makeField('Role', makeInput(p.role, (e) => { draft[i].role = e.target.value; })));
  grid.appendChild(makeField('Client', makeInput(p.client, (e) => { draft[i].client = e.target.value; })));
  grid.appendChild(makeField('Duration', makeInput(p.duration, (e) => { draft[i].duration = e.target.value; })));
  grid.appendChild(makeField('Tools (comma)', makeInput((p.tools || []).join(', '), (e) => { draft[i].tools = e.target.value.split(',').map((s) => s.trim()).filter(Boolean); })));
  grid.appendChild(makeField('Tags (comma)', makeInput((p.tags || []).join(', '), (e) => { draft[i].tags = e.target.value.split(',').map((s) => s.trim()).filter(Boolean); })));

  const desc = document.createElement('textarea');
  desc.value = p.description || '';
  desc.addEventListener('input', () => { draft[i].description = desc.value; });
  const descField = makeField('Description', desc); descField.classList.add('full'); grid.appendChild(descField);

  const cs = document.createElement('textarea');
  cs.value = (p.caseStudy || []).join('\n');
  cs.placeholder = 'case study — one paragraph per line';
  cs.addEventListener('input', () => { draft[i].caseStudy = cs.value.split('\n').map((s) => s.trim()).filter(Boolean); });
  const csField = makeField('Case study (one paragraph per line)', cs); csField.classList.add('full'); grid.appendChild(csField);

  const gal = document.createElement('textarea');
  gal.value = galleryToText(p.gallery);
  gal.placeholder = 'one per line: URL  |  {"type":"video","src":"...","thumb":"..."}';
  gal.addEventListener('input', () => { draft[i].gallery = textToGallery(gal.value); });
  const galField = makeField('Gallery (one per line)', gal); galField.classList.add('full'); grid.appendChild(galField);

  card.appendChild(grid);
  return card;
}

function renderEditor() {
  const list = el('editor-list');
  list.innerHTML = '';
  draft.forEach((p, i) => list.appendChild(projectCard(p, i)));
}
function moveProject(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= draft.length) return;
  const tmp = draft[i]; draft[i] = draft[j]; draft[j] = tmp;
  renderEditor();
}
function deleteProject(i) {
  draft.splice(i, 1);
  renderEditor();
}
function addProject() {
  draft.push({ id: 'project-' + (draft.length + 1), title: 'NEW PROJECT', category: '', year: '', type: 'image', thumb: '', media: '', gallery: [], description: '', role: '', client: '', tools: [], duration: '', caseStudy: [], tags: [], link: '' });
  renderEditor();
  const list = el('editor-list');
  if (list.lastElementChild) list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function downloadProjects() {
  const text = '// GRID//LOOP projects \u2014 exported from the admin editor.\n// Field guide: see projects.js in the project root.\nwindow.PROJECTS = ' + JSON.stringify(draft, null, 2) + ';\n';
  const blob = new Blob([text], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects.js';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('DOWNLOADED projects.js');
}
function applyEditor() {
  const data = JSON.parse(JSON.stringify(draft));
  closeEditor();
  loadProjects(data);
}
function openEditor() {
  draft = JSON.parse(JSON.stringify(projects));
  renderEditor();
  editor.setAttribute('aria-hidden', 'false');
}
function closeEditor() {
  editor.setAttribute('aria-hidden', 'true');
}
function toggleEditor() {
  if (editor.getAttribute('aria-hidden') === 'false') closeEditor();
  else openEditor();
}

el('editor-close').addEventListener('click', closeEditor);
document.querySelectorAll('[data-editor-close]').forEach((n) => n.addEventListener('click', closeEditor));
el('editor-add').addEventListener('click', addProject);
el('editor-download').addEventListener('click', downloadProjects);
el('editor-apply').addEventListener('click', applyEditor);

// avatar character selector
const characterSelect = el('character-select');
if (characterSelect && window.CHARACTERS) {
  window.CHARACTERS.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.url;
    opt.textContent = c.label;
    characterSelect.appendChild(opt);
  });
  let cur = '';
  try { cur = localStorage.getItem('gridloop-character') || ''; } catch (_) { /* ignore */ }
  if (cur) characterSelect.value = cur;
  characterSelect.addEventListener('change', () => {
    corridor.setCharacter(characterSelect.value);
    try { localStorage.setItem('gridloop-character', characterSelect.value); } catch (_) { /* ignore */ }
    toast('CHARACTER SET');
  });
}

if (location.hash === '#admin') openEditor();

/* ---------------- glitch transition + custom cursor ---------------- */
function glitch() {
  const g = el('glitch');
  if (!g) return;
  g.classList.remove('active');
  void g.offsetWidth; // restart the animation
  g.classList.add('active');
  clearTimeout(g._t);
  g._t = setTimeout(() => g.classList.remove('active'), 340);
}

const cursorEl = el('cursor');
if (cursorEl) {
  if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      cursorEl.style.transform = 'translate(' + (e.clientX - 11) + 'px, ' + (e.clientY - 11) + 'px)';
      const inter = e.target && e.target.closest && e.target.closest('button, a, input, select, textarea, video, .popup, .editor, .fullscreen, .theme-btn');
      if (inter) {
        cursorEl.classList.add('cursor--hidden');
        document.body.classList.remove('cursor-none');
      } else {
        cursorEl.classList.remove('cursor--hidden');
        document.body.classList.add('cursor-none');
      }
    });
    document.documentElement.addEventListener('mouseleave', () => {
      cursorEl.classList.add('cursor--hidden');
      document.body.classList.remove('cursor-none');
    });
  } else {
    cursorEl.style.display = 'none';
  }
}

/* ---------------- project picker (iOS-style drum wheel) ---------------- */
const PICKER_ITEM_H = 44;
let pickerItems = [];
let pickerIndex = 0;

function renderPicker() {
  pickerItems.forEach((item, i) => {
    const off = i - pickerIndex;
    const tilt = Math.max(-65, Math.min(65, off * UI_FX.pickerTilt));
    item.style.transform = 'translateY(' + (off * PICKER_ITEM_H) + 'px) rotateX(' + tilt + 'deg)';
    item.style.opacity = String(Math.max(0.04, 1 - Math.abs(off) * UI_FX.pickerOpacity));
    if (off === 0) item.classList.add('is-selected');
    else item.classList.remove('is-selected');
  });
}

function setPickerIndex(i) {
  const n = projects.length;
  if (!n) return;
  pickerIndex = Math.max(0, Math.min(n - 1, i));
  renderPicker();
  corridor.teleportToProject(pickerIndex);
  corridor.setFrameHighlight(pickerIndex);
}

function openPicker() {
  pickerWheel.innerHTML = '';
  projects.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'picker__item';
    item.textContent = p.title || ('PROJECT ' + (i + 1));
    item.addEventListener('click', () => {
      if (i === pickerIndex) {
        closePicker();
        openPopup(projects[pickerIndex]);
      } else {
        setPickerIndex(i);
      }
    });
    pickerWheel.appendChild(item);
  });
  pickerItems = Array.from(pickerWheel.children);
  const cur = corridor.getClosestProject();
  pickerIndex = cur ? Math.max(0, projects.indexOf(cur)) : 0;
  renderPicker();
  picker.setAttribute('aria-hidden', 'false');
  viewAllBtn.setAttribute('aria-expanded', 'true');
  corridor.idlePaused = true;
  corridor.setFrameHighlight(pickerIndex);
}

function closePicker() {
  picker.setAttribute('aria-hidden', 'true');
  viewAllBtn.setAttribute('aria-expanded', 'false');
  corridor.idlePaused = false;
  corridor.setFrameHighlight(-1);
}

function togglePicker() {
  if (picker.getAttribute('aria-hidden') === 'false') closePicker();
  else openPicker();
}

viewAllBtn.addEventListener('click', togglePicker);
document.querySelectorAll('[data-picker-close]').forEach((n) => n.addEventListener('click', closePicker));

pickerViewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  setPickerIndex(pickerIndex + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });

let pickerTouchY = null;
pickerViewport.addEventListener('touchstart', (e) => { pickerTouchY = e.touches[0].clientY; }, { passive: true });
pickerViewport.addEventListener('touchmove', (e) => {
  if (pickerTouchY == null) return;
  const dy = e.touches[0].clientY - pickerTouchY;
  if (Math.abs(dy) > PICKER_ITEM_H * 0.6) {
    setPickerIndex(pickerIndex + (dy > 0 ? -1 : 1));
    pickerTouchY = e.touches[0].clientY;
  }
}, { passive: true });

/* ---------------- minimap rail + help overlay ---------------- */
let minimapDots = [];

function buildMinimap() {
  const container = el('minimap-dots');
  container.innerHTML = '';
  minimapDots = [];
  const n = projects.length;
  projects.forEach((p, i) => {
    const dot = document.createElement('span');
    dot.className = 'minimap__dot';
    dot.title = p.title || ('Project ' + (i + 1));
    dot.style.top = ((i / Math.max(1, n)) * 100) + '%';
    dot.addEventListener('click', () => corridor.teleportToProject(i));
    container.appendChild(dot);
    minimapDots.push(dot);
  });
}

function updateMinimap() {
  const marker = el('minimap-marker');
  const n = projects.length;
  if (!n) { marker.style.top = '0%'; return; }
  const twoPi = Math.PI * 2;
  const p = (((corridor.angle % twoPi) + twoPi) % twoPi) / twoPi;
  marker.style.top = (p * 100) + '%';
  const cur = corridor.getClosestProject();
  const idx = cur ? projects.indexOf(cur) : -1;
  minimapDots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
}

function isTypingTarget(node) {
  return !!(node && node.closest && node.closest('input, textarea, select'));
}
function openHelp() { el('help').setAttribute('aria-hidden', 'false'); }
function closeHelp() { el('help').setAttribute('aria-hidden', 'true'); }
function toggleHelp() {
  if (el('help').getAttribute('aria-hidden') === 'false') closeHelp();
  else openHelp();
}

el('help-close').addEventListener('click', closeHelp);
document.querySelectorAll('[data-help-close]').forEach((n) => n.addEventListener('click', closeHelp));

/* ---------------- about / contact panel ---------------- */
const about = el('about');
const aboutName = el('about-name');
const aboutRole = el('about-role');
const aboutStatus = el('about-status');
const aboutStatusText = el('about-status-text');
const aboutBio = el('about-bio');
const aboutLinks = el('about-links');

function openAbout() {
  const a = window.ABOUT || {};
  aboutName.textContent = a.name || 'GRID//LOOP';
  aboutRole.textContent = a.role || '';
  aboutBio.innerHTML = '';
  (a.bio || []).forEach((line) => {
    const p = document.createElement('p');
    p.textContent = line;
    aboutBio.appendChild(p);
  });
  const status = (a.status || '').trim();
  aboutStatus.hidden = !status;
  if (status) aboutStatusText.textContent = status;
  aboutLinks.innerHTML = '';
  (a.links || []).forEach((link) => {
    const li = document.createElement('li');
    const a2 = document.createElement('a');
    a2.href = link.url || '#';
    if (/^https?:/i.test(link.url || '')) { a2.target = '_blank'; a2.rel = 'noopener'; }
    const label = document.createElement('span');
    label.className = 'about__link-label';
    label.textContent = link.label || '';
    const value = document.createElement('span');
    value.className = 'about__link-value';
    value.textContent = link.value || link.url || '';
    const arrow = document.createElement('span');
    arrow.className = 'about__link-arrow';
    arrow.textContent = '\u2197';
    a2.append(label, value, arrow);
    li.appendChild(a2);
    aboutLinks.appendChild(li);
  });
  about.setAttribute('aria-hidden', 'false');
}
function closeAbout() { about.setAttribute('aria-hidden', 'true'); }
function toggleAbout() {
  if (about.getAttribute('aria-hidden') === 'false') closeAbout();
  else openAbout();
}

el('about-open').addEventListener('click', toggleAbout);
el('about-close').addEventListener('click', closeAbout);
document.querySelectorAll('[data-about-close]').forEach((n) => n.addEventListener('click', closeAbout));

buildMinimap();

/* ---------------- deep links (#project-id) ---------------- */
function currentHashId() {
  try { return decodeURIComponent(location.hash.slice(1)); }
  catch (_) { return location.hash.slice(1); }
}
function flyToProjectById(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return false;
  corridor.teleportToProject(projects.indexOf(p));
  openPopup(p);
  return true;
}
function handleHash() {
  const id = currentHashId();
  if (!id) return;
  if (id === 'about') { openAbout(); return; }
  flyToProjectById(id);
}
window.addEventListener('hashchange', () => {
  const id = currentHashId();
  if (!id) return;
  if (id === 'about') { openAbout(); return; }
  flyToProjectById(id);
});
handleHash();

let firstFrame = true;
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  corridor.tick(dt);
  updateNearProject();
  updateMinimap();
  if (firstFrame) {
    firstFrame = false;
    window.__GRIDLOOP_READY__ = true;
    if (window.__gridloopTimer) clearTimeout(window.__gridloopTimer);
    boot.classList.add('is-done');
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
