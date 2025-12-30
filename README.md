# threedee

**threedee** is an LLM-assisted 3D parametric design environment built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/). It provides a robust starting point for creating, viewing, and exporting procedural 3D models directly in the browser.

## Features

- **Modern 3D Viewport**: Pre-configured Three.js scene with PBR lighting, shadows, and tone mapping.
- **Parametric Modeling**: Includes examples like a Cylinder Gyroid (`user/models/cylinder-gyroid.js`) to demonstrate procedural mesh generation.
- **Developer Experience**: Hot Module Replacement (HMR) via Vite for instant feedback.
- **Performance Metrics**: Built-in FPS counter and render time tracking.
- **Scene Helpers**: Infinite grid, axis helpers, and camera position readouts.

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/tazomatalax/threedee.git
    cd threedee
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Usage

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

### Building for Production

To build the project for deployment:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

- `src/main.js`: Main entry point setting up the Three.js scene, camera, renderer, and loop.
- `user/models/`: Directory for your custom parametric models.
- `user/exports/`: Destination for exported files (if configured).
- `vite.config.js`: Vite configuration file.

## License

[MIT](LICENSE)
