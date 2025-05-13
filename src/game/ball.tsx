import { RigidBody } from '@react-three/rapier'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export const Ball = () => {
    const texture = useTexture('/final-texture.png')
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 1)
    
    return (
        <RigidBody
            colliders="ball"
            restitution={0.5}
            friction={0.3}
            position={[0, 3, -15]}
            linearDamping={0.05}
            angularDamping={0.05}
            mass={0.5}
        >
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[2, 32, 32]} />
                <meshStandardMaterial 
                    map={texture}
                    roughness={0.9}
                    metalness={0}
                />
            </mesh>
        </RigidBody>
    )
}