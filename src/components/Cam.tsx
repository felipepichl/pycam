import { Loading } from '@components/Loading'
import { Box } from '@components/ui/box'
import { useState } from 'react'
import { Camera, useCameraDevice } from 'react-native-vision-camera'

export function Cam() {
  const [cameraPosition] = useState<'front' | 'back'>('back')
  const [isActive] = useState(true)

  const device = useCameraDevice(cameraPosition)

  if (!device) {
    return <Loading />
  }

  return (
    <Box flex={1} bg="$gray700">
      <Box
        w="90%"
        mx="auto"
        mt="$16"
        rounded="$xl"
        overflow="hidden"
        bg="$black"
        style={{
          aspectRatio: 1,
          maxWidth: 400,
          maxHeight: 400,
        }}
      >
        <Camera
          device={device}
          isActive={isActive}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
    </Box>
  )
}
