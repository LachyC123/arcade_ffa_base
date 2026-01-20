const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* ===== MAP ===== */
const WALLS = [
  {x:300,y:200,w:220,h:20},
  {x:600,y:200,w:20,h:260},
  {x:200,y:450,w:260,h:20},
  {x:800,y:420,w:220,h:20},
  {x:500,y:550,w:20,h:220}
];

/* ===== WEAPON ===== */
const WEAPON = { fireRate:350, speed:7, damage:30 };

/* ===== ABILITIES ===== */
const ABILITIES = {
  dash: { cooldown: 3000 },
  shield: { cooldown: 5000 },
  blast: { cooldown: 4000 }
};

class Player {
  constructor(id, color, ability, isHuman=false) {
    this.id=id;
    this.color=color;
    this.ability=ability;
    this.speed=4;
    this.maxHp=100;
    this.hp=100;
    this.r=16;
    this.isHuman=isHuman;
    this.dead=false;
    this.invuln=0;
    this.lastShot=0;
    this.lastAbility=0;
    this.shield=0;
    this.kills=0;

    // SAFE initial spawn (no safe-check yet)
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
  }

  respawn(){
    const s = getSafeSpawn();
    this.x = s.x;
    this.y = s.y;
    this.hp = this.maxHp;
    this.dead = false;
    this.invuln = 90;
  }
}

const players = [
  new Player("YOU","#00e5ff","dash",true),
  new Player("AI-1","#ff5252","shield"),
  new Player("AI-2","#ffd452","blast"),
  new Player("AI-3","#9b6cff","dash")
];

let bullets = [];
let touch = null;

/* ===== INPUT ===== */
canvas.addEventListener("touchstart",e=>{
  const t=e.touches[0];
  touch={x:t.clientX,y:t.clientY};
});
canvas.addEventListener("touchmove",e=>{
  const t=e.touches[0];
  touch={x:t.clientX,y:t.clientY};
});
canvas.addEventListener("touchend",()=>touch=null);

/* ===== SAFE SPAWN (FIXED) ===== */
function getSafeSpawn(){
  let x,y,ok;
  let attempts = 0;

  do{
    ok = true;
    x = Math.random() * canvas.width;
    y = Math.random() * canvas.height;

    players.forEach(p=>{
      if(p.x === undefined || p.y === undefined) return;
      if(!p.dead && Math.hypot(p.x-x,p.y-y) < 200){
        ok = false;
      }
    });

    attempts++;
    if(attempts > 50) break;
  }while(!ok);

  return {x,y};
}

function collidesWall(x,y){
  return WALLS.some(w=>x>w.x && x<w.x+w.w && y>w.y && y<w.y+w.h);
}

function shoot(p,tx,ty){
  const now = Date.now();
  if(now - p.lastShot < WEAPON.fireRate) return;
  p.lastShot = now;
  const a = Math.atan2(ty-p.y,tx-p.x);
  bullets.push({
    x:p.x,y:p.y,
    dx:Math.cos(a)*WEAPON.speed,
    dy:Math.sin(a)*WEAPON.speed,
    owner:p
  });
}

function useAbility(p,tx,ty){
  const now = Date.now();
  const data = ABILITIES[p.ability];
  if(now - p.lastAbility < data.cooldown) return;
  p.lastAbility = now;

  if(p.ability === "dash"){
    const a = Math.atan2(ty-p.y,tx-p.x);
    p.x += Math.cos(a)*120;
    p.y += Math.sin(a)*120;
  }
  if(p.ability === "shield"){
    p.shield = 120;
  }
  if(p.ability === "blast"){
    players.forEach(o=>{
      if(o!==p && !o.dead && Math.hypot(o.x-p.x,o.y-p.y) < 120){
        o.hp -= 40;
      }
    });
  }
}

function updatePlayer(p){
  if(p.dead) return;
  if(p.invuln>0) p.invuln--;
  if(p.shield>0) p.shield--;

  let dx=0,dy=0;

  if(p.isHuman && touch){
    dx=touch.x-p.x; dy=touch.y-p.y;
    const d=Math.hypot(dx,dy);
    if(d>20){
      dx=dx/d*p.speed;
      dy=dy/d*p.speed;
    }
    shoot(p,touch.x,touch.y);
    if(Math.random()<0.01) useAbility(p,touch.x,touch.y);
  }

  if(!p.isHuman){
    const targets=players.filter(t=>t!==p&&!t.dead);
    const t=targets[Math.floor(Math.random()*targets.length)];
    if(!t) return;
    dx=(t.x-p.x); dy=(t.y-p.y);
    const d=Math.hypot(dx,dy);
    dx=dx/d*p.speed*0.6;
    dy=dy/d*p.speed*0.6;
    shoot(p,t.x,t.y);
    if(Math.random()<0.005) useAbility(p,t.x,t.y);
  }

  if(!collidesWall(p.x+dx,p.y)) p.x+=dx;
  if(!collidesWall(p.x,p.y+dy)) p.y+=dy;
}

function update(){
  players.forEach(updatePlayer);

  bullets.forEach(b=>{
    b.x+=b.dx; b.y+=b.dy;
    if(collidesWall(b.x,b.y)) b.dead=true;

    players.forEach(p=>{
      if(p.dead||p===b.owner||p.invuln>0||p.shield>0) return;
      if(Math.hypot(b.x-p.x,b.y-p.y)<p.r){
        p.hp-=WEAPON.damage;
        b.dead=true;
        if(p.hp<=0){
          p.dead=true;
          b.owner.kills++;
          setTimeout(()=>p.respawn(),2000);
        }
      }
    });
  });

  bullets = bullets.filter(b=>!b.dead);
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  WALLS.forEach(w=>{
    ctx.fillStyle="#2a2f55";
    ctx.fillRect(w.x,w.y,w.w,w.h);
  });

  players.forEach(p=>{
    if(p.dead) return;
    ctx.globalAlpha=p.invuln>0?0.5:1;
    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();

    if(p.shield>0){
      ctx.strokeStyle="cyan";
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r+6,0,Math.PI*2);
      ctx.stroke();
    }

    ctx.fillStyle="red";
    ctx.fillRect(p.x-18,p.y-26,36,4);
    ctx.fillStyle="lime";
    ctx.fillRect(p.x-18,p.y-26,36*(p.hp/p.maxHp),4);
  });

  ctx.globalAlpha=1;
  ctx.fillStyle="white";
  bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x,b.y,4,0,Math.PI*2);
    ctx.fill();
  });

  document.getElementById("kills").innerText="Kills: "+players[0].kills;
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
