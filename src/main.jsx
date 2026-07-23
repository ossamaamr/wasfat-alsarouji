import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// استعادة تفضيلات العرض (حجم الخط / الوضع الليلي)
if (localStorage.getItem('font-large') === '1') document.documentElement.classList.add('font-large')
if (localStorage.getItem('theme-dark') === '1') document.body.classList.add('theme-dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
