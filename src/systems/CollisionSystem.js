export class CollisionSystem {
  constructor() {
    this.hitEvents = [];
  }

  resolveCollisions(player, enemy, projectiles, arena, coverObjects) {
    this.hitEvents = [];

    // Check projectile collisions
    this.checkProjectileCollisions(player, enemy, projectiles, arena, coverObjects);

    // Check entity collisions with walls and bounds
    this.checkWallCollisions(player, arena);
    this.checkWallCollisions(enemy, arena);

    // Enforce arena bounds
    this.enforceArenaBounds(player, arena);
    this.enforceArenaBounds(enemy, arena);

    return this.hitEvents;
  }

  checkProjectileCollisions(player, enemy, projectiles, arena, coverObjects) {
    projectiles.forEach(projectile => {
      if (!projectile.active) return;

      // Check collision with player
      if (projectile.owner === 'enemy') {
        // Increased collision radius from 0.5 to 1.0 for player
        if (this.sphereIntersectsPoint(projectile.position, 0.1, player.position, 1.0)) {
          projectile.deactivate();
          this.hitEvents.push({
            type: 'projectile-hit-player',
            damage: projectile.damage
          });
        }
      }

      // Check collision with enemy
      if (projectile.owner === 'player') {
        const distance = Math.sqrt(
          Math.pow(projectile.position.x - enemy.position.x, 2) +
          Math.pow((projectile.position.y || 0) - (enemy.position.y || 0), 2) +
          Math.pow(projectile.position.z - enemy.position.z, 2)
        );
        console.log('Projectile pos:', projectile.position, 'Enemy pos:', enemy.position, 'Distance:', distance);

        // Increased collision radius from 0.5 to 1.5 for easier hits
        if (this.sphereIntersectsPoint(projectile.position, 0.1, enemy.position, 1.5)) {
          console.log('HIT DETECTED!');
          projectile.deactivate();
          this.hitEvents.push({
            type: 'projectile-hit-enemy',
            damage: projectile.damage
          });
        }
      }

      // Check collision with walls
      if (this.checkProjectileWallCollision(projectile, arena)) {
        projectile.deactivate();
      }

      // Check collision with cover objects
      coverObjects.forEach(cover => {
        if (this.sphereIntersectsBox(projectile.position, 0.1, cover.position, 2, 1.5, 2)) {
          projectile.deactivate();
        }
      });
    });
  }

  checkWallCollisions(entity, arena) {
    const pos = entity.position || entity.getPosition();
    const entityRadius = 0.5;

    // Check collision with each wall
    arena.walls.forEach(wall => {
      const wallPos = wall.position;
      const wallSize = {
        x: wall.geometry.parameters.width / 2,
        y: wall.geometry.parameters.height / 2,
        z: wall.geometry.parameters.depth / 2
      };

      if (this.sphereIntersectsBox(pos, entityRadius, wallPos, wallSize.x * 2, wallSize.y * 2, wallSize.z * 2)) {
        // Calculate closest point on wall to entity
        const closestX = Math.max(wallPos.x - wallSize.x, Math.min(pos.x, wallPos.x + wallSize.x));
        const closestZ = Math.max(wallPos.z - wallSize.z, Math.min(pos.z, wallPos.z + wallSize.z));

        // Calculate penetration vector
        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < entityRadius && distance > 0) {
          // Push entity out of wall along penetration vector
          const pushX = (dx / distance) * (entityRadius - distance);
          const pushZ = (dz / distance) * (entityRadius - distance);

          pos.x += pushX;
          pos.z += pushZ;

          // Zero out velocity in the direction of the wall (for wall sliding)
          if (entity.velocity) {
            const dotProduct = (entity.velocity.x * dx + entity.velocity.z * dz) / distance;
            if (dotProduct < 0) {
              // Remove velocity component pushing into wall
              entity.velocity.x -= (dx / distance) * dotProduct;
              entity.velocity.z -= (dz / distance) * dotProduct;
            }
          }
        }
      }
    });
  }

  checkProjectileWallCollision(projectile, arena) {
    const pos = projectile.position;
    const radius = 0.1;

    for (const wall of arena.walls) {
      const wallPos = wall.position;
      const wallSize = {
        x: wall.geometry.parameters.width / 2,
        y: wall.geometry.parameters.height / 2,
        z: wall.geometry.parameters.depth / 2
      };

      if (this.sphereIntersectsBox(pos, radius, wallPos, wallSize.x * 2, wallSize.y * 2, wallSize.z * 2)) {
        return true;
      }
    }

    return false;
  }

  enforceArenaBounds(entity, arena) {
    const pos = entity.position || entity.getPosition();
    const bounds = arena.bounds;
    const margin = 0.5;

    // Clamp position to arena bounds
    if (pos.x < bounds.min + margin) {
      pos.x = bounds.min + margin;
    }
    if (pos.x > bounds.max - margin) {
      pos.x = bounds.max - margin;
    }
    if (pos.z < bounds.min + margin) {
      pos.z = bounds.min + margin;
    }
    if (pos.z > bounds.max - margin) {
      pos.z = bounds.max - margin;
    }
  }

  // Helper: Check if sphere intersects with a point (approximated as sphere)
  sphereIntersectsPoint(spherePos, sphereRadius, pointPos, pointRadius) {
    const dx = spherePos.x - pointPos.x;
    const dy = (spherePos.y || 0) - (pointPos.y || 0);
    const dz = spherePos.z - pointPos.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const radiusSum = sphereRadius + pointRadius;
    return distanceSquared <= radiusSum * radiusSum;
  }

  // Helper: Check if sphere intersects with AABB (box)
  sphereIntersectsBox(spherePos, sphereRadius, boxPos, boxWidth, boxHeight, boxDepth) {
    // Find the closest point on the box to the sphere
    const closestX = Math.max(boxPos.x - boxWidth / 2, Math.min(spherePos.x, boxPos.x + boxWidth / 2));
    const closestY = Math.max(boxPos.y - boxHeight / 2, Math.min(spherePos.y || 0, boxPos.y + boxHeight / 2));
    const closestZ = Math.max(boxPos.z - boxDepth / 2, Math.min(spherePos.z, boxPos.z + boxDepth / 2));

    // Calculate distance from sphere to closest point
    const dx = spherePos.x - closestX;
    const dy = (spherePos.y || 0) - closestY;
    const dz = spherePos.z - closestZ;
    const distanceSquared = dx * dx + dy * dy + dz * dz;

    return distanceSquared <= sphereRadius * sphereRadius;
  }
}
