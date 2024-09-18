import { simplexBlob } from "./noise.js";

export default `
struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) i: u32
}
struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) cell: vec2f,
  @location(1) col: vec3f
}

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<uniform> time: f32;
@group(0) @binding(2) var<storage, read> cellState: array<u32>;

fn pal(t: f32, a: vec3<f32>, b: vec3<f32>, c: vec3<f32>, d: vec3<f32>) -> vec3<f32> {
  return a + b * cos(6.28318 * (c * t + d));
}
fn hash12(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
${simplexBlob}

@vertex
fn vMain(input: VertexInput) -> VertexOutput {
  let grd = vec2f(32);
  let _i = f32(input.i);
  let cell = vec2f(_i%grid.x, floor(_i/grid.x));
  let state = f32(cellState[input.i]);

  let cellOffset = cell / grid * 2;
  let gridPos = (input.pos*state+1)/grid-1+cellOffset;

  var output: VertexOutput;
  output.pos = vec4f(gridPos,0,1);
  output.cell = cell;
  output.col = pal(simplexNoise2(cell*.05+time), vec3f(0.5,0.5,0.5), vec3f(0.5,0.5,0.5), vec3f(1,1,1), vec3f(0.0,0.33,0.67));
  return output;
}

@fragment
fn fMain(@location(0) cell: vec2f, @location(1) col: vec3f) -> @location(0) vec4f {
  return vec4f(col,1);
}
`;