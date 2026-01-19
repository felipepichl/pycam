import { Center } from '@components/ui/center'
import { Heading } from '@components/ui/heading'
import { Text } from '@components/ui/text'
import { VStack } from '@components/ui/vstack'

export function ViewMain() {
  return (
    <Center flex={1}>
      <VStack alignItems="center">
        <Heading color="$gray100">ViewMain</Heading>
        <Text color="$gray300" fontSize="$md">
          Principal simplificada
        </Text>
      </VStack>
    </Center>
  )
}
