function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => resolve(img);
  });
}

window.onload = async () => {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");
  const heroImg = await loadTexture('images/player.png');
  const enemyImg = await loadTexture('images/enemyShip.png');
  const background = await loadTexture('images/Background/starBackground.png');
  const pattern = ctx.createPattern(background, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const HERO_WIDTH = heroImg.width;
  const HERO_HEIGHT = heroImg.height;

  const heroX = canvas.width / 2 - HERO_WIDTH / 2;
  const heroY = canvas.height - canvas.height / 4;

  ctx.drawImage(heroImg, heroX, heroY);

  const heroCenterX = canvas.width / 2;
  const SUB_SCALE = 0.5;
  const subWidth = HERO_WIDTH * SUB_SCALE;
  const subHeight = HERO_HEIGHT * SUB_SCALE;

  const GAP = 10;

  const subLeftX = heroCenterX - (HERO_WIDTH / 2 + GAP + subWidth);
  const subRightX = heroCenterX + (HERO_WIDTH / 2 + GAP);

  const subY = heroY + (HERO_HEIGHT - subHeight) / 2;

  ctx.drawImage(heroImg, subLeftX, subY, subWidth, subHeight); //왼쪽 소형기
  ctx.drawImage(heroImg, subRightX, subY, subWidth, subHeight); //오른쪽 소형기

  createEnemiesPyramid(ctx, canvas, enemyImg);
};

function createEnemies(ctx, canvas, enemyImg) {
  const MONSTER_TOTAL = 5;
  const MONSTER_WIDTH = MONSTER_TOTAL * enemyImg.width;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;
  const STOP_X = START_X + MONSTER_WIDTH;

  for (let x = START_X; x < STOP_X; x += enemyImg.width) {
    for (let y = 0; y < enemyImg.height * 5; y += enemyImg.height) {
      ctx.drawImage(enemyImg, x, y);
    }
  }
}

function createEnemiesPyramid(ctx, canvas, enemyImg) {
  const ROWS = 5;   // 5 → 1행
  const enemyW = enemyImg.width;
  const enemyH = enemyImg.height;

  for (let row = 0; row < ROWS; row++) {
    const enemiesInRow = ROWS - row;
    const rowWidth = enemiesInRow * enemyW;
    const startX = (canvas.width - rowWidth) / 2;
    const y = row * enemyH;

    for (let i = 0; i < enemiesInRow; i++) {
      const x = startX + i * enemyW;
      ctx.drawImage(enemyImg, x, y);
    }
  }
}