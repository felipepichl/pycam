import { useState, useEffect } from 'react'
import { Platform, Linking, Alert } from 'react-native'
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions'

type CameraPermissionStatus = 'checking' | 'granted' | 'denied' | 'blocked'

export function useCameraPermission() {
  const [status, setStatus] = useState<CameraPermissionStatus>('checking')

  const getCameraPermission = (): Permission => {
    if (Platform.OS === 'android') {
      return PERMISSIONS.ANDROID.CAMERA
    }
    return PERMISSIONS.IOS.CAMERA
  }

  const checkPermission = async () => {
    try {
      const permission = getCameraPermission();
      const result = await check(permission);

      switch (result) {
        case RESULTS.UNAVAILABLE:
          setStatus('denied')
          break
        case RESULTS.DENIED:
          setStatus('denied')
          break
        case RESULTS.LIMITED:
          setStatus('granted')
          break
        case RESULTS.GRANTED:
          setStatus('granted')
          break
        case RESULTS.BLOCKED:
          setStatus('blocked')
          break
        default:
          setStatus('denied')
      }
    } catch (error) {
      console.error('Error checking camera permission:', error)
      setStatus('denied')
    }
  }

  const requestPermission = async (): Promise<boolean> => {
    try {
      const permission = getCameraPermission();
      const result = await request(permission);

      switch (result) {
        case RESULTS.UNAVAILABLE:
          setStatus('denied')
          return false
        case RESULTS.DENIED:
          setStatus('denied')
          return false
        case RESULTS.LIMITED:
          setStatus('granted')
          return true
        case RESULTS.GRANTED:
          setStatus('granted')
          return true
        case RESULTS.BLOCKED:
          setStatus('blocked')
          Alert.alert(
            'Permissão Negada',
            'A permissão da câmera foi negada. Por favor, habilite nas configurações do dispositivo.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Abrir Configurações',
                onPress: () => Linking.openSettings(),
              },
            ],
          )
          return false
        default:
          setStatus('denied')
          return false
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error)
      setStatus('denied')
      return false
    }
  }

  useEffect(() => {
    checkPermission()
  }, [])

  return {
    status,
    hasPermission: status === 'granted',
    isBlocked: status === 'blocked',
    isChecking: status === 'checking',
    requestPermission,
    checkPermission,
  };
}
