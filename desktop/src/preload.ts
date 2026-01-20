import { contextBridge, ipcRenderer } from 'electron';

export interface ServerInfo {
  port: number;
  localIp: string;
  url: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  server: {
    start: (port?: number) => ipcRenderer.invoke('server:start', port),
    stop: () => ipcRenderer.invoke('server:stop'),
    getInfo: () => ipcRenderer.invoke('server:getInfo'),
  },
});
