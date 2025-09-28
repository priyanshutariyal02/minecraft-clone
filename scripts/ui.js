import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import { resources } from "./blocks";

export function createUI(world, player) {
  const gui = new GUI();

  const playerFolder = gui.addFolder("Player");
  playerFolder.add(player, "maxSpeed", 1, 20).name("Max Speed");
  playerFolder.add(player.cameraHelper, "visible").name("Camera");

  const terrainFolder = gui.addFolder("Terrain");
  terrainFolder.add(world.chunkSize, "width", 8, 128, 1).name("Width");
  terrainFolder.add(world.chunkSize, "height", 8, 64, 1).name("Height");
  terrainFolder.add(world.params, "seed", 0, 1000000).name("Seed");
  terrainFolder.add(world.params.terrain, "scale", 10, 100).name("Scale");
  terrainFolder.add(world.params.terrain, "magnitude", 0, 1).name("Magnitude");
  terrainFolder.add(world.params.terrain, "offset", 0, 1).name("Offset");

  const resourcesFolder = gui.addFolder("Resources");

  resources.forEach((resource) => {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    resourceFolder.add(resource, "scarcity", 0, 1).name("Scarcity");

    const scaleFolder = resourceFolder.addFolder("Scale");
    scaleFolder.add(resource.scale, "x", 10, 100).name("X Scale");
    scaleFolder.add(resource.scale, "y", 10, 100).name("Y Scale");
    scaleFolder.add(resource.scale, "z", 10, 100).name("Z Scale");
  });

  // auto update the world as sliding width and hight
  gui.onChange(() => {
    world.generate();
  });

  // on click generate button then world generate
  //   gui.add(world, "generate");
}
