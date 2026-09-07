"use strict";

/* =========================================================
   CREEPER RUNNER
   Adaptive speed version
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

const missionText =
  document.getElementById("missionText");

const barFill =
  document.getElementById("barFill");

const startBtn =
  document.getElementById("startBtn");

const resumeBtn =
  document.getElementById("resumeBtn");

const pauseRestartBtn =
  document.getElementById("pauseRestartBtn");

const againBtn =
  document.getElementById("againBtn");

const winAgainBtn =
  document.getElementById("winAgainBtn");

const pauseBtn =
  document.getElementById("pauseBtn");

const soundBtn =
  document.getElementById("soundBtn");

const jumpBtn =
  document.getElementById("jumpBtn");

const finalScore =
  document.getElementById("finalScore");

const finalGems =
  document.getElementById("finalGems");

const finalBest =
  document.getElementById("finalBest");

const winScore =
  document.getElementById("winScore");

const winGems =
  document.getElementById("winGems");

const winBest =
  document.getElementById("winBest");


/* =========================================================
   GAME SETTINGS
========================================================= */

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GROUND = 470;

const WIN_SCORE = 200;


/*
   The important part:

   start   = starting speed
   max     = absolute speed limit
   grow    = how quickly speed rises

   The Creeper will NEVER go above max.
*/

const difficulties = {

  easy: {
    start: 4.0,
    max: 5.8,

    spawn: 1550,
    minSpawn: 1200,

    gravity: 1.05,
    jump: -18,

    grow: 0.0008
  },

  medium: {
    start: 4.8,
    max: 6.8,

    spawn: 1350,
    minSpawn: 1050,

    gravity: 1.12,
    jump: -18,

    grow: 0.0012
  },

  hard: {
    start: 5.8,
    max: 8.0,

    spawn: 1150,
    minSpawn: 850,

    gravity: 1.18,
    jump: -18.5,

    grow: 0.0015
  },

  veryHard: {
    start: 6.7,
    max: 9.0,

    spawn: 950,
    minSpawn: 720,

    gravity: 1.22,
    jump: -19,

    grow: 0.0018
  }

};


let difficulty = "medium";
let settings = difficulties[difficulty];


/* =========================================================
   GAME VARIABLES
========================================================= */

let state = "menu";

let score = 0;
let gems = 0;

let best =
  Number(
    localStorage.getItem(
      "creeperBest"
    ) || 0
  );


let speed =
  settings.start;

let spawnClock = 0;

let worldClock = 0;

let lastTime = 0;

let soundOn = true;

let shake = 0;


/*
   Prevents unfair instant collisions
   immediately after spawning.
*/
let spawnProtection = 0;


/* =========================================================
   POWER UPS
========================================================= */

let shield = 0;
let slowTime = 0;
let magnet = 0;


/* =========================================================
   OBJECT LISTS
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

  y:
    GROUND - 44,

  width: 44,
  height: 44,

  vy: 0,

  grounded: true,

  jump() {

    if (
      state !== "playing"
    ) {
      return;
    }

    if (
      !this.grounded
    ) {
      return;
    }

    this.vy =
      settings.jump;

    this.grounded =
      false;

    dust(
      this.x + 22,
      GROUND
    );

    playSound(
      430,
      0.07
    );

  },


  update(dt) {

    const frame =
      dt / 16.67;

    this.vy +=
      settings.gravity *
      frame;

    this.y +=
      this.vy *
      frame;


    if (
      this.y +
      this.height >=
      GROUND
    ) {

      this.y =
        GROUND -
        this.height;

      if (
        !this.grounded
      ) {

        dust(
          this.x + 22,
          GROUND
        );

      }

      this.vy = 0;

      this.grounded =
        true;

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

    this.type =
      type;

    this.x =
      WIDTH + 45;

    this.bob =
      Math.random() * 10;


    if (
      type === "cactus"
    ) {

      this.width = 34;
      this.height = 55;

    }

    else if (
      type === "tnt"
    ) {

      this.width = 44;
      this.height = 44;

    }

    else if (
      type === "zombie"
    ) {

      this.width = 43;
      this.height = 58;

    }

    else {

      this.width = 45;
      this.height = 43;

    }


    this.y =
      GROUND -
      this.height;

  }


  update(dt) {

    const frame =
      dt / 16.67;

    const slow =
      slowTime > 0
        ? 0.55
        : 1;

    this.x -=
      speed *
      slow *
      frame;

    this.bob +=
      dt * 0.006;

  }


  draw() {

    if (
      this.type === "cat"
    ) {

      drawCat(
        this.x,
        this.y,
        this.bob
      );

    }

    else if (
      this.type === "cactus"
    ) {

      drawCactus(
        this.x,
        this.y
      );

    }

    else if (
      this.type === "tnt"
    ) {

      drawTnt(
        this.x,
        this.y
      );

    }

    else {

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

    this.x =
      WIDTH + 30;

    this.y =
      random(
        265,
        GROUND - 70
      );

    this.spin =
      Math.random() * 6;

    this.dead =
      false;

  }


  update(dt) {

    const frame =
      dt / 16.67;

    const slow =
      slowTime > 0
        ? 0.55
        : 1;

    this.x -=
      speed *
      0.9 *
      slow *
      frame;


    this.spin +=
      dt * 0.006;


    if (
      magnet > 0
    ) {

      const dx =
        player.x +
        22 -
        this.x;

      const dy =
        player.y +
        22 -
        this.y;

      const distance =
        Math.hypot(
          dx,
          dy
        );


      if (
        distance < 180
      ) {

        this.x +=
          dx * 0.08;

        this.y +=
          dy * 0.08;

      }

    }

  }


  draw() {

    ctx.save();

    ctx.translate(
      this.x,
      this.y
    );

    ctx.rotate(
      this.spin
    );

    ctx.fillStyle =
      "#55d85a";

    ctx.beginPath();

    ctx.moveTo(
      0,
      -16
    );

    ctx.lineTo(
      14,
      0
    );

    ctx.lineTo(
      0,
      17
    );

    ctx.lineTo(
      -14,
      0
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
      "#c1ffae";

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
          Math.random() *
          types.length
        )
      ];

    this.x =
      WIDTH + 40;

    this.y =
      random(
        260,
        370
      );

    this.bob =
      Math.random() * 6;

  }


  update(dt) {

    const frame =
      dt / 16.67;

    this.x -=
      speed *
      0.75 *
      frame;

    this.bob +=
      dt * 0.005;

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
      Math.sin(
        this.bob
      ) * 4;


    ctx.fillStyle =
      colors[this.type];

    ctx.fillRect(
      this.x - 18,
      y - 18,
      36,
      36
    );


    ctx.fillStyle =
      "#111";

    ctx.font =
      "14px 'Press Start 2P'";

    ctx.textAlign =
      "center";

    ctx.fillText(
      letters[this.type],
      this.x,
      y + 5
    );

    ctx.textAlign =
      "left";

  }

}


/* =========================================================
   PARTICLES
========================================================= */

class Particle {

  constructor(
    x,
    y,
    color
  ) {

    this.x = x;
    this.y = y;

    this.vx =
      random(
        -4,
        4
      );

    this.vy =
      random(
        -5,
        1
      );

    this.life =
      random(
        300,
        700
      );

    this.maxLife =
      this.life;

    this.size =
      random(
        3,
        7
      );

    this.color =
      color ||
      "#8bd450";

  }


  update(dt) {

    const frame =
      dt / 16.67;

    this.x +=
      this.vx *
      frame;

    this.y +=
      this.vy *
      frame;

    this.vy +=
      0.18 *
      frame;

    this.life -=
      dt;

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

    ctx.globalAlpha =
      1;

  }

}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

  score = 0;
  gems = 0;

  settings =
    difficulties[difficulty];

  speed =
    settings.start;

  spawnClock = 0;
  worldClock = 0;

  shield = 0;
  slowTime = 0;
  magnet = 0;

  spawnProtection = 900;

  obstacles = [];
  gemsList = [];
  powerUps = [];
  particles = [];

  player.x = 120;

  player.y =
    GROUND -
    player.height;

  player.vy = 0;

  player.grounded =
    true;

  shake = 0;

  updateHud();

}


/* =========================================================
   START
========================================================= */

function startGame() {

  resetGame();

  state =
    "playing";

  start.classList.add(
    "hide"
  );

  pause.classList.add(
    "hide"
  );

  gameOver.classList.add(
    "hide"
  );

  win.classList.add(
    "hide"
  );

  hud.classList.remove(
    "hide"
  );

  lastTime =
    performance.now();

  playSound(
    500,
    0.08
  );

  setTimeout(
    () =>
      playSound(
        700,
        0.08
      ),
    90
  );

}


/* =========================================================
   PAUSE
========================================================= */

function pauseGame() {

  if (
    state !== "playing"
  ) {
    return;
  }

  state =
    "paused";

  pause.classList.remove(
    "hide"
  );

}


function resumeGame() {

  if (
    state !== "paused"
  ) {
    return;
  }

  state =
    "playing";

  pause.classList.add(
    "hide"
  );

  lastTime =
    performance.now();

}


/* =========================================================
   GAME OVER
========================================================= */

function loseGame() {

  if (
    state !== "playing"
  ) {
    return;
  }

  state =
    "gameover";

  shake = 15;

  boom(
    player.x + 22,
    player.y + 22
  );


  const result =
    Math.floor(score);


  if (
    result > best
  ) {

    best =
      result;

    localStorage.setItem(
      "creeperBest",
      best
    );

  }


  finalScore.textContent =
    result;

  finalGems.textContent =
    gems;

  finalBest.textContent =
    best;


  gameOver.classList.remove(
    "hide"
  );


  playSound(
    140,
    0.25
  );

}


/* =========================================================
   WIN
========================================================= */

function winGame() {

  if (
    state !== "playing"
  ) {
    return;
  }

  state =
    "win";

  score =
    WIN_SCORE;


  if (
    score > best
  ) {

    best =
      score;

    localStorage.setItem(
      "creeperBest",
      best
    );

  }


  winScore.textContent =
    WIN_SCORE;

  winGems.textContent =
    gems;

  winBest.textContent =
    best;


  win.classList.remove(
    "hide"
  );


  playSound(
    600,
    0.1
  );

  setTimeout(
    () =>
      playSound(
        800,
        0.1
      ),
    120
  );

  setTimeout(
    () =>
      playSound(
        1000,
        0.2
      ),
    240
  );

}


/* =========================================================
   ADAPTIVE SPEED
========================================================= */

/*
   Speed is controlled here.

   Instead of:

       speed += forever

   we calculate a small increase from score,
   then clamp it to the difficulty's limit.
*/

function updateSpeed(dt) {

  const target =
    settings.start +
    Math.sqrt(
      Math.max(score, 0)
    ) *
    0.18;


  /*
     Hard difficulty reaches its ceiling sooner,
     but it still cannot pass it.
  */

  let wanted =
    Math.min(
      target,
      settings.max
    );


  /*
     Slowly move toward the target.

     This prevents sudden jumps in speed.
  */

  const change =
    settings.grow *
    dt;


  if (
    speed < wanted
  ) {

    speed =
      Math.min(
        speed + change,
        wanted
      );

  }


  /*
     Absolute safety clamp.
  */

  speed =
    Math.max(
      settings.start,
      Math.min(
        speed,
        settings.max
      )
    );

}


/* =========================================================
   ADAPTIVE SPAWN
========================================================= */

function getSpawnTime() {

  /*
     As speed rises, obstacles can appear
     slightly more often.

     But there is always a minimum interval.
  */

  const speedPart =
    speed /
    settings.max;


  const reduction =
    speedPart *
    250;


  return Math.max(
    settings.minSpawn,
    settings.spawn -
    reduction
  );

}


/* =========================================================
   SPAWN
========================================================= */

function spawnThings() {

  /*
     Do not create complicated obstacles
     too early.
  */

  let type =
    "cat";

  const r =
    Math.random();


  if (
    score > 25
  ) {

    if (
      difficulty === "hard" ||
      difficulty === "veryHard"
    ) {

      if (
        r > 0.93
      ) {

        type =
          "zombie";

      }

      else if (
        r > 0.84
      ) {

        type =
          "tnt";

      }

      else if (
        r > 0.73
      ) {

        type =
          "cactus";

      }

    }

    else {

      if (
        r > 0.90
      ) {

        type =
          "tnt";

      }

      else if (
        r > 0.96
      ) {

        type =
          "cactus";

      }

    }

  }


  /*
     Never spawn a new obstacle while another
     one is too close to the player.
  */

  const last =
    obstacles[
      obstacles.length - 1
    ];


  if (
    last &&
    last.x <
    WIDTH - 230
  ) {

    return;

  }


  obstacles.push(
    new Obstacle(type)
  );


  /*
     Gems are common enough to make the run
     interesting but not distracting.
  */

  if (
    Math.random() < .55
  ) {

    gemsList.push(
      new Gem()
    );

  }


  /*
     Power-ups stay relatively rare.
  */

  if (
    score > 15 &&
    Math.random() < .07
  ) {

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

    x:
      player.x + 8,

    y:
      player.y + 6,

    width:
      player.width - 16,

    height:
      player.height - 9

  };

}


/* =========================================================
   CHECK COLLISIONS
========================================================= */

function checkHits() {

  const box =
    playerBox();


  /* -------------------------------------------------------
     ENEMIES
  ------------------------------------------------------- */

  for (
    let i =
      obstacles.length - 1;
    i >= 0;
    i--
  ) {

    const enemy =
      obstacles[i];


    const enemyBox = {

      x:
        enemy.x + 6,

      y:
        enemy.y + 5,

      width:
        enemy.width - 12,

      height:
        enemy.height - 6

    };


    if (
      hit(
        box,
        enemyBox
      )
    ) {

      /*
         Shield saves the player.
      */

      if (
        shield > 0
      ) {

        shield = 0;

        obstacles.splice(
          i,
          1
        );

        boom(
          enemy.x,
          enemy.y,
          "#70bfff"
        );

        shake = 9;

        playSound(
          220,
          .12
        );

      }

      else {

        loseGame();

        return;

      }

    }

  }


  /* -------------------------------------------------------
     GEMS
  ------------------------------------------------------- */

  gemsList.forEach(
    gem => {

      if (
        gem.dead
      ) {
        return;
      }


      const box2 = {

        x:
          gem.x - 14,

        y:
          gem.y - 14,

        width: 28,
        height: 28

      };


      if (
        hit(
          box,
          box2
        )
      ) {

        gem.dead =
          true;

        gems++;

        score += 2;

        boom(
          gem.x,
          gem.y,
          "#55d85a"
        );

        playSound(
          900,
          .06
        );

      }

    }
  );


  /* -------------------------------------------------------
     POWER UPS
  ------------------------------------------------------- */

  powerUps.forEach(
    power => {

      const box2 = {

        x:
          power.x - 18,

        y:
          power.y - 18,

        width: 36,
        height: 36

      };


      if (
        hit(
          box,
          box2
        )
      ) {

        if (
          power.type ===
          "shield"
        ) {

          shield =
            7000;

        }

        else if (
          power.type ===
          "slow"
        ) {

          slowTime =
            6000;

        }

        else {

          magnet =
            8000;

        }


        power.x =
          -100;


        boom(
          player.x + 22,
          player.y + 22,
          "#ffffff"
        );

        playSound(
          700,
          .1
        );

      }

    }
  );

}


/* =========================================================
   UPDATE
========================================================= */

function update(dt) {

  worldClock +=
    dt;

  spawnProtection =
    Math.max(
      0,
      spawnProtection - dt
    );


  /*
     Player physics.
  */

  player.update(dt);


  /*
     Score is deliberately slow.

     0.006 means roughly 1 score
     every 166 ms.
  */

  score +=
    dt * 0.006;


  /*
     Adaptive speed.
  */

  updateSpeed(dt);


  /*
     Power-up timers.
  */

  shield =
    Math.max(
      0,
      shield - dt
    );

  slowTime =
    Math.max(
      0,
      slowTime - dt
    );

  magnet =
    Math.max(
      0,
      magnet - dt
    );


  /*
     Spawning.
  */

  spawnClock +=
    dt;


  const spawnTime =
    getSpawnTime();


  if (
    spawnClock >=
    spawnTime
  ) {

    spawnThings();

    spawnClock =
      0;

  }


  /*
     Objects.
  */

  obstacles.forEach(
    item =>
      item.update(dt)
  );

  gemsList.forEach(
    item =>
      item.update(dt)
  );

  powerUps.forEach(
    item =>
      item.update(dt)
  );

  particles.forEach(
    item =>
      item.update(dt)
  );


  /*
     Only check collisions after
     the initial safety period.
  */

  if (
    spawnProtection <= 0
  ) {

    checkHits();

  }


  cleanThings();

  updateHud();


  /*
     Win.
  */

  if (
    Math.floor(score) >=
    WIN_SCORE
  ) {

    winGame();

  }

}


/* =========================================================
   CLEAN OBJECTS
========================================================= */

function cleanThings() {

  obstacles =
    obstacles.filter(
      item =>
        item.x +
        item.width >
        -80
    );


  gemsList =
    gemsList.filter(
      item =>
        item.x > -60 &&
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
    progress +
    "%";


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


  /*
     Small screen shake on impacts.
  */

  if (
    shake > 0
  ) {

    ctx.translate(
      random(
        -shake,
        shake
      ),
      random(
        -shake,
        shake
      )
    );

    shake *=
      .88;

    if (
      shake < .1
    ) {

      shake = 0;

    }

  }


  drawWorld();


  gemsList.forEach(
    item =>
      item.draw()
  );


  powerUps.forEach(
    item =>
      item.draw()
  );


  obstacles.forEach(
    item =>
      item.draw()
  );


  player.draw();


  particles.forEach(
    item =>
      item.draw()
  );


  /*
     Shield around Creeper.
  */

  if (
    shield > 0
  ) {

    ctx.strokeStyle =
      "rgba(70,170,255,.85)";

    ctx.lineWidth =
      4;

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

  /*
     30 second day/night cycle.
  */

  const night =
    worldClock %
    30000 >
    20500;


  const sky =
    ctx.createLinearGradient(
      0,
      0,
      0,
      HEIGHT
    );


  if (
    night
  ) {

    sky.addColorStop(
      0,
      "#111a31"
    );

    sky.addColorStop(
      .7,
      "#354664"
    );

  }

  else {

    sky.addColorStop(
      0,
      "#61b8e7"
    );

    sky.addColorStop(
      .7,
      "#c6edf8"
    );

  }


  ctx.fillStyle =
    sky;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );


  /*
     Sun / moon.
  */

  ctx.fillStyle =
    night
      ? "#e9edff"
      : "#fff0a1";

  ctx.fillRect(
    780,
    70,
    36,
    36
  );


  /*
     Clouds.
  */

  if (
    !night
  ) {

    drawCloud(
      100 -
      (
        worldClock *
        .015
      ) %
      1100,

      80,

      110
    );


    drawCloud(
      500 -
      (
        worldClock *
        .009
      ) %
      1100,

      55,

      140
    );

  }


  /*
     Mountains.
  */

  ctx.fillStyle =
    night
      ? "#3a5439"
      : "#78a447";


  ctx.beginPath();

  ctx.moveTo(
    0,
    320
  );

  ctx.lineTo(
    130,
    230
  );

  ctx.lineTo(
    270,
    315
  );

  ctx.lineTo(
    420,
    220
  );

  ctx.lineTo(
    590,
    310
  );

  ctx.lineTo(
    740,
    225
  );

  ctx.lineTo(
    WIDTH,
    300
  );

  ctx.lineTo(
    WIDTH,
    HEIGHT
  );

  ctx.lineTo(
    0,
    HEIGHT
  );

  ctx.closePath();

  ctx.fill();


  /*
     Dirt.
  */

  ctx.fillStyle =
    "#76522b";

  ctx.fillRect(
    0,
    GROUND,
    WIDTH,
    HEIGHT -
    GROUND
  );


  /*
     Grass.
  */

  ctx.fillStyle =
    "#4d8e29";

  ctx.fillRect(
    0,
    GROUND,
    WIDTH,
    9
  );


  /*
     Moving ground texture.
  */

  ctx.fillStyle =
    "#5b3f21";


  const offset =
    (
      worldClock *
      speed *
      .02
    ) %
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


  ctx.fillStyle =
    "#70c249";

  ctx.fillRect(
    x,
    y,
    7,
    44
  );


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

  ctx.lineWidth =
    2;

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


  ctx.fillRect(
    x + 5,
    y + 19 + bob,
    34,
    21
  );


  ctx.fillRect(
    x + 6,
    y + 4 + bob,
    32,
    27
  );


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


  ctx.strokeStyle =
    "#985b2b";

  ctx.lineWidth =
    5;

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
    Math.sin(
      t * 2
    ) * 3;


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
   PARTICLES
========================================================= */

function dust(
  x,
  y
) {

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

  if (audio) {
    return;
  }

  const AudioContext =
    window.AudioContext ||
    window.webkitAudioContext;

  if (
    AudioContext
  ) {

    audio =
      new AudioContext();

  }

}


function playSound(
  frequency,
  duration
) {

  if (!soundOn) {
    return;
  }

  startAudio();

  if (!audio) {
    return;
  }

  if (
    audio.state ===
    "suspended"
  ) {

    audio.resume();

  }


  const oscillator =
    audio.createOscillator();

  const gain =
    audio.createGain();


  oscillator.type =
    "square";

  oscillator.frequency.value =
    frequency;

  gain.gain.value =
    0.035;


  oscillator.connect(
    gain
  );

  gain.connect(
    audio.destination
  );


  oscillator.start();


  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audio.currentTime +
    duration
  );


  oscillator.stop(
    audio.currentTime +
    duration
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
);


/* =========================================================
   DIFFICULTY
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
              item =>
                item.classList.remove(
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
      event.code ===
      "Space" ||
      event.code ===
      "ArrowUp"
    ) {

      event.preventDefault();

      player.jump();

    }


    if (
      event.code ===
      "Escape"
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
      event.code ===
      "Enter"
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
   MOBILE
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
   GAME LOOP
========================================================= */

function loop(time) {

  let dt =
    time -
    lastTime;


  lastTime =
    time;


  /*
     Don't allow a huge frame jump
     if the browser was paused/minimized.
  */

  if (
    dt > 40
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
   INITIAL LOAD
========================================================= */

bestText.textContent =
  best;

hud.classList.add(
  "hide"
);


/*
   Draw the menu background
   before the first frame.
*/

drawWorld();


player.draw();


requestAnimationFrame(
  time => {

    lastTime =
      time;

    loop(time);

  }
);
