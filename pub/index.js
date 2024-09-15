import { createApplication } from "../lib.js/createApplication.js";
import { createRenderer } from "../lib.js/createRenderer.js";
import { createMesh } from "../lib.js/createMesh.js";
import cellShader from "./cellShader.js";

const GRID_SIZE = 32;

const c = document.querySelector("canvas");
const app = await createApplication({ canvas: c });
const renderer = await createRenderer(app);

const uniforms = [
  {
    name: "grid",
    type: 'array',
    value: [GRID_SIZE, GRID_SIZE],
    hasChanged: true,
    binding: 0,
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
const mesh = await createMesh(app, {
  vertices, 
  shader: cellShader,
  size: 2,
  instances: GRID_SIZE**2,
  id: "cell",
  uniforms
});

// const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
// console.log(uniformArray.byteLength)
// const uniformBuffer = app.device.createBuffer({
//   label: "Grid uniforms",
//   size: uniformArray.byteLength,
//   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
// });
// app.device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
// const bindGroup = app.device.createBindGroup({
//   label: "cell render bind group",
//   layout: mesh.pipeline.getBindGroupLayout(0),
//   entries: [
//     {
//       binding: 0,
//       resource: {
//         buffer: uniformBuffer
//       }
//     }
//   ]
// });

// // This whole thing can probably be abstracted into a function
// // Combine the uniforms with the mesh and bind group and send it whole to renderer.render
// const renderPass = await renderer.start();

// // Set the pipeline to use for the render pass.
// renderPass.setPipeline(mesh.pipeline);
// renderPass.setVertexBuffer(0, mesh.buffer);
// renderPass.setBindGroup(0, bindGroup);
// renderPass.draw(mesh.length, GRID_SIZE**2); // The second param is the number of instances

// renderer.end();

await renderer.render(mesh);