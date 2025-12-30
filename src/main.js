/**
 * threedee — Parametric Design Environment
 * Main entry point for the 3D viewport
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './exporters.js'; // Initialize export functions on window.threedeeExport

// ════════════════════════════════════════════════════════════════════════════
// Scene Setup
// ════════════════════════════════════════════════════════════════════════════

const canvas = document.getElementById('viewport');
const scene = new THREE.Scene();

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0b, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 4, 6);
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 50;
controls.target.set(0, 0, 0);

// ════════════════════════════════════════════════════════════════════════════
// Lighting
// ════════════════════════════════════════════════════════════════════════════

// Ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0x404050, 0.5);
scene.add(ambientLight);

// Key light (main directional light)
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 50;
keyLight.shadow.camera.left = -10;
keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
keyLight.shadow.bias = -0.0001;
scene.add(keyLight);

// Fill light (softer, from opposite side)
const fillLight = new THREE.DirectionalLight(0x8090a0, 0.4);
fillLight.position.set(-3, 4, -3);
scene.add(fillLight);

// Rim light (accent from behind)
const rimLight = new THREE.DirectionalLight(0x22d3ee, 0.3);
rimLight.position.set(-2, 3, -5);
scene.add(rimLight);

// ════════════════════════════════════════════════════════════════════════════
// Grid and Helpers
// ════════════════════════════════════════════════════════════════════════════

// Custom infinite grid
const gridSize = 20;
const gridDivisions = 20;

// Main grid
const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x333333, 0x1a1a1a);
grid.material.opacity = 0.6;
grid.material.transparent = true;
scene.add(grid);

// Axis lines (subtle)
const axisLength = 10;

// X axis (red)
const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0.001, 0),
  new THREE.Vector3(axisLength, 0.001, 0)
]);
const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xef4444, opacity: 0.5, transparent: true });
const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
scene.add(xAxis);

// Y axis (green) - pointing up
const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, axisLength, 0)
]);
const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x22c55e, opacity: 0.5, transparent: true });
const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
scene.add(yAxis);

// Z axis (blue)
const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0.001, 0),
  new THREE.Vector3(0, 0.001, axisLength)
]);
const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x3b82f6, opacity: 0.5, transparent: true });
const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
scene.add(zAxis);

// ════════════════════════════════════════════════════════════════════════════
// Demo Object — Edit this section to create your 3D designs!
// ════════════════════════════════════════════════════════════════════════════

// Material with modern PBR properties (kept for general use)
const material = new THREE.MeshStandardMaterial({
  color: 0x4a5568,
  metalness: 0.3,
  roughness: 0.4,
  envMapIntensity: 0.5,
});

// Cylinder gyroid demo
import { createMesh as createGyroid } from '../user/models/cylinder-gyroid.js';

const gyroidParams = {
  radius: 1.0,
  height: 2.0,
  resolution: 48,
  frequency: 1.5,
  level: 0.0,
  isolation: 0.0,
  color: 0x4a5568,
  metalness: 0.3,
  roughness: 0.4,
};

const mesh = createGyroid(gyroidParams);
mesh.castShadow = true;
mesh.receiveShadow = true;
scene.add(mesh);

// Ground plane for shadows
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// ════════════════════════════════════════════════════════════════════════════
// Environment
// ════════════════════════════════════════════════════════════════════════════

// Simple environment for reflections
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Create a simple gradient environment
const envScene = new THREE.Scene();
const envGeometry = new THREE.SphereGeometry(500, 32, 32);
const envMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor: { value: new THREE.Color(0x111115) },
    bottomColor: { value: new THREE.Color(0x0a0a0b) },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
    }
  `,
});
const envMesh = new THREE.Mesh(envGeometry, envMaterial);
envScene.add(envMesh);

const envMap = pmremGenerator.fromScene(envScene, 0, 0.1, 1000).texture;
scene.environment = envMap;

// ════════════════════════════════════════════════════════════════════════════
// Animation & Render Loop
// ════════════════════════════════════════════════════════════════════════════

// FPS tracking
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;

const fpsElement = document.getElementById('fps');
const renderTimeElement = document.getElementById('render-time');
const coordX = document.getElementById('coord-x');
const coordY = document.getElementById('coord-y');
const coordZ = document.getElementById('coord-z');
const modelInfo = document.getElementById('model-info');

// Update model info
function updateModelInfo() {
  let vertices = 0;
  let faces = 0;
  let primitives = 0;

  scene.traverse((object) => {
    if (object.isMesh && object.geometry) {
      primitives++;
      const geo = object.geometry;
      if (geo.index) {
        vertices += geo.attributes.position.count;
        faces += geo.index.count / 3;
      } else if (geo.attributes.position) {
        vertices += geo.attributes.position.count;
        faces += geo.attributes.position.count / 3;
      }
    }
  });

  modelInfo.textContent = `Primitives: ${primitives} • Vertices: ${vertices.toLocaleString()} • Faces: ${Math.round(faces).toLocaleString()}`;
}

updateModelInfo();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const startTime = performance.now();

  // Gentle rotation for demo
  mesh.rotation.y += 0.003;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Calculate render time
  const renderTime = performance.now() - startTime;
  renderTimeElement.textContent = `${renderTime.toFixed(1)}ms`;

  // FPS calculation
  frameCount++;
  const currentTime = performance.now();
  if (currentTime - lastTime >= 1000) {
    fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    fpsElement.textContent = `${fps} FPS`;
    fpsElement.style.color = fps >= 50 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444';
    frameCount = 0;
    lastTime = currentTime;
  }

  // Update camera position display
  coordX.textContent = `X: ${camera.position.x.toFixed(2)}`;
  coordY.textContent = `Y: ${camera.position.y.toFixed(2)}`;
  coordZ.textContent = `Z: ${camera.position.z.toFixed(2)}`;
}

// ════════════════════════════════════════════════════════════════════════════
// Resize Handler
// ════════════════════════════════════════════════════════════════════════════

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight - 76; // Account for header + footer

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', onResize);
onResize();

// Start the animation loop
animate();

// ════════════════════════════════════════════════════════════════════════════
// Hot Module Replacement (for Vite dev server)
// ════════════════════════════════════════════════════════════════════════════

if (import.meta.hot) {
  import.meta.hot.accept();
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.mesh = mesh;
  window.scene = scene;
  window.camera = camera;
  window.renderer = renderer;
  window.material = material;
}

// Export for potential external manipulation
export { scene, camera, renderer, mesh, material };
