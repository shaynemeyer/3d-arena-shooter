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
    this.mesh = new THREE.Group();

    const skinMat = () => new THREE.MeshStandardMaterial({
      color: 0x44bb66,
      emissive: 0x0a2a11,
      roughness: 0.6,
      metalness: 0.2
    });

    // Torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.0, 0.5), skinMat());
    body.position.y = 0;
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);

    // Wide alien head (classic inverted-teardrop silhouette)
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.75), skinMat());
    head.position.y = 0.85;
    head.castShadow = true;
    this.mesh.add(head);

    // Glowing yellow eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffee00,
      emissive: 0xffaa00,
      emissiveIntensity: 1.5,
      roughness: 0.1
    });
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 6);
    [-0.22, 0.22].forEach(x => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(x, 0.9, -0.38);
      this.mesh.add(eye);
    });

    // Antennae stalks
    const antGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35);
    [[-0.2, 0.3], [0.2, -0.3]].forEach(([x, rz]) => {
      const ant = new THREE.Mesh(antGeo, skinMat());
      ant.position.set(x, 1.38, 0);
      ant.rotation.z = rz;
      this.mesh.add(ant);
    });

    // Glowing purple antenna tips
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xcc44ff,
      emissive: 0xaa00ff,
      emissiveIntensity: 2.0,
      roughness: 0.1
    });
    const tipGeo = new THREE.SphereGeometry(0.06, 8, 6);
    [[-0.27, 1.55], [0.27, 1.55]].forEach(([x, y]) => {
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(x, y, 0);
      this.mesh.add(tip);
    });

    // Track body parts for damage flash
    this.bodyParts = [body, head];

    this.mesh.position.copy(this.position);
    this.mesh.position.y = 1;
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
    this.bodyParts.forEach(p => p.material.emissive.setHex(0xff0000));
    setTimeout(() => {
      if (this.mesh) {
        this.bodyParts.forEach(p => p.material.emissive.setHex(0x0a2a11));
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
