const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/* ======================
   LOAD IMAGES
====================== */

const bgImg = new Image();
bgImg.src = "assets/background.png";

const pipeImg = new Image();
pipeImg.src = "assets/pipe2-.png";

const coinImg = new Image();
coinImg.src = "assets/koin.png";

// Bird skins
const birdSkins = [
  "assets/Flappy-Bird.png",
  "assets/Flappy-Bird2.png",
  "assets/Flappy-Bird3.png",
  "assets/Flappy-Bird4.png",
  "assets/g4-.png",
  "assets/g5.png",
  "assets/g6.png",
  "assets/g7.png",
  "assets/g8.png",
];

let currentSkinIndex = 0;

let birdImg = new Image();
birdImg.src = birdSkins[currentSkinIndex];

/* ======================
   SOUND
====================== */

const bgm = document.getElementById("backgroundMusic");
const soundFly = document.getElementById("soundFly");
const soundScore = document.getElementById("soundScore");
const soundDie = document.getElementById("soundDie");
const soundMenu = document.getElementById("soundMenu");

bgm.volume = 0.3;

/* ======================
   GAME STATE
====================== */

let gameActive = false;
let gameOver = false;

let score = 0;
let coinCount = 0;

let frame = 0;

/* ======================
   BIRD
====================== */

let bird = {
  x: 80,
  y: 250,
  width: 40,
  height: 30,

  gravity: 0.5,
  jump: -8,
  speed: 0,
};

/* ======================
   PIPE
====================== */

let pipes = [];

const pipeWidth = 60;
const pipeGap = 160;
const pipeSpeed = 2;

/* ======================
   COIN
====================== */

let coins = [];

const coinSize = 26;

/* ======================
   NAVIGATION
====================== */

function playMenuSound() {
  soundMenu.currentTime = 0;
  soundMenu.play();
}

function showScreen(screenId) {
  playMenuSound();

  document
    .querySelectorAll(".overlay")
    .forEach((el) => el.classList.add("hidden"));

  document.getElementById(screenId).classList.remove("hidden");
}

function selectBird(index) {
  playMenuSound();

  currentSkinIndex = index;
  birdImg.src = birdSkins[index];

  document.querySelectorAll(".char-opt").forEach((img, i) => {
    img.classList.toggle("selected", i === index);
  });
}

function startGame() {
  playMenuSound();

  document.getElementById("mainMenu").classList.add("hidden");

  gameActive = true;
  gameOver = false;

  bgm.play().catch(() => {});

  resetGameStats();
}

function backToMenu() {
  playMenuSound();

  gameActive = false;
  gameOver = false;

  document.getElementById("gameOverPopup").classList.add("hidden");

  showScreen("mainMenu");
}

/* ======================
   CONTROL
====================== */

function control() {
  if (!gameActive || gameOver) return;

  bird.speed = bird.jump;

  soundFly.currentTime = 0;
  soundFly.play();
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") control();
});

canvas.addEventListener("click", control);

document.getElementById("jumpBtnMobile").addEventListener("touchstart", (e) => {
  e.preventDefault();
  control();
});

/* ======================
   SMART COIN SPAWN
====================== */

function spawnCoin(pipeX, gapTop, gapBottom) {
  // spawn rate meningkat dengan score
  let spawnChance = 0.5 + score * 0.02;

  if (spawnChance > 0.9) spawnChance = 0.9;

  if (Math.random() > spawnChance) return;

  // posisi tengah gap
  let centerGap = gapTop + (gapBottom - gapTop) / 2;

  // sedikit offset agar natural
  let offset = Math.random() * 40 - 20;

  let coinY = centerGap + offset;

  // batasi agar tetap dalam gap
  if (coinY < gapTop + 10) coinY = gapTop + 10;

  if (coinY > gapBottom - coinSize - 10) coinY = gapBottom - coinSize - 10;

  coins.push({
    x: pipeX + pipeWidth / 2 - coinSize / 2,
    y: coinY,

    collected: false,

    angle: 0,
    scale: 1,
  });
}

/* ======================
   CREATE PIPE
====================== */

function createPipe() {
  let minH = 50;

  let maxH = canvas.height - pipeGap - minH;

  let topH = Math.floor(Math.random() * (maxH - minH) + minH);

  let pipeX = canvas.width;

  let gapTop = topH;
  let gapBottom = topH + pipeGap;

  pipes.push({
    x: pipeX,
    top: topH,
    bottom: canvas.height - topH - pipeGap,
    passed: false,
  });

  spawnCoin(pipeX, gapTop, gapBottom);
}

/* ======================
   UPDATE
====================== */

function update() {
  if (!gameActive || gameOver) return;

  bird.speed += bird.gravity;
  bird.y += bird.speed;

  if (bird.y < 0 || bird.y + bird.height > canvas.height) endGame();

  if (frame % 100 === 0) createPipe();

  /* PIPE */

  pipes.forEach((pipe) => {
    pipe.x -= pipeSpeed;

    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      score++;
      pipe.passed = true;

      soundScore.play();
    }

    if (
      bird.x < pipe.x + pipeWidth &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)
    ) {
      endGame();
    }
  });

  /* COIN */

  coins.forEach((coin) => {
    coin.x -= pipeSpeed;

    // animasi putar
    coin.angle += 0.1;

    coin.scale = Math.sin(coin.angle) * 0.3 + 0.7;

    // collision
    if (
      !coin.collected &&
      bird.x < coin.x + coinSize &&
      bird.x + bird.width > coin.x &&
      bird.y < coin.y + coinSize &&
      bird.y + bird.height > coin.y
    ) {
      coin.collected = true;

      coinCount++;
    }
  });

  pipes = pipes.filter((p) => p.x + pipeWidth > 0);

  coins = coins.filter((c) => !c.collected && c.x + coinSize > 0);

  frame++;
}

/* ======================
   DRAW
====================== */

function draw() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  /* PIPE */

  pipes.forEach((pipe) => {
    ctx.save();

    ctx.translate(pipe.x + pipeWidth / 2, pipe.top / 2);

    ctx.scale(1, -1);

    ctx.drawImage(pipeImg, -pipeWidth / 2, -pipe.top / 2, pipeWidth, pipe.top);

    ctx.restore();

    ctx.drawImage(
      pipeImg,
      pipe.x,
      canvas.height - pipe.bottom,
      pipeWidth,
      pipe.bottom,
    );
  });

  /* COIN */

  coins.forEach((coin) => {
    ctx.save();

    ctx.translate(coin.x + coinSize / 2, coin.y + coinSize / 2);

    ctx.scale(coin.scale, 1);

    ctx.drawImage(coinImg, -coinSize / 2, -coinSize / 2, coinSize, coinSize);

    ctx.restore();
  });

  /* BIRD */

  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  /* UI */

  ctx.fillStyle = "#e3c505";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 6;

  ctx.font = "20px 'Press Start 2P'";

  ctx.strokeText("Score: " + score, 30, 60);
  ctx.fillText("Score: " + score, 30, 60);

  ctx.strokeText("Coin: " + coinCount, 30, 100);
  ctx.fillText("Coin: " + coinCount, 30, 100);
}

/* ======================
   END GAME
====================== */

function endGame() {
  gameOver = true;

  bgm.pause();

  soundDie.play();

  document.getElementById("finalScore").innerText = score;

  document.getElementById("finalCoin").innerText = coinCount;

  document.getElementById("gameOverPopup").classList.remove("hidden");
}

/* ======================
   RESET
====================== */

function resetGameStats() {
  bird.y = 250;
  bird.speed = 0;

  pipes = [];
  coins = [];

  score = 0;
  coinCount = 0;

  frame = 0;
}

document.getElementById("retryBtn").addEventListener("click", () => {
  playMenuSound();

  document.getElementById("gameOverPopup").classList.add("hidden");

  startGame();
});

selectBird(0);

/* ======================
   LOOP
====================== */

function gameLoop() {
  update();
  draw();

  requestAnimationFrame(gameLoop);
}

gameLoop();
