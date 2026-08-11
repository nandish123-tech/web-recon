import { useState, useEffect, useRef, useCallback } from 'react'
import { scansApi } from '../services/api'

const POLL_INTERVAL_MS = 1500
const TERMINAL_STATUSES = ['completed', 'completed_with_errors', 'failed']

/**
 * Hook for polling scan status until completion.
 *
 * @param {string|null} scanId - Scan ID to poll
 * @returns {{ scan, loading, error, refetch }}
 */
export function useScanPolling(scanId) {
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  const isMountedRef = useRef(true)

  const fetchScan = useCallback(async () => {
    if (!scanId) return
    try {
      const data = await scansApi.get(scanId)
      if (!isMountedRef.current) return
      setScan(data)
      setError(null)

      // Stop polling once scan is in a terminal state
      if (TERMINAL_STATUSES.includes(data.status)) {
        clearInterval(intervalRef.current)
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err.message)
      clearInterval(intervalRef.current)
    }
  }, [scanId])

  useEffect(() => {
    isMountedRef.current = true

    if (!scanId) return

    setLoading(true)
    setError(null)

    // Immediate fetch
    fetchScan().finally(() => {
      if (isMountedRef.current) setLoading(false)
    })

    // Start polling
    intervalRef.current = setInterval(fetchScan, POLL_INTERVAL_MS)

    return () => {
      isMountedRef.current = false
      clearInterval(intervalRef.current)
    }
  }, [scanId, fetchScan])

  return { scan, loading, error, refetch: fetchScan }
}
