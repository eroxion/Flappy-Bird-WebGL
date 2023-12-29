var config = {
  type: Phaser.AUTO,
  scale: {
    width: innerWidth - 10,
    height: innerHeight - 10,
  },
  backgroundColor: "#4dc1cb",
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 300,
      },
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

let game = new Phaser.Game(config);
let velPipes = -200;
let score = 0;
let scene;
let scoredPipe = false;
let posX = 1000;
const PIPE_GAP = 700;
let pipeDestroySound;
let gameOverSound;
let clickSound;
let bgm;
let gameon = false;
let startScreen;

let PipeUpClass = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,
  initialize: function PipeUpClass(scene) {
    Phaser.GameObjects.Image.call(this, scene, 0, 0, "pipeUp");
  },
});

let PipeDownClass = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,
  initialize: function PipeDownClass(scene) {
    Phaser.GameObjects.Image.call(this, scene, 0, 0, "pipeDown");
  },
});

function preload() {
  this.load.spritesheet("bird", "./sprites/redbird.png", {
    frameWidth: 34,
    frameHeight: 24,
  });
  this.load.image("message", "./sprites/message.png");
  this.load.image("pipeUp", "./sprites/pipe-up.png");
  this.load.image("pipeDown", "./sprites/pipe-down.png");
  this.load.image("background", "./sprites/background.png");
  this.load.image("base", "./sprites/base.png");
  this.load.image("gameover", "./sprites/gameover.png");
  this.load.audio("pipeDestroy", ["./audio/point.wav"]);
  this.load.audio("gameOver", ["./audio/die.wav"]);
  this.load.audio("click", ["./audio/wing.wav"]);
  this.load.audio("bgm", ["./audio/bgm.wav"]);
}

function create() {
  pipeDestroySound = this.sound.add("pipeDestroy");
  gameOverSound = this.sound.add("gameOver");
  clickSound = this.sound.add("click");
  bgm = this.sound.add("bgm");
  bgm.play({ loop: true });

  startScreen = this.add.image(
    game.config.width / 2,
    game.config.height / 2,
    "message"
  );
  startScreen.setOrigin(0.5);
  startScreen.setDepth(2);
  this.input.on("pointerdown", startGame);

  const background = this.add.tileSprite(
    game.config.width / 2,
    game.config.height / 2,
    game.config.width,
    560,
    "background"
  );
  background.setName("background");
  background.setOrigin(0.5);
  background.setDepth(-1);

  const base = this.add.tileSprite(
    game.config.width / 2,
    game.config.height - 10,
    game.config.width,
    200,
    "base"
  );
  base.setName("base");
  base.setOrigin(0.5);
  base.setDepth(-1);

  scene = this;
  this.input.on("pointerdown", () => {
    this.bird.setVelocityY(-250);
    if (gameon) {
      clickSound.play();
    }
  });
  birdRot = 0;
  this.bird = this.physics.add.sprite(100, game.config.height / 2, "bird", 0);
  this.bird.body.allowGravity = false;

  this.pipeUp = this.physics.add.group({
    classType: PipeUpClass,
    runChildUpdate: true,
    allowGravity: false,
  });

  this.pipeDown = this.physics.add.group({
    classType: PipeDownClass,
    runChildUpdate: true,
    allowGravity: false,
  });

  this.anims.create({
    key: "fly",
    frames: this.anims.generateFrameNumbers("bird", {
      start: 0,
      end: 2,
    }),
    frameRate: 12,
    repeat: -1,
  });

  scoredPipe = false;

  scoreText = this.add.text(10, 10, "Score: 0", { font: "16px Arial" });
  scoreText.setDepth(1);
  this.physics.add.collider(this.bird, this.pipeUp, birdDie);
  this.physics.add.collider(this.bird, this.pipeDown, birdDie);
}

function update(time) {
  if (time % 6 == 0 && gameon) {
    let pipeUpperY = Phaser.Math.RND.between(-100, 0);
    let pipeLowerY = pipeUpperY + PIPE_GAP;
    this.pipeU = this.pipeUp
      .get()
      .setActive(true)
      .setVisible(true)
      .setPosition(posX + 100, pipeUpperY)
      .setScale(1.1, 1.7);

    this.pipeD = this.pipeDown
      .get()
      .setActive(true)
      .setVisible(true)
      .setPosition(posX + 100, pipeLowerY)
      .setScale(1.1, 1.7);

    this.pipeUp.setVelocityX(velPipes);
    this.pipeDown.setVelocityX(velPipes);
    posX += 200;
  }
  const background = this.children.getByName("background");
  const base = this.children.getByName("base");
  if (gameon) {
    background.tilePositionX += 1;
    base.tilePositionX += 2;
    this.bird.anims.play("fly", true);

    scoreText.setText("Score: " + score);

    this.pipeUp.getChildren().forEach((pipe) => {
      if (pipe.x + pipe.width < this.bird.x) {
        pipe.destroy();
        pipeDestroySound.play();
      }

      if (this.bird.x > pipe.x + pipe.width && !scoredPipe) {
        scoredPipe = true;
        score++;
      }

      if (pipe.x + pipe.width < this.bird.x) {
        scoredPipe = false;
      }
    });

    this.pipeDown.getChildren().forEach((pipe) => {
      if (pipe.x + pipe.width < this.bird.x) {
        pipe.destroy();
      }
    });

    if (this.bird.y > innerHeight - 10) {
      birdDie(this.bird, this.pipeUp);
    }

    if (this.bird.body.velocity.y > 0 && birdRot < 55) {
      birdRot += 3;
    } else if (birdRot > -45) {
      birdRot -= 3;
    }
    this.bird.angle = birdRot;
  }
}

function startGame() {
  startScreen.setVisible(false);
  scene.bird.body.allowGravity = true;
  scene.input.off("pointerdown", startGame);
  gameon = true;
}

function birdDie(bird) {
  gameOverSound.play();
  gameon = false;
  bgm.pause();

  let gameOverImage = scene.add
    .image(innerWidth / 2, innerHeight / 2 - 50, "gameover")
    .setOrigin(0.5)
    .setDepth(2);

  let scoreText = scene.add
    .text(innerWidth / 2, innerHeight / 2 + 10, "Score: " + score, {
      font: "24px Arial",
      fill: "#000",
    })
    .setOrigin(0.5);

  let button = scene.add
    .text(innerWidth / 2, innerHeight / 2 + 50, "Try Again", {
      font: "32px Arial",
      backgroundColor: "#fdd835",
      align: "center",
      stroke: "#000000",
      strokeThickness: 5,
      padding: {
        x: 5,
        y: 3,
      },
    })
    .setOrigin(0.5);
  button.setInteractive();

  button.on("pointerover", function () {
    button.setStyle({ backgroundColor: "#ffeb3b" });
  });

  button.on("pointerout", function () {
    button.setStyle({ backgroundColor: "#fdd835" });
  });

  velPipes = 0;
  scene.physics.pause();

  button.on("pointerdown", () => {
    scoredPipe = false;
    location.reload();
  });
}
