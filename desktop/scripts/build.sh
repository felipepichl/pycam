#!/bin/bash
# Script para build do Tauri com Rust no PATH

# Carrega o ambiente do Rust se existir
if [ -f "$HOME/.cargo/env" ]; then
  source "$HOME/.cargo/env"
fi

# Executa o comando Tauri
exec yarn tauri build "$@"
