import { Cam } from '@components/Cam'
import { Loading } from '@components/Loading'

import { PermissionRequest } from '../components/PermissionRequest'
import { useCameraPermission } from '../hooks/useCameraPermission'

export function ViewMain() {
  const { hasPermission, isChecking } = useCameraPermission()

  if (isChecking) {
    return <Loading />
  }

  if (!hasPermission) {
    return <PermissionRequest />
  }

  return <Cam />
}
