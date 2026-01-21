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
  | { type: 'stop' }

// Tipos de comandos via DataChannel
type DataChannelCommand = { type: 'toggle-camera' }

export function useWebRTCStreaming(
  cameraPosition: 'front' | 'back' = 'back',
  onRemoteCommand?: (command: DataChannelCommand) => void,
) {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const lastCameraPositionRef = useRef<'front' | 'back'>(cameraPosition)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isStreamingRef = useRef<boolean>(false)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const onRemoteCommandRef = useRef(onRemoteCommand)

  // Atualizar ref quando callback mudar
  useEffect(() => {
    onRemoteCommandRef.current = onRemoteCommand
  }, [onRemoteCommand])

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
    if (!isStreamingRef.current || !peerConnectionRef.current) return

    try {
      const response = await fetch(`${serverUrl}/mobile/receive`)
      if (!response.ok) return

      const messages: SignalingMessage[] = await response.json()
      if (messages.length === 0) return

      for (const message of messages) {
        switch (message.type) {
          case 'answer':
            // Só processar answer se ainda não temos remote description
            if (peerConnectionRef.current &&
                peerConnectionRef.current.signalingState === 'have-local-offer') {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription({
                  type: 'answer',
                  sdp: message.sdp,
                }),
              )
              console.log('✅ Answer received and set')
            } else {
              console.log('⚠️ Ignoring answer - already in stable state')
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
  }, [serverUrl])

  const startStreaming = useCallback(async () => {
    try {
      isStreamingRef.current = true
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

      // Criar DataChannel para comandos bidirecionais
      const dataChannel = pc.createDataChannel('commands', {
        ordered: true,
      })
      dataChannelRef.current = dataChannel

      dataChannel.onopen = () => {
        console.log('📡 DataChannel opened')
      }

      dataChannel.onclose = () => {
        console.log('📡 DataChannel closed')
      }

      dataChannel.onmessage = (event: any) => {
        try {
          const command = JSON.parse(event.data) as DataChannelCommand
          console.log('📥 Received command via DataChannel:', command)
          if (onRemoteCommandRef.current) {
            onRemoteCommandRef.current(command)
          }
        } catch (err) {
          console.error('❌ Error parsing DataChannel message:', err)
        }
      }

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

  const stopStreaming = useCallback(async () => {
    // Enviar mensagem de stop para o desktop
    await sendSignalingMessage({ type: 'stop' })
    console.log('📤 Stop message sent')

    isStreamingRef.current = false
    setIsStreaming(false)

    // Parar polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    // Fechar DataChannel
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }

    // Fechar peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Não parar o stream local (mantém preview)
  }, [sendSignalingMessage])

  // Enviar comando via DataChannel
  const sendCommand = useCallback((command: DataChannelCommand) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(command))
      console.log('📤 Sent command via DataChannel:', command)
    } else {
      console.warn('⚠️ DataChannel not open, cannot send command')
    }
  }, [])

  // Função para trocar a câmera mantendo a conexão WebRTC
  const switchCamera = useCallback(async () => {
    try {
      const newFacingMode = cameraPosition === 'back' ? 'environment' : 'user'
      console.log('📷 Switching camera to:', newFacingMode)

      // Criar novo stream com a nova câmera
      const newStream = await mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      console.log('✅ New camera stream obtained:', newVideoTrack.id)

      // Se temos uma conexão WebRTC ativa, substituir a track
      if (peerConnectionRef.current && isStreamingRef.current) {
        const senders = peerConnectionRef.current.getSenders()
        const videoSender = senders.find((sender: any) =>
          sender.track && sender.track.kind === 'video'
        )

        if (videoSender) {
          // @ts-ignore - replaceTrack existe em react-native-webrtc
          await videoSender.replaceTrack(newVideoTrack)
          console.log('✅ Video track replaced in WebRTC connection')
        }
      }

      // Parar tracks do stream antigo
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: any) => {
          track.stop()
          console.log('🛑 Stopped old track:', track.kind)
        })
      }

      // Atualizar referências
      localStreamRef.current = newStream
      setLocalStream(newStream)
      console.log('✅ Camera switched successfully')
    } catch (err) {
      console.error('❌ Error switching camera:', err)
      setError(err instanceof Error ? err.message : 'Failed to switch camera')
    }
  }, [cameraPosition])

  // Criar stream inicial quando componente montar
  useEffect(() => {
    const createInitialStream = async () => {
      // Só criar se não existir ainda
      if (localStreamRef.current) return

      try {
        console.log('📷 Creating initial preview stream with camera:', cameraPosition)
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
        console.log('✅ Initial preview stream created')
      } catch (err) {
        console.error('❌ Error creating initial preview stream:', err)
        setError(err instanceof Error ? err.message : 'Failed to access camera')
      }
    }

    createInitialStream()
  }, []) // Executar apenas na montagem

  // Trocar câmera quando cameraPosition mudar (exceto na montagem inicial)
  useEffect(() => {
    const cameraChanged = lastCameraPositionRef.current !== cameraPosition
    lastCameraPositionRef.current = cameraPosition

    // Só trocar se já temos um stream e a câmera realmente mudou
    if (localStreamRef.current && cameraChanged) {
      switchCamera()
    }
  }, [cameraPosition, switchCamera])

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
    sendCommand,
  }
}
