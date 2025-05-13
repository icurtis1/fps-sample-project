# FPS Character Controller Demo

A modern first-person shooter character controller built with React, Three.js, and Rapier physics. Features smooth movement mechanics, gamepad support, and interactive physics-based gameplay.

[Live Demo](https://fps-sample-project.netlify.app)

<img src="./public/demo.gif" alt="Demo" width="800" />

## Features

- 🎮 Full gamepad support with customizable controls
- 🏃‍♂️ Smooth character movement with walk/run states
- 🎯 Physics-based projectile system
- 🌈 Rainbow-colored sphere projectiles
- 🏃‍♂️ Sprint mechanics with FOV changes
- 🎨 Post-processing effects (chromatic aberration, vignette)
- 🌍 Dynamic environment with physics interactions
- 🔫 Ammo system with reload mechanics

## Controls

- **WASD** - Movement
- **Mouse** - Look around
- **Space** - Jump
- **Shift** - Sprint
- **Left Click** - Shoot
- **Mouse Lock** - Automatic when clicking in game window

### Gamepad Support
- **Left Stick** - Movement
- **Right Stick** - Look around
- **A Button** - Jump
- **L3 (Left Stick Press)** - Sprint
- **RT (Right Trigger)** - Shoot

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fps-character-controller.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Tech Stack

- ⚛️ React 18
- 🎨 Three.js
- 🎮 React Three Fiber
- 🔋 Rapier Physics
- 🎛️ Leva for debug controls
- 📦 Vite for bundling
- 💅 TailwindCSS for styling
- 🎮 Gamepad API integration

## Project Structure

```
src/
├── common/         # Shared components and hooks
├── game/          # Game-specific components
│   ├── player.tsx    # Player controller
│   ├── ball.tsx      # Projectile system
│   └── platforms.tsx # Level geometry
└── App.tsx        # Main application component
```

## Performance Considerations

- Physics interpolation for smooth movement
- Optimized collision detection
- Efficient post-processing pipeline
- Continuous collision detection (CCD) for projectiles
  
## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Three.js for 3D rendering
- React Three Fiber for React integration
- Rapier for physics simulation
- Leva for debug controls