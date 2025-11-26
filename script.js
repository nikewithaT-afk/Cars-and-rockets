// ===== Canvas Setup =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== Classes =====
class Rocket {
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 4;
    this.speed = 5;
  }
  draw(){ ctx.fillStyle = 'red'; ctx.fillRect(this.x, this.y, this.width, this.height); }
  update(){ this.x += this.speed; }
}

class Car {
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 15;
    this.speed = 2;
    this.health = 100;
  }
  draw(){ ctx.fillStyle = 'blue'; ctx.fillRect(this.x, this.y, this.width, this.height); }
  update(){ this.x += this.speed; }
  takeDamage(dmg){ this.health -= dmg; }
}

// ===== Game Variables =====
let rockets = [];
let cars = [new Car(50, 480), new Car(150, 480)];
let rocketPlayerX = 400;
let rocketPlayerY = 280;
let rocketSpeed = 5;

// ===== Draw Platforms & Ramps =====
function drawPlatforms() {
  // Main platform
  ctx.fillStyle = 'gray';
  ctx.fillRect(200, 300, 400, 20);
  // Ramps
  ctx.fillRect(100, 400, 100, 10);
  ctx.fillRect(600, 400, 100, 10);
}

// ===== Player Controls =====
const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup', e => { keys[e.code] = false; });

function handleRocketPlayer() {
  // Move left/right
  if(keys['KeyA'] && rocketPlayerX > 200) rocketPlayerX -= 4;
  if(keys['KeyD'] && rocketPlayerX < 590) rocketPlayerX += 4;
  // Shoot
  if(keys['Space'] && canShoot){
    rockets.push(new Rocket(rocketPlayerX + 10, rocketPlayerY));
    canShoot = false;
    setTimeout(()=>{ canShoot = true; }, 300); // cooldown
  }
}

// ===== Shooting Cooldown =====
let canShoot = true;

// ===== Game Loop =====
function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawPlatforms();

  // Draw Rocket Player
  ctx.fillStyle = 'red';
  ctx.fillRect(rocketPlayerX, rocketPlayerY, 20, 20);

  handleRocketPlayer();

  // Update and draw rockets
  for(let i = rockets.length-1; i>=0; i--){
    rockets[i].update();
    rockets[i].draw();

    // Check collision with cars
    for(let j = cars.length-1; j>=0; j--){
      let car = cars[j];
      if(rockets[i].x < car.x + car.width &&
         rockets[i].x + rockets[i].width > car.x &&
         rockets[i].y < car.y + car.height &&
         rockets[i].y + rockets[i].height > car.y){
           car.takeDamage(50);
           rockets.splice(i,1);
           if(car.health <= 0) cars.splice(j,1);
           break;
      }
    }

    // Remove rockets off-screen
    if(rockets[i] && rockets[i].x > canvas.width) rockets.splice(i,1);
  }

  // Update and draw cars
  for(let car of cars){
    car.update();
    car.draw();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
