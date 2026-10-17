import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { ticketService } from './services/ticketService'
import './index.css'

if (typeof window !== 'undefined') {
  (window as any)._ticketServiceDebug = ticketService;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
