import { Camera, CameraOff } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useWebRTCReceiver } from '@/hooks/useWebRTCReceiver'

export function Cam() {
  const [isActive, setIsActive] = useState(true)

  // Handler para comandos recebidos do mobile
  const handleRemoteCommand = useCallback((command: { type: string }) => {
    if (command.type === 'toggle-camera') {
      console.log('📥 Received toggle-camera command from mobile')
      setIsActive((prev) => !prev)
    }
  }, [])

  const { remoteStream, error, sendCommand } = useWebRTCReceiver(handleRemoteCommand)

  // Callback ref para atribuir srcObject quando o elemento de vídeo for montado
  const videoRefCallback = useCallback(
    (videoElement: HTMLVideoElement | null) => {
      if (videoElement && remoteStream) {
        videoElement.srcObject = remoteStream
      }
    },
    [remoteStream],
  )

  const handleToggleCamera = () => {
    setIsActive((prev) => !prev)
    // Enviar comando para o mobile sincronizar o estado
    sendCommand({ type: 'toggle-camera' })
  }

  return (
    <div className="flex h-full w-full flex-col items-center bg-[#121214] pt-8">
      <div className="aspect-square max-h-[400px] w-[90%] max-w-[400px] overflow-hidden rounded-xl bg-black">
        {isActive ? (
          remoteStream ? (
            <video
              ref={videoRefCallback}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              {error ? (
                <div className="text-center">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : (
                'Aguardando stream...'
              )}
            </div>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black">
            <CameraOff className="h-16 w-16 text-gray-600" />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-row items-center justify-center gap-3">
        <Button
          size="icon"
          variant="outline"
          onClick={handleToggleCamera}
          className="rounded-xl"
        >
          {isActive ? (
            <CameraOff className="h-6 w-6 text-[#00B37E]" />
          ) : (
            <Camera className="h-6 w-6 text-[#00B37E]" />
          )}
        </Button>
      </div>
    </div>
  )
}
