import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

export function useLoadingAssets() {
  const { active } = useProgress()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait a bit after the loading progress completes
    if (!active) {
      const timeout = setTimeout(() => {
        setLoading(false)
      }, 500)
      return () => clearTimeout(timeout)
    } else {
      setLoading(true)
    }
  }, [active])

  return loading
}