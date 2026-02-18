import * as THREE from 'three';

export class Projectile {
  constructor(position, direction, owner) {
    this.position = position.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(20); // 20 units/second
    this.owner = owner; // 'player' or 'enemy'
    this.damage = 20;
    this.lifetime = 3; // seconds
    this.age = 0;
    this.active = true;

    // Create visual mesh
    this.createMesh();
  }

  createMesh() {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);

    // Different colors for player and enemy projectiles
    const color = this.owner === 'player' ? 0xffff00 : 0xff0000; // Yellow for player, red for enemy

    const material = new THREE.MeshBasicMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 1
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);

    // Add point light for glow effect
    this.light = new THREE.PointLight(color, 0.5, 3);
    this.mesh.add(this.light);
  }

  update(deltaTime) {
    if (!this.active) return;

    // Update age
    this.age += deltaTime;

    // Check lifetime
    if (this.age >= this.lifetime) {
      this.active = false;
      return;
    }

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Update mesh position
    this.mesh.position.copy(this.position);
  }

  deactivate() {
    this.active = false;
  }

  getPosition() {
    return this.position;
  }

  getOwner() {
    return this.owner;
  }

  getDamage() {
    return this.damage;
  }
}
