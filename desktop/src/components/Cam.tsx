import { Camera, CameraOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useWebRTCReceiver } from '@/hooks/useWebRTCReceiver'

export function Cam() {
  const [isActive, setIsActive] = useState(true)

  const { remoteStream, error } = useWebRTCReceiver()
  const videoRef = useRef<HTMLVideoElement>(null)

  // Atualizar srcObject do vídeo quando stream mudar ou isActive mudar
  useEffect(() => {
    if (videoRef.current && remoteStream && isActive) {
      videoRef.current.srcObject = remoteStream
    } else if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [remoteStream, isActive])

  const handleToggleCamera = () => {
    setIsActive((prev) => !prev)
  }

  return (
    <div className="flex h-full w-full flex-col items-center bg-[#121214] pt-8">
      <div className="aspect-square max-h-[400px] w-[90%] max-w-[400px] overflow-hidden rounded-xl bg-black relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`h-full w-full object-cover ${isActive && remoteStream ? 'block' : 'hidden'}`}
        />
        {(!isActive || !remoteStream) && (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center text-gray-500">
            {!isActive ? (
              'Câmera desativada'
            ) : error ? (
              <div className="text-center">
                <p className="text-red-400">{error}</p>
              </div>
            ) : (
              'Aguardando stream...'
            )}
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
