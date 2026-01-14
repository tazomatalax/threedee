# threedee: Agent Guide

This document explains the `threedee` repository structure and workflow for AI agents.

## Project Overview

`threedee` is a browser-based 3D parametric design environment built with **Three.js** and **Vite**. It is designed for creating, viewing, and exporting procedural 3D models.

## Key Files & Directories

- **`src/main.js`**: The main entry point. It sets up the Three.js scene (camera, lights, renderer, loop) and imports the active model. **This is where you integrate new models.**
- **`user/models/`**: The directory where all custom parametric model files reside.
- **`user/exports/`**: Destination for exported files.
- **`vite.config.js`**: Configuration for the Vite build tool.

## Creating a New Parametric Model

To create a new 3D model, create a new JavaScript file in `user/models/` (e.g., `user/models/my-new-part.js`).

**Models are automatically discovered!** Any `.js` file in `user/models/` will automatically appear in the UI's model selector dropdown. The filename (without `.js`) becomes the model ID, converted to Title Case for display.

A standard model file **must** export the following:

1.  **`createMesh(params)`**: A function that takes parameters and returns a `THREE.Mesh`.
    - It should handle geometry creation (or call a helper like `createGeometry`).
    - It should handle material creation (or call a helper like `createMaterial`).
    - It should set `castShadow` and `receiveShadow` to `true`.
2.  **`parameters`** (Optional but recommended): An object defining the default values for the model (dimensions, colors, etc.).
3.  **`metadata`** (Optional): An object with name, description, author, etc.

### Example Template

```javascript
import * as THREE from 'three';

export const parameters = {
  size: 10,
  color: 0xff0000,
};

export function createMesh(userParams = {}) {
  const params = { ...parameters, ...userParams };
  const geometry = new THREE.BoxGeometry(params.size, params.size, params.size);
  const material = new THREE.MeshStandardMaterial({ color: params.color });
  const mesh = new THREE.Mesh(geometry, material);
  
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = params.size / 2; // Sit on ground
  
  return mesh;
}
```

## Integrating a Model

**Models are automatically integrated!** When you create a new `.js` file in `user/models/`:

1. The file is auto-discovered via Vite's glob import
2. It appears in the **MODEL** dropdown (top-left of viewport)
3. The user can select it to view and export

### Viewing Your Model

1. Save the model file in `user/models/`
2. Refresh the browser (or it may hot-reload automatically)
3. Select your model from the **MODEL** dropdown in the UI
4. The model loads instantly with updated dimensions displayed

### Console Access

You can also load models programmatically from the browser console:

```javascript
// Load by model ID (filename without .js)
await loadModel('my-new-part');

// List all available models
console.log(modelList);  // [{id: 'example-part', name: 'Example Part'}, ...]

// Access current mesh
window.mesh;
```

## Exporting Models

Models can be exported to various formats using the global `threedeeExport` object in the browser console or programmatically.

### Available Export Formats

- **STL (Binary)**: `threedeeExport.stl(mesh, "filename")` — Best for 3D printing, compact binary format
- **STL (ASCII)**: `threedeeExport.stlAscii(mesh, "filename")` — Text-based STL, human-readable but larger
- **OBJ**: `threedeeExport.obj(mesh, "filename")` — General 3D interchange format with UVs and normals
- **glTF**: `threedeeExport.gltf(mesh, "filename")` — JSON-based 3D format for web and AR
- **GLB**: `threedeeExport.glb(mesh, "filename")` — Binary glTF, compact single-file format
- **STEP**: `threedeeExport.step(mesh, "filename")` — CAD interchange format (Faceted B-Rep representation)

### Batch Export

Export to multiple formats at once:

```javascript
threedeeExport.all(mesh, "my-model")
// Exports: STL, OBJ, glTF, and STEP files simultaneously
```

Custom format list:

```javascript
threedeeExport.all(mesh, "my-model", ['stl', 'step', 'obj'])
```

### Workflow for AI Agents

When asked to export a 3D model:

1. **Identify the mesh** — The active mesh is available as `window.mesh` in the browser console
2. **Choose export format** — Select based on use case (STL for 3D printing, OBJ for interchange, etc.)
3. **Call export function** — Execute the appropriate export command
4. **File download** — Exports trigger automatic browser downloads with timestamped filenames

Exports are logged to the console with confirmation messages. Filenames are automatically timestamped (e.g., `my-model_2025-12-30_23-02-15.stl`).

## Development Workflow

1.  **Install Dependencies**: `npm install`
2.  **Start Server**: `npm run dev`
3.  **View**: Open the URL provided (usually `http://localhost:5173`).
4.  **Edit**: Changes to files in `src/` or `user/models/` will trigger Hot Module Replacement (HMR) and update the browser instantly.

## Conventions

- Use **ES Modules** (`import`/`export`).
- Use the **`THREE`** namespace for Three.js objects.
- Ensure models are centered or positioned logically (e.g., sitting on the ground plane at `y = 0` or `y = height/2`).
- Keep model logic isolated in `user/models/` files; keep scene logic in `src/main.js`.
