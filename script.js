// Rockets vs Cars — Floating Island full rebuild
// Replace your old script.js with this file.

document.addEventListener('DOMContentLoaded', ()=>{

/* -----------------------
   DOM & Canvas
   ----------------------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const titleScreen = document.getElementById('titleScreen');
const startButton = document.getElementById('startGame');
const buyNPCButton = document.getElementById('buyNPC');
const shopPointsSpan = document.getElementById('shopPoints');
const ownedNPCsSpan = document.getElementById('ownedNPCs');

const scoreSpan = document.getElementById('score');
const livesSpan = document.getElementById('lives');
const waveSpan = document.getElementById('wave');
const timerSpan = document.getElementById('timer');

const W = canvas.width;
const H = canvas.height;

/* -----------------------
   Persistence keys
   ----------------------- */
const STORAGE = {
  points: 'rvc_points_v2',
  purchasedNPCs: 'rvc_purchased_npcs_v2'
};
let points = Number(localStorage.getItem(STORAGE.points) || 0);
let purchasedNPCs = Number(localStorage.getItem(STORAGE.purchasedNPCs) || 0);
shopPointsSpan.innerText = points;
ownedNPCsSpan.innerText = 1 + purchasedNPCs;

/* -----------------------
   Audio (soft)
   ----------------------- */
const shootSound = new Audio('https://freesound.org/data/previews/146/146724_2615113-lq.mp3');
const explosionSound = new Audio('https://freesound.org/data/previews/235/235968_3988955-lq.mp3');
shootSound.volume = 0.15;
explosionSound.volume = 0.18;

/* -----------------------
   Game config & state
   ----------------------- */
/* Floating island platform (centered) */
const PLATFORM = {
  x: W/2 - 520/2,   // island width 520
  y: H/2 - 20,      // island vertical position (middle-ish)
  w: 520,
  h: 24
};
const FLOOR_Y = H - 20; // ground plane for cars

const MAX_NPCS = 6;
let rockets = [];
let explosions = [];
let cars = [];
let npcs = [];

let player = { x: PLATFORM.x + PLATFORM.w/2 - 12, y: PLATFORM.y - 20, w: 24, h: 24, vx:0, vy:0, lives:3 };
let keys = {};
let mouse = { x:0, y:0 };

let score = 0;
let wave = 1;
let timer = 60; // survival timer (seconds)
let gameStarted = false;

/* -----------------------
   Helpers
   ----------------------- */
function savePersistent(){
  localStorage.setItem(STORAGE.points, String(points));
  localStorage.setItem(STORAGE.purchasedNPCs, String(purchasedNPCs));
  shopPointsSpan.innerText = points;
  ownedNPCsSpan.innerText = 1 + purchasedNPCs;
}

function rand(min,max){ return Math.random()*(max-min)+min; }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

/* -----------------------
   Classes: Rocket / Explosion / Car / NPC
   ----------------------- */
class Rocket {
  constructor(x,y,dx,dy,owner='player'){
    this.x = x; this.y = y; this.dx = dx; this.dy = dy;
    this.speed = 6;
    this.w = 8; this.h = 8;
    this.owner = owner;
    this.life = 120;
  }
  update(){
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
    this.life--;
  }
  draw(){
    ctx.fillStyle = (this.owner === 'player') ? '#ff6b6b' : '#ffc971';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Explosion {
  constructor(x,y){
    this.x = x; this.y = y;
    this.frame = 0;
    this.maxFrame = 20;
    this.maxR = 32;
  }
  update(){ this.frame++; }
  draw(){
    const t = this.frame / this.maxFrame;
    const r = this.maxR * t;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#ffa94d';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  done(){ return this.frame >= this.maxFrame; }
}

class Car {
  constructor(x){
    this.x = x;
    this.y = FLOOR_Y;
    this.w = 34; this.h = 22;
    this.vx = rand(-1.8, 1.8);
    this.vy = 0;
    this.jumpCooldown = Math.floor(rand(120, 260)); // frames (cooldown)
    this.health = 100;
  }
  jumpToPlatform(){
    // physics-based jump so cars reach platform top
    const topTarget = PLATFORM.y - this.h;
    const g = 0.5;
    const delta = FLOOR_Y - topTarget;
    let v = Math.sqrt(2 * g * delta);
    v *= rand(0.95, 1.05);
    this.vy = -v;
  }
  update(){
    // roam left/right randomly
    if(Math.random() < 0.015) this.vx = rand(-1.6, 1.6);
    this.x += this.vx;

    // bound horizontally inside full canvas
    const leftBound = 10;
    const rightBound = W - this.w - 10;
    if(this.x < leftBound){ this.x = leftBound; this.vx = Math.abs(this.vx); }
    if(this.x > rightBound){ this.x = rightBound; this.vx = -Math.abs(this.vx); }

    // jump cooldown & jump if grounded
    if(this.jumpCooldown > 0) this.jumpCooldown--;
    if(this.jumpCooldown <= 0 && this.y >= FLOOR_Y - 0.5){
      this.jumpToPlatform();
      this.jumpCooldown = Math.floor(rand(120, 320));
    }

    // gravity
    this.vy += 0.5;
    this.y += this.vy;

    // land on island/platform if in X range and near
    const onIslandX = (this.x + this.w > PLATFORM.x && this.x < PLATFORM.x + PLATFORM.w);
    if(onIslandX && this.y + this.h >= PLATFORM.y && this.y + this.h <= PLATFORM.y + 50 && this.vy >= 0){
      this.y = PLATFORM.y - this.h;
      this.vy = 0;
    }

    // floor limit
    if(this.y > FLOOR_Y){ this.y = FLOOR_Y; this.vy = 0; }
  }
  draw(){
    ctx.fillStyle = '#3498db';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
  takeDamage(d){
    this.health -= d;
  }
}

class NPC {
  constructor(x){
    this.x = x;
    this.y = PLATFORM.y - 20;
    this.w = 20; this.h = 20;
    this.lives = 3;
    this.walkTimer = Math.floor(rand(40, 220));
    this.state = 'pause'; // 'left','right','pause'
    this.shootCooldown = Math.floor(rand(120, 260));
  }
  update(){
    // wander: left/right/pause
    this.walkTimer--;
    if(this.walkTimer <= 0){
      const r = Math.random();
      if(r < 0.36) this.state = 'left';
      else if(r < 0.72) this.state = 'right';
      else this.state = 'pause';
      this.walkTimer = Math.floor(rand(50, 260));
    }

    const speed = 1.6;
    if(this.state === 'left') this.x -= speed;
    if(this.state === 'right') this.x += speed;

    // clamp to platform bounds (with small margin)
    const leftLimit = PLATFORM.x + 8;
    const rightLimit = PLATFORM.x + PLATFORM.w - this.w - 8;
    this.x = clamp(this.x, leftLimit, rightLimit);

    // shoot at nearest car slower
    this.shootCooldown--;
    if(this.shootCooldown <= 0){
      if(cars.length > 0){
        let nearest = null, md = Infinity;
        for(const c of cars){
          const d = Math.hypot((c.x + c.w/2) - (this.x + this.w/2), (c.y + c.h/2) - (this.y + this.h/2));
          if(d < md){ md = d; nearest = c; }
        }
        if(nearest){
          let dx = (nearest.x + nearest.w/2) - (this.x + this.w/2);
          let dy = (nearest.y + nearest.h/2) - (this.y + this.h/2);
          const m = Math.hypot(dx,dy) || 1;
          dx /= m; dy /= m;
          rockets.push(new Rocket(this.x + this.w/2, this.y + this.h/2, dx, dy, 'npc'));
          try{ shootSound.currentTime = 0; shootSound.play(); }catch(e){}
        }
      }
      this.shootCooldown = Math.floor(rand(140, 300));
    }
  }
  draw(){
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // small life bar
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(this.x, this.y - 6, this.w, 4);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(this.x, this.y - 6, this.w * (this.lives / 3), 4);
  }
}

/* -----------------------
   Spawning & level
   ----------------------- */
function spawnCars(count = 12){
  for(let i=0;i<count;i++){
    const x = rand(40, W - 80);
    cars.push(new Car(x));
  }
}
function spawnNPCs(){
  npcs.length = 0;
  const owned = Math.min(1 + purchasedNPCs, MAX_NPCS);
  const gap = PLATFORM.w / (owned + 1);
  for(let i=0;i<owned;i++){
    const x = PLATFORM.x + gap * (i + 1) - 10;
    const npc = new NPC(x);
    npc.y = PLATFORM.y - npc.h;
    npc.lives = 3;
    npcs.push(npc);
  }
}

/* -----------------------
   Input handling
   ----------------------- */
document.addEventListener('keydown', (e)=>{ keys[e.code] = true; });
document.addEventListener('keyup', (e)=>{ keys[e.code] = false; });

canvas.addEventListener('mousemove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('click', (e)=>{
  if(!gameStarted) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  let dx = mouseX - (player.x + player.w/2);
  let dy = mouseY - (player.y + player.h/2);
  const m = Math.hypot(dx,dy) || 1;
  dx /= m; dy /= m;
  rockets.push(new Rocket(player.x + player.w/2, player.y + player.h/2, dx, dy, 'player'));
  try{ shootSound.currentTime = 0; shootSound.play(); }catch(e){}
});

/* -----------------------
   Shop buy NPC
   ----------------------- */
buyNPCButton.addEventListener('click', ()=>{
  if(points >= 100 && purchasedNPCs < (MAX_NPCS-1)){
    points -= 100;
    purchasedNPCs += 1;
    localStorage.setItem(STORAGE.points, String(points));
    localStorage.setItem(STORAGE.purchasedNPCs, String(purchasedNPCs));
    shopPointsSpan.innerText = points;
    ownedNPCsSpan.innerText = 1 + purchasedNPCs;
    // respawn NPCs to reflect new count
    spawnNPCs();
  }
});

/* -----------------------
   HUD update
   ----------------------- */
function updateHUD(){
  scoreSpan.innerText = `Score: ${score}`;
  livesSpan.innerText = `Player Lives: ${player.lives}`;
  waveSpan.innerText = `Wave: ${wave}`;
  timerSpan.innerText = `Time: ${Math.max(0, Math.floor(timer))}`;
  shopPointsSpan.innerText = points;
}

/* -----------------------
   Main game loop
   ----------------------- */
let lastT = 0;
function loop(t){
  if(!gameStarted) return;
  const dt = Math.min(40, t - lastT);
  lastT = t;

  // Player movement
  if(keys['KeyA']) player.x -= 4;
  if(keys['KeyD']) player.x += 4;
  player.x = clamp(player.x, PLATFORM.x + 6, PLATFORM.x + PLATFORM.w - player.w - 6);

  // Jump: only if on platform or floor
  const onPlatform = Math.abs(player.y + player.h - PLATFORM.y) < 1;
  const onFloor = Math.abs(player.y + player.h - FLOOR_Y) < 1;
  if(keys['KeyW'] && (onPlatform || onFloor)){
    player.vy = -10;
  }

  // gravity
  player.vy += 0.6;
  player.y += player.vy;

  // platform collision (smooth)
  if(player.y + player.h >= PLATFORM.y && player.y + player.h <= PLATFORM.y + 20 &&
     player.x + player.w > PLATFORM.x && player.x < PLATFORM.x + PLATFORM.w && player.vy >= 0){
    player.y = PLATFORM.y - player.h;
    player.vy = 0;
  }
  // floor collision
  if(player.y + player.h > FLOOR_Y){
    player.y = FLOOR_Y - player.h;
    player.vy = 0;
  }

  // update NPCs
  for(const npc of npcs) npc.update();

  // update rockets (player & npc)
  for(let i = rockets.length - 1; i >= 0; i--){
    const r = rockets[i];
    r.update();
    if(r.life <= 0 || r.x < -60 || r.x > W + 60 || r.y < -60 || r.y > H + 60){ rockets.splice(i,1); continue; }

    // rockets hit cars
    for(let j = cars.length - 1; j >= 0; j--){
      const c = cars[j];
      if(r.x < c.x + c.w && r.x + r.w > c.x && r.y < c.y + c.h && r.y + r.h > c.y){
        // hit
        c.takeDamage(50);
        explosions.push(new Explosion(r.x + r.w/2, r.y + r.h/2));
        try{ explosionSound.currentTime = 0; explosionSound.play(); }catch(e){}
        rockets.splice(i,1);
        if(c.health <= 0){
          cars.splice(j,1);
          score += 10;
          points += 10;
          localStorage.setItem(STORAGE.points, String(points));
        }
        break;
      }
    }
  }

  // update explosions
  for(let i = explosions.length - 1; i >= 0; i--){
    const ex = explosions[i];
    ex.update();
    if(ex.done()) explosions.splice(i,1);
  }

  // update cars and collisions
  for(let ci = cars.length - 1; ci >= 0; ci--){
    const c = cars[ci];
    c.update();

    // collision with NPCs
    for(let ni = npcs.length - 1; ni >= 0; ni--){
      const n = npcs[ni];
      if(c.x < n.x + n.w && c.x + c.w > n.x && c.y < n.y + n.h && c.y + c.h > n.y){
        n.lives--;
        c.vy = -6; c.y -= 8;
        if(n.lives <= 0){
          npcs.splice(ni,1);
        }
      }
    }

    // collision with player
    if(c.x < player.x + player.w && c.x + c.w > player.x && c.y < player.y + player.h && c.y + c.h > player.y){
      player.lives--;
      c.vy = -6; c.y -= 8;
      if(player.lives <= 0){
        gameOver('You Died');
        return;
      }
   
