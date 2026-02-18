# 3D Arena Shooter

A browser-based 3D first-person shooter built with Three.js. Battle an AI-controlled enemy in an enclosed arena.

## Getting Started

```bash
npm install
npm run dev        # opens http://localhost:3000 automatically
npm run build      # production build → dist/
npm run preview    # preview the production build
```

## Controls

| Key                | Action                  |
| ------------------ | ----------------------- |
| Arrow Up / Down    | Move forward / backward |
| Arrow Left / Right | Strafe                  |
| Spacebar           | Shoot                   |

## Gameplay

Defeat the enemy before it defeats you. Use the cover objects scattered around the arena for protection.

|                 | Player         | Enemy        |
| --------------- | -------------- | ------------ |
| HP              | 100            | 100          |
| Speed           | 5 u/s          | 3 u/s        |
| Fire rate       | 0.5 s cooldown | 2 s cooldown |
| Damage per shot | 20             | 20           |

### Enemy AI

The enemy uses a three-state FSM:

- **Patrol** — follows waypoints around the arena perimeter until it spots you
- **Chase** — pursues you when within 15 units with clear line-of-sight
- **Attack** — strafes and fires with predictive aim when within 8 units; returns to Chase if you move beyond 12 units

## Tech Stack

- [Three.js](https://threejs.org/) — WebGL rendering
- [Vite](https://vitejs.dev/) — dev server and build tool
- Web Audio API — procedurally generated sound effects (no audio files required)
- Custom AABB collision detection

## Browser Requirements

Requires WebGL. Tested in Chrome, Firefox, Safari, and Edge.

## License

MIT
