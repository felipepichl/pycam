# PYCam - Webcam Mobile App

App React Native para transformar o celular em webcam, similar ao Irium Webcam.

## 🚀 Development Build (Custom Development Client)

Este projeto usa **Development Build** ao invés do Expo Go tradicional, pois requer código nativo (`react-native-vision-camera`).

### Como funciona

O Development Build é como um "Expo Go customizado" que:
- ✅ Funciona igual ao Expo Go (conecta via QR code, hot reload, etc)
- ✅ Suporta bibliotecas nativas (como react-native-vision-camera)
- ✅ Permite desenvolvimento rápido com todas as funcionalidades do Expo

### 📱 Primeira vez - Criar o Development Build (Android)

#### Pré-requisitos

- Node.js instalado
- Yarn ou npm instalado
- Android Studio instalado (opcional, apenas se quiser usar emulador local)

#### Passo a passo

1. **Instalar EAS CLI** (se ainda não tiver):
```bash
npm install -g eas-cli
```

2. **Fazer login no Expo**:
```bash
eas login
```
   - Se não tiver conta, crie em: https://expo.dev/signup

3. **Instalar dependências do projeto**:
```bash
yarn install
```

4. **Criar Development Build para Android**:
```bash
yarn build:dev:android
```
   - O EAS vai compilar na nuvem
   - Você receberá um link para download do APK
   - Baixe e instale no seu dispositivo Android
   - Ou use o emulador do Android Studio

5. **Instalar o app no dispositivo**:
   - Baixe o APK do link fornecido pelo EAS
   - No Android, pode precisar habilitar "Fontes desconhecidas" nas configurações
   - Instale o APK no seu dispositivo ou emulador
   - **Importante**: Este app é o seu "Expo Go customizado"

### 🔄 Desenvolvimento diário (após o primeiro build)

Após instalar o Development Build uma vez, você usa normalmente:

1. **Iniciar o servidor Expo**:
```bash
yarn start
```

2. **Conectar o app**:
   - Abra o app "PYCam" (Development Build) no seu dispositivo Android
   - O QR code aparece no terminal, escaneie com o app
   - Ou pressione `a` no terminal para abrir automaticamente no Android

3. **Desenvolver normalmente**:
   - Hot reload funciona normalmente
   - Fast refresh funciona normalmente
   - É igual ao Expo Go!
   - Mudanças no código aparecem instantaneamente

### 💡 Dicas para Android

**Android Emulador:**
- Se tiver Android Studio, pode usar o emulador Android
- Certifique-se de que o emulador está rodando antes de iniciar
- Pressione `a` no terminal após `yarn start` para abrir automaticamente

**Dispositivo Físico:**
- Conecte via USB e habilite depuração USB nas opções de desenvolvedor
- Certifique-se de que o dispositivo está autorizado para depuração USB

### 📦 Scripts disponíveis

```bash
# Desenvolvimento
yarn start                    # Inicia o servidor Expo
yarn build:dev:android        # Cria Development Build para Android

# Preview (teste antes de produção)
yarn build:preview:android   # Build de preview Android

# Produção
yarn build:prod:android       # Build de produção Android
```

### ⚠️ Quando recriar o Development Build

Você só precisa recriar o Development Build quando:
- Adicionar uma nova biblioteca nativa
- Alterar configurações nativas (permissões, plugins, etc)
- Atualizar versões de dependências nativas

Para mudanças no código JavaScript/TypeScript, o hot reload funciona normalmente!

### 🔧 Tecnologias

- **React Native** com **Expo**
- **react-native-vision-camera** - Captura de vídeo
- **react-native-permissions** - Gerenciamento de permissões
- **Gluestack UI** - Componentes de UI

### 📝 Notas

- O Development Build precisa ser criado apenas uma vez (ou quando houver mudanças nativas)
- Após instalado, funciona exatamente como Expo Go
- Não funciona com Expo Go tradicional (precisa do build customizado)
