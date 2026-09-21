import { useEffect, useRef, useState } from 'react'

const DEFAULT_DELAY = 650

export function useAdminPageSkeleton(delay = DEFAULT_DELAY) {
  const [isLoading, setIsLoading] = useState(true)
  const timeoutRef = useRef(null)

  const triggerSkeleton = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    setIsLoading(true)
    timeoutRef.current = window.setTimeout(() => {
      setIsLoading(false)
      timeoutRef.current = null
    }, delay)
  }

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    setIsLoading(true)
    timeoutRef.current = window.setTimeout(() => {
      setIsLoading(false)
      timeoutRef.current = null
    }, delay)

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [delay])

  return {
    isLoading,
    triggerSkeleton,
  }
}
