# Desktop App - Tauri

Aplicação desktop criada com Tauri 2.0.

## 🚀 Configuração Inicial

### 1. Configurar Rust no PATH (Importante!)

O Rust precisa estar no PATH do seu shell. Adicione ao seu arquivo de configuração do shell:

**Para Fish (padrão no macOS):**
```bash
# Adicione ao ~/.config/fish/config.fish
set -gx PATH $HOME/.cargo/bin $PATH
```

**Para Bash/Zsh:**
```bash
# Adicione ao ~/.bashrc ou ~/.zshrc
export PATH="$HOME/.cargo/bin:$PATH"
```

Ou carregue manualmente antes de rodar:
```bash
source $HOME/.cargo/env
```

### 2. Instalar Dependências

```bash
yarn install
```

## 🏃 Desenvolvimento

```bash
yarn dev
```

Isso vai:
- Carregar o ambiente Rust automaticamente
- Compilar o backend Rust
- Iniciar a aplicação em modo desenvolvimento

## 📦 Build

```bash
yarn build
```

## 📁 Estrutura

```
desktop/
├── src/              # Frontend (HTML/CSS/JS)
├── src-tauri/        # Backend Rust
└── scripts/          # Scripts auxiliares
```

## ⚠️ Troubleshooting

### Erro: "No such file or directory (os error 2)"

Isso significa que o Rust não está no PATH. Soluções:

1. **Solução temporária:**
   ```bash
   source $HOME/.cargo/env
   yarn tauri dev
   ```

2. **Solução permanente:**
   Adicione o Rust ao PATH no seu arquivo de configuração do shell (veja acima).

3. **Usar os scripts:**
   Os scripts em `scripts/` já carregam o Rust automaticamente:
   ```bash
   yarn dev  # Usa scripts/dev.sh que carrega o Rust
   ```
