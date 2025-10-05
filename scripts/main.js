import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { World } from "./world";
import { createUI } from "./ui";
import { Player } from "./player";
import { Physics } from "./physics";
const stats = new Stats();
document.body.append(stats.dom);
// renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// camera setup
const orbitCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight
);
orbitCamera.position.set(-32, 16, -32);

// camera.position.set(2, 2, 2);
// camera.lookAt(0, 0, 0);

// orbital control
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

// scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x80a0e0, 50, 100);
const world = new World();
world.generate();
scene.add(world);

const player = new Player(scene);
const physics = new Physics(scene);
const sun = new THREE.DirectionalLight();
// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshLambertMaterial({ color: "#70B237" });
// const material = new THREE.MeshBasicMaterial({ color: "0x00d000" });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// setup lights
function setupLights() {
  sun.position.set(50, 50, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0001;
  sun.shadow.mapSize = new THREE.Vector2(2048, 2048);

  scene.add(sun);
  scene.add(sun.target);

  const shadowHandler = new THREE.CameraHelper(sun.shadow.camera);
  scene.add(shadowHandler);

  //   const light2 = new THREE.DirectionalLight();
  //   light2.position.set(-1, 1, -0.5);
  //   scene.add(light2);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.1;
  scene.add(ambient);
}

// // setup world
// function setupWorld(size) {
//   for (let x = 0; x < size; x++) {
//     for (let z = 0; z < size; z++) {
//       const cube = new THREE.Mesh(geometry, material);
//       cube.position.set(x, 0, z);
//       scene.add(cube);
//     }
//   }
// }

function onMouseDown(event) {
  if (player.controls.isLocked && player.selectedCoords) {
    console.log(`remove block at ${JSON.stringify(player.selectedCoords)}`);
    world.removeBlock(
      player.selectedCoords.x,
      player.selectedCoords.y,
      player.selectedCoords.z
    );
  }
}
document.addEventListener("mousedown", onMouseDown);

// render loop
let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000;
  requestAnimationFrame(animate);
  //   cube.rotation.x += 0.01;
  //   cube.rotation.y += 0.01;

  if (player.controls.isLocked) {
    player.update(world);
    physics.update(dt, player, world);
    world.update(player);

    sun.position.copy(player.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.position);
  }
  renderer.render(
    scene,
    player.controls.isLocked ? player.camera : orbitCamera
  );
  stats.update();

  previousTime = currentTime;
}

window.addEventListener("resize", () => {
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
createUI(scene, world, player);
animate();
