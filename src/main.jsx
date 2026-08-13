import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Restore a deep link that GitHub Pages bounced through public/404.html, so a
// hard reload of /dashboard etc. lands on the right route instead of the root.
const pendingRedirect = sessionStorage.getItem('clarity-redirect')
if (pendingRedirect) {
  sessionStorage.removeItem('clarity-redirect')
  window.history.replaceState(null, '', pendingRedirect)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
