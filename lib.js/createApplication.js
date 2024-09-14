// Update with any settings needed for the application
async function createApplication({canvas}) {
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
  }
  
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }
  
  const device = await adapter.requestDevice();
  
  const ctx = canvas.getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({
    device,
    format
  });


  return { adapter, format, device, canvas, ctx };
}

export { createApplication }