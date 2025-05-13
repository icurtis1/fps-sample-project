import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'

type BoxDimensions = [width: number, height: number, depth: number]

const boxes = [
    { position: [5, 0, -5] as const, size: [4, 4, 4] as BoxDimensions },
    { position: [-5, 0, -5] as const, size: [4, 4, 4] as BoxDimensions },
    { position: [15, 0, 5] as const, size: [4, 4, 4] as BoxDimensions },
    { position: [-15, 0, 5] as const, size: [4, 4, 4] as BoxDimensions },
    { position: [0, 0, 15] as const, size: [4, 4, 4] as BoxDimensions },
    { position: [10, 0, -15] as const, size: [4, 4, 4] as BoxDimensions },
    { position: [-10, 0, -15] as const, size: [4, 4, 4] as BoxDimensions }
]

export function Platforms() {
    const texture = useTexture('/final-texture.png')
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    
    const platformTexture = texture.clone()
    platformTexture.wrapS = platformTexture.wrapT = THREE.RepeatWrapping
    platformTexture.repeat.set(1, 1) // Scale texture to match each face of the 4x4x4 boxes

    return (
        <group>
            {boxes.map(({ position, size }, index) => (
                <RigidBody 
                    key={index}
                    type="fixed" 
                    position={position}
                    colliders="cuboid"
                    friction={0.1}
                    restitution={0}
                >
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={size} />
                        <meshStandardMaterial 
                            map={platformTexture}
                            side={THREE.DoubleSide}
                            roughness={0.8}
                            metalness={0.1}
                        />
                    </mesh>
                </RigidBody>
            ))}
        </group>
    )
}