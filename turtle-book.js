(() => {
  'use strict';

  const bookSection = document.getElementById('book');
  const canvas = document.getElementById('book-turtle-canvas');
  if (!bookSection || !canvas) return;

  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true })
          || canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) return;

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------------------------------------------------------
  // Minimal 3D Matrix Math (Column-Major)
  // -------------------------------------------------------
  const M4 = {
    identity() {
      const m = new Float32Array(16);
      m[0] = m[5] = m[10] = m[15] = 1;
      return m;
    },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 4; r++) {
          o[c * 4 + r] =
            a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] +
            a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
        }
      }
      return o;
    },
    translate(x, y, z) {
      const m = M4.identity();
      m[12] = x; m[13] = y; m[14] = z;
      return m;
    },
    scale(s) {
      const m = M4.identity();
      m[0] = m[5] = m[10] = s;
      return m;
    },
    rotX(a) {
      const c = Math.cos(a), s = Math.sin(a), m = M4.identity();
      m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
      return m;
    },
    rotY(a) {
      const c = Math.cos(a), s = Math.sin(a), m = M4.identity();
      m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
      return m;
    },
    rotZ(a) {
      const c = Math.cos(a), s = Math.sin(a), m = M4.identity();
      m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
      return m;
    },
    perspective(fov, aspect, near, far) {
      const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far), m = new Float32Array(16);
      m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf;
      m[11] = -1; m[14] = 2 * far * near * nf;
      return m;
    },
    lookAt(eye, target, up) {
      let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
      let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
      let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
      l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      const m = new Float32Array(16);
      m[0] = xx; m[1] = yx; m[2] = zx;
      m[4] = xy; m[5] = yy; m[6] = zy;
      m[8] = xz; m[9] = yz; m[10] = zz;
      m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
      m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
      m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
      m[15] = 1;
      return m;
    }
  };

  // -------------------------------------------------------
  // Parametric Sculpted Sea Turtle Geometry
  // -------------------------------------------------------
  function buildParametricMesh(uSteps, vSteps, evalPoint, flipWinding = false) {
    const pos = [], norm = [], idx = [];
    for (let i = 0; i <= vSteps; i++) {
      const v = i / vSteps;
      for (let j = 0; j <= uSteps; j++) {
        const u = j / uSteps;
        const p = evalPoint(u, v);
        const eps = 0.002;
        const pu = evalPoint(Math.min(1, u + eps), v);
        const pv = evalPoint(u, Math.min(1, v + eps));
        const du = [pu[0] - p[0], pu[1] - p[1], pu[2] - p[2]];
        const dv = [pv[0] - p[0], pv[1] - p[1], pv[2] - p[2]];
        let nx = du[1] * dv[2] - du[2] * dv[1];
        let ny = du[2] * dv[0] - du[0] * dv[2];
        let nz = du[0] * dv[1] - du[1] * dv[0];
        if (flipWinding) { nx = -nx; ny = -ny; nz = -nz; }
        const len = Math.hypot(nx, ny, nz) || 1;
        pos.push(p[0], p[1], p[2]);
        norm.push(nx / len, ny / len, nz / len);
      }
    }
    const row = uSteps + 1;
    for (let i = 0; i < vSteps; i++) {
      for (let j = 0; j < uSteps; j++) {
        const a = i * row + j, b = (i + 1) * row + j, c = b + 1, d = a + 1;
        if (flipWinding) idx.push(a, d, b, b, d, c);
        else idx.push(a, b, d, b, c, d);
      }
    }
    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(norm),
      indices: new Uint16Array(idx)
    };
  }

  function createShellMesh() {
    return buildParametricMesh(52, 38, (u, v) => {
      const phi = u * Math.PI * 2;
      const theta = v * Math.PI;
      const st = Math.sin(theta), ct = Math.cos(theta);
      const cp = Math.cos(phi), sp = Math.sin(phi);

      const rearTaper = 1.0 - 0.24 * Math.pow(Math.max(0, -ct), 1.3);
      const serration = 1.0 + 0.018 * Math.sin(theta * 14.0) * Math.max(0, -ct) * Math.pow(Math.abs(sp), 2.0);
      const x = st * sp * 0.88 * rearTaper * serration;
      const z = ct * 1.18;
      const rawY = st * cp;

      let y;
      if (rawY >= 0) {
        const keel = Math.exp(-Math.pow(x * 3.8, 2)) * 0.032 * st;
        const scuteBump = Math.max(0, Math.cos(x * 8.0) * Math.cos(z * 6.5)) * 0.016 * rawY;
        y = Math.pow(rawY, 0.88) * 0.46 + keel + scuteBump;
      } else {
        y = rawY * 0.16;
      }
      return [x, y, z];
    });
  }

  function createHeadMesh() {
    return buildParametricMesh(34, 24, (u, v) => {
      const phi = u * Math.PI * 2;
      const theta = v * Math.PI;
      const st = Math.sin(theta), ct = Math.cos(theta);
      const cp = Math.cos(phi), sp = Math.sin(phi);

      const front = Math.max(0, ct);
      const snoutNarrow = 1.0 - 0.42 * Math.pow(front, 1.4);
      const brow = Math.exp(-Math.pow((front - 0.45) * 4.5, 2)) * Math.max(0, cp) * 0.035;
      const eyeSocket = Math.exp(-Math.pow((front - 0.42) * 6.0, 2)) * Math.exp(-Math.pow((Math.abs(sp) - 0.88) * 5.0, 2)) * 0.025;
      const beakHook = Math.pow(front, 3.0) * (cp < 0 ? -0.032 : -0.012);
      const jawCut = Math.exp(-Math.pow((cp + 0.22) * 9.0, 2)) * Math.max(0, front - 0.15) * 0.018;

      const x = st * sp * 0.215 * snoutNarrow - Math.sign(sp) * eyeSocket;
      const y = st * cp * 0.17 * (1.0 - 0.28 * Math.pow(front, 1.5)) + brow + beakHook - jawCut;
      const z = ct * 0.32;
      return [x, y, z];
    });
  }

  function createJawMesh() {
    return buildParametricMesh(22, 16, (u, v) => {
      const phi = u * Math.PI * 2, theta = v * Math.PI;
      const st = Math.sin(theta), ct = Math.cos(theta), cp = Math.cos(phi), sp = Math.sin(phi);
      const front = Math.max(0, ct);
      const narrow = 1.0 - 0.45 * Math.pow(front, 1.3);
      return [
        st * sp * 0.175 * narrow,
        st * cp * 0.075 * (1.0 - 0.25 * front),
        ct * 0.26
      ];
    });
  }

  function createEllipsoid(rx, ry, rz, uSteps = 20, vSteps = 14) {
    return buildParametricMesh(uSteps, vSteps, (u, v) => {
      const phi = u * Math.PI * 2, theta = v * Math.PI;
      return [
        Math.sin(theta) * Math.sin(phi) * rx,
        Math.sin(theta) * Math.cos(phi) * ry,
        Math.cos(theta) * rz
      ];
    });
  }

  function createFlipperMesh(side = 1, length = 1.12, width = 0.36) {
    return buildParametricMesh(26, 18, (u, v) => {
      const t = v;
      const phi = u * Math.PI * 2;
      const chord = Math.sin(Math.pow(t, 0.52) * Math.PI) * width + (1 - t) * 0.09;
      const thick = (1 - t * 0.76) * 0.062;
      const sweepBack = -Math.pow(t, 1.4) * length * 0.54;
      const archY = Math.sin(t * Math.PI) * 0.055;
      const trailingScallop = Math.sin(t * 20.0) * 0.012 * Math.max(0, -Math.sin(phi));

      return [
        side * t * length,
        Math.cos(phi) * thick + archY,
        Math.sin(phi) * (chord * 0.5 + trailingScallop) + sweepBack
      ];
    }, side === -1);
  }

  function uploadMesh(mesh) {
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

    const normBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    return { posBuf, normBuf, idxBuf, count: mesh.indices.length };
  }

  const meshes = {
    shell: uploadMesh(createShellMesh()),
    neck: uploadMesh(createEllipsoid(0.165, 0.135, 0.25, 20, 14)),
    head: uploadMesh(createHeadMesh()),
    jaw: uploadMesh(createJawMesh()),
    eye: uploadMesh(createEllipsoid(0.044, 0.044, 0.044, 16, 12)),
    eyelid: uploadMesh(createEllipsoid(0.052, 0.038, 0.050, 14, 10)),
    nostril: uploadMesh(createEllipsoid(0.012, 0.009, 0.012, 10, 8)),
    tail: uploadMesh(createEllipsoid(0.075, 0.055, 0.24, 14, 10)),
    frontR: uploadMesh(createFlipperMesh(1, 1.14, 0.38)),
    frontL: uploadMesh(createFlipperMesh(-1, 1.14, 0.38)),
    backR: uploadMesh(createFlipperMesh(1, 0.54, 0.25)),
    backL: uploadMesh(createFlipperMesh(-1, 0.54, 0.25)),
    claw: uploadMesh(createEllipsoid(0.016, 0.014, 0.036, 10, 8))
  };

  // -------------------------------------------------------
  // WebGL Shader (Voronoi Scutes, Scales, Glossy Eyes, Ocean Caustics)
  // -------------------------------------------------------
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const turtleProg = gl.createProgram();
  gl.attachShader(turtleProg, compile(gl.VERTEX_SHADER, `
    attribute vec3 aPos;
    attribute vec3 aNormal;
    uniform mat4 uProj;
    uniform mat4 uView;
    uniform mat4 uModel;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec3 vLocal;
    void main() {
      vec4 wp = uModel * vec4(aPos, 1.0);
      vWorldPos = wp.xyz;
      vLocal = aPos;
      vNormal = normalize((uModel * vec4(aNormal, 0.0)).xyz);
      gl_Position = uProj * uView * wp;
    }
  `));
  gl.attachShader(turtleProg, compile(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec3 vLocal;
    uniform vec3 uEye;
    uniform float uPart; // 0=shell, 1=skin/head, 2=eye, 3=flipper, 4=claw/nostril
    uniform float uTime;

    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return fract(sin(p) * 43758.5453);
    }

    vec2 voronoi(vec2 x) {
      vec2 n = floor(x);
      vec2 f = fract(x);
      float md1 = 8.0, md2 = 8.0;
      float cid = 0.0;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j));
          vec2 o = hash2(n + g);
          vec2 r = g + (0.15 + 0.70 * o) - f;
          float d = dot(r, r);
          if (d < md1) {
            md2 = md1;
            md1 = d;
            cid = o.x;
          } else if (d < md2) {
            md2 = d;
          }
        }
      }
      return vec2(sqrt(md2) - sqrt(md1), cid);
    }

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(uEye - vWorldPos);
      vec3 L = normalize(vec3(0.32, 1.0, 0.42));

      vec3 base = vec3(0.26, 0.38, 0.23);
      float shininess = 28.0;
      float specAmt = 0.24;

      if (uPart < 0.5) {
        if (vLocal.y < -0.025) {
          vec2 pv = voronoi(vLocal.xz * 3.8);
          float seam = smoothstep(0.02, 0.11, pv.x);
          base = mix(vec3(0.68, 0.60, 0.42), vec3(0.88, 0.82, 0.62), seam);
        } else {
          vec2 sv = voronoi(vec2(abs(vLocal.x) * 3.6, vLocal.z * 3.2));
          float seam = smoothstep(0.02, 0.11, sv.x);
          float radial = fract(sv.x * 2.2);
          vec3 seamCol = vec3(0.11, 0.16, 0.10);
          vec3 darkOlive = vec3(0.18, 0.28, 0.16);
          vec3 warmAmber = vec3(0.56, 0.43, 0.17);
          vec3 scuteCol = mix(darkOlive, warmAmber, 0.28 + 0.58 * sv.y + 0.22 * radial);
          base = mix(seamCol, scuteCol, seam);
          float rim = smoothstep(0.10, -0.01, vLocal.y);
          base = mix(base, vec3(0.68, 0.58, 0.34), rim * 0.48);
        }
        shininess = 36.0;
        specAmt = 0.36;
      } else if (uPart < 1.5) {
        vec2 hv = voronoi(vec2(abs(vLocal.x) * 24.0, vLocal.z * 20.0));
        float seam = smoothstep(0.03, 0.16, hv.x);
        vec3 scaleDark = vec3(0.16, 0.26, 0.16);
        vec3 scaleLight = mix(vec3(0.28, 0.42, 0.26), vec3(0.46, 0.49, 0.28), hv.y);
        vec3 topSkin = mix(scaleDark, scaleLight, seam);
        vec3 chinCream = vec3(0.76, 0.72, 0.54);
        base = mix(chinCream, topSkin, smoothstep(-0.07, 0.03, vLocal.y));
        shininess = 26.0;
        specAmt = 0.28;
      } else if (uPart < 2.5) {
        float irisRing = smoothstep(0.018, 0.032, length(vLocal.xy));
        base = mix(vec3(0.02, 0.03, 0.04), vec3(0.22, 0.15, 0.08), irisRing * 0.65);
        shininess = 120.0;
        specAmt = 1.0;
      } else if (uPart < 3.5) {
        vec2 fv = voronoi(vec2(abs(vLocal.x) * 14.0, vLocal.z * 16.0));
        float seam = smoothstep(0.03, 0.15, fv.x);
        vec3 darkSpot = vec3(0.15, 0.24, 0.15);
        vec3 oliveScale = mix(vec3(0.26, 0.39, 0.24), vec3(0.48, 0.49, 0.28), fv.y);
        vec3 topF = mix(darkSpot, oliveScale, seam);
        base = mix(vec3(0.74, 0.71, 0.54), topF, smoothstep(-0.02, 0.025, vLocal.y));
      } else {
        base = vec3(0.14, 0.13, 0.10);
        shininess = 40.0;
        specAmt = 0.3;
      }

      float diff = max(dot(N, L), 0.0);
      float bounce = max(dot(N, vec3(0.0, -1.0, 0.0)), 0.0);
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(N, H), 0.0), shininess) * specAmt;
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

      float c1 = sin(vWorldPos.x * 5.8 + uTime * 2.1 + sin(vWorldPos.z * 4.2 - uTime));
      float c2 = cos(vWorldPos.z * 6.2 - uTime * 1.7);
      float caustic = pow(max(0.0, c1 * c2), 1.6);

      vec3 col = base * (0.32 + diff * 0.82);
      col += base * vec3(0.12, 0.42, 0.52) * bounce * 0.35;
      col += vec3(0.14, 0.52, 0.62) * fresnel * 0.62;
      col += vec3(0.55, 0.94, 1.0) * caustic * max(0.0, N.y) * 0.24;
      col += vec3(0.96, 0.99, 1.0) * spec;

      gl_FragColor = vec4(col, 1.0);
    }
  `));
  gl.linkProgram(turtleProg);

  const locs = {
    aPos: gl.getAttribLocation(turtleProg, 'aPos'),
    aNormal: gl.getAttribLocation(turtleProg, 'aNormal'),
    uProj: gl.getUniformLocation(turtleProg, 'uProj'),
    uView: gl.getUniformLocation(turtleProg, 'uView'),
    uModel: gl.getUniformLocation(turtleProg, 'uModel'),
    uEye: gl.getUniformLocation(turtleProg, 'uEye'),
    uPart: gl.getUniformLocation(turtleProg, 'uPart'),
    uTime: gl.getUniformLocation(turtleProg, 'uTime')
  };

  function drawPart(mesh, modelMat, proj, view, eye, partId, t) {
    gl.useProgram(turtleProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.posBuf);
    gl.enableVertexAttribArray(locs.aPos);
    gl.vertexAttribPointer(locs.aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normBuf);
    gl.enableVertexAttribArray(locs.aNormal);
    gl.vertexAttribPointer(locs.aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(locs.uProj, false, proj);
    gl.uniformMatrix4fv(locs.uView, false, view);
    gl.uniformMatrix4fv(locs.uModel, false, modelMat);
    gl.uniform3fv(locs.uEye, eye);
    gl.uniform1f(locs.uPart, partId);
    gl.uniform1f(locs.uTime, t);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idxBuf);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    gl.disableVertexAttribArray(locs.aNormal);
  }

  // -------------------------------------------------------
  // Click-Following Flowing Swim State & Sizing
  // -------------------------------------------------------
  const FOV = 0.72;
  const EYE = [0, 0.35, 5.2];
  const VIEW = M4.lookAt(EYE, [0, 0, 0], [0, 1, 0]);
  const TURTLE_SCALE = 0.56;
  const MAX_SWIM_SPEED = 1.65;

  const state = {
    active: false,
    rafId: 0,
    hasClickTarget: false,
    clickX: 0,
    clickY: 0,
    clickElapsed: 0,
    cruisePhase: 0,
    posX: -0.9,
    posY: 0.12,
    posZ: 0.0,
    velX: 0.22,
    velY: 0.02,
    velZ: 0.06,
    yaw: 0.85,
    headLeadYaw: 0,
    pitch: 0.0,
    roll: 0.0,
    swimTime: 0,
    halfW: 3.0,
    halfH: 1.8
  };

  function resize() {
    const w = bookSection.clientWidth;
    const h = bookSection.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const aspect = canvas.width / Math.max(canvas.height, 1);
    state.halfH = Math.tan(FOV / 2) * EYE[2];
    state.halfW = state.halfH * aspect;
  }

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(resize).observe(bookSection);
  } else {
    window.addEventListener('resize', resize);
  }
  resize();

  // Swim toward wherever the user clicks in Reserve Your Spot (never sticks to cursor)
  bookSection.addEventListener('click', (e) => {
    const rect = bookSection.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const marginX = Math.max(0.45, state.halfW * 0.80);
    const marginY = Math.max(0.35, state.halfH * 0.74);
    state.clickX = Math.max(-marginX, Math.min(marginX, (nx - 0.5) * 2 * state.halfW));
    state.clickY = Math.max(-marginY, Math.min(marginY, -(ny - 0.5) * 2 * state.halfH));
    state.hasClickTarget = true;
    state.clickElapsed = 0;
  });

  function renderTurtle(t, proj) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);

    const bobY = Math.sin(t * 2.0) * 0.04;
    const bodyPitch = Math.cos(t * 2.0) * 0.04 + state.pitch;
    const bodySwayYaw = Math.sin(t * 1.0) * 0.035;

    const root = M4.mul(
      M4.translate(state.posX, state.posY + bobY, state.posZ),
      M4.mul(
        M4.rotY(state.yaw + bodySwayYaw),
        M4.mul(M4.rotX(bodyPitch), M4.mul(M4.rotZ(state.roll), M4.scale(TURTLE_SCALE)))
      )
    );

    drawPart(meshes.shell, root, proj, VIEW, EYE, 0, t);
    const headBob = Math.sin(t * 2.0 - 0.5) * 0.035;
    const headTurn = state.headLeadYaw;
    const neckMat = M4.mul(root, M4.mul(M4.translate(0, 0.02, 1.06), M4.mul(M4.rotY(headTurn * 0.5), M4.rotX(headBob))));
    const headMat = M4.mul(root, M4.mul(M4.translate(0, 0.07, 1.34), M4.mul(M4.rotY(headTurn), M4.rotX(headBob * 1.25))));
    drawPart(meshes.neck, neckMat, proj, VIEW, EYE, 1, t);
    drawPart(meshes.head, headMat, proj, VIEW, EYE, 1, t);
    drawPart(meshes.jaw, M4.mul(headMat, M4.translate(0, -0.055, 0.03)), proj, VIEW, EYE, 1, t);
    drawPart(meshes.eye, M4.mul(headMat, M4.translate(0.135, 0.042, 0.09)), proj, VIEW, EYE, 2, t);
    drawPart(meshes.eye, M4.mul(headMat, M4.translate(-0.135, 0.042, 0.09)), proj, VIEW, EYE, 2, t);
    drawPart(meshes.eyelid, M4.mul(headMat, M4.translate(0.13, 0.058, 0.088)), proj, VIEW, EYE, 1, t);
    drawPart(meshes.eyelid, M4.mul(headMat, M4.translate(-0.13, 0.058, 0.088)), proj, VIEW, EYE, 1, t);
    drawPart(meshes.nostril, M4.mul(headMat, M4.translate(0.034, 0.022, 0.285)), proj, VIEW, EYE, 4, t);
    drawPart(meshes.nostril, M4.mul(headMat, M4.translate(-0.034, 0.022, 0.285)), proj, VIEW, EYE, 4, t);
    drawPart(meshes.tail, M4.mul(root, M4.mul(M4.translate(0, -0.02, -1.16), M4.rotY(-bodySwayYaw * 1.8))), proj, VIEW, EYE, 1, t);

    const flap = Math.sin(t * 2.1) * 0.56;
    const sweep = Math.cos(t * 2.1) * 0.32;
    const twist = Math.cos(t * 2.1) * 0.34;
    const frontRMat = M4.mul(root, M4.mul(M4.translate(0.68, -0.04, 0.48), M4.mul(M4.rotY(sweep), M4.mul(M4.rotZ(flap), M4.rotX(twist)))));
    const frontLMat = M4.mul(root, M4.mul(M4.translate(-0.68, -0.04, 0.48), M4.mul(M4.rotY(-sweep), M4.mul(M4.rotZ(-flap), M4.rotX(twist)))));
    drawPart(meshes.frontR, frontRMat, proj, VIEW, EYE, 3, t);
    drawPart(meshes.frontL, frontLMat, proj, VIEW, EYE, 3, t);
    drawPart(meshes.claw, M4.mul(frontRMat, M4.translate(0.56, 0.02, 0.08)), proj, VIEW, EYE, 4, t);
    drawPart(meshes.claw, M4.mul(frontLMat, M4.translate(-0.56, 0.02, 0.08)), proj, VIEW, EYE, 4, t);

    const rearFlap = Math.sin(t * 2.1 - 1.2) * 0.24;
    const backRMat = M4.mul(root, M4.mul(M4.translate(0.42, -0.06, -0.88), M4.mul(M4.rotY(-0.55), M4.rotZ(rearFlap))));
    const backLMat = M4.mul(root, M4.mul(M4.translate(-0.42, -0.06, -0.88), M4.mul(M4.rotY(0.55), M4.rotZ(-rearFlap))));
    drawPart(meshes.backR, backRMat, proj, VIEW, EYE, 3, t);
    drawPart(meshes.backL, backLMat, proj, VIEW, EYE, 3, t);
  }

  let lastNow = performance.now();
  function frame(now) {
    if (!state.active) {
      state.rafId = 0;
      return;
    }

    const dt = Math.min((now - lastNow) / 1000, 0.05);
    lastNow = now;
    state.cruisePhase += dt * 0.34;

    // Swim toward clicked spot, then seamlessly glide forward into open-ocean figure-8 flow
    const marginX = Math.max(0.45, state.halfW * 0.78);
    const marginY = Math.max(0.35, state.halfH * 0.70);
    const cruiseAmpX = marginX * 0.68;
    const cruiseAmpY = marginY * 0.40;

    if (state.hasClickTarget) {
      state.clickElapsed += dt;
      const clickDist = Math.hypot(state.clickX - state.posX, state.clickY - state.posY);
      if (clickDist < 0.48 || state.clickElapsed > 4.5) {
        const ratio = Math.max(-0.92, Math.min(0.92, state.posX / Math.max(cruiseAmpX, 0.5)));
        const baseAngle = Math.asin(ratio);
        state.cruisePhase = (state.velX >= 0 ? baseAngle : Math.PI - baseAngle) + 0.35;
        state.hasClickTarget = false;
      }
    }

    let anchorX, anchorY, anchorZ;
    if (state.hasClickTarget) {
      anchorX = state.clickX;
      anchorY = state.clickY;
      anchorZ = 0.12;
    } else {
      anchorX = Math.sin(state.cruisePhase) * cruiseAmpX;
      anchorY = Math.sin(state.cruisePhase * 2.0) * cruiseAmpY;
      anchorZ = Math.cos(state.cruisePhase) * 0.45 - 0.12;
    }

    const dx = anchorX - state.posX;
    const dy = anchorY - state.posY;
    const dz = anchorZ - state.posZ;
    const dist = Math.hypot(dx, dy, dz);

    // Controlled swim speed: ramps smoothly up to MAX_SWIM_SPEED, coasts cleanly as it arrives
    const desiredSpeed = dist > 0.02 ? Math.min(MAX_SWIM_SPEED, 0.34 + dist * 0.85) : 0;
    const invDist = dist > 0.0001 ? 1 / dist : 0;
    const desVx = dx * invDist * desiredSpeed;
    const desVy = dy * invDist * desiredSpeed;
    const desVz = dz * invDist * desiredSpeed;

    // Fluid inertia creates wide, graceful arcs through water
    const flowBlend = 1.0 - Math.exp(-dt * 2.1);
    state.velX += (desVx - state.velX) * flowBlend;
    state.velY += (desVy - state.velY) * flowBlend;
    state.velZ += (desVz - state.velZ) * flowBlend;

    state.posX += state.velX * dt;
    state.posY += state.velY * dt;
    state.posZ += state.velZ * dt;

    const speed = Math.hypot(state.velX, state.velY, state.velZ);
    const horizSpeed = Math.hypot(state.velX, state.velZ);

    // Flowing flipper stroke cadence boosted smoothly with swim speed
    const cadence = 1.35 + Math.min(1.15, speed * 0.85);
    state.swimTime += dt * cadence;

    let desiredYaw = state.yaw;
    let desiredPitch = -0.05;
    if (horizSpeed > 0.06) {
      desiredYaw = Math.atan2(state.velX, state.velZ);
      desiredPitch = Math.max(-0.38, Math.min(0.38, -Math.atan2(state.velY, Math.max(horizSpeed, 0.30))));
    }

    let yawDiff = desiredYaw - state.yaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

    const turnRate = 1.0 - Math.exp(-dt * 3.2);
    state.yaw += yawDiff * turnRate;
    state.pitch += (desiredPitch - state.pitch) * turnRate;

    const targetRoll = Math.max(-0.40, Math.min(0.40, -yawDiff * 0.42));
    state.roll += (targetRoll - state.roll) * (1.0 - Math.exp(-dt * 2.8));

    const targetHeadLead = Math.max(-0.24, Math.min(0.24, yawDiff * 0.35));
    state.headLeadYaw += (targetHeadLead - state.headLeadYaw) * (1.0 - Math.exp(-dt * 3.2));

    const aspect = canvas.width / Math.max(canvas.height, 1);
    const proj = M4.perspective(FOV, aspect, 0.1, 40);
    renderTurtle(state.swimTime, proj);

    state.rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (reducedMotion || state.active) return;
    state.active = true;
    lastNow = performance.now();
    if (!state.rafId) state.rafId = requestAnimationFrame(frame);
  }

  function stop() {
    state.active = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  if (reducedMotion) {
    const aspect = canvas.width / Math.max(canvas.height, 1);
    renderTurtle(0.8, M4.perspective(FOV, aspect, 0.1, 40));
    return;
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) start();
        else stop();
      }
    }, { threshold: 0.05 });
    observer.observe(bookSection);
  } else {
    start();
  }
})();
