import { Button } from '@components/Button'
import { Center } from '@components/ui/center'
import { Heading } from '@components/ui/heading'
import { Text } from '@components/ui/text'
import { VStack } from '@components/ui/vstack'

import { useCameraPermission } from '../hooks/useCameraPermission'

export function PermissionRequest() {
  const { requestPermission, isBlocked } = useCameraPermission()

  const handleRequestPermission = async () => {
    await requestPermission()
  }

  return (
    <Center flex={1} bg="$gray700" px="$4">
      <VStack
        style={{
          gap: 16,
          alignItems: 'center',
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Heading color="$gray100" style={{ textAlign: 'center', fontSize: 24 }}>
          Permissão de Câmera
        </Heading>

        <Text color="$gray300" style={{ textAlign: 'center', fontSize: 16 }}>
          {isBlocked
            ? 'A permissão da câmera foi negada. Por favor, habilite nas configurações do dispositivo para usar o app.'
            : 'Este app precisa acessar sua câmera para funcionar como webcam.'}
        </Text>

        <Button
          type="default"
          title={isBlocked ? 'Abrir Configurações' : 'Permitir Acesso à Câmera'}
          variant="solid"
          onPress={handleRequestPermission}
        />
      </VStack>
    </Center>
  )
}
