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

    // Floor
    if(this.y>480){ this.y=480; this.vy=0; }
    // Platform
    if(this.y>300 && this.y<320 && this.x>200 && this.x<600){ this.y=300; this.vy=0; }

    // Boundaries
    if(this.x<0)this.x=0;
    if(this.x>canvas.width-this.width)this.x=canvas.width-this.width;
    if(this.y<0)this.y=0;
    if(this.y>480)this.y=480;
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
    // Slight movement on platform
    this.x += (Math.random()*2-1);
    if(this.x<200) this.x=200;
    if(this.x>580) this.x=580;
    
    // Shooting
    this.shootTimer--;
    if(this.shootTimer<=0){
      let nearestCar = null;
      let minDist = 1000;
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
let rocketPlayer = {x:500, y:480, width:20, height:20, vy:0, health:100};
let keys
