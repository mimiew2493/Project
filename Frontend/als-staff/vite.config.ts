import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { codeInspectorPlugin } from 'code-inspector-plugin'

// https://vite.dev/config/
export default defineConfig({
  // codeInspectorPlugin: ตอน dev กด Shift+Alt ค้างแล้วคลิกกล่องบนหน้าเว็บ → เปิดไฟล์และบรรทัดนั้นใน VS Code (ไม่มีผลกับ build จริง)
  plugins: [codeInspectorPlugin({ bundler: 'vite', editor: 'code' }), react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
