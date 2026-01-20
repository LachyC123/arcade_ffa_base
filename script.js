const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const WEAPONS = {
  pistol: { fireRate: 350, speed: 7, damage: 34 }
};

class Player {
  constructor(id, x, y, color, isHuman = false) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.r = 16;
    this.color = color;
    this.hp = 100;
    this.kills = 0;
    this.isHuman = isHuman;
    this.weapon = WEAPONS.pistol;
    this.dead = false;
    this.invuln = 0;
    this.lastShot = 0;
    this.target = null;
  }

  respawn() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.hp = 100;
    this.dead = false;
    this.invuln = 90;
  }
}

const players = [
  new Player("YOU", canvas.width/2, canvas.height/2, "#00e5ff", true),
  new Player("AI-1", 100, 100, "#ff5252"),
  new Player("AI-2", canvas.width-100, 120, "#ffd452"),
  new Player("AI-3", 150, canvas.height-150, "#9b6cff")
];

let bullets = [];
let touch = null;
let screenShake = 0;

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  touch = { x: t.clientX, y: t.clientY };
});
canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  touch = { x: t.clientX, y: t.clientY };
});
canvas.addEventListener("touchend", () => touch = null);

function shoot(p, tx, ty) {
  const now = Date.now();
  if (now - p.lastShot < p.weapon.fireRate) return;
  p.lastShot = now;

  const a = Math.atan2(ty - p.y, tx - p.x);
  bullets.push({
    x: p.x,
    y: p.y,
    dx: Math.cos(a) * p.weapon.speed,
    dy: Math.sin(a) * p.weapon.speed,
    owner: p
  });
}

function addKill(killer, victim) {
  const el = document.createElement("div");
  el.className = "kill";
  el.textContent = `${killer.id} ➜ ${victim.id}`;
  document.getElementById("killfeed").prepend(el);
  setTimeout(() => el.remove(), 3500);
}

function updatePlayer(p) {
  if (p.dead) return;
  if (p.invuln > 0) p.invuln--;

  if (p.isHuman && touch) {
    const dx = touch.x - p.x;
    const dy = touch.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 20) {
      p.x += dx/d * 4;
      p.y += dy/d * 4;
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
    p.x += dx/d * 1.6;
    p.y += dy/d * 1.6;
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
        screenShake = 6;

        if (p.hp <= 0) {
          p.dead = true;
          b.owner.kills++;
          addKill(b.owner, p);
          setTimeout(() => p.respawn(), 2000);
        }
      }
    });
  });

  bullets = bullets.filter(b => !b.dead);
}

function draw() {
  ctx.save();
  if (screenShake > 0) {
    ctx.translate(
      (Math.random()-0.5) * screenShake,
      (Math.random()-0.5) * screenShake
    );
    screenShake--;
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);

  players.forEach(p => {
    if (p.dead) return;
    ctx.globalAlpha = p.invuln > 0 ? 0.5 : 1;

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();

    // health bar
    ctx.fillStyle = "red";
    ctx.fillRect(p.x-18, p.y-26, 36, 4);
    ctx.fillStyle = "lime";
    ctx.fillRect(p.x-18, p.y-26, 36*(p.hp/100), 4);
  });

  ctx.globalAlpha = 1;
  ctx.fillStyle = "white";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
    ctx.fill();
  });

  ctx.restore();

  document.getElementById("kills").innerText = "Kills: " + players[0].kills;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
