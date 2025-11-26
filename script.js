// ===== Canvas Setup =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== DOM Elements =====
const titleScreen = document.getElementById('titleScreen');
const startButton = document.getElementById('startGame');
const scoreDisplay = document.getElementById('score');

// ===== Classes =====
class Rocket {
  constructor(x, y, dx, dy){
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 4;
    this.speed = 3; // slower projectile
    this.dx = dx;
    this.dy = dy;
  }

  draw(){ ctx.fillStyle='red'; ctx.fillRect(this.x,this.y,this.width,this.height); }

  update(){
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
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
    this.jumpTimer = Math.random()*150 + 50;
    this.vy = 0;
  }

  draw(){ ctx.fillStyle='blue'; ctx.fillRect(this.x,this.y,this.width,this.height); }

  update(){
    // horizontal movement
    this.x += (Math.random()*2-1) * this.speed;

    // jumping
    this.jumpTimer--;
    if(this.jumpTimer <=0){
      this.vy = -5;
      this.jumpTimer = Math.random()*200 + 50;
    }
    this.vy += 0.3; // gravity
    this.y += this.vy;

    // Floor collision
    if(this.y > 480){
      this.y = 480;
      this.vy = 0;
    }

    // Platform collision
    if(this.y > 300 && this.y < 320 && this.x > 200 && this.x < 600){
      this.y = 300;
      this.vy = 0;
    }

    // Arena boundaries
    if(this.x < 0) this.x = 0;
    if(this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    if(this.y < 0) this.y = 0;
    if(this.y > 480) this.y = 480;
  }

  takeDamage(dmg){ this.health -= dmg; }
}

// ===== Game Variables =====
let rockets = [];
let cars = [];
let rocketPlayer = { x: 500, y: 480, width: 20, height: 20, vy:0, health:100};
let keys = {};
let canShoot = true;
let score = 0;
let gameStarted = false;

// ===== Platforms =====
function drawPlatforms(){
  ctx.fillStyle = 'gray';
  ctx.fillRect(200, 300, 400, 20);
}

// ===== Controls =====
document.addEventListener('keydown', e=>{ keys[e.code]=true; });
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

// ===== Player Functions =====
function handlePlayer(){
  // Left/Right movement
  if(keys['KeyA'] && rocketPlayer.x>0) rocketPlayer.x -=4;
  if(keys['KeyD'] && rocketPlayer.x<canvas.width - rocketPlayer.widt
