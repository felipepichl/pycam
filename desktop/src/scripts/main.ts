let streamInterval: NodeJS.Timeout | null = null;
let isConnected = false;
let serverUrl = '';

async function startServer(): Promise<void> {
  const startBtn = document.getElementById('startServerBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stopServerBtn') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLSpanElement;
  const serverInfoEl = document.getElementById('serverInfo') as HTMLDivElement;
  const serverUrlEl = document.getElementById('serverUrl') as HTMLSpanElement;

  try {
    startBtn.disabled = true;

    const result = await window.electronAPI.server.start();

    if (result.success && result.info) {
      serverUrl = result.info.url;
      serverUrlEl.textContent = serverUrl;
      const serverFrameUrlEl = document.getElementById('serverFrameUrl') as HTMLSpanElement;
      if (serverFrameUrlEl) {
        serverFrameUrlEl.textContent = `${serverUrl}/frame`;
      }
      serverInfoEl.style.display = 'flex';
      startBtn.disabled = true;
      stopBtn.disabled = false;
      statusEl.textContent = 'Servidor Ativo';
      statusEl.className = 'status connected';

      // Auto-connect to stream
      connectStream();
    } else {
      alert(`Erro ao iniciar servidor: ${result.error || 'Erro desconhecido'}`);
      startBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error starting server:', error);
    alert('Erro ao iniciar servidor');
    startBtn.disabled = false;
  }
}

async function stopServer(): Promise<void> {
  const startBtn = document.getElementById('startServerBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stopServerBtn') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLSpanElement;
  const serverInfoEl = document.getElementById('serverInfo') as HTMLDivElement;

  try {
    await window.electronAPI.server.stop();
    disconnectStream();

    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusEl.textContent = 'Desconectado';
    statusEl.className = 'status disconnected';
    serverInfoEl.style.display = 'none';
    serverUrl = '';
  } catch (error) {
    console.error('Error stopping server:', error);
  }
}

function connectStream(): void {
  if (!serverUrl) {
    return;
  }

  const streamUrl = `${serverUrl}/stream`;
  const videoEl = document.getElementById('videoStream') as HTMLImageElement;
  const noStreamEl = document.getElementById('noStream') as HTMLDivElement;

  console.log('Connecting to:', streamUrl);

  videoEl.src = streamUrl;
  videoEl.onload = () => {
    console.log('Stream connected');
    isConnected = true;
    videoEl.style.display = 'block';
    noStreamEl.style.display = 'none';
  };

  videoEl.onerror = (error) => {
    console.error('Stream error:', error);
    isConnected = false;
    videoEl.style.display = 'none';
    noStreamEl.style.display = 'block';
  };
}

function disconnectStream(): void {
  const videoEl = document.getElementById('videoStream') as HTMLImageElement;
  const noStreamEl = document.getElementById('noStream') as HTMLDivElement;

  videoEl.src = '';
  isConnected = false;
  videoEl.style.display = 'none';
  noStreamEl.style.display = 'block';

  if (streamInterval) {
    clearInterval(streamInterval);
    streamInterval = null;
  }
}

function copyServerUrl(): void {
  if (serverUrl) {
    navigator.clipboard.writeText(serverUrl);
    const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1000);
  }
}

function copyFrameUrl(): void {
  if (serverUrl) {
    const frameUrl = `${serverUrl}/frame`;
    navigator.clipboard.writeText(frameUrl);
    const copyBtn = document.getElementById('copyFrameBtn') as HTMLButtonElement;
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1000);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startServerBtn');
  const stopBtn = document.getElementById('stopServerBtn');
  const copyBtn = document.getElementById('copyBtn');
  const copyFrameBtn = document.getElementById('copyFrameBtn');

  startBtn?.addEventListener('click', startServer);
  stopBtn?.addEventListener('click', stopServer);
  copyBtn?.addEventListener('click', copyServerUrl);
  copyFrameBtn?.addEventListener('click', copyFrameUrl);

  // Check if server is already running
  window.electronAPI.server.getInfo().then((result) => {
    if (result.success && result.info) {
      serverUrl = result.info.url;
      const serverUrlEl = document.getElementById('serverUrl') as HTMLSpanElement;
      const serverFrameUrlEl = document.getElementById('serverFrameUrl') as HTMLSpanElement;
      const serverInfoEl = document.getElementById('serverInfo') as HTMLDivElement;
      const startBtn = document.getElementById('startServerBtn') as HTMLButtonElement;
      const stopBtn = document.getElementById('stopServerBtn') as HTMLButtonElement;
      const statusEl = document.getElementById('status') as HTMLSpanElement;

      serverUrlEl.textContent = serverUrl;
      if (serverFrameUrlEl) {
        serverFrameUrlEl.textContent = `${serverUrl}/frame`;
      }
      serverInfoEl.style.display = 'flex';
      startBtn.disabled = true;
      stopBtn.disabled = false;
      statusEl.textContent = 'Servidor Ativo';
      statusEl.className = 'status connected';
      connectStream();
    }
  });
});
