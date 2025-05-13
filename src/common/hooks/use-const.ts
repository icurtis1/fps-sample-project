import { useRef } from 'react'

export function useConst<T>(factory: () => T): T {
  const ref = useRef<{ value: T }>()
  
  if (ref.current === undefined) {
    ref.current = { value: factory() }
  }
  
  return ref.current.value
}