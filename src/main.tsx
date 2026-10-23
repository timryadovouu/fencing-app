import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { I18nProvider } from './components/I18nProvider'
import { requestPersistentStorage } from './db'
import './index.css'
import { initTheme } from './theme'

initTheme()
requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
