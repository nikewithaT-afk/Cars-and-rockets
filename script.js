document.addEventListener('DOMContentLoaded', ()=>{

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const titleScreen = document.getElementById('titleScreen');
const startButton = document.getElementById('startGame');
const buyNPCButton = document.getElementById('buyNPC');
const shopPointsDisplay = document.getElementById('shopPoints');

const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const waveDisplay = document.getElementById('wave');
const timerDisplay = document.getElementById('timer');

// Sounds
let shootSound = new Audio('https://freesound.org/data/previews/146/146724_2615113-lq.mp3');
let explosionSound = new Audio('https://freesound.org/data/previews/235/235968_3988955-lq.mp3');

// Classes
class Rocket {
  constructor(x, y, dx, dy){
    this.x = x; this.y = y; this.dx = dx; this.dy = dy; this.speed = 3; this.exploding = false; this.explosionFrame = 0;
  }
  update(){
    if(this.exploding){ this.explosionFrame++; return; }
    this.x += this.dx*this.speed;
    this.y += this.dy*this.speed;
  }
  draw(){
    if(this.exploding){
      ctx.font = '30px Arial';
      ctx.fillText('💥', this.x, this.y+15);
      return;
    }
    ctx.font = '20px Arial';
    ctx.fillText('🔥', this.x, this.y+15);
  }
  explode(){ this.exploding=true; explosionSound.play(); }
}

class Car {
  constructor(x,y){
    this.x=x; this.y=y; this.vy=0; this.width=30; this.height=20;
    this.speed = Math.random()*2+1; this.jumpCooldown=Math.random()*120+60; 
    this.direction = Math.random()<0.5?-1:1; this.health=100;
  }
  update(){
    this.x += this.direction * this.speed;
    if(Math.random()<0.01) this.direction*=-1;

    this.jumpCooldown--;
    if(this.jumpCooldown<=0 && this.y>=780){
      this.vy=-10-Math.random()*5;
      this.jumpCooldown=Math.random()*120+60;
    }

    this.vy +=0.4;
    this.y += this.vy;

    if(this.y>780){ this.y=780; this.vy=0;}
    if(this.x<0){ this.x=0; this.direction*=-1;}
    if(this.x>canvas.width-30){ this.x=canvas.width-30; this.direction*=-1;}
  }
  draw(){ ctx.font='25px Arial'; ctx.fillText('🚗', this.x, this.y+20); }
  takeDamage(dmg){ this.health-=dmg; }
}

class NPC {
  constructor(x,y){
    this.x=x; this.y=y; this.width=20; this.height=20;
    this.shootTimer=Math.random()*200+100; this.lives=3;
  }
  update(){
    this.x += (Math.random()*2-1)*1.5;
    if(this.x<200) this.x=200;
    if(this.x>1400-20) this.x=1400-20;

    this.shootTimer--;
    if(this.shootTimer<=0 && cars.length>0){
      let nearestCar = cars.reduce((a,b)=> Math.hypot(this.x-b.x,this.y-b.y)<Math.hypot(this.x-a.x,this.y-a.y)?b:a );
      let dx = nearestCar.x-this.x; let dy = nearestCar.y-this.y;
      let mag = Math.hypot(dx,dy); dx/=mag; dy/=mag;
      rockets.push(new Rocket(this.x,this.y, dx, dy));
      shootSound.play();
      this.shootTimer=Math.random()*200+100;
    }
  }
  draw(){ ctx.font='20px Arial'; ctx.fillText('🟩', this.x, this.y+15); }
}

// Player
let rocketPlayer = {x:700,y:280,width:20,height:20,vy:0,lives:3};
let keys={}, rockets=[], cars=[], npcs=[], score=0, points=0, wave=1, timer=60, gameStarted=false;

document.addEventListener('keydown', e=>{ keys[e.code]=true; });
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

function handlePlayer(){
  if(keys['KeyA'] && rocketPlayer.x>200) rocketPlayer.x-=4;
  if(keys['KeyD'] && rocketPlayer.x<1400-rocketPlayer.width) rocketPlayer.x+=4;
  rocketPlayer.vy +=0.4; rocketPlayer.y += rocketPlayer.vy;

  let platY=280, platX=200, platW=1200;
  if(rocketPlayer.y+20 >= platY && rocketPlayer.y+20 <= platY+10 && rocketPlayer.x+20>platX && rocketPlayer.x<platX+platW && rocketPlayer.vy>=0){
    rocketPlayer.y = platY-20; rocketPlayer.vy=0;
  }
  if(rocketPlayer.y+20>780){ rocketPlayer.y=780-20; rocketPlayer.vy=0;}
}
function drawPlayer(){ ctx.font='25px Arial'; ctx.fillText('🟥', rocketPlayer.x, rocketPlayer.y+20); }

// Shoot toward cursor
canvas.addEventListener('click', e=>{
  let rect = canvas.getBoundingClientRect();
  let mouseX = e.clientX - rect.left;
  let mouseY = e.clientY - rect.top;
  let dx = mouseX - (rocketPlayer.x+rocketPlayer.width/2);
  let dy = mouseY - (rocketPlayer.y+rocketPlayer.height/2);
  let mag = Math.hypot(dx,dy); dx/=mag; dy/=mag;
  rockets.push(new Rocket(rocketPlayer.x+rocketPlayer.width/2, rocketPlayer.y+rocketPlayer.height/2, dx, dy));
  shootSound.play();
});

// Spawn cars & NPCs
function spawnCarsAndNPCs(){
  cars=[]; for(let i=0;i<15;i++){ cars.push(new Car(Math.random()*1200+100,780)); }
  npcs=[]; 
  let npcCount = Math.min(1 + Math.floor(points/100),6); 
  for(let i=0;i<npcCount;i++){ npcs.push(new NPC(250+i*180,280)); }
}

// Shop
buyNPCButton.addEventListener('click', ()=>{
  if(points>=100){ points-=100; spawnCarsAndNPCs(); shopPointsDisplay.innerText=points; }
});

// Game loop
function gameLoop(){
  if(!gameStarted) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Platform
  ctx.fillStyle='gray'; ctx.fillRect(200,280,1200,20);

  handlePlayer();
  drawPlayer();

  for(let npc of npcs){ npc.update(); npc.draw(); }
  for(let i=rockets.length-1;i>=0;i--){
    rockets[i].update(); rockets[i].draw();
    for(let j=cars.length-1;j>=0;j--){
      let car = cars[j];
      if(rockets[i].x<car.x+car.width && rockets[i].x+8>car.x &&
         rockets[i].y<car.y+car.height && rockets[i].y+8>car.y){
           car.takeDamage(50); rockets[i].explode();
           setTimeout(()=>{ rockets.splice(i,1); },50);
           if(car.health<=0){ cars.splice(j,1); score+=10; points+=10; shopPointsDisplay.innerText=points; }
           break;
      }
    }
    if(rockets[i] && (rockets[i].x<0 || rockets[i].x>canvas.width || rockets[i].y<0 || rockets[i].y>canvas.height)){
      rockets.splice(i,1);
    }
  }

  for(let car of cars){ 
    car.update(); car.draw();
    for(let npc of npcs){
      if(car.x<npc.x+npc.width && car.x+car.width>npc.x &&
         car.y<npc.y+npc.height && car.y+car.height>npc.y){
           npc.lives--;
           car.vy=-5; car.y-=10;
           if(npc.lives<=0){ npcs.splice(npcs.indexOf(npc),1);}
      }
    }
    if(car.x<rocketPlayer.x+rocketPlayer.width && car.x+car.width>rocketPlayer.x &&
       car.y<rocketPlayer.y+rocketPlayer.height && car.y+car.height>rocketPlayer.y){
         rocketPlayer.lives--;
         car.vy=-5; car.y-=10;
         if(rocketPlayer.lives<=0){ setTimeout(()=>{ alert("You Died!"); document.location.reload(); },100); gameStarted=false; }
    }
  }

  scoreDisplay.innerText=`Score: ${score}`;
  livesDisplay.innerText=`Player Lives: ${rocketPlayer.lives}`;
  waveDisplay.innerText=`Wave: ${wave}`;
  timerDisplay.innerText=`Time: ${Math.floor(timer)}`;

  if(cars.length==0){ setTimeout(()=>{ alert("You Win!"); document.location.reload(); },100); gameStarted=false; }

  requestAnimationFrame(gameLoop);
}

// Timer
function countdown(){
  if(!gameStarted) return;
  timer-=0.016;
  if(timer<=0){ alert("Time's up! You Survived!"); document.location.reload(); gameStarted=false; }
  setTimeout(countdown,16);
}

// Start Game
startButton.addEventListener('click', ()=>{
  canvas.style.transform='scale(0.6)';
  setTimeout(()=>{
    titleScreen.style.display='none';
    gameStarted=true;
    rocketPlayer={x:700,y:280,width:20,height:20,vy:0,lives:3};
    rockets=[]; score=0; spawnCarsAndNPCs(); gameLoop(); countdown();
  },1000);
});

});
