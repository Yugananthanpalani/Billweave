import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ✅ PWA Service Worker register
import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
  onRegistered(swRegistration) {
    console.log('Service Worker registered:', swRegistration)
  },
  onRegisterError(error) {
    console.error('SW registration error:', error)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
