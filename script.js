const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* ===== PLAYER ROLES ===== */
const ROLES = {
  assault: { speed: 4.2, hp: 100, color: "#00e5ff" },
  tank:    { speed: 3.2, hp: 140, color: "#ff5252" },
  scout:   { speed: 5.2, hp: 80,  color: "#ffd452" },
  duelist: { speed: 4.6, hp: 95,  color: "#9b6cff" }
};

/* ===== MAP WALLS ===== */
const WALLS = [
  {x:300,y:200,w:220,h:20},
  {x:600,y:200,w:20,h:260},
  {x:200,y:450,w:260,h:20},
  {x:800,y:420,w:220,h:20},
  {x:500,y:550,w:20,h:220}
];

const WEAPON = { fireRate:350, speed:7, damage:34 };

class Player {
  constructor(id, role, isHuman=false) {
    this.id=id;
    this.role=role;
    this.speed=role.speed;
    this.maxHp=role.hp;
    this.hp=role.hp;
    this.color=role.color;
    this.r=16;
    this.isHuman=isHuman;
    this.dead=false;
    this.invuln=0;
    this.lastShot=0;
    this.kills=0;
    this.respawn();
  }
  respawn(){
    const s=getSafeSpawn();
    this.x=s.x; this.y=s.y;
    this.hp=this.maxHp;
    this.dead=false;
    this.invuln=90;
  }
}

const players=[
  new Player("YOU", ROLES.assault, true),
  new Player("AI-1", ROLES.tank),
  new Player("AI-2", ROLES.scout),
  new Player("AI-3", ROLES.duelist)
];

let bullets=[];
let touch=null;

canvas.addEventListener("touchstart",e=>{
  const t=e.touches[0];
  touch={x:t.clientX,y:t.clientY};
});
canvas.addEventListener("touchmove",e=>{
  const t=e.touches[0];
  touch={x:t.clientX,y:t.clientY};
});
canvas.addEventListener("touchend",()=>touch=null);

/* ===== SAFE SPAWN ===== */
function getSafeSpawn(){
  let x,y,ok;
  do{
    ok=true;
    x=Math.random()*canvas.width;
    y=Math.random()*canvas.height;
    players.forEach(p=>{
      if(!p.dead && Math.hypot(p.x-x,p.y-y)<200) ok=false;
    });
  }while(!ok);
  return {x,y};
}

function shoot(p,tx,ty){
  const now=Date.now();
  if(now-p.lastShot<WEAPON.fireRate) return;
  p.lastShot=now;
  const a=Math.atan2(ty-p.y,tx-p.x);
  bullets.push({
    x:p.x,y:p.y,
    dx:Math.cos(a)*WEAPON.speed,
    dy:Math.sin(a)*WEAPON.speed,
    owner:p
  });
}

function collidesWall(x,y){
  return WALLS.some(w=>
    x>w.x && x<w.x+w.w &&
    y>w.y && y<w.y+w.h
  );
}

function updatePlayer(p){
  if(p.dead) return;
  if(p.invuln>0) p.invuln--;

  let dx=0,dy=0;

  if(p.isHuman && touch){
    dx=touch.x-p.x;
    dy=touch.y-p.y;
    const d=Math.hypot(dx,dy);
    if(d>20){
      dx=dx/d*p.speed;
      dy=dy/d*p.speed;
    }
    shoot(p,touch.x,touch.y);
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
      if(p.dead||p===b.owner||p.invuln>0) return;
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

  bullets=bullets.filter(b=>!b.dead);
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
