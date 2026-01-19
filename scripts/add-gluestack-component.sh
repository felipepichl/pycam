#!/bin/bash

# Script helper para adicionar componentes do gluestack-ui na pasta correta
# Uso: ./scripts/add-gluestack-component.sh <component-name>
# Exemplo: ./scripts/add-gluestack-component.sh skeleton

COMPONENT_NAME=$1

if [ -z "$COMPONENT_NAME" ]; then
  echo "❌ Erro: Nome do componente não fornecido"
  echo "Uso: yarn gluestack:add <component-name>"
  echo "Exemplo: yarn gluestack:add skeleton"
  exit 1
fi

echo "📦 Adicionando componente '$COMPONENT_NAME' do gluestack-ui..."
echo "📍 Caminho: src/components/ui"

npx gluestack-ui@latest add "$COMPONENT_NAME" --path src/components/ui

if [ $? -eq 0 ]; then
  echo "✅ Componente '$COMPONENT_NAME' adicionado com sucesso em src/components/ui/"
else
  echo "❌ Erro ao adicionar o componente '$COMPONENT_NAME'"
  exit 1
fi


