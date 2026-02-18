import * as THREE from 'three';

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.arena = null;
    this.coverObjects = [];

    this.init();
  }

  init() {
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize camera (first-person view)
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    this.camera.position.set(0, 1.6, 0); // Eye level height

    // Set background gradient
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 20, 50);

    // Create arena
    this.createArena();

    // Create cover objects
    this.createCoverObjects();

    // Setup lighting
    this.setupLighting();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  createArena() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorTexture = this.createGridTexture();
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Walls
    const wallHeight = 5;
    const wallThickness = 0.5;
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.7,
      metalness: 0.3
    });

    // North wall
    const northWall = this.createWall(40, wallHeight, wallThickness, 0, wallHeight / 2, -20, wallMaterial);
    // South wall
    const southWall = this.createWall(40, wallHeight, wallThickness, 0, wallHeight / 2, 20, wallMaterial);
    // East wall
    const eastWall = this.createWall(wallThickness, wallHeight, 40, 20, wallHeight / 2, 0, wallMaterial);
    // West wall
    const westWall = this.createWall(wallThickness, wallHeight, 40, -20, wallHeight / 2, 0, wallMaterial);

    this.arena = {
      floor,
      walls: [northWall, southWall, eastWall, westWall],
      bounds: { min: -20, max: 20 }
    };
  }

  createWall(width, height, depth, x, y, z, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    return wall;
  }

  createCoverObjects() {
    const coverMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.6,
      metalness: 0.4
    });

    // Create 5 cover objects scattered around the arena
    const positions = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
      { x: 0, z: 0 }
    ];

    positions.forEach((pos, index) => {
      let geometry;
      if (index % 2 === 0) {
        // Box
        geometry = new THREE.BoxGeometry(2, 2, 2);
      } else {
        // Cylinder
        geometry = new THREE.CylinderGeometry(1, 1, 2, 8);
      }

      const cover = new THREE.Mesh(geometry, coverMaterial);
      cover.position.set(pos.x, 1, pos.z);
      cover.castShadow = true;
      cover.receiveShadow = true;
      this.scene.add(cover);
      this.coverObjects.push(cover);
    });
  }

  createGridTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    const gridSize = 64;

    for (let i = 0; i <= 512; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  setupLighting() {
    // Ambient light (soft fill)
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);

    // Directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0xff6600, 0.5, 20);
    pointLight1.position.set(-15, 3, -15);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0066ff, 0.5, 20);
    pointLight2.position.set(15, 3, 15);
    this.scene.add(pointLight2);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  getCamera() {
    return this.camera;
  }

  getScene() {
    return this.scene;
  }

  getArena() {
    return this.arena;
  }

  getCoverObjects() {
    return this.coverObjects;
  }
}
