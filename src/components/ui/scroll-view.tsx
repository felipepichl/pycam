import { styled } from '@gluestack-style/react'
import { ScrollView as RNScrollView } from 'react-native'

import { ScrollView as ScrollViewStyle } from '../../../config/theme/ScrollView'

const StyledScrollView = styled(RNScrollView, ScrollViewStyle, {
  componentName: 'ScrollView',
})

const ScrollView = StyledScrollView

export { ScrollView }


