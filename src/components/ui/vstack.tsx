import { styled } from '@gluestack-style/react'
import { View } from 'react-native'

import { VStack as VStackStyle } from '../../../config/theme/VStack'

const StyledVStack = styled(View, VStackStyle, {
  componentName: 'VStack',
})

const VStack = StyledVStack

export { VStack }
