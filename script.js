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
  draw(){ ctx.fillStyle='red'; ctx.fillRect(this.x, this.y, this.width, this.height); }
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
  draw(){ ctx.fillStyle='blue'; ctx.fillRect(this.x, this.y, this.width, this.height); }
  update(){
    // Move right
    this.x += this.speed;

    // Simple ramp logic
    if(this.x > 100 && this.x < 200) this.y = 400 - ((this.x-100)/100)*100; // left ramp slope
    else if(this.x > 600 && this.x < 700) this.y = 400 - ((700-this.x)/100)*100; // right ramp slope
    else if(this.x >= 200 && this.x <= 600) this.y = 480; // ground
  }
  takeDamage(dmg){ this.health -= dmg; }
}

// ===== Game Variables =====
let rockets = [];
let cars = [new Car(50,480), new Car(150,480), new Car(700,480)];
let rocketPlayerX = 400;
let rocketPlayerY = 280;
let rocketSpeed = 5;
let rocketHealth = 100;
let score = 0;

// ===== Draw Platforms & Ramps =====
function drawPlatforms() {
  ctx.fillStyle = 'gray';
  ctx.fillRect(200, 300, 400, 20); // main platform
  ctx.fillRect(100, 400, 100, 10); // left ramp
  ctx.fillRect(600, 400, 100, 10); // right ramp
}

// ===== Player Controls =====
const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup', e => { keys[e.code] = false; });

function handleRocketPlayer() {
  // Move left/right
  if(keys['KeyA'] && rocketPlayerX > 200) rocketPlayerX -= 4;
  if(keys['KeyD'] && rocketPlayerX < 580) rocketPlayerX += 4;

  // Shoot rocket
  if(keys['Space'] && canShoot){
    rockets.push(new Rocket(rocketPlayerX + 5, rocketPlayerY));
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
           if(car.health <= 0){
             cars.splice(j,1);
             score += 10;
           }
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

    // If car reaches platform, damage rocket player
    if(car.y <= 300 && car.x >= rocketPlayerX && car.x <= rocketPlayerX + 20){
      rocketHealth -= 10;
      car.x = -50; // reset car offscreen
    }
  }

  // Update score and health display
  document.getElementById('score').innerText = `Score: ${score} | Rocket Health: ${rocketHealth}`;

  // Check game over
  if(rocketHealth <= 0){
    alert("Game Over! Final Score: " + score);
    document.location.reload();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
