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
  COLLISION_METEOR_ENEMY: "COLLISION_METEOR_ENEMY",
  COLLISION_METEOR_HERO: "COLLISION_METEOR_HERO",
  COLLISION_METEOR_LASER: "COLLISION_METEOR_LASER",
  COLLISION_METEOR_BIG_LASER: "COLLISION_METEOR_BIG_LASER",
  GAME_END_WIN: "GAME_END_WIN",
  GAME_END_LOSS: "GAME_END_LOSS",
};


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

// 운석 클래스
class Meteor extends GameObject {
  constructor(x, y, isBig) {
    super(x, y);
    this.isBig = isBig;
    this.type = "Meteor";
    this.damage = isBig ? 2 : 1;
    
    if (isBig) {
      this.width = meteorBigImg.width;
      this.height = meteorBigImg.height;
      this.img = meteorBigImg;
    } else {
      this.width = meteorSmallImg.width;
      this.height = meteorSmallImg.height;
      this.img = meteorSmallImg;
    }

    // TODO 운석 떨어지게 
    this.movementInterval = setInterval(() => {
      if (this.y < canvas.height) {
        this.y += 3;
      } else {
        this.dead = true;
        clearInterval(this.movementInterval);
      }
    }, 100);
  }

  cleanup() {
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
      this.movementInterval = null;
    }
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
    this.cooldown = 0; 
    this.life = 3; 
    this.points = 0;
  }

  // 레이저 발사
  fire() {
    if (this.canFire()) {
      gameObjects.push(new Laser(this.x + 45, this.y - 10));
      this.cooldown = 500; 
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
  decrementLife(amount = 1) {
    this.life -= amount;
    if (this.life <= 0) {
      this.life = 0;
      this.dead = true;
    }
  }

  // 점수 증가
  incrementPoints() {
    this.points += 100;
  }

  // 이동 처리
  move() {
    // 위쪽 이동
    if (this.speed.y < 0 && this.y > 0) {
      this.y += this.speed.y;
      if (this.y < 0) this.y = 0;
    }
    // 아래쪽 이동
    if (this.speed.y > 0 && this.y < canvas.height - this.height) {
      this.y += this.speed.y;
      if (this.y > canvas.height - this.height) this.y = canvas.height - this.height;
    }
    // 왼쪽 이동
    if (this.speed.x < 0 && this.x > 0) {
      this.x += this.speed.x;
      if (this.x < 0) this.x = 0;
    }
    // 오른쪽 이동
    if (this.speed.x > 0 && this.x < canvas.width - this.width) {
      this.x += this.speed.x;
      if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    }
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
  meteorBigImg,
  meteorSmallImg,
  background,
  canvas,
  ctx,
  gameObjects = [], 
  hero,
  subHeroLeft,
  subHeroRight,
  eventEmitter = new EventEmitter(),
  gameLoopId,
  meteorSpawnInterval;

// 키 입력 상태 추적
let pressedKeys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

// 히어로 사망 여부 확인
function isHeroDead() {
  return hero.life <= 0;
}

// 모든 적 제거 여부 확인
function isEnemiesDead() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
  return enemies.length === 0;
}

// 운석 생성 함수
function spawnMeteor() {
  const isBig = Math.random() < 0.3; // 30% 확률로 큰 운석
  const x = Math.random() * (canvas.width - (isBig ? 100 : 50));
  const meteor = new Meteor(x, 0, isBig);
  gameObjects.push(meteor);
}

// 운석 생성 시작
function startMeteorSpawn() {
  meteorSpawnInterval = setInterval(() => {
    spawnMeteor();
  }, 3000); // 3초마다 운석 생성
}

// 운석 생성 중지
function stopMeteorSpawn() {
  if (meteorSpawnInterval) {
    clearInterval(meteorSpawnInterval);
    meteorSpawnInterval = null;
  }
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
  stopMeteorSpawn();

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
    stopMeteorSpawn(); // 운석 생성 중지
    
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
    
    // 키 입력 상태 초기화
    pressedKeys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false
    };
    
    eventEmitter.clear(); // 모든 이벤트 리스너 제거, 이전 게임 세팅 충돌 방지
    initGame(); // 게임 초기 상태 선택
    startMeteorSpawn(); // 운석 생성 시작
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

// 키 입력에 따른 히어로 속도 업데이트
function updateHeroSpeed() {
  const SPEED = 5;
  hero.speed.x = 0;
  hero.speed.y = 0;

  if (pressedKeys.ArrowUp) {
    hero.speed.y = -SPEED;
  }
  if (pressedKeys.ArrowDown) {
    hero.speed.y = SPEED;
  }
  if (pressedKeys.ArrowLeft) {
    hero.speed.x = -SPEED;
  }
  if (pressedKeys.ArrowRight) {
    hero.speed.x = SPEED;
  }
}

function updateGameObjects() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy");
  const lasers = gameObjects.filter((go) => go.type === "Laser");
  const meteors = gameObjects.filter((go) => go.type === "Meteor");


  
  updateHeroSpeed();
  hero.move();

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

  // 레이저와 운석 충돌 감지
  lasers.forEach((laser) => {
    meteors.forEach((meteor) => {
      if (intersectRect(laser.rectFromGameObject(), meteor.rectFromGameObject())) {
        if (meteor.isBig) {
          // 큰 운석: 레이저만 폭발
          eventEmitter.emit(Messages.COLLISION_METEOR_BIG_LASER, {
            laser: laser,
            meteor: meteor,
          });
        } else {
          // 작은 운석: 둘 다 파괴
          eventEmitter.emit(Messages.COLLISION_METEOR_LASER, {
            laser: laser,
            meteor: meteor,
          });
        }
      }
    });
  });

  // 운석과 적군 충돌 감지
  meteors.forEach((meteor) => {
    enemies.forEach((enemy) => {
      if (intersectRect(meteor.rectFromGameObject(), enemy.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_METEOR_ENEMY, {
          meteor: meteor,
          enemy: enemy,
        });
      }
    });
  });

  // 운석과 영웅 충돌 감지
  meteors.forEach((meteor) => {
    const heroRect = hero.rectFromGameObject();
    if (intersectRect(heroRect, meteor.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_METEOR_HERO, { meteor });
    }
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
    hero.incrementPoints(); // 점수 증가

    let explosionImg;
    if (first.img === laserImg) {
      explosionImg = laserRedShotImg; 
    } 
    else {
      explosionImg = laserGreenShotImg;
    }
    
    const explosion = new Explosion(second.x, second.y, explosionImg);
    gameObjects.push(explosion);

    // 모든 적 제거 시 승리
    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  // 레이저-작은 운석 충돌 이벤트 처리
  eventEmitter.on(Messages.COLLISION_METEOR_LASER, (_, { laser, meteor }) => {
    laser.dead = true;
    meteor.dead = true;

    let explosionImg;
    if (laser.img === laserImg) {
      explosionImg = laserRedShotImg; 
    } 
    else {
      explosionImg = laserGreenShotImg;
    }
    
    const explosion = new Explosion(meteor.x, meteor.y, explosionImg);
    gameObjects.push(explosion);
  });

  // 레이저-큰 운석 충돌 이벤트 처리 (레이저만 폭발)
  eventEmitter.on(Messages.COLLISION_METEOR_BIG_LASER, (_, { laser, meteor }) => {
    laser.dead = true; // 레이저만 제거

    let explosionImg;
    if (laser.img === laserImg) {
      explosionImg = laserRedShotImg; 
    } 
    else {
      explosionImg = laserGreenShotImg;
    }
    
    // 레이저 위치에 폭발 효과
    const explosion = new Explosion(laser.x, laser.y, explosionImg);
    gameObjects.push(explosion);
  });

  // 운석-적군 충돌 이벤트 처리
  eventEmitter.on(Messages.COLLISION_METEOR_ENEMY, (_, { meteor, enemy }) => {
    meteor.dead = true;
    enemy.dead = true;

    const explosion = new Explosion(enemy.x, enemy.y, laserGreenShotImg);
    gameObjects.push(explosion);

    // 모든 적 제거 시 승리
    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  // 운석-영웅 충돌 이벤트 처리
  eventEmitter.on(Messages.COLLISION_METEOR_HERO, (_, { meteor }) => {
    meteor.dead = true;
    hero.decrementLife(meteor.damage); // 운석 피해량만큼 생명 감소
    
    if (isHeroDead()) {
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return;
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
  // 방향키 기본 동작 방지
  switch (e.keyCode) {
    case 37: // 왼쪽
    case 38: // 위
    case 39: // 오른쪽
    case 40: // 아래
    case 32: // 스페이스
      e.preventDefault();
      break;
    default:
      break;
  }

  // 키를 누르고 있는 상태로 표시
  if (e.key === "ArrowUp") {
    pressedKeys.ArrowUp = true;
  } else if (e.key === "ArrowDown") {
    pressedKeys.ArrowDown = true;
  } else if (e.key === "ArrowLeft") {
    pressedKeys.ArrowLeft = true;
  } else if (e.key === "ArrowRight") {
    pressedKeys.ArrowRight = true;
  } else if (e.keyCode === 32) {
    // 스페이스는 한 번만 발사
    if (!e.repeat) {
      eventEmitter.emit(Messages.KEY_EVENT_SPACE);
    }
  }
};

// 키를 뗐을 때 처리
let onKeyUp = function (e) {
  if (e.key === "ArrowUp") {
    pressedKeys.ArrowUp = false;
  } else if (e.key === "ArrowDown") {
    pressedKeys.ArrowDown = false;
  } else if (e.key === "ArrowLeft") {
    pressedKeys.ArrowLeft = false;
  } else if (e.key === "ArrowRight") {
    pressedKeys.ArrowRight = false;
  } else if (e.key === "Enter") {
    eventEmitter.emit(Messages.KEY_EVENT_ENTER);
  }
};

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);

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
  meteorBigImg = await loadTexture('images/meteorBig.png');
  meteorSmallImg = await loadTexture('images/meteorSmall.png');

  backgroundPattern = ctx.createPattern(background, "repeat");
  initGame();
  startMeteorSpawn(); // 운석 생성 시작

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