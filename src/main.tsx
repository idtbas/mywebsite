import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/syncopate/700.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource-variable/inter-tight/index.css'
import './styles/base.css'
import './styles/hud.css'
import './styles/sections.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
