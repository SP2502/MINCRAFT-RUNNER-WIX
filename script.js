"use strict";

/* =========================================================
   CREEPER RUNNER
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;


/* =========================================================
   HTML
========================================================= */

const hud = document.getElementById("hud");

const start = document.getElementById("start");
const pause = document.getElementById("pause");
const gameOver = document.getElementById("gameOver");
const win = document.getElementById("win");

const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const gemsText = document.getElementById("gems");

const missionText = document.getElementById("missionText");
const barFill = document.getElementById("barFill");

const startBtn = document.getElementById("startBtn");
const resumeBtn = document.getElementById("resumeBtn");
const pauseRestartBtn = document.getElementById("pauseRestartBtn");
const againBtn = document.getElementById("againBtn");
const winAgainBtn = document.getElementById("winAgainBtn");

const pauseBtn = document.getElementById("pauseBtn");
const soundBtn = document.getElementById("soundBtn");
const jumpBtn = document.getElementById("jumpBtn");

const finalScore = document.getElementById("finalScore");
const finalGems = document.getElementById("finalGems");
const finalBest = document.getElementById("finalBest");

const winScore = document.getElementById("winScore");
const winGems = document.getElementById("winGems");
const winBest = document.getElementById("winBest");


/* =========================================================
   SETTINGS
========================================================= */

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GROUND = 470;
const WIN_SCORE = 200;

const difficulties = {

  easy: {
    speed: 4.2,
    spawn: 1500,
    gravity: 1.05,
    jump: -18,
    speedUp: 0.0015
  },

  medium: {
    speed: 5.5,
    spawn: 1250,
    gravity: 1.12,
    jump: -18,
    speedUp: 0.003
  },

  hard: {
    speed: 7,
    spawn: 980,
    gravity: 1.18,
    jump: -18.5,
    speedUp: 0.005
  },

  veryHard: {
    speed: 8.5,
    spawn: 760,
    gravity: 1.22,
    jump: -19,
    speedUp: 0.007
  }

};


let difficulty = "medium";
let settings = difficulties[difficulty];


/* =========================================================
   GAME
========================================================= */

let state = "menu";

let score = 0;
let gems = 0;
let best = Number(localStorage.getItem("creeperBest") || 0);

let speed = settings.speed;

let spawnClock = 0;
let worldClock = 0;

let lastTime = 0;

let soundOn = true;

let shake = 0;


/* =========================================================
   POWER UPS
========================================================= */

let shield = 0;
let slowTime = 0;
let magnet = 0;


/* =========================================================
   GAME OBJECTS
========================================================= */

let obstacles = [];
let gemsList = [];
let powerUps = [];
let particles = [];


/* =========================================================
   PLAYER
========================================================= */

const player = {

  x: 120,
  y: GROUND - 44,

  width: 44,
  height: 44,

  vy: 0,

  grounded: true,

  jump() {

    if (state !== "playing") return;

    if (!this.grounded) return;

    this.vy = settings.jump;
    this.grounded = false;

    dust(this.x + 22, GROUND);

    sound(430, .07);

  },

  update(dt) {

    const s = dt / 16.67;

    this.vy += settings.gravity * s;
    this.y += this.vy * s;

    if (this.y + this.height >= GROUND) {

      this.y = GROUND - this.height;

      if (!this.grounded) {
        dust(this.x + 22, GROUND);
      }

      this.vy = 0;
      this.grounded = true;
    }

  },

  draw() {

    drawCreeper(
      this.x,
      this.y
    );

  }

};


/* =========================================================
   OBSTACLE
========================================================= */

class Obstacle {

  constructor(type) {

    this.type = type;

    this.x = WIDTH + 40;

    this.bob = Math.random() * 10;

    if (type === "cactus") {

      this.width = 34;
      this.height = 55;

    } else if (type === "tnt") {

      this.width = 44;
      this.height = 44;

    } else if (type === "zombie") {

      this.width = 43;
      this.height = 58;

    } else {

      this.width = 45;
      this.height = 43;

    }

    this.y =
      GROUND - this.height;

  }

  update(dt) {

    const s = dt / 16.67;

    const slow =
      slowTime > 0 ? .55 : 1;

    this.x -=
      speed * slow * s;

    this.bob += dt * .006;

  }

  draw() {

    if (this.type === "cat") {

      drawCat(
        this.x,
        this.y,
        this.bob
      );

    }

    if (this.type === "cactus") {

      drawCactus(
        this.x,
        this.y
      );

    }

    if (this.type === "tnt") {

      drawTnt(
        this.x,
        this.y
      );

    }

    if (this.type === "zombie") {

      drawZombie(
        this.x,
        this.y,
        this.bob
      );

    }

  }

}


/* =========================================================
   GEM
========================================================= */

class Gem {

  constructor() {

    this.x = WIDTH + 30;

    this.y =
      random(
        270,
        GROUND - 70
      );

    this.spin =
      Math.random() * 6;

    this.dead = false;

  }

  update(dt) {

    const slow =
      slowTime > 0 ? .55 : 1;

    this.x -=
      speed *
      .9 *
      slow *
      dt /
      16.67;

    this.spin +=
      dt * .006;


    if (magnet > 0) {

      const dx =
        player.x + 22 -
        this.x;

      const dy =
        player.y + 22 -
        this.y;

      const distance =
        Math.hypot(dx, dy);

      if (distance < 180) {

        this.x += dx * .08;
        this.y += dy * .08;

      }

    }

  }

  draw() {

    ctx.save();

    ctx.translate(
      this.x,
      this.y
    );

    ctx.rotate(this.spin);

    ctx.fillStyle = "#55d85a";

    ctx.beginPath();

    ctx.moveTo(0, -16);
    ctx.lineTo(14, 0);
    ctx.lineTo(0, 17);
    ctx.lineTo(-14, 0);

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle = "#b8ff9c";

    ctx.fillRect(
      -4,
      -9,
      5,
      7
    );

    ctx.restore();

  }

}


/* =========================================================
   POWER UP
========================================================= */

class PowerUp {

  constructor() {

    const types = [
      "shield",
      "slow",
      "magnet"
    ];

    this.type =
      types[
        Math.floor(
          Math.random() * types.length
        )
      ];

    this.x = WIDTH + 40;

    this.y =
      random(260, 370);

    this.bob =
      Math.random() * 6;

  }

  update(dt) {

    this.x -=
      speed *
      .75 *
      dt /
      16.67;

    this.bob +=
      dt * .005;

  }

  draw() {

    const colors = {
      shield: "#4da8ff",
      slow: "#e5ce49",
      magnet: "#ff5e9c"
    };

    const letters = {
      shield: "S",
      slow: "T",
      magnet: "M"
    };

    const y =
      this.y +
      Math.sin(this.bob) * 4;

    ctx.fillStyle =
      colors[this.type];

    ctx.fillRect(
      this.x - 18,
      y - 18,
      36,
      36
    );

    ctx.fillStyle = "#111";

    ctx.font =
      "14px 'Press Start 2P'";

    ctx.textAlign = "center";

    ctx.fillText(
      letters[this.type],
      this.x,
      y + 5
    );

    ctx.textAlign = "left";

  }

}


/* =========================================================
   PARTICLES
========================================================= */

class Particle {

  constructor(
    x,
    y,
    color = "#8bd450"
  ) {

    this.x = x;
    this.y = y;

    this.vx = random(-4, 4);
    this.vy = random(-5, 1);

    this.life =
      random(300, 700);

    this.maxLife =
      this.life;

    this.size =
      random(3, 7);

    this.color =
      color;

  }

  update(dt) {

    const s =
      dt / 16.67;

    this.x +=
      this.vx * s;

    this.y +=
      this.vy * s;

    this.vy +=
      .18 * s;

    this.life -= dt;

  }

  draw() {

    ctx.globalAlpha =
      Math.max(
        0,
        this.life /
        this.maxLife
      );

    ctx.fillStyle =
      this.color;

    ctx.fillRect(
      this.x,
      this.y,
      this.size,
      this.size
    );

    ctx.globalAlpha = 1;

  }

}


/* =========================================================
   START / RESET
========================================================= */

function resetGame() {

  score = 0;
  gems = 0;

  speed =
    difficulties[difficulty].speed;

  settings =
    difficulties[difficulty];

  spawnClock = 0;
  worldClock = 0;

  shield = 0;
  slowTime = 0;
  magnet = 0;

  obstacles = [];
  gemsList = [];
  powerUps = [];
  particles = [];

  player.x = 120;
  player.y = GROUND - 44;
  player.vy = 0;
  player.grounded = true;

  shake = 0;

  updateHud();

}


/* =========================================================
   START
========================================================= */

function startGame() {

  resetGame();

  state = "playing";

  start.classList.add("hide");
  pause.classList.add("hide");
  gameOver.classList.add("hide");
  win.classList.add("hide");

  hud.classList.remove("hide");

  lastTime =
    performance.now();

  sound(500, .08);
  setTimeout(
    () => sound(700, .08),
    80
  );

}


/* =========================================================
   PAUSE
========================================================= */

function pauseGame() {

  if (state !== "playing") return;

  state = "paused";

  pause.classList.remove("hide");

}


function resumeGame() {

  if (state !== "paused") return;

  state = "playing";

  pause.classList.add("hide");

  lastTime =
    performance.now();

}


/* =========================================================
   GAME OVER
========================================================= */

function loseGame() {

  if (state !== "playing") return;

  state = "gameover";

  shake = 14;

  boom(
    player.x + 22,
    player.y + 22
  );

  const result =
    Math.floor(score);

  if (result > best) {

    best = result;

    localStorage.setItem(
      "creeperBest",
      best
    );

  }

  finalScore.textContent = result;
  finalGems.textContent = gems;
  finalBest.textContent = best;

  gameOver.classList.remove("hide");

  sound(140, .25);

}


/* =========================================================
   WIN
========================================================= */

function winGame() {

  if (state !== "playing") return;

  state = "win";

  score = WIN_SCORE;

  if (score > best) {

    best = score;

    localStorage.setItem(
      "creeperBest",
      best
    );

  }

  winScore.textContent =
    Math.floor(score);

  winGems.textContent =
    gems;

  winBest.textContent =
    best;

  win.classList.remove("hide");

  sound(600, .1);

  setTimeout(
    () => sound(800, .1),
    120
  );

  setTimeout(
    () => sound(1000, .2),
    240
  );

}


/* =========================================================
   SPAWN
========================================================= */

function spawnThings() {

  let type = "cat";

  const r = Math.random();

  if (
    difficulty === "hard" ||
    difficulty === "veryHard"
  ) {

    if (r > .91) {

      type = "zombie";

    } else if (r > .82) {

      type = "tnt";

    } else if (r > .70) {

      type = "cactus";

    }

  } else {

    if (r > .88) {
      type = "tnt";
    }

    if (r > .95) {
      type = "cactus";
    }

  }


  obstacles.push(
    new Obstacle(type)
  );


  if (Math.random() < .55) {

    gemsList.push(
      new Gem()
    );

  }


  if (Math.random() < .08) {

    powerUps.push(
      new PowerUp()
    );

  }

}


/* =========================================================
   COLLISION
========================================================= */

function hit(a, b) {

  return (
    a.x <
    b.x + b.width &&

    a.x + a.width >
    b.x &&

    a.y <
    b.y + b.height &&

    a.y + a.height >
    b.y
  );

}


function playerBox() {

  return {

    x: player.x + 8,
    y: player.y + 5,

    width: player.width - 16,
    height: player.height - 8

  };

}


/* =========================================================
   UPDATE
========================================================= */

function update(dt) {

  worldClock += dt;

  player.update(dt);

  score +=
    dt * .006;

  speed +=
    settings.speedUp * dt;

  spawnClock += dt;


  let spawnEvery =
    settings.spawn *
    Math.min(
      1,
      settings.speed / speed
    );

  if (
    spawnClock >= spawnEvery
  ) {

    spawnThings();

    spawnClock = 0;

  }


  obstacles.forEach(
    item => item.update(dt)
  );

  gemsList.forEach(
    item => item.update(dt)
  );

  powerUps.forEach(
    item => item.update(dt)
  );


  particles.forEach(
    item => item.update(dt)
  );


  shield =
    Math.max(0, shield - dt);

  slowTime =
    Math.max(0, slowTime - dt);

  magnet =
    Math.max(0, magnet - dt);


  checkHits();

  cleanThings();

  updateHud();


  if (
    Math.floor(score) >=
    WIN_SCORE
  ) {

    winGame();

  }

}


/* =========================================================
   COLLISION CHECKS
========================================================= */

function checkHits() {

  const box =
    playerBox();


  // Enemies
  for (
    let i = obstacles.length - 1;
    i >= 0;
    i--
  ) {

    const obstacle =
      obstacles[i];

    const b = {

      x:
        obstacle.x + 5,

      y:
        obstacle.y + 5,

      width:
        obstacle.width - 10,

      height:
        obstacle.height - 5

    };


    if (
      hit(box, b)
    ) {

      if (shield > 0) {

        shield = 0;

        obstacles.splice(
          i,
          1
        );

        boom(
          obstacle.x,
          obstacle.y
        );

        shake = 9;

        sound(220, .12);

      } else {

        loseGame();

        return;

      }

    }

  }


  // Gems
  gemsList.forEach(
    gem => {

      if (
        gem.dead
      ) {
        return;
      }

      const b = {

        x: gem.x - 14,
        y: gem.y - 14,
        width: 28,
        height: 28

      };

      if (
        hit(box, b)
      ) {

        gem.dead = true;

        gems++;

        score += 2;

        boom(
          gem.x,
          gem.y,
          "#55d85a"
        );

        sound(900, .06);

      }

    }
  );


  // Power ups
  powerUps.forEach(
    power => {

      const b = {

        x: power.x - 18,
        y: power.y - 18,
        width: 36,
        height: 36

      };

      if (
        hit(box, b)
      ) {

        if (
          power.type === "shield"
        ) {

          shield = 7000;

        }

        if (
          power.type === "slow"
        ) {

          slowTime = 6000;

        }

        if (
          power.type === "magnet"
        ) {

          magnet = 8000;

        }

        power.x = -100;

        sound(700, .1);

      }

    }
  );

}


/* =========================================================
   CLEAN
========================================================= */

function cleanThings() {

  obstacles =
    obstacles.filter(
      item =>
        item.x + item.width > -80
    );

  gemsList =
    gemsList.filter(
      item =>
        item.x > -50 &&
        !item.dead
    );

  powerUps =
    powerUps.filter(
      item =>
        item.x > -70
    );

  particles =
    particles.filter(
      item =>
        item.life > 0
    );

}


/* =========================================================
   HUD
========================================================= */

function updateHud() {

  const shown =
    Math.floor(score);

  scoreText.textContent =
    shown;

  bestText.textContent =
    best;

  gemsText.textContent =
    gems;

  const progress =
    Math.min(
      100,
      shown /
      WIN_SCORE *
      100
    );

  barFill.style.width =
    progress + "%";

  missionText.textContent =
    Math.min(
      shown,
      WIN_SCORE
    ) +
    " / " +
    WIN_SCORE;

}


/* =========================================================
   DRAW
========================================================= */

function draw() {

  ctx.clearRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );


  ctx.save();


  if (shake > 0) {

    ctx.translate(
      random(-shake, shake),
      random(-shake, shake)
    );

    shake *= .88;

    if (shake < .1) {
      shake = 0;
    }

  }


  drawWorld();


  gemsList.forEach(
    item => item.draw()
  );

  powerUps.forEach(
    item => item.draw()
  );

  obstacles.forEach(
    item => item.draw()
  );


  player.draw();


  particles.forEach(
    item => item.draw()
  );


  if (shield > 0) {

    ctx.strokeStyle =
      "rgba(70,170,255,.8)";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.arc(
      player.x + 22,
      player.y + 22,
      34,
      0,
      Math.PI * 2
    );

    ctx.stroke();

  }


  ctx.restore();

}


/* =========================================================
   WORLD
========================================================= */

function drawWorld() {

  const night =
    worldClock % 30000 > 20000;


  const sky =
    ctx.createLinearGradient(
      0,
      0,
      0,
      HEIGHT
    );


  if (night) {

    sky.addColorStop(
      0,
      "#111a31"
    );

    sky.addColorStop(
      .7,
      "#344665"
    );

  } else {

    sky.addColorStop(
      0,
      "#61b8e7"
    );

    sky.addColorStop(
      .7,
      "#c5edf8"
    );

  }


  ctx.fillStyle = sky;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );


  // Sun / moon
  ctx.fillStyle =
    night
      ? "#e8ecff"
      : "#fff0a1";

  ctx.fillRect(
    780,
    70,
    36,
    36
  );


  // Clouds
  if (!night) {

    drawCloud(
      100 -
      (worldClock * .015) % 1100,
      80,
      110
    );

    drawCloud(
      500 -
      (worldClock * .009) % 1100,
      55,
      140
    );

  }


  // Hills
  ctx.fillStyle =
    night
      ? "#3a5439"
      : "#78a447";

  ctx.beginPath();

  ctx.moveTo(0, 320);
  ctx.lineTo(130, 230);
  ctx.lineTo(270, 315);
  ctx.lineTo(420, 220);
  ctx.lineTo(590, 310);
  ctx.lineTo(740, 225);
  ctx.lineTo(WIDTH, 300);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);

  ctx.closePath();

  ctx.fill();


  // Ground
  ctx.fillStyle =
    "#76522b";

  ctx.fillRect(
    0,
    GROUND,
    WIDTH,
    HEIGHT - GROUND
  );


  // Grass
  ctx.fillStyle =
    "#4d8e29";

  ctx.fillRect(
    0,
    GROUND,
    WIDTH,
    9
  );


  // Ground pixels
  ctx.fillStyle =
    "#5b3f21";

  const offset =
    (worldClock * speed * .02) %
    35;

  for (
    let x = -offset;
    x < WIDTH;
    x += 35
  ) {

    ctx.fillRect(
      x,
      GROUND + 23,
      11,
      5
    );

    ctx.fillRect(
      x + 17,
      GROUND + 43,
      8,
      4
    );

  }

}


/* =========================================================
   CLOUD
========================================================= */

function drawCloud(
  x,
  y,
  width
) {

  ctx.fillStyle =
    "rgba(255,255,255,.8)";

  ctx.fillRect(
    x,
    y,
    width,
    17
  );

  ctx.fillRect(
    x + width * .18,
    y - 11,
    width * .3,
    28
  );

  ctx.fillRect(
    x + width * .52,
    y - 5,
    width * .35,
    22
  );

}


/* =========================================================
   CREEPER
========================================================= */

function drawCreeper(
  x,
  y
) {

  ctx.fillStyle =
    "#55a936";

  ctx.fillRect(
    x,
    y,
    44,
    44
  );


  // Light side
  ctx.fillStyle =
    "#70c249";

  ctx.fillRect(
    x,
    y,
    7,
    44
  );


  // Dark pixels
  ctx.fillStyle =
    "#376d22";

  ctx.fillRect(
    x + 34,
    y + 4,
    10,
    12
  );

  ctx.fillRect(
    x + 3,
    y + 35,
    11,
    9
  );


  // Face
  ctx.fillStyle =
    "#101510";

  ctx.fillRect(
    x + 7,
    y + 9,
    10,
    10
  );

  ctx.fillRect(
    x + 27,
    y + 9,
    10,
    10
  );

  ctx.fillRect(
    x + 17,
    y + 19,
    10,
    8
  );

  ctx.fillRect(
    x + 11,
    y + 25,
    9,
    12
  );

  ctx.fillRect(
    x + 25,
    y + 25,
    9,
    12
  );


  ctx.strokeStyle =
    "#245017";

  ctx.lineWidth = 2;

  ctx.strokeRect(
    x,
    y,
    44,
    44
  );

}


/* =========================================================
   CAT
========================================================= */

function drawCat(
  x,
  y,
  t
) {

  const bob =
    Math.sin(t) * 2;


  ctx.fillStyle =
    "#c98240";


  // body
  ctx.fillRect(
    x + 5,
    y + 19 + bob,
    34,
    21
  );


  // head
  ctx.fillRect(
    x + 6,
    y + 4 + bob,
    32,
    27
  );


  // ears
  ctx.beginPath();

  ctx.moveTo(
    x + 7,
    y + 9
  );

  ctx.lineTo(
    x + 10,
    y - 3
  );

  ctx.lineTo(
    x + 19,
    y + 8
  );

  ctx.fill();


  ctx.beginPath();

  ctx.moveTo(
    x + 25,
    y + 8
  );

  ctx.lineTo(
    x + 35,
    y - 3
  );

  ctx.lineTo(
    x + 38,
    y + 10
  );

  ctx.fill();


  // face
  ctx.fillStyle =
    "#111";

  ctx.fillRect(
    x + 13,
    y + 13 + bob,
    5,
    5
  );

  ctx.fillRect(
    x + 26,
    y + 13 + bob,
    5,
    5
  );

  ctx.fillRect(
    x + 20,
    y + 19 + bob,
    5,
    4
  );


  // legs
  ctx.fillStyle =
    "#985b2b";

  ctx.fillRect(
    x + 8,
    y + 36,
    7,
    8
  );

  ctx.fillRect(
    x + 29,
    y + 36,
    7,
    8
  );


  // tail
  ctx.strokeStyle =
    "#985b2b";

  ctx.lineWidth = 5;

  ctx.beginPath();

  ctx.moveTo(
    x + 38,
    y + 27
  );

  ctx.quadraticCurveTo(
    x + 53,
    y + 7,
    x + 46,
    y
  );

  ctx.stroke();

}


/* =========================================================
   CACTUS
========================================================= */

function drawCactus(
  x,
  y
) {

  ctx.fillStyle =
    "#258c3b";

  ctx.fillRect(
    x + 9,
    y,
    17,
    55
  );

  ctx.fillRect(
    x,
    y + 20,
    10,
    8
  );

  ctx.fillRect(
    x + 26,
    y + 30,
    9,
    8
  );

  ctx.fillRect(
    x + 2,
    y + 12,
    7,
    19
  );

}


/* =========================================================
   TNT
========================================================= */

function drawTnt(
  x,
  y
) {

  ctx.fillStyle =
    "#b72e28";

  ctx.fillRect(
    x,
    y,
    44,
    44
  );


  ctx.fillStyle =
    "#f0e2b2";

  ctx.fillRect(
    x,
    y + 14,
    44,
    16
  );


  ctx.fillStyle =
    "#111";

  ctx.font =
    "7px 'Press Start 2P'";

  ctx.textAlign =
    "center";

  ctx.fillText(
    "TNT",
    x + 22,
    y + 25
  );

  ctx.textAlign =
    "left";

}


/* =========================================================
   ZOMBIE
========================================================= */

function drawZombie(
  x,
  y,
  t
) {

  const walk =
    Math.sin(t * 2) * 3;


  ctx.fillStyle =
    "#6e9e5a";

  ctx.fillRect(
    x + 6,
    y,
    31,
    28
  );


  ctx.fillStyle =
    "#447f92";

  ctx.fillRect(
    x + 8,
    y + 27,
    27,
    23
  );


  ctx.fillStyle =
    "#354181";

  ctx.fillRect(
    x + 8,
    y + 49,
    10,
    9
  );

  ctx.fillRect(
    x + 25,
    y + 49,
    10,
    9
  );


  ctx.fillStyle =
    "#111";

  ctx.fillRect(
    x + 12,
    y + 10,
    5,
    5
  );

  ctx.fillRect(
    x + 26,
    y + 10,
    5,
    5
  );


  ctx.fillStyle =
    "#6e9e5a";

  ctx.fillRect(
    x + 1,
    y + 28 + walk,
    8,
    23
  );

  ctx.fillRect(
    x + 34,
    y + 28 - walk,
    8,
    23
  );

}


/* =========================================================
   PARTICLE EFFECTS
========================================================= */

function dust(x, y) {

  for (
    let i = 0;
    i < 10;
    i++
  ) {

    particles.push(
      new Particle(
        x,
        y,
        "#79a84a"
      )
    );

  }

}


function boom(
  x,
  y,
  color = "#ff9f43"
) {

  for (
    let i = 0;
    i < 22;
    i++
  ) {

    particles.push(
      new Particle(
        x,
        y,
        color
      )
    );

  }

}


/* =========================================================
   RANDOM
========================================================= */

function random(
  min,
  max
) {

  return (
    Math.random() *
    (max - min)
  ) + min;

}


/* =========================================================
   AUDIO
========================================================= */

let audio = null;


function startAudio() {

  if (audio) return;

  const Audio =
    window.AudioContext ||
    window.webkitAudioContext;

  if (Audio) {
    audio =
      new Audio();
  }

}


function sound(
  frequency,
  time
) {

  if (!soundOn) return;

  startAudio();

  if (!audio) return;

  const oscillator =
    audio.createOscillator();

  const gain =
    audio.createGain();


  oscillator.type =
    "square";

  oscillator.frequency.value =
    frequency;

  gain.gain.value =
    .035;


  oscillator.connect(gain);
  gain.connect(
    audio.destination
  );


  oscillator.start();

  gain.gain.exponentialRampToValueAtTime(
    .001,
    audio.currentTime + time
  );

  oscillator.stop(
    audio.currentTime + time
  );

}


/* =========================================================
   SOUND BUTTON
========================================================= */

soundBtn.addEventListener(
  "click",
  () => {

    soundOn =
      !soundOn;

    soundBtn.textContent =
      soundOn
        ? "🔊"
        : "🔇";

  }
);


/* =========================================================
   BUTTONS
========================================================= */

startBtn.addEventListener(
  "click",
  startGame
);

resumeBtn.addEventListener(
  "click",
  resumeGame
);

againBtn.addEventListener(
  "click",
  startGame
);

winAgainBtn.addEventListener(
  "click",
  startGame
);

pauseRestartBtn.addEventListener(
  "click",
  startGame
);

pauseBtn.addEventListener(
  "click",
  () => {

    if (state === "playing") {
      pauseGame();
    }

    else if (state === "paused") {
      resumeGame();
    }

  }
);


/* =========================================================
   DIFFICULTY BUTTONS
========================================================= */

document
  .querySelectorAll(".level")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          difficulty =
            button.dataset.level;


          document
            .querySelectorAll(".level")
            .forEach(
              b =>
                b.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );

        }
      );

    }
  );


/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
  "keydown",
  event => {

    if (
      event.code === "Space" ||
      event.code === "ArrowUp"
    ) {

      event.preventDefault();

      player.jump();

    }


    if (
      event.code === "Escape"
    ) {

      if (
        state === "playing"
      ) {

        pauseGame();

      }

      else if (
        state === "paused"
      ) {

        resumeGame();

      }

    }


    if (
      event.code === "Enter"
    ) {

      if (
        state === "menu" ||
        state === "gameover" ||
        state === "win"
      ) {

        startGame();

      }

    }

  }
);


/* =========================================================
   TOUCH
========================================================= */

jumpBtn.addEventListener(
  "pointerdown",
  event => {

    event.preventDefault();

    player.jump();

  }
);


canvas.addEventListener(
  "pointerdown",
  event => {

    if (
      state === "playing"
    ) {

      event.preventDefault();

      player.jump();

    }

  }
);


/* =========================================================
   LOOP
========================================================= */

function loop(time) {

  let dt =
    time -
    lastTime;

  lastTime = time;


  if (
    dt > 50
  ) {

    dt = 16.67;

  }


  if (
    state === "playing"
  ) {

    update(dt);

  }


  draw();


  requestAnimationFrame(
    loop
  );

}


/* =========================================================
   FIRST LOAD
========================================================= */

bestText.textContent =
  best;

hud.classList.add("hide");

requestAnimationFrame(
  time => {

    lastTime = time;

    loop(time);

  }
);
