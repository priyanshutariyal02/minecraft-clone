import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
const CENTER_SCREEN = new THREE.Vector2();

export class Player {
  radius = 0.5;
  height = 1.75;
  jumpSpeed = 10;
  onGround = false;
  maxSpeed = 10;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();
  camera = new THREE.PerspectiveCamera(
    91,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );

  controls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new THREE.CameraHelper(this.camera);

  raycaster = new THREE.Raycaster(undefined, undefined, 0, 3);
  selectedCoords = null;
  /**
   * @param {THREE.scene} scene
   */
  constructor(scene) {
    this.position.set(32, 16, 32);
    scene.add(this.camera);
    scene.add(this.cameraHelper);

    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));

    // wireframe mesh visualizing the player bounding cyliner
    this.boundHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );
    // show noundary lines
    // scene.add(this.boundHelper);

    const selectionMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa,
    });
    const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);
  }

  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(
      new THREE.Euler(0, this.camera.rotation.y, 0)
    );
    return this.#worldVelocity;
  }

  /**
   * Update the player state
   * @param {World} world
   */
  update(world) {
    this.updateRaycaster(world);
  }

  /**
   * update the raycaster used for picking blocks
   * @param {World} world
   */
  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);

    const intersections = this.raycaster.intersectObject(world, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];
      // Get the  position of the chunks that the block contained in
      const chunk = intersection.object.parent;

      // Get transformation matrix of the intersected block
      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      // Extract the position from the block transformation matrix and stored it in selectedCoords
      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;

      console.log(this.selectedCoords);
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  /**
   * apply the change in velocity "dv" that is specified in the world frame
   * @param {THREE.Vector3} dv
   */
  applyWorldDaltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  applyInput(dt) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;

      document.getElementById("player-position").innerHTML = this.toString();
    }
  }

  /**
   *  s the position of the player's bounding helper cylinder
   */
  updateBoundHelper() {
    this.boundHelper.position.copy(this.position);
    this.boundHelper.position.y -= this.height / 2;
  }

  /**
   * return the current world position of the player
   * @type {THREE.Vector3}
   */

  get position() {
    return this.camera.position;
  }

  /**
   * event handler on key up
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    if (!this.controls.isLocked) {
      this.controls.lock();
    }

    switch (event.code) {
      case "KeyW":
        this.input.z = this.maxSpeed;
        break;
      case "KeyA":
        this.input.x = -this.maxSpeed;
        break;
      case "KeyS":
        this.input.z = -this.maxSpeed;
        break;
      case "KeyD":
        this.input.x = this.maxSpeed;
        break;
      case "KeyR":
        // this.position.set(32, 16, 32);
        this.position.y = 32;
        this.velocity.set(0, 0, 0);
        break;
      case "Space":
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed;
        }
        break;
    }
  }

  /**
   * event handler on key down
   * @param {KeyboardEvent} event
   */
  onKeyUp(event) {
    switch (event.code) {
      case "KeyW":
        this.input.z = 0;
        break;
      case "KeyA":
        this.input.x = 0;
        break;
      case "KeyS":
        this.input.z = 0;
        break;
      case "KeyD":
        this.input.x = 0;
        break;
    }
  }

  /**
   * return player position in a readable string from
   * @returns {string}
   */
  toString() {
    let str = "";
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}
