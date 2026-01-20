import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { streamingServer } from './services/streamingServer';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'PYCam Desktop',
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // Load the HTML file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.handle('server:start', async (_event, port?: number) => {
  try {
    const info = await streamingServer.start(port);
    return { success: true, info };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('server:stop', () => {
  streamingServer.stop();
  return { success: true };
});

ipcMain.handle('server:getInfo', () => {
  const info = streamingServer.getServerInfo();
  return info ? { success: true, info } : { success: false };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  streamingServer.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  streamingServer.stop();
});
