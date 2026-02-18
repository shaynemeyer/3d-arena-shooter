import * as THREE from 'three';
import { Projectile } from './Projectile.js';
import { EnemyAI } from '../ai/EnemyAI.js';

export class Enemy {
  constructor(startPos, scene, audioManager) {
    this.scene = scene;
    this.audioManager = audioManager;

    // Position and movement (at center height of enemy for collision detection)
    this.position = new THREE.Vector3(startPos.x, 1, startPos.z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 3; // Units per second

    // Combat properties
    this.health = 100;
    this.maxHealth = 100;
    this.shootCooldown = 2; // Seconds between shots
    this.shootTimer = 0;

    // Visual mesh
    this.mesh = null;
    this.createMesh();

    // AI system
    this.ai = new EnemyAI(this);

    // Projectile to return on next update
    this.newProjectile = null;

    // Starting position for reset
    this.startPosition = this.position.clone();
  }

  createMesh() {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0x330000,
      roughness: 0.7,
      metalness: 0.3
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 1; // Center at ground level
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.scene.add(this.mesh);
  }

  update(deltaTime, player, scene) {
    // Update shoot timer
    if (this.shootTimer > 0) {
      this.shootTimer -= deltaTime;
    }

    // Update AI
    this.ai.update(deltaTime, player, scene);

    // Update mesh position
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 1;
  }

  shoot(direction) {
    if (this.shootTimer > 0) return;

    // Create projectile at enemy position
    const spawnPosition = this.position.clone();
    spawnPosition.y = 1; // Shoot from center height

    this.newProjectile = new Projectile(
      spawnPosition,
      direction,
      'enemy'
    );

    // Reset cooldown
    this.shootTimer = this.shootCooldown;

    // Play shoot sound
    this.audioManager.playSound('shoot-enemy');
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }

    // Flash effect
    this.mesh.material.emissive.setHex(0xff0000);
    setTimeout(() => {
      if (this.mesh && this.mesh.material) {
        this.mesh.material.emissive.setHex(0x330000);
      }
    }, 100);

    console.log(`Enemy took ${amount} damage. Health: ${this.health}`);
  }

  getNewProjectile() {
    const projectile = this.newProjectile;
    this.newProjectile = null;
    return projectile;
  }

  canShoot() {
    return this.shootTimer <= 0;
  }

  reset() {
    this.position.copy(this.startPosition);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.shootTimer = 0;
    this.newProjectile = null;
    this.ai.reset();
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 1;
  }
}
