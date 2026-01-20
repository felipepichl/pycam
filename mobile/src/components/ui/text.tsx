import { styled } from '@gluestack-style/react'
import { Text as RNText } from 'react-native'

import { Text as TextStyle } from '../../../config/theme/Text'

const StyledText = styled(RNText, TextStyle, {
  componentName: 'Text',
})

const Text = StyledText

export { Text }


