import Toast from 'react-native-toast-message'

type ToastType = 'success' | 'error' | 'info'

interface ToastOptions {
  title?: string
  message: string
  type?: ToastType
  duration?: number
}

export const toast = {
  success: (
    message: string,
    options?: Omit<ToastOptions, 'message' | 'type'>,
  ) => {
    Toast.show({
      type: 'success',
      text1: options?.title || 'Sucesso',
      text2: message,
      visibilityTime: options?.duration || 3000,
      topOffset: 50,
    })
  },

  error: (
    message: string,
    options?: Omit<ToastOptions, 'message' | 'type'>,
  ) => {
    Toast.show({
      type: 'error',
      text1: options?.title || 'Erro',
      text2: message,
      visibilityTime: options?.duration || 4000,
      topOffset: 50,
    })
  },

  info: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
    Toast.show({
      type: 'info',
      text1: options?.title || 'Informação',
      text2: message,
      visibilityTime: options?.duration || 3000,
      topOffset: 50,
    })
  },

  show: (options: ToastOptions) => {
    const { type = 'info', title, message, duration = 3000 } = options

    Toast.show({
      type,
      text1:
        title ||
        (type === 'success'
          ? 'Sucesso'
          : type === 'error'
            ? 'Erro'
            : 'Informação'),
      text2: message,
      visibilityTime: duration,
      topOffset: 50,
    })
  },
}
