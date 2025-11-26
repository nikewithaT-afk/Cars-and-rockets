// ===== Canvas Setup =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== DOM Elements =====
const titleScreen = document.getElementById('titleScreen');
const startButton = document.getElementById('startGame');
const scoreDisplay = document.getElementById('score');

// ===== Classes =====
class Rocket {
  constructor(x, y, target){
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 4;
    this.speed = 3; // slower projectile
    this.target = target; // car to follow
  }

  draw(){ ctx.fillStyle='red'; ctx.fillRect(this.x,this.y,this.width,this.height); }

  update(){
    if(this.target){
      let dx = this.target.x - this.x;
      let dy = this.target.y - this.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
}

class Car {
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 15;
    this.speed = Math.random()*2+1;
    this.health = 100;
    this.jumpTimer = Math.random()*100;
    this.vy = 0;
  }

  draw(){ ctx.fillStyle='blue'; ctx.fillRect(this.x,this.y,this.width,this.height); }

  update(){
    // horizontal random movement
    this.x += (Math.random()*2-1) * this.speed;

    // vertical jump mechanic
    this.jumpTimer--;
    if(this.jumpTimer <= 0){
      this.vy = -5; // jump up
      this.jumpTimer = Math.random()*200 + 50;
    }
    this.vy += 0.3; // gravity
    this.y += this.vy;

    // floor & platform collisions
    if(this.y > 480){
      this.y = 480;
      this.vy = 0;
    }
    if(this.y > 300 && this.y < 320 && this.x > 200 && this.x < 600){
      this.y = 300;
      this.vy = 0;
    }

    // keep inside arena boundaries
    if(this.x < 0) this.x = 0;
    if(this.x > canvas.width - this.width) this.x = canvas.width - this.width;
  }

  takeDamage(dmg){
    this.health -= dmg;
  }
}

// ===== Game Variables =====
let rockets = [];
let cars = [];
let rocketPlayer = { x: 500, y: 480, width: 20, height: 20, vy:0, health: 100};
let keys = {};
let canShoot = true;
let score = 0;
let gameStarted = false;

// ===== Platforms =====
function drawPlatforms(){
  ctx.fillStyle = 'gray';
  ctx.fillRect(200, 300, 400, 20); // main platform
}

// ===== Controls =====
document.addEventListener('keydown', e=>{ keys[e.code]=true; });
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

// ===== Player Functions =====
function handlePlayer(){
  // Left/Right movement
  if(keys['KeyA'] && rocketPlayer.x>0) rocketPlayer.x -=4;
  if(keys['KeyD'] && rocketPlayer.x<canvas.width - rocketPlayer.width) rocketPlayer.x +=4;

  // Jump
  if(keys['KeyW'] && rocketPlayer.y >= 480){
    rocketPlayer.vy = -8;
  }

  // Gravity
  rocketPlayer.vy += 0.4;
  rocketPlayer.y += rocketPlayer.vy;
  if(rocketPlayer.y > 480){ rocketPlayer.y = 480; rocketPlayer.vy = 0; }

  // Shooting: space + arrow keys for direction
  if(keys['Space'] && canShoot){
    let target = null;
    if(cars.length>0){
      // Lock onto closest car
      let minDist = Infinity;
      for(let car of cars){
        let dx = car.x - rocketPlayer.x;
        let dy = car.y - rocketPlayer.y;
        let dist = Math.sqrt(dx*dx+dy*dy);
        if(dist < minDist){
          minDist = dist;
          target = car;
        }
      }
    }
    rockets.push(new Rocket(rocketPlayer.x + 5, rocketPlayer.y, target));
    canShoot = false;
    setTimeout(()=>{ canShoot=true; },300);
  }
}

// ===== Spawn Cars =====
function spawnCars(){
  cars = [];
  for(let i=0;i<5;i++){
    let x = Math.random()*800 + 100;
    cars.push(new Car(x,480));
  }
}

// ===== Game Loop =====
function gameLoop(){
  if(!gameStarted) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawPlatforms();

  // Draw player
  ctx.fillStyle='red';
  ctx.fillRect(rocketPlayer.x,rocketPlayer.y,rocketPlayer.width,rocketPlayer.height);

  handlePlayer();

  // Update rockets
  for(let i = rockets.length-1;i>=0;i--){
    rockets[i].update();
    rockets[i].draw();

    // Collision with cars
    for(let j = cars.length-1;j>=0;j--){
      let car = cars[j];
      if(rockets[i].x < car.x+car.width &&
         rockets[i].x+rockets[i].width > car.x &&
         rockets[i].y < car.y+car.height &&
         rockets[i].y+rockets[i].height > car.y){
           car.takeDamage(50);
           rockets.splice(i,1);
           if(car.health <=0){
             cars.splice(j,1);
             score +=10;
           }
           break;
      }
    }

    if(rockets[i] && (rockets[i].x < 0 || rockets[i].x > canvas.width || rockets[i].y <0 || rockets[i].y>canvas.height)){
      rockets.splice(i,1);
    }
  }

  // Update cars
  for(let car of cars){
    car.update();
  }

  // Update score & health display
  scoreDisplay.innerText = `Score: ${score} | Rocket Health: ${rocketPlayer.health}`;

  // Win condition
  if(cars.length==0){
    setTimeout(()=>{ alert("You Win!"); document.location.reload(); },100);
    gameStarted=false;
  }

  // Player lose condition
  if(rocketPlayer.health <=0){
    setTimeout(()=>{ alert("Game Over!"); document.location.reload(); },100);
    gameStarted=false;
  }

  requestAnimationFrame(gameLoop);
}

// ===== Start Button =====
startButton.addEventListener('click', ()=>{
  titleScreen.style.display='none';
  gameStarted=true;
  rocketPlayer = { x:500, y:480, width:20, height:20, vy:0, health:100};
  rockets=[];
  score=0;
  spawnCars();
  gameLoop();
});
