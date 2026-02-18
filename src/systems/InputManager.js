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

    if (this.isKeyPressed('ArrowUp')   || this.isKeyPressed('w')) movement.z = -1; // Forward
    if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('s')) movement.z =  1; // Backward
    if (this.isKeyPressed('a')) movement.x = -1; // Strafe left
    if (this.isKeyPressed('d')) movement.x =  1; // Strafe right

    if (movement.length() > 0) movement.normalize();
    return movement;
  }

  // Returns -1 (turn left), 1 (turn right), or 0
  getTurnDirection() {
    if (this.isKeyPressed('ArrowLeft'))  return -1;
    if (this.isKeyPressed('ArrowRight')) return  1;
    return 0;
  }

  isShootPressed() {
    return this.isKeyPressed(' '); // Spacebar
  }

  reset() {
    this.keys = {};
  }
}
