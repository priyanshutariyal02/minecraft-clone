# Minecraft Clone

This project is a clone of the popular game Minecraft, built from the ground up to learn about game development, 3D graphics, and game physics.

### Project

- **Status:** `In Progress`
- Demo link: https://minecraft-clone-pi-rouge.vercel.app/

## Features

### Current Features
- **Procedural World Generation:** A 64x32x64 world generated using Simplex noise, featuring multiple block types (dirt, stone, grass, etc.) and resource generation (coal, iron).
- **First-Person Controls:** Smooth player movement with WASD, mouse-look using the Pointer Lock API, and jumping with gravity.
- **Custom Physics Engine:** A three-phase collision detection and resolution system provides realistic interactions with the world.
- **Visuals & Lighting:** Features Minecraft resource pack textures, dynamic lighting, and shadow mapping for a realistic look and feel.
- **Performance Optimizations:** Includes efficient collision detection, instanced rendering, frustum culling, and asynchronous chunk loading to maintain a smooth 60 FPS.
- **Block Selection Helper:** highlight the block where player focus.
- **Remove Block:** removing block instance.

### Planned Features


## Tech Stack

- **Build Tool:** Vite
- **Language:** Vanilla JavaScript (ES6+)
- **3D Graphics:** Three.js
- **Debugging UI:** lil-gui
- **Noise Generation:** simplex-noise.js
- **Controls:** Pointer Lock API

## Project Architecture

The project follows a modular architecture to separate concerns:

```
scripts/
├── main.js          # Game loop & scene management
├── world.js         # World generation & terrain
├── player.js        # Player controls & movement
├── physics.js       # Collision detection & physics
├── blocks.js        # Block definitions & textures
├── rng.js           # Random number generation
└── ui.js            # User interface
```

### Custom Physics Engine

The collision detection system is a key feature, implemented from scratch in three phases for performance:

1.  **Broad Phase:** Filters the potential collidable blocks to a smaller subset of blocks closest to the player. This avoids checking every block in the world.
2.  **Narrow Phase:** Iterates through the candidate blocks from the broad phase and performs precise collision checks between the player's bounding box and each block. If a collision occurs, it calculates the collision point, overlap, and normal.
3.  **Resolution Phase:** Processes all detected collisions from the narrow phase. For each collision, the player's position is adjusted to resolve the overlap, and velocity along the collision normal is zeroed out to prevent passing through blocks.

## Getting Started

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/minecraft-clone.git
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Start the development server:
    ```sh
    npm run dev
    ```
    Then open your browser to `http://localhost:5173`.

## Game Controls

- **Click:** Lock mouse for camera control
- **WASD:** Move forward, left, backward, and right
- **Space:** Jump
- **Mouse:** Look around
- **Escape:** Unlock mouse

## Project Milestones

This project was built incrementally. Here are the major feature branches:

1.  `_feat/complete-basic-world-model-l1`: Basic procedural world generation.
2.  `_feat/shadow-texture`: Added textures and dynamic shadows.
3.  `_feat/player`: Implemented first-person player controls.
4.  `_feat/physics`: Built the custom collision detection and physics system.
5.  `_feat/infi-terrain`: Implemented infinite terrain generation and fog for atmospheric perspective.

## Performance & Optimization

### Asynchronous Chunk Loading

To prevent lag spikes when new chunks are generated, the project uses `requestIdleCallback`. This browser API schedules the chunk generation work to be done during periods when the browser is idle, ensuring that it doesn't interfere with the main game loop and maintaining a smooth frame rate.

```javascript
requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
```
