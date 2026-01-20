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
