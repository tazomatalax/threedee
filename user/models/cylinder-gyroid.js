import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

export const parameters = {
  radius: 20.0,        // radius in mm (diameter = 40mm)
  height: 20.0,        // height in mm
  resolution: 80,      // marching cubes resolution (increased for smoother walls)
  frequency: 0.2,      // spatial frequency of the gyroid (lower for larger models)
  level: 0.0,          // isosurface level (0 is balanced)
  isolation: 0.0,      // marching cubes isolation value
  color: 0x718096,
  metalness: 0.3,
  roughness: 0.4,
};

export function createGeometry(params = parameters) {
  const mesh = createMesh(params);
  return mesh.geometry;
}

export function createMesh(params = parameters) {
  const material = new THREE.MeshStandardMaterial({
    color: params.color,
    metalness: params.metalness,
    roughness: params.roughness,
    side: THREE.DoubleSide, // DoubleSide to see interior of gyroid cells
  });

  const mc = new MarchingCubes(params.resolution, material, false, false, 200000);
  mc.isolation = params.isolation;
  mc.castShadow = true;
  mc.receiveShadow = true;

  const size = params.resolution;

  // Number of gyroid periods around the circumference (must be integer for seamless wrap)
  const angularPeriods = 6;

  // Fill the scalar field with the gyroid function inside a cylinder
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Physical coordinates
        const px = (x / (size - 1) - 0.5) * 2 * params.radius;
        const pz = (z / (size - 1) - 0.5) * 2 * params.radius;
        const py = (y / (size - 1) - 0.5) * params.height;

        const r = Math.sqrt(px * px + pz * pz);
        const theta = Math.atan2(pz, px); // ranges from -π to +π

        // Radial symmetry mapping:
        // - radial: use r for the radial direction
        // - vertical: use py for height
        // - angular: use theta, scaled so that angularPeriods fit in 2π
        const xa = r * params.frequency * Math.PI;
        const ya = py * params.frequency * Math.PI;
        const za = theta * angularPeriods; // seamless when angularPeriods is integer

        // Gyroid function
        const g = Math.sin(xa) * Math.cos(ya) + Math.sin(ya) * Math.cos(za) + Math.sin(za) * Math.cos(xa);

        // Distance from boundaries
        const dRadial = r - params.radius;
        const dTop = py - params.height / 2;
        const dBottom = -py - params.height / 2;
        
        // Combine gyroid with boundaries using "smooth" max for capping
        // We want the material where g < level AND inside boundaries
        // In Marching Cubes, isolation = 0, so material is val < 0.
        // Surface is at val = 0.
        
        let val = g - params.level;
        
        // Enforce boundaries: if outside cylinder or top/bottom, val must be > 0 (outside)
        // Using a sharp but continuous transition to avoid zig-zags
        const boundaryDist = Math.max(dRadial, dTop, dBottom);
        
        // Final value is the union of "outside" regions
        // We use a factor (e.g., 5.0) to make the boundary crisp
        val = Math.max(val, boundaryDist * 10);

        mc.setCell(x, y, z, val);
      }
    }
  }

  // Create geometry from the field
  mc.update();

  // Scale and position
  mc.scale.set(params.radius, params.height / 2, params.radius);
  mc.position.y = params.height / 2;

  return mc;
}
