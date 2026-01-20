import { Button } from '@components/Button'
import { Loading } from '@components/Loading'
import { Box } from '@components/ui/box'
import { VStack } from '@components/ui/vstack'
import * as FileSystem from 'expo-file-system/legacy'
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Wifi,
  WifiOff,
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Camera as VisionCamera,
  useCameraDevice,
} from 'react-native-vision-camera'

import { useWebSocketStreaming } from '../hooks/useWebSocketStreaming'

export function Cam() {
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back')
  const [isActive, setIsActive] = useState(true)
  const cameraRef = useRef<VisionCamera>(null)

  const device = useCameraDevice(cameraPosition)
  const {
    isStreaming,
    startStreaming,
    stopStreaming,
    sendFrame,
    isConnected,
  } = useWebSocketStreaming()

  const handleToggleCamera = () => {
    setIsActive((prev) => !prev)
    if (isActive && isStreaming) {
      stopStreaming()
    }
  }

  const handleSwitchCamera = () => {
    setCameraPosition((prev) => (prev === 'front' ? 'back' : 'front'))
  }

  const handleToggleStreaming = () => {
    if (isStreaming) {
      stopStreaming()
    } else {
      startStreaming()
    }
  }

  // Capture frames periodically when streaming
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start/stop frame capture when streaming changes
  useEffect(() => {
    console.log(
      '🔄 useEffect triggered - isStreaming:',
      isStreaming,
      'isActive:',
      isActive,
      'cameraRef:',
      !!cameraRef.current,
    )

    if (isStreaming && isActive && cameraRef.current) {
      console.log('✅ Starting frame capture interval')

      // Capture frame every 100ms (10 FPS) for smooth video
      captureIntervalRef.current = setInterval(async () => {
        try {
          if (!cameraRef.current || !isStreaming || !isActive) {
            console.log('⚠️ Skipping capture - conditions not met')
            return
          }

          console.log('📷 Starting photo capture...')

          const photo = await cameraRef.current.takePhoto({
            flash: 'off',
          })

          console.log('📷 Photo captured successfully:', photo.path)

          // Convert path to URI format (add file:// scheme if needed)
          const fileUri = photo.path.startsWith('file://')
            ? photo.path
            : `file://${photo.path}`

          console.log('📖 Reading file from URI:', fileUri)

          // Read photo file using legacy expo-file-system API
          const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          })

          console.log('📖 File read, base64 length:', base64.length)

          // Convert base64 to Uint8Array
          const binaryString = atob(base64)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          console.log(
            '📤 Frame ready, size:',
            bytes.length,
            'bytes, calling sendFrame...',
          )
          await sendFrame(bytes)
          console.log('✅ sendFrame called successfully')

          // Clean up temporary photo file after sending
          try {
            await FileSystem.deleteAsync(fileUri, { idempotent: true })
            console.log('🗑️ Temporary file deleted')
          } catch (deleteError) {
            // Silently ignore delete errors (file might already be deleted)
            console.log('⚠️ Could not delete temp file (ok)')
          }
        } catch (error) {
          console.error('❌ Error in frame capture/send:', error)
          if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
          }
        }
      }, 100) // 10 FPS para vídeo suave
    } else {
      console.log('🛑 Stopping frame capture')
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
        captureIntervalRef.current = null
      }
    }

    return () => {
      console.log('🧹 Cleanup: clearing interval')
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
      }
    }
  }, [isStreaming, isActive, sendFrame])

  if (!device) {
    return <Loading />
  }

  return (
    <Box flex={1} bg="$gray700">
      <VStack
        style={{
          gap: 16,
          alignItems: 'center',
          width: '100%',
          paddingTop: 120,
        }}
      >
        <Box
          w="90%"
          rounded="$xl"
          overflow="hidden"
          bg="$black"
          style={{
            aspectRatio: 1,
            maxWidth: 400,
            maxHeight: 400,
          }}
        >
          {isActive ? (
            <VisionCamera
              ref={cameraRef}
              device={device}
              isActive={isActive}
              photo={true}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Box flex={1} bg="$black" />
          )}
        </Box>

        <VStack
          style={{
            gap: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Button
            type="icon"
            icon={SwitchCamera}
            onPress={handleSwitchCamera}
            variant="outline"
          />
          <Button
            type="icon"
            icon={isActive ? CameraOff : Camera}
            onPress={handleToggleCamera}
            variant="outline"
          />
          <Button
            type="icon"
            icon={isStreaming ? WifiOff : Wifi}
            onPress={handleToggleStreaming}
            variant={isStreaming ? 'solid' : 'outline'}
          />
        </VStack>
      </VStack>
    </Box>
  )
}
