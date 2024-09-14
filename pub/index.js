import { createApplication } from "../lib.js/createApplication.js";
import { createRenderer } from "../lib.js/createRenderer.js";
import { createMesh } from "../lib.js/createMesh.js";
import cellShader from "./cellShader.js";

const GRID_SIZE = 4;

const c = document.querySelector("canvas");
const app = await createApplication({ canvas: c });
const renderer = await createRenderer(app);

// Create the vertices for our square.
const vertices = new Float32Array([
  -.8, -.8,
  .8, -.8,
  .8, .8,
  
  -.8, -.8,
  .8, .8,
  -.8, .8
]);
const mesh = await createMesh(app, {
  vertices, 
  shader: cellShader,
  size: 2,
  id: "cell",
});

const renderPass = await renderer.start();

// Set the pipeline to use for the render pass.
renderPass.setPipeline(mesh.pipeline);
renderPass.setVertexBuffer(0, mesh.buffer);
renderPass.draw(mesh.length);

renderer.end();