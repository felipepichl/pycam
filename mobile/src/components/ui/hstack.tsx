import { styled } from '@gluestack-style/react'
import { View } from 'react-native'

import { HStack as HStackStyle } from '../../../config/theme/HStack'

const StyledHStack = styled(View, HStackStyle, {
  componentName: 'HStack',
})

const HStack = StyledHStack

export { HStack }


