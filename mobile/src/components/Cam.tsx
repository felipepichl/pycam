import { Button } from '@components/Button'
import { Loading } from '@components/Loading'
import { Box } from '@components/ui/box'
import { VStack } from '@components/ui/vstack'
import { Camera, CameraOff, SwitchCamera } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { RTCView } from 'react-native-webrtc'

import { useWebRTCStreaming } from '../hooks/useWebRTCStreaming'

export function Cam() {
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front')
  const [isActive, setIsActive] = useState(true)

  const { startStreaming, stopStreaming, localStream } =
    useWebRTCStreaming(cameraPosition)

  const hasStartedRef = useRef(false)

  // Iniciar streaming automaticamente quando o localStream estiver pronto
  useEffect(() => {
    if (localStream && !hasStartedRef.current) {
      hasStartedRef.current = true
      console.log('🚀 localStream ready, starting streaming...')
      startStreaming()
    }
  }, [localStream, startStreaming])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [stopStreaming])

  const handleToggleCamera = () => {
    setIsActive((prev) => !prev)
  }

  const handleSwitchCamera = () => {
    setCameraPosition((prev) => (prev === 'front' ? 'back' : 'front'))
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
            localStream ? (
              <RTCView
                streamURL={localStream.toURL()}
                style={{ width: '100%', height: '100%' }}
                objectFit="cover"
                mirror={cameraPosition === 'front'}
              />
            ) : (
              <Box flex={1} bg="$black" justifyContent="center" alignItems="center">
                <Loading />
              </Box>
            )
          ) : (
            <Box flex={1} bg="$black" justifyContent="center" alignItems="center">
              <CameraOff size={64} color="#52525b" />
            </Box>
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
        </VStack>
      </VStack>
    </Box>
  )
}
