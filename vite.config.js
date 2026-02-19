import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/neural-tetris/', // リポジトリ名に合わせて変更
  build: {
    outDir: 'docs', // GitHub Pagesでdocsフォルダから配信できるように変更
  }
})