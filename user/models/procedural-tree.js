/**
 * Procedural Tree Model
 * 
 * Generates a stylized parametric tree with a trunk and multiple foliage levels.
 */

import * as THREE from 'three';

// ════════════════════════════════════════════════════════════════════════════
// Parameters
// ════════════════════════════════════════════════════════════════════════════

export const parameters = {
  trunkHeight: 15,
  trunkRadius: 2,
  foliageLevels: 3,
  foliageBaseRadius: 10,
  foliageHeight: 15,
  overlap: 0.6, // How much the foliage levels overlap (0-1)
  
  trunkColor: 0x5d4037,    // Deep brown
  foliageColor: 0x2e7d32,  // Forest green
  
  metalness: 0.1,
  roughness: 0.8,
};

// ════════════════════════════════════════════════════════════════════════════
// Mesh Creation
// ════════════════════════════════════════════════════════════════════════════

export function createMesh(userParams = {}) {
  const params = { ...parameters, ...userParams };
  
  const treeGroup = new THREE.Group();
  
  // 1. Create Trunk
  const trunkGeometry = new THREE.CylinderGeometry(
    params.trunkRadius * 0.8, // top
    params.trunkRadius,       // bottom
    params.trunkHeight, 
    12
  );
  const trunkMaterial = new THREE.MeshStandardMaterial({ 
    color: params.trunkColor,
    metalness: params.metalness,
    roughness: params.roughness
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  
  // Position the trunk so its base is at y=0
  trunk.position.y = params.trunkHeight / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  treeGroup.add(trunk);
  
  // 2. Create Foliage Levels (Cones)
  const foliageMaterial = new THREE.MeshStandardMaterial({ 
    color: params.foliageColor,
    metalness: params.metalness,
    roughness: params.roughness
  });
  
  for (let i = 0; i < params.foliageLevels; i++) {
    // Each level gets smaller as we go up
    const levelScale = 1 - (i * 0.25);
    const radius = params.foliageBaseRadius * levelScale;
    const height = params.foliageHeight * levelScale;
    
    const coneGeometry = new THREE.ConeGeometry(radius, height, 12);
    const level = new THREE.Mesh(coneGeometry, foliageMaterial);
    
    // Position each level. 
    // Start from the top of the trunk, and stack them with overlap.
    const yPos = params.trunkHeight + (i * height * (1 - params.overlap));
    level.position.y = yPos;
    
    level.castShadow = true;
    level.receiveShadow = true;
    
    treeGroup.add(level);
  }
  
  return treeGroup;
}

// ════════════════════════════════════════════════════════════════════════════
// Metadata
// ════════════════════════════════════════════════════════════════════════════

export const metadata = {
  name: 'Procedural Tree',
  description: 'A stylized parametric pine tree with adjustable levels and dimensions.',
  author: 'threedee-agent',
  version: '1.0.0',
  created: new Date().toISOString(),
};
