import { Camera, CameraOff, SwitchCamera, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useWebRTCReceiver } from '@/hooks/useWebRTCReceiver'

export function Cam() {
  console.log('🎥 Cam component rendering')

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back')
  const [isActive, setIsActive] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)

  const { remoteStream, error } = useWebRTCReceiver()
  console.log('🎥 Cam: remoteStream=', remoteStream, 'error=', error)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Atualizar srcObject do vídeo quando stream mudar
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      console.log('📹 Setting video srcObject:', {
        streamId: remoteStream.id,
        tracks: remoteStream.getTracks().map(t => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted,
        })),
      })
      videoRef.current.srcObject = remoteStream
      console.log('✅ Video srcObject updated')
      
      // Verificar se o vídeo está realmente reproduzindo
      videoRef.current.onloadedmetadata = () => {
        console.log('✅ Video metadata loaded')
      }
      videoRef.current.onplay = () => {
        console.log('✅ Video started playing')
      }
      videoRef.current.onerror = (e) => {
        console.error('❌ Video error:', e)
      }
    } else if (videoRef.current && !remoteStream) {
      videoRef.current.srcObject = null
      console.log('🛑 Video srcObject cleared')
    }
  }, [remoteStream])

  const handleToggleCamera = () => {
    setIsActive((prev) => !prev)
    if (isActive && isStreaming) {
      setIsStreaming(false)
    }
  }

  const handleSwitchCamera = () => {
    setCameraPosition((prev) => (prev === 'front' ? 'back' : 'front'))
  }

  const handleToggleStreaming = () => {
    setIsStreaming((prev) => !prev)
  }

  return (
    <div className="flex h-full w-full flex-col items-center bg-[#121214] pt-8">
      <div className="aspect-square max-h-[400px] w-[90%] max-w-[400px] overflow-hidden rounded-xl bg-black">
        {remoteStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            {error ? (
              <div className="text-center">
                <p className="text-red-400">{error}</p>
                <p className="text-sm mt-2">Signaling não implementado</p>
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
          onClick={handleSwitchCamera}
          className="rounded-xl"
        >
          <SwitchCamera className="h-6 w-6 text-[#00B37E]" />
        </Button>
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
        <Button
          size="icon"
          variant={isStreaming ? 'default' : 'outline'}
          onClick={handleToggleStreaming}
          className={
            isStreaming
              ? 'rounded-xl border-[#00B37E] bg-[#00875F] hover:bg-[#00B37E]'
              : 'rounded-xl border-[#00B37E]'
          }
        >
          {isStreaming ? (
            <WifiOff className="h-6 w-6 text-white" />
          ) : (
            <Wifi className="h-6 w-6 text-[#00B37E]" />
          )}
        </Button>
      </div>
    </div>
  )
}
