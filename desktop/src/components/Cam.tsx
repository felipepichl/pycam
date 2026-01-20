import { Camera, CameraOff, SwitchCamera, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

export function Cam() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back')
  const [isActive, setIsActive] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)

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
      <div className="aspect-square max-h-[400px] w-[90%] max-w-[400px] overflow-hidden rounded-xl bg-black" />

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
