import Rapier from '@dimforge/rapier3d-compat'
import { KeyboardControls, PerspectiveCamera, PointerLockControls, useKeyboardControls, useGLTF, useAnimations } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, RigidBodyProps, useBeforePhysicsStep, useRapier } from '@react-three/rapier'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useGamepad } from '../common/hooks/use-gamepad'
import { useControls } from 'leva'
import * as THREE from 'three'
import { Component, Entity, EntityType } from './ecs'

const _direction = new THREE.Vector3()
const _frontVector = new THREE.Vector3()
const _sideVector = new THREE.Vector3()
const _characterLinvel = new THREE.Vector3()
const _characterTranslation = new THREE.Vector3()
const _cameraWorldDirection = new THREE.Vector3()
const _cameraPosition = new THREE.Vector3()

const normalFov = 90
const sprintFov = 100

const characterShapeOffset = 0.1
const autoStepMaxHeight = 2
const autoStepMinWidth = 0.05
const accelerationTimeAirborne = 0.2
const accelerationTimeGrounded = 0.025
const timeToJumpApex = 2
const maxJumpHeight = 0.5
const minJumpHeight = 0.2
const velocityXZSmoothing = 0.1
const velocityXZMin = 0.0001
const jumpGravity = -(2 * maxJumpHeight) / Math.pow(timeToJumpApex, 2)
const maxJumpVelocity = Math.abs(jumpGravity) * timeToJumpApex
const minJumpVelocity = Math.sqrt(2 * Math.abs(jumpGravity) * minJumpHeight)

const up = new THREE.Vector3(0, 1, 0)

export type PlayerControls = {
    children: React.ReactNode
}

type PlayerProps = RigidBodyProps & {
    onMove?: (position: THREE.Vector3) => void
    walkSpeed?: number
    runSpeed?: number
    jumpForce?: number
}

export const Player = ({ onMove, walkSpeed = 0.1, runSpeed = 0.15, jumpForce = 0.5, ...props }: PlayerProps) => {
    const playerRef = useRef<EntityType>(null!)
    const gltf = useGLTF('/fps.glb')
    const { actions } = useAnimations(gltf.animations, gltf.scene)
    
    const { x, y, z } = useControls('Arms Position', {
        x: { value: 0.1, min: -1, max: 1, step: 0.1 },
        y: { value: -0.62, min: -1, max: 1, step: 0.1 },
        z: { value: -0.2, min: -2, max: 0, step: 0.1 }
    }, {
        collapsed: true,
        order: 998,
        hidden: true
    })

    const rapier = useRapier()
    const camera = useThree((state) => state.camera)
    const clock = useThree((state) => state.clock)

    const characterController = useRef<Rapier.KinematicCharacterController>(null!)

    const [, getKeyboardControls] = useKeyboardControls()
    const gamepadState = useGamepad()

    const horizontalVelocity = useRef({ x: 0, z: 0 })
    const jumpVelocity = useRef(0)
    const holdingJump = useRef(false)
    const jumpTime = useRef(0)
    const jumping = useRef(false)

    // Animation states
    const [isWalking, setIsWalking] = useState(false)
    const [isRunning, setIsRunning] = useState(false)

    useEffect(() => {
        const { world } = rapier

        characterController.current = world.createCharacterController(characterShapeOffset)
        characterController.current.enableAutostep(autoStepMaxHeight, autoStepMinWidth, true)
        characterController.current.setSlideEnabled(true)
        characterController.current.enableSnapToGround(0.1)
        characterController.current.setApplyImpulsesToDynamicBodies(true)

        // Stop all animations initially
        Object.values(actions).forEach(action => action?.stop())

        return () => {
            world.removeCharacterController(characterController.current)
            characterController.current = null!
        }
    }, [])

    // Handle shooting animation
    useEffect(() => {
        const handleShoot = () => {
            if (document.pointerLockElement) {
                const fireAction = actions['Rig|Saiga_Fire']
                if (fireAction) {
                    fireAction.setLoop(THREE.LoopOnce, 1)
                    fireAction.reset().play()
                }
            }
        }

        window.addEventListener('pointerdown', handleShoot)
        return () => window.removeEventListener('pointerdown', handleShoot)
    }, [actions])

    useBeforePhysicsStep(() => {
        const characterRigidBody = playerRef.current.rigidBody

        if (!characterRigidBody) return

        const characterCollider = characterRigidBody.collider(0)

        const { forward, backward, left, right, jump, sprint } = getKeyboardControls() as KeyControls
        
        // Combine keyboard and gamepad input
        const moveForward = forward || (gamepadState.leftStick.y < 0)
        const moveBackward = backward || (gamepadState.leftStick.y > 0)
        const moveLeft = left || (gamepadState.leftStick.x < 0)
        const moveRight = right || (gamepadState.leftStick.x > 0)
        const isJumping = jump || gamepadState.buttons.jump
        const isSprinting = sprint || gamepadState.buttons.leftStickPress

        const speed = walkSpeed * (isSprinting ? runSpeed / walkSpeed : 1)
        
        // Update movement state for animations
        const isMoving = moveForward || moveBackward || moveLeft || moveRight
        setIsWalking(isMoving && !isSprinting)
        setIsRunning(isMoving && isSprinting)

        const grounded = characterController.current.computedGrounded()

        // x and z movement
        _frontVector.set(0, 0, Number(moveBackward) - Number(moveForward))
        _sideVector.set(Number(moveLeft) - Number(moveRight), 0, 0)

        const cameraWorldDirection = camera.getWorldDirection(_cameraWorldDirection)
        const cameraYaw = Math.atan2(cameraWorldDirection.x, cameraWorldDirection.z)

        _direction.subVectors(_frontVector, _sideVector).normalize().multiplyScalar(speed)
        _direction.applyAxisAngle(up, cameraYaw).multiplyScalar(-1)

        const horizontalVelocitySmoothing = velocityXZSmoothing * (grounded ? accelerationTimeGrounded : accelerationTimeAirborne)
        const horizontalVelocityLerpFactor = 1 - Math.pow(horizontalVelocitySmoothing, 0.116)
        horizontalVelocity.current = {
            x: THREE.MathUtils.lerp(horizontalVelocity.current.x, _direction.x, horizontalVelocityLerpFactor),
            z: THREE.MathUtils.lerp(horizontalVelocity.current.z, _direction.z, horizontalVelocityLerpFactor),
        }

        if (Math.abs(horizontalVelocity.current.x) < velocityXZMin) {
            horizontalVelocity.current.x = 0
        }
        if (Math.abs(horizontalVelocity.current.z) < velocityXZMin) {
            horizontalVelocity.current.z = 0
        }

        // jumping and gravity
        if (isJumping && grounded) {
            jumping.current = true
            holdingJump.current = true
            jumpTime.current = clock.elapsedTime
            jumpVelocity.current = maxJumpVelocity * (jumpForce / 0.5) // Scale jump velocity based on jumpForce
        }

        if (!isJumping && grounded) {
            jumping.current = false
        }

        if (jumping.current && holdingJump.current && !isJumping) {
            if (jumpVelocity.current > minJumpVelocity) {
                jumpVelocity.current = minJumpVelocity
            }
        }

        if (!isJumping && grounded) {
            jumpVelocity.current = 0
        } else {
            jumpVelocity.current += jumpGravity * 0.116
        }

        holdingJump.current = isJumping

        // compute movement direction
        const movementDirection = {
            x: horizontalVelocity.current.x,
            y: jumpVelocity.current,
            z: horizontalVelocity.current.z,
        }

        // compute collider movement and update rigid body
        characterController.current.computeColliderMovement(characterCollider, movementDirection)

        const translation = characterRigidBody.translation()
        const newPosition = _characterTranslation.copy(translation as THREE.Vector3)
        const movement = characterController.current.computedMovement()
        newPosition.add(movement)

        characterRigidBody.setNextKinematicTranslation(newPosition)
    })

    useFrame((_, delta) => {
        const characterRigidBody = playerRef.current.rigidBody
        if (!characterRigidBody) {
            return
        }

        _characterLinvel.copy(characterRigidBody.linvel() as THREE.Vector3)
        const currentSpeed = _characterLinvel.length()

        const { forward, backward, left, right } = getKeyboardControls() as KeyControls
        const isMoving = forward || backward || left || right
        const isSprinting = getKeyboardControls().sprint || gamepadState.buttons.leftStickPress

        const translation = characterRigidBody.translation()
        onMove?.(translation as THREE.Vector3)
        const cameraPosition = _cameraPosition.set(translation.x, translation.y + 1, translation.z)
        const cameraEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
        
        // Different sensitivities for horizontal and vertical aiming
        const CAMERA_SENSITIVITY_X = 0.04
        const CAMERA_SENSITIVITY_Y = 0.03
        
        // Apply gamepad right stick for camera rotation
        if (gamepadState.connected && (Math.abs(gamepadState.rightStick.x) > 0 || Math.abs(gamepadState.rightStick.y) > 0)) {
            // Update Euler angles
            cameraEuler.y -= gamepadState.rightStick.x * CAMERA_SENSITIVITY_X
            cameraEuler.x = THREE.MathUtils.clamp(
                cameraEuler.x - gamepadState.rightStick.y * CAMERA_SENSITIVITY_Y,
                -Math.PI / 2,
                Math.PI / 2
            )
            
            // Apply the new rotation while maintaining up vector
            camera.quaternion.setFromEuler(cameraEuler)
        }
        
        camera.position.lerp(cameraPosition, delta * 30)
        
        // FOV change for sprint
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, isSprinting && currentSpeed > 0.1 ? sprintFov : normalFov, 10 * delta)
            camera.updateProjectionMatrix()
        }
    })
    
    // Handle movement animations
    useEffect(() => {
        const walkAction = actions['Rig|Saiga_Walk']
        const runAction = actions['Rig|Saiga_Run']

        if (isRunning) {
            walkAction?.stop()
            runAction?.play()
        } else if (isWalking) {
            runAction?.stop()
            walkAction?.play()
        } else {
            walkAction?.stop()
            runAction?.stop()
        }
    }, [isWalking, isRunning, actions])

    return (
        <>
            <Entity isPlayer ref={playerRef}>
                <Component name="rigidBody">
                    <RigidBody
                        {...props}
                        colliders={false}
                        mass={1}
                        type="kinematicPosition"
                        enabledRotations={[false, false, false]}
                    >
                        <object3D name="player" />
                        <CapsuleCollider args={[1, 0.5]} />
                    </RigidBody>
                </Component>
            </Entity>
            <primitive 
                object={gltf.scene} 
                position={[x, y, z]}
                rotation={[0, Math.PI, 0]}
                scale={0.7}
                parent={camera}
            />
        </>
    )
}

type KeyControls = {
    forward: boolean
    backward: boolean
    left: boolean
    right: boolean
    sprint: boolean
    jump: boolean
}

const controls = [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'sprint', keys: ['Shift'] },
]

export const PlayerControls = ({ children }: PlayerControls) => {
    return (
        <KeyboardControls map={controls}>
            {children}
            <PointerLockControls makeDefault />
        </KeyboardControls>
    )
}

// Preload the model to ensure it's cached
useGLTF.preload('/fps.glb')