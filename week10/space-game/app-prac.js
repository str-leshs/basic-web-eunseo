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
  KEY_EVENT_W: "KEY_EVENT_W",
  KEY_EVENT_S: "KEY_EVENT_S",
  KEY_EVENT_A: "KEY_EVENT_A",
  KEY_EVENT_D: "KEY_EVENT_D",
  KEY_EVENT_F: "KEY_EVENT_F",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
  COLLISION_METEOR_ENEMY: "COLLISION_METEOR_ENEMY",
  COLLISION_METEOR_HERO: "COLLISION_METEOR_HERO",
  COLLISION_METEOR_LASER: "COLLISION_METEOR_LASER",
  COLLISION_METEOR_BIG_LASER: "COLLISION_METEOR_BIG_LASER",
  GAME_END_WIN: "GAME_END_WIN",
  GAME_END_LOSS: "GAME_END_LOSS",
  MODE_SELECT_SINGLE: "MODE_SELECT_SINGLE",
  MODE_SELECT_MULTI: "MODE_SELECT_MULTI",
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

// 운석떨어짐
class Meteor extends GameObject {
  constructor(x, y, isBig) {
    super(x, y);
    this.isBig = isBig; 
    this.type = "Meteor";
    this.damage = isBig ? 2 : 1;  // 큰 운석은 2데미지, 작은 운석은 1데미지
    
    // 운석 크기와 이미지 설정
    if (isBig) {
      this.width = meteorBigImg.width;
      this.height = meteorBigImg.height;
      this.img = meteorBigImg;
    } else {
      this.width = meteorSmallImg.width;
      this.height = meteorSmallImg.height;
      this.img = meteorSmallImg;
    }

    //운석자동낙하
    this.movementInterval = setInterval(() => {
      if (this.y < canvas.height) {
        this.y += 5; 
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

//플레이어 우주선
class Hero extends GameObject {
  constructor(x, y, width, height, playerId = 1) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.type = "Hero";
    this.playerId = playerId;  // 1: Player 1, 2: Player 2
    this.speed = { x: 0, y: 0 };
    this.cooldown = 0;  
    this.life = 3;    
    this.points = 0; 
  }

  // 레이저 발사
  fire() {
    if (this.canFire()) {
      // Player 2는 초록색 레이저, Player 1은 빨간색 레이저
      if (this.playerId === 2) {
        gameObjects.push(new Laser(this.x + 45, this.y - 10, laserGreenImg));
      } else {
        gameObjects.push(new Laser(this.x + 45, this.y - 10, laserImg));
      }
      this.cooldown = 500;  // 0.5초 쿨다운
      let id = setInterval(() => {
        if (this.cooldown > 0) {
          this.cooldown -= 100;
        } else {
          clearInterval(id);
        }
      }, 100);
    }
  }

  canFire() {
    return this.cooldown === 0;
  }

  decrementLife(amount = 1) {
    this.life -= amount;
    if (this.life <= 0) {
      this.life = 0;
      this.dead = true;
    }
  }

  // 점수증가 (적처치 시)
  incrementPoints() {
    this.points += 100;
  }

  move() {
    if (this.speed.y < 0 && this.y > 0) {
      this.y += this.speed.y;
      if (this.y < 0) this.y = 0;
    }
    if (this.speed.y > 0 && this.y < canvas.height - this.height) {
      this.y += this.speed.y;
      if (this.y > canvas.height - this.height) this.y = canvas.height - this.height;
    }
    if (this.speed.x < 0 && this.x > 0) {
      this.x += this.speed.x;
      if (this.x < 0) this.x = 0;
    }
    if (this.speed.x > 0 && this.x < canvas.width - this.width) {
      this.x += this.speed.x;
      if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    }
  }
}

//보조비행선
class SubHero extends GameObject {
  constructor(x, y, width, height, mainHero) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.type = "SubHero";
    this.mainHero = mainHero; 
    this.offsetX = x - mainHero.x;  
    this.offsetY = y - mainHero.y;  

    // 자동 레이저 발사
    this.autoFireInterval = setInterval(() => {
      if (!this.dead && this.mainHero && !this.mainHero.dead) {
        gameObjects.push(new SubLaser(this.x + this.width / 2 - 4.5, this.y - 10));
      }
    }, 2000);
  }


  update() {
    this.x = this.mainHero.x + this.offsetX;
    this.y = this.mainHero.y + this.offsetY;
  }
  cleanup() {
    if (this.autoFireInterval) {
      clearInterval(this.autoFireInterval);
      this.autoFireInterval = null;
    }
  }
}

// 보조비행선 레이저
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

//폭발효과
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

//적군비행선
class Enemy extends GameObject {
  constructor(x, y, width, height) {
    super(x, y);
    this.width = width;
    this.height = height;
    this.type = "Enemy";
    
    // 적군 자동 이동 
    this.movementInterval = setInterval(() => {
      if (this.y < canvas.height - this.height) {
        this.y += 8;
      } else {
        clearInterval(this.movementInterval);
      }
    }, 200);
  }

  cleanup() {
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
      this.movementInterval = null;
    }
  }
}

//보스 (UFO)
class Boss extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = enemyUFOImg.width; 
    this.height = enemyUFOImg.height;
    this.type = "Boss";
    this.health = 30;    
    this.maxHealth = 30;   
    this.direction = 1;   
    this.shootCooldown = 0; 
    
    // 보스 좌우 이동
    this.movementInterval = setInterval(() => {
      this.x += this.direction * 3;
      
      // 화면 끝에 닿으면 방향 전환되도록
      if (this.x <= 0 || this.x >= canvas.width - this.width) {
        this.direction *= -1;
      }
    
      if (this.y < 100) {
        this.y += 1.5;
      }
    }, 100);
    
    this.shootInterval = setInterval(() => {
      if (!this.dead && this.y >= 50) {
        this.fireBossLaser();
      }
    }, 3000);
  }
  
  // 3방향 레이저 발사 (중앙, 좌대각, 우대각)
  fireBossLaser() {
    const centerX = this.x + this.width / 2;
    const bottomY = this.y + this.height;
    // 중앙
    gameObjects.push(new BossLaser(centerX - 4.5, bottomY, 0));
    // 왼쪽 대각선
    gameObjects.push(new BossLaser(centerX - 30, bottomY, -2));
    // 오른쪽 대각선
    gameObjects.push(new BossLaser(centerX + 20, bottomY, 2));
  }
  


  // 보스 피격 처리
  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.dead = true;
      
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const explosionX = this.x + Math.random() * this.width;
          const explosionY = this.y + Math.random() * this.height;
          gameObjects.push(new Explosion(explosionX, explosionY, laserRedShotImg));
        }, i * 100);
      }
    }
  }
  
  // 보스 그리기 (UFO + 체력바)
  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    
    // 체력바 그리기
    const barWidth = this.width;
    const barHeight = 10;
    const barX = this.x;
    const barY = this.y - 15;
    //체력바 배경
    ctx.fillStyle = "red";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // 현재체력
    ctx.fillStyle = "lime";
    const currentBarWidth = (this.health / this.maxHealth) * barWidth;
    ctx.fillRect(barX, barY, currentBarWidth, barHeight);
    // 체력바 테두리
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }
  
  cleanup() {
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
      this.movementInterval = null;
    }
    if (this.shootInterval) {
      clearInterval(this.shootInterval);
      this.shootInterval = null;
    }
  }
}

// 보스가 발사하는 빨간색 레이저 -> 3방향
class BossLaser extends GameObject {
  constructor(x, y, velocityX = 0) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "BossLaser";
    this.img = laserImg;    
    this.velocityX = velocityX;  
    

    let id = setInterval(() => {
      if (this.dead) {
        clearInterval(id);
        return;
      }
      this.y += 10;   
      this.x += this.velocityX; 
      
      // 화면 밖으로 나가면 제거
      if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}


// 플레이어가 발사하는 레이저 (빨강 or 초록)
class Laser extends GameObject {
  constructor(x, y, laserImage = laserImg) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "Laser";
    this.img = laserImage; 

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

// ========== 게임 전역 변수 ==========
let heroImg,    
  enemyImg, 
  enemyUFOImg,   
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
  hero2,     
  subHeroLeft,   
  subHeroRight,    
  eventEmitter = new EventEmitter(),  
  gameLoopId,         
  meteorSpawnInterval, 
  gameMode = null,    
  gameState = 'menu', 
  currentWave = 1,     
  meteorSpawnDelay = 3000,  
  enemySpawnDelay = 300;    




// 키 입력 상태 추적
let pressedKeys = {
  // Player 1 (화살표 키)
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  // Player 2 (WASD키)
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false
};

function isAllHeroesDead() {
  if (gameMode === 'single') {
    return hero.life <= 0;
  } else {
    return hero.life <= 0 && hero2.life <= 0;
  }
}

function isEnemiesDead() {
  const enemies = gameObjects.filter((go) => (go.type === "Enemy" || go.type === "Boss") && !go.dead);
  return enemies.length === 0;
}


// 모든 적/보스를 처치하면 다음 웨이브로 진행
function checkAndStartNextWave() {
  if (isEnemiesDead()) {
    currentWave++;
    
    // Wave 5->보스 웨이브
    if (currentWave === 5) {
      // 보스전에서는 운석 중지
      stopMeteorSpawn();
      // 싱글 모드에서 보조 비행선 제거
      if (gameMode === 'single') {
        if (subHeroLeft) {
          subHeroLeft.cleanup();
          subHeroLeft.dead = true;
          subHeroLeft = null;
        }
        if (subHeroRight) {
          subHeroRight.cleanup();
          subHeroRight.dead = true;
          subHeroRight = null;
        }
      }
      
      setTimeout(() => {
        spawnBoss();
      }, 1000);
    } else if (currentWave > 5) {
      setTimeout(() => {
        endGame(true);
      }, 1000);
      return;
    } else {
      // 일반 웨이브는 적 재생성
      setTimeout(() => {
        createEnemiesPyramid(canvas, enemyImg);
      }, 1000);
      
      meteorSpawnDelay = Math.max(1000, 3000 - (currentWave - 1) * 300);
      stopMeteorSpawn();
      startMeteorSpawn();
    }
    
    showWaveNotification(currentWave);
  }
}

function spawnMeteor() {
  const isBig = Math.random() < 0.3;
  const x = Math.random() * (canvas.width - (isBig ? 100 : 50));
  const meteor = new Meteor(x, 0, isBig);
  gameObjects.push(meteor);
}

//보스 생성 함수
function spawnBoss() {
  const bossX = canvas.width / 2 - enemyUFOImg.width / 2;  
  const boss = new Boss(bossX, -150);
  boss.img = enemyUFOImg; 
  gameObjects.push(boss);
  showBossNotification();
}
function showBossNotification() {
  const notification = {
    alpha: 1.0,
    y: canvas.height / 2
  };

  
  const fadeInterval = setInterval(() => {
    notification.alpha -= 0.015;
    
    if (notification.alpha <= 0) {
      clearInterval(fadeInterval);
    }
  }, 50);
  
  gameObjects.push({
    type: "BossNotification",
    notification: notification,
    draw: function(ctx) {
      ctx.save();
      ctx.globalAlpha = this.notification.alpha;
      ctx.font = "bold 50px Arial";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      ctx.strokeText("⚠ BOSS INCOMING ⚠", canvas.width / 2, this.notification.y);
      ctx.fillText("⚠ BOSS INCOMING ⚠", canvas.width / 2, this.notification.y);
      ctx.restore();
    },
    dead: false,
    rectFromGameObject: function() { return { top: -1000, left: -1000, bottom: -1000, right: -1000 }; }
  });
  
  setTimeout(() => {
    const notifObj = gameObjects.find(go => go.type === "BossNotification");
    if (notifObj) notifObj.dead = true;
  }, 3000);
}

function startMeteorSpawn() {
  if (meteorSpawnInterval) {
    clearInterval(meteorSpawnInterval);
  }
  meteorSpawnInterval = setInterval(() => {
    spawnMeteor();
  }, meteorSpawnDelay);
}

function stopMeteorSpawn() {
  if (meteorSpawnInterval) {
    clearInterval(meteorSpawnInterval);
    meteorSpawnInterval = null;
  }
}

// 웨이브 알림
function showWaveNotification(wave) {
  const notification = {
    wave: wave,
    alpha: 1.0,
    y: canvas.height / 2 - 50
  };
  
  const fadeInterval = setInterval(() => {
    notification.alpha -= 0.02;
    notification.y -= 1;
    
    if (notification.alpha <= 0) {
      clearInterval(fadeInterval);
    }
  }, 50);
  
  // 알림을 그리기 객체 추가
  gameObjects.push({
    type: "Notification",
    notification: notification,
    draw: function(ctx) {
      ctx.save();
      ctx.globalAlpha = this.notification.alpha;
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "yellow";
      ctx.textAlign = "center";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.strokeText(`WAVE ${this.notification.wave}`, canvas.width / 2, this.notification.y);
      ctx.fillText(`WAVE ${this.notification.wave}`, canvas.width / 2, this.notification.y);
      ctx.restore();
    },
    dead: false,
    rectFromGameObject: function() { return { top: -1000, left: -1000, bottom: -1000, right: -1000 }; }
  });
  
  setTimeout(() => {
    const notifObj = gameObjects.find(go => go.notification === notification);
    if (notifObj) notifObj.dead = true;
  }, 2000);
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
  
  if (gameMode === 'single') {
    // 싱글 모드: 중앙에 히어로 배치
    const heroX = canvas.width / 2 - HERO_WIDTH / 2;
    const heroY = canvas.height - canvas.height / 4;
    hero = new Hero(heroX, heroY, HERO_WIDTH, HERO_HEIGHT, 1);
    hero.img = heroImg;
    gameObjects.push(hero);

    // 보조 비행선 추가 (싱글 모드만)
    const heroCenterX = canvas.width / 2;
    const SUB_SCALE = 0.5;
    const subWidth = HERO_WIDTH * SUB_SCALE;
    const subHeight = HERO_HEIGHT * SUB_SCALE;
    const GAP = 10;
    
    const subLeftX = heroCenterX - (HERO_WIDTH / 2 + GAP + subWidth);
    const subY = heroY + (HERO_HEIGHT - subHeight) / 2;
    subHeroLeft = new SubHero(subLeftX, subY, subWidth, subHeight, hero);
    subHeroLeft.img = heroImg;
    gameObjects.push(subHeroLeft);
    
    const subRightX = heroCenterX + (HERO_WIDTH / 2 + GAP);
    subHeroRight = new SubHero(subRightX, subY, subWidth, subHeight, hero);
    subHeroRight.img = heroImg;
    gameObjects.push(subHeroRight);
  } else {
    // 멀티 모드: 두 플레이어를 좌우로 배치
    const heroY = canvas.height - canvas.height / 4;
    const spacing = canvas.width / 3;
    
    // Player 1 (왼쪽)
    const hero1X = spacing - HERO_WIDTH / 2;
    hero = new Hero(hero1X, heroY, HERO_WIDTH, HERO_HEIGHT, 1);
    hero.img = heroImg;
    gameObjects.push(hero);
    
    // Player 2 (오른쪽)
    const hero2X = spacing * 2 - HERO_WIDTH / 2;
    hero2 = new Hero(hero2X, heroY, HERO_WIDTH, HERO_HEIGHT, 2);
    hero2.img = heroImg;
    gameObjects.push(hero2);
  }
}

function drawLife() {
  if (gameMode === 'single') {
    // 싱글 모드: 오른쪽 상단에 표시
    const START_POS = canvas.width - 180;
    for(let i = 0; i < hero.life; i++) {
      ctx.drawImage(lifeImg, START_POS + (45 * (i + 1)), canvas.height - 37);
    }
  } else {
    // 멀티 모드: 각 플레이어별로 표시
    // Player 1 생명력 (왼쪽 하단)
    ctx.font = "20px Arial";
    ctx.fillStyle = "cyan";
    ctx.textAlign = "left";
    ctx.fillText("P1", 10, canvas.height - 40);
    for(let i = 0; i < hero.life; i++) {
      ctx.drawImage(lifeImg, 50 + (35 * i), canvas.height - 50, 30, 30);
    }
    
    // Player 2 생명력 (오른쪽 하단)
    ctx.fillStyle = "yellow";
    ctx.textAlign = "right";
    ctx.fillText("P2", canvas.width - 150, canvas.height - 40);
    for(let i = 0; i < hero2.life; i++) {
      ctx.drawImage(lifeImg, canvas.width - 140 + (35 * i), canvas.height - 50, 30, 30);
    }
  }
}

function drawPoints() {
  if (gameMode === 'single') {
    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "left";
    ctx.fillText("Points: " + hero.points, 10, canvas.height - 20);
  } else {
    // 멀티 모드: 합산 점수 표시
    const totalPoints = hero.points + hero2.points;
    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("Points: " + totalPoints, canvas.width / 2, 40);
  }
}

// 웨이브 정보 표시
function drawWaveInfo() {
  ctx.font = "25px Arial";
  ctx.fillStyle = "yellow";
  ctx.textAlign = "right";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.strokeText("Wave: " + currentWave, canvas.width - 20, 35);
  ctx.fillText("Wave: " + currentWave, canvas.width - 20, 35);
}

function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function showModeSelection() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.font = "40px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("SPACE SHOOTER", canvas.width / 2, canvas.height / 3);
  
  ctx.font = "25px Arial";
  ctx.fillStyle = "cyan";
  ctx.fillText("Press [1] for Single Player", canvas.width / 2, canvas.height / 2);
  
  ctx.fillStyle = "yellow";
  ctx.fillText("Press [2] for Multiplayer", canvas.width / 2, canvas.height / 2 + 50);
  
  ctx.font = "18px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Single: Arrow Keys + Space", canvas.width / 2, canvas.height / 2 + 120);
  ctx.fillText("Multi: P1(Arrows+Space) | P2(WASD+F)", canvas.width / 2, canvas.height / 2 + 150);
}

// ========== 게임 종료 ==========
// 게임 종료 시 최종 결과 화면 표시
function endGame(win) {
  gameState = 'ended';
  clearInterval(gameLoopId);
  stopMeteorSpawn();

  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 최종 점수 계산
    const finalScore = gameMode === 'single' ? hero.points : (hero.points + hero2.points);
    
    if (win) {
      // 승리 화면 (보스 클리어)
      ctx.font = "50px Arial";
      ctx.fillStyle = "gold";
      ctx.textAlign = "center";
      ctx.fillText("🎉 VICTORY! 🎉", canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(`Boss Defeated!`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText(`Final Score: ${finalScore}`, canvas.width / 2, canvas.height / 2 + 50);
    } else {
      // 패배 화면
      ctx.font = "50px Arial";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(`Wave ${currentWave} Reached`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText(`Final Score: ${finalScore}`, canvas.width / 2, canvas.height / 2 + 50);
    }
    
    // 재시작 안내
    ctx.font = "20px Arial";
    ctx.fillStyle = "yellow";
    ctx.fillText("Press [Enter] to restart", canvas.width / 2, canvas.height / 2 + 100);
  }, 200);
}

function resetGame() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
    stopMeteorSpawn();
    
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
    
    if (subHeroLeft) {
      subHeroLeft.cleanup();
      subHeroLeft = null;
    }
    if (subHeroRight) {
      subHeroRight.cleanup();
      subHeroRight = null;
    }
    
    pressedKeys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      KeyW: false,
      KeyS: false,
      KeyA: false,
      KeyD: false
    };
    
    // 난이도 관련 변수 초기화
    currentWave = 1;
    meteorSpawnDelay = 3000;
    
    eventEmitter.clear();
    
    // 메뉴로 돌아가기
    gameMode = null;
    gameState = 'menu';
    hero = null;
    hero2 = null;
    showModeSelection();
  }
}

function drawGameObjects(ctx) {
  gameObjects.forEach((go) => go.draw(ctx));
}

// ========== 히어로 속도 업데이트 ==========
// 키 입력에 따라 플레이어의 이동 속도 설정 (속도 증가: 5->8)
function updateHeroSpeed() {
  const SPEED = 8;  // 이동 속도
  
  // Player 1 (화살표 키)
  if (hero && !hero.dead) {
    hero.speed.x = 0;
    hero.speed.y = 0;

    if (pressedKeys.ArrowUp) hero.speed.y = -SPEED;
    if (pressedKeys.ArrowDown) hero.speed.y = SPEED;
    if (pressedKeys.ArrowLeft) hero.speed.x = -SPEED;
    if (pressedKeys.ArrowRight) hero.speed.x = SPEED;
  }
  
  // Player 2 (WASD)
  if (gameMode === 'multi' && hero2 && !hero2.dead) {
    hero2.speed.x = 0;
    hero2.speed.y = 0;

    if (pressedKeys.KeyW) hero2.speed.y = -SPEED;
    if (pressedKeys.KeyS) hero2.speed.y = SPEED;
    if (pressedKeys.KeyA) hero2.speed.x = -SPEED;
    if (pressedKeys.KeyD) hero2.speed.x = SPEED;
  }
}

// ========== 게임 오브젝트 업데이트 ==========
function updateGameObjects() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy");
  const bosses = gameObjects.filter((go) => go.type === "Boss");
  const lasers = gameObjects.filter((go) => go.type === "Laser");
  const bossLasers = gameObjects.filter((go) => go.type === "BossLaser");
  const meteors = gameObjects.filter((go) => go.type === "Meteor");

  updateHeroSpeed();
  if (hero && !hero.dead) hero.move();
  if (gameMode === 'multi' && hero2 && !hero2.dead) hero2.move();

  // ===== 충돌 감지 시작 =====
  // 1. 플레이어 레이저 vs 일반 적군
  lasers.forEach((laser) => {
    enemies.forEach((enemy) => {
      if (intersectRect(laser.rectFromGameObject(), enemy.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: laser,
          second: enemy,
        });
      }
    });
    
    // 2. 플레이어 레이저 vs 보스
    bosses.forEach((boss) => {
      if (intersectRect(laser.rectFromGameObject(), boss.rectFromGameObject())) {
        laser.dead = true;
        boss.takeDamage();
        
        // 폭발 효과
        const explosion = new Explosion(laser.x, laser.y, laserGreenShotImg);
        gameObjects.push(explosion);
        
        if (boss.dead) {
          if (hero && !hero.dead) hero.points += 1000;
          if (gameMode === 'multi' && hero2 && !hero2.dead) hero2.points += 1000;
        
          checkAndStartNextWave();
        }
      }
    });
  });

  // 3. 보스 레이저 vs 플레이어
  bossLasers.forEach((bossLaser) => {
    if (hero && !hero.dead) {
      const heroRect = hero.rectFromGameObject();
      if (intersectRect(heroRect, bossLaser.rectFromGameObject())) {
        bossLaser.dead = true;
        hero.decrementLife();
        
        if (isAllHeroesDead()) {
          eventEmitter.emit(Messages.GAME_END_LOSS);
          return;
        }
      }
    }
    if (gameMode === 'multi' && hero2 && !hero2.dead) {
      const hero2Rect = hero2.rectFromGameObject();
      if (intersectRect(hero2Rect, bossLaser.rectFromGameObject())) {
        bossLaser.dead = true;
        hero2.decrementLife();
        
        if (isAllHeroesDead()) {
          eventEmitter.emit(Messages.GAME_END_LOSS);
          return;
        }
      }
    }
  });

  // 4. 플레이어 레이저 vs 운석
  lasers.forEach((laser) => {
    meteors.forEach((meteor) => {
      if (intersectRect(laser.rectFromGameObject(), meteor.rectFromGameObject())) {
        if (meteor.isBig) {
          // 큰 운석은 레이저만 파괴
          eventEmitter.emit(Messages.COLLISION_METEOR_BIG_LASER, {
            laser: laser,
            meteor: meteor,
          });
        } else {
          // 작은 운석은 레이저로 파괴 가능
          eventEmitter.emit(Messages.COLLISION_METEOR_LASER, {
            laser: laser,
            meteor: meteor,
          });
        }
      }
    });
  });

  // 5. 운석 vs 일반 적군
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

  // 6. 운석 vs 플레이어
  meteors.forEach((meteor) => {
    if (hero && !hero.dead) {
      const heroRect = hero.rectFromGameObject();
      if (intersectRect(heroRect, meteor.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_METEOR_HERO, { meteor, heroId: 1 });
      }
    }
    if (gameMode === 'multi' && hero2 && !hero2.dead) {
      const hero2Rect = hero2.rectFromGameObject();
      if (intersectRect(hero2Rect, meteor.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_METEOR_HERO, { meteor, heroId: 2 });
      }
    }
  });

  // 7. 일반 적군 vs 플레이어 (직접 충돌)
  enemies.forEach((enemy) => {
    if (hero && !hero.dead) {
      const heroRect = hero.rectFromGameObject();
      if (intersectRect(heroRect, enemy.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy, heroId: 1 });
      }
    }
    if (gameMode === 'multi' && hero2 && !hero2.dead) {
      const hero2Rect = hero2.rectFromGameObject();
      if (intersectRect(hero2Rect, enemy.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy, heroId: 2 });
      }
    }
  });

  // 보조 비행선 위치 업데이트
  if (subHeroLeft && !subHeroLeft.dead) subHeroLeft.update();
  if (subHeroRight && !subHeroRight.dead) subHeroRight.update();

  // 죽은 오브젝트 제거
  gameObjects = gameObjects.filter((go) => !go.dead);
}





function initGame() {
  gameObjects = [];
  gameState = 'playing';
  createEnemiesPyramid(canvas, enemyImg);
  createHero(canvas, heroImg);

  // Player 1 스페이스바
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero && hero.canFire()) {
      hero.fire();
    }
  });
  
  // Player 2 F키
  eventEmitter.on(Messages.KEY_EVENT_F, () => {
    if (gameMode === 'multi' && hero2 && hero2.canFire()) {
      hero2.fire();
    }
  });

  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
    if (gameState === 'ended') {
      resetGame();
    }
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
    
    // 점수는 공동으로 증가
    if (hero && !hero.dead) hero.incrementPoints();
    if (gameMode === 'multi' && hero2 && !hero2.dead) hero2.incrementPoints();

    let explosionImg = first.img === laserImg ? laserRedShotImg : laserGreenShotImg;
    const explosion = new Explosion(second.x, second.y, explosionImg);
    gameObjects.push(explosion);

    // 적을 다 죽이면 다음 웨이브
    checkAndStartNextWave();
  });

  eventEmitter.on(Messages.COLLISION_METEOR_LASER, (_, { laser, meteor }) => {
    laser.dead = true;
    meteor.dead = true;

    let explosionImg = laser.img === laserImg ? laserRedShotImg : laserGreenShotImg;
    const explosion = new Explosion(meteor.x, meteor.y, explosionImg);
    gameObjects.push(explosion);
  });

  eventEmitter.on(Messages.COLLISION_METEOR_BIG_LASER, (_, { laser, meteor }) => {
    laser.dead = true;

    let explosionImg = laser.img === laserImg ? laserRedShotImg : laserGreenShotImg;
    const explosion = new Explosion(laser.x, laser.y, explosionImg);
    gameObjects.push(explosion);
  });

  eventEmitter.on(Messages.COLLISION_METEOR_ENEMY, (_, { meteor, enemy }) => {
    meteor.dead = true;
    enemy.dead = true;

    const explosion = new Explosion(enemy.x, enemy.y, laserGreenShotImg);
    gameObjects.push(explosion);

    checkAndStartNextWave();
  });

  eventEmitter.on(Messages.COLLISION_METEOR_HERO, (_, { meteor, heroId }) => {
    meteor.dead = true;
    const targetHero = heroId === 1 ? hero : hero2;
    if (targetHero) {
      targetHero.decrementLife(meteor.damage);
    }
    
    if (isAllHeroesDead()) {
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return;
    }
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy, heroId }) => {
    enemy.dead = true;
    const targetHero = heroId === 1 ? hero : hero2;
    if (targetHero) {
      targetHero.decrementLife();
    }
    
    if (isAllHeroesDead()) {
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return;
    }
    checkAndStartNextWave();
  });

  eventEmitter.on(Messages.GAME_END_LOSS, () => {
    endGame(false);
  });
}

function startGame() {
  currentWave = 1;
  meteorSpawnDelay = 3000;
  
  initGame();
  startMeteorSpawn();

  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = backgroundPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGameObjects(ctx);
    drawPoints();
    drawLife();
    drawWaveInfo();
    updateGameObjects();
  }, 100);
}

// 키보드 이벤트 처리
let onKeyDown = function (e) {
  // 게임 메뉴 상태
  if (gameState === 'menu') {
    if (e.key === '1') {
      gameMode = 'single';
      startGame();
    } else if (e.key === '2') {
      gameMode = 'multi';
      startGame();
    }
    return;
  }

  // 게임 플레이 중
  if (gameState === 'playing') {
    switch (e.code) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Space':
        e.preventDefault();
        break;
      default:
        break;
    }

    // Player 1
    if (e.code === 'ArrowUp') pressedKeys.ArrowUp = true;
    else if (e.code === 'ArrowDown') pressedKeys.ArrowDown = true;
    else if (e.code === 'ArrowLeft') pressedKeys.ArrowLeft = true;
    else if (e.code === 'ArrowRight') pressedKeys.ArrowRight = true;
    else if (e.code === 'Space' && !e.repeat) {
      eventEmitter.emit(Messages.KEY_EVENT_SPACE);
    }

    // Player 2
    if (gameMode === 'multi') {
      if (e.code === 'KeyW') pressedKeys.KeyW = true;
      else if (e.code === 'KeyS') pressedKeys.KeyS = true;
      else if (e.code === 'KeyA') pressedKeys.KeyA = true;
      else if (e.code === 'KeyD') pressedKeys.KeyD = true;
      else if (e.code === 'KeyF' && !e.repeat) {
        eventEmitter.emit(Messages.KEY_EVENT_F);
      }
    }
  }

  // Enter 키는 모든 상태에서 처리
  if (e.code === 'Enter') {
    eventEmitter.emit(Messages.KEY_EVENT_ENTER);
  }
};

let onKeyUp = function (e) {
  if (gameState !== 'playing') return;

  // Player 1
  if (e.code === 'ArrowUp') pressedKeys.ArrowUp = false;
  else if (e.code === 'ArrowDown') pressedKeys.ArrowDown = false;
  else if (e.code === 'ArrowLeft') pressedKeys.ArrowLeft = false;
  else if (e.code === 'ArrowRight') pressedKeys.ArrowRight = false;

  // Player 2
  if (gameMode === 'multi') {
    if (e.code === 'KeyW') pressedKeys.KeyW = false;
    else if (e.code === 'KeyS') pressedKeys.KeyS = false;
    else if (e.code === 'KeyA') pressedKeys.KeyA = false;
    else if (e.code === 'KeyD') pressedKeys.KeyD = false;
  }
};

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);




// ========== 게임 시작 ==========
window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  // 모든 이미지 로드
  heroImg = await loadTexture('images/player.png');
  enemyImg = await loadTexture('images/enemyShip.png');
  enemyUFOImg = await loadTexture('images/enemyUFO.png');
  laserImg = await loadTexture('images/laserRed.png');
  laserGreenImg = await loadTexture('images/laserGreen.png');
  background = await loadTexture('images/Background/starBackground.png');
  laserRedShotImg = await loadTexture('images/laserRedShot.png');
  laserGreenShotImg = await loadTexture('images/laserGreenShot.png');
  lifeImg = await loadTexture('images/life.png');
  meteorBigImg = await loadTexture('images/meteorBig.png');
  meteorSmallImg = await loadTexture('images/meteorSmall.png');

  backgroundPattern = ctx.createPattern(background, "repeat");
  
  showModeSelection();
};