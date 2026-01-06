import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const parameters = {
  radius: 20.0,        // radius in mm (diameter = 40mm)
  height: 20.0,        // height in mm
  resolution: 100,      // marching cubes resolution (increased for smoother walls)
  frequency: 0.2,      // spatial frequency of the gyroid (lower for larger models)
  level: 0.0,          // isosurface level (0 is balanced)
  isolation: 0.0,      // marching cubes isolation value
  padding: 2.0,        // mm: keeps the surface away from the MC domain boundary (helps avoid open edges)
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

  // Increased maxPolyCount to 1,000,000 to prevent "cutting away" sections at high resolutions
  const mc = new MarchingCubes(params.resolution, material, false, false, 1000000);
  mc.isolation = params.isolation;
  mc.castShadow = true;
  mc.receiveShadow = true;

  const size = params.resolution;

  // Pad the sampling domain so that the actual boundary surfaces (cylinder wall + caps)
  // do NOT lie exactly on the marching-cubes grid boundary. If an isosurface touches
  // the outermost grid layer, some MC implementations can leave it effectively "uncapped",
  // showing up as open edges in slicers.
  const pad = Math.max(0, Number(params.padding ?? 0));
  const fieldRadius = params.radius + pad;
  const fieldHalfHeight = params.height / 2 + pad;

  // Number of gyroid periods around the circumference (must be integer for seamless wrap)
  const angularPeriods = 6;

  // Fill the scalar field with the gyroid function inside a cylinder
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Physical coordinates (matching MarchingCubes normalized domain, then scaled)
        const nx = (x / (size - 1) - 0.5) * 2;
        const ny = (y / (size - 1) - 0.5) * 2;
        const nz = (z / (size - 1) - 0.5) * 2;

        // Sample over a slightly larger domain (fieldRadius/fieldHalfHeight).
        // The *actual* solid boundary is still defined by params.radius/params.height.
        const px = nx * fieldRadius;
        const pz = nz * fieldRadius;
        const py = ny * fieldHalfHeight;

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
        // Using a slightly lower multiplier (5 instead of 10) helps the marching cubes
        // interpolator produce smoother walls at the boundary.
        val = Math.max(val, boundaryDist * 5);

        mc.setCell(x, y, z, val);
      }
    }
  }

  // Create geometry from the field
  mc.update();

  // Weld near-identical vertices to reduce tiny cracks/"open edges" reports in slicers,
  // and recompute normals after welding.
  // Note: MarchingCubes output can be very dense; keep the tolerance small.
  try {
    const welded = mergeVertices(mc.geometry, 1e-5);
    welded.computeVertexNormals();
    mc.geometry.dispose();
    mc.geometry = welded;
  } catch (e) {
    // If welding fails for any reason, keep the original geometry.
    console.warn('Vertex welding skipped:', e);
  }

  // Scale and position
  mc.scale.set(fieldRadius, fieldHalfHeight, fieldRadius);
  mc.position.y = params.height / 2;

  return mc;
}
