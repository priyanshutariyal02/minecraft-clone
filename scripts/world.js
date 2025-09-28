import * as THREE from "three";
import { WorldChunk } from "./worldChunk";

export class World extends THREE.Group {
  chunkSize = {
    width: 64,
    height: 32,
  };

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.5,
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
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
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
