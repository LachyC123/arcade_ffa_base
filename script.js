const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* ================= CORE DATA ================= */

const WEAPONS = {
  pistol: {
    fireRate: 350,
    speed: 7,
    damage: 34
  }
};

class Player {
  constructor(id, x, y, isHuman = false) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.r = 16;
    this.hp = 100;
    this.kills = 0;
    this.isHuman = isHuman;
    this.weapon = WEAPONS.pistol;
    this.dead = false;
    this.invuln = 0;
    this.target = null;
    this.lastShot = 0;
  }

  respawn() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.hp = 100;
    this.dead = false;
    this.invuln = 120;
  }
}

/* ================= GAME STATE ================= */

const players = [];
players.push(new Player("You", canvas.width/2, canvas.height/2, true));

for (let i = 1; i <= 3; i++) {
  players.push(new Player("AI-" + i, Math.random()*canvas.width, Math.random()*canvas.height));
}

let bullets = [];
let touch = null;

/* ================= INPUT ================= */

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  touch = { x: t.clientX, y: t.clientY };
});
canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  touch = { x: t.clientX, y: t.clientY };
});
canvas.addEventListener("touchend", () => touch = null);

/* ================= HELPERS ================= */

function shoot(shooter, tx, ty) {
  const now = Date.now();
  if (now - shooter.lastShot < shooter.weapon.fireRate) return;
  shooter.lastShot = now;

  const a = Math.atan2(ty - shooter.y, tx - shooter.x);
  bullets.push({
    x: shooter.x,
    y: shooter.y,
    dx: Math.cos(a) * shooter.weapon.speed,
    dy: Math.sin(a) * shooter.weapon.speed,
    owner: shooter
  });
}

function killFeed(killer, victim) {
  const el = document.createElement("div");
  el.className = "kill";
  el.textContent = `${killer.id} eliminated ${victim.id}`;
  document.getElementById("killfeed").prepend(el);
  setTimeout(() => el.remove(), 4000);
}

/* ================= UPDATE ================= */

function updatePlayer(p) {
  if (p.dead) return;

  if (p.invuln > 0) p.invuln--;

  if (p.isHuman && touch) {
    const dx = touch.x - p.x;
    const dy = touch.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 20) {
      p.x += dx / d * 4;
      p.y += dy / d * 4;
    }
    shoot(p, touch.x, touch.y);
  }

  if (!p.isHuman) {
    const targets = players.filter(t => t !== p && !t.dead);
    p.target = targets[Math.floor(Math.random() * targets.length)];
    if (!p.target) return;

    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const d = Math.hypot(dx, dy);
    p.x += dx / d * 1.8;
    p.y += dy / d * 1.8;

    shoot(p, p.target.x, p.target.y);
  }
}

function update() {
  players.forEach(updatePlayer);

  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;

    players.forEach(p => {
      if (p.dead || p === b.owner || p.invuln > 0) return;
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.r) {
        p.hp -= b.owner.weapon.damage;
        b.dead = true;
        if (p.hp <= 0) {
          p.dead = true;
          b.owner.kills++;
          killFeed(b.owner, p);
          setTimeout(() => p.respawn(), 2000);
        }
      }
    });
  });

  bullets = bullets.filter(b => !b.dead);
}

/* ================= DRAW ================= */

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  players.forEach(p => {
    if (p.dead) return;
    ctx.globalAlpha = p.invuln > 0 ? 0.5 : 1;
    ctx.fillStyle = p.isHuman ? "#00e5ff" : "#ff4b4b";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.fillStyle = "white";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  document.getElementById("kills").innerText =
    "Kills: " + players[0].kills;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
