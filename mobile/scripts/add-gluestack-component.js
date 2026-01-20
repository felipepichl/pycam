#!/usr/bin/env node

/**
 * Script helper para adicionar componentes do gluestack-ui na pasta correta
 * Uso: node scripts/add-gluestack-component.js <component-name>
 * Exemplo: node scripts/add-gluestack-component.js skeleton
 */

const { execSync } = require('child_process')
const path = require('path')

const componentName = process.argv[2]

if (!componentName) {
  console.error('❌ Erro: Nome do componente não fornecido')
  console.log('Uso: yarn gluestack:add <component-name>')
  console.log('Exemplo: yarn gluestack:add skeleton')
  process.exit(1)
}

const componentsPath = 'src/components/ui'
const projectRoot = path.resolve(__dirname, '..')

console.log(`📦 Adicionando componente '${componentName}' do gluestack-ui...`)
console.log(`📍 Caminho: ${componentsPath}`)

try {
  execSync(
    `npx gluestack-ui@latest add ${componentName} --path ${componentsPath}`,
    {
      cwd: projectRoot,
      stdio: 'inherit',
    }
  )
  console.log(`✅ Componente '${componentName}' adicionado com sucesso em ${componentsPath}/`)
} catch (error) {
  console.error(`❌ Erro ao adicionar o componente '${componentName}'`)
  process.exit(1)
}


