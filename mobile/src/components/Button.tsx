import { Text } from '@components/ui/text'
import {
  Button as GluestackButton,
  ButtonSpinner,
  Icon,
} from '@gluestack-ui/themed'
import { LucideIcon } from 'lucide-react-native'
import { ComponentProps } from 'react'

type ButtonPropsBase = ComponentProps<typeof GluestackButton> & {
  variant?: 'solid' | 'outline'
  type: 'default' | 'icon'
  iconSize?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  isLoading?: boolean
}

type ButtonPropsWithIcon = ButtonPropsBase & {
  icon: LucideIcon
  title?: string
}

type ButtonPropsWithTitle = ButtonPropsBase & {
  icon?: never
  title: string
}

type ButtonProps = ButtonPropsWithIcon | ButtonPropsWithTitle

export function Button({
  title,
  variant = 'solid',
  type,
  icon,
  iconSize = 'xl',
  isLoading = false,
  ...rest
}: ButtonProps) {
  const isDefaultType = type === 'default'
  const isOutlineVariant = variant === 'outline'

  const width = isDefaultType ? '$full' : '$12'
  const height = isDefaultType ? '$14' : '$12'
  const backgroundColor = isOutlineVariant ? 'transparent' : '$green700'
  const borderWith = isOutlineVariant ? '$1' : '$0'

  return (
    <GluestackButton
      w={width}
      h={height}
      bg={backgroundColor}
      borderWidth={borderWith}
      borderColor="$green500"
      rounded="$xl"
      $active-bg={variant === 'outline' ? '$gray500' : '$green500'}
      disabled={isLoading}
      justifyContent="center"
      alignItems="center"
      {...rest}
    >
      {isLoading ? (
        <ButtonSpinner color="$gray100" />
      ) : icon ? (
        <Icon as={icon} color="$green500" size={iconSize} />
      ) : (
        <Text
          color="$gray100"
          fontFamily="$heading"
          style={{ textAlign: 'center' }}
        >
          {title}
        </Text>
      )}
    </GluestackButton>
  )
}
