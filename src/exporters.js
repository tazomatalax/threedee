/**
 * Model Exporters
 * 
 * Utilities for exporting Three.js meshes to various file formats.
 * Exports are saved to the user/exports/ directory.
 */

import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// ════════════════════════════════════════════════════════════════════════════
// Export Utilities
// ════════════════════════════════════════════════════════════════════════════

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
// STEP Export (Placeholder for future OpenCascade integration)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Export to STEP format
 * NOTE: STEP export requires OpenCascade.js integration
 * This is a placeholder for future implementation
 * 
 * STEP files preserve:
 * - Exact geometry (NURBS, not mesh)
 * - Feature history (for some CAD systems)
 * - Manufacturing-ready precision
 */
export function exportSTEP(mesh, name = 'model') {
  console.warn('⚠️ STEP export requires OpenCascade integration (coming soon)');
  console.info('💡 For now, use STL or OBJ for manufacturing workflows');
  
  // Future implementation will use opencascade.js
  // See: https://github.com/nicholasmhughes/opencascade.js
  
  return Promise.reject(new Error('STEP export not yet implemented'));
}

// ════════════════════════════════════════════════════════════════════════════
// Batch Export
// ════════════════════════════════════════════════════════════════════════════

/**
 * Export mesh to multiple formats at once
 */
export async function exportAll(mesh, name = 'model', formats = ['stl', 'obj', 'gltf']) {
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
  console.info('   Example: threedeeExport.stl(mesh, "my-part")');
}
