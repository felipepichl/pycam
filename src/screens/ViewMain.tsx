import { Loading } from '@components/Loading'
import { Center } from '@components/ui/center'
import { Heading } from '@components/ui/heading'
import { Text } from '@components/ui/text'
import { VStack } from '@components/ui/vstack'

import { PermissionRequest } from '../components/PermissionRequest'
import { useCameraPermission } from '../hooks/useCameraPermission'

export function ViewMain() {
  const { hasPermission, isChecking } = useCameraPermission()

  if (isChecking) {
    return <Loading />
  }

  if (!hasPermission) {
    return <PermissionRequest />
  }

  return (
    <Center flex={1}>
      <VStack style={{ alignItems: 'center' }}>
        <Heading color="$gray100">ViewMain</Heading>
        <Text color="$gray300" style={{ fontSize: 16 }}>
          Permissão concedida! Câmera pronta para uso.
        </Text>
      </VStack>
    </Center>
  )
}
