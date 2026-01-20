import { styled } from '@gluestack-style/react'
import { View } from 'react-native'

import { Box as BoxStyle } from '../../../config/theme/Box'

const StyledBox = styled(View, BoxStyle, {
  componentName: 'Box',
})

const Box = StyledBox

export { Box }


