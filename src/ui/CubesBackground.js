/**
 * CubesBackground - Vanilla JS adaptation of the WebGL 2 Animated Cubes Grid Background
 * Adapted from reference implementation (Can Tastemel / lambda.ai)
 */

const VERTEX = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUv;
in vec2 aCenter;
in vec4 aRotation;
in vec2 aState;
uniform mat4 uProjection;
uniform float uSize;
out vec3 vNormal;
out vec2 vUv;
out float vFlash;

vec3 turn(vec4 q, vec3 v) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  vec3 local = turn(aRotation, aPosition * uSize * aState.y);
  vNormal = turn(aRotation, aNormal);
  vUv = aUv;
  vFlash = aState.x;
  gl_Position = uProjection * vec4(vec3(aCenter, 0.0) + local, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in float vFlash;
uniform vec3 uFace;
uniform vec3 uEdge;
uniform vec3 uRipple;
uniform vec3 uLight;
uniform float uShading;
uniform float uEdgeWidth;
uniform float uStyle;
uniform float uMarks;
uniform float uOpacity;
out vec4 outColor;

void main() {
  vec2 span = max(fwidth(vUv), vec2(0.00001));
  vec2 border = min(vUv, 1.0 - vUv) / span;
  bool vertical = border.x < border.y;
  float distance = min(border.x, border.y);
  float halfWidth = uEdgeWidth * 0.5;
  float cover = 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, distance);
  float along = vertical ? vUv.y : vUv.x;
  float phase = along * uMarks;
  float step = max(vertical ? span.y : span.x, 0.00001) * uMarks;
  float offset = abs(fract(phase + 0.5) - 0.5);
  if (uStyle > 0.5 && uStyle < 1.5) {
    cover *= 1.0 - smoothstep(0.25 - step, 0.25 + step, offset);
  } else if (uStyle > 1.5 && uStyle < 2.5) {
    float radius = max(uEdgeWidth * 0.9, 1.0);
    float dot = length(vec2(offset / step, distance));
    cover = 1.0 - smoothstep(radius - 0.75, radius + 0.75, dot);
  } else if (uStyle > 2.5) {
    cover = 0.0;
  }
  vec3 normal = normalize(vNormal);
  cover *= smoothstep(0.06, 0.28, abs(normal.z));
  float side = clamp(1.0 - normal.z, 0.0, 1.0);
  float toward = clamp(0.6 + 0.6 * dot(normalize(normal.xy + vec2(0.00001)), normalize(uLight.xy)), 0.0, 1.0);
  vec3 face = mix(uFace, uEdge, side * mix(0.12, 0.42, toward) * uShading);
  face = mix(face, uRipple, vFlash * 0.22);
  vec3 edge = mix(uEdge, uRipple, vFlash);
  vec3 color = mix(face, edge, cover);
  float alpha = mix(uOpacity, 1.0, cover);
  outColor = vec4(color * alpha, alpha);
}`;

const FACES = [
  [0, 0, 1, 1, 0, 0, 0, 1, 0],
  [0, 0, -1, -1, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, -1, 0, 1, 0],
  [-1, 0, 0, 0, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 0, 0, 0, -1],
  [0, -1, 0, 1, 0, 0, 0, 0, 1]
];

const buildCube = () => {
  const vertices = [];
  const indices = [];
  FACES.forEach(([nx, ny, nz, ux, uy, uz, vx, vy, vz], face) => {
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1]
    ].forEach(([u, v]) => {
      vertices.push(
        nx * 0.5 + (u - 0.5) * ux + (v - 0.5) * vy,
        ny * 0.5 + (u - 0.5) * uy + (v - 0.5) * vy,
        nz * 0.5 + (u - 0.5) * uz + (v - 0.5) * vz,
        nx,
        ny,
        nz,
        u,
        v
      );
    });
    const base = face * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
};

const STYLES = { solid: 0, dashed: 1, dotted: 2, none: 3 };
const INTRO_SECONDS = 1.1;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (gl) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  ['aPosition', 'aNormal', 'aUv', 'aCenter', 'aRotation', 'aState'].forEach((name, index) =>
    gl.bindAttribLocation(program, index, name)
  );
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const toRotation = (rx, ry, out, offset) => {
  const angle = Math.hypot(rx, ry);
  if (angle < 0.000001) {
    out[offset] = 0;
    out[offset + 1] = 0;
    out[offset + 2] = 0;
    out[offset + 3] = 1;
    return;
  }
  const s = Math.sin(angle / 2) / angle;
  out[offset] = rx * s;
  out[offset + 1] = ry * s;
  out[offset + 2] = 0;
  out[offset + 3] = Math.cos(angle / 2);
};

const multiply = (a, b, out, offset) => {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  out[offset] = aw * bx + ax * bw + ay * bz - az * by;
  out[offset + 1] = aw * by - ax * bz + ay * bw + az * bx;
  out[offset + 2] = aw * bz + ax * by - ay * bx + az * bw;
  out[offset + 3] = aw * bw - ax * bx - ay * by - az * bz;
};

const projection = (width, height, scale, perspective) => {
  const halfWidth = width / 2 / scale;
  const halfHeight = height / 2 / scale;
  const depth = Math.max(halfWidth, halfHeight) * 4 + 4;
  if (perspective <= 0.001) {
    return new Float32Array([1 / halfWidth, 0, 0, 0, 0, 1 / halfHeight, 0, 0, 0, 0, -1 / depth, 0, 0, 0, 0, 1]);
  }
  const fov = ((8 + perspective * 52) * Math.PI) / 180;
  const distance = halfHeight / Math.tan(fov / 2);
  const near = Math.max(0.1, distance - depth);
  const far = distance + depth;
  const f = 1 / Math.tan(fov / 2);
  const aspect = halfWidth / halfHeight;
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    (2 * far * near) / (near - far) - ((far + near) / (near - far)) * distance,
    distance
  ]);
};

export class CubesBackground {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.settings = Object.assign({
      gridSize: 10,
      gap: 0.18,
      faceColor: '#090D16',       // Matched with --lab-bg theme
      edgeColor: '#38BDF8',       // Cyan accent border
      edgeWidth: 1,
      edgeStyle: 'solid',
      faceOpacity: 0.85,
      shading: 0.6,
      maxAngle: 45,
      radius: 3,
      speed: 1,
      bounce: 0.4,
      brush: 1,
      perspective: 0,
      autoAnimate: true,
      rippleOnClick: true,
      rippleColor: '#38BDF8',
      rippleSpeed: 1,
      intro: true,
      paused: false,
      dpr: undefined
    }, options);

    this.disposed = false;
    this.init();
  }

  init() {
    // Check WebGL 2 support
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cubes-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.canvas);

    try {
      this.gl = this.canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        depth: true,
        stencil: false
      });
    } catch (e) {
      this.gl = null;
    }

    if (!this.gl) {
      console.warn('CubeLab: WebGL 2 not supported for CubesBackground, falling back gracefully.');
      return;
    }

    const gl = this.gl;
    this.shader = link(gl);
    if (!this.shader) {
      console.warn('CubeLab: Failed to compile CubesBackground shaders.');
      return;
    }

    const cube = buildCube();
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);

    this.instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    [
      [3, 2, 0],
      [4, 4, 8],
      [5, 2, 24]
    ].forEach(([location, size, offset]) => {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 32, offset);
      gl.vertexAttribDivisor(location, 1);
    });

    // Probe 2D canvas for color conversion
    this.probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    this.colorCache = new Map();

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.reduce = reduce;
    this.view = { width: 1, height: 1, ratio: 1, scale: 1 };
    this.pointer = { x: 0, y: 0, inside: false, moved: 0 };
    this.cursor = { x: 0, y: 0, vx: 0, vy: 0, weight: 0, primed: false };
    this.grid = { size: 0, count: 0 };
    this.rx = new Float32Array(0);
    this.ry = new Float32Array(0);
    this.wx = new Float32Array(0);
    this.wy = new Float32Array(0);
    this.glow = new Float32Array(0);
    this.rings = [];
    this.delays = new Float32Array(0);
    this.instances = new Float32Array(0);
    this.clock = 0;
    this.introClock = this.settings.intro && !reduce ? 0 : 99;
    this.raf = 0;
    this.last = 0;
    this.visible = true;

    this.bindEvents();
    this.resize();
  }

  toRgb(value) {
    const cached = this.colorCache.get(value);
    if (cached) return cached;
    let rgb = [1, 1, 1];
    if (this.probe) {
      this.probe.clearRect(0, 0, 1, 1);
      this.probe.fillStyle = '#ffffff';
      this.probe.fillStyle = value;
      this.probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = this.probe.getImageData(0, 0, 1, 1).data;
      rgb = [r / 255, g / 255, b / 255];
    }
    this.colorCache.set(value, rgb);
    return rgb;
  }

  allocate(size) {
    if (this.grid.size === size) return;
    this.grid.size = size;
    this.grid.count = size * size;
    this.rx = new Float32Array(this.grid.count);
    this.ry = new Float32Array(this.grid.count);
    this.wx = new Float32Array(this.grid.count);
    this.wy = new Float32Array(this.grid.count);
    this.glow = new Float32Array(this.grid.count);
    this.delays = new Float32Array(this.grid.count);
    this.instances = new Float32Array(this.grid.count * 8);
    const center = (size - 1) / 2;
    for (let i = 0; i < this.grid.count; i++) {
      const col = i % size;
      const row = Math.floor(i / size);
      this.delays[i] = Math.hypot(col - center, row - center) / Math.max(1, size / 2);
    }
  }

  cellOf(i) {
    const size = this.grid.size;
    const center = (size - 1) / 2;
    return [(i % size) - center, center - Math.floor(i / size)];
  }

  toWorld(x, y) {
    return [
      (x - this.view.width / 2) / this.view.scale,
      (this.view.height / 2 - y) / this.view.scale
    ];
  }

  ripple(x, y) {
    const s = this.settings;
    if (!s.rippleOnClick || this.reduce) return;
    const [ox, oy] = this.toWorld(x, y);
    this.rings.push({ x: ox, y: oy, born: this.clock });
    if (this.rings.length > 6) this.rings.shift();
    this.wake();
  }

  render() {
    if (!this.gl || !this.shader || !this.grid.count) return;
    const gl = this.gl;
    const s = this.settings;
    const width = this.canvas.width;
    const height = this.canvas.height;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.shader.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instances, gl.DYNAMIC_DRAW);
    const u = this.shader.uniforms;
    gl.uniformMatrix4fv(u.uProjection, false, projection(this.view.width, this.view.height, this.view.scale, s.perspective));
    gl.uniform1f(u.uSize, 1 - s.gap);
    gl.uniform3fv(u.uFace, this.toRgb(s.faceColor));
    gl.uniform3fv(u.uEdge, this.toRgb(s.edgeColor));
    gl.uniform3fv(u.uRipple, this.toRgb(s.rippleColor));
    const light = [-0.42, 0.55, 0.72];
    const length = Math.hypot(...light);
    gl.uniform3f(u.uLight, light[0] / length, light[1] / length, light[2] / length);
    gl.uniform1f(u.uShading, s.shading);
    gl.uniform1f(u.uEdgeWidth, s.edgeWidth * this.view.ratio);
    gl.uniform1f(u.uStyle, STYLES[s.edgeStyle] ?? 0);
    const cubePixels = (1 - s.gap) * this.view.scale;
    const spacing = s.edgeStyle === 'dotted' ? Math.max(4, s.edgeWidth * 4) : Math.max(6, s.edgeWidth * 6);
    gl.uniform1f(u.uMarks, Math.max(1, Math.round(cubePixels / spacing)));
    gl.uniform1f(u.uOpacity, s.faceOpacity);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    if (s.faceOpacity >= 0.999) {
      gl.depthMask(true);
      gl.cullFace(gl.BACK);
      gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, this.grid.count);
    } else {
      gl.depthMask(false);
      gl.cullFace(gl.FRONT);
      gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, this.grid.count);
      gl.cullFace(gl.BACK);
      gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, this.grid.count);
      gl.depthMask(true);
    }
  }

  step(dt) {
    const s = this.settings;
    this.allocate(s.gridSize);
    this.clock += dt;
    if (this.introClock < 99) this.introClock += dt;

    const live = s.autoAnimate && !this.reduce && (!this.pointer.inside || this.clock - this.pointer.moved > 3);
    let goalX = this.cursor.x;
    let goalY = this.cursor.y;
    let engaged = false;
    if (this.pointer.inside && this.clock - this.pointer.moved <= 3) {
      [goalX, goalY] = this.toWorld(this.pointer.x, this.pointer.y);
      engaged = true;
    } else if (live) {
      const reach = this.grid.size * 0.42;
      goalX = Math.sin(this.clock * 0.37) * reach * Math.cos(this.clock * 0.11);
      goalY = Math.sin(this.clock * 0.53 + 1.2) * reach;
      engaged = true;
    }
    if (!this.cursor.primed && engaged) {
      this.cursor.x = goalX;
      this.cursor.y = goalY;
      this.cursor.primed = true;
    }
    const follow = 1 - Math.exp(-dt * 18);
    const prevX = this.cursor.x;
    const prevY = this.cursor.y;
    this.cursor.x += (goalX - this.cursor.x) * follow;
    this.cursor.y += (goalY - this.cursor.y) * follow;
    const blend = 1 - Math.exp(-dt * 10);
    this.cursor.vx += ((this.cursor.x - prevX) / Math.max(dt, 0.001) - this.cursor.vx) * blend;
    this.cursor.vy += ((this.cursor.y - prevY) / Math.max(dt, 0.001) - this.cursor.vy) * blend;
    this.cursor.weight += ((engaged ? 1 : 0) - this.cursor.weight) * (1 - Math.exp(-dt * (engaged ? 6 : 2.5)));

    const stiffness = 160 * s.speed * s.speed;
    const damping = 2 * (1 - 0.82 * s.bounce) * Math.sqrt(stiffness);
    const maxAngle = (s.maxAngle * Math.PI) / 180;
    const lift = 0.8;
    const travel = 8 * s.rippleSpeed;
    const fade = Math.exp(-dt * 3.2);
    const reachLimit = this.grid.size * 1.5 + 2;
    for (let k = this.rings.length - 1; k >= 0; k--) {
      if ((this.clock - this.rings[k].born) * travel > reachLimit) this.rings.splice(k, 1);
    }
    const speedNow = Math.hypot(this.cursor.vx, this.cursor.vy);
    const sweepX = speedNow > 0.0001 ? -this.cursor.vy / speedNow : 0;
    const sweepY = speedNow > 0.0001 ? this.cursor.vx / speedNow : 0;
    const sweep = this.reduce ? 0 : Math.min(speedNow, 40) * s.brush * 1.6;
    let moving = false;

    for (let i = 0; i < this.grid.count; i++) {
      const [cx, cy] = this.cellOf(i);
      const dx = cx - this.cursor.x;
      const dy = cy - this.cursor.y;
      const distance = Math.hypot(dx, dy);
      const t = distance / s.radius;
      const falloff = t < 1 ? (1 - t * t) * (1 - t * t) * this.cursor.weight : 0;
      let targetX = 0;
      let targetY = 0;
      if (falloff > 0 && distance > 0.0001) {
        const tilt = maxAngle * falloff * (distance / Math.hypot(distance, lift));
        targetX = (dy / distance) * tilt;
        targetY = (-dx / distance) * tilt;
      }
      if (falloff > 0 && sweep > 0) {
        this.wx[i] += sweepX * sweep * falloff * dt * 4;
        this.wy[i] += sweepY * sweep * falloff * dt * 4;
      }
      this.glow[i] *= fade;
      for (let k = 0; k < this.rings.length; k++) {
        const ring = this.rings[k];
        const ox = cx - ring.x;
        const oy = cy - ring.y;
        const reach = Math.hypot(ox, oy);
        const now = (this.clock - ring.born) * travel;
        if (reach > now || reach <= now - travel * dt || reach < 0.0001) continue;
        const strength = Math.exp(-reach / (this.grid.size * 0.8));
        this.wx[i] -= (oy / reach) * 13 * strength;
        this.wy[i] -= (ox / reach) * 13 * strength;
        this.glow[i] = Math.max(this.glow[i], strength);
      }
      if (this.glow[i] > 0.01) moving = true;
      if (this.reduce) {
        this.rx[i] = targetX;
        this.ry[i] = targetY;
        this.wx[i] = 0;
        this.wy[i] = 0;
      } else {
        this.wx[i] += (stiffness * (targetX - this.rx[i]) - damping * this.wx[i]) * dt;
        this.wy[i] += (stiffness * (targetY - this.ry[i]) - damping * this.wy[i]) * dt;
        this.rx[i] += this.wx[i] * dt;
        this.ry[i] += this.wy[i] * dt;
      }
      if (
        Math.abs(targetX - this.rx[i]) + Math.abs(targetY - this.ry[i]) > 0.0005 ||
        Math.abs(this.wx[i]) + Math.abs(this.wy[i]) > 0.0005
      ) {
        moving = true;
      }

      let grow = 1;
      let tumble = 0;
      if (this.introClock < 99) {
        const local = clamp((this.introClock - this.delays[i] * 0.55) / INTRO_SECONDS, 0, 1);
        const eased = 1 - Math.pow(1 - local, 3);
        grow = eased;
        tumble = (1 - eased) * (Math.PI / 2);
        if (local < 1) moving = true;
      }

      const tilt = [0, 0, 0, 1];
      toRotation(this.rx[i], this.ry[i], tilt, 0);
      const turn = [Math.sin(tumble / 2), 0, 0, Math.cos(tumble / 2)];
      const base = i * 8;
      this.instances[base] = cx;
      this.instances[base + 1] = cy;
      multiply(tilt, turn, this.instances, base + 2);
      this.instances[base + 6] = this.glow[i];
      this.instances[base + 7] = grow;
    }
    if (this.introClock >= INTRO_SECONDS + 0.6 && this.introClock < 99) this.introClock = 99;
    return (
      moving ||
      live ||
      this.rings.length > 0 ||
      (engaged && speedNow > 0.01) ||
      Math.abs((engaged ? 1 : 0) - this.cursor.weight) > 0.002
    );
  }

  frame(now) {
    this.raf = 0;
    if (this.disposed || !this.visible || document.hidden) return;
    const s = this.settings;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    const active = s.paused ? false : this.step(dt);
    this.render();
    if (active && !this.disposed) {
      this.raf = requestAnimationFrame((t) => this.frame(t));
    } else {
      this.last = 0;
    }
  }

  wake() {
    if (!this.raf && this.visible && !document.hidden && !this.disposed) {
      this.raf = requestAnimationFrame((t) => this.frame(t));
    }
  }

  resize() {
    if (!this.container || !this.canvas || this.disposed) return;
    const s = this.settings;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    this.view.width = width;
    this.view.height = height;
    this.view.scale = Math.min(width, height) / (s.gridSize + 0.9);
    this.canvas.width = Math.max(1, Math.round(width * this.view.ratio));
    this.canvas.height = Math.max(1, Math.round(height * this.view.ratio));
    this.allocate(s.gridSize);
    if (!this.raf) {
      this.step(0);
      this.render();
    }
    this.wake();
  }

  bindEvents() {
    this._onPointerMove = (event) => {
      if (this.disposed || !this.container) return;
      const rect = this.container.getBoundingClientRect();
      this.pointer.x = event.clientX - rect.left;
      this.pointer.y = event.clientY - rect.top;
      this.pointer.inside = this.pointer.x >= 0 && this.pointer.y >= 0 && this.pointer.x <= rect.width && this.pointer.y <= rect.height;
      if (this.pointer.inside) this.pointer.moved = this.clock;
      this.wake();
    };

    this._onPointerLeave = () => {
      this.pointer.inside = false;
      this.wake();
    };

    this._onPointerDown = (event) => {
      if (this.disposed || !this.container) return;
      const rect = this.container.getBoundingClientRect();
      this.ripple(event.clientX - rect.left, event.clientY - rect.top);
    };

    this._onVisibility = () => {
      this.last = 0;
      this.wake();
    };

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);

    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.visible = entries.some((entry) => entry.isIntersecting);
      if (this.visible) {
        this.last = 0;
        this.wake();
      }
    });
    this.intersectionObserver.observe(this.container);

    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', this._onPointerLeave);
    // Bind pointerdown on window or container for ripples, checking bounding rect
    window.addEventListener('pointerdown', this._onPointerDown, { passive: true });
    document.addEventListener('visibilitychange', this._onVisibility);
  }

  destroy() {
    this.disposed = true;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    window.removeEventListener('pointermove', this._onPointerMove);
    document.documentElement.removeEventListener('pointerleave', this._onPointerLeave);
    window.removeEventListener('pointerdown', this._onPointerDown);
    document.removeEventListener('visibilitychange', this._onVisibility);

    if (this.gl) {
      const gl = this.gl;
      if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
      if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
      if (this.instanceBuffer) gl.deleteBuffer(this.instanceBuffer);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.shader && this.shader.program) gl.deleteProgram(this.shader.program);
    }

    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}

