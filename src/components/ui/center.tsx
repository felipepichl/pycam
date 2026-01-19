import { styled } from '@gluestack-style/react'
import { View } from 'react-native'

import { Center as CenterStyle } from '../../../config/theme/Center'

const StyledCenter = styled(View, CenterStyle, {
  componentName: 'Center',
})

const Center = StyledCenter

export { Center }
