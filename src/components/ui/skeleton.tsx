import { styled } from '@gluestack-style/react'
import React, { useEffect, useRef } from 'react'
import { Animated, View, ViewProps } from 'react-native'

const StyledRoot = styled(
  Animated.View,
  {
    bg: '$gray400',
    borderRadius: '$md',
    overflow: 'hidden',
    variants: {
      variant: {
        rounded: {
          borderRadius: '$md',
        },
        sharp: {
          borderRadius: '$none',
        },
        circular: {
          borderRadius: '$full',
        },
      },
    },
    defaultProps: {
      variant: 'rounded',
    },
  },
  {
    componentName: 'Skeleton',
  },
)

const StyledSkeletonText = styled(
  Animated.View,
  {
    bg: '$gray400',
    borderRadius: '$md',
    overflow: 'hidden',
  },
  {
    componentName: 'SkeletonText',
  },
)

type SkeletonProps = React.ComponentProps<typeof StyledRoot> & {
  variant?: 'rounded' | 'sharp' | 'circular'
  startColor?: string
  isLoaded?: boolean
  speed?: number
}

const Skeleton = React.forwardRef<any, SkeletonProps>(
  (
    { variant = 'rounded', startColor, isLoaded = false, speed = 2, ...props },
    ref,
  ) => {
    const animatedValue = useRef(new Animated.Value(0)).current

    useEffect(() => {
      if (!isLoaded) {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1000 / speed,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 1000 / speed,
              useNativeDriver: true,
            }),
          ]),
        )
        animation.start()
        return () => animation.stop()
      }
    }, [isLoaded, speed, animatedValue])

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 0.8],
    })

    if (isLoaded) {
      return null
    }

    const { style, ...restProps } = props

    return (
      <StyledRoot
        ref={ref}
        variant={variant}
        {...restProps}
        style={[{ opacity }, style]}
      />
    )
  },
)

Skeleton.displayName = 'Skeleton'

type SkeletonTextProps = ViewProps & {
  lines?: number
  startColor?: string
  isLoaded?: boolean
  speed?: number
  gap?: number
}

const SkeletonText = React.forwardRef<any, SkeletonTextProps>(
  (
    { lines = 1, startColor, isLoaded = false, speed = 2, gap = 8, ...props },
    ref,
  ) => {
    const animatedValue = useRef(new Animated.Value(0)).current

    useEffect(() => {
      if (!isLoaded) {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1000 / speed,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 1000 / speed,
              useNativeDriver: true,
            }),
          ]),
        )
        animation.start()
        return () => animation.stop()
      }
    }, [isLoaded, speed, animatedValue])

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    })

    if (isLoaded) {
      return null
    }

    if (lines > 1) {
      return (
        <View style={{ gap }}>
          {Array.from({ length: lines }).map((_, index) => (
            <StyledSkeletonText
              key={index}
              style={[{ opacity }, props.style]}
              {...props}
            />
          ))}
        </View>
      )
    }

    return (
      <StyledSkeletonText
        ref={ref}
        style={[{ opacity }, props.style]}
        {...props}
      />
    )
  },
)

SkeletonText.displayName = 'SkeletonText'

export { Skeleton, SkeletonText }
