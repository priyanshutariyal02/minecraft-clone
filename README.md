# Minecraft Clone

This project is a clone of the popular game Minecraft, built from the ground up to learn about game development, 3D graphics, and game physics.

## Features

- Infinite world generation using Simplex noise.
- Player movement controls (WASD for movement, mouse for camera).
- Block placement and removal.
- Collision detection system.
- Texture mapping with original Minecraft textures.

## Tech-stack

- Vite
- Vanilla JavaScript (ES6+)
- Three.js

## Libraries

- three
- lil-gui
- simplex-noise.js
- Pointer Lock API (for first-person camera control)

## Project Notes

### Texturing
Textures are sourced from a Minecraft resource pack and applied to the world's blocks using `THREE.TextureLoader`.

### Collision Detection
The collision detection system is implemented in three phases for efficiency:

1.  **Broad Phase:** Filters the potential collidable blocks to a smaller subset of blocks closest to the player. This avoids checking every block in the world.
2.  **Narrow Phase:** Iterates through the candidate blocks from the broad phase and performs precise collision checks between the player's bounding box and each block. If a collision occurs, it calculates the collision point, overlap, and normal.
3.  **Resolution Phase:** Processes all detected collisions from the narrow phase. For each collision, the player's position is adjusted to resolve the overlap, and velocity along the collision normal is zeroed out to prevent passing through blocks.

## Getting Started

1.  Clone the repository:
    ```sh
    git clone <your-repository-url>
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Start the development server:
    ```sh
    npm run dev
    ```

## Project Milestones

This project was built incrementally. Here are the major feature branches:

1.  `_feat/complete-basic-world-model-l1`: Complete basic Minecraft world model
2.  `_feat/shadow-texture`: Add shadow and textures to the world
3.  `_feat/player`: Add player controls (WASD for movement)
4.  `_feat/physics`: Implement the collision detection system
5. `_feat/infi-terrain`: Add infinite world generation

