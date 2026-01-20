import { ServerInfo } from '../preload';

export interface ElectronAPI {
  server: {
    start: (port?: number) => Promise<{
      success: boolean;
      info?: ServerInfo;
      error?: string;
    }>;
    stop: () => Promise<{ success: boolean }>;
    getInfo: () => Promise<{
      success: boolean;
      info?: ServerInfo;
    }>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
