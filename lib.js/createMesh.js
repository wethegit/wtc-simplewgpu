const bindUniforms = (app, {
  uniforms,
  pipeline,
  entries
}) => {
  for(let i=0;i<uniforms.length;i++) {
    const u = uniforms[i];
    let uniformBuffer, uniformArray, uniformType;
    if(u.hasChanged) {
      switch(u.type) {
        case 'float':
          uniformArray = new Float32Array([u.value]);
          uniformType = "buffer";
          break;
        case 'matrix':
        case 'array':
          uniformArray = new Float32Array(u.value);
          uniformType = "buffer";
          break;
      }
      switch(uniformType) {
        case 'buffer':
          uniformBuffer = app.device.createBuffer({
            label: `${u.name} uniform`,
            size: uniformArray.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          });
          app.device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
          entries.push({
            binding: u.binding,
            resource: {
              buffer: uniformBuffer
            }
          });
          break;
      }
    }
    u.hasChanged = false;
  }
}

async function createMesh(app, {
  vertices, 
  shader, 
  size = 3,
  instances = 1,
  id = Math.floor(Math.random()*10000),
  vertexEntryPoint = "vMain",
  fragmentEntryPoint = "fMain",
  topology = "triangle-list",
  uniforms = []
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

  const length = vertices.length / size;

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

  // Will need to update uniforms to deal with different bind groups and layouts
  let bindGroup;
  if(uniforms.length) {
    const bindGroupEntries = [];
    bindUniforms(app, {
      uniforms,
      pipeline,
      entries: bindGroupEntries
    });
    bindGroup = app.device.createBindGroup({
      label: `${id} bind group`,
      layout: pipeline.getBindGroupLayout(0),
      entries: bindGroupEntries
    });
  }

  const render = (renderPass) => {
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, buffer);
    if(uniforms.length) {
      renderPass.setBindGroup(0, bindGroup);
    }
    renderPass.draw(length, instances);
  }

  return { pipeline, buffer, length, render };
}

export { createMesh }