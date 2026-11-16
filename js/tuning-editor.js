/* =============================================================================
   GRID//LOOP — hidden tuning editor (Ctrl+Shift+T, or #tuning)
   Edits corridor.js tunables (cfg + fx) and main.js tunables (UI_FX) live,
   and exports them as tunings.js which is auto-loaded on boot.
   ========================================================================== */

const SCHEMA = [
  // ---- corridor.js · TUNING object (corridor.cfg) ----
  { group: 'CORRIDOR — MOVEMENT', src: 'cfg', key: 'idleDrift', label: 'idleDrift', def: 0.00072 },
  { group: 'CORRIDOR — MOVEMENT', src: 'cfg', key: 'scrollGain', label: 'scrollGain', def: 0.00024 },
  { group: 'CORRIDOR — MOVEMENT', src: 'cfg', key: 'dragGain', label: 'dragGain', def: 0.0008 },
  { group: 'CORRIDOR — MOVEMENT', src: 'cfg', key: 'friction', label: 'friction', def: 0.90 },
  { group: 'CORRIDOR — MOVEMENT', src: 'cfg', key: 'maxVel', label: 'maxVel', def: 0.35 },
  { group: 'CORRIDOR — CAMERA', src: 'cfg', key: 'eyeHeight', label: 'eyeHeight', def: 4.7 },
  { group: 'CORRIDOR — CAMERA', src: 'cfg', key: 'fov', label: 'fov', def: 72 },
  { group: 'CORRIDOR — FOG', src: 'cfg', key: 'fogNear', label: 'fogNear', def: 34 },
  { group: 'CORRIDOR — FOG', src: 'cfg', key: 'fogFar', label: 'fogFar', def: 96 },
  { group: 'CORRIDOR — BLOOM', src: 'cfg', key: 'bloomStrength', label: 'bloomStrength', def: 0.95 },
  { group: 'CORRIDOR — BLOOM', src: 'cfg', key: 'bloomRadius', label: 'bloomRadius', def: 0.45 },
  { group: 'CORRIDOR — BLOOM', src: 'cfg', key: 'bloomThreshold', label: 'bloomThreshold', def: 0.32 },

  // ---- corridor.js · effects (corridor.fx) ----
  { group: 'CORRIDOR — SPEED FX', src: 'fx', key: 'speedRef', label: 'speedRef', def: 0.12 },
  { group: 'CORRIDOR — SPEED FX', src: 'fx', key: 'bobAmp', label: 'bobAmp', def: 0.06 },
  { group: 'CORRIDOR — SPEED FX', src: 'fx', key: 'swayAmp', label: 'swayAmp', def: 0.05 },
  { group: 'CORRIDOR — SPEED FX', src: 'fx', key: 'fovWarp', label: 'fovWarp', def: 8 },
  { group: 'CORRIDOR — SPEED FX', src: 'fx', key: 'fogNearTighten', label: 'fogNearTighten', def: 0.4 },
  { group: 'CORRIDOR — SPEED FX', src: 'fx', key: 'fogFarTighten', label: 'fogFarTighten', def: 0.45 },
  { group: 'CORRIDOR — STREAKS', src: 'fx', key: 'streakOpacity', label: 'streakOpacity', def: 0.55 },
  { group: 'CORRIDOR — STREAKS', src: 'fx', key: 'streakSpeed', label: 'streakSpeed', def: 2.2 },
  { group: 'CORRIDOR — DUST', src: 'fx', key: 'dustSize', label: 'dustSize', def: 0.07 },
  { group: 'CORRIDOR — DUST', src: 'fx', key: 'dustOpacity', label: 'dustOpacity', def: 0.35 },
  { group: 'CORRIDOR — REFLECTION', src: 'fx', key: 'reflectionOpacity', label: 'reflectionOpacity', def: 0.35 },
  { group: 'CORRIDOR — PULSE', src: 'fx', key: 'pulseOpacity', label: 'pulseOpacity', def: 0.15 },
  { group: 'CORRIDOR — PULSE', src: 'fx', key: 'pulseSpeed', label: 'pulseSpeed', def: 0.35 },
  { group: 'CORRIDOR — CHARACTER', src: 'fx', key: 'charScale', label: 'charScale', def: 3.4 },
  { group: 'CORRIDOR — CHARACTER', src: 'fx', key: 'charLead', label: 'charLead', def: 0.2 },
  { group: 'CORRIDOR — CHARACTER', src: 'fx', key: 'charLateral', label: 'charLateral', def: 0 },
  { group: 'CORRIDOR — CHARACTER', src: 'fx', key: 'charRunVel', label: 'charRunVel', def: 0.02 },
  { group: 'CORRIDOR — CHARACTER', src: 'fx', key: 'charBlend', label: 'charBlend', def: 0.25 },
  { group: 'CORRIDOR — CHARACTER', src: 'fx', key: 'charPointerYaw', label: 'charPointerYaw', def: 1.0 },
  { group: 'CORRIDOR — PARALLAX', src: 'fx', key: 'parallaxX', label: 'parallaxX', def: 0.12 },
  { group: 'CORRIDOR — PARALLAX', src: 'fx', key: 'parallaxY', label: 'parallaxY', def: 0.08 },
  { group: 'CORRIDOR — PARALLAX', src: 'fx', key: 'parallaxSmoothing', label: 'parallaxSmoothing', def: 0.08 },
  { group: 'CORRIDOR — TWEEN', src: 'fx', key: 'tweenDuration', label: 'tweenDuration', def: 0.7 },

  // ---- main.js ----
  { group: 'MAIN.JS — PICKER', src: 'ui', key: 'pickerTilt', label: 'pickerTilt', def: -18 },
  { group: 'MAIN.JS — PICKER', src: 'ui', key: 'pickerOpacity', label: 'pickerOpacity', def: 0.14 },
  { group: 'MAIN.JS — SCRAMBLE', src: 'ui', key: 'scrambleDuration', label: 'scrambleDuration (ms)', def: 640 },
];

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hsvToRgb(h, s, v) {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) { r = c; g = x; }
  else if (hp < 2) { r = x; g = c; }
  else if (hp < 3) { g = c; b = x; }
  else if (hp < 4) { g = x; b = c; }
  else if (hp < 5) { r = x; b = c; }
  else { r = c; b = x; }
  const m = v - c;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function setupColorWheel(themeApi) {
  const canvas = document.getElementById('color-wheel');
  const dot = document.getElementById('color-dot');
  const valueSlider = document.getElementById('color-value');
  const hexInput = document.getElementById('color-hex');
  const swatch = document.getElementById('color-swatch');
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  let hue = 0;
  let sat = 1;
  let val = 1;

  function draw() {
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const o = (y * size + x) * 4;
        if (dist <= radius) {
          const s = dist / radius;
          const h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
          const c = hsvToRgb(h, s, val);
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function updateDot() {
    const x = cx + Math.cos(hue * Math.PI / 180) * sat * radius;
    const y = cy + Math.sin(hue * Math.PI / 180) * sat * radius;
    dot.style.left = (x - 5) + 'px';
    dot.style.top = (y - 5) + 'px';
  }

  function currentHex() { return rgbToHex.apply(null, hsvToRgb(hue, sat, val)); }

  function apply() {
    const hex = currentHex();
    hexInput.value = hex;
    swatch.style.background = hex;
    themeApi.applyAccent(hex);
  }

  function setFromHex(hex, doApply) {
    const [r, g, b] = hexToRgb(hex);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    val = max;
    sat = max === 0 ? 0 : delta / max;
    if (delta === 0) hue = 0;
    else if (max === rn) hue = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) hue = 60 * ((bn - rn) / delta + 2);
    else hue = 60 * ((rn - gn) / delta + 4);
    if (hue < 0) hue += 360;
    valueSlider.value = String(Math.round(val * 100));
    hexInput.value = hex;
    swatch.style.background = hex;
    draw();
    updateDot();
    if (doApply) themeApi.applyAccent(hex);
  }

  function sync() { setFromHex(themeApi.getAccent(), false); }

  let dragging = false;
  function pick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (size / rect.width);
    const y = (e.clientY - rect.top) * (size / rect.height);
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) return;
    sat = Math.min(dist / radius, 1);
    hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    updateDot();
    apply();
  }
  canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); pick(e); });
  canvas.addEventListener('pointermove', (e) => { if (dragging) pick(e); });
  canvas.addEventListener('pointerup', () => { dragging = false; });

  valueSlider.addEventListener('input', () => { val = Number(valueSlider.value) / 100; draw(); apply(); });
  hexInput.addEventListener('change', () => {
    const v = hexInput.value.trim();
    if (/^#?[0-9a-f]{6}$/i.test(v)) setFromHex(v[0] === '#' ? v : '#' + v, true);
    else hexInput.value = currentHex();
  });

  sync();
  return { sync };
}

export function initTuningEditor(corridor, UI_FX, themeApi) {
  const tuning = document.getElementById('tuning');
  const list = document.getElementById('tuning-list');
  const wheel = setupColorWheel(themeApi);

  function getValue(entry) {
    if (entry.src === 'cfg') return corridor.cfg[entry.key];
    if (entry.src === 'fx') return corridor.fx[entry.key];
    return UI_FX[entry.key];
  }
  function setValue(entry, v) {
    if (entry.src === 'cfg') corridor.cfg[entry.key] = v;
    else if (entry.src === 'fx') corridor.fx[entry.key] = v;
    else UI_FX[entry.key] = v;
  }

  function render() {
    list.innerHTML = '';
    let lastGroup = '';
    SCHEMA.forEach((entry) => {
      if (entry.group !== lastGroup) {
        lastGroup = entry.group;
        const h = document.createElement('div');
        h.className = 'tuning-group';
        h.textContent = entry.group;
        list.appendChild(h);
      }
      const row = document.createElement('div');
      row.className = 'tuning-row';
      const lab = document.createElement('label');
      lab.textContent = entry.label;
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = String(getValue(entry));
      inp.addEventListener('input', () => {
        const v = parseFloat(inp.value);
        if (!Number.isFinite(v)) return;
        setValue(entry, v);
        corridor.applyTunings();
      });
      row.appendChild(lab);
      row.appendChild(inp);
      list.appendChild(row);
    });
  }

  function open() { wheel.sync(); render(); tuning.setAttribute('aria-hidden', 'false'); }
  function close() { tuning.setAttribute('aria-hidden', 'true'); }
  function toggle() { if (tuning.getAttribute('aria-hidden') === 'false') close(); else open(); }
  function isOpen() { return tuning.getAttribute('aria-hidden') === 'false'; }

  function reset() {
    SCHEMA.forEach((entry) => setValue(entry, entry.def));
    corridor.applyTunings();
    render();
  }

  function exportTunings() {
    const flat = {};
    SCHEMA.forEach((entry) => { flat[entry.key] = getValue(entry); });
    if (themeApi.isCustom()) flat.accentHex = themeApi.getAccent();
    const text = '// GRID//LOOP tunings — exported from the tuning editor.\n// Drop this file next to index.html and reload to apply.\nwindow.__TUNINGS = ' + JSON.stringify(flat, null, 2) + ';\n';
    const blob = new Blob([text], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tunings.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.getElementById('tuning-close').addEventListener('click', close);
  document.querySelectorAll('[data-tuning-close]').forEach((n) => n.addEventListener('click', close));
  document.getElementById('tuning-reset').addEventListener('click', reset);
  document.getElementById('tuning-export').addEventListener('click', exportTunings);

  if (location.hash === '#tuning') open();

  return { toggle, open, close, isOpen };
}
