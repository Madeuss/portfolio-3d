import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    // Produção: o Leva (painel de ajustes do dev) vira um stub com os valores padrão.
    alias: command === 'build' ? [{ find: /^leva$/, replacement: fileURLToPath(new URL('./src/dev/leva-stub.ts', import.meta.url)) }] : [],
  },
  build: {
    rolldownOptions: {
      output: {
        // Bibliotecas em arquivos próprios: elas quase nunca mudam, então ficam
        // no cache do navegador entre um deploy e outro (só o nosso código baixa
        // de novo). A física (Rapier) é a maior: o WebAssembly vem dentro do JS.
        codeSplitting: {
          groups: [
            { name: 'rapier', test: /node_modules[\/]@dimforge/ },
            { name: 'three', test: /node_modules[\/]three[\/]/ },
            { name: 'r3f', test: /node_modules[\/](@react-three|three-stdlib|ecctrl|three-mesh-bvh|troika|camera-controls|maath)/ },
            { name: 'react', test: /node_modules[\/](react|react-dom|scheduler|zustand|howler)[\/]/ },
          ],
        },
      },
    },
  },
}))
