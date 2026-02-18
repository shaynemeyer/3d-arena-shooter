import * as THREE from 'three';
import { Projectile } from './Projectile.js';

export class Player {
  constructor(camera, inputManager, audioManager) {
    this.camera = camera;
    this.inputManager = inputManager;
    this.audioManager = audioManager;

    // Position and movement
    this.position = new THREE.Vector3(0, 1.6, 18); // Starting position - furthest edge
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.moveSpeed = 5; // Units per second

    // Camera rotation (fixed forward for arrow keys only)
    this.rotation = 0; // Y-axis rotation in radians

    // Combat properties
    this.health = 100;
    this.maxHealth = 100;
    this.ammo = 30;
    this.maxAmmo = 30;
    this.canShoot = true;
    this.shootCooldown = 0.5; // Seconds
    this.shootTimer = 0;

    // Projectile to return on next update
    this.newProjectile = null;

    // Damage flash effect
    this.damageFlashTime = 0;

    // Initialize camera position
    this.updateCameraPosition();
  }

  update(deltaTime) {
    // Update shoot timer
    if (this.shootTimer > 0) {
      this.shootTimer -= deltaTime;
      if (this.shootTimer <= 0) {
        this.canShoot = true;
      }
    }

    // Update damage flash
    if (this.damageFlashTime > 0) {
      this.damageFlashTime -= deltaTime;
    }

    // Handle movement
    this.handleMovement(deltaTime);

    // Handle shooting
    this.handleShooting();

    // Update camera position
    this.updateCameraPosition();
  }

  handleMovement(deltaTime) {
    const turnSpeed = 2.0; // radians per second
    this.rotation += this.inputManager.getTurnDirection() * turnSpeed * deltaTime;

    const movementInput = this.inputManager.getMovementVector();

    if (movementInput.length() > 0) {
      // Apply camera rotation to movement direction
      const direction = new THREE.Vector3();
      direction.x = movementInput.x;
      direction.z = movementInput.z;
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);

      // Calculate new velocity
      this.velocity.copy(direction.multiplyScalar(this.moveSpeed));

      // Store previous position for collision recovery
      this.previousPosition = this.position.clone();

      // Update position
      this.position.x += this.velocity.x * deltaTime;
      this.position.z += this.velocity.z * deltaTime;
    } else {
      this.velocity.set(0, 0, 0);
    }
  }

  handleShooting() {
    this.newProjectile = null;

    if (this.inputManager.isShootPressed() && this.canShoot && this.ammo > 0) {
      this.shoot();
    }
  }

  shoot() {
    // Get shooting direction from camera
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    // Create projectile slightly in front of camera
    const spawnPosition = this.position.clone().add(direction.clone().multiplyScalar(0.5));

    this.newProjectile = new Projectile(
      spawnPosition,
      direction,
      'player'
    );

    // Update ammo and cooldown
    this.ammo--;
    this.canShoot = false;
    this.shootTimer = this.shootCooldown;

    // Play shoot sound
    this.audioManager.playSound('shoot-player');
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }

    // Trigger damage flash effect
    this.damageFlashTime = 0.2;

    console.log(`Player took ${amount} damage. Health: ${this.health}`);
  }

  updateCameraPosition() {
    this.camera.position.copy(this.position);
    this.camera.rotation.y = this.rotation;
  }

  getNewProjectile() {
    const projectile = this.newProjectile;
    this.newProjectile = null;
    return projectile;
  }

  reset() {
    this.position.set(0, 1.6, 18);
    this.velocity.set(0, 0, 0);
    this.rotation = 0;
    this.health = this.maxHealth;
    this.ammo = this.maxAmmo;
    this.canShoot = true;
    this.shootTimer = 0;
    this.newProjectile = null;
    this.damageFlashTime = 0;
    this.updateCameraPosition();
  }

  getPosition() {
    return this.position;
  }

  getVelocity() {
    return this.velocity;
  }

  isDamageFlashing() {
    return this.damageFlashTime > 0;
  }
}
