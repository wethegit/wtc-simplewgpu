const bindUniforms = (app, {
  uniforms,
  pipeline,
  entries
}) => {
  for(let i=0;i<uniforms.length;i++) {
    const u = uniforms[i];
    let uniformArray, uniformType, usage, label,  bufferNum = 1;
    // This can probably all be simplified
    if(u.hasChanged) {
      switch(u.type) {
        case 'float':
          uniformArray = [u.value];
          uniformType = "buffer";
          label = `${u.name} uniform`;
          usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
          break;
        case 'matrix':
        case 'array':
          uniformArray = u.value;
          uniformType = "buffer";
          label = `${u.name} uniform`;
          usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
          break;
        case 'dualStorage':
        case 'storage':
          uniformArray = u.value;
          bufferNum = uniformArray.length;
          uniformType = "storage";
          label = `${u.name} storage`;
          usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
          break;
      }
      let uvalue = [];
      for(let j=0;j<bufferNum;j++) {
        let val = uniformArray[j] !== null ? uniformArray[j] : uniformArray[0];
        if(u.type == 'float') val = new Float32Array([val]);
        else if(val instanceof Array) val = new Float32Array(val);
        if(u.name !== 'time') console.log(val)
        uvalue.push(val);
      }
      switch(uniformType) {
        case 'storage':
        case 'buffer':
          if(!u.buffers) {
            u.buffers=[]
            for(let j=0;j<bufferNum;j++) {
              u.buffers.push(
                app.device.createBuffer({
                  label,
                  size: uvalue[0].byteLength,
                  usage
                })
              );
            }
            for(let j=0;j<entries.length;j++) {
              entries[j].push({
                binding: u.binding,
                resource: {
                  buffer: u.buffers[j] !== undefined ? u.buffers[j] : u.buffers[0]
                }
              });
            }
          }
          for(let j=0;j<bufferNum;j++) {
            app.device.queue.writeBuffer(
              u.buffers[j], 
              0, 
              uvalue[j] !== undefined ? uvalue[j] : uvalue[0]
            );
          }
          break;
      }
      u.hasChanged = false;
    }
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

  // TO DO readdress how I'm doing bind groups, because I'm not sure if I'm doing it right

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
  let bindGroups = [];
  const bindGroupEntries = [[]];
  for(let i = 0; i < uniforms.length; i++) {
    if(uniforms[i].type === 'storage' && uniforms[i].value.length > 1) {
      bindGroupEntries.push([]);
    }
  }
  if(uniforms.length) {
    bindUniforms(app, {
      uniforms,
      pipeline,
      entries: bindGroupEntries
    });
    for(let i=0;i<bindGroupEntries.length;i++) {
      bindGroups.push(app.device.createBindGroup({
        label: `${id} bind group ${['A','B'][i]}`,
        layout: pipeline.getBindGroupLayout(0),
        entries: bindGroupEntries[i]
      }));
    }
    console.log(bindGroups.length)
  }
  
  const render = (renderPass) => {
    if(uniforms.length) {
      bindUniforms(app, {
        uniforms,
        pipeline,
        entries: bindGroupEntries
      });
    }
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, buffer);
    if(uniforms.length) {
      renderPass.setBindGroup(0, bindGroups[0]);
      // If more than one bind group, swap them
      // This assumes that there will only be 2, which may be wrong
      // It's also somewhat ambiguous, because there might actuall be more
      // bind groups in the shader (we're just using them to ping-pong)
      if(bindGroups.length > 1) {
        bindGroups.push(bindGroups.shift());
      }
    }
    renderPass.draw(length, instances);
  }

  return { pipeline, buffer, length, render };
}

export { createMesh }