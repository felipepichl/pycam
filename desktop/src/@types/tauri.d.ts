// Tipos para Tauri API
declare global {
  interface Window {
    __TAURI__: {
      core: {
        invoke: <T = unknown>(
          cmd: string,
          args?: Record<string, unknown>,
        ) => Promise<T>
      }
    }
  }
}

export {}
