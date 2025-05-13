import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

// Optimized deadzone values for better control
const STICK_DEADZONE = 0.15
const TRIGGER_DEADZONE = 0.1

// Stick response curve for more precise aiming
const applyCurve = (value: number): number => {
  const sign = Math.sign(value)
  const abs = Math.abs(value)
  return sign * Math.pow(abs, 1.5) // Exponential response curve for better precision
}

export type GamepadState = {
  leftStick: { x: number; y: number }
  rightStick: { x: number; y: number }
  buttons: {
    jump: boolean
    leftStickPress: boolean
    shoot: boolean
  }
  connected: boolean
}

export function useGamepad() {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    buttons: {
      jump: false,
      shoot: false
    },
    connected: false
  })

  const previousButtonStates = useRef({
    jump: false,
    sprint: false,
    leftStickPress: false,
    shoot: false
  })

  useFrame(() => {
    const gamepad = navigator.getGamepads()[0]
    if (!gamepad) return

    // Process movement stick with deadzone
    const leftX = Math.abs(gamepad.axes[0]) > STICK_DEADZONE ? gamepad.axes[0] : 0
    const leftY = Math.abs(gamepad.axes[1]) > STICK_DEADZONE ? gamepad.axes[1] : 0
    
    // Process aim stick with response curve for better precision
    const rightX = Math.abs(gamepad.axes[2]) > STICK_DEADZONE ? applyCurve(gamepad.axes[2]) : 0
    const rightY = Math.abs(gamepad.axes[3]) > STICK_DEADZONE ? applyCurve(gamepad.axes[3]) : 0

    // Map gamepad buttons to actions
    const jumpButton = gamepad.buttons[0].pressed // A button
    const leftStickPress = gamepad.buttons[10].pressed // L3 button
    const shootButton = gamepad.buttons[7].value > TRIGGER_DEADZONE // RT button with analog support

    setGamepadState({
      leftStick: { x: leftX, y: leftY },
      rightStick: { x: rightX, y: rightY },
      buttons: {
        jump: jumpButton,
        leftStickPress: leftStickPress,
        shoot: shootButton
      },
      connected: true
    })

    // Store current button states for next frame
    previousButtonStates.current = {
      jump: jumpButton,
      leftStickPress: leftStickPress,
      shoot: shootButton
    }
  })

  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id)
    }

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad.id)
      setGamepadState(prev => ({ ...prev, connected: false }))
    }

    window.addEventListener('gamepadconnected', handleGamepadConnected)
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected)

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected)
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
    }
  }, [])

  return gamepadState
}