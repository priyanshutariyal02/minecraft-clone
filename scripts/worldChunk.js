import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RNG } from "./rng";
import { blocks, resources } from "./blocks";

const geometry = new THREE.BoxGeometry();

export class WorldChunk extends THREE.Group {
  /**
   * @type{{
   * id: number,
   * instanceId: number
   * }[][][]}
   */
  data = [];

  threshold = 0.5;

  // constructor(size = { width: 32, height: 16 }) {
  constructor(size, params) {
    super();
    this.loaded = false;
    this.size = size;
    this.params = params;
  }

  generate() {
    const start = performance.now();

    const rng = new RNG(this.params.seed);

    this.initializeTerrain();
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateMeshes();

    this.loaded = true;

    console.log(`Load chunnk in ${performance.now() - start} ms`);
  }

  // initialize the world terrain data
  initializeTerrain() {
    this.data = [];

    for (let x = 0; x < this.size.width; x++) {
      const slice = [];

      for (let y = 0; y < this.size.height; y++) {
        const row = [];

        for (let z = 0; z < this.size.width; z++) {
          row.push({
            id: blocks.empty.id,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  // generate resources (coal, stone, etc) for the world
  generateResources(rng) {
    const simplex = new SimplexNoise(rng);
    resources.forEach((resource) => {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const value = simplex.noise3d(
              (this.position.x + x) / resource.scale.x,
              (this.position.y + y) / resource.scale.y,
              (this.position.z + z) / resource.scale.z
            );
            if (value > resource.scarcity) {
              this.setBlockId(x, y, z, resource.id);
            }
          }
        }
      }
    });
  }

  generateTerrain(rng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        // compute the noise at this x-z location
        const value = simplex.noise(
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale
        );

        // scale the noise based on the mangnitude/offset
        const scaledNoise =
          this.params.terrain.offset + this.params.terrain.magnitude * value;

        // compute the height of terrain at this x-z location
        let height = Math.floor(this.size.height * scaledNoise);

        // clamping height between 0 and max height
        height = Math.floor(
          Math.max(0, Math.min(height, this.size.height - 1))
        );

        // fill all blocks at or  below the terrain height
        for (let y = 0; y < this.size.height; y++) {
          if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (y === height) {
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.empty.id);
          }
        }
      }
    }
  }

  // generate the 3d representation of the world
  generateMeshes() {
    console.log(
      `generateMeshes() start — chunk pos=(${this.position.x}, ${this.position.z}), size=${this.size.width}x${this.size.height}`
    );

    this.clear();

    // create lookup table for meshes
    const meshes = {};
    const matrix = new THREE.Matrix4();

    // Track visible block positions by block type
    const visibleBlocks = {};

    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;
          if (blockId === blocks.empty.id) continue;

          if (!this.isBlockObscured(x, y, z)) {
            if (!visibleBlocks[blockId]) visibleBlocks[blockId] = [];
            visibleBlocks[blockId].push({ x, y, z });
          }
        }
      }
    }

    // Log total visible count
    const totalVisible = Object.values(visibleBlocks).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    console.log(`generateMeshes() estimatedVisible instances: ${totalVisible}`);

    // Create instanced meshes only for visible blocks
    Object.entries(visibleBlocks).forEach(([blockId, blocksList]) => {
      const blockType = Object.values(blocks).find((b) => b.id == blockId);
      if (!blockType) return;

      const count = blocksList.length;
      if (count <= 0) return;

      console.log(
        `✅ Creating InstancedMesh for block type: ${blockType.name}, count=${count}`
      );

      const mesh = new THREE.InstancedMesh(geometry, blockType.material, count);
      mesh.name = blockType.id;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      blocksList.forEach((pos, index) => {
        matrix.setPosition(pos.x, pos.y, pos.z);
        mesh.setMatrixAt(index, matrix);
        this.setBlockInstanceId(pos.x, pos.y, pos.z, index);
      });

      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      this.add(mesh);
    });

    console.log(
      `✅ Finished generateMeshes() — chunk (${this.position.x}, ${this.position.z})`
    );
  }

  /**
   * Get block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceId: number}}
   */

  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /**
   * Removes the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */

  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block && block.id !== blocks.empty.id) {
      this.deleteBlockInstances(x, y, z);
      this.setBlockId(x, y, z, blocks.empty.id);
    }
  }

  /**
   * Remove the mesh instance associated with `block` by swapping it
   * with the last instance and decrementing the instance count
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  deleteBlockInstances(x, y, z) {
    const block = this.getBlock(x, y, z);

    if (block.id === null) return;

    // get mesh and instance id of the block
    const mesh = this.children.find(
      (instanceMesh) => instanceMesh.name === block.id
    );
    const instanceId = block.instanceId;

    // swapping the transformation matrix of the block in the last position with the block that we are going to remove
    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);

    // update the instance id of the block in the last position of its new instance id
    const v = new THREE.Vector3();
    v.applyMatrix4(lastMatrix);
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    // swaping the tarnsformation matrix
    mesh.setMatrixAt(instanceId, lastMatrix);

    // efficienty remove the last instance from the scene
    mesh.count--;

    // notify the instanced mesh with updated the instance matrix
    // also recompute the bounding sphere so raycasting works
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    // remove the instance associated with the block
    this.setBlockInstanceId(x, y, z, null);
    this.setBlockId(x, y, z, blocks.empty.id);
  }

  /**
   * Set the block id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} id
   */
  setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = id;
    }
  }

  /**
   * Set the block instance if for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} instanceId
   */

  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  /**
   * Check the corrdinates (x, y, z) are within bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */

  inBounds(x, y, z) {
    if (
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * returns true if this block is completely hidden by other block
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */

  isBlockObscured(x, y, z) {
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
    const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
    const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
    const fronward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
    const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

    // if any of the block's side is exposed, it is not obscured
    if (
      up === blocks.empty.id ||
      down === blocks.empty.id ||
      left === blocks.empty.id ||
      right === blocks.empty.id ||
      fronward === blocks.empty.id ||
      back === blocks.empty.id
    ) {
      return false;
    } else {
      return true;
    }
  }

  disposeInstances() {
    this.traverse((obj) => {
      if (obj.isInstancedMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.clear(); // remove all children
  }
}
