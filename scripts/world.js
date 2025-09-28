import * as THREE from "three";
import { WorldChunk } from "./worldChunk";

export class World extends THREE.Group {
  /**
   * The number of chunks to render around the player.
   * When this set to 0, the chunk the player is on
   * is the only one that is rendered. If it is set of 1,
   * the adjecent chunk are rendered; if set to 2, the
   * chunks adjecet to those are rendered, and so on.
   */

  drawDistance = 2;

  chunkSize = {
    width: 32,
    height: 32,
  };

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.05,
      offset: 0.2,
    },
  }; // pass these parameters into each chunks when we are initiation it

  constructor(seed = 0) {
    super();
    this.seed = seed; // pass the seed into terrain generation logic
  }

  /**
   * Regenerate the world data models and the meshes
   */

  generate() {
    this.disposeChunks();
    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        const chunk = new WorldChunk(this.chunkSize, this.params);
        chunk.position.set(
          x * this.chunkSize.width,
          0,
          z * this.chunkSize.width
        );
        chunk.userData = { x, z }; // store x & z coordinates
        chunk.generate();
        this.add(chunk);
      }
    }
  }

  /**
   * Update the visible position of the world based on the current player position
   * @param {Player} player
   */
  update(player) {
    // Steps:
    // 1. Find visible chunkes based on player's current position
    const visibleChunks = this.getVisinleChunks(player);
    // 2. Compare with the current set of chunks
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    // 3. Remove chunks that are not longer visible
    this.removeUnusedChunks(visibleChunks);
    // 4. Add new chunks that just came into view
    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  /**
   * Return an array containing the coordinates of the chunks that are currently visiblw to the player
   * @param {Player} player
   * @returns {{x: number, z: number}[]}
   */
  getVisinleChunks(player) {
    const visibleChunks = [];

    const coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z
    );

    const chunkX = coords.chunk.x;
    const chunkZ = coords.chunk.z;

    for (
      let x = chunkX - this.drawDistance;
      x <= chunkX + this.drawDistance;
      x++
    ) {
      for (
        let z = chunkZ - this.drawDistance;
        z <= chunkZ + this.drawDistance;
        z++
      ) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   * Returns an array containing the coordinates of the chunks that
   * are not yet loaded and need to be added to the scene
   * @param {{ x: number, z: number}[]} visibleChunks
   * @returns {{ x: number, z: number}[]}
   */
  getChunksToAdd(visibleChunks) {
    // Filter down the visible chunks to those not already in the world
    return visibleChunks.filter((chunk) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => chunk.x === x && chunk.z === z);

      return !chunkExists;
    });
  }

  /**
   * Removes current loaded chunks that are no longer visible to the player
   * @param {{ x: number, z: number}[]} visibleChunks
   */
  removeUnusedChunks(visibleChunks) {
    // Filter down the visible chunks to those not already in the world
    const chunksToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData;
      const chunkExists = visibleChunks.find(
        (visibleChunk) => visibleChunk.x === x && visibleChunk.z === z
      );

      return !chunkExists;
    });

    for (const chunk of chunksToRemove) {
      chunk.disposeInstances();
      this.remove(chunk);
      console.log(
        `Removing chunk at X: ${chunk.userData.x}, Z: ${chunk.userData.z}`
      );
    }
  }

  /**
   * Generate the chunk at (x, z) coordinates
   * @param {number} x
   * @param {number} z
   */
  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params);
    chunk.position.set(
      x * this.chunkSize.width * 1,
      0,
      z * this.chunkSize.width * 1
    );
    chunk.userData = { x, z }; // store x & z coordinates
    chunk.generate();
    this.add(chunk);
    console.log(`Adding chunk at X: ${x}, Z: ${z}`);
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceId: number} | null}
   */

  getBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
    } else {
      return null;
    }
  }

  /**
   * Return the coordinates of the blocks at world (x, y, z)
   * - `chunk` is the coordinate of the chunk containg the block
   * - `block` is the coordidate of the block relative to the chunk
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{
   *  chunk: {x: number, z: number},
   *  block: {x: number, y: number, z: number}
   * }}
   */

  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z,
    };

    return {
      chunk: chunkCoords,
      block: blockCoords,
    };
  }

  /**
   * Returns the WorldChunk object at the specified coordinates
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */

  getChunk(chunkX, chunkZ) {
    return this.children.find(
      (chunk) => chunk.userData.x === chunkX && chunk.userData.z === chunkZ
    );
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) {
        chunk.disposeInstances();
      }
    });
    this.clear();
  }
}
