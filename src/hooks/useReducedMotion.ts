import { useEffect, useState } from 'react'

const query = '(prefers-reduced-motion: reduce)'

function initial() {
  if (new URLSearchParams(location.search).get('motion') === 'reduced') return true
  return window.matchMedia?.(query).matches ?? false
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(initial)
  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    const onChange = () => setReduced(initial())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
