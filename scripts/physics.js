import * as THREE from "three";
import { blocks } from "./blocks";

const collisionMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.2,
});

const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);

const contactMaterial = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0x0ff000,
});

const contactGeometry = new THREE.SphereGeometry(0.05, 6, 6);

export class Physics {
  simulationRate = 200;
  timeStep = 1 / this.simulationRate;
  accumulator = 0;
  gravity = 32;

  constructor(scene) {
    this.helpers = new THREE.Group();
    // this.helpers.visible = false;
    scene.add(this.helpers);
  }
  /**
   * moves the physics simulation forwaord in the time by 'dt'
   * @param {number} dt
   * @param {Player} player
   * @param {World} world
   */

  update(dt, player, world) {
    this.accumulator += dt;

    while (this.accumulator >= this.timeStep) {
      // Clear previous collision helpers
      this.helpers.clear();
      player.velocity.y -= this.gravity * this.timeStep;
      player.applyInput(this.timeStep);
      player.updateBoundHelper();

      this.detectCollisions(player, world);
      this.accumulator -= this.timeStep;
    }
  }

  /**
   * main function for collision detection
   * @param {Player} player
   * @param {World} world
   */

  detectCollisions(player, world) {
    player.onGround = false;
    const candidates = this.broaderPhase(player, world);
    const collisions = this.narrowPhase(candidates, player);

    if (collisions.length > 0) {
      this.resolveCollisions(collisions, player);
      this.helpers.visible = true;
    } else {
      this.helpers.visible = false;
    }
  }

  /**
   * perform against the rough search against the world to return all
   * possible block the player may be colliding with
   * @param {Player} player
   * @param {World} world
   * @returns{[]}
   */

  broaderPhase(player, world) {
    const candidates = [];

    // get the extends of the player
    const extents = {
      x: {
        min: Math.floor(player.position.x - player.radius),
        max: Math.ceil(player.position.x + player.radius),
      },
      y: {
        min: Math.floor(player.position.y - player.height),

        max: Math.ceil(player.position.y),
      },
      z: {
        min: Math.floor(player.position.z - player.radius),
        max: Math.ceil(player.position.z + player.radius),
      },
    };

    // look through all the bloks under the player extents
    // if they are not empty, then they are a possibile collision candidate
    for (let x = extents.x.min; x <= extents.x.max; x++) {
      for (let y = extents.y.min; y <= extents.y.max; y++) {
        for (let z = extents.z.min; z <= extents.z.max; z++) {
          const block = world.getBlock(x, y, z);
          if (block && block.id !== blocks.empty.id) {
            const blockPos = { x, y, z };
            candidates.push(blockPos);
            this.addingCollisionHelper(blockPos);
          }
        }
      }
    }
    console.log("broad phase candidate: ", candidates.length);
    return candidates;
  }

  /**
   * narrow down the blocks found in the broad-phase to the set of blocks the player actually colliding with
   * @param {*} candidates
   * @param {Player} player
   * @returns
   */

  narrowPhase(candidates, player) {
    const collisions = [];
    for (const block of candidates) {
      const p = player.position;
      const closestPoint = {
        x: Math.max(block.x - 0.5, Math.min(p.x, block.x + 0.5)),
        y: Math.max(
          block.y - 0.5,
          Math.min(p.y - player.height / 2, block.y + 0.5)
        ),
        z: Math.max(block.z - 0.5, Math.min(p.z, block.z + 0.5)),
      };

      const dx = closestPoint.x - player.position.x;
      const dy = closestPoint.y - (player.position.y - player.height / 2);
      const dz = closestPoint.z - player.position.z;

      if (this.pointInPlayerBoundingCylinder(closestPoint, player)) {
        // compute the overlap between the point abd tge player's bounding
        // cylinder along the y-axis and in the xz-plane
        const overlapY = player.height / 2 - Math.abs(dy);
        const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz);

        let normal, overlap;
        if (overlapY < overlapXZ) {
          normal = new THREE.Vector3(0, -Math.sign(dy), 0);
          overlap = overlapY;
          player.onGround = true;
        } else {
          normal = new THREE.Vector3(-dx, 0, -dz).normalize();
          overlap = overlapXZ;
        }
        collisions.push({
          block,
          contactPoint: closestPoint,
          normal,
          overlap,
        });
        this.addContactPointerHelper(closestPoint);
      }
    }
    console.log(`narrow phase collision: ${collisions.length}`);
    return collisions;
  }

  /**
   * resolve each of the collisions found in the narrow phase
   * @param {Object} collisions
   * @param {Player} player
   */
  resolveCollisions(collisions, player) {
    // resolve the collision in order of the smallest overlap to the largest
    collisions.sort((a, b) => {
      return a.overlap < b.overlap;
    });

    for (const collision of collisions) {

        // we need to re-check if the contact point is inside the player bounding 
      if (!this.pointInPlayerBoundingCylinder(collision.contactPoint, player)) {
        continue;
      }
      // adjust player and block position so that block and player no longer overlapping
      let deltaPosition = collision.normal.clone();
      deltaPosition.multiplyScalar(collision.overlap);
      player.position.add(deltaPosition);

      // naglat the player velocity against the collision normal
      let mangnitude = player.worldVelocity.dot(collision.normal);
      let velocityAdjustment = collision.normal
        .clone()
        .multiplyScalar(mangnitude);

      player.applyWorldDaltaVelocity(velocityAdjustment.negate());
    }
  }

  /**
   * visualizes the block  the player is colliding with
   * @param {THREE.Object3D} block
   */
  addingCollisionHelper(block) {
    const blockMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    blockMesh.position.copy(block);
    this.helpers.add(blockMesh);
  }

  /**
   * visalizes the contact at the point 'p'
   * @param {{ x, y, z }} p
   */

  addContactPointerHelper(p) {
    const contactMesh = new THREE.Mesh(contactGeometry, contactMaterial);
    contactMesh.position.copy(p);
    this.helpers.add(contactMesh);
  }

  /**
   * returns true if the point 'p' is inside the player's bounding cylinder
   * @param {{x: number, y:number, z: number}} p
   * @param {Player} player
   * @returns {boolean}
   */

  pointInPlayerBoundingCylinder(p, player) {
    const dx = p.x - player.position.x;
    const dy = p.y - (player.position.y - player.height / 2);
    const dz = p.z - player.position.z;

    const r_sq = dx * dx + dz * dz;

    // check if contact point inside the player's bounding cylinder
    return (
      Math.abs(dy) < player.height / 2 && r_sq < player.radius * player.radius
    );
  }
}
