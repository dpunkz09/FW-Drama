import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeAuth } from './lib/firebase'

// Initialize Firebase authentication before rendering
initializeAuth().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}).catch((error) => {
  console.error('Failed to initialize Firebase auth:', error);
  // Render app anyway, requests will fail gracefully
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
});
