import http, { IncomingMessage, ServerResponse } from 'http';
import { networkInterfaces } from 'os';

export interface ServerInfo {
  port: number;
  localIp: string;
  url: string;
}

class StreamingServer {
  private server: http.Server | null = null;
  private latestFrame: Buffer | null = null;
  private frameCount = 0;
  private port = 3000;
  private localIp = 'localhost';

  start(port = 3000): Promise<ServerInfo> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        reject(new Error('Server already running'));
        return;
      }

      this.port = port;
      this.localIp = this.getLocalIp();

      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.listen(port, '0.0.0.0', () => {
        console.log(`🚀 PYCam Server running on http://${this.localIp}:${this.port}`);
        console.log(`📡 Frame endpoint: POST http://${this.localIp}:${this.port}/frame`);
        console.log(`📺 Stream endpoint: GET http://${this.localIp}:${this.port}/stream`);
        console.log(`💚 Health check: GET http://${this.localIp}:${this.port}/health`);

        resolve({
          port: this.port,
          localIp: this.localIp,
          url: `http://${this.localIp}:${this.port}`,
        });
      });

      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(error);
        }
      });
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.latestFrame = null;
      this.frameCount = 0;
      console.log('🛑 PYCam Server stopped');
    }
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const { method, url } = req;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (method === 'POST' && url === '/frame') {
      this.handleFramePost(req, res);
      return;
    }

    if (method === 'GET' && url === '/stream') {
      this.handleStreamGet(req, res);
      return;
    }

    if (method === 'GET' && url === '/health') {
      this.handleHealthGet(req, res);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  }

  private handleFramePost(req: IncomingMessage, res: ServerResponse): void {
    const chunks: Buffer[] = [];
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    console.log(`📥 Receiving frame, Content-Length: ${contentLength}`);

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const frameBuffer = Buffer.concat(chunks);
        this.latestFrame = frameBuffer;
        this.frameCount++;

        console.log(`📸 Frame received #${this.frameCount}, size: ${frameBuffer.length} bytes`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            frameCount: this.frameCount,
            frameSize: frameBuffer.length,
          }),
        );
      } catch (error) {
        console.error('Error receiving frame:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to receive frame' }));
      }
    });

    req.on('error', (error: Error) => {
      console.error('Request error:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    });
  }

  private handleStreamGet(_req: IncomingMessage, res: ServerResponse): void {
    console.log('📺 Client connected to stream');
    console.log(`📊 Current frame status: hasFrame=${this.latestFrame !== null}, count=${this.frameCount}`);

    // Set headers for MJPEG stream
    res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--frame');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Pragma', 'no-cache');

    let frameSent = false;

    // Send frames periodically
    const interval = setInterval(() => {
      if (this.latestFrame) {
        try {
          const frame = Buffer.from(this.latestFrame);
          res.write(`--frame\r\n`);
          res.write(`Content-Type: image/jpeg\r\n`);
          res.write(`Content-Length: ${frame.length}\r\n\r\n`);
          res.write(frame);
          res.write(`\r\n`);
          
          if (!frameSent) {
            console.log('✅ First frame sent to client');
            frameSent = true;
          }
        } catch (error) {
          console.error('Error sending frame to client:', error);
        }
      } else if (!frameSent) {
        // Send a placeholder message on first connection if no frames yet
        console.log('⏳ Waiting for frames from mobile...');
      }
    }, 33); // ~30 FPS (1000ms / 30 = 33ms) para vídeo suave

    // Cleanup on client disconnect
    _req.on('close', () => {
      console.log('📺 Client disconnected from stream');
      clearInterval(interval);
    });
  }

  private handleHealthGet(_req: IncomingMessage, res: ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        framesReceived: this.frameCount,
        hasFrame: this.latestFrame !== null,
      }),
    );
  }

  private getLocalIp(): string {
    const interfaces = networkInterfaces();
    const addresses: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const nets = interfaces[name];
      if (!nets) continue;

      for (const net of nets) {
        // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      }
    }

    return addresses[0] || 'localhost';
  }

  getServerInfo(): ServerInfo | null {
    if (!this.server) {
      return null;
    }

    return {
      port: this.port,
      localIp: this.localIp,
      url: `http://${this.localIp}:${this.port}`,
    };
  }
}

export const streamingServer = new StreamingServer();
