import { Canvas } from './common/components/canvas'
import { Crosshair } from './common/components/crosshair'
import { Instructions } from './common/components/instructions'
import { useLoadingAssets } from './common/hooks/use-loading-assets'
import { Environment, MeshReflectorMaterial, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Vignette, ChromaticAberration, BrightnessContrast, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useFrame, useThree } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { useControls, folder } from 'leva'
import { useTexture } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Player, PlayerControls } from './game/player'
import { Ball } from './game/ball'
import { SphereTool } from './game/sphere-tool'
import { Platforms } from './game/platforms'

const Scene = () => {
    const texture = useTexture('/final-texture.png')
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    
    // Ground texture (50x50)
    const groundTexture = texture.clone()
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping
    groundTexture.repeat.set(12, 12) // 12 repeats to match ground size
    
    // Side walls texture (2x4)
    const sideWallTexture = texture.clone()
    sideWallTexture.wrapS = sideWallTexture.wrapT = THREE.RepeatWrapping
    sideWallTexture.repeat.set(12, 1) // 12 repeats horizontally to match wall length
    
    // Front/back walls texture (50x4)
    const frontWallTexture = texture.clone()
    frontWallTexture.wrapS = frontWallTexture.wrapT = THREE.RepeatWrapping
    frontWallTexture.repeat.set(12, 1) // 12 repeats horizontally to match wall width

    return (
        <RigidBody type="fixed" position={[0, 0, 0]} colliders={false}>
            {/* Ground collider */}
            <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.1, 0]} />
            
            {/* Wall colliders */}
            <CuboidCollider position={[25, 2, 0]} args={[1, 2, 25]} />
            <CuboidCollider position={[-25, 2, 0]} args={[1, 2, 25]} />
            <CuboidCollider position={[0, 2, 25]} args={[25, 2, 1]} />
            <CuboidCollider position={[0, 2, -25]} args={[25, 2, 1]} />
            
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[50, 50]} />
                <MeshReflectorMaterial
                    map={groundTexture}
                    mirror={0}
                    roughness={1}
                    depthScale={0}
                    minDepthThreshold={0.9}
                    maxDepthThreshold={1}
                    metalness={0}
                />
            </mesh>
            
            {/* Border walls */}
            <mesh position={[25, 2, 0]}>
                <boxGeometry args={[2, 4, 50]} />
                <meshStandardMaterial map={sideWallTexture} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[-25, 2, 0]}>
                <boxGeometry args={[2, 4, 50]} />
                <meshStandardMaterial map={sideWallTexture} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 2, 25]}>
                <boxGeometry args={[50, 4, 2]} />
                <meshStandardMaterial map={frontWallTexture} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 2, -25]}>
                <boxGeometry args={[50, 4, 2]} />
                <meshStandardMaterial map={frontWallTexture} side={THREE.DoubleSide} />
            </mesh>
        </RigidBody>
    )
}

export function App() {
    const loading = useLoadingAssets()
    const directionalLightRef = useRef<THREE.DirectionalLight>(null)

    const { 
        walkSpeed,
        runSpeed,
        jumpForce
    } = useControls('Character', {
        walkSpeed: { value: 0.11, min: 0.05, max: 0.2, step: 0.01 },
        runSpeed: { value: 0.15, min: 0.1, max: 0.3, step: 0.01 },
        jumpForce: { value: 0.5, min: 0.3, max: 0.8, step: 0.1 }
    }, {
        collapsed: true,
        hidden: true
    })

    const { 
        fogEnabled,
        fogColor,
        fogNear,
        fogFar,
        ambientIntensity,
        directionalIntensity,
        directionalHeight,
        directionalDistance,
        enablePostProcessing,
        vignetteEnabled,
        vignetteOffset,
        vignetteDarkness,
        chromaticAberrationEnabled,
        chromaticAberrationOffset,
        brightnessContrastEnabled,
        brightness,
        contrast,
        colorGradingEnabled,
        toneMapping,
        toneMappingExposure
    } = useControls({
        fog: folder({
            fogEnabled: true,
            fogColor: '#dbdbdb',
            fogNear: { value: 13, min: 0, max: 50, step: 1 },
            fogFar: { value: 95, min: 0, max: 100, step: 1 }
        }, { collapsed: true, hidden: true }),
        lighting: folder({
            ambientIntensity: { value: 1.3, min: 0, max: 2, step: 0.1 },
            directionalIntensity: { value: 1, min: 0, max: 2, step: 0.1 },
            directionalHeight: { value: 20, min: 5, max: 50, step: 1 },
            directionalDistance: { value: 10, min: 5, max: 30, step: 1 }
        }, { collapsed: true, hidden: true }),
        postProcessing: folder({
            enablePostProcessing: true,
            vignetteEnabled: true,
            vignetteOffset: { value: 0.5, min: 0, max: 1, step: 0.1 },
            vignetteDarkness: { value: 0.5, min: 0, max: 1, step: 0.1 },
            chromaticAberrationEnabled: true,
            chromaticAberrationOffset: { value: 0.0005, min: 0, max: 0.01, step: 0.0001 },
            brightnessContrastEnabled: true,
            brightness: { value: 0.1, min: -1, max: 1, step: 0.1 },
            contrast: { value: 0.1, min: -1, max: 1, step: 0.1 },
            colorGradingEnabled: true,
            toneMapping: { 
                value: THREE.ACESFilmicToneMapping,
                options: {
                    'ACESFilmic': THREE.ACESFilmicToneMapping,
                    'Reinhard': THREE.ReinhardToneMapping,
                    'Cineon': THREE.CineonToneMapping,
                    'Linear': THREE.LinearToneMapping
                }
            },
            toneMappingExposure: { value: 1.2, min: 0, max: 2, step: 0.1 }
        }, { collapsed: true, hidden: true })
    }, {
        collapsed: true,
        hidden: true
    })

    return (
        <>
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '13px',
                fontFamily: 'monospace',
                userSelect: 'none',
                zIndex: 1000
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap'
                }}>
                    WASD to move | SPACE to jump | SHIFT to run
                </div>
            </div>
            
            <div id="ammo-display" style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '14px',
                fontFamily: 'monospace',
                userSelect: 'none',
                zIndex: 1000
            }}>
                AMMO: 50/50
            </div>
            
            <Canvas>
                {fogEnabled && <fog attach="fog" args={[fogColor, fogNear, fogFar]} />}
                <Environment
                    preset="sunset"
                    intensity={1}
                    background
                    blur={0.8}
                    resolution={256}
                />

                <ambientLight intensity={ambientIntensity} />
                <directionalLight
                    castShadow
                    position={[directionalDistance, directionalHeight, directionalDistance]}
                    ref={directionalLightRef}
                    intensity={directionalIntensity}
                    shadow-mapSize={[4096, 4096]}
                    shadow-camera-left={-30}
                    shadow-camera-right={30}
                    shadow-camera-top={30}
                    shadow-camera-bottom={-30}
                    shadow-camera-near={1}
                    shadow-camera-far={150}
                    shadow-bias={-0.0001}
                    shadow-normalBias={0.02}
                />

                <Physics 
                    debug={false} 
                    paused={loading}
                    timeStep={1/60}
                    interpolate={true}
                    gravity={[0, -9.81, 0]}
                    substeps={2}
                    maxStabilizationIterations={10}
                    maxVelocityIterations={10}
                    maxVelocityFriction={1}
                >
                    <PlayerControls>
                        <Player 
                            position={[0, 7, 10]}
                            walkSpeed={walkSpeed}
                            runSpeed={runSpeed}
                            jumpForce={jumpForce}
                            onMove={(position) => {
                                if (directionalLightRef.current) {
                                    const light = directionalLightRef.current
                                    light.position.x = position.x + directionalDistance
                                    light.position.z = position.z + directionalDistance
                                    light.target.position.copy(position)
                                    light.target.updateMatrixWorld()
                                }
                            }}
                        />
                    </PlayerControls>
                    <Platforms />
                    <Ball />

                    <Scene />
                    <SphereTool />
                </Physics>

                <PerspectiveCamera 
                    makeDefault 
                    position={[0, 10, 10]} 
                    rotation={[0, 0, 0]}
                    near={0.1}
                    far={1000}
                />

                {enablePostProcessing && (
                    <EffectComposer>
                        {vignetteEnabled && (
                            <Vignette
                                offset={vignetteOffset}
                                darkness={vignetteDarkness}
                                eskil={false}
                            />
                        )}
                        {chromaticAberrationEnabled && (
                            <ChromaticAberration
                                offset={new THREE.Vector2(chromaticAberrationOffset, chromaticAberrationOffset)}
                                radialModulation={false}
                                modulationOffset={0}
                            />
                        )}
                        {brightnessContrastEnabled && (
                            <BrightnessContrast
                                brightness={brightness}
                                contrast={contrast} 
                            />
                        )}
                        {colorGradingEnabled && (
                            <ToneMapping
                                blendFunction={BlendFunction.NORMAL}
                                mode={toneMapping}
                            />
                        )}
                    </EffectComposer>
                )}
            </Canvas>

            <Crosshair />
        </>
    )
}

export default App