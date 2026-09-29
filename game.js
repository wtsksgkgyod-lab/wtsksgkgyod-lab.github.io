import * as THREE from "three";

const D = window.Danku;
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", alpha: false });
renderer.setClearColor(0x10151c, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x1a2230, 140, 620);
scene.add(new THREE.HemisphereLight(0xd5e2f2, 0x3a2a22, 1.6));
const sun = new THREE.DirectionalLight(0xfff7ee, 2.1);
sun.position.set(40, 80, 20);
scene.add(sun);

const groundTex = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#1c2430";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#3d4b5e";
  g.lineWidth = 2;
  for (let i = 0; i <= 512; i += 32) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(24, 24);
  return t;
})();
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshLambertMaterial({ map: groundTex }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const arena = new THREE.Group();
scene.add(arena);
const preview = new THREE.Group();
scene.add(preview);

const camera = new THREE.PerspectiveCamera(64, 1, 0.3, 700);
const listener = new THREE.AudioListener();

const audio = { ctx: null };
function ac() {
  if (!audio.ctx) audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.ctx.state === "suspended") audio.ctx.resume();
  return audio.ctx;
}
function tone(freq, dur, type, gain, slide) {
  const ctx = audio.ctx; if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), ctx.currentTime + dur);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + dur + 0.02);
}
function noise(dur, gain, freq) {
  const ctx = audio.ctx; if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq || 400;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(filter); filter.connect(g); g.connect(ctx.destination);
  src.start();
}

let loadout = loadSave() || JSON.parse(JSON.stringify(D.PRESETS.light));
let enemyKey = "mid";
let modeName = "duel";
let screen = "home";
let world = null;
let meshes = [];
let bullets = [];
let lookYaw = Math.PI;
let lookPitch = 0.18;
let shake = 0;
let last = performance.now();
let acc = 0;
const held = {};
let stickId = null;
let lookId = null;
const stick = { x: 0, y: 0 };
let edge = {};
let prevHeld = {};

function loadSave() {
  try {
    const raw = localStorage.getItem("danku-loadout");
    if (!raw) return null;
    const o = JSON.parse(raw);
    return D.validate(o).ok ? o : null;
  } catch (e) { return null; }
}
function save() {
  try { localStorage.setItem("danku-loadout", JSON.stringify(loadout)); } catch (e) {}
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

function addBox(group, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  group.add(m);
  return m;
}

function buildMech(ld, accentHex) {
  const g = new THREE.Group();
  const dark = new THREE.MeshLambertMaterial({ color: 0x2c333c });
  const bone = new THREE.MeshLambertMaterial({ color: 0xd7d2c8 });
  const accent = new THREE.MeshLambertMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 0.18 });
  const hot = new THREE.MeshLambertMaterial({ color: 0xff8a1e, emissive: 0xff6a00, emissiveIntensity: 0.45 });
  addBox(g, 2.1, 2.2, 2.2, 0, 3.3, 0, bone);
  addBox(g, 2.3, 0.18, 2.3, 0, 4.15, 0, accent);
  addBox(g, 0.18, 1.4, 1.6, 0, 3.4, 1.15, accent);
  addBox(g, 1.5, 0.45, 1.8, 0, 4.5, 0, dark);
  addBox(g, 0.7, 0.55, 0.8, 0, 5.0, 0.2, accent);
  addBox(g, 0.55, 1.8, 0.6, -1.7, 3.3, 0.1, dark);
  addBox(g, 0.55, 1.8, 0.6, 1.7, 3.3, 0.1, dark);
  const rw = D.PARTS.weapons[ld.rArm];
  const lw = D.PARTS.weapons[ld.lArm];
  if (rw && !rw.empty) addBox(g, rw.melee ? 0.15 : 0.28, rw.melee ? 1.6 : 0.28, rw.melee ? 0.15 : 1.8, 1.7, 2.5, rw.melee ? 0.2 : 1.1, rw.melee ? accent : dark);
  if (lw && !lw.empty) addBox(g, lw.melee ? 0.15 : 0.28, lw.melee ? 1.6 : 0.28, lw.melee ? 0.15 : 1.6, -1.7, 2.5, lw.melee ? 0.2 : 1.0, lw.melee ? accent : dark);
  if (ld.legs === "haze") {
    addBox(g, 3.6, 0.35, 2.4, 0, 1.7, 0, dark);
    addBox(g, 0.8, 0.5, 0.8, -1.2, 1.2, -0.2, hot);
    addBox(g, 0.8, 0.5, 0.8, 1.2, 1.2, -0.2, hot);
  } else if (ld.legs === "slat") {
    addBox(g, 0.45, 1.5, 0.45, -0.55, 2.3, -0.6, dark);
    addBox(g, 0.45, 1.5, 0.45, 0.55, 2.3, -0.6, dark);
    addBox(g, 0.4, 1.3, 0.4, -0.55, 1.1, 0.5, bone);
    addBox(g, 0.4, 1.3, 0.4, 0.55, 1.1, 0.5, bone);
  } else if (ld.legs === "carrier") {
    addBox(g, 3.8, 1.1, 2.6, 0, 1.5, 0, dark);
    addBox(g, 0.7, 1.2, 1.4, -1.5, 0.8, 0.2, bone);
    addBox(g, 0.7, 1.2, 1.4, 1.5, 0.8, 0.2, bone);
  } else {
    addBox(g, 0.5, 1.6, 0.55, -0.55, 1.6, 0, dark);
    addBox(g, 0.5, 1.6, 0.55, 0.55, 1.6, 0, dark);
    addBox(g, 0.7, 0.35, 1.1, -0.55, 0.7, 0.2, bone);
    addBox(g, 0.7, 0.35, 1.1, 0.55, 0.7, 0.2, bone);
  }
  addBox(g, 1.5, 1.1, 1.1, 0, 3.4, -1.35, dark);
  addBox(g, 0.45, 0.7, 0.7, -0.45, 3.2, -1.9, hot);
  addBox(g, 0.45, 0.7, 0.7, 0.45, 3.2, -1.9, hot);
  const bw = D.PARTS.weapons[ld.rBack];
  const bl = D.PARTS.weapons[ld.lBack];
  if (bw && !bw.empty) addBox(g, 0.55, 0.4, 1.3, 0.7, 4.3, -0.8, accent);
  if (bl && !bl.empty) addBox(g, 0.55, 0.4, 1.3, -0.7, 4.3, -0.8, accent);
  g.userData.hot = hot;
  return g;
}

function clearGroup(g) {
  while (g.children.length) g.remove(g.children[0]);
}

function showPreview() {
  clearGroup(preview);
  const m = buildMech(loadout, 0xd7d2c8);
  preview.add(m);
  preview.visible = true;
}

function buildArena(w) {
  clearGroup(arena);
  const mat = new THREE.MeshLambertMaterial({ color: 0x3a342c });
  w.obstacles.forEach(function (b) {
    const sx = b.max.x - b.min.x, sy = b.max.y - b.min.y, sz = b.max.z - b.min.z;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set((b.min.x + b.max.x) / 2, sy / 2, (b.min.z + b.max.z) / 2);
    arena.add(mesh);
  });
  w.gates.forEach(function (gate) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(gate.r * 0.55, 0.25, 6, 16), new THREE.MeshLambertMaterial({ color: 0xff8a1e, emissive: 0xff8a1e, emissiveIntensity: 0.4 }));
    ring.position.set(gate.x, gate.y, gate.z);
    ring.rotation.y = Math.PI / 2;
    ring.userData.gate = gate.i;
    arena.add(ring);
  });
}

function setScreen(name) {
  screen = name;
  ["home", "garage", "result"].forEach(function (id) {
    document.getElementById(id).classList.toggle("on", id === name);
  });
  const fight = name === "fight";
  document.getElementById("hud").classList.toggle("on", fight);
  document.getElementById("touch").classList.toggle("on", fight);
  preview.visible = !fight;
  if (name === "garage") paintGarage();
  if (name === "home") showPreview();
}

function statBars(d) {
  const rows = [
    ["速度", d.accelBoost / 220],
    ["旋回", d.turnAt(0) / 3.2],
    ["QB", d.qbImpulse / 100],
    ["EN", d.enCap / 460],
    ["AP", d.ap / 14000],
    ["射撃", d.fire / 1.4],
    ["格闘", d.melee / 1.4],
    ["積載", d.carried / d.limit]
  ];
  document.getElementById("stats").innerHTML = rows.map(function (r) {
    const p = Math.max(0, Math.min(1, r[1])) * 100;
    return '<div class="stat"><em>' + r[0] + '</em><i><b style="width:' + p.toFixed(0) + '%"></b></i></div>';
  }).join("");
  const el = document.getElementById("weight");
  el.textContent = d.carried + " / " + d.limit;
  el.classList.toggle("bad", !d.ok);
  document.getElementById("sortie").disabled = !d.ok;
  document.getElementById("buildname").textContent = D.PARTS.legs[loadout.legs].name + " / " + D.PARTS.boosters[loadout.boost].name;
}

function paintGarage() {
  const rows = [
    ["legs", "脚部", D.PARTS.legs],
    ["boost", "ブースタ", D.PARTS.boosters],
    ["gen", "発電機", D.PARTS.gens],
    ["fcs", "照準", D.PARTS.fcs],
    ["head", "頭部", D.PARTS.heads],
    ["core", "胴体", D.PARTS.cores],
    ["arms", "腕部", D.PARTS.arms],
    ["rArm", "右腕", D.PARTS.weapons, "arm"],
    ["lArm", "左腕", D.PARTS.weapons, "arm"],
    ["rBack", "右背", D.PARTS.weapons, "back"],
    ["lBack", "左背", D.PARTS.weapons, "back"]
  ];
  document.getElementById("parts").innerHTML = rows.map(function (r) {
    const table = r[2];
    const id = loadout[r[0]];
    const name = table[id] ? table[id].name : id;
    return '<button class="part tap" data-key="' + r[0] + '" data-slot="' + (r[3] || "") + '"><span>' + r[1] + '</span><b>' + name + '</b></button>';
  }).join("");
  document.getElementById("tuning").value = String(Math.round((loadout.tuning || 0) * 100));
  statBars(D.derived(loadout));
  showPreview();
  ["light", "mid", "heavy"].forEach(function (k) {
    document.getElementById("enemy-" + k).classList.toggle("primary", enemyKey === k);
  });
}

function cycle(key, slot) {
  const table = {
    legs: D.PARTS.legs, boost: D.PARTS.boosters, gen: D.PARTS.gens, fcs: D.PARTS.fcs,
    head: D.PARTS.heads, core: D.PARTS.cores, arms: D.PARTS.arms, rArm: D.PARTS.weapons,
    lArm: D.PARTS.weapons, rBack: D.PARTS.weapons, lBack: D.PARTS.weapons
  }[key];
  let keys = Object.keys(table);
  if (slot === "arm" || slot === "back") keys = keys.filter(function (k) { const w = table[k]; return w.empty || w.slot === slot; });
  const i = keys.indexOf(loadout[key]);
  loadout[key] = keys[(i + 1) % keys.length];
  save();
  paintGarage();
}

document.getElementById("parts").addEventListener("pointerdown", function (e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  cycle(btn.dataset.key, btn.dataset.slot);
});
document.getElementById("tuning").addEventListener("input", function (e) {
  loadout.tuning = Number(e.target.value) / 100;
  save();
  statBars(D.derived(loadout));
});
["light", "mid", "heavy"].forEach(function (k) {
  document.getElementById("pre-" + k).addEventListener("pointerdown", function (e) {
    e.preventDefault(); e.stopPropagation();
    loadout = JSON.parse(JSON.stringify(D.PRESETS[k]));
    save(); paintGarage();
  });
  document.getElementById("enemy-" + k).addEventListener("pointerdown", function (e) {
    e.preventDefault(); e.stopPropagation();
    enemyKey = k; paintGarage();
  });
});

function startMatch(mode) {
  ac();
  modeName = mode;
  if (!D.validate(loadout).ok) { setScreen("garage"); return; }
  world = D.createMatch({ mode: mode, loadout: loadout, enemy: enemyKey });
  buildArena(world);
  meshes.forEach(function (m) { scene.remove(m.mesh); });
  meshes = world.mechs.map(function (m, i) {
    const mesh = buildMech(m.loadout, i === 0 ? 0xd7d2c8 : 0x7fd0d4);
    scene.add(mesh);
    return { mesh: mesh, id: m.id };
  });
  bullets.forEach(function (b) { scene.remove(b); });
  bullets = [];
  preview.visible = false;
  lookYaw = world.mechs[0].yaw;
  world.mechs[0].locked = true;
  const p0 = world.mechs[0];
  camera.position.set(p0.pos.x - Math.sin(p0.yaw) * 18, p0.pos.y + 6, p0.pos.z - Math.cos(p0.yaw) * 18);
  camera.lookAt(p0.pos.x, p0.pos.y + 2, p0.pos.z);
  setScreen("fight");
}

document.getElementById("go-duel").onclick = function () { startMatch("duel"); };
document.getElementById("go-sweep").onclick = function () { startMatch("sweep"); };
document.getElementById("go-drill").onclick = function () { startMatch("drill"); };
document.getElementById("go-garage").onclick = function () { setScreen("garage"); };
document.getElementById("back-home").onclick = function () { setScreen("home"); };
document.getElementById("sortie").onclick = function () { startMatch(modeName || "duel"); };
document.getElementById("retreat").onclick = function () { teardown(); setScreen("home"); };
document.getElementById("to-home").onclick = function () { setScreen("home"); };
document.getElementById("to-garage").onclick = function () { setScreen("garage"); };
document.getElementById("again").onclick = function () { startMatch(modeName); };

function teardown() {
  meshes.forEach(function (m) { scene.remove(m.mesh); });
  meshes = [];
  bullets.forEach(function (b) { scene.remove(b); });
  bullets = [];
  world = null;
}

function finish() {
  const p = world.mechs[0];
  const r = world.result;
  const title = r.draw ? "引分" : r.win ? "勝利" : "敗北";
  document.getElementById("result-title").textContent = title;
  const sec = r.time.toFixed(1);
  document.getElementById("result-body").textContent = sec + " 秒  /  与ダメージ " + Math.round(p.damageDealt) + "  /  QB " + p.qbCount + (world.mode === "drill" ? "  /  ゲート " + world.gate : "");
  tone(r.win ? 520 : 140, 0.35, "sawtooth", 0.05, r.win ? 880 : 70);
  teardown();
  setScreen("result");
}

const stickEl = document.getElementById("stick");
const knob = document.getElementById("knob");
function inStick(x, y) {
  const r = stickEl.getBoundingClientRect();
  return x >= r.left - 20 && x <= r.right + 30 && y >= r.top - 30 && y <= r.bottom + 20;
}
document.getElementById("btns").addEventListener("pointerdown", function (e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  e.preventDefault();
  btn.setPointerCapture(e.pointerId);
  held[btn.dataset.act] = true;
  ac();
});
document.getElementById("btns").addEventListener("pointerup", function (e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  held[btn.dataset.act] = false;
});
document.getElementById("btns").addEventListener("pointercancel", function (e) {
  const btn = e.target.closest("button");
  if (btn) held[btn.dataset.act] = false;
});

window.addEventListener("pointerdown", function (e) {
  if (screen !== "fight") return;
  if (e.target.closest("#btns") || e.target.closest("#retreat")) return;
  ac();
  if (inStick(e.clientX, e.clientY) && stickId == null) {
    stickId = e.pointerId;
    moveStick(e);
  } else if (lookId == null && e.clientX > window.innerWidth * 0.28) {
    lookId = e.pointerId;
  }
}, true);
window.addEventListener("pointermove", function (e) {
  if (e.pointerId === stickId) moveStick(e);
  if (e.pointerId === lookId && !world.mechs[0].locked) {
    lookYaw -= e.movementX * 0.007;
    lookPitch = Math.max(-0.45, Math.min(0.7, lookPitch + e.movementY * 0.004));
  }
});
function endPtr(e) {
  if (e.pointerId === stickId) {
    stickId = null; stick.x = 0; stick.y = 0;
    knob.style.left = "39px"; knob.style.top = "39px";
  }
  if (e.pointerId === lookId) lookId = null;
}
window.addEventListener("pointerup", endPtr);
window.addEventListener("pointercancel", endPtr);
function moveStick(e) {
  const r = stickEl.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy;
  const mag = Math.hypot(dx, dy) || 1;
  const max = 40;
  const k = Math.min(max, mag);
  dx = dx / mag * k; dy = dy / mag * k;
  knob.style.left = (39 + dx) + "px";
  knob.style.top = (39 + dy) + "px";
  stick.x = dx / max;
  stick.y = -dy / max;
}

function readInput() {
  const now = {
    moveX: stick.x,
    moveY: stick.y,
    boost: !!held.boost,
    qb: !!held.qb,
    ab: !!held.ab,
    jump: !!held.jump,
    fire: !!held.fire,
    melee: !!held.melee,
    back: !!held.back && !prevHeld.back,
    swap: !!held.swap && !prevHeld.swap,
    lockToggle: !!held.lock && !prevHeld.lock,
    camYaw: lookYaw
  };
  prevHeld = Object.assign({}, held);
  return now;
}


const trail = [];
const trailLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff8a1e }));
scene.add(trailLine);
const demo = location.search.indexOf("auto=duel") >= 0;

const bulletGeo = new THREE.SphereGeometry(0.45, 6, 6);
const bulletMat = new THREE.MeshLambertMaterial({ color: 0xffd2a0, emissive: 0xff8a1e, emissiveIntensity: 0.8 });

function syncBullets() {
  while (bullets.length < world.projectiles.length) {
    const m = new THREE.Mesh(bulletGeo, bulletMat);
    scene.add(m);
    bullets.push(m);
  }
  for (let i = 0; i < bullets.length; i++) {
    const on = i < world.projectiles.length;
    bullets[i].visible = on;
    if (on) bullets[i].position.set(world.projectiles[i].pos.x, world.projectiles[i].pos.y, world.projectiles[i].pos.z);
  }
}

function hud() {
  const p = world.mechs[0];
  const spd = D.speedOf(p) * 3.6;
  document.getElementById("speedn").innerHTML = Math.round(spd) + "<small> km/h</small>";
  document.getElementById("apb").firstElementChild.style.width = (100 * p.ap / p.apMax) + "%";
  const en = document.getElementById("enb");
  en.classList.toggle("red", p.enDelay > 0);
  en.firstElementChild.style.width = (100 * p.en / p.stats.enCap) + "%";
  const foe = world.mechs.filter(function (m) { return m.team === 1 && m.alive; })[0];
  const st = document.getElementById("stb");
  if (foe && p.locked) {
    st.style.display = "block";
    st.firstElementChild.style.width = (100 * foe.impact / foe.impactMax) + "%";
  } else st.style.display = "none";
  const id = p.armIds[p.weapon % Math.max(1, p.armIds.length)];
  const wpn = id ? D.PARTS.weapons[id].name : "武装なし";
  const ammo = id && p.ammo[id] != null ? "  " + p.ammo[id] : "";
  document.getElementById("weapon").textContent = wpn + ammo;
  const ret = document.getElementById("reticle");
  ret.classList.toggle("lock", p.lock > 0.95);
  const scale = 1.15 - 0.45 * p.lock;
  ret.style.transform = "translate(-50%,-50%) scale(" + scale.toFixed(2) + ")";
  let label = p.ab ? "強襲" : p.boosting ? "ブースト" : "滑空";
  if (p.enDelay > 0) label = "出力停止";
  if (p.stun > 0) label = "よろけ";
  if (world.mode === "drill") label += "  ゲート " + (world.gate + 1) + "/" + world.gates.length;
  document.getElementById("state").textContent = label + "  " + Math.max(0, world.limit - world.time).toFixed(0) + "s";
  document.getElementById("speed").style.opacity = String(Math.max(0, Math.min(0.75, (D.speedOf(p) - 40) / 120)));
}

function pushTrail() {
  if (!world) return;
  const p = world.mechs[0];
  if (D.speedOf(p) > 25) trail.push(p.pos.x, p.pos.y, p.pos.z);
  while (trail.length > 48) trail.splice(0, 3);
  const arr = new Float32Array(trail);
  trailLine.geometry.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  trailLine.geometry.computeBoundingSphere();
  trailLine.visible = trail.length > 3;
}
function follow(dt) {
  const p = world.mechs[0];
  const foe = world.mechs.filter(function (m) { return m.team === 1 && m.alive; })[0];
  let yaw = p.locked && foe ? Math.atan2(foe.pos.x - p.pos.x, foe.pos.z - p.pos.z) : lookYaw;
  const dist = 18 + Math.min(14, D.speedOf(p) * 0.08);
  const sp = D.speedOf(p);
  camera.fov += ((62 + Math.min(16, sp / 8)) - camera.fov) * Math.min(1, dt * 4);
  camera.updateProjectionMatrix();
  const want = new THREE.Vector3(
    p.pos.x - Math.sin(yaw) * dist,
    p.pos.y + 4.2 + lookPitch * 4,
    p.pos.z - Math.cos(yaw) * dist
  );
  camera.position.lerp(want, 1 - Math.exp(-8 * dt));
  const look = new THREE.Vector3(p.pos.x, p.pos.y + 2.2, p.pos.z);
  if (p.locked && foe) look.lerp(new THREE.Vector3(foe.pos.x, foe.pos.y + 1.5, foe.pos.z), 0.35);
  if (shake > 0) {
    look.x += (Math.random() - 0.5) * shake;
    look.y += (Math.random() - 0.5) * shake;
    shake = Math.max(0, shake - dt * 1.4);
  }
  camera.lookAt(look);
  camera.rotation.z = -stick.x * (p.iframe > 0 ? 0.08 : 0.03);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (screen !== "fight" || !world) {
    preview.rotation.y += dt * 0.4;
    const a = preview.rotation.y;
    camera.position.set(Math.sin(a) * 16, 7, Math.cos(a) * 16);
    camera.lookAt(0, 3, 0);
    camera.fov = 58;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
    return;
  }
  acc += dt;
  const events = [];
  let redline = world.mechs[0].enDelay > 0;
  while (acc >= 1 / 60) {
    const input = readInput();
    D.step(world, { p: input }, 1 / 60);
    if (world.events) events.push.apply(events, world.events);
    acc -= 1 / 60;
    if (world.result) break;
  }
  if (!redline && world.mechs[0].enDelay > 0) tone(90, 0.25, "sawtooth", 0.06, 40);
  events.forEach(function (e) {
    if (e.type === "qb" && e.id === "p") { noise(0.12, 0.18, 900); tone(180, 0.09, "square", 0.04, 90); }
    if (e.type === "hit") { noise(0.08, 0.12, 300); shake = Math.max(shake, 0.4); }
    if (e.type === "gate") tone(660, 0.12, "square", 0.05, 990);
  });
  if (held.fire) noise(0.03, 0.03, 1400);
  world.mechs.forEach(function (m) {
    const rec = meshes.filter(function (x) { return x.id === m.id; })[0];
    if (!rec) return;
    rec.mesh.position.set(m.pos.x, m.pos.y - 3.1, m.pos.z);
    rec.mesh.rotation.y = m.yaw;
    const forward = m.vel.x * Math.sin(m.yaw) + m.vel.z * Math.cos(m.yaw);
    const side = m.vel.x * Math.cos(m.yaw) - m.vel.z * Math.sin(m.yaw);
    rec.mesh.rotation.x = Math.max(-0.35, Math.min(0.35, -forward * 0.004));
    rec.mesh.rotation.z = Math.max(-0.4, Math.min(0.4, side * 0.005));
    rec.mesh.userData.hot.emissiveIntensity = m.ab ? 2.2 : m.boosting ? 1.1 : 0.2;
    rec.mesh.visible = m.alive || m.ap > 0;
  });
  syncBullets();
  if (demo) { held.boost = true; stick.y = 1; held.fire = true; }
  pushTrail();
  hud();
  follow(dt);
  const hit = events.some(function (e) { return e.type === "hit" && e.id === "p"; });
  document.getElementById("vignette").style.boxShadow = hit ? "inset 0 0 90px 16px rgba(180,30,20,.55)" : "inset 0 0 80px 10px rgba(0,0,0,0)";
  renderer.render(scene, camera);
  if (world && world.result) finish();
  requestAnimationFrame(frame);
}

document.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
showPreview();
setScreen("home");
if (demo) setTimeout(function () { startMatch("duel"); }, 300);
requestAnimationFrame(frame);
