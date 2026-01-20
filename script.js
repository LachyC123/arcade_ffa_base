const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const player = {
  x: canvas.width/2,
  y: canvas.height/2,
  r: 16,
  speed: 4,
  hp: 100,
  kills: 0
};

const enemies = [];
for (let i = 0; i < 3; i++) {
  enemies.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: 14,
    hp: 100
  });
}

let bullets = [];
let touchPos = null;

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  touchPos = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  touchPos = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchend", () => touchPos = null);

function shoot(tx, ty) {
  const ang = Math.atan2(ty - player.y, tx - player.x);
  bullets.push({
    x: player.x,
    y: player.y,
    dx: Math.cos(ang)*8,
    dy: Math.sin(ang)*8
  });
}

setInterval(() => {
  if (touchPos) shoot(touchPos.x, touchPos.y);
}, 300);

function update() {
  if (touchPos) {
    const dx = touchPos.x - player.x;
    const dy = touchPos.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d > 20) {
      player.x += dx/d * player.speed;
      player.y += dy/d * player.speed;
    }
  }

  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });

  enemies.forEach(e => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy);
    e.x += dx/d * 1.5;
    e.y += dy/d * 1.5;
  });

  bullets.forEach(b => {
    enemies.forEach(e => {
      if (Math.hypot(b.x-e.x, b.y-e.y) < e.r) {
        e.hp -= 50;
        b.dead = true;
        if (e.hp <= 0) {
          e.x = Math.random()*canvas.width;
          e.y = Math.random()*canvas.height;
          e.hp = 100;
          player.kills++;
          document.getElementById("kills").innerText = "Kills: " + player.kills;
        }
      }
    });
  });

  bullets = bullets.filter(b => !b.dead);
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#00e5ff";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fill();

  enemies.forEach(e => {
    ctx.fillStyle = "#ff3b3b";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
    ctx.fill();
  });

  ctx.fillStyle = "white";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
    ctx.fill();
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
