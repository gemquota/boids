// Boids WebGPU renderer — Stage 1 prototype (Novel path C).
//
// Fresh code written for gemquota/boids, following the pattern proven in
// gemquota/organoids PR #51 (src/gpu/renderer.js): WGSL instanced quads,
// one storage buffer of per-instance data, one draw call for everything,
// CPU pack + writeBuffer per frame, Canvas 2D fallback on any failure.
//
// Boids differences from the organoids renderer:
//  - each instance is a centipede SEGMENT, not a particle: it carries a
//    rotation angle (segments are oriented along the body), so the struct
//    is position(2) + radius(1) + angle(1) + color(4) = 8 floats.
//  - the pack function walks world.agents and their bodySegments, mirroring
//    the per-segment drawImage loop in app.js draw(). At 500 agents with
//    ~10 segments each that loop is ~5,000 Canvas 2D drawImage calls per
//    frame; this renderer replaces all of them with one draw(6, count).
//  - segment sprites (WebP atlas) are NOT sampled yet: Stage 1 draws soft
//    circles in the agent's body colour. Atlas sampling is Stage 1.5
//    (fragment shader + texture + per-instance UV rect).
//
// What this file does NOT do:
//  - no simulation on GPU (flocking/vision/predation stay CPU in Stage 1)
//  - no browser validation has been run on this file (no WebGPU device in
//    this VM). WGSL is uncompiled here; node --check only parses the JS.
//  - no repo code is imported: packSegments takes plain agent-shaped
//    objects, so it can be unit-tested in Node without the sim.

const SEGMENT_WGSL = `
struct Segment {
  position: vec2<f32>,
  radius: f32,
  angle: f32,
  color: vec4<f32>,
};

struct View {
  resolution: vec2<f32>,
  worldSize: vec2<f32>,
  camera: vec2<f32>,
  scale: f32,
  count: u32,
};

@group(0) @binding(0) var<storage, read> segments: array<Segment>;
@group(0) @binding(1) var<uniform> view: View;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) local: vec2<f32>,
  @location(1) color: vec4<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32,
              @builtin(instance_index) instanceIndex: u32) -> VertexOut {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  let s = segments[instanceIndex];
  let corner = corners[vertexIndex];
  // Rotate the quad so the segment's long axis follows the body angle.
  let c = cos(s.angle);
  let sn = sin(s.angle);
  let rotated = vec2<f32>(corner.x * c - corner.y * sn, corner.x * sn + corner.y * c);
  // Segments are ellipses: longer along the body than across it.
  let local = vec2<f32>(rotated.x * 1.45, rotated.y * 0.9);
  let pixel = view.camera + s.position * view.scale + local * s.radius * view.scale;
  let clip = vec2<f32>(
    pixel.x / view.resolution.x * 2.0 - 1.0,
    1.0 - pixel.y / view.resolution.y * 2.0
  );
  var out: VertexOut;
  out.position = vec4<f32>(clip, 0.0, 1.0);
  out.local = corner;
  out.color = s.color;
  return out;
}

@fragment
fn fragmentMain(in: VertexOut) -> @location(0) vec4<f32> {
  let d = length(in.local);
  let alpha = 1.0 - smoothstep(0.88, 1.0, d);
  return vec4<f32>(in.color.rgb, in.color.a * alpha);
}
`;

const FLOATS_PER_SEGMENT = 8;
const BYTES_PER_SEGMENT = FLOATS_PER_SEGMENT * Float32Array.BYTES_PER_ELEMENT;

// app.js body colour: hsl(hue 55% 48%). Same formula, in JS.
export function bodyColor(traits) {
  const hue = (((traits?.hue || 195) + (traits?.speed || 1) * 17) % 360) / 360;
  const s = 0.55;
  const l = 0.48;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    let tt = ((t % 1) + 1) % 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)];
}

// Pack every visible agent + body segment into one flat Float32Array.
// agents: world.agents-shaped objects {x, y, radius, traits, dead,
//   segments, bodySegments: [{x, y, angle}], spriteSeed?}.
// cameraScale: zoom, used for the minimum-radius floor (matches the
// organoids renderer's "never smaller than ~1px" rule).
// Returns {data, storage, count}. Pure JS — unit-testable in Node.
export function packSegments(agents, cameraScale = 1, target = null) {
  const scale = Number.isFinite(cameraScale) && cameraScale > 0 ? cameraScale : 1;
  // Upper bound: 1 head + 128 segments per agent (app.js caps count at 128).
  const capacityCount = agents.length * 129;
  const required = capacityCount * FLOATS_PER_SEGMENT;
  const storage = target && target.length >= required ? target : new Float32Array(required);
  let count = 0;
  for (const a of agents) {
    // Dead agents are drawn grey at .42 alpha in app.js; include them so
    // corpses do not vanish on the GPU path. #69777b = (105,119,123)/255.
    const dead = !!a.dead;
    const color = dead ? [105 / 255, 119 / 255, 123 / 255] : bodyColor(a.traits);
    const alpha = dead ? 0.42 : 1;
    const r = Math.max(1.5, a.radius || 3);
    const angle = Math.atan2(a.vy || 0, a.vx || 0);
    // Head.
    let offset = count++ * FLOATS_PER_SEGMENT;
    storage[offset] = a.x;
    storage[offset + 1] = a.y;
    storage[offset + 2] = Math.max(1.1 / scale, r * 1.45);
    storage[offset + 3] = angle;
    storage[offset + 4] = color[0];
    storage[offset + 5] = color[1];
    storage[offset + 6] = color[2];
    storage[offset + 7] = alpha;
    // Body segments, tail-first like app.js (draw order is cosmetic here;
    // the GPU draws in instance order, so head-first is also fine).
    const segments = a.bodySegments || [];
    const n = Math.max(1, Math.min(128, a.segments || 1));
    for (let i = 1; i < n && i <= segments.length; i++) {
      const seg = segments[i];
      if (!seg) continue;
      const taper = 0.96 - 0.24 * (i / Math.max(1, n - 1));
      offset = count++ * FLOATS_PER_SEGMENT;
      storage[offset] = seg.x;
      storage[offset + 1] = seg.y;
      storage[offset + 2] = Math.max(1.1 / scale, r * 0.29 * taper);
      storage[offset + 3] = seg.angle != null ? seg.angle + Math.PI : angle;
      storage[offset + 4] = color[0];
      storage[offset + 5] = color[1];
      storage[offset + 6] = color[2];
      storage[offset + 7] = dead ? 0.42 : 0.9;
    }
  }
  return { data: storage.subarray(0, count * FLOATS_PER_SEGMENT), storage, count };
}

// Probe only: true if this browser can even attempt WebGPU. Does not
// create a device or a canvas context.
export async function webGpuSupported() {
  if (!globalThis.navigator?.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

export async function createBoidsGpuRenderer(canvas, options = {}) {
  if (!globalThis.navigator?.gpu) throw new Error('WebGPU is unavailable in this browser');
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: options.powerPreference || 'high-performance' });
  if (!adapter) throw new Error('No compatible WebGPU adapter was found');
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu');
  if (!context) throw new Error('Could not create a WebGPU canvas context');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'premultiplied' });

  const shader = device.createShaderModule({ label: 'Boids segment renderer', code: SEGMENT_WGSL });
  const pipeline = await device.createRenderPipelineAsync({
    label: 'Boids instanced segments',
    layout: 'auto',
    vertex: { module: shader, entryPoint: 'vertexMain' },
    fragment: {
      module: shader,
      entryPoint: 'fragmentMain',
      targets: [{ format, blend: {
        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
      } }],
    },
    primitive: { topology: 'triangle-list' },
  });

  const uniformBuffer = device.createBuffer({
    label: 'Boids view uniforms',
    size: 32,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  let segmentBuffer = null;
  let bindGroup = null;
  let capacity = 0;
  let packedStorage = new Float32Array(0);
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let lost = false;
  device.lost.then((info) => { lost = true; options.onDeviceLost?.(info); });

  function ensureCapacity(count) {
    if (count <= capacity) return;
    const next = Math.max(256, 2 ** Math.ceil(Math.log2(count)));
    const bytes = next * BYTES_PER_SEGMENT;
    if (bytes > device.limits.maxStorageBufferBindingSize) {
      throw new Error('Segment buffer exceeds this device storage-buffer limit');
    }
    segmentBuffer?.destroy();
    segmentBuffer = device.createBuffer({
      label: 'Boids segment storage',
      size: bytes,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    capacity = next;
    bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: segmentBuffer } },
        { binding: 1, resource: { buffer: uniformBuffer } },
      ],
    });
  }

  function resize(cssWidth, cssHeight, dpr = 1) {
    width = Math.max(1, cssWidth);
    height = Math.max(1, cssHeight);
    pixelRatio = Math.max(1, Math.min(2, dpr));
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
  }

  // agents: world.agents. camera: {zoom, worldWidth, worldHeight,
  //   viewX, viewY} where viewX/viewY are the world coords of the
  //   viewport's top-left corner (app.js: viewLeft/viewTop).
  // The shader's camera is a pixel offset: -viewTopLeft * scale.
  function render(agents, camera) {
    if (lost) throw new Error('WebGPU device was lost');
    const packed = packSegments(agents, camera.zoom, packedStorage);
    packedStorage = packed.storage;
    const { data, count } = packed;
    if (count) {
      ensureCapacity(count);
      device.queue.writeBuffer(segmentBuffer, 0, data);
      const uniforms = new Float32Array(8);
      uniforms[0] = width * pixelRatio;
      uniforms[1] = height * pixelRatio;
      uniforms[2] = camera.worldWidth;
      uniforms[3] = camera.worldHeight;
      uniforms[4] = -camera.viewX * camera.zoom * pixelRatio;
      uniforms[5] = -camera.viewY * camera.zoom * pixelRatio;
      uniforms[6] = camera.zoom * pixelRatio;
      new Uint32Array(uniforms.buffer)[7] = count;
      device.queue.writeBuffer(uniformBuffer, 0, uniforms);
    }
    const encoder = device.createCommandEncoder({ label: 'Boids segment frame' });
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 0 }, // transparent: this canvas stacks above #world, whose #06121b background must show through
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    if (count) {
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6, count);
    }
    pass.end();
    device.queue.submit([encoder.finish()]);
    return count;
  }

  resize(canvas.clientWidth || globalThis.innerWidth || 1, canvas.clientHeight || globalThis.innerHeight || 1);
  return {
    adapter, device, format, resize, render,
    get segmentCapacity() { return capacity; },
    get isLost() { return lost; },
    destroy() {
      segmentBuffer?.destroy();
      uniformBuffer.destroy();
      device.destroy();
    },
  };
}

export { SEGMENT_WGSL, BYTES_PER_SEGMENT };
