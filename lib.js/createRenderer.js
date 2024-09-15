async function createRenderer(app) {
  let renderPass, encoder;
  const start = async () => {
    // The command encoder provides an interface for recording CPU commands.
    encoder = app.device.createCommandEncoder();

    // Create a texture and a view for the texture.
    // Only usable in the current render pass.
    // It is good practice to create a new texture for each frame.
    const view = app.ctx.getCurrentTexture().createView();

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
    renderPass = encoder.beginRenderPass(renderPassDescriptor);
    return renderPass;
  }
  const end = async () => {
    // Finish the render pass.
    renderPass.end();

    // Finish the encoding of commands.
    // While the primary use of a CommandBuffer is to submit it to a queue for execution, you can also perform validation, reuse, profiling, conditional execution, and chaining to enhance your application's functionality and performance.
    // TODO: consider adding validation etc.
    const commandBuffer = encoder.finish();

    // Submit the command buffer to the GPU.
    // Once you submit the command buffer, it is executed on the GPU and cannot be used again.
    app.device.queue.submit([commandBuffer]);
  }
  const render = async (mesh) => {
    const renderPass = await start();
    mesh.render(renderPass);
    end();
  }

  return { start, end, render };
}

export { createRenderer }