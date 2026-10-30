import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { enablePseudoLocale } from '@shared/i18n'
import { initI18n } from './i18n'
import { applyTheme } from './hooks/useApplyTheme'
import { useDocument } from './store/document'
import { useTreeView } from './store/treeView'
import { initSettings, useSettings } from './store/settings'
import './styles/tokens.css'
import './styles/global.css'
import { App } from './App'

// Store handles for end-to-end tests and screenshot automation (renderer state only).
Object.assign(window, { __familyInsight: { useDocument, useSettings, useTreeView } })

async function bootstrap(): Promise<void> {
  if ((await window.familyInsight.getAppInfo()).pseudoLocale) enablePseudoLocale()
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
