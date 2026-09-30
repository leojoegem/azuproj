import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function usePageLoading(delay = 420) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), delay)
    return () => window.clearTimeout(timer)
  }, [location.pathname, delay])

  return loading
}
