import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Admin panel — alohida sayt. Do'kon (vite.config.ts) bilan bitta repo'da,
// umumiy kod shared/ papkasida. Vercel'da alohida loyiha:
//   Build Command: npm run build:admin   Output Directory: dist-admin
const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: 'admin',
  // .env.local loyiha ildizida turadi (do'kon bilan umumiy)
  envDir: rootDir,
  // brauzerga faqat ochiq kalitlar: VITE_* va Supabase integratsiyasining NEXT_PUBLIC_SUPABASE_*
  envPrefix: ['VITE_', 'NEXT_PUBLIC_SUPABASE_'],
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    // admin/ dan tashqaridagi shared/ fayllarini o'qishga ruxsat
    fs: { allow: [rootDir] },
  },
  preview: { port: 4180 },
  build: {
    outDir: '../dist-admin',
    emptyOutDir: true,
  },
})
