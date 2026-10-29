import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initI18n } from './i18n'
import { applyTheme } from './hooks/useApplyTheme'
import { initSettings } from './store/settings'
import './styles/tokens.css'
import './styles/global.css'
import { App } from './App'

async function bootstrap(): Promise<void> {
  const settings = await initSettings()
  applyTheme(settings.theme)
  await initI18n(settings.language)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

void bootstrap()
