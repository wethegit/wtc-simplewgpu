import cellShader from "./cellShader.js";

if (!navigator.gpu) {
  throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();

const c = document.querySelector("canvas");
const ctx = c.getContext("webgpu");
const format = navigator.gpu.getPreferredCanvasFormat();
ctx.configure({
  device,
  format
});

// Create the vertices for our square.
const vertices = new Float32Array([
  -.8, -.8,
  .8, -.8,
  .8, .8,
  
  -.8, -.8,
  .8, .8,
  -.8, .8
]);

// Create a buffer to store the vertices.
const vertexBuffer = device.createBuffer({
  label: "square-vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
// Write the vertices to the buffer.
device.queue.writeBuffer(vertexBuffer, 0, vertices);

// The shader module is a collection of code for rendering.
const cellShaderModule = device.createShaderModule({
  label: "cell-shader",
  code: cellShader
});

const vertexBufferDescriptor = {
  arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
  attributes: [
    {
      shaderLocation: 0,
      format: "float32x2",
      offset: 0,
    }
  ]
}

// Create a render pipeline. This is the equivalent of a program in WebGL.
const cellPipeline = device.createRenderPipeline({
  label: "cell-pipeline",
  layout: "auto",
  vertex: {
    module: cellShaderModule,
    entryPoint: "vMain",
    buffers: [vertexBufferDescriptor]
  },
  fragment: {
    module: cellShaderModule,
    entryPoint: "fMain",
    targets: [{
      format
    }]
  }
});

// The command encoder provides an interface for recording CPU commands.
const encoder = device.createCommandEncoder();

// Create a texture and a view for the texture.
// Only usable in the current render pass.
// It is good practice to create a new texture for each frame.
const view = ctx.getCurrentTexture().createView();

// Create a render pass descriptor.
// The array provides a numbered list of color attachments for use using @location in the shader.
const renderPassDescriptor = {
  colorAttachments: [
    {
      view,
      clearValue: { r: 0.2, g: 0.4, b: 0.6, a: 1.0 },
      loadOp: "clear",
      storeOp: "store",
    }
  ]
};
// Begin a render pass. Render passes are when all drawing operations in WebGPU happen.
const renderPass = encoder.beginRenderPass(renderPassDescriptor);

// Set the pipeline to use for the render pass.
renderPass.setPipeline(cellPipeline);
renderPass.setVertexBuffer(0, vertexBuffer);
renderPass.draw(vertices.length / 2);

renderPass.end();

// Finish the encoding of commands.
const commandBuffer = encoder.finish();

// Submit the command buffer to the GPU.
// Once you submit the command buffer, it is executed on the GPU and cannot be used again.
device.queue.submit([commandBuffer]);