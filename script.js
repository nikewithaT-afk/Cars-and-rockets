// --- Classes ---

class Rocket {
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 4;
    this.speed = 5;
  }

  draw() {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    this.x += this.speed;
  }
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

  draw() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    this.x += this.speed;
  }

  takeDamage(dmg) {
    this.health -= dmg;
  }
}

// --- Variables ---

let rockets = [];
let cars = [new Car(50, 480), new Car(150,480)];

// --- Canvas setup ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game loop ---
function gameLoop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw and update cars
  for (let car of cars){
    car.update();
    car.draw();
  }

  // Draw and update rockets
  for (let rocket of rockets){
    rocket.update();
    rocket.draw();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
