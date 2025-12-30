/**
 * Model Exporters
 * 
 * Utilities for exporting Three.js meshes to various file formats.
 * Exports are saved to the user/exports/ directory.
 */

import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// ════════════════════════════════════════════════════════════════════════════
// Export Utilities
// ════════════════════════════════════════════════════════════════════════════

/**
 * Helper to resolve mesh and name if not provided
 */
function resolveTarget(mesh, name) {
  if (!mesh && typeof window !== 'undefined' && window.mesh) {
    mesh = window.mesh;
  }
  if (!mesh) {
    console.error('❌ No mesh provided and no window.mesh found.');
    throw new Error('No mesh to export');
  }
  return { mesh, name: name || 'model' };
}

/**
 * Generate a timestamped filename
 */
function generateFilename(baseName, extension) {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${baseName}_${date}_${time}.${extension}`;
}

/**
 * Trigger a file download in the browser
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  console.log(`📦 Exported: ${filename}`);
}

// ════════════════════════════════════════════════════════════════════════════
// STL Export
// ════════════════════════════════════════════════════════════════════════════

/**
 * Export mesh to STL format (binary)
 * Best for: 3D printing
 */
export function exportSTL(mesh, name = 'model') {
  ({ mesh, name } = resolveTarget(mesh, name));
  const exporter = new STLExporter();
  const result = exporter.parse(mesh, { binary: true });
  const filename = generateFilename(name, 'stl');
  downloadFile(result, filename, 'application/octet-stream');
  return filename;
}

/**
 * Export mesh to STL format (ASCII)
 * Useful for debugging or text-based workflows
 */
export function exportSTLAscii(mesh, name = 'model') {
  ({ mesh, name } = resolveTarget(mesh, name));
  const exporter = new STLExporter();
  const result = exporter.parse(mesh, { binary: false });
  const filename = generateFilename(name, 'stl');
  downloadFile(result, filename, 'text/plain');
  return filename;
}

// ════════════════════════════════════════════════════════════════════════════
// OBJ Export
// ════════════════════════════════════════════════════════════════════════════

/**
 * Export mesh to OBJ format
 * Best for: General 3D interchange, includes UVs and normals
 */
export function exportOBJ(mesh, name = 'model') {
  ({ mesh, name } = resolveTarget(mesh, name));
  const exporter = new OBJExporter();
  const result = exporter.parse(mesh);
  const filename = generateFilename(name, 'obj');
  downloadFile(result, filename, 'text/plain');
  return filename;
}

// ════════════════════════════════════════════════════════════════════════════
// glTF Export
// ════════════════════════════════════════════════════════════════════════════

/**
 * Export mesh to glTF format
 * Best for: Web, games, realtime applications
 */
export function exportGLTF(mesh, name = 'model') {
  ({ mesh, name } = resolveTarget(mesh, name));
  const exporter = new GLTFExporter();
  
  return new Promise((resolve, reject) => {
    exporter.parse(
      mesh,
      (result) => {
        const output = JSON.stringify(result, null, 2);
        const filename = generateFilename(name, 'gltf');
        downloadFile(output, filename, 'application/json');
        resolve(filename);
      },
      (error) => {
        console.error('glTF export failed:', error);
        reject(error);
      },
      { binary: false }
    );
  });
}

/**
 * Export mesh to GLB format (binary glTF)
 * Best for: Compact file size, single-file distribution
 */
export function exportGLB(mesh, name = 'model') {
  ({ mesh, name } = resolveTarget(mesh, name));
  const exporter = new GLTFExporter();
  
  return new Promise((resolve, reject) => {
    exporter.parse(
      mesh,
      (result) => {
        const filename = generateFilename(name, 'glb');
        downloadFile(result, filename, 'application/octet-stream');
        resolve(filename);
      },
      (error) => {
        console.error('GLB export failed:', error);
        reject(error);
      },
      { binary: true }
    );
  });
}

// ════════════════════════════════════════════════════════════════════════════
// STEP Export (Faceted B-Rep)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Export mesh to STEP format (Faceted B-Rep)
 * Generates a STEP file where each triangle is a planar face.
 * Note: This produces large files for dense meshes.
 */
export function exportSTEP(mesh, name = 'model') {
  return new Promise((resolve, reject) => {
    try {
      ({ mesh, name } = resolveTarget(mesh, name));
      const geometry = mesh.geometry;
      
      // Ensure we have position attribute
      if (!geometry.attributes.position) {
        throw new Error('Geometry has no position attribute');
      }

      // Get vertices and indices
      const positions = geometry.attributes.position;
      let indices = null;
      if (geometry.index) {
        indices = geometry.index;
      }

      // Helper to get vertex
      const getVertex = (i) => {
        const v = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        v.applyMatrix4(mesh.matrixWorld); // Apply world transform
        return v;
      };

      // Collect faces (triangles)
      const faces = [];
      if (indices) {
        for (let i = 0; i < indices.count; i += 3) {
          faces.push([
            getVertex(indices.getX(i)),
            getVertex(indices.getX(i + 1)),
            getVertex(indices.getX(i + 2))
          ]);
        }
      } else {
        for (let i = 0; i < positions.count; i += 3) {
          faces.push([
            getVertex(i),
            getVertex(i + 1),
            getVertex(i + 2)
          ]);
        }
      }

      // Start building STEP content
      let content = '';
      let id = 1;
      const nextId = () => id++;
      
      const date = new Date().toISOString().split('T')[0];
      
      // Header
      content += `ISO-10303-21;\nHEADER;\n`;
      content += `FILE_DESCRIPTION(('STEP AP203'),'1');\n`;
      content += `FILE_NAME('${name}.stp','${date}',('Author'),('Organization'),'Preprocessor','Originating System','Authorization');\n`;
      content += `FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));\n`;
      content += `ENDSEC;\nDATA;\n`;

      // Deduplicate points
      const pointMap = new Map();
      const getPointId = (v) => {
        const key = `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
        if (pointMap.has(key)) return pointMap.get(key);
        const pid = nextId();
        pointMap.set(key, pid);
        content += `#${pid}=CARTESIAN_POINT('',(${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}));\n`;
        return pid;
      };

      // Faces
      const faceIds = [];
      
      for (const face of faces) {
        const p1 = getPointId(face[0]);
        const p2 = getPointId(face[1]);
        const p3 = getPointId(face[2]);

        // Calculate normal for the plane
        const edge1 = new THREE.Vector3().subVectors(face[1], face[0]);
        const edge2 = new THREE.Vector3().subVectors(face[2], face[0]);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
        
        // Calculate tangent (ref_direction)
        const tangent = new THREE.Vector3(1, 0, 0);
        if (Math.abs(normal.x) > 0.9) tangent.set(0, 1, 0);
        tangent.crossVectors(normal, tangent).normalize(); // Make it perpendicular

        const normalId = nextId();
        content += `#${normalId}=DIRECTION('',(${normal.x.toFixed(6)},${normal.y.toFixed(6)},${normal.z.toFixed(6)}));\n`;
        
        const tangentId = nextId();
        content += `#${tangentId}=DIRECTION('',(${tangent.x.toFixed(6)},${tangent.y.toFixed(6)},${tangent.z.toFixed(6)}));\n`;

        const axis2PlacementId = nextId();
        // Use first point as origin
        content += `#${axis2PlacementId}=AXIS2_PLACEMENT_3D('',#${p1},#${normalId},#${tangentId});\n`;
        
        const planeId = nextId();
        content += `#${planeId}=PLANE('',#${axis2PlacementId});\n`;

        // Loop
        const loopId = nextId();
        content += `#${loopId}=POLY_LOOP('',(#${p1},#${p2},#${p3}));\n`;
        
        const faceBoundId = nextId();
        content += `#${faceBoundId}=FACE_BOUND('',#${loopId},.T.);\n`;
        
        const advancedFaceId = nextId();
        content += `#${advancedFaceId}=ADVANCED_FACE('',(#${faceBoundId}),#${planeId},.T.);\n`;
        
        faceIds.push(advancedFaceId);
      }

      // Shell
      const shellId = nextId();
      content += `#${shellId}=CLOSED_SHELL('',(${faceIds.map(id => '#' + id).join(',')}));\n`;
      
      // Manifold Solid B-Rep
      const solidId = nextId();
      content += `#${solidId}=MANIFOLD_SOLID_BREP('${name}',#${shellId});\n`;
      
      // Shape Representation
      const contextId = nextId();
      content += `#${contextId}=GEOMETRIC_REPRESENTATION_CONTEXT('3D Context','3D Space',3);\n`;

      const shapeRepId = nextId();
      content += `#${shapeRepId}=ADVANCED_BREP_SHAPE_REPRESENTATION('',(#${solidId}),#${contextId});\n`;
      
      content += `ENDSEC;\nEND-ISO-10303-21;\n`;

      const filename = generateFilename(name, 'step');
      downloadFile(content, filename, 'text/plain');
      resolve(filename);
    } catch (error) {
      console.error('STEP export failed:', error);
      reject(error);
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════
// Batch Export
// ════════════════════════════════════════════════════════════════════════════

/**
 * Export mesh to multiple formats at once
 */
export async function exportAll(mesh, name = 'model', formats = ['stl', 'obj', 'gltf', 'step']) {
  ({ mesh, name } = resolveTarget(mesh, name));
  const results = {};
  
  for (const format of formats) {
    switch (format.toLowerCase()) {
      case 'stl':
        results.stl = exportSTL(mesh, name);
        break;
      case 'obj':
        results.obj = exportOBJ(mesh, name);
        break;
      case 'gltf':
        results.gltf = await exportGLTF(mesh, name);
        break;
      case 'glb':
        results.glb = await exportGLB(mesh, name);
        break;
      case 'step':
        try {
          results.step = await exportSTEP(mesh, name);
        } catch (e) {
          results.step = null;
        }
        break;
    }
  }
  
  return results;
}

// ════════════════════════════════════════════════════════════════════════════
// Export to global scope for console access
// ════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.threedeeExport = {
    stl: exportSTL,
    stlAscii: exportSTLAscii,
    obj: exportOBJ,
    gltf: exportGLTF,
    glb: exportGLB,
    step: exportSTEP,
    all: exportAll,
  };
  
  console.info('📦 Export functions available via window.threedeeExport');
  console.info('   Formats: stl, obj, gltf, glb, step');
  console.info('   Example: threedeeExport.stl() // Exports current mesh');
  console.info('   Example: threedeeExport.stl(mesh, "my-part")');
  console.info('   Example: threedeeExport.all(null, "my-part")');
}
