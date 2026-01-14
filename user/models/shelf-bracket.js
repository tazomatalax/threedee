import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const parameters = {
  length: 200,    // mm: horizontal support length (shelf depth)
  height: 100,    // mm: vertical wall attachment height
  width: 30,      // mm: width of the bracket metal
  thickness: 6,   // mm: thickness of the material
  holeDiameter: 5,// mm: screw hole size
  color: 0xcccccc, // light grey metal look
};

export function createMesh(userParams = {}) {
  const params = { ...parameters, ...userParams };
  const { length, height, width, thickness, holeDiameter, color } = params;
  
  const material = new THREE.MeshStandardMaterial({ 
    color,
    metalness: 0.6,
    roughness: 0.4
  });

  const geometries = [];

  // ==========================================
  // 1. Horizontal Arm (Top Plate)
  // Supports the shelf. Sits at the top (Y=height).
  // ==========================================
  
  // We use Shape + Extrude to create holes cleanly
  const horizShape = new THREE.Shape();
  // Rectangle profile centered on X axis
  horizShape.moveTo(-width/2, 0);
  horizShape.lineTo(width/2, 0);
  horizShape.lineTo(width/2, length);
  horizShape.lineTo(-width/2, length);
  horizShape.lineTo(-width/2, 0);

  // Add Screw Holes to Horizontal Arm
  const holesZ = [length * 0.25, length * 0.75]; // Two holes
  holesZ.forEach(z => {
    const hole = new THREE.Path();
    hole.absarc(0, z, holeDiameter/2, 0, Math.PI * 2, true);
    horizShape.holes.push(hole);
  });

  const horizGeom = new THREE.ExtrudeGeometry(horizShape, {
    depth: thickness,
    bevelEnabled: false
  });
  
  // Rotate to flat (X-Z plane)
  // Initially Extruded in Z direction. 
  // We want the SHAPE (X-Y) to become X-Z. So Rotate X -90.
  // BUT ExtrudeGeometry by default extrudes along Z.
  // Shape is in XY plane.
  horizGeom.rotateX(Math.PI / 2); // Now Shape is in XZ, Depth is in -Y.
  
  // We want Top surface at Y=height.
  // Origin (0,0) of shape is at Y=0. Depth goes to -thickness.
  // So adding 'height' puts top surface at Y=height.
  horizGeom.translate(0, height, 0);
  
  geometries.push(horizGeom);

  // ==========================================
  // 2. Vertical Arm (Back Plate)
  // Mounts to wall. Sits at back (Z=0).
  // ==========================================
  
  const vertShape = new THREE.Shape();
  // Rectangle profile (width x height)
  // We subtract thickness from height so it fits UNDER the top plate
  const vertHeight = height - thickness;
  
  vertShape.moveTo(-width/2, 0);
  vertShape.lineTo(width/2, 0);
  vertShape.lineTo(width/2, vertHeight);
  vertShape.lineTo(-width/2, vertHeight);
  vertShape.lineTo(-width/2, 0);

  // Add Screw Holes to Vertical Arm
  const holesY = [vertHeight * 0.25, vertHeight * 0.75];
  holesY.forEach(y => {
    const hole = new THREE.Path();
    hole.absarc(0, y, holeDiameter/2, 0, Math.PI * 2, true);
    vertShape.holes.push(hole);
  });

  const vertGeom = new THREE.ExtrudeGeometry(vertShape, {
    depth: thickness,
    bevelEnabled: false
  });
  // Created in XY. Extruded in Z.
  // Matches orientation perfectly (width in X, height in Y, thickness in Z).
  // Position: Back face is at Z=0.
  
  geometries.push(vertGeom);

  // ==========================================
  // 3. Diagonal Brace (Strut)
  // Connects the two arms.
  // ==========================================
  
  // Start point (on Vertical leg, near bottom)
  const p1 = new THREE.Vector3(0, height * 0.2, thickness); 
  // End point (on Horizontal leg, near tip)
  const p2 = new THREE.Vector3(0, height - thickness, length * 0.8);
  
  const braceLen = p1.distanceTo(p2);
  const braceWidth = width * 0.6; // Slightly narrower than arms
  
  const braceGeom = new THREE.BoxGeometry(braceWidth, thickness, braceLen);
  
  // Align brace
  const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
  
  // Orient the box to the direction
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
  braceGeom.applyQuaternion(quaternion);
  
  // Position it
  braceGeom.translate(center.x, center.y, center.z);
  
  geometries.push(braceGeom);

  // Ensure all geometries are compatible for merging (must use index or not freely mixed)
  // ExtrudeGeometry usually has indices. BoxGeometry has indices.
  // But BoxGeometry's UVs or index count might need explicit handling or we can convert all to non-indexed or indexed.
  // The safest way with mergeGeometries is to delete attributes that might be missing in others or mismatch.
  // But usually just ensuring all have index is enough. They both should have it.
  // The error said "geometry at index 2". That's the brace (BoxGeometry).
  // Often BoxGeometry has UVs, Normal, Position, Index. ExtrudeGeometry has UV, Normal, Position, Index.
  // Maybe attributes count mismatch?
  
  // A robust fix is to converting all to non-indexed before merging if there's conflict,
  // but better to keep indices for efficiency.
  // Let's debug by checking if simply re-computing index helps or if one is missing index.
  // Actually, usually it's safer to just .toNonIndexed() everything before merging if problematic,
  // OR make sure they all match.
  
  // The error "make sure index attribute exists among all geometries, or in none of them" suggests one might be missing it.
  // BoxGeometry definitely has an index. ExtrudeGeometry also has an index.
  // However, sometimes one might use different attributes (like 'uv' count).
  
  // Let's just delete the index from all to be safe and simple, or re-index them?
  // No, mergeGeometries works best if we just strip indices (make them non-indexed) -> merge -> (optional) mergeVertices/computeVertexNormals.
  
  const compatibleGeometries = geometries.map(g => g.toNonIndexed());
  const mergedGeometry = mergeGeometries(compatibleGeometries);
  
  // Re-merge vertices for a clean mesh (optional but good for shading)
  // mergedGeometry = mergeVertices(mergedGeometry); // Need to import this if we use it, but keeping it simple for now.

  const mesh = new THREE.Mesh(mergedGeometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

export const metadata = {
  name: "Heavy Duty Bracket",
  description: "Structural L-bracket with screw holes and diagonal reinforcement.",
  author: "GitHub Copilot",
};
