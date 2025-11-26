// ===== Canvas Setup =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== DOM Elements =====
const titleScreen = document.getElementById('titleScreen');
const startButton = document.getElementById('startGame');
const scoreDisplay = document.getElementById('score');
const healthDisplay = document.getElementById('health');

// ===== Sounds =====
let shootSound = new Audio('https://freesound.org/data/previews/146/146724_2615113-lq.mp3');
let explosionSound = new Audio('https://freesound.org/data/previews/235/235968_3988955-lq.mp3');

// ===== Classes =====
class Rocket {
  constructor(x, y, dx, dy){
    this.x = x; this.y = y;
    this.width = 8; this.height = 8;
    this.speed = 3;
    this.dx = dx; this.dy = dy;
    this.exploding = false; this.explosionFrame = 0;
  }
  update(){
    if(this.exploding){ this.explosionFrame++; return; }
    this.x += this.dx*this.speed;
    this.y += this.dy*this.speed;
  }
  draw(){
    if(this.exploding){
      ctx.fillStyle='orange';
      ctx.beginPath();
      ctx.arc(this.x+this.width/2,this.y+this.height/2,this.explosionFrame*2,0,Math.PI*2);
      ctx.fill();
      return;
    }
    ctx.fillStyle='red'; ctx.fillRect(this.x,this.y,this.width,this.height);
  }
  explode(){ this.exploding=true; explosionSound.play(); }
}

class Car {
  constructor(x,y){
    this.x=x; this.y=y; this.width=30; this.height=20;
    this.speed=2; this.vy=0; this.jumpTimer=Math.random()*100+50; this.health=100;
  }
  update(){
    this.x += (Math.random()*2-1)*this.speed;
    this.jumpTimer--;
    if(this.jumpTimer<=0){ this.vy=-5; this.jumpTimer=Math.random()*200+50; }
    this.vy += 0.3; this.y += this.vy;

    if(this.y>780){ this.y=780; this.vy=0; }
    if(this.y>300 && this.y<320 && this.x>300 && this.x<1100){ this.y=300; this.vy=0; }

    if(this.x<0)this.x=0;
    if(this.x>canvas.width-this.width)this.x=canvas.width-this.width;
    if(this.y<0)this.y=0;
    if(this.y>780)this.y=780;
  }
  draw(){ ctx.fillStyle='blue'; ctx.fillRect(this.x,this.y,this.width,this.height);}
  takeDamage(dmg){ this.health-=dmg;}
}

class NPC {
  constructor(x,y){
    this.x=x; this.y=y; this.width=20; this.height=20;
    this.shootTimer=Math.random()*100+50;
  }
  update(){
    this.x += (Math.random()*2-1);
    if(this.x<300) this.x=300;
    if(this.x>1080) this.x=1080;
    this.shootTimer--;
    if(this.shootTimer<=0){
      let nearestCar = null;
      let minDist = 2000;
      for(let car of cars){
        let dist = Math.hypot(this.x-car.x, this.y-car.y);
        if(dist<minDist){ minDist=dist; nearestCar=car; }
      }
      if(nearestCar){
        let dx = nearestCar.x-this.x;
        let dy = nearestCar.y-this.y;
        let mag = Math.hypot(dx,dy);
        dx/=mag; dy/=mag;
        rockets.push(new Rocket(this.x+this.width/2,this.y+this.height/2,dx,dy));
        shootSound.play();
      }
      this.shootTimer=Math.random()*100+50;
    }
  }
  draw(){ ctx.fillStyle='green'; ctx.fillRect(this.x,this.y,this.width,this.height);}
}

// ===== Game Variables =====
let rockets=[], cars=[], npcs=[];
let rocketPlayer = {x:700, y:780, width:20, height:20, vy:0, health:100};
let keys={}, canShoot=true, score=0, gameStarted=false;

// ===== Platforms =====
function drawPlatforms(){
  ctx.fillStyle='gray';
  ctx.fillRect(300,300,800,20);
}

// ===== Controls =====
document.addEventListener('keydown', e=>{ keys[e.code]=true; });
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

// ===== Player Functions =====
function handlePlayer(){
  if(keys['KeyA'] && rocketPlayer.x>0) rocketPlayer.x -=4;
  if(keys['KeyD'] && rocketPlayer.x<canvas.width-rocketPlayer.width) rocketPlayer.x+=4;
  if(keys['KeyW'] && rocketPlayer.y>=780) rocketPlayer.vy=-8;

  rocketPlayer.vy+=0.4;
  rocketPlayer.y+=rocketPlayer.vy;

  if(rocketPlayer.y>780){ rocketPlayer.y=780; rocketPlayer.vy=0; }
  if(rocketPlayer.y>300 && rocketPlayer.y<320 && rocketPlayer.x>300 && rocketPlayer.x<1100){
    rocketPlayer.y=300; rocketPlayer.vy=0;
  }

  if(keys['Space'] && canShoot){
    let dx=0, dy=0;
    if(keys['ArrowUp']) dy=-1;
    else if(keys['ArrowDown']) dy=1;
    else if(keys['ArrowLeft']) dx=-1;
    else dx=1;

    rockets.push(new Rocket(rocketPlayer.x+rocketPlayer.width/2, rocketPlayer.y+rocketPlayer.height/2, dx, dy));
    canShoot=false;
    shootSound.play();
    setTimeout(()=>{ canShoot=true; },300);
  }
}

// ===== Spawn Cars/NPCs =====
function spawnCarsAndNPCs(){
  cars=[];
  for(let i=0;i<15;i++){
    let x=Math.random()*1100+150;
    cars.push(new Car(x,780));
  }
  npcs=[];
  for(let i=0;i<3;i++){
    let x=350 + i*150;
    npcs.push(new NPC(x,280));
  }
}

// ===== Game Loop =====
function gameLoop(){
  if(!gameStarted) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawPlatforms();

  ctx.fillStyle='red';
  ctx.fillRect(rocketPlayer.x,rocketPlayer.y,rocketPlayer.width,rocketPlayer.height);

  handlePlayer();

  for(let npc of npcs){ npc.update(); npc.draw(); }

  for(let i=rockets.length-1;i>=0;i--){
    rockets[i].update();
    rockets[i].draw();
    for(let j=cars.length-1;j>=0;j--){
      let car=cars[j];
      if(rockets[i].x<car.x+car.width && rockets[i].x+rockets[i].width>car.x &&
         rockets[i].y<car.y+car.height && rockets[i].y+rockets[i].height>car.y){
           car.takeDamage(50);
           rockets[i].explode();
           setTimeout(()=>{ rockets.splice(i,1); },50);
           if(car.health<=0){ cars.splice(j,1); score+=10; }
           break;
      }
    }
    if(rockets[i] && (rockets[i].x<0||rockets[i].x>canvas.width||rockets[i].y<0||rockets[i].y>canvas.height)){
      rockets.splice(i,1);
    }
  }

  for(let car of cars){ car.update(); car.draw(); }

  scoreDisplay.innerText=`Score: ${score}`;
  healthDisplay.innerText=`Player Health: ${rocketPlayer.health}`;

  if(cars.length==0){ setTimeout(()=>{ alert("You Win!"); document.location.reload(); },100); gameStarted=false;}
  if(rocketPlayer.health<=0){ setTimeout(()=>{ alert("Game Over!"); document.location.reload(); },100); gameStarted=false;}

  requestAnimationFrame(gameLoop);
}

// ===== Start =====
startButton.addEventListener('click', ()=>{
  titleScreen.style.display='none';
  gameStarted=true;
  rocketPlayer={x:700,y:780,width:20,height:20,vy:0,health:100};
  rockets=[]; score=0; spawnCarsAndNPCs(); gameLoop();
});
