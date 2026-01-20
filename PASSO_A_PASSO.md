# 🎥 Passo a Passo: Usar PYCam como Webcam no macOS

## 📋 Pré-requisitos

1. **Node.js** instalado (v18 ou superior)
2. **OBS Studio** instalado no macOS (para webcam virtual)
3. **App mobile** rodando no dispositivo Android
4. **Mac e Android na mesma rede Wi-Fi**

## 🚀 Passo 1: Configurar o Backend

### 1.1 Instalar dependências

```bash
cd /Users/felipepichl/www/triadge/tasks/backend
npm install
```

### 1.2 Iniciar servidor

```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

**Importante:** Anote o IP local do seu Mac (ex: `192.168.1.100`). Você pode descobrir com:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 🖥️ Passo 2: Configurar Desktop App

### 2.1 Instalar dependências

```bash
cd /Users/felipepichl/www/triadge/tasks/desktop
npm install
```

### 2.2 Iniciar app Electron

```bash
npm start
```

### 2.3 Conectar ao servidor

1. No app Electron, configure o IP do servidor (use o IP local do Mac, não `localhost`)
2. Clique em "Conectar"
3. Você verá o stream quando o mobile começar a enviar frames

## 📱 Passo 3: Configurar App Mobile

### 3.1 Adicionar dependências (se necessário)

```bash
cd /Users/felipepichl/www/triadge/tasks/mobile
yarn add react-native-reanimated
```

### 3.2 Configurar IP do servidor

No app mobile, você precisará configurar o IP do servidor backend. Por enquanto, vamos usar uma solução simples:

1. **Descobrir IP do Mac na rede local** (ex: `192.168.1.100`)
2. **No Android Emulator:** Use `10.0.2.2` ao invés de `localhost`
3. **No dispositivo físico:** Use o IP local do Mac (ex: `192.168.1.100`)

### 3.3 Modificar código para enviar frames

O código já está preparado, mas precisa de ajustes finos. Veja a seção "Implementação Mobile" abaixo.

## 🎬 Passo 4: Configurar OBS Virtual Camera

### 4.1 Instalar OBS Studio

```bash
brew install --cask obs
```

Ou baixe de: https://obsproject.com/

### 4.2 Instalar OBS Virtual Camera

OBS Virtual Camera já vem incluído no OBS Studio (versões recentes).

### 4.3 Configurar OBS

1. Abra OBS Studio
2. Adicione uma nova "Source" → "Window Capture"
3. Selecione a janela do "PYCam Desktop"
4. Clique com botão direito na Source → "Transform" → "Fit to Screen"
5. Vá em "Tools" → "Start Virtual Camera"
6. OBS Virtual Camera agora está ativo!

## ✅ Passo 5: Usar como Webcam

Agora você pode usar "OBS Virtual Camera" como webcam em qualquer app:

- **Zoom:** Settings → Video → Camera → "OBS Virtual Camera"
- **Teams:** Settings → Devices → Camera → "OBS Virtual Camera"
- **Chrome/Apps Web:** Permissão de câmera → "OBS Virtual Camera"

## 🔧 Troubleshooting

### Backend não recebe frames

- Verifique se o servidor está rodando: `curl http://localhost:3000/health`
- Verifique firewall do Mac
- Confirme que mobile e Mac estão na mesma rede

### Desktop não mostra vídeo

- Verifique se o IP está correto (não use `localhost` se estiver em rede)
- Verifique console do Electron (DevTools)
- Teste o stream diretamente no navegador: `http://SEU_IP:3000/stream`

### OBS não captura a janela

- Certifique-se de que a janela do PYCam Desktop está visível
- Tente "Display Capture" ao invés de "Window Capture"
- Reinicie OBS

## 📝 Próximas Melhorias

- [ ] Interface no mobile para configurar IP do servidor
- [ ] Implementar WebRTC para melhor performance
- [ ] Adicionar autenticação
- [ ] Suportar múltiplos clientes
- [ ] Compressão de vídeo
