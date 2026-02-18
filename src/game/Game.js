import { Scene } from './Scene.js';
import { GameState } from './GameState.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { InputManager } from '../systems/InputManager.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { AudioManager } from '../systems/AudioManager.js';
import { HUD } from '../ui/HUD.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.player = null;
    this.enemy = null;
    this.gameState = null;
    this.inputManager = null;
    this.collisionSystem = null;
    this.audioManager = null;
    this.hud = null;

    this.projectiles = [];
    this.lastTime = 0;
    this.isRunning = false;

    this.init();
  }

  init() {
    // Initialize systems
    this.scene = new Scene(this.canvas);
    this.gameState = new GameState();
    this.inputManager = new InputManager();
    this.collisionSystem = new CollisionSystem();
    this.audioManager = new AudioManager();
    this.hud = new HUD();

    // Initialize entities
    this.player = new Player(
      this.scene.getCamera(),
      this.inputManager,
      this.audioManager
    );

    this.enemy = new Enemy(
      { x: 0, y: 0, z: -18 }, // Opposite side of arena from player
      this.scene.getScene(),
      this.audioManager
    );

    // Setup restart button
    const restartButton = document.getElementById('restart-button');
    restartButton.addEventListener('click', () => this.restart());

    console.log('Game initialized');
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 0.1s
    this.lastTime = currentTime;

    // Update game
    if (this.gameState.isPlaying()) {
      this.update(deltaTime);
    }

    // Render
    this.render();

    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime) {
    // Update player
    this.player.update(deltaTime);

    // Check if player wants to shoot
    const playerProjectile = this.player.getNewProjectile();
    if (playerProjectile) {
      this.projectiles.push(playerProjectile);
      this.scene.getScene().add(playerProjectile.mesh);
    }

    // Update enemy
    this.enemy.update(deltaTime, this.player, this.scene.getScene());

    // Check if enemy shoots
    const enemyProjectile = this.enemy.getNewProjectile();
    if (enemyProjectile) {
      this.projectiles.push(enemyProjectile);
      this.scene.getScene().add(enemyProjectile.mesh);
    }

    // Update projectiles
    this.updateProjectiles(deltaTime);

    // Collision detection
    const hitEvents = this.collisionSystem.resolveCollisions(
      this.player,
      this.enemy,
      this.projectiles,
      this.scene.getArena(),
      this.scene.getCoverObjects()
    );

    // Handle hit events
    this.handleHitEvents(hitEvents);

    // Check win/lose conditions
    this.checkGameOver();

    // Update HUD
    this.hud.update(this.player, this.enemy, this.gameState);
  }

  updateProjectiles(deltaTime) {
    // Update all projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update(deltaTime);

      // Remove inactive projectiles
      if (!projectile.active) {
        this.scene.getScene().remove(projectile.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  handleHitEvents(hitEvents) {
    console.log('Hit events:', hitEvents);
    hitEvents.forEach(event => {
      if (event.type === 'projectile-hit-player') {
        console.log('Player hit!');
        this.player.takeDamage(event.damage);
        this.audioManager.playSound('hit');
      } else if (event.type === 'projectile-hit-enemy') {
        console.log('Enemy hit! Damage:', event.damage);
        this.enemy.takeDamage(event.damage);
        this.audioManager.playSound('hit');
      }
    });
  }

  checkGameOver() {
    if (this.player.health <= 0 && this.gameState.getState() === 'PLAYING') {
      this.gameState.playerDied();
      this.hud.showGameOver(false);
      this.audioManager.playSound('lose');
    } else if (this.enemy.health <= 0 && this.gameState.getState() === 'PLAYING') {
      this.gameState.enemyDied();
      this.hud.showGameOver(true);
      this.audioManager.playSound('win');
    }
  }

  render() {
    this.scene.render();
  }

  restart() {
    // Remove all projectiles
    this.projectiles.forEach(projectile => {
      this.scene.getScene().remove(projectile.mesh);
    });
    this.projectiles = [];

    // Reset game state
    this.gameState.reset();

    // Reset player
    this.player.reset();

    // Reset enemy
    this.enemy.reset();

    // Hide game over screen
    this.hud.hideGameOver();

    // Update HUD
    this.hud.update(this.player, this.enemy, this.gameState);

    console.log('Game restarted');
  }

  stop() {
    this.isRunning = false;
  }
}
