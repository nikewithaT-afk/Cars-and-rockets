// ===== Canvas Setup =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== DOM Elements =====
const titleScreen = document.getElementById('titleScreen');
const startButton = document.getElementById('startGame');
const scoreDisplay = document.getElementById('score');
const healthDisplay = document.getElementById('health');

// ===== Assets / Sounds =====
let shootSound = new Audio('https://freesound.org/data/previews/146/146724_2615113-lq.mp3');
let explosionSound = new Audio('https://freesound.org/data/previews/235/235968_3988955-lq.mp3');

// ===== Classes =====
class Rocket {
  constructor(x, y, dx, dy){
    this.x = x; this.y = y;
    this.width = 10; this.height = 4;
    this.speed = 3; this.dx = dx; this.dy = dy;
    this.exploding = false; this.explosionFrame = 0;
  }
  update(){
    if(this.exploding){ this.explosionFrame++; return; }
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
  }
  draw(){
    if(this.exploding){
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(this.x+5,this.y+2,this.explosionFrame*2,0,Math.PI*2);
      ctx.fill();
      return;
    }
    ctx.fillStyle='red'; ctx.fillRect(this.x,this.y,this.width,this.height);
  }
  explode(){ this.exploding=true; explosionSound.play(); }
}

class Car {
  constructor(x,y){
    this.x=x; this.y=y; this.width=30; this.height=15;
    this.speed=Math.random()*2+1; this.health=100;
    this.vy=0; this.jumpTimer=Math.random()*150+50;
  }
  update(){
    this.x += (Math.random()*2-1)*this.speed;
    this.jumpTimer--;
    if(this.jumpTimer<=0){ this.vy=-5; this.jumpTimer=Math.random()*200+50; }
    this.vy+=0.3; this.y+=this.vy;
    if(this.y>480){ this.y=480; this.vy=0; }
    if(this.y>300 && this.y<320 && this.x>200 && this.x<600){ this.y=300; this.vy=0; }
    if(this.x<0)this.x=0;if(this.x>canvas.width-this.width)this.x=canvas.width-this.width;
    if(this.y<0)this.y=0;if(this.y>480)this.y=480;
  }
  draw(){ ctx.fillStyle='blue'; ctx.fillRect(this.x,this.y,this.width,this.height);}
  takeDamage(dmg){ this.health-=dmg;}
}

// ===== Game Variables =====
let rockets=[], cars=[];
let rocketPlayer = {x:500, y:480, width:20, height:20, vy:0, health:100};
let keys={}, canShoot=true, score=0, gameStarted=false;

// ===== Platforms =====
function drawPlatforms(){
  ctx.fillStyle='gray';
  ctx.fillRect(200,300,400,20);
}

// ===== Controls =====
document.addEventListener('keydown', e=>{ keys[e.code]=true; });
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

// ===== Player Functions =====
function handlePlayer(){
  if(keys['KeyA'] && rocketPlayer.x>0) rocketPlayer.x -=4;
  if(keys['KeyD'] && rocketPlayer.x<canvas.width-rocketPlayer.width) rocketPlayer.x+=4;
  if(keys['KeyW'] && rocketPlayer.y>=480) rocketPlayer.vy=-8;
  rocketPlayer.vy+=0.4; rocketPlayer.y+=rocketPlayer.vy;
  if(rocketPlayer.y>480){rocketPlayer.y=480; rocketPlayer.vy=0;}

  if(keys['Space'] && canShoot){
    let dx=0, dy=0;
    if(keys['ArrowUp']) dy=-1;
    else if(keys['ArrowDown']) dy=1;
    else if(keys['ArrowLeft']) dx=-1;
    else dx=1; // default right
    rockets.push(new Rocket(rocketPlayer.x+5, rocketPlayer.y, dx, dy));
    canShoot=false; shootSound.play();
    setTimeout(()=>{ canShoot=true; },300);
  }
}

// ===== Spawn Cars =====
function spawnCars(){
  cars=[];
  for(let i=0;i<5;i++){
    let x=Math.random()*800+100; cars.push(new Car(x,480));
  }
}

// ===== Game Loop =====
function gameLoop(){
  if(!gameStarted) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawPlatforms();

  ctx.fillStyle='red'; ctx.fillRect(rocketPlayer.x,rocketPlayer.y,rocketPlayer.width,rocketPlayer.height);

  handlePlayer();

  // Rockets
  for(let i=rockets.length-1;i>=0;i--){
    rockets[i].update();
    rockets[i].draw();
    for(let j=cars.length-1;j>=0;j--){
      let car=cars[j];
      if(rockets[i].x<car.x+car.width &&
         rockets[i].x+rockets[i].width>car.x &&
         rockets[i].y<car.y+car.height &&
         rockets[i].y+rockets[i].height>car.y){
           car.takeDamage(50); rockets[i].explode();
           setTimeout(()=>{rockets.splice(i,1);},50);
           if(car.health<=0){ cars.splice(j,1); score+=10;}
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

// ===== Start Button =====
startButton.addEventListener('click', ()=>{
  titleScreen.style.display='none';
  gameStarted=true;
  rocketPlayer={x:500,y:480,width:20,height:20,vy:0,health:100};
  rockets=[]; score=0; spawnCars(); gameLoop();
});
