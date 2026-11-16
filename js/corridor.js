/* =============================================================================
   GRID//LOOP — 3D endless curved corridor (Three.js)
   -----------------------------------------------------------------------------
   A closed, gently-curving neon grid corridor. The corridor is a full circle so
   it loops forever; because it bends to the right, the "vanishing point" is
   always hidden behind the curve (and fog hides the far side), so there is no
   visible end.

   The numbers below are deliberately grouped under TUNING so you can tweak the
   feel without touching the rest of the code.
   ========================================================================== */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const TUNING = {
  radius: 60,         // corridor centre-line radius (larger = gentler curve)
  width: 16,          // lateral width of the corridor
  height: 9,          // floor-to-ceiling height
  eyeHeight: 4.7,     // camera height
  ringSegments: 128,  // number of "ribs" around the loop
  longSegments: 256,  // smoothness of the longitudinal lines
  floorDivs: 8,       // interior floor/ceiling grid divisions

  frameW: 7.2,        // max frame size (2x); each frame fits its own image ratio
  frameH: 4.05,
  frameBorder: 0.2,

  fov: 72,
  near: 0.1,
  far: 260,
  fogNear: 34,        // distance where fog starts
  fogFar: 96,         // distance where the corridor is fully fogged out

  bloomStrength: 0.45,
  bloomRadius: 0.45,
  bloomThreshold: 0.32,

  idleDrift: 0.00072, // auto-cruise speed (radians per frame @60fps)
  scrollGain: 0.00024,// wheel deltaY -> velocity
  dragGain: 0.0008,   // pointer drag pixels -> velocity
  maxVel: 0.35,       // clamp for velocity (radians per frame @60fps)
  friction: 0.90,     // per-frame velocity multiplier @60fps
};

const UP = new THREE.Vector3(0, 1, 0);

export class Corridor {
  constructor(container, projects) {
    this.container = container;
    this.projects = projects || [];
    this.cfg = { ...TUNING };
    this.angle = 0;       // progress along the loop (radians)
    this.velocity = 0;    // scroll inertia
    this.width = 1;
    this.height = 1;
    this.frames = [];
    this.frameHitMeshes = [];
    this.speedSmooth = 0;
    this.bobPhase = 0;
    this._targetNX = 0;
    this._targetNY = 0;
    this.parallaxX = 0;
    this.parallaxY = 0;
    this._up = new THREE.Vector3(0, 1, 0);
    this.idlePaused = false;
    this.tweenStart = 0;
    this.tweenTarget = null;
    this.tweenT = 0;
    this.fx = {
      speedRef: 0.12,
      bobAmp: 0.06,
      swayAmp: 0.05,
      fovWarp: 8,
      fogNearTighten: 0.4,
      fogFarTighten: 0.45,
      streakOpacity: 0.55,
      streakSpeed: 2.2,
      dustSize: 0.07,
      dustOpacity: 0.35,
      reflectionOpacity: 0.35,
      pulseOpacity: 0.15,
      pulseSpeed: 0.35,
      charScale: 3.4,
      charLead: 0.2,
      charLateral: 0,
      charRunVel: 0.02,
      charBlend: 0.25,
      charPointerYaw: 1.0,
      parallaxX: 0.12,
      parallaxY: 0.08,
      parallaxSmoothing: 0.08,
      tweenDuration: 0.7,
    };
    this.frameHighlight = -1;

    this._initRenderer();
    this._initScene();
    this._buildGrid();
    this._buildSolid();
    this._buildFrames();
    this._buildDust();
    this._accentHex = '#00ff9c';
    this._buildStreaks();
    this._buildPulse();
    this._buildCharacter();
    this._initParallax();
  }

  /* ---------------------- floating dust motes ---------------------- */
  _buildDust() {
    const { radius: R, width: W, height: H } = this.cfg;
    const count = 520;
    const positions = new Float32Array(count * 3);
    this.dust = {
      r: new Float32Array(count),
      t: new Float32Array(count),
      y: new Float32Array(count),
      dt: new Float32Array(count),
      dy: new Float32Array(count),
      positions,
    };
    for (let i = 0; i < count; i++) {
      this.dust.r[i] = R - W / 2 + 0.4 + Math.random() * (W - 0.8);
      this.dust.t[i] = Math.random() * Math.PI * 2;
      this.dust.y[i] = 0.3 + Math.random() * (H - 0.6);
      this.dust.dt[i] = (Math.random() - 0.5) * 0.03;
      this.dust.dy[i] = (Math.random() - 0.5) * 0.4;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dustMat = new THREE.PointsMaterial({
      color: '#00ff9c',
      size: this.fx.dustSize,
      sizeAttenuation: true,
      transparent: true,
      opacity: this.fx.dustOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.dustPoints = new THREE.Points(geom, this.dustMat);
    this.scene.add(this.dustPoints);
  }

  _updateDust(dt) {
    if (!this.dust) return;
    const d = this.dust;
    const H = this.cfg.height;
    const TWO_PI = Math.PI * 2;
    for (let i = 0; i < d.r.length; i++) {
      d.t[i] += d.dt[i] * dt;
      d.y[i] += d.dy[i] * dt;
      if (d.t[i] > TWO_PI) d.t[i] -= TWO_PI; else if (d.t[i] < 0) d.t[i] += TWO_PI;
      if (d.y[i] > H) d.y[i] -= H; else if (d.y[i] < 0) d.y[i] += H;
      const c = Math.cos(d.t[i]);
      const s = Math.sin(d.t[i]);
      const o = i * 3;
      d.positions[o] = -d.r[i] * c;
      d.positions[o + 1] = d.y[i];
      d.positions[o + 2] = d.r[i] * s;
    }
    this.dustPoints.geometry.attributes.position.needsUpdate = true;
  }

  /* ------------------- mirrored floor reflections ------------------- */
  _makeReflectionAlphaMap() {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#000000');   // v=1 (inner) -> transparent
    grad.addColorStop(1, '#00ff00');   // v=0 (wall)  -> opaque (green channel)
    g.fillStyle = grad;
    g.fillRect(0, 0, 1, 256);
    return new THREE.CanvasTexture(c);
  }

  _reflectionGeometry(theta, w, h, y = 0.02) {
    const rWall = this.cfg.radius + this.cfg.width / 2;
    const hw = w / 2 + 0.2;
    const O = new THREE.Vector3(-Math.cos(theta), 0, Math.sin(theta));
    const T = new THREE.Vector3(Math.sin(theta), 0, Math.cos(theta));
    const A = O.clone().multiplyScalar(rWall).add(T.clone().multiplyScalar(hw)); A.y = y;
    const B = O.clone().multiplyScalar(rWall).add(T.clone().multiplyScalar(-hw)); B.y = y;
    const C = O.clone().multiplyScalar(rWall - h).add(T.clone().multiplyScalar(hw)); C.y = y;
    const D = O.clone().multiplyScalar(rWall - h).add(T.clone().multiplyScalar(-hw)); D.y = y;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute([
      A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z,
      C.x, C.y, C.z, B.x, B.y, B.z, D.x, D.y, D.z,
    ], 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute([
      1, 0, 0, 0, 1, 1,
      1, 1, 0, 0, 0, 1,
    ], 2));
    return geom;
  }

  _fitReflection(img, tex) {
    const ud = img.userData && img.userData.reflect;
    if (!ud) return;
    const w = img.scale.x;
    const h = img.scale.y;
    const b = this.cfg.frameBorder;
    ud.mesh.geometry.dispose();
    ud.mesh.geometry = this._reflectionGeometry(ud.theta, w, h, 0.02);
    ud.mat.map = tex;
    ud.mat.needsUpdate = true;
    if (ud.borderMesh) {
      ud.borderMesh.geometry.dispose();
      ud.borderMesh.geometry = this._reflectionGeometry(ud.theta, w + b * 2, h + b * 2, 0.015);
    }
  }

  /* -------------------- rippling grid pulse -------------------- */
  _buildPulse() {
    const { radius: R, width: W } = this.cfg;
    const rIn = R - W / 2;
    const rOut = R + W / 2;
    const halfThin = 0.55; // half-thickness along the corridor (tangent)
    const segs = 4;        // softness segments across the band
    const y = 0.035;

    const positions = [];
    const colors = [];
    for (let j = 0; j <= segs; j++) {
      const z = -halfThin + (j / segs) * 2 * halfThin;
      const intensity = 1 - Math.abs(z) / halfThin; // 1 at centre -> 0 at edges
      positions.push(-rIn, y, z, -rOut, y, z);
      colors.push(intensity, intensity, intensity, intensity, intensity, intensity);
    }
    const indices = [];
    for (let j = 0; j < segs; j++) {
      const a = j * 2, b = j * 2 + 1, c = (j + 1) * 2, d = (j + 1) * 2 + 1;
      indices.push(a, b, c, c, b, d);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);

    this.pulseMat = new THREE.MeshBasicMaterial({
      color: '#00ff9c',
      vertexColors: true,
      transparent: true,
      opacity: this.fx.pulseOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.pulseCount = 3;
    this.pulsePhase = 0;
    this.pulseMeshes = [];
    for (let i = 0; i < this.pulseCount; i++) {
      const m = new THREE.Mesh(geom, this.pulseMat);
      m.frustumCulled = false;
      m.renderOrder = 2;
      m.rotation.y = (i / this.pulseCount) * Math.PI * 2;
      this.scene.add(m);
      this.pulseMeshes.push(m);
    }
  }

  _updatePulse(dt) {
    if (!this.pulseMeshes || !this.pulseMeshes.length) return;
    this.pulsePhase += dt * this.fx.pulseSpeed;
    const step = (Math.PI * 2) / this.pulseCount;
    for (let i = 0; i < this.pulseMeshes.length; i++) {
      this.pulseMeshes[i].rotation.y = this.pulsePhase + i * step;
    }
  }

  /* ------------------------ avatar character ------------------------ */
  _buildCharacter() {
    this.characterLoader = new GLTFLoader();
    this.char = { group: null, mixer: null, actions: {}, current: 'idle', facing: 0 };
    this._charPointerYaw = 0;

    // soft blob shadow under the character
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this._makeBlobShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    });
    this.charShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat);
    this.charShadow.rotation.x = -Math.PI / 2;
    this.charShadow.renderOrder = 0;
    this.charShadow.visible = false;
    this.scene.add(this.charShadow);

    let url = 'assets/characters/duck.glb';
    try { url = localStorage.getItem('gridloop-character') || url; } catch (_) { /* default */ }
    this.setCharacter(url);
  }

  _makeBlobShadowTexture() {
    const s = 128;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.32)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  setCharacter(url) {
    if (!url) return;
    this._characterUrl = url;
    const c = this.char;
    if (c.group) {
      this.scene.remove(c.group);
      c.group.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          if (o.material) o.material.dispose();
        }
      });
      c.group = null;
    }
    if (this.charShadow) this.charShadow.visible = false;
    c.actions = {}; c.current = 'idle'; c.mixer = null;

    this.characterLoader.load(url, (gltf) => {
      if (this._characterUrl !== url) return; // a newer swap won
      const model = gltf.scene;
      const sharedMat = new THREE.MeshBasicMaterial({ vertexColors: true, skinning: true, side: THREE.DoubleSide });
      model.traverse((o) => {
        if (o.isMesh) {
          if (o.material) o.material.dispose();
          o.material = sharedMat;
          o.frustumCulled = false;
        }
      });
      this.scene.add(model);
      c.group = model;
      c.facing = this.angle + this.fx.charLead;

      // footprint for the blob shadow (before scale is applied)
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      c.shadowSize = Math.max(size.x, size.z);

      const byName = {};
      (gltf.animations || []).forEach((clip) => { byName[clip.name.toLowerCase()] = clip; });
      c.mixer = new THREE.AnimationMixer(model);
      const idle = byName['idle'];
      const walk = byName['walk'];
      const run = byName['run'];
      if (idle) { c.actions.idle = c.mixer.clipAction(idle); c.actions.idle.play(); }
      if (walk) c.actions.walk = c.mixer.clipAction(walk);
      if (run) c.actions.run = c.mixer.clipAction(run);
      c.current = 'idle';
    }, undefined, () => { /* keep no character on error */ });
  }

  _crossfadeTo(name, duration) {
    const c = this.char;
    if (!c.mixer || c.current === name) return;
    const to = c.actions[name];
    if (!to) return;
    const from = c.actions[c.current];
    to.reset();
    to.play();
    to.fadeIn(duration);
    if (from) from.fadeOut(duration);
    c.current = name;
  }

  _updateCharacter(dt) {
    const c = this.char;
    if (!c || !c.group) return;

    // single rail: fixed lateral offset, ahead of the camera
    const charAngle = this.angle + this.fx.charLead;
    const pos = this._point(charAngle, this.fx.charLateral, 0);
    c.group.position.copy(pos);
    c.group.scale.setScalar(this.fx.charScale);

    // blob shadow under the feet
    if (this.charShadow) {
      this.charShadow.position.set(pos.x, 0.012, pos.z);
      const s = (c.shadowSize || 1) * this.fx.charScale * 1.1;
      this.charShadow.scale.set(s, s, 1);
      this.charShadow.visible = true;
    }

    // facing: exact rail direction + smoothed pointer yaw (pointer off while running)
    const speed = Math.abs(this.velocity);
    const running = speed > this.fx.charRunVel;
    const forward = this.velocity >= 0;
    const railFacing = forward ? charAngle : charAngle + Math.PI;
    const targetYaw = running ? 0 : this._targetNX * this.fx.charPointerYaw;
    const f = Math.min(dt * 60, 3);
    this._charPointerYaw += (targetYaw - this._charPointerYaw) * (1 - Math.exp(-f * 0.18));
    c.group.rotation.y = railFacing - this._charPointerYaw;

    // walk on auto-spin, run while scrolling, decelerating in sync with friction
    let name;
    if (this.idlePaused) name = 'idle';
    else if (running) name = 'run';
    else name = 'walk';
    this._crossfadeTo(name, this.fx.charBlend);

    // run pace follows the corridor speed so it slows down as the scroll decays
    if (c.actions.run) {
      const rate = Math.min(Math.max(speed / (this.fx.charRunVel * 5), 0.55), 1.6);
      c.actions.run.timeScale = rate;
    }

    if (c.mixer) c.mixer.update(dt);
  }

  /* ------------------------- motion streaks ------------------------- */
  _buildStreaks() {
    const M = 48;
    const { width: W, height: H } = this.cfg;
    this.streak = {
      dlat: new Float32Array(M),
      dy: new Float32Array(M),
      depth: new Float32Array(M),
      len: new Float32Array(M),
      positions: new Float32Array(M * 6),
    };
    for (let i = 0; i < M; i++) {
      this.streak.dlat[i] = (Math.random() - 0.5) * W;
      this.streak.dy[i] = 0.4 + Math.random() * (H - 0.8);
      this.streak.depth[i] = 3 + Math.random() * 28;
      this.streak.len[i] = 0.5 + Math.random() * 2.5;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(this.streak.positions, 3));
    this.streakMat = new THREE.LineBasicMaterial({
      color: '#00ff9c',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.streakLines = new THREE.LineSegments(geom, this.streakMat);
    this.streakLines.frustumCulled = false;
    this.scene.add(this.streakLines);
  }

  _updateStreaks(f, speedNorm) {
    if (!this.streak) return;
    const { width: W, height: H } = this.cfg;
    const s = this.streak;
    const eye = this._point(this.angle, 0, this.cfg.eyeHeight);
    const T = this._tangent(this.angle);
    const O = this._radial(this.angle);
    const move = speedNorm * f * this.fx.streakSpeed;

    for (let i = 0; i < s.depth.length; i++) {
      s.depth[i] -= move;
      if (s.depth[i] < 1.5) {
        s.depth[i] = 18 + Math.random() * 24;
        s.dlat[i] = (Math.random() - 0.5) * W;
        s.dy[i] = 0.4 + Math.random() * (H - 0.8);
        s.len[i] = 0.5 + Math.random() * 2.5;
      }
      const len = s.len[i] * (0.6 + speedNorm * 1.8);
      const cx = eye.x + O.x * s.dlat[i] + T.x * s.depth[i];
      const cy = eye.y + s.dy[i];
      const cz = eye.z + O.z * s.dlat[i] + T.z * s.depth[i];
      const o = i * 6;
      s.positions[o] = cx; s.positions[o + 1] = cy; s.positions[o + 2] = cz;
      s.positions[o + 3] = cx + T.x * len; s.positions[o + 4] = cy; s.positions[o + 5] = cz + T.z * len;
    }
    this.streakLines.geometry.attributes.position.needsUpdate = true;
    this.streakMat.opacity = speedNorm * this.fx.streakOpacity;
  }

  /* ------------------ parallax (desktop pointer / mobile gyro) ------------------ */
  _initParallax() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (coarse) this._initGyro();
    else this._initPointer();
  }

  _initGyro() {
    if (!window.DeviceOrientationEvent) return;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    let baseBeta = null;
    let requested = false;

    const onOrientation = (e) => {
      if (e.gamma == null || e.beta == null) return;
      if (baseBeta == null) baseBeta = e.beta; // capture resting tilt as neutral
      this._targetNX = clamp(e.gamma / 25, -1, 1);              // left-right tilt
      this._targetNY = clamp((e.beta - baseBeta) / 30, -1, 1);  // front-back tilt (relative)
    };
    const start = () => window.addEventListener('deviceorientation', onOrientation, true);

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ requires a user gesture before orientation data flows
      const request = () => {
        if (requested) return;
        requested = true;
        DeviceOrientationEvent.requestPermission()
          .then((state) => { if (state === 'granted') start(); })
          .catch(() => {});
      };
      window.addEventListener('touchstart', request);
      window.addEventListener('click', request);
    } else {
      start();
    }
  }

  _initPointer() {
    if (!(window.matchMedia && window.matchMedia('(pointer: fine)').matches)) return;
    const update = (e) => {
      this._targetNX = (e.clientX / (this.width || 1)) * 2 - 1;
      this._targetNY = (e.clientY / (this.height || 1)) * 2 - 1;
    };
    window.addEventListener('pointermove', update);
    window.addEventListener('pointerleave', () => { this._targetNX = 0; this._targetNY = 0; });
    document.documentElement.addEventListener('mouseleave', () => { this._targetNX = 0; this._targetNY = 0; });
  }

  /* ------------------------------ setup ------------------------------ */
  _initRenderer() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.width = w;
    this.height = h;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(this.cfg.fov, w / h, this.cfg.near, this.cfg.far);
    this.raycaster = new THREE.Raycaster();
  }

  _initScene() {
    this.scene = new THREE.Scene();
    const bg = new THREE.Color('#02050a');
    this.scene.background = bg;
    this.scene.fog = new THREE.Fog(bg, this.cfg.fogNear, this.cfg.fogFar);

    // post-processing (neon bloom)
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      this.cfg.bloomStrength,
      this.cfg.bloomRadius,
      this.cfg.bloomThreshold
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  /* --------------------------- grid geometry -------------------------- */
  // centre line, radial (outward), and tangent at angle t
  _point(t, d = 0, y = 0) {
    const cx = -this.cfg.radius * Math.cos(t);
    const cz = this.cfg.radius * Math.sin(t);
    const ox = -Math.cos(t); // radial outward x
    const oz = Math.sin(t);  // radial outward z
    return new THREE.Vector3(cx + ox * d, y, cz + oz * d);
  }
  _tangent(t) {
    return new THREE.Vector3(Math.sin(t), 0, Math.cos(t));
  }
  _radial(t) {
    return new THREE.Vector3(-Math.cos(t), 0, Math.sin(t));
  }

  _buildGrid() {
    const { radius, width: W, height: H, ringSegments: N, longSegments: M, floorDivs } = this.cfg;
    const major = [];  // bright structure (ribs + corner lines)
    const minor = [];  // dimmer fill (interior grid + wall midlines)

    const seg = (arr, a, b) => { arr.push(a.x, a.y, a.z, b.x, b.y, b.z); };

    // transverse ribs (the repeating "frames" that sell the depth)
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const fl = this._point(t, -W / 2, 0);
      const fr = this._point(t, W / 2, 0);
      const cr = this._point(t, W / 2, H);
      const cl = this._point(t, -W / 2, H);
      seg(major, fl, fr); // floor edge
      seg(major, fr, cr); // right wall
      seg(major, cr, cl); // ceiling edge
      seg(major, cl, fl); // left wall
    }

    // longitudinal lines (run along the loop)
    for (let k = 0; k <= floorDivs; k++) {
      const d = -W / 2 + (k / floorDivs) * W;
      const isCorner = k === 0 || k === floorDivs;
      const target = isCorner ? major : minor;
      for (let j = 0; j < M; j++) {
        const t0 = (j / M) * Math.PI * 2;
        const t1 = ((j + 1) / M) * Math.PI * 2;
        seg(target, this._point(t0, d, 0), this._point(t1, d, 0)); // floor
        seg(target, this._point(t0, d, H), this._point(t1, d, H)); // ceiling
      }
    }
    // horizontal mid-lines on each wall
    for (const d of [-W / 2, W / 2]) {
      for (let j = 0; j < M; j++) {
        const t0 = (j / M) * Math.PI * 2;
        const t1 = ((j + 1) / M) * Math.PI * 2;
        seg(minor, this._point(t0, d, H / 2), this._point(t1, d, H / 2));
      }
    }

    this.majorMat = new THREE.LineBasicMaterial({ color: '#00ff9c', transparent: true, opacity: 0.85, depthWrite: false });
    this.minorMat = new THREE.LineBasicMaterial({ color: '#00ff9c', transparent: true, opacity: 0.3, depthWrite: false });

    const majorGeom = new THREE.BufferGeometry();
    majorGeom.setAttribute('position', new THREE.Float32BufferAttribute(major, 3));
    this.scene.add(new THREE.LineSegments(majorGeom, this.majorMat));

    const minorGeom = new THREE.BufferGeometry();
    minorGeom.setAttribute('position', new THREE.Float32BufferAttribute(minor, 3));
    this.scene.add(new THREE.LineSegments(minorGeom, this.minorMat));
  }

  /* ------------------------- solid surfaces --------------------------- */
  // Opaque floor / ceiling / walls so the corridor reads as a solid tunnel
  // (you can no longer see through to the far side of the loop). Each face is
  // nudged a hair *outside* the grid lines (0.04 units) to avoid z-fighting,
  // while the neon grid stays visible in front of them.
  _buildSolid() {
    const { radius, width: W, height: H } = this.cfg;
    const inset = 0.04;
    const rInner = radius - W / 2 - inset;
    const rOuter = radius + W / 2 + inset;
    const yFloor = -inset;
    const yCeil = H + inset;
    const wallHeight = yCeil - yFloor;
    const wallY = (yCeil + yFloor) / 2;
    const segs = 256;

    this.solidMat = new THREE.MeshBasicMaterial({ color: '#07160e', side: THREE.DoubleSide });
    this.solid = new THREE.Group();

    const floorGeom = new THREE.RingGeometry(rInner, rOuter, segs);
    floorGeom.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeom, this.solidMat);
    floor.position.y = yFloor;
    this.solid.add(floor);

    const ceilGeom = new THREE.RingGeometry(rInner, rOuter, segs);
    ceilGeom.rotateX(-Math.PI / 2);
    const ceil = new THREE.Mesh(ceilGeom, this.solidMat);
    ceil.position.y = yCeil;
    this.solid.add(ceil);

    const innerGeom = new THREE.CylinderGeometry(rInner, rInner, wallHeight, segs, 1, true);
    const inner = new THREE.Mesh(innerGeom, this.solidMat);
    inner.position.y = wallY;
    this.solid.add(inner);

    const outerGeom = new THREE.CylinderGeometry(rOuter, rOuter, wallHeight, segs, 1, true);
    const outer = new THREE.Mesh(outerGeom, this.solidMat);
    outer.position.y = wallY;
    this.solid.add(outer);

    this.scene.add(this.solid);
  }

  /* ------------------------- photo frames ----------------------------- */
  _buildFrames() {
    const { width: W, height: H } = this.cfg;
    const n = this.projects.length;
    if (!n) return;

    this.frameBorderMat = new THREE.MeshBasicMaterial({ color: '#00ff9c', side: THREE.DoubleSide });
    this.frameBorderMats = [];
    this.loader = new THREE.TextureLoader();
    this.videoTextures = [];
    this.reflectionMats = [];
    this.reflectBorderMats = [];
    this.reflections = [];
    this.reflectionAlphaMap = this._makeReflectionAlphaMap();

    const unitGeom = new THREE.PlaneGeometry(1, 1);

    this.projects.forEach((project, i) => {
      const t = (i / n) * Math.PI * 2;
      const side = 1; // all frames on the right wall
      const d = side * (W / 2 - 0.25);
      const y = H * 0.55;

      const group = new THREE.Group();
      group.position.copy(this._point(t, d, y));
      // face the corridor centre line (keeps frames upright + inward-facing)
      group.lookAt(this._point(t, 0, y));
      group.userData.project = project;

      const borderMat = new THREE.MeshBasicMaterial({ color: '#00ff9c', side: THREE.DoubleSide });
      const border = new THREE.Mesh(unitGeom, borderMat);
      border.userData.project = project;
      group.userData.borderMat = borderMat;
      this.frameBorderMats.push(borderMat);
      group.add(border);

      const imgMat = new THREE.MeshBasicMaterial({ map: this._fallbackTexture(project), side: THREE.DoubleSide });
      const img = new THREE.Mesh(unitGeom, imgMat);
      img.position.z = 0.02;
      img.userData.project = project;
      group.add(img);

      this._fitFrame(img, border, 16 / 9);

      // mirrored floor reflection (built once the frame's real size is known)
      const reflectMat = new THREE.MeshBasicMaterial({
        map: null,
        alphaMap: this.reflectionAlphaMap,
        transparent: true,
        opacity: this.fx.reflectionOpacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const reflectMesh = new THREE.Mesh(new THREE.BufferGeometry(), reflectMat);
      reflectMesh.frustumCulled = false;
      reflectMesh.renderOrder = 1;
      this.scene.add(reflectMesh);
      this.reflectionMats.push(reflectMat);
      this.reflections.push(reflectMesh);

      // neon border reflection (a slightly larger, tinted quad behind the image)
      const reflectBorderMat = new THREE.MeshBasicMaterial({
        color: '#00ff9c',
        alphaMap: this.reflectionAlphaMap,
        transparent: true,
        opacity: this.fx.reflectionOpacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const reflectBorderMesh = new THREE.Mesh(new THREE.BufferGeometry(), reflectBorderMat);
      reflectBorderMesh.frustumCulled = false;
      reflectBorderMesh.renderOrder = 0;
      this.scene.add(reflectBorderMesh);
      this.reflectBorderMats.push(reflectBorderMat);
      this.reflections.push(reflectBorderMesh);

      img.userData.reflect = { mesh: reflectMesh, mat: reflectMat, borderMesh: reflectBorderMesh, borderMat: reflectBorderMat, theta: t };

      // the wall shows the FIRST item of the gallery (in order). A video item
      // auto-plays on the wall; an image shows statically. No gallery -> thumb/media.
      const cover = this._wallCover(project);
      if (cover && cover.type === 'video') {
        this._bindVideoTexture(img, border, cover.src);
      } else if (cover && cover.src) {
        this.loader.load(
          cover.src,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            imgMat.map = tex;
            imgMat.needsUpdate = true;
            const iw = tex.image && tex.image.width;
            const ih = tex.image && tex.image.height;
            if (iw && ih) this._fitFrame(img, border, iw / ih);
            this._fitReflection(img, tex);
          },
          undefined,
          () => { /* keep fallback on error */ }
        );
      }

      this.scene.add(group);
      this.frames.push(group);
      this.frameHitMeshes.push(border, img);
    });
  }

  _isVideoUrl(url) {
    return typeof url === 'string' && /\.(mp4|webm|mov|m4v|ogv|ogg)([?#]|$)/i.test(url);
  }

  _bindVideoTexture(img, border, url) {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');

    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    img.material.map = tex;
    img.material.needsUpdate = true;
    this.videoTextures.push(tex);

    video.addEventListener('loadedmetadata', () => {
      if (video.videoWidth && video.videoHeight) {
        this._fitFrame(img, border, video.videoWidth / video.videoHeight);
      }
      this._fitReflection(img, tex);
    });

    const p = video.play();
    if (p && p.catch) p.catch(() => { /* ignore autoplay rejection */ });
  }

  // scale a frame (and its border) to fit an image's aspect inside the max box,
  // so portrait / square / wide images are never stretched
  _fitFrame(img, border, aspect) {
    const maxW = this.cfg.frameW;
    const maxH = this.cfg.frameH;
    const b = this.cfg.frameBorder;
    let w = maxW;
    let h = maxW / aspect;
    if (h > maxH) { h = maxH; w = maxH * aspect; }
    img.scale.set(w, h, 1);
    border.scale.set(w + b * 2, h + b * 2, 1);
  }

  _wallCover(project) {
    // first gallery item (in order of appearance) is the wall cover
    if (Array.isArray(project.gallery) && project.gallery.length) {
      const first = project.gallery[0];
      if (typeof first === 'string') {
        return { type: this._isVideoUrl(first) ? 'video' : 'image', src: first };
      }
      if (first && typeof first === 'object') {
        return {
          type: first.type === 'video' ? 'video' : 'image',
          src: first.src || first.thumb || '',
        };
      }
    }
    // no gallery -> fall back to the old thumb / media cover
    if (this._isVideoUrl(project.thumb)) return { type: 'video', src: project.thumb };
    if (project.type === 'video' && this._isVideoUrl(project.media)) return { type: 'video', src: project.media };
    const imgSrc = project.thumb || (project.type === 'image' ? project.media : null);
    return imgSrc ? { type: 'image', src: imgSrc } : null;
  }

  _fallbackTexture(project) {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 360;
    const g = c.getContext('2d');
    g.fillStyle = '#04070b';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = this.frameBorderMat ? '#' + this.frameBorderMat.color.getHexString() : '#00ff9c';
    g.lineWidth = 8;
    g.strokeRect(12, 12, c.width - 24, c.height - 24);
    g.fillStyle = g.strokeStyle;
    g.font = '700 30px monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText((project.title || '').toUpperCase(), c.width / 2, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ----------------------------- theme -------------------------------- */
  setTheme(theme) {
    this.theme = theme || this.theme || {};
    const bg = new THREE.Color(theme.bg || '#02050a');
    const accent = new THREE.Color(theme.accent || '#00ff9c');
    this._accentHex = '#' + accent.getHexString();
    this.scene.background = bg;
    this.scene.fog.color.copy(bg);
    this.majorMat.color.copy(accent);
    this.minorMat.color.copy(accent);
    this.frameBorderMat.color.copy(accent);
    if (this.frameBorderMats) this.frameBorderMats.forEach((m) => m.color.copy(accent));
    if (this.reflectBorderMats) this.reflectBorderMats.forEach((m) => m.color.copy(accent));
    if (this.pulseMat) this.pulseMat.color.copy(accent);
    if (this.solidMat) this.solidMat.color.set(theme.solid || theme.bg || '#07160e');
    if (this.dustMat) this.dustMat.color.copy(accent);
    if (this.streakMat) this.streakMat.color.copy(accent);
    if (this.bloomPass) {
      this.bloomPass.strength = this.cfg.bloomStrength;
    }
    if (this.frameHighlight >= 0) this._setBorderColor(this.frameHighlight, true);
  }

  /* ----------------------------- input -------------------------------- */
  addScroll(delta) {
    this.velocity += delta;
    this.velocity = Math.max(-this.cfg.maxVel, Math.min(this.cfg.maxVel, this.velocity));
  }

  /* ----------------------------- picking ------------------------------ */
  pick(clientX, clientY) {
    if (!this.frameHitMeshes.length) return null;
    const ndc = new THREE.Vector2(
      (clientX / this.width) * 2 - 1,
      -(clientY / this.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.frameHitMeshes, false);
    if (!hits.length) return null;
    return hits[0].object.userData.project || null;
  }

  pickIndex(clientX, clientY) {
    const p = this.pick(clientX, clientY);
    if (!p) return -1;
    return this.projects.indexOf(p);
  }

  setFrameHighlight(index) {
    if (this.frameHighlight === index) return;
    if (this.frameHighlight >= 0) this._setBorderColor(this.frameHighlight, false);
    this.frameHighlight = index;
    if (index >= 0) this._setBorderColor(index, true);
  }

  _setBorderColor(index, on) {
    const group = this.frames[index];
    const mat = group && group.userData.borderMat;
    if (!mat) return;
    mat.color.set(on ? 0xffffff : (this._accentHex || '#00ff9c'));
  }

  /* ---------------------- nearest project ---------------------- */
  getClosestProject() {
    const n = this.projects.length;
    if (!n) return null;
    const TWO_PI = Math.PI * 2;
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TWO_PI;
      let d = (t - this.angle) % TWO_PI;
      if (d < 0) d += TWO_PI;
      if (d > Math.PI) d = TWO_PI - d;
      if (d < bestDist) {
        bestDist = d;
        best = this.projects[i];
      }
    }
    return best;
  }

  /* -------------------- teleport to a project -------------------- */
  teleportToProject(index) {
    const n = this.projects.length;
    if (!n) return;
    const i = Math.max(0, Math.min(n - 1, index));
    this.angle = (i / n) * Math.PI * 2 - 0.35; // land just before the frame so it's in view
    this.velocity = 0;
    this.speedSmooth = 0;
    this.bobPhase = 0;
    this.tweenTarget = null;
  }

  getProjectSpacing() {
    return this.projects.length ? (Math.PI * 2) / this.projects.length : 0;
  }

  gotoDelta(radians) {
    if (!radians) return;
    this.tweenStart = this.angle;
    this.tweenTarget = this.angle + radians;
    this.tweenT = 0;
    this.velocity = 0;
  }

  applyTunings() {
    if (this.bloomPass) {
      this.bloomPass.strength = this.cfg.bloomStrength;
      this.bloomPass.radius = this.cfg.bloomRadius;
      this.bloomPass.threshold = this.cfg.bloomThreshold;
    }
    if (this.dustMat) {
      this.dustMat.size = this.fx.dustSize;
      this.dustMat.opacity = this.fx.dustOpacity;
    }
    if (this.reflectionMats) {
      this.reflectionMats.forEach((m) => { m.opacity = this.fx.reflectionOpacity; });
    }
    if (this.reflectBorderMats) {
      this.reflectBorderMats.forEach((m) => { m.opacity = this.fx.reflectionOpacity; });
    }
    if (this.pulseMat) {
      this.pulseMat.opacity = this.fx.pulseOpacity;
    }
  }

  /* -------------------- live project reload -------------------- */
  setProjects(newProjects) {
    // stop + release old video textures
    if (this.videoTextures) {
      for (const tex of this.videoTextures) {
        const v = tex.image;
        if (v) { v.pause(); v.src = ''; }
        tex.dispose();
      }
      this.videoTextures = [];
    }
    // remove old frames
    for (const group of this.frames) {
      group.traverse((o) => {
        if (o.isMesh && o.material) {
          if (o.material.map) o.material.map.dispose();
          if (o.material !== this.frameBorderMat) o.material.dispose();
        }
      });
      this.scene.remove(group);
    }
    this.frames = [];
    this.frameHitMeshes = [];

    this.tweenTarget = null;
    this.frameHighlight = -1;
    if (this.reflections) {
      for (const r of this.reflections) {
        this.scene.remove(r);
        r.geometry.dispose();
        r.material.dispose();
      }
      this.reflections = [];
    }
    this.projects = Array.isArray(newProjects) ? newProjects : [];
    this._buildFrames();
  }

  /* ------------------------------ frame ------------------------------- */
  tick(dt) {
    const f = Math.min(dt * 60, 3); // normalize to 60fps, clamp big jumps

    if (this.tweenTarget != null) {
      this.tweenT += dt / this.fx.tweenDuration;
      const tt = Math.min(this.tweenT, 1);
      const e = tt * tt * (3 - 2 * tt); // smoothstep
      this.angle = this.tweenStart + (this.tweenTarget - this.tweenStart) * e;
      this.velocity = 0;
      if (this.tweenT >= 1) {
        this.angle = this.tweenTarget;
        this.tweenTarget = null;
      }
    } else {
      this.velocity *= Math.pow(this.cfg.friction, f);
      if (Math.abs(this.velocity) < 0.00002) this.velocity = 0;
      this.angle += this.velocity * f + (this.idlePaused ? 0 : this.cfg.idleDrift * f);
    }

    // smoothed speed 0..1 (drives every speed-based effect below)
    const targetSpeed = Math.min(Math.abs(this.velocity) / this.fx.speedRef, 1);
    this.speedSmooth += (targetSpeed - this.speedSmooth) * (1 - Math.exp(-f * 0.12));

    // camera position + subtle speed bob / sway
    const eye = this._point(this.angle, 0, this.cfg.eyeHeight);
    this.bobPhase += Math.abs(this.velocity) * f * 1.4;
    const bob = Math.sin(this.bobPhase) * this.fx.bobAmp * this.speedSmooth;
    const sway = Math.cos(this.bobPhase * 0.8) * this.fx.swayAmp * this.speedSmooth;
    const O = this._radial(this.angle);
    eye.y += bob;
    eye.addScaledVector(O, sway);
    this.camera.position.copy(eye);

    // pointer parallax: smooth lean/pan toward the cursor
    const pk = 1 - Math.exp(-f * this.fx.parallaxSmoothing);
    this.parallaxX += (this._targetNX - this.parallaxX) * pk;
    this.parallaxY += (this._targetNY - this.parallaxY) * pk;
    const T = this._tangent(this.angle);
    this.camera.lookAt(
      eye.clone()
        .add(T)
        .addScaledVector(O, this.parallaxX * this.fx.parallaxX)
        .addScaledVector(this._up, -this.parallaxY * this.fx.parallaxY)
    );

    // grid "stretch" = subtle FOV warp with velocity
    const fov = this.cfg.fov + this.speedSmooth * this.fx.fovWarp;
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    // fog thickens as you speed up
    this.scene.fog.near = this.cfg.fogNear * (1 - this.fx.fogNearTighten * this.speedSmooth);
    this.scene.fog.far = this.cfg.fogFar * (1 - this.fx.fogFarTighten * this.speedSmooth);

    this._updateStreaks(f, this.speedSmooth);
    this._updateDust(dt);
    this._updatePulse(dt);
    this._updateCharacter(dt);
    this._updateVideoTextures();
    this.composer.render();
  }

  _updateVideoTextures() {
    if (!this.videoTextures) return;
    for (const tex of this.videoTextures) {
      const v = tex.image;
      if (v && v.readyState >= 2) tex.needsUpdate = true;
    }
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    if (!w || !h) return;
    this.width = w;
    this.height = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }
}
