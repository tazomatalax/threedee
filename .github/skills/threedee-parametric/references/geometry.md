# Advanced Geometry Reference

## Table of Contents
1. [Primitive Geometries](#primitive-geometries)
2. [Parametric Curves & Surfaces](#parametric-curves--surfaces)
3. [CSG Operations](#csg-operations)
4. [Extrusions & Lathes](#extrusions--lathes)
5. [BufferGeometry Manipulation](#buffergeometry-manipulation)

---

## Primitive Geometries

All primitives available in Three.js:

```javascript
// Boxes
new THREE.BoxGeometry(width, height, depth, widthSegs, heightSegs, depthSegs)

// Spheres
new THREE.SphereGeometry(radius, widthSegs, heightSegs, phiStart, phiLength, thetaStart, thetaLength)

// Cylinders & Cones
new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegs, heightSegs, openEnded)
new THREE.ConeGeometry(radius, height, radialSegs, heightSegs, openEnded)

// Torus
new THREE.TorusGeometry(radius, tube, radialSegs, tubularSegs, arc)
new THREE.TorusKnotGeometry(radius, tube, tubularSegs, radialSegs, p, q)

// Planes
new THREE.PlaneGeometry(width, height, widthSegs, heightSegs)
new THREE.CircleGeometry(radius, segments, thetaStart, thetaLength)
new THREE.RingGeometry(innerRadius, outerRadius, thetaSegs, phiSegs)

// Polyhedra
new THREE.TetrahedronGeometry(radius, detail)
new THREE.OctahedronGeometry(radius, detail)
new THREE.DodecahedronGeometry(radius, detail)
new THREE.IcosahedronGeometry(radius, detail)
```

---

## Parametric Curves & Surfaces

### Shape + ExtrudeGeometry

```javascript
// Define a 2D shape
const shape = new THREE.Shape();
shape.moveTo(0, 0);
shape.lineTo(0, 10);
shape.lineTo(10, 10);
shape.lineTo(10, 0);
shape.lineTo(0, 0);

// Add holes
const hole = new THREE.Path();
hole.absarc(5, 5, 2, 0, Math.PI * 2, false);
shape.holes.push(hole);

// Extrude settings
const extrudeSettings = {
  depth: 5,
  bevelEnabled: true,
  bevelThickness: 0.5,
  bevelSize: 0.5,
  bevelSegments: 3,
  curveSegments: 12,
};

const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
```

### LatheGeometry

```javascript
// Profile points (x, y) - rotated around Y axis
const points = [];
for (let i = 0; i < 10; i++) {
  points.push(new THREE.Vector2(Math.sin(i * 0.2) * 3 + 3, (i - 5) * 0.8));
}

const geometry = new THREE.LatheGeometry(points, 32); // points, segments
```

### TubeGeometry (follow a curve)

```javascript
class CustomCurve extends THREE.Curve {
  getPoint(t) {
    const tx = t * 3 - 1.5;
    const ty = Math.sin(2 * Math.PI * t);
    const tz = Math.cos(2 * Math.PI * t);
    return new THREE.Vector3(tx, ty, tz);
  }
}

const path = new CustomCurve();
const geometry = new THREE.TubeGeometry(path, 64, 0.2, 8, false);
```

---

## CSG Operations

For Boolean operations (union, subtract, intersect), use three-bvh-csg:

```javascript
import { SUBTRACTION, ADDITION, INTERSECTION, Brush, Evaluator } from 'three-bvh-csg';

const evaluator = new Evaluator();

// Create brushes from geometry
const boxBrush = new Brush(new THREE.BoxGeometry(2, 2, 2));
const sphereBrush = new Brush(new THREE.SphereGeometry(1.3, 32, 32));

// Perform operations
const result = evaluator.evaluate(boxBrush, sphereBrush, SUBTRACTION);
// Returns a new mesh with the sphere cut out of the box

// Operations:
// SUBTRACTION - A minus B
// ADDITION - A plus B (union)
// INTERSECTION - Only overlapping parts
```

Install: `npm install three-bvh-csg`

---

## Extrusions & Lathes

### Swept profile along path

```javascript
// Create a path
const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-10, 0, 10),
  new THREE.Vector3(-5, 5, 5),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(5, -5, 5),
  new THREE.Vector3(10, 0, 10)
]);

// Tube along path
const geometry = new THREE.TubeGeometry(path, 100, 0.5, 8, false);
```

### Rounded rectangle shape

```javascript
function roundedRect(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  
  return shape;
}
```

---

## BufferGeometry Manipulation

### Direct vertex access

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const positions = geometry.attributes.position;

// Modify vertices
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const y = positions.getY(i);
  const z = positions.getZ(i);
  
  // Example: add noise
  positions.setY(i, y + Math.random() * 0.1);
}

positions.needsUpdate = true;
geometry.computeVertexNormals();
```

### Merging geometries

```javascript
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const box = new THREE.BoxGeometry(1, 1, 1);
const sphere = new THREE.SphereGeometry(0.5, 16, 16);

// Position sphere
sphere.translate(2, 0, 0);

// Merge into single geometry
const merged = mergeGeometries([box, sphere], false);
```

### Clone and transform

```javascript
const original = new THREE.BoxGeometry(1, 1, 1);
const clone = original.clone();

// Transform the clone
clone.translate(5, 0, 0);
clone.rotateY(Math.PI / 4);
clone.scale(2, 1, 1);
```

---

## Performance Tips

- Use `geometry.computeBoundingBox()` and `geometry.computeBoundingSphere()` for culling
- For static scenes, use `geometry.dispose()` after adding to mesh
- Prefer `InstancedMesh` for many identical objects
- Use lower segment counts during editing, increase for final export
