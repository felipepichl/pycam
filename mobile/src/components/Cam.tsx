import { Button } from '@components/Button'
import { Loading } from '@components/Loading'
import { Box } from '@components/ui/box'
import { VStack } from '@components/ui/vstack'
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Wifi,
  WifiOff,
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { RTCView } from 'react-native-webrtc'

import { useWebRTCStreaming } from '../hooks/useWebRTCStreaming'

export function Cam() {
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back')
  const [isActive, setIsActive] = useState(true)

  const {
    isStreaming,
    startStreaming,
    stopStreaming,
    localStream,
    error,
  } = useWebRTCStreaming(cameraPosition)

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
          {isActive && localStream ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={{ width: '100%', height: '100%' }}
              objectFit="cover"
              mirror={cameraPosition === 'front'}
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
