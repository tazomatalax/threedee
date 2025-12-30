# User Models Directory

This folder contains your 3D parametric designs and exported model files.

## Structure

```
user/
├── models/          # Source model definitions (JavaScript/TypeScript)
│   └── *.js         # Parametric model code
├── exports/         # Generated output files
│   ├── *.stl        # STL mesh exports (3D printing)
│   ├── *.obj        # OBJ mesh exports (general purpose)
│   ├── *.gltf       # glTF exports (web/realtime)
│   └── *.step       # STEP exports (CAD interchange) [future]
└── README.md
```

## File Formats

| Format | Use Case | Status |
|--------|----------|--------|
| **STL** | 3D printing, rapid prototyping | ✅ Supported |
| **OBJ** | General 3D interchange, textures | ✅ Supported |
| **glTF** | Web, games, realtime rendering | ✅ Supported |
| **STEP** | CAD interchange, manufacturing | 🔜 Planned |

## Creating a Model

1. Create a new `.js` file in `models/`
2. Define your geometry using Three.js or parametric functions
3. Export to your desired format

Example model file:
```javascript
// models/my-bracket.js
export const parameters = {
  width: 50,      // mm
  height: 30,     // mm
  thickness: 5,   // mm
  holeRadius: 3,  // mm
};

export function createGeometry(params) {
  // Your parametric geometry here
}
```

## Exporting

Exports are saved to the `exports/` folder with timestamps:
- `my-bracket_2025-01-15_v1.stl`
- `my-bracket_2025-01-15_v1.obj`

## Notes

- STEP file support requires OpenCascade integration (planned)
- For manufacturing, STEP is preferred over mesh formats
- STL files are in millimeters by default
