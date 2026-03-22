import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Register Service Worker for PWA with update detection
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')

      // Check for updates every 30 minutes
      setInterval(() => reg.update(), 30 * 60 * 1000)

      // Listen for new service worker waiting to activate
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        if (!newSW) return

        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available - show update banner
            showUpdateBanner()
          }
        })
      })
    } catch {}
  })

  // When a new SW takes over, reload
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

function showUpdateBanner() {
  // Don't show if already showing
  if (document.getElementById('sw-update-banner')) return

  const banner = document.createElement('div')
  banner.id = 'sw-update-banner'
  banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;background:#7c3aed;color:white;padding:12px 20px;border-radius:16px;font-size:14px;font-family:Inter,sans-serif;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(124,58,237,0.3);'
  banner.innerHTML = `
    <span>New version available!</span>
    <button id="sw-update-btn" style="background:white;color:#7c3aed;border:none;padding:6px 16px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;">Update</button>
  `
  document.body.appendChild(banner)

  document.getElementById('sw-update-btn').addEventListener('click', () => {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    })
    banner.remove()
  })
}
