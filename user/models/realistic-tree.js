/**
 * Realistic Procedural Tree
 * 
 * Uses recursive branching and instanced-style leaf placement
 * to create a more natural-looking tree structure.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ════════════════════════════════════════════════════════════════════════════
// Parameters
// ════════════════════════════════════════════════════════════════════════════

export const parameters = {
  // Branching settings
  maxDepth: 5,
  initialLength: 12,
  initialRadius: 1.2,
  lengthDecay: 0.75,
  radiusDecay: 0.7,
  branchingAngle: 0.5, // Radians
  randomness: 0.2,
  
  // Leaves
  leafSize: 1.0,
  leavesPerTerminal: 12,
  
  // Colors
  barkColor: 0x4a3728,
  leafColor: 0x2d5a27,
  
  seed: 12345,
  metalness: 0.0,
  roughness: 1.0,
};

// ════════════════════════════════════════════════════════════════════════════
// Tree Generation Logic
// ════════════════════════════════════════════════════════════════════════════

function generateTreeParts(params) {
  const branchGeometries = [];
  const leafGeometries = [];
  
  // Simple pseudo-random helper
  let currentSeed = params.seed;
  function random() {
    currentSeed = (currentSeed * 16807) % 2147483647;
    return (currentSeed - 1) / 2147483646;
  }

  // Helper to add a branch
  function addBranch(pos, dir, length, radius, depth) {
    // Tapering: top radius is smaller than bottom radius
    const topRadius = radius * params.radiusDecay;
    const branchGeo = new THREE.CylinderGeometry(
      topRadius, 
      radius, 
      length, 
      8,
      1,
      false
    );
    
    // Position and orient branch
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    
    const midPoint = pos.clone().add(dir.clone().multiplyScalar(length / 2));
    matrix.compose(midPoint, quaternion, new THREE.Vector3(1, 1, 1));
    branchGeo.applyMatrix4(matrix);
    
    branchGeometries.push(branchGeo);
    
    // End of this branch
    const endPoint = pos.clone().add(dir.clone().multiplyScalar(length));
    
    if (depth < params.maxDepth) {
      // Create children branches
      const numChildren = random() > 0.8 ? 3 : 2; 
      
      for (let i = 0; i < numChildren; i++) {
        const newDir = dir.clone();
        
        // Perpendicular axis for branching
        const axis = new THREE.Vector3(
          random() - 0.5,
          random() - 0.5,
          random() - 0.5
        ).cross(dir).normalize();
        
        // Vary angle and add some twist
        const angle = params.branchingAngle * (0.8 + random() * 0.4);
        newDir.applyAxisAngle(axis, angle);
        
        // Random rotation around the parent branch axis
        newDir.applyAxisAngle(dir, (i / numChildren) * Math.PI * 2 + (random() * 0.5));
        
        addBranch(
          endPoint, 
          newDir, 
          length * (params.lengthDecay + (random() - 0.5) * 0.1), 
          topRadius, 
          depth + 1
        );
      }
    } else {
      // Add more realistic individual leaves at the tips
      for (let i = 0; i < params.leavesPerTerminal; i++) {
        // Use a flattened box or a small sphere-like cluster for "leaf"
        // Here we'll use a slightly elongated sphere for better "individual leaf" look
        const leafGeo = new THREE.IcosahedronGeometry(params.leafSize, 0); 
        
        // Scale to flatten it like a leaf
        leafGeo.scale(1, 0.2, 1.5);
        
        const leafMatrix = new THREE.Matrix4();
        const leafPos = endPoint.clone().add(new THREE.Vector3(
          (random() - 0.5) * 5,
          (random() - 0.5) * 5,
          (random() - 0.5) * 5
        ));
        
        const leafRot = new THREE.Euler(
          random() * Math.PI,
          random() * Math.PI,
          random() * Math.PI
        );
        
        leafMatrix.makeRotationFromEuler(leafRot);
        leafMatrix.setPosition(leafPos);
        
        leafGeo.applyMatrix4(leafMatrix);
        leafGeometries.push(leafGeo);
      }
    }
  }
  
  // Start from ground
  addBranch(
    new THREE.Vector3(0, 0, 0), 
    new THREE.Vector3(0, 1, 0), 
    params.initialLength, 
    params.initialRadius, 
    0
  );
  
  return { branchGeometries, leafGeometries };
}

export function createMesh(userParams = {}) {
  const params = { ...parameters, ...userParams };
  
  const { branchGeometries, leafGeometries } = generateTreeParts(params);
  
  const treeGroup = new THREE.Group();
  
  // Bark Mesh
  if (branchGeometries.length > 0) {
    const mergedBark = mergeGeometries(branchGeometries.map(g => g.index ? g.toNonIndexed() : g));
    const barkMaterial = new THREE.MeshStandardMaterial({ 
      color: params.barkColor,
      roughness: 1.0,
      metalness: 0.0
    });
    const barkMesh = new THREE.Mesh(mergedBark, barkMaterial);
    barkMesh.castShadow = true;
    barkMesh.receiveShadow = true;
    treeGroup.add(barkMesh);
  }
  
  // Foliage Mesh
  if (leafGeometries.length > 0) {
    const mergedLeaves = mergeGeometries(leafGeometries.map(g => g.index ? g.toNonIndexed() : g));
    const leafMaterial = new THREE.MeshStandardMaterial({ 
      color: params.leafColor,
      roughness: 0.8,
      metalness: 0.0
    });
    const leafMesh = new THREE.Mesh(mergedLeaves, leafMaterial);
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;
    treeGroup.add(leafMesh);
  }
  
  return treeGroup;
}

// ════════════════════════════════════════════════════════════════════════════
// Metadata
// ════════════════════════════════════════════════════════════════════════════

export const metadata = {
  name: 'Realistic Tree',
  description: 'A procedurally generated tree with recursive branches and leaf clusters.',
  author: 'threedee-agent',
  version: '1.1.0',
  created: new Date().toISOString(),
};
