# 📡 Guia de Implementação: WebSocket Streaming

Este documento descreve o passo a passo completo para implementar streaming de vídeo via WebSocket do mobile para o desktop.

## 📋 Visão Geral

**Fluxo:**
```
Mobile (React Native)
  ↓
Captura frame JPEG (100ms)
  ↓
WebSocket → ws://[IP_DESKTOP]:3000
  ↓
Desktop Rust (Tauri Backend)
  ↓
Servidor WebSocket recebe frame
  ↓
Broadcast para clientes conectados
  ↓
Desktop React (Frontend)
  ↓
Recebe frame via WebSocket
  ↓
Atualiza <img> com frame recebido
```

---

## 🦀 Parte 1: Backend Rust (Tauri)

### Passo 1.1: Adicionar Dependências

Editar `desktop/src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
axum = { version = "0.7", features = ["ws"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors"] }
```

**Explicação:**
- `tokio`: Runtime assíncrono para Rust
- `axum`: Framework web moderno com suporte WebSocket
- `tower-http`: Middleware para CORS (necessário para mobile conectar)

### Passo 1.2: Criar Estrutura de Dados

Editar `desktop/src-tauri/src/lib.rs`:

```rust
use axum::{
    extract::ws::{Message, WebSocket},
    routing::get,
    Router,
};
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use tower_http::cors::CorsLayer;

// Buffer compartilhado para o último frame
type FrameBuffer = Arc<Mutex<Option<Vec<u8>>>>;

// Canal de broadcast para múltiplos clientes
type FrameChannel = broadcast::Sender<Vec<u8>>;
```

**Explicação:**
- `FrameBuffer`: Armazena o último frame recebido (fallback)
- `FrameChannel`: Permite broadcast para múltiplos clientes WebSocket

### Passo 1.3: Implementar Handler WebSocket

```rust
async fn websocket_handler(
    ws: WebSocket,
    frame_tx: FrameChannel,
) {
    // Upgrade conexão para WebSocket
    let (mut sender, mut receiver) = ws.split();
    
    // Criar receiver para receber frames do canal
    let mut rx = frame_tx.subscribe();
    
    // Task para enviar frames ao cliente
    let mut send_task = tokio::spawn(async move {
        while let Ok(frame) = rx.recv().await {
            if sender.send(Message::Binary(frame)).await.is_err() {
                break;
            }
        }
    });
    
    // Task para receber mensagens do cliente (opcional)
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => break,
                _ => {}
            }
        }
    });
    
    // Aguardar uma das tasks terminar
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
```

### Passo 1.4: Implementar Endpoint para Receber Frames

```rust
async fn receive_frame(
    axum::extract::State(frame_tx): axum::extract::State<FrameChannel>,
    axum::body::Bytes(body): axum::body::Bytes,
) -> axum::response::Response {
    // Converter body para Vec<u8>
    let frame = body.to_vec();
    
    // Broadcast frame para todos os clientes WebSocket conectados
    let _ = frame_tx.send(frame);
    
    // Retornar resposta de sucesso
    axum::response::Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(r#"{"status":"ok"}"#.into())
        .unwrap()
}
```

### Passo 1.5: Criar Servidor HTTP com WebSocket

```rust
async fn start_streaming_server(frame_tx: FrameChannel) {
    // Configurar CORS para permitir conexões do mobile
    let cors = CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods(tower_http::cors::Any)
        .allow_headers(tower_http::cors::Any);
    
    // Criar router
    let app = Router::new()
        .route("/ws", get(websocket_handler))
        .route("/frame", axum::routing::post(receive_frame))
        .layer(cors)
        .with_state(frame_tx);
    
    // Iniciar servidor na porta 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind server");
    
    println!("🚀 Streaming server started on http://0.0.0.0:3000");
    
    axum::serve(listener, app)
        .await
        .expect("Server error");
}
```

### Passo 1.6: Integrar com Tauri

```rust
#[tauri::command]
async fn get_local_ip() -> Result<String, String> {
    // Descobrir IP local da máquina
    // Implementação usando crate `local-ip-address` ou similar
    Ok("192.168.1.205".to_string()) // Placeholder
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Criar canal de broadcast
    let (frame_tx, _) = broadcast::channel::<Vec<u8>>(100);
    
    // Iniciar servidor em background
    let server_tx = frame_tx.clone();
    tokio::spawn(async move {
        start_streaming_server(server_tx).await;
    });
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_local_ip])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 📱 Parte 2: Mobile (React Native)

### Passo 2.1: Instalar Dependência WebSocket

```bash
cd mobile
yarn add react-native-websocket
# ou
yarn add @react-native-community/netinfo  # Para descobrir IP
```

### Passo 2.2: Criar Hook useWebSocketStreaming

Criar `mobile/src/hooks/useWebSocketStreaming.tsx`:

```typescript
import { useState, useRef, useCallback, useEffect } from 'react';

const DEFAULT_SERVER_URL = 'ws://192.168.1.205:3000/ws';

export function useWebSocketStreaming() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Já conectado
    }

    try {
      const ws = new WebSocket(serverUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        setIsConnected(false);
        
        // Tentar reconectar se estava streaming
        if (isStreaming) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, 2000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('❌ Failed to create WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [serverUrl, isStreaming]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendFrame = useCallback(
    async (frame: Uint8Array) => {
      if (!isStreaming || !isConnected) {
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(frame.buffer);
          console.log('📤 Frame sent via WebSocket, size:', frame.length);
        } catch (err) {
          console.error('❌ Error sending frame:', err);
          setError(err instanceof Error ? err.message : 'Send error');
        }
      } else {
        console.warn('⚠️ WebSocket not open, frame dropped');
      }
    },
    [isStreaming, isConnected],
  );

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    disconnect();
  }, [disconnect]);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    serverUrl,
    setServerUrl,
    isStreaming,
    isConnected,
    startStreaming,
    stopStreaming,
    sendFrame,
    error,
  };
}
```

### Passo 2.3: Atualizar Componente Cam

Editar `mobile/src/components/Cam.tsx`:

```typescript
// Trocar import
import { useWebSocketStreaming } from '../hooks/useWebSocketStreaming'

// No componente
const { isStreaming, startStreaming, stopStreaming, sendFrame, isConnected } =
  useWebSocketStreaming()

// O resto do código permanece igual
// A função sendFrame já funciona com WebSocket
```

---

## 🖥️ Parte 3: Frontend Desktop (React)

### Passo 3.1: Criar Hook useWebSocketFrame

Criar `desktop/src/hooks/useWebSocketFrame.tsx`:

```typescript
import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useWebSocketFrame() {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = async () => {
    try {
      // Obter IP local do Tauri
      const localIp = await invoke<string>('get_local_ip');
      const wsUrl = `ws://${localIp}:3000/ws`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected to desktop server');
        setIsConnected(true);
        setError(null);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        // Receber frame binário
        const blob = new Blob([event.data], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        
        // Limpar URL anterior
        if (frameUrl) {
          URL.revokeObjectURL(frameUrl);
        }
        
        setFrameUrl(url);
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        setIsConnected(false);
        
        // Tentar reconectar
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 2000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('❌ Failed to create WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (frameUrl) {
        URL.revokeObjectURL(frameUrl);
      }
    };
  }, []);

  return { frameUrl, isConnected, error };
}
```

### Passo 3.2: Atualizar Componente Cam

Editar `desktop/src/components/Cam.tsx`:

```typescript
import { useWebSocketFrame } from '@/hooks/useWebSocketFrame'

export function Cam() {
  const { frameUrl, isConnected } = useWebSocketFrame();
  // ... resto do código

  return (
    <div className="flex h-full w-full flex-col items-center bg-[#121214] pt-8">
      <div className="aspect-square max-h-[400px] w-[90%] max-w-[400px] overflow-hidden rounded-xl bg-black">
        {frameUrl ? (
          <img
            src={frameUrl}
            alt="Camera stream"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            {isConnected ? 'Aguardando frames...' : 'Conectando...'}
          </div>
        )}
      </div>
      {/* ... botões ... */}
    </div>
  );
}
```

---

## 🔧 Parte 4: Descobrir IP Local Automaticamente

### Passo 4.1: Adicionar Crate para IP

Editar `desktop/src-tauri/Cargo.toml`:

```toml
[dependencies]
# ... outras dependências
local-ip-address = "0.5"
```

### Passo 4.2: Implementar Comando Tauri

```rust
#[tauri::command]
async fn get_local_ip() -> Result<String, String> {
    local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .map_err(|e| format!("Failed to get local IP: {}", e))
}
```

### Passo 4.3: Mostrar IP na Interface

No componente Cam do desktop, adicionar:

```typescript
const [localIp, setLocalIp] = useState<string>('');

useEffect(() => {
  invoke<string>('get_local_ip').then(setLocalIp);
}, []);

// Mostrar IP para configurar no mobile
{localIp && (
  <div className="mt-2 text-xs text-gray-400">
    IP: {localIp}:3000
  </div>
)}
```

---

## ✅ Checklist de Implementação

### Backend Rust
- [ ] Adicionar dependências no `Cargo.toml`
- [ ] Criar estrutura de dados (FrameBuffer, FrameChannel)
- [ ] Implementar handler WebSocket
- [ ] Implementar endpoint POST /frame
- [ ] Criar servidor HTTP com WebSocket
- [ ] Integrar com Tauri (iniciar servidor em background)
- [ ] Implementar comando `get_local_ip`

### Mobile
- [ ] Instalar dependência WebSocket
- [ ] Criar hook `useWebSocketStreaming`
- [ ] Atualizar componente Cam para usar WebSocket
- [ ] Testar conexão e envio de frames

### Frontend Desktop
- [ ] Criar hook `useWebSocketFrame`
- [ ] Atualizar componente Cam para exibir frames
- [ ] Adicionar indicador de conexão
- [ ] Mostrar IP local na interface

### Testes
- [ ] Testar conexão mobile → desktop
- [ ] Testar envio de frames
- [ ] Testar exibição de vídeo
- [ ] Testar reconexão automática
- [ ] Testar múltiplos clientes (se necessário)

---

## 🐛 Troubleshooting

### Erro: "Failed to bind server"
- Verificar se porta 3000 está disponível
- Verificar permissões de firewall

### Erro: "WebSocket connection failed"
- Verificar IP local está correto
- Verificar mobile e desktop na mesma rede
- Verificar firewall não bloqueia porta 3000

### Frames não aparecem
- Verificar console do mobile (frames sendo enviados?)
- Verificar console do desktop (frames sendo recebidos?)
- Verificar WebSocket está conectado (isConnected === true)

---

## 📚 Recursos

- [Axum WebSocket](https://docs.rs/axum/latest/axum/extract/ws/index.html)
- [Tokio Broadcast Channel](https://docs.rs/tokio/latest/tokio/sync/broadcast/index.html)
- [Tauri Commands](https://tauri.app/v1/guides/features/command)
