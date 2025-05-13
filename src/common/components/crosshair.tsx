import React from 'react'

export function Crosshair() {
  return (
    <>
      <div style={{
        position: 'absolute',
        top: '50%',
        marginTop: '10px',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(45deg)',
        width: '12px',
        height: '2px',
        background: 'rgba(255, 255, 255, 0.5)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        marginTop: '10px',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        width: '12px',
        height: '2px',
        background: 'rgba(255, 255, 255, 0.5)',
        pointerEvents: 'none'
      }} />
    </>
  )
}