import React, { ReactNode } from 'react'

type InstructionsProps = {
  children: ReactNode
}

export function Instructions({ children }: InstructionsProps) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      color: 'white',
      background: 'rgba(0, 0, 0, 0.5)',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace'
    }}>
      {children}
    </div>
  )
}