/**
 * Example Parametric Part
 * 
 * This is a template showing how to define a parametric 3D model.
 * Edit the parameters and geometry to create your own designs.
 */

import * as THREE from 'three';

// ════════════════════════════════════════════════════════════════════════════
// Parameters — These values can be adjusted by the LLM or UI
// ════════════════════════════════════════════════════════════════════════════

export const parameters = {
  // Dimensions (in mm for manufacturing, or units for display)
  width: 40,
  height: 20,
  depth: 40,
  
  // Features
  filletRadius: 2,
  holeRadius: 5,
  holeDepth: 15,
  
  // Material appearance
  color: 0x4a90d9,
  metalness: 0.3,
  roughness: 0.4,
};

// ════════════════════════════════════════════════════════════════════════════
// Geometry Creation
// ════════════════════════════════════════════════════════════════════════════

export function createGeometry(userParams = {}) {
  const params = { ...parameters, ...userParams };
  const { width, height, depth } = params;
  
  // Create base geometry
  // For now using a simple box, but this can be replaced with
  // CSG operations, lathe geometry, extrusions, etc.
  const geometry = new THREE.BoxGeometry(width, height, depth);
  
  return geometry;
}

// ════════════════════════════════════════════════════════════════════════════
// Material Creation
// ════════════════════════════════════════════════════════════════════════════

export function createMaterial(userParams = {}) {
  const params = { ...parameters, ...userParams };
  return new THREE.MeshStandardMaterial({
    color: params.color,
    metalness: params.metalness,
    roughness: params.roughness,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// Mesh Creation (combines geometry + material)
// ════════════════════════════════════════════════════════════════════════════

export function createMesh(userParams = {}) {
  const params = { ...parameters, ...userParams };
  const geometry = createGeometry(params);
  const material = createMaterial(params);
  const mesh = new THREE.Mesh(geometry, material);
  
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  // Center the mesh above the ground plane
  mesh.position.y = params.height / 2;
  
  return mesh;
}

// ════════════════════════════════════════════════════════════════════════════
// Metadata for export
// ════════════════════════════════════════════════════════════════════════════

export const metadata = {
  name: 'Example Part',
  description: 'A simple parametric box template',
  author: 'threedee',
  units: 'mm',
  version: '1.0.0',
  created: new Date().toISOString(),
};
