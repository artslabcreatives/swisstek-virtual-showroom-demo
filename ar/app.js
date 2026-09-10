import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

const $ = (s) => document.querySelector(s);
const HASH = '2c57c7a59825f14f654e0eddf742343bad8fe78679bbafc1f5c5cd513eb78e48';
const OPEN = false; // set true to remove the gate

/* ---------- gate ---------- */
async function sha256(s) {
  if (!crypto.subtle) return null;
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  if (id) $(id).classList.add('on');
}
async function tryGate() {
  const v = $('#pass').value.trim().toLowerCase();
  const h = await sha256(v);
  if (OPEN || h === HASH || (h === null && v === 'swisstek-atrium-2026')) {
    try { sessionStorage.setItem('one-ok', '1'); } catch (e) {}
    show('#home');
  } else {
    $('#gateMsg').textContent = 'That is not the passphrase';
  }
}
$('#gateBtn').addEventListener('click', tryGate);
$('#pass').addEventListener('keydown', e => { if (e.key === 'Enter') tryGate(); });
try { if (OPEN || sessionStorage.getItem('one-ok') === '1') show('#home'); } catch (e) {}
if (!/iPhone|iPad/.test(navigator.userAgent) || window.navigator.standalone) $('#iosHint').style.display = 'none';

/* ---------- helpers ---------- */
function toast(msg, ms = 1800) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), ms);
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function labelSprite(text, sub, w = 0.36) {
  const tex = canvasTex(512, 128, (g, W, H) => {
    g.fillStyle = 'rgba(255,255,255,0.96)'; roundRect(g, 0, 0, W, H, 28); g.fill();
    g.fillStyle = '#E41F26'; g.beginPath(); g.arc(44, H / 2, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#15181C'; g.font = '600 40px -apple-system, Helvetica, Arial'; g.textBaseline = 'middle';
    g.fillText(text, 78, H / 2 - (sub ? 18 : 0));
    if (sub) { g.fillStyle = '#6E7780'; g.font = '28px Menlo, monospace'; g.fillText(sub, 78, H / 2 + 26); }
  });
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const s = new THREE.Sprite(m); s.scale.set(w, w / 4, 1); s.renderOrder = 10;
  return s;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- scene 1: layer dissection (page 14) ---------- */
const LAYER_DEFS = [
  { name: 'Substrate', sub: 'cement screed' },
  { name: 'Super Plus Tile Adhesive', sub: 'C2T · SLS 1375' },
  { name: 'Tile', sub: 'client supplied' },
  { name: 'Polymer Modified Tile Grout', sub: 'CG2WA · SLS 1376' },
  { name: 'Grout Sealer', sub: '200 ml' },
];
const Z_EXP = [0, 0.05, 0.10, 0.106, 0.16];
const Z_ASM = [0, 0.011, 0.022, 0.024, 0.031];
function buildLayers() {
  const g = new THREE.Group();
  const W = 0.36, H = 0.255, T = 0.01;
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x8b939b, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#c9cfd5'; c.fillRect(0, 0, w, h); c.fillStyle = '#9aa2aa'; for (let x = 0; x < w; x += 24) c.fillRect(x, 0, 12, h); }), roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#d8d4d3'; c.fillRect(0, 0, w, h); c.fillStyle = '#eef0f2'; const gap = 10; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) c.fillRect(i * w / 2 + gap / 2, j * h / 2 + gap / 2, w / 2 - gap, h / 2 - gap); }), roughness: 0.35, metalness: 0.05 }),
    new THREE.MeshBasicMaterial({ map: canvasTex(512, 512, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#E41F26'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke(); }), transparent: true, depthWrite: false }),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, roughness: 0.05, transmission: 0.2 }),
  ];
  const layers = [];
  for (let i = 0; i < 5; i++) {
    const geo = i === 3 ? new THREE.PlaneGeometry(W, H) : new THREE.BoxGeometry(W, H, T);
    const m = new THREE.Mesh(geo, mats[i]);
    m.position.z = Z_EXP[i]; m.position.y = i * 0.075; m.renderOrder = i;
    g.add(m); layers.push(m);
    const lb = labelSprite(`0${i + 1}  ${LAYER_DEFS[i].name}`, LAYER_DEFS[i].sub, 0.32);
    lb.position.set(W / 2 + 0.18, i * 0.075, Z_EXP[i] + 0.02);
    g.add(lb); m.userData.label = lb;
  }
  g.rotation.x = -0.35; g.position.set(-0.2, -0.1, 0.03);
  g.userData = { layers, exploded: true };
  return g;
}

/* ---------- scene 2: timber switch (page 19) ---------- */
const TIMBERS = [['Burma Teak', '#B5854A'], ['Indonesian Teak', '#A9773F'], ['Taukkyan', '#8B5E3C'], ['Tauari', '#C9A877'], ['Merbau', '#7A4428'], ['Pyinkado', '#6E4326']];
function buildWood() {
  const g = new THREE.Group();
  const tex = new THREE.TextureLoader().load('./assets/wood_grey.jpg'); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.6, 1);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.52), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(TIMBERS[0][1]).multiplyScalar(1.35) }));
  plane.position.set(-0.21, -0.06, 0.006);
  g.add(plane);
  const lb = labelSprite('Burma Teak', 'Swissparkett · solid timber', 0.4); lb.position.set(-0.21, -0.36, 0.06);
  g.add(lb);
  g.userData = { plane, lb };
  return g;
}

/* ---------- scene 3: card (page 25) ---------- */
function buildCard() {
  const g = new THREE.Group();
  const tex = canvasTex(1024, 640, (c, w, h) => {
    c.fillStyle = '#fff'; roundRect(c, 0, 0, w, h, 40); c.fill();
    c.fillStyle = '#E41F26'; c.fillRect(0, 0, w, 14);
    c.fillStyle = '#E41F26'; c.font = '800 88px -apple-system, Helvetica, Arial'; c.fillText('SWISSTEK', 64, 150);
    c.fillStyle = '#6E7780'; c.font = '600 30px Menlo, monospace'; c.fillText('FOR THE PERFECT FINISH', 66, 200);
    c.fillStyle = '#15181C'; c.font = '48px Georgia, serif'; c.fillText('Share your card with us', 64, 330);
    c.fillStyle = '#6E7780'; c.font = '32px -apple-system, Helvetica, Arial'; c.fillText('Tap Send below. Your details reach the right team,', 64, 400); c.fillText('tagged with the page you scanned.', 64, 446);
    c.fillStyle = '#E41F26'; c.font = '600 30px Menlo, monospace'; c.fillText('011 780 7000  ·  swisstekceylon.com', 64, 560);
  });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.31), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  card.position.set(-0.15, 0.0, 0.08); card.rotation.x = -0.35;
  g.add(card); g.userData = { card };
  return g;
}

/* ---------- AR runtime ---------- */
let mindar = null, active = null, scenes = {}, t0 = 0;
async function startAR() {
  show(null);
  $('#arview').classList.add('on'); $('#hud').style.display = 'flex'; $('#scan').style.display = 'flex';
  $('#pillTxt').textContent = 'Looking for a page';
  mindar = new MindARThree({ container: $('#arview'), imageTargetSrc: './targets/swisstek.mind', uiLoading: 'no', uiScanning: 'no', uiError: 'no', filterMinCF: 0.0005, filterBeta: 0.01, maxTrack: 1 });
  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9199, 1.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(0.5, 1, 2); scene.add(dl);

  scenes.layers = buildLayers(); scenes.wood = buildWood(); scenes.card = buildCard();
  const a0 = mindar.addAnchor(0); a0.group.add(scenes.layers);
  const a1 = mindar.addAnchor(1); a1.group.add(scenes.wood);
  const a2 = mindar.addAnchor(2); a2.group.add(scenes.card);
  const found = (name, label, sheet) => () => { active = name; $('#scan').classList.add('hide'); $('#pillTxt').textContent = label; toast(label + ' recognised'); document.querySelectorAll('.sheet').forEach(s => s.classList.remove('on')); if (sheet) $(sheet).classList.add('on'); };
  const lost = () => { active = null; $('#scan').classList.remove('hide'); $('#pillTxt').textContent = 'Looking for a page'; document.querySelectorAll('.sheet').forEach(s => s.classList.remove('on')); };
  a0.onTargetFound = found('layers', 'Page 14 · Tile system', '#sheetLayers'); a0.onTargetLost = lost;
  a1.onTargetFound = found('wood', 'Page 19 · Swissparkett', '#sheetWood'); a1.onTargetLost = lost;
  a2.onTargetFound = found('card', 'Page 25 · Talk to us', '#sheetLead'); a2.onTargetLost = lost;

  try { await mindar.start(); } catch (e) { toast('Camera could not start: ' + (e.message || e), 4000); stopAR(); return; }
  t0 = performance.now();
  renderer.setAnimationLoop(() => {
    const t = (performance.now() - t0) / 1000;
    const L = scenes.layers.userData;
    L.layers.forEach((m, i) => { const z = L.exploded ? Z_EXP[i] : Z_ASM[i]; m.position.z = lerp(m.position.z, z, 0.08); m.position.y = lerp(m.position.y, L.exploded ? i * 0.075 : 0, 0.08); const lb = m.userData.label; lb.position.z = m.position.z + 0.02; lb.position.y = m.position.y; lb.material.opacity = lerp(lb.material.opacity, L.exploded ? 1 : 0, 0.1); lb.visible = lb.material.opacity > 0.02; });
    const c = scenes.card.userData.card; c.position.z = 0.08 + Math.sin(t * 1.4) * 0.01;
    renderer.render(scene, camera);
  });
}
function stopAR() {
  try { mindar && mindar.renderer.setAnimationLoop(null); mindar && mindar.stop(); } catch (e) {}
  $('#arview').classList.remove('on'); $('#arview').innerHTML = ''; $('#hud').style.display = 'none'; $('#scan').style.display = 'none';
  document.querySelectorAll('.sheet').forEach(s => s.classList.remove('on'));
  active = null; show('#home');
}
$('#startBtn').addEventListener('click', startAR);
$('#closeBtn').addEventListener('click', stopAR);

/* ---------- sheet interactions ---------- */
$('#toggleLayers').addEventListener('click', () => { const L = scenes.layers.userData; L.exploded = !L.exploded; $('#toggleLayers b').textContent = L.exploded ? 'Assemble' : 'Dissect'; });
$('#arview').addEventListener('click', () => { if (active === 'layers') $('#toggleLayers').click(); });
document.querySelectorAll('#layerList > div').forEach(r => r.addEventListener('click', () => {
  document.querySelectorAll('#layerList > div').forEach(x => x.classList.remove('on')); r.classList.add('on');
  const L = scenes.layers && scenes.layers.userData; if (!L) return;
  L.layers.forEach((m, i) => { const on = String(i) === r.dataset.n; if (m.material.emissive) m.material.emissive.setHex(on ? 0x5a0a0d : 0x000000); });
}));
const chips = $('#woodChips');
TIMBERS.forEach(([n, hex], i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (i === 0 ? ' on' : ''); b.style.setProperty('--c', hex); b.innerHTML = `<i></i><b>${n}</b>`;
  b.addEventListener('click', () => {
    chips.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); b.classList.add('on');
    const W = scenes.wood && scenes.wood.userData; if (!W) return;
    W.plane.material.color.set(hex).multiplyScalar(1.35);
    const old = W.lb; scenes.wood.remove(old); const lb = labelSprite(n, 'Swissparkett · solid timber', 0.44); lb.position.copy(old.position); scenes.wood.add(lb); W.lb = lb;
    $('#woodName').textContent = n;
  });
  chips.appendChild(b);
});
$('#leadForm').addEventListener('submit', e => { e.preventDefault(); const n = $('#lf-name').value.trim(); $('#doneMsg').textContent = (n ? 'Thank you, ' + n + '. ' : 'Thank you. ') + 'A Swisstek expert will be in touch.'; $('#sheetLead').classList.add('sent'); });
$('#leadAgain').addEventListener('click', () => { $('#sheetLead').classList.remove('sent'); $('#leadForm').reset(); });

/* ---------- service worker (installability on Android; harmless on iOS) ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
