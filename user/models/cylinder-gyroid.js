import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

export const parameters = {
  radius: 3.0,
  height: 6.0,
  resolution: 64,      // marching cubes resolution (lower = faster)
  frequency: 1.5,      // spatial frequency of the gyroid (controls number of periods)
  level: 0.8,          // isosurface level for gyroid (0 is the standard gyroid)
  isolation: 0.0,      // marching cubes isolation value (we use zero-level)
  color: 0x4a5568,
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
    side: THREE.DoubleSide,
  });

  const mc = new MarchingCubes(params.resolution, material, false, false, 200000);
  mc.isolation = params.isolation;
  mc.castShadow = true;
  mc.receiveShadow = true;

  const size = params.resolution;

  // Fill the scalar field with the gyroid function inside a cylinder
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Physical coordinates centered at origin
        const px = (x / (size - 1) - 0.5) * 2 * params.radius;
        const pz = (z / (size - 1) - 0.5) * 2 * params.radius;
        const py = (y / (size - 1) - 0.5) * params.height;

        const r = Math.sqrt(px * px + pz * pz);

        let val;
        if (r > params.radius) {
          // outside the cylinder: make the field positive so it's considered "outside" the iso
          val = 1.0;
        } else {
          // map physical coords to angular domain for the gyroid
          const xa = px * params.frequency * Math.PI;
          const ya = py * params.frequency * Math.PI;
          const za = pz * params.frequency * Math.PI;

          const g = Math.sin(xa) * Math.cos(ya) + Math.sin(ya) * Math.cos(za) + Math.sin(za) * Math.cos(xa);

          // subtract level so that the iso is at g == level (we use default level 0)
          val = g - params.level;
        }

        mc.setCell(x, y, z, val);
      }
    }
  }

  // Create geometry from the field
  mc.update();

  // Position the mesh so its base sits on the ground plane (y = 0)
  mc.position.y = params.height / 2;

  return mc;
}
