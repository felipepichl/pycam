import { useCallback, useEffect, useRef, useState } from 'react'
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc'

const DEFAULT_SERVER_URL = 'http://192.168.1.203:3000' // Placeholder IP

type SignalingMessage =
  | { type: 'offer'; sdp: string }
  | { type: 'answer'; sdp: string }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }

export function useWebRTCStreaming(cameraPosition: 'front' | 'back' = 'back') {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const lastCameraPositionRef = useRef<'front' | 'back'>(cameraPosition)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Configuração WebRTC para LAN (STUN para descoberta de IP, sem TURN)
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
      // STUN local alternativo
      {
        urls: 'stun:stun1.l.google.com:19302',
      },
    ],
    iceCandidatePoolSize: 0,
  }

  // Enviar mensagem de signaling via HTTP
  const sendSignalingMessage = useCallback(
    async (message: SignalingMessage) => {
      try {
        const response = await fetch(`${serverUrl}/mobile/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } catch (err) {
        console.error('❌ Error sending signaling message:', err)
      }
    },
    [serverUrl],
  )

  // Receber mensagens de signaling via HTTP polling
  const pollSignalingMessages = useCallback(async () => {
    if (!isStreaming || !peerConnectionRef.current) return

    try {
      const response = await fetch(`${serverUrl}/mobile/receive`)
      if (!response.ok) return

      const messages: SignalingMessage[] = await response.json()
      if (messages.length === 0) return

      for (const message of messages) {
        switch (message.type) {
          case 'answer':
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription({
                  type: 'answer',
                  sdp: message.sdp,
                }),
              )
              console.log('✅ Answer received and set')
            }
            break

          case 'ice-candidate':
            if (peerConnectionRef.current && message.candidate) {
              await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(message.candidate),
              )
              console.log('✅ ICE candidate received')
            }
            break
        }
      }
    } catch (err) {
      console.error('❌ Error polling signaling messages:', err)
    }
  }, [serverUrl, isStreaming])

  const startStreaming = useCallback(async () => {
    try {
      setIsStreaming(true)
      setError(null)

      // Usar stream existente ou criar novo se não existir
      let stream = localStreamRef.current
      if (!stream) {
        console.log('📷 Getting user media...')
        stream = await mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: cameraPosition === 'back' ? 'environment' : 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        })

        localStreamRef.current = stream
        setLocalStream(stream)
        console.log('✅ Camera stream obtained')
      }

      // Criar RTCPeerConnection
      const pc = new RTCPeerConnection(rtcConfiguration)
      peerConnectionRef.current = pc

      // Adicionar tracks do stream local
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
        console.log('✅ Added track:', track.kind)
      })

      // Handler para ICE candidates
      // @ts-ignore - react-native-webrtc usa onicecandidate
      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate.toJSON(),
          })
          console.log('📤 ICE candidate sent')
        } else {
          console.log('✅ All ICE candidates gathered')
        }
      }

      // Handler para mudanças de estado da conexão
      // @ts-ignore - react-native-webrtc usa onconnectionstatechange
      pc.onconnectionstatechange = () => {
        console.log('🔄 Connection state:', pc.connectionState)
        if (pc.connectionState === 'connected') {
          console.log('✅ WebRTC connected!')
        } else if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'disconnected'
        ) {
          console.error('❌ WebRTC connection failed')
          setError('WebRTC connection failed')
        }
      }

      // Handler para ICE connection state
      // @ts-ignore - react-native-webrtc pode ter oniceconnectionstatechange
      if (pc.oniceconnectionstatechange) {
        // @ts-ignore
        pc.oniceconnectionstatechange = () => {
          console.log('🧊 ICE connection state:', pc.iceConnectionState)
          if (pc.iceConnectionState === 'failed') {
            console.error(
              '❌ ICE connection failed - pode ser problema de rede ou firewall',
            )
            setError(
              'ICE connection failed. Verifique se ambos dispositivos estão na mesma rede LAN.',
            )
          } else if (pc.iceConnectionState === 'connected') {
            console.log('✅ ICE connection established!')
          }
        }
      }

      // Criar e enviar offer
      console.log('📤 Creating offer...')
      const offer = await pc.createOffer({
        offerToReceiveVideo: false,
        offerToReceiveAudio: false,
      })

      await pc.setLocalDescription(offer)
      console.log('✅ Local description set')

      await sendSignalingMessage({
        type: 'offer',
        sdp: offer.sdp || '',
      })
      console.log('📤 Offer sent')

      // Iniciar polling para receber answer e ICE candidates
      pollingIntervalRef.current = setInterval(pollSignalingMessages, 500) // Poll a cada 500ms
    } catch (err) {
      console.error('❌ Error starting stream:', err)
      setError(err instanceof Error ? err.message : 'Failed to start streaming')
      setIsStreaming(false)
      stopStreaming()
    }
  }, [cameraPosition, sendSignalingMessage, pollSignalingMessages])

  const stopStreaming = useCallback(() => {
    setIsStreaming(false)

    // Parar polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    // Fechar peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Não parar o stream local (mantém preview)
  }, [])

  // Criar/recriar stream quando componente montar ou câmera mudar
  useEffect(() => {
    const cameraChanged = lastCameraPositionRef.current !== cameraPosition
    lastCameraPositionRef.current = cameraPosition

    const createPreviewStream = async () => {
      try {
        const oldStream = localStreamRef.current

        // Parar stream antigo se existir
        if (oldStream) {
          oldStream.getTracks().forEach((track) => track.stop())
        }

        console.log('📷 Creating preview stream with camera:', cameraPosition)
        const stream = await mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: cameraPosition === 'back' ? 'environment' : 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        })

        localStreamRef.current = stream
        setLocalStream(stream)
        console.log('✅ Preview stream created with camera:', cameraPosition)
        console.log(
          '📹 Stream tracks:',
          stream.getTracks().map((t) => ({
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState,
          })),
        )
      } catch (err) {
        console.error('❌ Error creating preview stream:', err)
        setError(err instanceof Error ? err.message : 'Failed to access camera')
      }
    }

    // Criar stream se não existir ou se a câmera mudou
    if (!localStreamRef.current || cameraChanged) {
      createPreviewStream()
    }

    // Cleanup: parar stream apenas ao desmontar o componente
    return () => {
      // Não fazer cleanup aqui - o stream deve persistir para preview
      // O cleanup será feito apenas quando o componente for desmontado completamente
    }
  }, [cameraPosition]) // Removido isStreaming das dependências

  // Cleanup ao desmontar componente completamente
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up WebRTC streaming hook')
      stopStreaming()
      if (localStreamRef.current) {
        console.log('🛑 Stopping local stream tracks')
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop()
          console.log('🛑 Stopped track:', track.kind)
        })
        localStreamRef.current = null
        setLocalStream(null)
      }
    }
  }, [stopStreaming])

  return {
    serverUrl,
    setServerUrl,
    isStreaming,
    startStreaming,
    stopStreaming,
    localStream,
    error,
  }
}
