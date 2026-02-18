import * as THREE from 'three';

export class EnemyAI {
  constructor(enemy) {
    this.enemy = enemy;
    this.state = 'PATROL'; // PATROL, CHASE, ATTACK

    // Patrol behavior
    this.patrolPoints = [
      new THREE.Vector3(15, 0, 15),
      new THREE.Vector3(15, 0, -15),
      new THREE.Vector3(-15, 0, -15),
      new THREE.Vector3(-15, 0, 15)
    ];
    this.currentPatrolIndex = 0;

    // Vision and detection
    this.visionRange = 15;
    this.attackRange = 8;
    this.retreatRange = 12;
    this.lostPlayerTime = 0;
    this.lostPlayerTimeout = 3;

    // Movement
    this.stuckTimer = 0;
    this.lastPosition = this.enemy.position.clone();

    // Raycaster for line-of-sight
    this.raycaster = new THREE.Raycaster();
  }

  update(deltaTime, player, scene) {
    // Update state based on conditions
    this.updateState(deltaTime, player, scene);

    // Execute behavior based on current state
    switch (this.state) {
      case 'PATROL':
        this.patrol(deltaTime);
        break;
      case 'CHASE':
        this.chasePlayer(deltaTime, player);
        break;
      case 'ATTACK':
        this.attackPlayer(deltaTime, player);
        break;
    }

    // Check if stuck
    this.checkStuck(deltaTime);
  }

  updateState(deltaTime, player, scene) {
    const canSeePlayer = this.canSeePlayer(player, scene);
    const distanceToPlayer = this.enemy.position.distanceTo(player.position);

    if (canSeePlayer) {
      this.lostPlayerTime = 0;

      if (distanceToPlayer <= this.attackRange) {
        this.state = 'ATTACK';
      } else if (distanceToPlayer <= this.visionRange) {
        this.state = 'CHASE';
      }
    } else {
      // Player not visible
      if (this.state === 'CHASE' || this.state === 'ATTACK') {
        this.lostPlayerTime += deltaTime;
        if (this.lostPlayerTime >= this.lostPlayerTimeout) {
          this.state = 'PATROL';
          this.lostPlayerTime = 0;
        }
      }
    }

    // If in ATTACK but player moved too far, switch to CHASE
    if (this.state === 'ATTACK' && distanceToPlayer > this.retreatRange && canSeePlayer) {
      this.state = 'CHASE';
    }
  }

  patrol(deltaTime) {
    const targetPoint = this.patrolPoints[this.currentPatrolIndex];
    const direction = new THREE.Vector3().subVectors(targetPoint, this.enemy.position);
    const distance = direction.length();

    // Check if reached patrol point
    if (distance < 1) {
      // Move to next patrol point
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      // Move towards patrol point
      direction.normalize();
      this.moveInDirection(direction, deltaTime);
    }
  }

  chasePlayer(deltaTime, player) {
    const direction = new THREE.Vector3().subVectors(player.position, this.enemy.position);
    direction.y = 0; // Keep on ground level
    direction.normalize();

    this.moveInDirection(direction, deltaTime);
  }

  attackPlayer(deltaTime, player) {
    // Strafe around player
    const toPlayer = new THREE.Vector3().subVectors(player.position, this.enemy.position);
    toPlayer.y = 0;
    const distanceToPlayer = toPlayer.length();

    // Calculate perpendicular direction for strafing
    const strafeDirection = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize();

    // Randomize strafe direction occasionally
    if (Math.random() < 0.02) {
      strafeDirection.multiplyScalar(-1);
    }

    // Move to maintain optimal distance
    let moveDirection = strafeDirection.clone();
    if (distanceToPlayer < this.attackRange - 2) {
      // Too close, move away
      moveDirection.add(toPlayer.clone().normalize().multiplyScalar(-1));
    } else if (distanceToPlayer > this.attackRange + 2) {
      // Too far, move closer
      moveDirection.add(toPlayer.clone().normalize());
    }

    moveDirection.normalize();
    this.moveInDirection(moveDirection, deltaTime);

    // Shoot at player with predictive aim
    if (this.enemy.canShoot()) {
      const shootDirection = this.calculateLeadTarget(player);
      this.enemy.shoot(shootDirection);
    }
  }

  calculateLeadTarget(player) {
    const projectileSpeed = 20;
    const distance = this.enemy.position.distanceTo(player.position);
    const timeToImpact = distance / projectileSpeed;

    // Predict where player will be
    const leadPosition = player.position.clone().add(
      player.velocity.clone().multiplyScalar(timeToImpact)
    );

    // Add accuracy variance (70% accurate = 0.3 variance)
    const accuracy = 0.3;
    leadPosition.x += (Math.random() - 0.5) * accuracy * distance;
    leadPosition.z += (Math.random() - 0.5) * accuracy * distance;

    // Calculate direction to lead position
    const direction = new THREE.Vector3().subVectors(leadPosition, this.enemy.position);
    direction.y = 0; // Keep shots horizontal
    return direction.normalize();
  }

  moveInDirection(direction, deltaTime) {
    // Check for obstacles ahead
    if (this.isObstacleAhead(direction)) {
      // Try turning 45 degrees left or right
      const angle = Math.random() < 0.5 ? Math.PI / 4 : -Math.PI / 4;
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    }

    // Apply movement
    const moveSpeed = this.enemy.speed;
    this.enemy.velocity.copy(direction.multiplyScalar(moveSpeed));
    this.enemy.position.x += this.enemy.velocity.x * deltaTime;
    this.enemy.position.z += this.enemy.velocity.z * deltaTime;
  }

  isObstacleAhead(direction) {
    const checkDistance = 2;
    const checkPosition = this.enemy.position.clone().add(direction.clone().multiplyScalar(checkDistance));

    // Simple bounds check
    if (checkPosition.x < -19 || checkPosition.x > 19 || checkPosition.z < -19 || checkPosition.z > 19) {
      return true;
    }

    return false;
  }

  canSeePlayer(player, scene) {
    const distance = this.enemy.position.distanceTo(player.position);
    if (distance > this.visionRange) {
      return false;
    }

    // Raycast from enemy to player
    const direction = new THREE.Vector3().subVectors(player.position, this.enemy.position).normalize();
    this.raycaster.set(this.enemy.position.clone().add(new THREE.Vector3(0, 1, 0)), direction);

    // Check for walls blocking view
    const intersects = this.raycaster.intersectObjects(scene.children, true);

    for (const intersect of intersects) {
      const intersectDistance = this.enemy.position.distanceTo(intersect.point);
      if (intersectDistance < distance && intersect.object !== this.enemy.mesh) {
        // Wall is between enemy and player
        return false;
      }
    }

    return true;
  }

  checkStuck(deltaTime) {
    const moved = this.enemy.position.distanceTo(this.lastPosition);

    if (moved < 0.1 * deltaTime) {
      this.stuckTimer += deltaTime;
      if (this.stuckTimer > 2) {
        // Pick random direction
        const randomAngle = Math.random() * Math.PI * 2;
        const randomDirection = new THREE.Vector3(
          Math.cos(randomAngle),
          0,
          Math.sin(randomAngle)
        );
        this.moveInDirection(randomDirection, deltaTime);
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }

    this.lastPosition.copy(this.enemy.position);
  }

  reset() {
    this.state = 'PATROL';
    this.currentPatrolIndex = 0;
    this.lostPlayerTime = 0;
    this.stuckTimer = 0;
  }
}
