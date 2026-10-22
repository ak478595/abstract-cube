/**
 * CubeEngine3D - Three.js Visual & Interactive 3D Rubik's Cube
 *
 * Requirements:
 * - Stateful 3x3x3 Rubik's cube with 27 cubies.
 * - Solid look: reduced black gaps between cubies, thin dark sticker boundaries.
 * - Exact Facelet mapping to standard logical state.
 * - Smooth layer rotation with queueing, no visual desynchronization.
 * - Face selection via raycasting on stickers with world-space normal detection.
 * - Sticker highlights, face detection, cubie type display (center, edge, corner).
 * - Full camera controls: OrbitControls, zoom, reset view.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FACE_COLORS, FACE_NAMES, INVERSE_MOVES } from './constants.js';

export class CubeEngine3D {
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign({
      cubieSize: 0.96, // Minimal black gap (cubies at distance 1.0, size 0.96 -> only 0.04 gap!)
      stickerOffset: 0.003,
      animationSpeed: 250, // ms per 90 deg turn
      onStickerSelected: null,
      onMoveComplete: null
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 27 cubies: array of THREE.Mesh / Group
    this.cubies = [];
    this.cubieMap = new Map(); // key "x,y,z" -> cubie mesh

    // Animation queue and state
    this.isAnimating = false;
    this.moveQueue = [];
    this.pivotGroup = new THREE.Group();

    // Sticker selection
    this.selectedSticker = null;
    this.highlightMesh = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 500;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.defaultCameraPos = new THREE.Vector3(5.5, 4.2, 6.2);
    this.camera.position.copy(this.defaultCameraPos);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 14;
    this.controls.target.set(0, 0, 0);

    // Lighting
    this.setupLighting();

    // Pivot group for animating face turns
    this.scene.add(this.pivotGroup);

    // Build the 27 Cubies
    this.buildCubies();

    // Setup selection highlight helper
    this.setupSelectionHighlight();

    // Event listeners
    this.setupEvents();

    // Render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 15, 12);
    dirLight1.castShadow = true;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffeedd, 0.6);
    dirLight2.position.set(-10, -5, -10);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.4, 20);
    pointLight.position.set(0, 6, 0);
    this.scene.add(pointLight);
  }

  buildCubies() {
    const size = this.options.cubieSize; // 0.96
    const radius = 0.06; // slight bevel / rounded look for realistic tactile cubies

    // Core black plastic geometry & material
    const baseGeo = new THREE.BoxGeometry(size, size, size);
    const coreMat = new THREE.MeshStandardMaterial({
      color: FACE_COLORS.CORE,
      roughness: 0.4,
      metalness: 0.1
    });

    // Sticker geometry: a flat plane placed slightly outside each face
    const stickerSize = size * 0.88; // Sleek, modern sticker margins
    const stickerGeo = new THREE.PlaneGeometry(stickerSize, stickerSize);

    // Materials cache for stickers
    this.stickerMaterials = {
      U: new THREE.MeshStandardMaterial({ color: FACE_COLORS.U, roughness: 0.2, metalness: 0.05 }),
      D: new THREE.MeshStandardMaterial({ color: FACE_COLORS.D, roughness: 0.2, metalness: 0.05 }),
      F: new THREE.MeshStandardMaterial({ color: FACE_COLORS.F, roughness: 0.2, metalness: 0.05 }),
      B: new THREE.MeshStandardMaterial({ color: FACE_COLORS.B, roughness: 0.2, metalness: 0.05 }),
      L: new THREE.MeshStandardMaterial({ color: FACE_COLORS.L, roughness: 0.2, metalness: 0.05 }),
      R: new THREE.MeshStandardMaterial({ color: FACE_COLORS.R, roughness: 0.2, metalness: 0.05 })
    };

    this.cubies = [];
    this.stickers = [];

    // Loop through 3x3x3 grid (-1, 0, 1 on each axis)
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubie = new THREE.Mesh(baseGeo, coreMat);
          cubie.position.set(x, y, z);
          cubie.castShadow = true;
          cubie.receiveShadow = true;

          // Determine cubie type:
          const nonZeroCount = (x !== 0 ? 1 : 0) + (y !== 0 ? 1 : 0) + (z !== 0 ? 1 : 0);
          cubie.userData = {
            initialPos: new THREE.Vector3(x, y, z),
            cubieType: nonZeroCount === 3 ? 'Corner' : nonZeroCount === 2 ? 'Edge' : nonZeroCount === 1 ? 'Center' : 'Core',
            stickers: []
          };

          const offset = size / 2 + this.options.stickerOffset;

          // Add face stickers where x, y, z touch cube exterior
          // Face U: y = +1 (normal: 0, 1, 0)
          if (y === 1) {
            const st = this.createSticker(stickerGeo, 'U', new THREE.Vector3(0, offset, 0), new THREE.Euler(-Math.PI / 2, 0, 0));
            cubie.add(st);
            cubie.userData.stickers.push(st);
            this.stickers.push(st);
          }
          // Face D: y = -1 (normal: 0, -1, 0)
          if (y === -1) {
            const st = this.createSticker(stickerGeo, 'D', new THREE.Vector3(0, -offset, 0), new THREE.Euler(Math.PI / 2, 0, 0));
            cubie.add(st);
            cubie.userData.stickers.push(st);
            this.stickers.push(st);
          }
          // Face R: x = +1 (normal: 1, 0, 0)
          if (x === 1) {
            const st = this.createSticker(stickerGeo, 'R', new THREE.Vector3(offset, 0, 0), new THREE.Euler(0, Math.PI / 2, 0));
            cubie.add(st);
            cubie.userData.stickers.push(st);
            this.stickers.push(st);
          }
          // Face L: x = -1 (normal: -1, 0, 0)
          if (x === -1) {
            const st = this.createSticker(stickerGeo, 'L', new THREE.Vector3(-offset, 0, 0), new THREE.Euler(0, -Math.PI / 2, 0));
            cubie.add(st);
            cubie.userData.stickers.push(st);
            this.stickers.push(st);
          }
          // Face F: z = +1 (normal: 0, 0, 1)
          if (z === 1) {
            const st = this.createSticker(stickerGeo, 'F', new THREE.Vector3(0, 0, offset), new THREE.Euler(0, 0, 0));
            cubie.add(st);
            cubie.userData.stickers.push(st);
            this.stickers.push(st);
          }
          // Face B: z = -1 (normal: 0, 0, -1)
          if (z === -1) {
            const st = this.createSticker(stickerGeo, 'B', new THREE.Vector3(0, 0, -offset), new THREE.Euler(0, Math.PI, 0));
            cubie.add(st);
            cubie.userData.stickers.push(st);
            this.stickers.push(st);
          }

          this.scene.add(cubie);
          this.cubies.push(cubie);
        }
      }
    }
  }

  createSticker(geometry, faceKey, localPos, localEuler) {
    const mat = this.stickerMaterials[faceKey];
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.copy(localPos);
    mesh.rotation.copy(localEuler);
    mesh.userData = {
      isSticker: true,
      originalFace: faceKey,
      currentFace: faceKey
    };
    return mesh;
  }

  setupSelectionHighlight() {
    const size = this.options.cubieSize * 0.92;
    const highlightGeo = new THREE.PlaneGeometry(size, size);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // vibrant light cyan/sky blue
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthTest: false
    });
    this.highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
    this.highlightMesh.visible = false;
    this.highlightMesh.renderOrder = 999;
    this.scene.add(this.highlightMesh);
  }

  setupEvents() {
    let pointerDownPos = { x: 0, y: 0 };
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      // If moved more than 5 pixels, it's camera drag/rotate, not a click!
      if (dist > 6) return;

      this.onPointerClick(e);
    });

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onPointerClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.stickers, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const sticker = hit.object;
      const cubie = sticker.parent;

      // Determine face from the sticker's CURRENT world normal!
      // This is crucial: even after rotations, the world normal accurately tells us
      // whether this sticker is currently facing Up (+Y), Down (-Y), Right (+X), Left (-X), Front (+Z), or Back (-Z).
      const worldNormal = new THREE.Vector3(0, 0, 1);
      worldNormal.applyQuaternion(sticker.getWorldQuaternion(new THREE.Quaternion())).normalize();

      const face = this.getFaceFromNormal(worldNormal);
      this.selectSticker(sticker, cubie, face, hit.point);
    } else {
      this.clearSelection();
    }
  }

  getFaceFromNormal(normal) {
    const absX = Math.abs(normal.x);
    const absY = Math.abs(normal.y);
    const absZ = Math.abs(normal.z);

    if (absY > absX && absY > absZ) {
      return normal.y > 0 ? 'U' : 'D';
    } else if (absX > absY && absX > absZ) {
      return normal.x > 0 ? 'R' : 'L';
    } else {
      return normal.z > 0 ? 'F' : 'B';
    }
  }

  selectSticker(sticker, cubie, currentFace, worldHitPoint) {
    this.selectedSticker = {
      sticker,
      cubie,
      currentFace,
      faceName: FACE_NAMES[currentFace],
      cubieType: cubie.userData.cubieType,
      originalFace: sticker.userData.originalFace
    };

    // Position highlight mesh on top of the selected sticker
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    sticker.getWorldPosition(worldPos);
    sticker.getWorldQuaternion(worldQuat);

    // Push slightly outward along normal to avoid z-fighting
    const normalOffset = new THREE.Vector3(0, 0, 0.015);
    normalOffset.applyQuaternion(worldQuat);
    worldPos.add(normalOffset);

    this.highlightMesh.position.copy(worldPos);
    this.highlightMesh.quaternion.copy(worldQuat);
    this.highlightMesh.visible = true;

    if (typeof this.options.onStickerSelected === 'function') {
      this.options.onStickerSelected(this.selectedSticker);
    }
  }

  clearSelection() {
    this.selectedSticker = null;
    this.highlightMesh.visible = false;
    if (typeof this.options.onStickerSelected === 'function') {
      this.options.onStickerSelected(null);
    }
  }

  /**
   * Rotate a face: 'U', 'U'', 'U2', etc.
   * Returns a promise that resolves when the move animation finishes.
   */
  async executeMove(moveStr, instant = false) {
    if (!moveStr) return;

    return new Promise((resolve) => {
      this.moveQueue.push({ moveStr, instant, resolve });
      if (!this.isAnimating) {
        this.processNextMove();
      }
    });
  }

  processNextMove() {
    if (this.moveQueue.length === 0) {
      this.isAnimating = false;
      return;
    }

    this.isAnimating = true;
    const { moveStr, instant, resolve } = this.moveQueue.shift();

    // Parse face and turn amount
    const face = moveStr[0]; // 'U', 'D', 'L', 'R', 'F', 'B'
    let turns = 1; // 1 = 90 deg clockwise
    if (moveStr.includes("'")) {
      turns = -1; // -90 deg counterclockwise
    } else if (moveStr.includes('2')) {
      turns = 2; // 180 deg
    }

    this.performLayerRotation(face, turns, instant, () => {
      if (resolve) resolve();
      if (typeof this.options.onMoveComplete === 'function') {
        this.options.onMoveComplete(moveStr);
      }
      this.processNextMove();
    });
  }

  /**
   * Standard Rubik's Cube rotation axes and layer coordinate filters:
   * Looking directly at the face from the outside:
   * Clockwise turn:
   * - U (y = 1): looking from +Y down, clockwise rotation is around Y axis by -90° (Right hand rule)
   * - D (y = -1): looking from -Y up, clockwise rotation is around Y axis by +90°
   * - R (x = 1): looking from +X in, clockwise is around X axis by -90°
   * - L (x = -1): looking from -X in, clockwise is around X axis by +90°
   * - F (z = 1): looking from +Z in, clockwise is around Z axis by -90°
   * - B (z = -1): looking from -Z in, clockwise is around Z axis by +90°
   */
  performLayerRotation(face, turns, instant, onComplete) {
    // 1. Identify which cubies belong to this outer layer
    // We check each cubie's current world position rounded to integer coordinates!
    const activeCubies = [];
    const eps = 0.2;

    for (const cubie of this.cubies) {
      const pos = cubie.position;
      let inLayer = false;
      if (face === 'U' && pos.y > 1 - eps) inLayer = true;
      if (face === 'D' && pos.y < -1 + eps) inLayer = true;
      if (face === 'R' && pos.x > 1 - eps) inLayer = true;
      if (face === 'L' && pos.x < -1 + eps) inLayer = true;
      if (face === 'F' && pos.z > 1 - eps) inLayer = true;
      if (face === 'B' && pos.z < -1 + eps) inLayer = true;

      if (inLayer) {
        activeCubies.push(cubie);
      }
    }

    // Safety: exactly 9 cubies must rotate
    if (activeCubies.length !== 9) {
      console.warn(`Warning: layer ${face} found ${activeCubies.length} cubies instead of 9!`);
    }

    // 2. Setup rotation axis and angle
    const axis = new THREE.Vector3();
    let angleDirection = 1;

    switch (face) {
      case 'U':
        axis.set(0, 1, 0);
        angleDirection = -1; // Clockwise from top is negative around Y
        break;
      case 'D':
        axis.set(0, 1, 0);
        angleDirection = 1; // Clockwise looking at bottom is positive around Y
        break;
      case 'R':
        axis.set(1, 0, 0);
        angleDirection = -1; // Clockwise looking at right is negative around X
        break;
      case 'L':
        axis.set(1, 0, 0);
        angleDirection = 1; // Clockwise looking at left is positive around X
        break;
      case 'F':
        axis.set(0, 0, 1);
        angleDirection = -1; // Clockwise looking at front is negative around Z
        break;
      case 'B':
        axis.set(0, 0, 1);
        angleDirection = 1; // Clockwise looking at back is positive around Z
        break;
    }

    const totalAngle = (Math.PI / 2) * turns * angleDirection;

    // Attach cubies to pivotGroup
    this.pivotGroup.rotation.set(0, 0, 0);
    this.pivotGroup.position.set(0, 0, 0);
    this.pivotGroup.scale.set(1, 1, 1);

    for (const cubie of activeCubies) {
      this.pivotGroup.attach(cubie);
    }

    // Hide highlight during animation
    this.highlightMesh.visible = false;

    if (instant) {
      this.finishRotation(activeCubies, axis, totalAngle, onComplete);
      return;
    }

    // Animate smoothly
    const startTime = performance.now();
    const duration = Math.abs(turns) === 2 ? this.options.animationSpeed * 1.5 : this.options.animationSpeed;

    const animateStep = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      // Smooth cubic ease-in-out
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.pivotGroup.setRotationFromAxisAngle(axis, totalAngle * ease);

      if (progress < 1.0) {
        requestAnimationFrame(animateStep);
      } else {
        this.finishRotation(activeCubies, axis, totalAngle, onComplete);
      }
    };

    requestAnimationFrame(animateStep);
  }

  finishRotation(activeCubies, axis, totalAngle, onComplete) {
    this.pivotGroup.setRotationFromAxisAngle(axis, totalAngle);
    this.pivotGroup.updateMatrixWorld(true);

    // Detach cubies back to scene and round coordinates to eliminate floating-point creep
    for (const cubie of activeCubies) {
      this.scene.attach(cubie);

      // Snap positions to exact integers -1, 0, 1
      cubie.position.x = Math.round(cubie.position.x);
      cubie.position.y = Math.round(cubie.position.y);
      cubie.position.z = Math.round(cubie.position.z);

      // Snap quaternion to closest 90-degree orientation
      const euler = new THREE.Euler().setFromQuaternion(cubie.quaternion, 'XYZ');
      const snapTo90 = (rad) => Math.round(rad / (Math.PI / 2)) * (Math.PI / 2);
      euler.x = snapTo90(euler.x);
      euler.y = snapTo90(euler.y);
      euler.z = snapTo90(euler.z);
      cubie.quaternion.setFromEuler(euler);
      cubie.updateMatrix();
    }

    this.pivotGroup.rotation.set(0, 0, 0);

    // Re-verify selection highlight if a sticker was selected
    if (this.selectedSticker && this.selectedSticker.sticker) {
      const st = this.selectedSticker.sticker;
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      st.getWorldPosition(worldPos);
      st.getWorldQuaternion(worldQuat);

      const worldNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuat).normalize();
      const newFace = this.getFaceFromNormal(worldNormal);
      this.selectSticker(st, st.parent, newFace, worldPos);
    }

    if (onComplete) onComplete();
  }

  /**
   * Resets all cubies back to standard identity positions and orientations
   */
  resetToIdentity() {
    this.moveQueue = [];
    this.isAnimating = false;
    this.clearSelection();

    for (const cubie of this.cubies) {
      if (cubie.parent !== this.scene) {
        this.scene.attach(cubie);
      }
      cubie.position.copy(cubie.userData.initialPos);
      cubie.rotation.set(0, 0, 0);
      cubie.quaternion.identity();
      cubie.updateMatrix();
    }
    this.pivotGroup.rotation.set(0, 0, 0);
  }

  resetView() {
    if (!this.camera || !this.controls) return;
    this.controls.reset();
    this.camera.position.copy(this.defaultCameraPos);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (this.controls) {
      this.controls.update();
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

