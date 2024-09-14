async function createMesh(app, {
  vertices, 
  shader, 
  size = 3,
  id = Math.floor(Math.random()*10000),
  vertexEntryPoint = "vMain",
  fragmentEntryPoint = "fMain",
  topology = "triangle-list"
}) {
  // Create a buffer to store the vertices.
  const buffer = app.device.createBuffer({
    label: `${id} buffer`,
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  // Write the vertices to the buffer.
  app.device.queue.writeBuffer(buffer, 0, vertices);

  // The shader module is a collection of code for rendering.
  const shaderModule = app.device.createShaderModule({
    label: `${id} shader`,
    code: shader
  });

  const vertexBufferDescriptor = {
    arrayStride: size * Float32Array.BYTES_PER_ELEMENT,
    attributes: [
      {
        shaderLocation: 0,
        format: "float32x2",
        offset: 0,
      }
    ]
  }

  // Create a render pipeline. This is the equivalent of a program in WebGL.
  const pipeline = app.device.createRenderPipeline({
    label: `${id} pipeline`,
    layout: "auto",
    primitive: {
      topology
    },
    vertex: {
      module: shaderModule,
      entryPoint: vertexEntryPoint,
      buffers: [vertexBufferDescriptor]
    },
    fragment: {
      module: shaderModule,
      entryPoint: fragmentEntryPoint,
      targets: [{
        format: app.format
      }]
    }
  });

  return { pipeline, buffer, length: vertices.length / size };
}

export { createMesh }