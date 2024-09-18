import { createApplication } from "../lib.js/createApplication.js";
import { createRenderer } from "../lib.js/createRenderer.js";
import { createMesh } from "../lib.js/createMesh.js";
import cellShader from "./cellShader.js";

const GRID_SIZE = 32;

const c = document.querySelector("canvas");
const app = await createApplication({ canvas: c });
const renderer = await createRenderer(app);

// For now, values should always be arrays, but we need to work out a better way to incorporate buffers
const uniforms = [
  {
    name: "grid",
    type: 'array',
    value: [[GRID_SIZE, GRID_SIZE]],
    hasChanged: true,
    binding: 0,
  },
  {
    name: "time",
    type: 'float',
    value: 0,
    hasChanged: true,
    binding: 1,
  }
];

// Create the vertices for our square.
const vertices = new Float32Array([
  -.8, -.8,
  .8, -.8,
  .8, .8,
  
  -.8, -.8,
  .8, .8,
  -.8, .8
]);
const cellStateArrays = [];
cellStateArrays[0] = new Uint32Array(GRID_SIZE**2);
cellStateArrays[1] = new Uint32Array(GRID_SIZE**2);
for (let i = 0; i < cellStateArrays[0].length; i += 3) {
  cellStateArrays[0][i] = 1;
}
for (let i = 0; i < cellStateArrays[1].length; i ++) {
  cellStateArrays[1][i] = i%2;
}
uniforms.push({
  name: "cellState",
  type: 'storage',
  value: cellStateArrays,
  hasChanged: true,
  binding: 2,
});
console.log(uniforms)
const mesh = await createMesh(app, {
  vertices, 
  shader: cellShader,
  size: 2,
  instances: GRID_SIZE**2,
  id: "cell",
  uniforms
});

// renderer.render(mesh);

const run = (delta) => {
  const u = uniforms[1];
  u.value = delta*.0001;
  u.hasChanged = true;
  renderer.render(mesh);
  requestAnimationFrame(run);
}
run();