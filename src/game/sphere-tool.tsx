import { useThree } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useEffect, useState, useRef } from 'react'
import { useGamepad } from '../common/hooks/use-gamepad'
import * as THREE from 'three'

const RAINBOW_COLORS = [
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#0000FF', // Blue
    '#4B0082', // Indigo
    '#9400D3'  // Violet
]

const SHOOT_FORCE = 45
const SPHERE_OFFSET = {
    x: 0.12,  // Slightly to the right
    y: -0.27, // Lower below crosshair
    z: -1.7  // Offset even further back
}

type SphereProps = {
    position: [number, number, number]
    direction: [number, number, number]
    color: string
    radius: number
}

const Sphere = ({ position, direction, color, radius }: SphereProps) => {
    return (
        <RigidBody
            position={position}
            friction={1}
            angularDamping={0.2}
            linearDamping={0.1}
            restitution={0.5}
            colliders="ball"
            mass={1}
            ccd={true}
            linearVelocity={[direction[0] * SHOOT_FORCE, direction[1] * SHOOT_FORCE, direction[2] * SHOOT_FORCE]}
        >
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[radius, 32, 32]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </RigidBody>
    )
}

export const SphereTool = () => {
    const sphereRadius = 0.11
    const MAX_AMMO = 50

    const camera = useThree((s) => s.camera)
    const [spheres, setSpheres] = useState<SphereProps[]>([])
    const [ammoCount, setAmmoCount] = useState(MAX_AMMO)
    const [isReloading, setIsReloading] = useState(false)
    const shootingInterval = useRef<number>()
    const isPointerDown = useRef(false)
    const gamepadState = useGamepad()

    const reload = () => {
        if (isReloading) return
        
        setIsReloading(true)
        // Simulate reload time
        setTimeout(() => {
            setAmmoCount(MAX_AMMO)
            setIsReloading(false)
        }, 1000)
    }

    const shootSphere = () => {
        const pointerLocked = document.pointerLockElement !== null || gamepadState.connected
        if (!pointerLocked || isReloading || ammoCount <= 0) return

        setAmmoCount(prev => {
            const newCount = prev - 1
            if (newCount <= 0) {
                reload()
            }
            return newCount
        })
        
        const direction = camera.getWorldDirection(new THREE.Vector3())
        
        // Create offset vector in camera's local space
        const offset = new THREE.Vector3(SPHERE_OFFSET.x, SPHERE_OFFSET.y, SPHERE_OFFSET.z)
        offset.applyQuaternion(camera.quaternion)
        
        const position = camera.position.clone().add(offset)
        
        // Adjust direction slightly upward to compensate for the lower spawn point
        direction.normalize() // Keep direction exactly as camera is pointing

        const randomColor = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)]

        setSpheres(prev => [...prev, {
            position: position.toArray() as [number, number, number],
            direction: direction.toArray() as [number, number, number],
            color: randomColor,
            radius: sphereRadius
        }])
    }

    const startShooting = () => {
        isPointerDown.current = true
        shootSphere()
        shootingInterval.current = window.setInterval(shootSphere, 80)
    }

    const stopShooting = () => {
        isPointerDown.current = false
        if (shootingInterval.current) {
            clearInterval(shootingInterval.current)
        }
    }

    useEffect(() => {
        window.addEventListener('pointerdown', startShooting)
        window.addEventListener('pointerup', stopShooting)
        
        // Handle gamepad shooting
        if (gamepadState.buttons.shoot) {
            if (!isPointerDown.current) {
                startShooting()
            }
        } else if (isPointerDown.current) {
            stopShooting()
        }
        
        return () => {
            window.removeEventListener('pointerdown', startShooting)
            window.removeEventListener('pointerup', stopShooting)
        }
    }, [camera, gamepadState.buttons.shoot])

    // Show ammo counter
    useEffect(() => {
        const ammoDisplay = document.getElementById('ammo-display')
        if (ammoDisplay) {
            ammoDisplay.textContent = isReloading ? 'RELOADING...' : `AMMO: ${ammoCount}/${MAX_AMMO}`
        }
    }, [ammoCount, isReloading])

    return (
        <group>
            {spheres.map((props, index) => (
                <Sphere key={index} {...props} />
            ))}
        </group>
    )
}