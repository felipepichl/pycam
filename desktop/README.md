# PYCam Desktop App

Aplicativo Electron que recebe o stream de vídeo do mobile diretamente, sem necessidade de backend separado.

## 🚀 Como usar

### 1. Instalar dependências

```bash
cd desktop
yarn install
```

**Nota:** O projeto usa Yarn com `node-modules` (não PnP) para compatibilidade com Electron. Se você tiver problemas, remova os arquivos PnP e reinstale:

```bash
rm -rf .pnp.* .yarn node_modules
yarn install
```

### 2. Compilar e iniciar aplicativo

```bash
yarn start
```

Ou em modo desenvolvimento (com DevTools):

```bash
yarn dev
```

### 3. Conectar o mobile

1. Abra o app desktop
2. Clique em "Iniciar Servidor"
3. O app mostrará o IP e porta do servidor (ex: `http://192.168.1.100:3000`)
4. Copie essa URL e configure no app mobile
5. O vídeo do mobile aparecerá automaticamente na tela

## 🏗️ Estrutura do Projeto

```
desktop/
├── src/
│   ├── @types/          # Definições de tipos TypeScript
│   ├── services/        # Serviços (servidor HTTP interno)
│   ├── scripts/         # Scripts do frontend (TypeScript)
│   ├── styles/          # Estilos CSS
│   ├── main.ts          # Processo principal do Electron
│   ├── preload.ts       # Preload script (bridge IPC)
│   └── index.html       # HTML principal
├── dist/                # Arquivos compilados (gerado)
├── tsconfig.json        # Configuração TypeScript
├── .eslintrc.json       # Configuração ESLint
└── package.json
```

## 📝 Scripts Disponíveis

```bash
yarn build      # Compila TypeScript e copia arquivos estáticos
yarn start      # Compila e inicia o app
yarn dev        # Compila e inicia com DevTools
yarn watch      # Compila TypeScript em modo watch
yarn lint       # Executa ESLint
yarn build:app  # Cria build de distribuição
```

## 🔧 Tecnologias

- **Electron** - Framework desktop
- **TypeScript** - Tipagem estática
- **ESLint** - Linter (mesma config do mobile)
- **Node.js HTTP** - Servidor HTTP interno

## 📡 Como Funciona

1. **Desktop cria servidor HTTP interno** na porta 3000 (ou outra disponível)
2. **Mobile conecta diretamente** no IP do desktop via HTTP POST `/frame`
3. **Desktop recebe frames** e exibe via stream MJPEG em `/stream`
4. **Interface mostra IP/porta** para facilitar configuração no mobile

## 🎬 Próximos Passos

Para usar como webcam virtual no macOS:

1. **Instalar OBS Studio** (gratuito)
2. **Instalar OBS Virtual Camera plugin**
3. **Configurar OBS para capturar a janela do PYCam Desktop**
4. **Ativar OBS Virtual Camera**
5. **Selecionar "OBS Virtual Camera" como webcam em apps (Zoom, Teams, etc)**

## 🔍 Desenvolvimento

O projeto segue o mesmo padrão do mobile:
- TypeScript estrito
- ESLint com mesma configuração
- Estrutura de pastas organizada
- Path aliases configurados
