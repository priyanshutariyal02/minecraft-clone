# MINECRAFT CLONE APP

This is the clone of Minecraft game. I build this to learn game development, how logic work in games, how we manage event/action in game.

## Techstack

- Vite
- JavaScript Vanilla
- Three.js

## Libraries

- three
- lil-gui
- simplexNoice.js
- pointer lock API : help to control player, it lock the target of mouse event

## Notes

- for texture i install minecraft resource textures, and use THREE TextureLoader to put texture
- our collision detection broken into 3 saperated phases of functions:
  - broad phase: filter down the list of block we are going to check for collision by finding the set of block i.e closest to the player
  - narrow phase: take the candidate blocks from the broad phase and check collision of player with them, if yes, then we calculate:
    - point of collision
    - overlap between block and player
    - collision normal: take all the collision from the narrow phase and process one by one. Each collision we adjust postion of the player and zero the velocity of the player
  - resolve collision

## Branch Levels

1.  `_feat/complete-basic-world-model-l1`: Complete basic Minecraft world model
2.  `_feat/shadow-texture`: add shadow and texture to the world
3.  `_feat/player`: add controler like WASD (forward, backward, left, right)
4.  `_feat/physics` : implement collision detection system with broad and narrow phases
