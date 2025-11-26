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

// Images
const playerImg = new Image(); playerImg.src = 'images/player.png';
const npcImg = new Image(); npcImg.src = 'images/npc.png';
const carImg = new Image(); carImg.src = 'images/car.png';
const rocketImg = new Image(); rocketImg.src = 'images/rocket.png';

class Rocket {
  constructor(x, y, dx, dy){
    this.x = x; this.y = y; this.width = 8; this.height = 8;
    this.speed = 3; this.dx = dx; this.dy = dy;
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
    ctx.drawImage(rocketImg, this.x, this.y, this.width, this.height);
  }
  explode(){ this.exploding=true; explosionSound.play(); }
}

class Car {
  constructor(x,y){
    this.x=x; this.y=y; this.width=30; this.height=20;
    this.speed = Math.random() * 2 + 1; 
    this.vy=0; this.jumpCooldown=Math.random()*120+60; this.direction = Math.random()<0.5?-1:1;
    this.health=100;
  }
  update(){
    // Random horizontal movement
    this.x += this.direction * this.speed;
    if(Math.random() < 0.01) this.direction*=-1;

    // Jump occasionally
    this.jumpCooldown--;
    if(this.jumpCooldown<=0 && this.y>=780){
      this.vy = -10 - Math.random()*5;
      this.jumpCooldown = Math.random()*120+60;
    }

    this.vy +=0.4;
    this.y += this.vy;

    if(this.y>780){ this.y=780; this.vy=0;}
    if(this.x<0){ this.x=0; this.direction*=-1;}
    if(this.x>canvas.width-this.width){ this.x=canvas.width-this.width; this.direction*=-1;}
  }
  draw(){ ctx.drawImage(carImg,this.x,this.y,this.width,this.height);}
  takeDamage(dmg){ this.health-=dmg;}
}

class NPC {
  constructor(x,y){
    this.x=x; this.y=y; this.width=20; this.height=20;
    this.shootTimer=Math.random()*200+100; this.lives=3;
  }
  update(){
    let dir = Math.random()*2-1;
    this.x += dir*1.5;
    if(this.x<200) this.x=200;
    if(this.x>1400-this.width) this.x=1400-this.width;

    this.shootTimer--;
    if(this.shootTimer<=0 && cars.length>0){
      let nearestCar = null; let minDist=2000;
      for(let car of cars){
        let dist=Math.hypot(this.x-car.x,this.y-car.y);
        if(dist<minDist){ minDist=dist; nearestCar=car;}
      }
      if(nearestCar){
        let dx=nearestCar.x-this.x; let dy=nearestCar.y-this.y;
        let mag=Math.hypot(dx,dy); dx/=mag; dy/=mag;
        rockets.push(new Rocket(this.x+this.width/2,this.y+this.height/2, dx, dy));
        shootSound.play();
      }
      this.shootTimer=Math.random()*200+100;
    }
  }
  draw(){ ctx.drawImage(npcImg,this.x,this.y,this.width,this.height);}
}

// Game variables
let rockets=[], cars=[], npcs=[];
let rocketPlayer = {x:700,y:280,width:20,height:20,vy:0,lives:3};
let keys={}, score=0, gameStarted=false, points=0;
let wave=1, timer=60;

document.addEventListener('keydown', e=>{ keys[e.code]=true; });
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

// Player
function handlePlayer(){
  if(keys['KeyA'] && rocketPlayer.x>0) rocketPlayer.x-=4;
  if(keys['KeyD'] && rocketPlayer.x<canvas.width-rocketPlayer.width) rocketPlayer.x+=4;

  rocketPlayer.vy +=0.4;
  rocketPlayer.y += rocketPlayer.vy;

  let platY = 280, platX=200, platW=1200;
  if(rocketPlayer.y+rocketPlayer.height >= platY &&
     rocketPlayer.y+rocketPlayer.height <= platY +10 &&
     rocketPlayer.x+rocketPlayer.width > platX &&
     rocketPlayer.x < platX + platW &&
     rocketPlayer.vy>=0){
       rocketPlayer.y = platY - rocketPlayer.height;
       rocketPlayer.vy=0;
  }
  if(rocketPlayer.y+rocketPlayer.height>780){ rocketPlayer.y=780-rocketPlayer.height; rocketPlayer.vy=0;}
}

// Shoot
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

// Spawn
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
  ctx.drawImage(playerImg, rocketPlayer.x, rocketPlayer.y, rocketPlayer.width, rocketPlayer.height);

  for(let npc of npcs){ npc.update(); npc.draw(); }

  for(let i=rockets.length-1;i>=0;i--){
    rockets[i].update(); rockets[i].draw();
    for(let j=cars.length-1;j>=0;j--){
      let car = cars[j];
      if(rockets[i].x<car.x+car.width && rockets[i].x+rockets[i].width>car.x &&
         rockets[i].y<car.y+car.height && rockets[i].y+rockets[i].height>car.y){
           car.takeDamage(50); rockets[i].explode();
           setTimeout(()=>{ rockets.splice(i,1); },50);
           if(car.health<=0){ cars.splice(j,1); score+=10; points+=10; shopPointsDisplay.innerText=points;}
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
