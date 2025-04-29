// Khai báo biến toàn cục
let cursors, player, stars, score = 0, scoreText;
let enemies, enemyBullets;
let gameOver = false;
let winText, gameOverText;
let lives = 5, livesText;

function preload() {
  this.load.image('bullet', 'assets/bullet.png');
  this.load.audio('collect', 'assets/collect.wav');
  this.load.image('sky', 'assets/sky.png');
  this.load.image('ground', 'assets/platform.png');
  this.load.image('star', 'https://labs.phaser.io/assets/sprites/yellow_ball.png');
  this.load.spritesheet('dude', 'assets/dude.png', {
    frameWidth: 32,
    frameHeight: 48
  });
  this.load.spritesheet('enemy', 'assets/anatomythumb.png', {
    frameWidth: 16,
    frameHeight: 32
  });
}

function create() {
  this.add.image(400, 300, 'sky');

  const platforms = this.physics.add.staticGroup();
  platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  player = this.physics.add.sprite(100, 450, 'dude');
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);

  enemies = this.physics.add.group();
  enemyBullets = this.physics.add.group();

  const bot1 = enemies.create(400, 450, 'enemy');
  const bot2 = enemies.create(600, 450, 'enemy');

  enemies.getChildren().forEach(bot => {
    bot.setBounce(1);
    bot.setCollideWorldBounds(true);
    bot.setVelocityX(50);
    bot.anims.play('enemy_idle', true);
    this.physics.add.collider(bot, platforms);
    this.physics.add.collider(bot, player, hitEnemy, null, this);
  });

  this.time.addEvent({
    delay: 2000,
    loop: true,
    callback: () => {
      enemies.getChildren().forEach(bot => {
        fireEnemyBullet.call(this, bot);
      });
    }
  });

  this.physics.add.collider(player, enemyBullets, () => {
    loseLife.call(this);
  }, null, this);

  this.anims.create({
    key: 'enemy_idle',
    frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
    frameRate: 4,
    repeat: -1
  });

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [{ key: 'dude', frame: 4 }],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  cursors = this.input.keyboard.createCursorKeys();

  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 100, stepX: 70 }
  });

  stars.children.iterate(child => {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  this.physics.add.collider(stars, platforms);
  this.physics.add.overlap(player, stars, collectStar, null, this);

  this.collectSound = this.sound.add('collect');

  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#ffffff'
  });

  livesText = this.add.text(16, 50, 'Lives: 5', {
    fontSize: '32px',
    fill: '#ffffff'
  });

  winText = this.add.text(400, 300, 'You Win!', {
    fontSize: '48px',
    fill: '#00ff00'
  }).setOrigin(0.5).setVisible(false);

  gameOverText = this.add.text(400, 300, 'Game Over', {
    fontSize: '48px',
    fill: '#ff0000'
  }).setOrigin(0.5).setVisible(false);
}

function update() {
  if (gameOver) return;

  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play('left', true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play('right', true);
  } else {
    player.setVelocityX(0);
    player.anims.play('turn');
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }

  enemies.getChildren().forEach(bot => {
    const distance = player.x - bot.x;
    if (Math.abs(distance) > 5) {
      bot.setVelocityX(distance > 0 ? 50 : -50);
    } else {
      bot.setVelocityX(0);
    }
  });
}

function fireEnemyBullet(bot) {
  const bullet = enemyBullets.create(bot.x, bot.y, 'bullet');
  bullet.setVelocityX((player.x < bot.x ? -1 : 1) * 200);
  bullet.setCollideWorldBounds(true);
  bullet.body.onWorldBounds = true;
  bullet.setBounce(1);
}

function collectStar(player, star) {
  this.collectSound.play();
  star.disableBody(true, true);
  score += 10;
  scoreText.setText('Score: ' + score);

  if (stars.countActive(true) === 0) {
    winText.setVisible(true);
    gameOver = true;
  }
}

function loseLife() {
  lives--;
  livesText.setText('Lives: ' + lives);

  if (lives <= 0) {
    hitEnemy.call(this, player);
  } else {
    player.setPosition(100, 450);
    player.setTint(0xffff00);
    player.body.enable = false;

    this.time.delayedCall(1000, () => {
      player.clearTint();
      player.body.enable = true;
    });
  }
}

function hitEnemy(player) {
  player.setTint(0xff0000);
  player.anims.play('turn');
  gameOverText.setVisible(true);
  gameOver = true;

  this.physics.pause();

  this.time.delayedCall(3000, () => {
    gameOver = false;
    lives = 5;
    score = 0;
    this.scene.restart();
  });
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
