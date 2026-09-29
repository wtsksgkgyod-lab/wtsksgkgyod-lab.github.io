(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Danku = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PARTS = {
    legs: {
      ruin: { name: "ルイン", kind: "biped", mass: 3400, limit: 9800, ap: 3200, def: 1, accel: 150, jump: 16, grav: 26, turn: 2.35, hover: false },
      slat: { name: "スラット", kind: "reverse", mass: 2500, limit: 7600, ap: 2400, def: 0.82, accel: 175, jump: 28, grav: 24, turn: 2.7, hover: false, qbMul: 1.22 },
      haze: { name: "ヘイズ", kind: "hover", mass: 2900, limit: 8600, ap: 2700, def: 0.9, accel: 145, jump: 6, grav: 7, turn: 1.65, hover: true },
      carrier: { name: "キャリア", kind: "heavy", mass: 5200, limit: 14000, ap: 4800, def: 1.38, accel: 118, jump: 11, grav: 30, turn: 1.45, hover: false, aim: 1.35 }
    },
    boosters: {
      agito: { name: "アギト", mass: 820, qb: 78, qbEn: 16, qbCd: 0.48, ab: 118, abDrain: 34, thrust: 1.18 },
      nagl: { name: "ナグル", mass: 1100, qb: 52, qbEn: 18, qbCd: 0.7, ab: 146, abDrain: 42, thrust: 1.05 },
      nagi: { name: "ナギ", mass: 740, qb: 60, qbEn: 11, qbCd: 0.58, ab: 108, abDrain: 20, thrust: 1 }
    },
    gens: {
      flash: { name: "瞬発炉", mass: 640, en: 210, regen: 52, delay: 0.72 },
      sustain: { name: "持続炉", mass: 1280, en: 460, regen: 24, delay: 1.55 },
      balance: { name: "均衡炉", mass: 900, en: 320, regen: 34, delay: 1.05 }
    },
    fcs: {
      close: { name: "近接照準", mass: 180, lockTime: 0.32, lockRange: 190, missile: 0.65 },
      missile: { name: "斉射照準", mass: 260, lockTime: 0.62, lockRange: 320, missile: 1.45 },
      mid: { name: "中距照準", mass: 210, lockTime: 0.45, lockRange: 250, missile: 1 }
    },
    heads: {
      precision: { name: "精度頭", mass: 240, ap: 420, lock: 0.82 },
      durable: { name: "耐久頭", mass: 460, ap: 980, lock: 1.05 },
      light: { name: "軽量頭", mass: 130, ap: 340, lock: 0.94 }
    },
    cores: {
      light: { name: "軽量胴", mass: 1280, ap: 1900, def: 0.9, shear: 0 },
      shear: { name: "剪断胴", mass: 1760, ap: 2500, def: 1, shear: 1100 },
      heavy: { name: "重装胴", mass: 2600, ap: 3600, def: 1.28, shear: 0 }
    },
    arms: {
      firearm: { name: "射撃腕", mass: 980, fire: 1.28, melee: 0.78, spread: 0.78 },
      melee: { name: "格闘腕", mass: 1100, fire: 0.82, melee: 1.4, spread: 1.12 },
      balance: { name: "均衡腕", mass: 900, fire: 1, melee: 1, spread: 1 }
    },
    weapons: {
      rifle: { name: "連装ライフル", slot: "arm", mass: 420, dmg: 42, impact: 9, speed: 340, radius: 0.7, cd: 0.16, ammo: 180, spread: 0.012, rangeLife: 1.15 },
      linear: { name: "リニアカノン", slot: "arm", mass: 980, dmg: 150, impact: 28, speed: 190, radius: 0.9, cd: 0.85, ammo: 28, spread: 0.004, rangeLife: 1.6 },
      pulse: { name: "パルス機銃", slot: "arm", mass: 360, dmg: 16, impact: 4, shear: 28, speed: 280, radius: 0.55, cd: 0.07, ammo: 320, spread: 0.02, rangeLife: 0.55 },
      blade: { name: "レーザーブレード", slot: "arm", mass: 340, dmg: 130, impact: 36, cd: 0.55, en: 14, reach: 13, melee: true },
      pile: { name: "パイル", slot: "arm", mass: 520, dmg: 240, impact: 22, cd: 0.9, en: 10, reach: 8.5, melee: true, stunBonus: 1.7 },
      missile: { name: "ミサイルポッド", slot: "back", mass: 860, dmg: 28, impact: 7, speed: 95, radius: 1.1, cd: 0.45, ammo: 48, volley: 4, homing: 2.2, life: 3.2 },
      scatter: { name: "拡散ミサイル", slot: "back", mass: 720, dmg: 18, impact: 4, speed: 80, radius: 0.9, cd: 0.7, ammo: 36, volley: 6, homing: 0.6, life: 2.4, cone: 0.35 },
      plasma: { name: "プラズマ砲", slot: "back", mass: 1400, dmg: 210, impact: 34, speed: 70, radius: 2.4, cd: 1.7, ammo: 12, life: 3.5, blast: 14 },
      none: { name: "なし", slot: "any", mass: 0, empty: true }
    }
  };

  const PRESETS = {
    light: {
      name: "軽翼",
      legs: "slat", boost: "agito", gen: "flash", fcs: "close", head: "light", core: "light", arms: "melee",
      rArm: "rifle", lArm: "blade", rBack: "none", lBack: "none", tuning: -0.85
    },
    mid: {
      name: "中核",
      legs: "ruin", boost: "nagi", gen: "balance", fcs: "mid", head: "precision", core: "shear", arms: "balance",
      rArm: "rifle", lArm: "pulse", rBack: "missile", lBack: "none", tuning: 0
    },
    heavy: {
      name: "重砲",
      legs: "carrier", boost: "nagl", gen: "sustain", fcs: "missile", head: "durable", core: "heavy", arms: "firearm",
      rArm: "linear", lArm: "rifle", rBack: "plasma", lBack: "scatter", tuning: 0.85
    }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function weightOf(loadout) {
    const L = PARTS.legs[loadout.legs];
    const ids = [loadout.boost, loadout.gen, loadout.fcs, loadout.head, loadout.core, loadout.arms, loadout.rArm, loadout.lArm, loadout.rBack, loadout.lBack];
    const tables = [PARTS.boosters, PARTS.gens, PARTS.fcs, PARTS.heads, PARTS.cores, PARTS.arms, PARTS.weapons, PARTS.weapons, PARTS.weapons, PARTS.weapons];
    let carried = 0;
    for (let i = 0; i < ids.length; i++) carried += tables[i][ids[i]].mass;
    return { carried, limit: L.limit, mass: L.mass + carried, leg: L };
  }

  function slotOk(id, slot) {
    const w = PARTS.weapons[id];
    if (!w) return false;
    if (w.empty) return true;
    return w.slot === slot;
  }

  function validate(loadout) {
    if (!PARTS.legs[loadout.legs]) return { ok: false, reason: "脚部がない" };
    const w = weightOf(loadout);
    if (!slotOk(loadout.rArm, "arm") || !slotOk(loadout.lArm, "arm")) return { ok: false, reason: "腕武装が不正", weight: w };
    if (!slotOk(loadout.rBack, "back") || !slotOk(loadout.lBack, "back")) return { ok: false, reason: "背中武装が不正", weight: w };
    if (w.carried > w.limit) return { ok: false, reason: "積載オーバー", weight: w };
    return { ok: true, weight: w };
  }

  function derived(loadout) {
    const v = validate(loadout);
    const w = v.weight || weightOf(loadout);
    const leg = PARTS.legs[loadout.legs];
    const b = PARTS.boosters[loadout.boost];
    const g = PARTS.gens[loadout.gen];
    const f = PARTS.fcs[loadout.fcs];
    const h = PARTS.heads[loadout.head];
    const c = PARTS.cores[loadout.core];
    const a = PARTS.arms[loadout.arms];
    const tuning = Math.max(-1, Math.min(1, loadout.tuning || 0));
    const ref = 7600;
    const accelBoost = leg.accel * b.thrust * (ref / w.mass);
    const turnBase = leg.turn * (1 - 0.28 * tuning);
    const spread = a.spread * (1 - 0.4 * tuning) * (leg.aim ? 1 / leg.aim : 1);
    return {
      mass: w.mass,
      carried: w.carried,
      limit: w.limit,
      ok: v.ok,
      accelBoost,
      dragBoost: 1.55,
      dragCoast: 0.42,
      qbImpulse: b.qb * (leg.qbMul || 1),
      qbEn: b.qbEn,
      qbCd: b.qbCd,
      abSpeed: b.ab,
      abDrain: b.abDrain,
      thrustMul: b.thrust,
      enCap: g.en,
      enRegen: g.regen,
      enDelay: g.delay,
      grav: leg.grav,
      jump: leg.jump,
      hover: !!leg.hover,
      turnAt: function (speed) { return turnBase / (1 + Math.abs(speed) / 78); },
      ap: Math.round((leg.ap + h.ap + c.ap) * ((leg.def + c.def) / 2)),
      def: (leg.def + c.def) / 2,
      fire: a.fire,
      melee: a.melee,
      spread: Math.max(0.002, spread),
      lockTime: f.lockTime * h.lock,
      lockRange: f.lockRange,
      missile: f.missile,
      shear: c.shear,
      tuning
    };
  }

  function v3(x, y, z) { return { x: x || 0, y: y || 0, z: z || 0 }; }
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
  function mul(a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; }
  function len(a) { return Math.hypot(a.x, a.y, a.z); }
  function hlen(a) { return Math.hypot(a.x, a.z); }
  function norm(a) { const l = len(a) || 1; return mul(a, 1 / l); }
  function hnorm(a) { const l = Math.hypot(a.x, a.z) || 1; return { x: a.x / l, y: 0, z: a.z / l }; }

  function flatYaw(yaw, x, z) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    return { x: x * c + z * s, y: 0, z: -x * s + z * c };
  }

  function armWeapons(loadout) {
    return [loadout.rArm, loadout.lArm].filter(function (id) {
      const w = PARTS.weapons[id];
      return w && !w.empty;
    });
  }

  function makeMech(id, loadout, pos, team, aiName) {
    const d = derived(loadout);
    const arms = armWeapons(loadout);
    return {
      id: id,
      name: aiName || "自機",
      team: team,
      ai: !!aiName,
      loadout: clone(loadout),
      stats: d,
      pos: v3(pos.x, pos.y == null ? 3.2 : pos.y, pos.z),
      vel: v3(),
      yaw: pos.yaw || 0,
      wishYaw: pos.yaw || 0,
      en: d.enCap,
      enDelay: 0,
      ap: d.ap,
      apMax: d.ap,
      impact: 0,
      impactMax: 100,
      stun: 0,
      shear: d.shear,
      shearMax: d.shear,
      shearCd: 0,
      qbCd: 0,
      iframe: 0,
      boosting: false,
      ab: false,
      alive: true,
      weapon: 0,
      armIds: arms,
      cds: {},
      ammo: ammoMap(loadout),
      qbCount: 0,
      damageDealt: 0,
      lock: 0,
      locked: false,
      aiMem: { react: 0, strafe: 1 },
      radius: 2.3
    };
  }

  function ammoMap(loadout) {
    const ammo = {};
    [loadout.rArm, loadout.lArm, loadout.rBack, loadout.lBack].forEach(function (id) {
      const w = PARTS.weapons[id];
      if (w && !w.empty && w.ammo) ammo[id] = w.ammo;
    });
    return ammo;
  }

  function obstacles() {
    return [
      { min: { x: -40, y: 0, z: -30 }, max: { x: -18, y: 28, z: -8 } },
      { min: { x: 30, y: 0, z: 20 }, max: { x: 58, y: 46, z: 48 } },
      { min: { x: -80, y: 0, z: 70 }, max: { x: -48, y: 18, z: 96 } },
      { min: { x: 90, y: 0, z: -110 }, max: { x: 130, y: 36, z: -70 } },
      { min: { x: -160, y: 0, z: -20 }, max: { x: -130, y: 22, z: 24 } },
      { min: { x: 10, y: 0, z: -160 }, max: { x: 40, y: 60, z: -132 } }
    ];
  }

  function terrainY(x, z) {
    return Math.sin(x * 0.01) * 4 + Math.cos(z * 0.013) * 3;
  }

  function createMatch(opts) {
    opts = opts || {};
    const mode = opts.mode || "duel";
    const loadout = opts.loadout || PRESETS.mid;
    const player = makeMech("p", loadout, { x: 0, y: 4, z: 40, yaw: Math.PI }, 0, null);
    const mechs = [player];
    if (mode === "duel") {
      const enemyLoad = PRESETS[opts.enemy || "mid"];
      mechs.push(makeMech("e0", enemyLoad, { x: 0, y: 8, z: -80, yaw: 0 }, 1, enemyLoad.name));
    } else if (mode === "sweep") {
      ["light", "mid", "heavy"].forEach(function (key, i) {
        const L = PRESETS[key];
        mechs.push(makeMech("e" + i, L, { x: -40 + i * 40, y: 8, z: -90 - i * 20, yaw: 0 }, 1, L.name));
      });
    }
    const gates = [];
    if (mode === "drill") {
      const pts = [[0, 0], [40, -30], [70, 10], [20, 50], [-30, 20], [0, -10]];
      pts.forEach(function (p, i) {
        gates.push({ x: p[0], z: p[1], y: 8 + (i % 2) * 10, r: 9, i: i });
      });
    }
    return {
      mode: mode,
      time: 0,
      limit: mode === "drill" ? 90 : 180,
      mechs: mechs,
      projectiles: [],
      obstacles: obstacles(),
      gates: gates,
      gate: 0,
      result: null,
      events: [],
      bounds: 280
    };
  }

  function speedOf(m) { return hlen(m.vel); }

  function spendEn(m, amount) {
    if (m.enDelay > 0) return false;
    if (m.en <= 0) return false;
    if (m.en < amount) {
      m.en = 0;
      m.enDelay = m.stats.enDelay;
      m.boosting = false;
      m.ab = false;
      return false;
    }
    m.en -= amount;
    if (m.en <= 0) {
      m.en = 0;
      m.enDelay = m.stats.enDelay;
      m.boosting = false;
      m.ab = false;
    }
    return true;
  }

  function tickEn(m, dt, draining) {
    if (m.enDelay > 0) {
      m.enDelay = Math.max(0, m.enDelay - dt);
      return;
    }
    if (!draining) m.en = Math.min(m.stats.enCap, m.en + m.stats.enRegen * dt);
  }

  function collide(pos, vel, radius) {
    const boxes = obstacles();
    for (let n = 0; n < boxes.length; n++) {
      const b = boxes[n];
      const cx = Math.max(b.min.x, Math.min(pos.x, b.max.x));
      const cy = Math.max(b.min.y, Math.min(pos.y, b.max.y));
      const cz = Math.max(b.min.z, Math.min(pos.z, b.max.z));
      const dx = pos.x - cx, dy = pos.y - cy, dz = pos.z - cz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < radius * radius && d2 > 1e-8) {
        const d = Math.sqrt(d2) || 1;
        const push = (radius - d) / d;
        pos.x += dx * push; pos.y += dy * push; pos.z += dz * push;
        const nx = dx / d, ny = dy / d, nz = dz / d;
        const vn = vel.x * nx + vel.y * ny + vel.z * nz;
        if (vn < 0) { vel.x -= vn * nx; vel.y -= vn * ny; vel.z -= vn * nz; }
      }
    }
    const gy = terrainY(pos.x, pos.z) + 3.1;
    if (pos.y < gy) {
      pos.y = gy;
      if (vel.y < 0) vel.y = 0;
    }
    const B = 280;
    pos.x = Math.max(-B, Math.min(B, pos.x));
    pos.z = Math.max(-B, Math.min(B, pos.z));
    if (pos.y > 90) { pos.y = 90; if (vel.y > 0) vel.y = 0; }
  }

  function nearestEnemy(world, m) {
    let best = null, bd = 1e9;
    for (let i = 0; i < world.mechs.length; i++) {
      const o = world.mechs[i];
      if (!o.alive || o.team === m.team) continue;
      const d = len(sub(o.pos, m.pos));
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  function aiInput(m, world) {
    const t = nearestEnemy(world, m);
    const inp = { moveX: 0, moveY: 0, boost: false, qb: false, ab: false, jump: false, fire: false, melee: false, camYaw: m.yaw, lock: true, swap: false };
    if (!t) return inp;
    const to = sub(t.pos, m.pos);
    const dist = len(to);
    inp.camYaw = Math.atan2(to.x, to.z);
    const low = m.enDelay > 0 || m.en < m.stats.enCap * 0.18;
    if (low) {
      inp.moveY = -1;
      inp.boost = m.en > 8 && m.enDelay <= 0;
      return inp;
    }
    if (m.aiMem.react > 0) {
      inp.qb = true;
      inp.moveX = m.aiMem.strafe;
      m.aiMem.react = 0;
    }
    if (dist < 16) {
      inp.melee = true;
      inp.moveY = 0.2;
      inp.boost = true;
    } else if (dist > 55) {
      inp.ab = true;
      inp.moveY = 1;
      inp.boost = true;
    } else {
      inp.moveX = m.aiMem.strafe;
      inp.moveY = 0.15;
      inp.boost = true;
      inp.fire = true;
      if (Math.sin(world.time * 0.7 + m.pos.x) > 0.92) m.aiMem.strafe *= -1;
    }
    if (dist > 25 && m.pos.y < t.pos.y - 4) inp.jump = true;
    return inp;
  }

  function notePlayerShot(world, shooter) {
    if (shooter.team !== 0) return;
    for (let i = 0; i < world.mechs.length; i++) {
      const m = world.mechs[i];
      if (m.ai && m.alive) m.aiMem.react = 0.22;
    }
  }

  function activeArm(m) {
    if (!m.armIds.length) return null;
    m.weapon = ((m.weapon % m.armIds.length) + m.armIds.length) % m.armIds.length;
    return m.armIds[m.weapon];
  }

  function spawnBullet(world, m, spec, dir, extra) {
    const life = spec.rangeLife || spec.life || 1.2;
    world.projectiles.push({
      pos: add(m.pos, { x: dir.x * 3, y: 0.4, z: dir.z * 3 }),
      vel: mul(dir, spec.speed),
      owner: m.id,
      team: m.team,
      dmg: spec.dmg * m.stats.fire * (extra || 1),
      impact: spec.impact,
      shear: spec.shear || 0,
      radius: spec.radius,
      life: life,
      homing: (spec.homing || 0) * m.stats.missile,
      blast: spec.blast || 0
    });
  }

  function tryFire(world, m) {
    const id = activeArm(m);
    if (!id) return false;
    const spec = PARTS.weapons[id];
    if (!spec || spec.melee || spec.empty) return false;
    const cd = m.cds[id] || 0;
    if (cd > 0) return false;
    if (m.ammo[id] != null && m.ammo[id] <= 0) return false;
    const originYaw = m.yaw;
    const spread = m.stats.spread * (m.ab ? 2.4 : 1);
    const jitter = (Math.sin(world.time * 17.2 + m.pos.x) * 0.5) * spread;
    const dir = hnorm(flatYaw(originYaw + jitter, 0, 1));
    dir.y = Math.max(-0.2, Math.min(0.35, (m.wishPitch || 0)));
    spawnBullet(world, m, spec, norm(dir), 1);
    m.cds[id] = spec.cd;
    if (m.ammo[id] != null) m.ammo[id] -= 1;
    notePlayerShot(world, m);
    return true;
  }

  function tryBack(world, m, id) {
    const spec = PARTS.weapons[id];
    if (!spec || spec.empty || spec.slot !== "back") return;
    const cd = m.cds[id] || 0;
    if (cd > 0) return;
    if (m.ammo[id] != null && m.ammo[id] <= 0) return;
    const n = spec.volley || 1;
    if (m.ammo[id] != null && m.ammo[id] < 1) return;
    for (let i = 0; i < n; i++) {
      if (m.ammo[id] != null && m.ammo[id] <= 0) break;
      const cone = spec.cone || 0.08;
      const ang = m.yaw + (i - (n - 1) / 2) * cone;
      const dir = norm({ x: Math.sin(ang), y: 0.18, z: Math.cos(ang) });
      spawnBullet(world, m, spec, dir, 1);
      if (m.ammo[id] != null) m.ammo[id] -= 1;
    }
    m.cds[id] = spec.cd;
    notePlayerShot(world, m);
  }

  function tryBlade(world, m) {
    const id = activeArm(m);
    const spec = id && PARTS.weapons[id];
    if (!spec || !spec.melee) return { ok: false, reason: "no-melee" };
    if ((m.cds[id] || 0) > 0) return { ok: false, reason: "cd" };
    if (!spendEn(m, spec.en || 0)) return { ok: false, reason: "en" };
    m.cds[id] = spec.cd;
    const reach = spec.reach;
    let hit = null;
    for (let i = 0; i < world.mechs.length; i++) {
      const o = world.mechs[i];
      if (!o.alive || o.team === m.team) continue;
      const d = sub(o.pos, m.pos);
      const dist = len(d);
      if (dist > reach + o.radius) continue;
      const forward = { x: Math.sin(m.yaw), y: 0, z: Math.cos(m.yaw) };
      const flat = hnorm(d);
      const dot = flat.x * forward.x + flat.z * forward.z;
      if (dot < 0.15 && dist > 4) continue;
      hit = o;
      break;
    }
    if (hit) {
      const bonus = (spec.stunBonus && hit.stun > 0) ? spec.stunBonus : 1;
      const dmg = spec.dmg * m.stats.melee * bonus;
      applyHit(hit, { dmg: dmg, impact: spec.impact, shear: 0 }, m);
      m.vel.x += Math.sin(m.yaw) * 18;
      m.vel.z += Math.cos(m.yaw) * 18;
      return { ok: true, hit: true, target: hit.id };
    }
    m.vel.x += Math.sin(m.yaw) * 22;
    m.vel.z += Math.cos(m.yaw) * 22;
    return { ok: true, hit: false };
  }

  function applyHit(target, hit, attacker) {
    if (!target.alive) return;
    if (target.iframe > 0 && !hit.meleeForce) return;
    let dmg = hit.dmg;
    if (target.shear > 0 && target.shearMax > 0) {
      const absorb = Math.min(target.shear, dmg * 0.65 + (hit.shear || 0));
      target.shear -= absorb;
      dmg *= 0.55;
      if (target.shear <= 0) {
        target.shear = 0;
        target.shearCd = 8;
      }
    }
    if (target.stun > 0) dmg *= 1.8;
    dmg = dmg / Math.max(0.55, target.stats.def);
    target.ap -= dmg;
    target.impact += hit.impact || 0;
    if (target.impact >= target.impactMax && target.stun <= 0) {
      target.impact = 0;
      target.stun = 1.1;
      target.ap -= dmg * 0.25;
    }
    if (attacker) attacker.damageDealt += dmg;
    if (target.ap <= 0) {
      target.ap = 0;
      target.alive = false;
    }
  }

  function integrate(world, m, input, dt) {
    const s = m.stats;
    m.qbCd = Math.max(0, m.qbCd - dt);
    m.iframe = Math.max(0, m.iframe - dt);
    m.stun = Math.max(0, m.stun - dt);
    if (m.shearMax > 0) {
      if (m.shear <= 0 && m.shearCd > 0) {
        m.shearCd -= dt;
        if (m.shearCd <= 0) m.shear = m.shearMax;
      }
    }
    Object.keys(m.cds).forEach(function (k) { m.cds[k] = Math.max(0, m.cds[k] - dt); });
    if (m.aiMem.react > 0 && input.qb) {
      /* consumed by caller timing */
    }
    if (m.ai && m.aiMem.react > 0) {
      m.aiMem.react -= dt;
    }

    if (input.swap) m.weapon += 1;
    if (input.lockToggle) m.locked = !m.locked;
    if (input.lock) m.locked = true;

    const enemy = nearestEnemy(world, m);
    if (m.locked && enemy) {
      const to = sub(enemy.pos, m.pos);
      const dist = len(to);
      m.wishYaw = Math.atan2(to.x, to.z);
      if (dist < s.lockRange) m.lock = Math.min(1, m.lock + dt / Math.max(0.15, s.lockTime));
      else { m.lock = Math.max(0, m.lock - dt); }
    } else if (!m.ai) {
      m.wishYaw = input.camYaw != null ? input.camYaw : m.yaw;
      m.lock = 0;
    }

    const turnSpeed = s.turnAt(speedOf(m)) * (m.stun > 0 ? 0.25 : 1);
    let dyaw = m.wishYaw - m.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    const maxStep = turnSpeed * dt;
    if (Math.abs(dyaw) < maxStep) m.yaw = m.wishYaw;
    else m.yaw += Math.sign(dyaw) * maxStep;

    const mx = input.moveX || 0;
    const my = input.moveY || 0;
    const wish = flatYaw(m.locked || m.ai ? m.yaw : (input.camYaw != null ? input.camYaw : m.yaw), mx, my);
    const wishN = (Math.abs(mx) + Math.abs(my) > 0.05) ? hnorm(wish) : hnorm({ x: Math.sin(m.yaw), z: Math.cos(m.yaw) });

    let draining = false;
    m.boosting = false;
    m.ab = false;
    const canBoost = m.enDelay <= 0 && m.en > 0 && m.stun <= 0;

    if (input.qb && canBoost && m.qbCd <= 0) {
      const dir = (Math.abs(mx) + Math.abs(my) > 0.2) ? wishN : hnorm({ x: Math.sin(m.yaw), z: Math.cos(m.yaw) });
      if (spendEn(m, s.qbEn)) {
        m.vel.x += dir.x * s.qbImpulse;
        m.vel.z += dir.z * s.qbImpulse;
        m.qbCd = s.qbCd;
        m.iframe = 0.12;
        m.qbCount += 1;
        world.events.push({ type: "qb", id: m.id });
      }
    }

    if (input.ab && canBoost && m.enDelay <= 0) {
      const forward = { x: Math.sin(m.yaw), y: 0, z: Math.cos(m.yaw) };
      const want = s.abSpeed;
      const hv = hlen(m.vel);
      const accel = s.accelBoost * 1.35;
      if (hv < want) {
        m.vel.x += forward.x * accel * dt;
        m.vel.z += forward.z * accel * dt;
      }
      if (spendEn(m, s.abDrain * dt)) {
        m.ab = true;
        draining = true;
        m.boosting = true;
      }
    } else if (input.boost && canBoost) {
      const rate = (Math.abs(mx) + Math.abs(my) > 0.05) ? wishN : hnorm({ x: Math.sin(m.yaw), z: Math.cos(m.yaw) });
      m.vel.x += rate.x * s.accelBoost * dt;
      m.vel.z += rate.z * s.accelBoost * dt;
      const drain = 22 * dt;
      if (spendEn(m, drain)) { m.boosting = true; draining = true; }
    }

    const drag = (m.boosting ? s.dragBoost : s.dragCoast);
    const damp = Math.exp(-drag * dt);
    m.vel.x *= damp;
    m.vel.z *= damp;

    if (input.jump && canBoost && m.vel.y < s.jump) {
      if (spendEn(m, 8 * dt + 0.01)) {
        m.vel.y += s.jump * (s.hover ? 0.35 : 1) * Math.min(1, dt * 8);
        draining = true;
      }
    }

    if (s.hover && m.boosting) {
      const target = 8 + Math.sin(world.time * 2) * 0.4;
      m.vel.y += (target - (m.pos.y - terrainY(m.pos.x, m.pos.z))) * 1.6 * dt;
      m.vel.y *= Math.exp(-1.4 * dt);
    } else {
      m.vel.y -= s.grav * dt;
    }

    if (m.stun > 0) {
      m.vel.x *= Math.exp(-2.2 * dt);
      m.vel.z *= Math.exp(-2.2 * dt);
    }

    m.pos.x += m.vel.x * dt;
    m.pos.y += m.vel.y * dt;
    m.pos.z += m.vel.z * dt;
    collide(m.pos, m.vel, m.radius);

    if (m.ab) {
      for (let i = 0; i < world.mechs.length; i++) {
        const o = world.mechs[i];
        if (!o.alive || o.team === m.team) continue;
        if (len(sub(o.pos, m.pos)) < m.radius + o.radius + 0.4) {
          applyHit(o, { dmg: 70 * dt * 8, impact: 40 * dt * 4 }, m);
        }
      }
    }

    tickEn(m, dt, draining);

    if (input.fire) tryFire(world, m);
    if (input.melee) tryBlade(world, m);
    if (input.back) {
      tryBack(world, m, m.loadout.rBack);
      tryBack(world, m, m.loadout.lBack);
    }
  }

  function stepProjectiles(world, dt) {
    const next = [];
    for (let i = 0; i < world.projectiles.length; i++) {
      const p = world.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      if (p.homing > 0) {
        let best = null, bd = 1e9;
        for (let j = 0; j < world.mechs.length; j++) {
          const m = world.mechs[j];
          if (!m.alive || m.team === p.team) continue;
          const d = len(sub(m.pos, p.pos));
          if (d < bd) { bd = d; best = m; }
        }
        if (best) {
          const want = norm(sub(best.pos, p.pos));
          const sp = len(p.vel) || 1;
          p.vel = norm(add(norm(p.vel), mul(want, p.homing * dt)));
          p.vel = mul(p.vel, sp);
        }
      }
      p.pos = add(p.pos, mul(p.vel, dt));
      let dead = false;
      for (let j = 0; j < world.mechs.length; j++) {
        const m = world.mechs[j];
        if (!m.alive || m.team === p.team) continue;
        if (len(sub(m.pos, p.pos)) <= m.radius + p.radius) {
          const owner = world.mechs.filter(function (x) { return x.id === p.owner; })[0];
          applyHit(m, p, owner);
          if (p.blast) {
            for (let k = 0; k < world.mechs.length; k++) {
              const o = world.mechs[k];
              if (!o.alive || o.id === m.id || o.team === p.team) continue;
              if (len(sub(o.pos, p.pos)) < p.blast) applyHit(o, { dmg: p.dmg * 0.4, impact: p.impact * 0.4, shear: 0 }, owner);
            }
          }
          dead = true;
          world.events.push({ type: "hit", id: m.id });
          break;
        }
      }
      if (!dead) next.push(p);
    }
    world.projectiles = next;
  }

  function checkEnd(world) {
    if (world.result) return;
    const player = world.mechs[0];
    if (world.mode === "drill") {
      const g = world.gates[world.gate];
      if (g && Math.hypot(player.pos.x - g.x, player.pos.y - g.y, player.pos.z - g.z) < g.r) {
        world.gate += 1;
        world.events.push({ type: "gate", i: world.gate });
      }
      if (world.gate >= world.gates.length) world.result = { win: true, reason: "clear", time: world.time };
      else if (world.time >= world.limit) world.result = { win: false, reason: "time", time: world.time };
      return;
    }
    const foes = world.mechs.filter(function (m) { return m.team === 1; });
    const foesUp = foes.filter(function (m) { return m.alive; });
    if (!player.alive) world.result = { win: false, reason: "down", time: world.time };
    else if (!foesUp.length && foes.length) world.result = { win: true, reason: "clear", time: world.time };
    else if (world.time >= world.limit) {
      const foeAp = foes.reduce(function (s, m) { return s + m.ap / m.apMax; }, 0) / foes.length;
      const pAp = player.ap / player.apMax;
      world.result = { win: pAp >= foeAp, reason: "time", time: world.time, draw: Math.abs(pAp - foeAp) < 0.02 };
    }
  }

  function step(world, inputs, dt) {
    if (world.result) return world;
    dt = Math.max(0.001, Math.min(dt || 0.016, 0.05));
    world.time += dt;
    world.events = [];
    const map = inputs || {};
    for (let i = 0; i < world.mechs.length; i++) {
      const m = world.mechs[i];
      if (!m.alive) continue;
      let input;
      if (m.ai) {
        if (m.aiMem.react > 0) {
          m.aiMem._acc = (m.aiMem._acc || 0) + dt;
        }
        input = aiInput(m, world);
        if (m.aiMem.react > 0 && m.aiMem._acc < 0.18) input.qb = false;
      } else input = map[m.id] || {};
      integrate(world, m, input, dt);
    }
    stepProjectiles(world, dt);
    checkEnd(world);
    return world;
  }

  function finiteMech(m) {
    const nums = [m.pos.x, m.pos.y, m.pos.z, m.vel.x, m.vel.y, m.vel.z, m.yaw, m.en, m.ap];
    for (let i = 0; i < nums.length; i++) if (!Number.isFinite(nums[i])) return false;
    return true;
  }

  return {
    PARTS: PARTS,
    PRESETS: PRESETS,
    validate: validate,
    derived: derived,
    weightOf: weightOf,
    createMatch: createMatch,
    step: step,
    tryBlade: function (world, id) {
      const m = world.mechs.filter(function (x) { return x.id === id; })[0];
      return tryBlade(world, m);
    },
    applyHit: applyHit,
    speedOf: speedOf,
    makeMech: makeMech,
    finiteMech: finiteMech,
    armWeapons: armWeapons
  };
});
