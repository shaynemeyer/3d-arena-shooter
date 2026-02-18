import * as THREE from 'three';

export class InputManager {
  constructor() {
    this.keys = {};
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(event) {
    this.keys[event.key] = true;
  }

  onKeyUp(event) {
    this.keys[event.key] = false;
  }

  isKeyPressed(key) {
    return this.keys[key] === true;
  }

  getMovementVector() {
    const movement = new THREE.Vector3(0, 0, 0);

    // Arrow keys for movement
    if (this.isKeyPressed('ArrowUp')) {
      movement.z = -1; // Forward
    }
    if (this.isKeyPressed('ArrowDown')) {
      movement.z = 1; // Backward
    }
    if (this.isKeyPressed('ArrowLeft')) {
      movement.x = -1; // Strafe left
    }
    if (this.isKeyPressed('ArrowRight')) {
      movement.x = 1; // Strafe right
    }

    // Normalize to prevent faster diagonal movement
    if (movement.length() > 0) {
      movement.normalize();
    }

    return movement;
  }

  isShootPressed() {
    return this.isKeyPressed(' '); // Spacebar
  }

  reset() {
    this.keys = {};
  }
}
