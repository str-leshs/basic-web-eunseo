function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => resolve(img);
  });
}

function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}


class EventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }

  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
    }
  }

  clear() {
    this.listeners = {};
  }
}

const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
  GAME_END_WIN: "GAME_END_WIN",
  GAME_END_LOSS: "GAME_END_LOSS",
};

// 기본 게임 객체 클래스
class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false; 
    this.type = "";
    this.width = 0; 
    this.height = 0; 
    this.img = undefined;
  }

  rectFromGameObject() {
    return {
      top: this.y,
      left: this.x,
      bottom: this.y + this.height,
      right: this.x + this.width,
    };
  }

  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
}

// 플레이어
class Hero extends GameObject {
  constructor(x, y, width, height) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.type = "Hero";
    this.speed = { x: 0, y: 0 };
    this.cooldown = 0; // 레이저 발사 쿨다운
    this.life = 3; 
    this.points = 0;
  }

  // 레이저 발사
  fire() {
    if (this.canFire()) {
      gameObjects.push(new Laser(this.x + 45, this.y - 10));
      this.cooldown = 500; // 쿨다운 500ms
      let id = setInterval(() => {
        if (this.cooldown > 0) {
          this.cooldown -= 100;
        } else {
          clearInterval(id);
        }
      }, 100);
    }
  }

  // 쿨다운이 끝났는지 확인
  canFire() {
    return this.cooldown === 0;
  }

  // 생명 감소
  decrementLife() {
    this.life--;
    if (this.life === 0) {
      this.dead = true;
    }
  }

  // 점수 증가
  incrementPoints() {
    this.points += 100;
  }
}

// 보조 비행선 클래스 
class SubHero extends GameObject {
  constructor(x, y, width, height, mainHero) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.type = "SubHero";
    this.mainHero = mainHero;
    this.offsetX = x - mainHero.x;
    this.offsetY = y - mainHero.y;

    this.autoFireInterval = setInterval(() => {
      if (!this.dead && this.mainHero && !this.mainHero.dead) {
        gameObjects.push(new SubLaser(this.x + this.width / 2 - 4.5, this.y - 10));
      }
    }, 5000);
  }
  
  update() {
    this.x = this.mainHero.x + this.offsetX;
    this.y = this.mainHero.y + this.offsetY;
  }

  // 객체 제거 시 interval 정리
  cleanup() {
    if (this.autoFireInterval) {
      clearInterval(this.autoFireInterval);
      this.autoFireInterval = null;
    }
  }
}

class SubLaser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "Laser";
    this.img = laserGreenImg;

    let id = setInterval(() => {
      if (this.dead) {
        clearInterval(id);
        return;
      }
      if (this.y > 0) {
        this.y -= 15;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

//레이저에 맞으면 폭발
class Explosion extends GameObject {
  constructor(x, y, img) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Explosion";
    this.img = img;
    
    setTimeout(() => {
      this.dead = true;
    }, 200);
  }
}

// 적군 클래스
class Enemy extends GameObject {
  constructor(x, y, width, height) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.type = "Enemy";
    
    // 적군 아래로 자동으로 이동
    this.movementInterval = setInterval(() => {
      if (this.y < canvas.height - this.height) {
        this.y += 5;
      } else {
        clearInterval(this.movementInterval); 
      }
    }, 300);
  }

  // 객체 제거 시 interval 정리
  cleanup() {
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
      this.movementInterval = null;
    }
  }
}

// 메인 레이저 클래스
class Laser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "Laser";
    this.img = laserImg;

    //레이저 이동
    let id = setInterval(() => {
      if (this.y > 0) {
        this.y -= 15; 
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}


let heroImg,
  enemyImg,
  laserImg,
  laserGreenImg,
  laserGreenShotImg,
  laserRedShotImg,
  lifeImg,
  background,
  canvas,
  ctx,
  gameObjects = [], 
  hero,
  subHeroLeft,
  subHeroRight,
  eventEmitter = new EventEmitter(),
  gameLoopId;

// 히어로 사망 여부 확인
function isHeroDead() {
  return hero.life <= 0;
}

// 모든 적 제거 여부 확인
function isEnemiesDead() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
  return enemies.length === 0;
}

function createEnemiesPyramid(canvas, enemyImg) {
  const ROWS = 5;
  const enemyW = enemyImg.width;
  const enemyH = enemyImg.height;

  for (let row = 0; row < ROWS; row++) {
    const enemiesInRow = ROWS - row;
    const rowWidth = enemiesInRow * enemyW;
    const startX = (canvas.width - rowWidth) / 2;
    const y = row * enemyH;

    for (let i = 0; i < enemiesInRow; i++) {
      const x = startX + i * enemyW;
      const enemy = new Enemy(x, y, enemyW, enemyH);
      enemy.img = enemyImg;
      gameObjects.push(enemy);
    }
  }
}

function createHero(canvas, heroImg) {
  const HERO_WIDTH = heroImg.width;
  const HERO_HEIGHT = heroImg.height;
  const heroX = canvas.width / 2 - HERO_WIDTH / 2;
  const heroY = canvas.height - canvas.height / 4;
  hero = new Hero(heroX, heroY, HERO_WIDTH, HERO_HEIGHT);
  hero.img = heroImg;
  gameObjects.push(hero);

  const heroCenterX = canvas.width / 2;
  const SUB_SCALE = 0.5;
  const subWidth = HERO_WIDTH * SUB_SCALE;
  const subHeight = HERO_HEIGHT * SUB_SCALE;
  const GAP = 10;
  
  // 왼쪽 보조 비행선
  const subLeftX = heroCenterX - (HERO_WIDTH / 2 + GAP + subWidth);
  const subY = heroY + (HERO_HEIGHT - subHeight) / 2;
  subHeroLeft = new SubHero(subLeftX, subY, subWidth, subHeight, hero);
  subHeroLeft.img = heroImg;
  gameObjects.push(subHeroLeft);
  
  // 오른쪽 보조 비행선
  const subRightX = heroCenterX + (HERO_WIDTH / 2 + GAP);
  subHeroRight = new SubHero(subRightX, subY, subWidth, subHeight, hero);
  subHeroRight.img = heroImg;
  gameObjects.push(subHeroRight);
}

// 생명 그리기 함수
function drawLife() {
  const START_POS = canvas.width - 180;
  for(let i=0; i < hero.life; i++) {
    ctx.drawImage(
      lifeImg,
      START_POS + (45 * (i+1)),
      canvas.height - 37
    );
  }
}

// 점수 그리기 함수
function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  drawText("Points: " + hero.points, 10, canvas.height-20);
}

// 텍스트 그리기 헬퍼 함수
function drawText(message, x, y) {
  ctx.fillText(message, x, y);
}

// 메시지 표시 함수
function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

// 게임 종료 함수
function endGame(win) {
  clearInterval(gameLoopId);

  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (win) {
      displayMessage(
        "Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew",
        "green"
      );
    } else {
      displayMessage(
        "You died !!! Press [Enter] to start a new game Captain Pew Pew"
      );
    }
  }, 200);
}

// 게임 재시작 함수
function resetGame() {
  if (gameLoopId) {
    clearInterval(gameLoopId); // 게임 루프 중지, 중복 실행 방지
    
    // 모든 게임 객체의 interval 정리
    gameObjects.forEach((go) => {
      if (go.cleanup) {
        go.cleanup();
      }
      if (go.movementInterval) {
        clearInterval(go.movementInterval);
      }
      if (go.autoFireInterval) {
        clearInterval(go.autoFireInterval);
      }
    });
    
    // 보조 비행선 정리
    if (subHeroLeft) {
      subHeroLeft.cleanup();
      subHeroLeft = null;
    }
    if (subHeroRight) {
      subHeroRight.cleanup();
      subHeroRight = null;
    }
    
    eventEmitter.clear(); // 모든 이벤트 리스너 제거, 이전 게임 세팅 충돌 방지
    initGame(); // 게임 초기 상태 선택

    gameLoopId = setInterval(() => { // 100ms간격으로 새로운 게임 루프 시작
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = backgroundPattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawPoints();
      drawLife();
      updateGameObjects();
      drawGameObjects(ctx);
    }, 100);
  }
}





function drawGameObjects(ctx) {
  gameObjects.forEach((go) => go.draw(ctx));
}

function updateGameObjects() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy");
  const lasers = gameObjects.filter((go) => go.type === "Laser");

  // 레이저와 적군 충돌 감지
  lasers.forEach((laser) => {
    enemies.forEach((enemy) => {
      if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: laser,
          second: enemy,
        });
      }
    });
  });

  // 영웅과 적군 충돌 감지
  enemies.forEach((enemy) => {
    const heroRect = hero.rectFromGameObject();
    if (intersectRect(heroRect, enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
    }
  });

  if (subHeroLeft && !subHeroLeft.dead) subHeroLeft.update();
  if (subHeroRight && !subHeroRight.dead) subHeroRight.update();

  gameObjects = gameObjects.filter((go) => !go.dead);
}

// 게임 초기화
function initGame() {
  gameObjects = [];
  createEnemiesPyramid(canvas, enemyImg);
  createHero(canvas, heroImg);

  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    if (hero.y > 0) {
      hero.y -= 5;
    }
  });
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    if (hero.y < canvas.height - hero.height) {
      hero.y += 5;
    }
  });
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    if (hero.x > 0) {
      hero.x -= 5;
    }
  });
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    if (hero.x < canvas.width - hero.width) {
      hero.x += 5;
    }
  });

  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) {
      hero.fire();
    }
  });

  // Enter 키로 게임 재시작
  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
    resetGame();
  });

  // 레이저-적군 충돌 이벤트 처리
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true; 
    hero.incrementPoints();

    let explosionImg;
    if (first.img === laserImg) {
      explosionImg = laserRedShotImg; 
    } else {
      explosionImg = laserGreenShotImg;
    }
    
    const explosion = new Explosion(second.x, second.y, explosionImg);
    gameObjects.push(explosion);


    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  // 영웅-적군 충돌 이벤트 처리
  eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    enemy.dead = true;
    hero.decrementLife(); // 생명 감소
    if (isHeroDead()) {
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return; // lose before victory
    }
    // 적 제거 후 승리 조건 체크
    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  // 승리 이벤트
  eventEmitter.on(Messages.GAME_END_WIN, () => {
    endGame(true);
  });

  // 패배 이벤트
  eventEmitter.on(Messages.GAME_END_LOSS, () => {
    endGame(false);
  });
}

// ========== 키보드 이벤트 처리 ==========
let onKeyDown = function (e) {
  switch (e.keyCode) {
    case 37:
    case 38:
    case 39: 
    case 40: 
    case 32: 
      e.preventDefault();
      break;
    default:
      break;
  }
};

//키 입력 처리
window.addEventListener("keyup", (evt) => {
  if (evt.key === "ArrowUp") {
    eventEmitter.emit(Messages.KEY_EVENT_UP);
  } else if (evt.key === "ArrowDown") {
    eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  } else if (evt.key === "ArrowLeft") {
    eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  } else if (evt.key === "ArrowRight") {
    eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  } else if (evt.keyCode === 32) {
    eventEmitter.emit(Messages.KEY_EVENT_SPACE);
  } else if (evt.key === "Enter") {
    eventEmitter.emit(Messages.KEY_EVENT_ENTER);
  }
});

window.addEventListener("keydown", onKeyDown);







// --------게임 시작-------
window.onload = async () => {

  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  heroImg = await loadTexture('images/player.png');
  enemyImg = await loadTexture('images/enemyShip.png');
  laserImg = await loadTexture('images/laserRed.png');
  laserGreenImg = await loadTexture('images/laserGreen.png');
  background = await loadTexture('images/Background/starBackground.png');
  laserRedShotImg = await loadTexture('images/laserRedShot.png');    
  laserGreenShotImg = await loadTexture('images/laserGreenShot.png');
  lifeImg = await loadTexture('images/life.png');

  backgroundPattern = ctx.createPattern(background, "repeat");
  initGame();

  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = backgroundPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGameObjects(ctx);
    drawPoints();
    drawLife();
    updateGameObjects();
  }, 100);
};