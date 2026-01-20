import { styled } from '@gluestack-style/react'
import { Text as RNText } from 'react-native'

import { Heading as HeadingStyle } from '../../../config/theme/Heading'

const StyledHeading = styled(RNText, HeadingStyle, {
  componentName: 'Heading',
})

const Heading = StyledHeading

export { Heading }


