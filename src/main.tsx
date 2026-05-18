// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker — critical for iOS standalone (PWA) session persistence.
// Without a SW, iOS aggressively evicts localStorage causing repeated logouts.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.debug('[SW] registered, scope:', reg.scope)
        // Request persistent storage so the browser never auto-evicts our data.
        if (navigator.storage?.persist) {
          navigator.storage.persist().then((granted) => {
            if (granted) console.debug('[Storage] persistent mode granted')
          })
        }
      })
      .catch((err) => console.warn('[SW] registration failed:', err))
  })
}
