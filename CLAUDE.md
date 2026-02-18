# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000 (auto-opens browser)
npm run build    # Production build to dist/
npm run preview  # Preview the production build
```

No test runner is configured — testing is manual in-browser (see `docs/plans/first-person-shooter-arena-game-plan.md` for the manual testing checklist).

## Architecture Overview

This is a browser-based 3D first-person shooter built with **Three.js** and bundled via **Vite**. All source is in `src/` as ES modules.

### System Orchestration

`src/main.js` bootstraps on `DOMContentLoaded`, creates the `Game` instance, and calls `game.start()`.

`src/game/Game.js` is the central coordinator. It owns the `requestAnimationFrame` loop, holds references to all systems and entities, and drives the update/render cycle:
1. `Player.update()` → reads input, moves camera, sets `newProjectile` if spacebar pressed
2. `Enemy.update()` → delegates to `EnemyAI`, updates mesh position, sets `newProjectile` if AI fires
3. Both new projectiles are pushed into `Game.projectiles[]` and added to the Three.js scene
4. `CollisionSystem.resolveCollisions()` → returns hit events (player-hit / enemy-hit)
5. Hit events applied → `checkGameOver()` → `HUD.update()`
6. `Scene.render()` calls `renderer.render(scene, camera)`

### Entity Design Pattern

Both `Player` and `Enemy` use a **deferred projectile pattern**: instead of directly adding projectiles to the scene, they set `this.newProjectile` during their `update()`, and `Game` collects it via `getNewProjectile()`. This keeps entities decoupled from the scene graph.

### Key Files

| File | Role |
|------|------|
| `src/game/Game.js` | Main loop, system orchestration, hit event handling |
| `src/game/Scene.js` | Three.js renderer, camera, arena geometry, lighting setup |
| `src/game/GameState.js` | State machine: `PLAYING → WIN/LOSE/PAUSED` |
| `src/entities/Player.js` | First-person camera controller, shoot cooldown, damage flash |
| `src/entities/Enemy.js` | Enemy entity, mesh, delegates AI to `EnemyAI` |
| `src/entities/Projectile.js` | Projectile physics, lifetime, colored glowing mesh |
| `src/ai/EnemyAI.js` | FSM with PATROL/CHASE/ATTACK states, raycaster line-of-sight, predictive aim |
| `src/systems/CollisionSystem.js` | AABB wall collision, sphere-box projectile detection, arena bounds enforcement |
| `src/systems/InputManager.js` | Keyboard state tracker; arrow keys for movement, spacebar to shoot |
| `src/systems/AudioManager.js` | Web Audio API; procedurally generates sounds via oscillator (no audio files required) |
| `src/ui/HUD.js` | DOM manipulation for health bars, ammo counter, game-over overlay |

### Arena & Scene

- 40×40 unit arena with 4 walls (height 5), floor with canvas-generated grid texture
- 5 cover objects (alternating boxes and cylinders) at fixed positions
- Camera at eye-level height `y=1.6`, player starts at `(0, 1.6, 18)`, enemy starts at `(15, 1, 15)`
- Arena bounds: `[-20, 20]` on X/Z axes enforced by `CollisionSystem`

### Enemy AI (FSM)

- **PATROL**: Follows 4 waypoints at arena corners; transitions to CHASE when player is within 15 units and line-of-sight is clear
- **CHASE**: Moves directly toward player; transitions to ATTACK when within 8 units
- **ATTACK**: Strafes around player, shoots every 2 seconds with predictive aim (leads target based on velocity, 70% accuracy)
- Line-of-sight uses `THREE.Raycaster`; stuck detection kicks in after 2 seconds of minimal movement

### HUD

All HUD elements are DOM overlays on top of the canvas (`index.html`). `HUD.js` reads element IDs directly — if you add new HUD elements, add their IDs to `index.html` first.

### Audio

`AudioManager` generates all sounds procedurally using the Web Audio API oscillator — no sound files are needed. Sounds are defined in `soundDefinitions` with frequency/duration pairs.
