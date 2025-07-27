import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { World } from "./world";
import { createUI } from "./ui";

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
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight
);
camera.position.set(-32, 16, -32);

// camera.position.set(2, 2, 2);
// camera.lookAt(0, 0, 0);

// orbital control
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

// scene setup
const scene = new THREE.Scene();
const world = new World();
world.generate();
scene.add(world);
// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshLambertMaterial({ color: "#70B237" });
// const material = new THREE.MeshBasicMaterial({ color: "0x00d000" });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// setup lights
function setupLights() {
  const sun = new THREE.DirectionalLight();
  sun.position.set(50, 50, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = -0.0005;
  sun.shadow.mapSize = new THREE.Vector2(512, 512);

  scene.add(sun);

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

// render loop
function animate() {
  requestAnimationFrame(animate);
  //   cube.rotation.x += 0.01;
  //   cube.rotation.y += 0.01;
  renderer.render(scene, camera);
  stats.update();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
createUI(world);
animate();
