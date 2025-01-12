const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

let handle = null;
let pump = null;
let blower = null;
let currentPumpCount = 0;

function preload() {
  this.load.image("background", "assets/background.png");
  this.load.image("pump", "assets/pump.png");
  this.load.image("handle", "assets/handle.png");
  this.load.image("blower", "assets/blower.png");
  this.load.image("thread", "assets/thread.png");

  for (let i = 100001; i <= 100010; i++) {
    this.load.image(`balloon${i}`, `assets/Symbol ${i}.png`);
  }

  for (let i = 10001; i <= 10026; i++) {
    this.load.image(`Alphabet${i}`, `assets/Symbol ${i}.png`);
  }
  // Load background music
  this.load.audio("bgMusic", "assets/Carefree.mp3");

  this.load.audio("burstSound", "assets/pop.mp3"); // Balloon burst sound
}

function create() {
  // Set up background
  this.add
    .image(0, 0, "background")
    .setOrigin(0, 0)
    .setScale(config.width / 800, config.height / 600);

  // Set up handle, blower, and pump
  handle = this.physics.add
    .image(1235, 384, "handle")
    .setScale(0.4)
    .setInteractive();
  pump = this.add.image(1235, 520, "pump").setScale(0.4).setDepth(1);
  blower = this.add.image(1124, 506, "blower").setScale(0.4).setDepth(1);

  // Set world bounds
  this.physics.world.setBounds(0, 0, config.width, config.height);

  // Handle interaction
  handle.on("pointerdown", () => {
    this.tweens.add({
      targets: handle,
      y: 450,
      ease: "Sine.easeInOut",
      duration: 250,
      yoyo: true,
      onStart: () => {
        this.tweens.add({
          targets: pump,
          scaleY: 0.35,
          ease: "Sine.easeInOut",
          duration: 250,
          yoyo: true,
        });
        this.tweens.add({
          targets: blower,
          y: 516,
          ease: "Sine.easeInOut",
          duration: 250,
          yoyo: true,
        });
        inflateBalloon(this);
      },
    });
  });
  // Play background music
  const bgMusic = this.sound.add("bgMusic", { loop: true, volume: 0.5 }); // Adjust volume if needed
  bgMusic.play();
}

function inflateBalloon(scene) {
  currentPumpCount++;
  if (currentPumpCount === 1) {
    // Create a new balloon on the first pump
    createBalloon(scene);
  }

  // Gradually inflate all balloons on the screen
  scene.children.list.forEach((child) => {
    if (child instanceof Phaser.GameObjects.Container) {
      // Generate random velocity in both X and Y directions
      const randomVelocityX = Phaser.Math.Between(-40, 2); // Random horizontal movement (-2 to 2 pixels)
      const randomVelocityY = Phaser.Math.Between(-1, 1); // Random vertical movement (-2 to 2 pixels)

      child.body.setVelocityX(child.body.velocity.x + randomVelocityX); // Apply random X velocity
      child.body.setVelocityY(child.body.velocity.y + randomVelocityY); // Apply random Y velocity

      // Gradual inflation with a limit
      scene.tweens.add({
        targets: child,
        scaleX: Math.min(child.scaleX + 0.05, 0.5),
        scaleY: Math.min(child.scaleY + 0.05, 0.5),
        ease: "Sine.easeInOut",
        duration: 250,
      });
    }
  });

  // Fly away after 3 pumps
  if (currentPumpCount >= 3) {
    currentPumpCount = 0; // Reset pump count
    flyBalloonAway(scene);
  }
}

function createBalloon(scene) {
  const balloonImage = `balloon${Phaser.Math.Between(100001, 100010)}`;
  const alphabetImage = `Alphabet${Phaser.Math.Between(10001, 10026)}`;

  // Create the balloon and alphabet
  const balloon = scene.add.image(0, 0, balloonImage).setScale(0.5);
  const alphabet = scene.add.image(0, -6, alphabetImage).setScale(0.3); // Positioned above the balloon
  const thread = scene.add.image(6, 146, "thread").setScale(0.5); // Positioned below the balloon

  // Group them into a container
  const balloonContainer = scene.add.container(1074, 433, [
    balloon,
    alphabet,
    thread,
  ]);
  balloonContainer.setScale(0.1);
  balloonContainer.setDepth(10);
  scene.physics.world.enable(balloonContainer); // Add physics to the container

  // Ensure container does not go outside the world bounds
  balloonContainer.body.setCollideWorldBounds(true); // Keep the container within the screen bounds
  balloonContainer.body.setBounce(0.8); // Set bounce effect when it hits the screen edges

  // Set custom hit area to ensure clicking anywhere on the container is detected
  balloonContainer.setInteractive(
    new Phaser.Geom.Circle(0, 0, 100), // Adjust the radius of the hit area if needed
    Phaser.Geom.Circle.Contains
  );

  // Add click event listener to burst the balloon
  balloonContainer.on("pointerdown", () => {
    burstBalloon(scene, balloonContainer); // Call the burstBalloon function
  });

  // Animate the balloon's initial inflation
  scene.tweens.add({
    targets: balloonContainer,
    scaleX: 0.2,
    scaleY: 0.2,
    ease: "Sine.easeInOut",
    duration: 250,
  });

  balloonContainer.setDepth(3); // Ensure the container appears above other elements
}

function burstBalloon(scene, balloonContainer) {
  // Play balloon burst sound
  const burstSound = scene.sound.add("burstSound");
  burstSound.play();

  // Create burst effect (optional, e.g., a quick scaling or rotation animation)
  scene.tweens.add({
    targets: balloonContainer,
    scaleX: 0.8, // You can scale to a larger size before bursting for effect
    scaleY: 0.8,
    ease: "Sin8.easeInOut",
    duration: 150,
    onComplete: () => {
      balloonContainer.destroy(); // Destroy the balloon after the burst effect
    },
  });
}

function flyBalloonAway(scene) {
  const balloons = scene.children.list.filter(
    (child) => child instanceof Phaser.GameObjects.Container // Select containers
  );

  balloons.forEach((balloonContainer) => {
    const randomVelocityX = Phaser.Math.Between(-50, 50);
    const randomVelocityY = Phaser.Math.Between(-75, -150);

    balloonContainer.body.setVelocity(randomVelocityX, randomVelocityY);
    balloonContainer.setInteractive(true); // Ensure it's interactive (redundant if already set)
    balloonContainer.body.setCollideWorldBounds(true); // Ensure the balloon stays within bounds
    balloonContainer.body.setBounce(1); // Make the balloon bounce when it hits the bounds
  });
}

function update() {}
