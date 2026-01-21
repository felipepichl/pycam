import { useEffect, useRef, useState } from 'react'

type SignalingMessage =
  | { type: 'offer'; sdp: string }
  | { type: 'answer'; sdp: string }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }

export function useWebRTCReceiver() {
  console.log('🚀 useWebRTCReceiver hook initialized')

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const serverUrlRef = useRef<string | null>(null)
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const isProcessingOfferRef = useRef<boolean>(false)

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
  const sendSignalingMessage = async (message: SignalingMessage) => {
    if (!serverUrlRef.current) return

    try {
      const response = await fetch(`${serverUrlRef.current}/desktop/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      console.log('📤 Sent signaling message:', message.type)
    } catch (err) {
      console.error('❌ Error sending signaling message:', err)
    }
  }

  useEffect(() => {
    console.log('🔄 useWebRTCReceiver useEffect running')
    const init = async () => {
      console.log('🔄 init() function starting')
      try {
        // Verificar se Tauri está disponível
        if (typeof window === 'undefined') {
          console.error('❌ Window not available')
          setError('Window não está disponível')
          return
        }

        // Aguardar Tauri estar pronto e obter IP
        let localIp: string | null = null
        let retries = 0
        
        // Função para obter IP do Tauri de forma segura
        const getLocalIpFromTauri = async (): Promise<string | null> => {
          // Verificar se Tauri está disponível
          if (typeof window === 'undefined') {
            return null
          }

          // Verificar se Tauri está disponível
          if (!window.__TAURI__) {
            return null
          }

          try {
            // Importar dinamicamente para evitar erro se não estiver disponível
            const { invoke } = await import('@tauri-apps/api/core')
            return await invoke<string>('get_local_ip')
          } catch (err) {
            console.warn('⚠️ Failed to get IP from Tauri:', err)
            return null
          }
        }

        // Tentar obter IP do Tauri primeiro
        while (retries < 10 && !localIp) {
          try {
            const ip = await getLocalIpFromTauri()
            if (ip) {
              localIp = ip
              console.log('✅ Got IP from Tauri:', localIp)
              break
            }
          } catch (err) {
            // Ignorar erros, vamos tentar outras formas
          }
          
          retries++
          if (retries < 10) {
            console.log(`⏳ Waiting for Tauri... (${retries}/10)`)
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
        }

        // Se não conseguiu do Tauri, tentar detectar via WebRTC (para desenvolvimento)
        if (!localIp) {
          console.log('⚠️ Tauri not available, trying to detect IP via WebRTC...')
          try {
            // Usar WebRTC para detectar IP local (trickle ICE)
            const pc = new RTCPeerConnection({
              iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            })
            
            // Criar um data channel para forçar a coleta de ICE candidates
            pc.createDataChannel('')
            
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            
            // Aguardar ICE candidates
            await new Promise<void>((resolve) => {
              const timeout = setTimeout(() => {
                pc.close()
                resolve()
              }, 2000)
              
              pc.onicecandidate = (event) => {
                if (event.candidate) {
                  const candidate = event.candidate.candidate
                  // Extrair IP do candidate (formato: candidate:... IP PORT typ ...)
                  const match = candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
                  if (match && !match[1].startsWith('127.') && !match[1].startsWith('0.')) {
                    localIp = match[1]
                    console.log('✅ Detected local IP via WebRTC:', localIp)
                    clearTimeout(timeout)
                    pc.close()
                    resolve()
                  }
                }
              }
            })
          } catch (err) {
            console.warn('⚠️ Failed to detect IP via WebRTC:', err)
          }
        }

        // Se ainda não conseguiu, tentar IPs comuns da LAN
        if (!localIp) {
          console.warn('⚠️ Could not detect local IP automatically')
          
          // Tentar IPs comuns (192.168.1.x)
          const commonIPs = ['192.168.1.203', '192.168.1.1', '192.168.0.1']
          let foundIp = false
          
          for (const testIp of commonIPs) {
            try {
              const testUrl = `http://${testIp}:3000/desktop/receive`
              console.log(`🧪 Testing IP: ${testIp}`)
              const response = await fetch(testUrl, { 
                method: 'GET',
                signal: AbortSignal.timeout(2000) // 2 segundos timeout
              })
              if (response.ok) {
                localIp = testIp
                foundIp = true
                console.log(`✅ Found working IP: ${localIp}`)
                break
              }
            } catch (err) {
              // Continuar tentando outros IPs
              console.log(`❌ IP ${testIp} não acessível`)
            }
          }
          
          if (!foundIp) {
            console.warn('⚠️ Could not find working IP, using 192.168.1.203 as default')
            localIp = '192.168.1.203' // IP padrão conhecido
            setError('Não foi possível detectar o IP automaticamente. Usando 192.168.1.203. Se não funcionar, verifique o IP da máquina.')
          }
        }

        serverUrlRef.current = `http://${localIp}:3000`
        console.log('🔌 Signaling server URL:', serverUrlRef.current)
        console.log('📡 Desktop IP:', localIp)
        
        // Testar conectividade com o servidor
        try {
          const testUrl = `${serverUrlRef.current}/desktop/receive`
          console.log('🧪 Testing server connectivity:', testUrl)
          const testResponse = await fetch(testUrl, { method: 'GET' })
          if (testResponse.ok) {
            console.log('✅ Server is reachable!')
          } else {
            console.warn('⚠️ Server responded with status:', testResponse.status)
          }
        } catch (err) {
          console.error('❌ Cannot reach server:', err)
          console.error('💡 Make sure the Tauri backend is running and the signaling server is started')
          setError(`Não foi possível conectar ao servidor em ${serverUrlRef.current}. Verifique se o Tauri está rodando.`)
          return
        }
        
        console.log('🔄 Starting polling for signaling messages...')

        // Handler para processar mensagens de signaling
        const handleSignalingMessage = async (message: SignalingMessage) => {
          try {
            switch (message.type) {
              case 'offer':
                // Evitar processar múltiplos offers simultaneamente
                if (isProcessingOfferRef.current) {
                  console.warn('⚠️ Already processing an offer, skipping...')
                  return
                }

                isProcessingOfferRef.current = true
                console.log('📥 Processing offer...')

                // Fechar conexão anterior se existir
                if (peerConnectionRef.current) {
                  console.log('🔄 Closing previous peer connection')
                  peerConnectionRef.current.close()
                  peerConnectionRef.current = null
                  iceCandidateQueueRef.current = []
                }

                // Criar nova conexão
                const pc = new RTCPeerConnection(rtcConfiguration)
                peerConnectionRef.current = pc

                // Handler para receber stream remoto
                pc.ontrack = (event) => {
                  console.log('✅ Received remote track:', event.track.kind, event.track.id)
                  console.log('📹 Track state:', {
                    enabled: event.track.enabled,
                    readyState: event.track.readyState,
                    muted: event.track.muted,
                  })
                  if (event.streams && event.streams[0]) {
                    const stream = event.streams[0]
                    console.log('✅ Remote stream received:', {
                      id: stream.id,
                      tracks: stream.getTracks().map(t => ({
                        kind: t.kind,
                        id: t.id,
                        enabled: t.enabled,
                        readyState: t.readyState,
                      })),
                    })
                    setRemoteStream(stream)
                    console.log('✅ Remote stream set to state')
                  }
                }

                // Handler para ICE candidates
                pc.onicecandidate = (event) => {
                  if (event.candidate) {
                    sendSignalingMessage({
                      type: 'ice-candidate',
                      candidate: event.candidate.toJSON(),
                    })
                    console.log('📤 ICE candidate sent to mobile')
                  } else {
                    console.log('✅ All ICE candidates gathered')
                  }
                }

                // Handler para mudanças de estado
                pc.onconnectionstatechange = () => {
                  console.log('🔄 Connection state:', pc.connectionState)
                  if (pc.connectionState === 'connected') {
                    console.log('✅ WebRTC connected!')
                    setError(null)
                  } else if (pc.connectionState === 'connecting') {
                    console.log('🔄 WebRTC connecting...')
                  } else if (
                    pc.connectionState === 'failed' ||
                    pc.connectionState === 'disconnected'
                  ) {
                    console.error('❌ WebRTC connection failed:', pc.connectionState)
                    setError(`WebRTC connection ${pc.connectionState}`)
                  }
                }

                // Processar offer
                await pc.setRemoteDescription(
                  new RTCSessionDescription({
                    type: 'offer',
                    sdp: message.sdp,
                  }),
                )
                console.log('✅ Offer received and set as remote description')

                // Processar ICE candidates em fila
                while (iceCandidateQueueRef.current.length > 0) {
                  const candidate = iceCandidateQueueRef.current.shift()
                  if (candidate) {
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(candidate))
                      console.log('✅ Queued ICE candidate added')
                    } catch (err) {
                      console.warn('⚠️ Failed to add queued ICE candidate:', err)
                    }
                  }
                }

                // Criar e enviar answer
                const answer = await pc.createAnswer({
                  offerToReceiveVideo: true,
                  offerToReceiveAudio: false,
                })

                await pc.setLocalDescription(answer)
                console.log('✅ Answer created and set as local description')

                await sendSignalingMessage({
                  type: 'answer',
                  sdp: answer.sdp || '',
                })
                console.log('📤 Answer sent to mobile')

                isProcessingOfferRef.current = false
                break

              case 'ice-candidate':
                // Adicionar ICE candidate do mobile
                if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                  try {
                    await peerConnectionRef.current.addIceCandidate(
                      new RTCIceCandidate(message.candidate),
                    )
                    console.log('✅ ICE candidate received and added')
                  } catch (err) {
                    console.warn('⚠️ Failed to add ICE candidate:', err)
                    // Enfileirar se falhar
                    iceCandidateQueueRef.current.push(message.candidate)
                    console.log('📦 ICE candidate queued')
                  }
                } else {
                  // Enfileirar se ainda não tem remote description
                  iceCandidateQueueRef.current.push(message.candidate)
                  console.log('📦 ICE candidate queued (waiting for offer)')
                }
                break
            }
          } catch (err) {
            console.error('❌ Error handling signaling message:', err)
            if (err instanceof Error) {
              console.error('Error details:', err.message, err.stack)
            }
            isProcessingOfferRef.current = false
          }
        }

        // Função de polling
        let pollCount = 0
        const poll = async () => {
          if (!serverUrlRef.current) {
            console.warn('⚠️ No server URL, skipping poll')
            return
          }

          try {
            const url = `${serverUrlRef.current}/desktop/receive`
            pollCount++
            
            // Log a cada 10 polls para não poluir
            if (pollCount % 10 === 0) {
              console.log(`🔄 Polling for messages (attempt ${pollCount}) from:`, url)
            }
            
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            
            if (!response.ok) {
              console.warn('⚠️ Failed to fetch messages:', response.status, response.statusText)
              if (pollCount % 10 === 0) {
                console.warn('⚠️ Check if the signaling server is running on:', serverUrlRef.current)
              }
              return
            }

            const messages: SignalingMessage[] = await response.json()
            
            if (messages.length === 0) {
              if (pollCount % 20 === 0) {
                console.log('🔄 No messages yet, continuing to poll...')
                console.log('💡 Make sure the mobile app is sending messages to:', serverUrlRef.current)
              }
              return
            }

            console.log('📥 Received', messages.length, 'signaling message(s)')
            console.log('📋 Message types:', messages.map((m) => m.type))

            // Processar offer primeiro, depois ICE candidates
            const offers = messages.filter((m) => m.type === 'offer')
            const iceCandidates = messages.filter((m) => m.type === 'ice-candidate')

            console.log('📦 Found', offers.length, 'offer(s) and', iceCandidates.length, 'ICE candidate(s)')

            // Processar offers primeiro
            for (const message of offers) {
              console.log('🔄 Processing offer...')
              await handleSignalingMessage(message)
            }

            // Processar ICE candidates depois
            for (const message of iceCandidates) {
              console.log('🔄 Processing ICE candidate...')
              await handleSignalingMessage(message)
            }
          } catch (err) {
            console.error('❌ Error polling:', err)
            if (err instanceof Error) {
              console.error('Error details:', err.message, err.stack)
            }
          }
        }

        // Iniciar polling imediatamente e depois a cada 500ms
        poll() // Primeira chamada imediata
        pollingIntervalRef.current = setInterval(poll, 500) // Poll a cada 500ms
        console.log('✅ Polling started')
      } catch (err) {
        console.error('❌ Failed to initialize:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize')
      }
    }

    init()

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { remoteStream, error }
}
