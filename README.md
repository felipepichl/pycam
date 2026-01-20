# 🎥 PYCam - Webcam Mobile App

App React Native para transformar o celular em webcam, similar ao Irium Webcam.

## 📋 Estrutura do Projeto

```
pycam/
├── mobile/          # App React Native (Expo)
├── desktop/         # App Electron com servidor HTTP interno
└── backend/         # Backend Node.js (opcional, não necessário)
```

## 🚀 Início Rápido

### Mobile

```bash
cd mobile
yarn install
yarn start
```

### Desktop

```bash
cd desktop
yarn install
yarn dev
```

## 📱 Mobile App

App React Native com Expo que captura frames da câmera e envia para o desktop.

**Tecnologias:**
- React Native + Expo
- react-native-vision-camera
- react-native-reanimated
- TypeScript

**Documentação:** Veja [mobile/README.md](./mobile/README.md)

## 🖥️ Desktop App

App Electron que recebe o stream do mobile diretamente, sem necessidade de backend separado.

**Tecnologias:**
- Electron
- TypeScript
- Node.js HTTP (servidor interno)

**Documentação:** Veja [desktop/README.md](./desktop/README.md)

## 📚 Documentação

- [PASSO_A_PASSO.md](./PASSO_A_PASSO.md) - Guia completo de setup
- [WEBCAM_SETUP.md](./WEBCAM_SETUP.md) - Arquitetura e implementação

## 🔧 Tecnologias

- **Mobile:** React Native, Expo, TypeScript
- **Desktop:** Electron, TypeScript, Node.js
- **Streaming:** HTTP MJPEG

## 📝 Licença

MIT
