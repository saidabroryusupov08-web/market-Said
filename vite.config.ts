import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // brauzerga faqat ochiq kalitlar: VITE_* va Supabase integratsiyasining NEXT_PUBLIC_SUPABASE_*
  envPrefix: ['VITE_', 'NEXT_PUBLIC_SUPABASE_'],
  plugins: [react(), tailwindcss()],
})
