# 🎥 Guia: Usar PYCam como Webcam no macOS

## 📋 Visão Geral

Para usar o app mobile como webcam no macOS, precisamos de 3 componentes:

1. **Mobile App** (já existe) - Captura vídeo da câmera
2. **Backend Node.js** - Recebe stream do mobile e retransmite
3. **Desktop App (Electron)** - Exibe o vídeo e cria webcam virtual

## 🏗️ Arquitetura

```
[Mobile App] --WebSocket--> [Backend Node.js] --HTTP Stream--> [Electron Desktop] --Virtual Camera--> [macOS Apps]
```

## 📦 Passo a Passo

### 1. Backend Node.js (Servidor WebSocket + HTTP Stream)

**Localização:** `/tasks/backend/`

**Tecnologias:**
- Node.js + Express
- Socket.io ou ws (WebSocket)
- ffmpeg (para processar vídeo)

**Função:**
- Receber frames de vídeo do mobile via WebSocket
- Retransmitir via HTTP stream (MJPEG ou HLS)
- Gerenciar conexões

### 2. Desktop App Electron

**Localização:** `/tasks/desktop/`

**Tecnologias:**
- Electron
- React ou HTML/CSS/JS simples
- node-ffmpeg ou similar para criar webcam virtual

**Função:**
- Conectar ao backend e receber stream
- Exibir preview do vídeo
- Criar webcam virtual no macOS (usando OBS Virtual Camera ou similar)

### 3. Modificações no Mobile App

**Arquivo:** `mobile/src/components/Cam.tsx`

**Mudanças necessárias:**
- Capturar frames da câmera usando `react-native-vision-camera`
- Enviar frames via WebSocket para o backend
- Adicionar input para IP do servidor

## 🚀 Implementação Rápida (Solução Simples)

### Opção 1: HTTP Stream Simples (Mais fácil)

1. **Backend:** Servidor HTTP que recebe frames via POST e serve via MJPEG stream
2. **Desktop:** App Electron que acessa o stream HTTP e usa OBS Virtual Camera
3. **Mobile:** Envia frames JPEG via HTTP POST

### Opção 2: WebRTC (Melhor performance, mais complexo)

1. **Backend:** Servidor WebRTC (STUN/TURN)
2. **Desktop:** Cliente WebRTC que recebe stream e cria webcam virtual
3. **Mobile:** Cliente WebRTC que envia stream

## 📝 Próximos Passos

1. ✅ Criar estrutura de pastas
2. ⏳ Implementar backend Node.js
3. ⏳ Implementar desktop Electron
4. ⏳ Modificar mobile para enviar stream
5. ⏳ Configurar webcam virtual no macOS
6. ⏳ Testar integração completa

## 🔧 Dependências Necessárias

### Backend:
- `express` - Servidor HTTP
- `ws` ou `socket.io` - WebSocket
- `ffmpeg` - Processamento de vídeo (opcional)

### Desktop:
- `electron` - Framework desktop
- `obs-studio` ou `v4l2loopback` - Webcam virtual (macOS tem alternativas)

### Mobile:
- `react-native-vision-camera` - ✅ Já instalado
- `socket.io-client` ou `ws` - WebSocket client

## 💡 Nota sobre Webcam Virtual no macOS

No macOS, criar uma webcam virtual é mais complexo que no Linux. Opções:

1. **OBS Virtual Camera** (Recomendado)
   - Instalar OBS Studio
   - Usar OBS Virtual Camera plugin
   - App Electron envia stream para OBS

2. **Syphon** (Alternativa)
   - Framework macOS para compartilhar frames
   - Mais técnico, requer conhecimento nativo

3. **CamTwist** (Antigo, pode não funcionar em versões recentes)

**Recomendação:** Começar com OBS Virtual Camera, é a solução mais estável.
