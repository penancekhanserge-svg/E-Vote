// File overview: Implements this module's main behavior and UI/data flow.
// Imports: external libraries and shared modules used in this file.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
