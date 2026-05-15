import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// window.storage polyfill — localStorage 기반으로 대체
window.storage = {
  _data: {},
  get: async (key) => {
    try {
      const val = localStorage.getItem(key)
      if (val === null) throw new Error('not found')
      return { key, value: val }
    } catch {
      throw new Error('not found')
    }
  },
  set: async (key, value) => {
    localStorage.setItem(key, value)
    return { key, value }
  },
  delete: async (key) => {
    localStorage.removeItem(key)
    return { key, deleted: true }
  },
  list: async (prefix = '') => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix))
    return { keys }
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
