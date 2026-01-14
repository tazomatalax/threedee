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

const state = {
  autoRotate: false,
  showBoundingBox: false,
};

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
renderer.setClearColor(0x1a1a1e, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(60, 50, 80);
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 500;
controls.target.set(0, 0, 0);

// ════════════════════════════════════════════════════════════════════════════
// Lighting
// ════════════════════════════════════════════════════════════════════════════

// Ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0x404050, 0.8);
scene.add(ambientLight);

// Key light (main directional light)
const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
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
const gridSize = 200;
const gridDivisions = 20;

// Main grid
const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x333333, 0x1a1a1a);
grid.material.opacity = 0.6;
grid.material.transparent = true;
scene.add(grid);

// Axis lines (subtle)
const axisLength = 100;

// X axis (red)
const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0.01, 0),
  new THREE.Vector3(axisLength, 0.01, 0)
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
  new THREE.Vector3(0, 0.01, 0),
  new THREE.Vector3(0, 0.01, axisLength)
]);
const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x3b82f6, opacity: 0.5, transparent: true });
const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
scene.add(zAxis);

// ════════════════════════════════════════════════════════════════════════════
// Model Loading System (Dynamic Discovery)
// ════════════════════════════════════════════════════════════════════════════

// Material with modern PBR properties (kept for general use)
const material = new THREE.MeshStandardMaterial({
  color: 0x718096,
  metalness: 0.3,
  roughness: 0.4,
  envMapIntensity: 0.5,
});

// Dynamically discover all models in user/models/ using Vite's glob import
// This automatically picks up new model files without manual registration!
const modelModules = import.meta.glob('../user/models/*.js');

// Build model registry from discovered files
const modelRegistry = {};
const modelList = [];

for (const path in modelModules) {
  // Extract model ID from path: '../user/models/my-model.js' -> 'my-model'
  const match = path.match(/\/([^\/]+)\.js$/);
  if (match) {
    const modelId = match[1];
    modelRegistry[modelId] = modelModules[path];
    modelList.push({
      id: modelId,
      name: modelId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    });
  }
}

// Sort models alphabetically
modelList.sort((a, b) => a.name.localeCompare(b.name));

// Populate the model selector dropdown
const modelSelector = document.getElementById('model-selector');
modelSelector.innerHTML = ''; // Clear placeholder
modelList.forEach(model => {
  const option = document.createElement('option');
  option.value = model.id;
  option.textContent = model.name;
  modelSelector.appendChild(option);
});

// Current model state
let currentModelId = modelList.length > 0 ? modelList[0].id : null;
let mesh = null;

// Load and display a model by ID
async function loadModel(modelId) {
  if (!modelRegistry[modelId]) {
    console.error(`Model "${modelId}" not found in registry`);
    return;
  }

  // Remove existing mesh
  if (mesh) {
    scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  }

  try {
    const module = await modelRegistry[modelId]();
    mesh = module.createMesh();
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    currentModelId = modelId;

    // Update UI
    updateModelInfo();
    updateDimensions();
    
    // Update window reference
    window.mesh = mesh;
    
    console.log(`Loaded model: ${modelId}`);
  } catch (err) {
    console.error(`Failed to load model "${modelId}":`, err);
  }
}

// Initial model load (first model in sorted list)
if (currentModelId) {
  await loadModel(currentModelId);
} else {
  console.warn('No models found in user/models/');
}

// Bounding box helper for dimension visualization
const boundingBoxHelper = new THREE.Box3Helper(new THREE.Box3(), 0x22d3ee);
boundingBoxHelper.visible = state.showBoundingBox;
scene.add(boundingBoxHelper);

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
    topColor: { value: new THREE.Color(0x2a2a30) },
    bottomColor: { value: new THREE.Color(0x1a1a1e) },
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
// Axis Gizmo (rotating view indicator)
// ════════════════════════════════════════════════════════════════════════════

const axisGizmoCanvas = document.getElementById('axis-gizmo');
const axisGizmoRenderer = new THREE.WebGLRenderer({
  canvas: axisGizmoCanvas,
  antialias: true,
  alpha: true,
});
axisGizmoRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
axisGizmoRenderer.setSize(80, 80);
axisGizmoRenderer.setClearColor(0x000000, 0);

const axisGizmoScene = new THREE.Scene();
const axisGizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
axisGizmoCamera.position.set(0, 0, 3);
axisGizmoCamera.lookAt(0, 0, 0);

// Create axis arrows
function createAxisArrow(dir, color) {
  const group = new THREE.Group();
  
  // Shaft
  const shaftGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
  const shaftMat = new THREE.MeshBasicMaterial({ color });
  const shaft = new THREE.Mesh(shaftGeom, shaftMat);
  shaft.position.set(dir.x * 0.35, dir.y * 0.35, dir.z * 0.35);
  
  // Rotate shaft to point in direction
  if (dir.x !== 0) shaft.rotation.z = -Math.PI / 2;
  if (dir.z !== 0) shaft.rotation.x = Math.PI / 2;
  
  group.add(shaft);
  
  // Cone tip
  const coneGeom = new THREE.ConeGeometry(0.1, 0.2, 8);
  const coneMat = new THREE.MeshBasicMaterial({ color });
  const cone = new THREE.Mesh(coneGeom, coneMat);
  cone.position.set(dir.x * 0.8, dir.y * 0.8, dir.z * 0.8);
  
  if (dir.x !== 0) cone.rotation.z = dir.x > 0 ? -Math.PI / 2 : Math.PI / 2;
  if (dir.z !== 0) cone.rotation.x = dir.z > 0 ? Math.PI / 2 : -Math.PI / 2;
  if (dir.y < 0) cone.rotation.x = Math.PI;
  
  group.add(cone);
  
  return group;
}

const axisGizmo = new THREE.Group();
axisGizmo.add(createAxisArrow(new THREE.Vector3(1, 0, 0), 0xef4444)); // X - red
axisGizmo.add(createAxisArrow(new THREE.Vector3(0, 1, 0), 0x22c55e)); // Y - green
axisGizmo.add(createAxisArrow(new THREE.Vector3(0, 0, 1), 0x3b82f6)); // Z - blue

// Add small sphere at center
const centerGeom = new THREE.SphereGeometry(0.08, 16, 16);
const centerMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
axisGizmo.add(new THREE.Mesh(centerGeom, centerMat));

axisGizmoScene.add(axisGizmo);

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
const dimWidth = document.getElementById('dim-width');
const dimHeight = document.getElementById('dim-height');
const dimDepth = document.getElementById('dim-depth');
const bboxToggle = document.getElementById('bbox-toggle');

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

// Update dimension display based on actual mesh bounding box
function updateDimensions() {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  box.getSize(size);
  
  // Show actual mesh dimensions (what will be exported)
  dimWidth.textContent = `${size.x.toFixed(1)} mm`;
  dimHeight.textContent = `${size.y.toFixed(1)} mm`;
  dimDepth.textContent = `${size.z.toFixed(1)} mm`;
  
  // Update bounding box helper
  boundingBoxHelper.box.copy(box);
}

updateModelInfo();
updateDimensions();

// Bounding box toggle handler
bboxToggle.addEventListener('click', () => {
  state.showBoundingBox = !state.showBoundingBox;
  boundingBoxHelper.visible = state.showBoundingBox;
  bboxToggle.textContent = state.showBoundingBox ? 'Hide' : 'Show';
  bboxToggle.classList.toggle('active', state.showBoundingBox);
});

// Model selector handler
const modelSelector = document.getElementById('model-selector');
modelSelector.addEventListener('change', async (e) => {
  await loadModel(e.target.value);
});

// Export button handlers
document.getElementById('export-stl').addEventListener('click', () => {
  window.threedeeExport.stl(mesh, currentModelId);
});
document.getElementById('export-obj').addEventListener('click', () => {
  window.threedeeExport.obj(mesh, currentModelId);
});
document.getElementById('export-gltf').addEventListener('click', async () => {
  await window.threedeeExport.gltf(mesh, currentModelId);
});
document.getElementById('export-glb').addEventListener('click', async () => {
  await window.threedeeExport.glb(mesh, currentModelId);
});
document.getElementById('export-step').addEventListener('click', async () => {
  await window.threedeeExport.step(mesh, currentModelId);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const startTime = performance.now();

  // Gentle rotation for demo
  if (state.autoRotate) {
    mesh.rotation.y += 0.003;
    updateDimensions(); // Update bounding box when rotating
  }

  // Update controls
  controls.update();

  // Sync axis gizmo rotation with main camera
  axisGizmo.quaternion.copy(camera.quaternion).invert();
  axisGizmoRenderer.render(axisGizmoScene, axisGizmoCamera);

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
  window.state = state;
  window.loadModel = loadModel;
  window.modelRegistry = modelRegistry;
  window.modelList = modelList;
}

// ════════════════════════════════════════════════════════════════════════════
// Keyboard Shortcuts
// ════════════════════════════════════════════════════════════════════════════

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') {
    state.autoRotate = !state.autoRotate;
    console.log(`Auto-rotate: ${state.autoRotate ? 'ON' : 'OFF'}`);
    
    if (!state.autoRotate) {
      mesh.rotation.set(0, 0, 0);
    }
  }

  if (e.key.toLowerCase() === 'h') {
    // Reset camera position
    camera.position.set(60, 50, 80);
    controls.target.set(0, 0, 0);
    controls.update();
    
    // Also stop rotation and reset mesh if currently rotating
    state.autoRotate = false;
    mesh.rotation.set(0, 0, 0);
    console.log('View reset to Home');
  }

  if (e.code === 'Space') {
    e.preventDefault(); // Prevent page scroll
    grid.visible = !grid.visible;
    xAxis.visible = grid.visible;
    yAxis.visible = grid.visible;
    zAxis.visible = grid.visible;
    console.log(`Grid visibility: ${grid.visible ? 'ON' : 'OFF'}`);
  }
});

// Export for potential external manipulation
export { scene, camera, renderer, mesh, material, state, loadModel, currentModelId, modelList, modelRegistry };
