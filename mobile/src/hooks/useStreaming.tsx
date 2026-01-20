import { useCallback, useRef, useState } from 'react'
import { Platform } from 'react-native'

const DEFAULT_SERVER_URL = 'http://192.168.1.203:3000'

export function useStreaming() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const frameQueueRef = useRef<Uint8Array[]>([])
  const isSendingRef = useRef(false)

  const sendFrame = useCallback(
    async (frame: Uint8Array) => {
      console.log(
        '🔵 sendFrame called - isStreaming:',
        isStreaming,
        'isSending:',
        isSendingRef.current,
        'frameSize:',
        frame.length,
      )

      if (!isStreaming) {
        console.log('⚠️ Not streaming, skipping send')
        return
      }

      if (isSendingRef.current) {
        console.log('⚠️ Already sending, skipping')
        return
      }

      try {
        isSendingRef.current = true
        console.log('🔒 Lock acquired, starting send...')

        // Use the configured server URL directly
        const endpoint = `${serverUrl}/frame`

        console.log('📡 Sending frame to:', endpoint, 'size:', frame.length)

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'image/jpeg',
          },
          body: frame,
        })

        console.log('📡 Response received, status:', response.status)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Frame sent successfully:', result)
        setError(null)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error'
        console.error('❌ Error sending frame:', errorMessage)
        if (err instanceof Error) {
          console.error('Error stack:', err.stack)
        }
        setError(errorMessage)
      } finally {
        isSendingRef.current = false
        console.log('🔓 Lock released')
      }
    },
    [serverUrl, isStreaming],
  )

  const startStreaming = useCallback(() => {
    setIsStreaming(true)
    setError(null)
  }, [])

  const stopStreaming = useCallback(() => {
    setIsStreaming(false)
    frameQueueRef.current = []
  }, [])

  return {
    serverUrl,
    setServerUrl,
    isStreaming,
    startStreaming,
    stopStreaming,
    sendFrame,
    error,
  }
}
