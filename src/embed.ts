import { createRoot, Root } from 'react-dom/client'
import App from './App'

// Include styles used by the app so the widget renders correctly
import './main.css'
import './styles/theme.css'
import './index.css'

type MountOptions = {
  // Reserve for future options (e.g., route, theme, basePath)
  route?: string
}

const roots = new Map<HTMLElement, Root>()

function mount(el: HTMLElement, _opts?: MountOptions) {
  if (!el) throw new Error('CreedaVAWidget.mount: target element is required')
  if (roots.has(el)) return
  const root = createRoot(el)
  root.render(<App />)
  roots.set(el, root)
}

function unmount(el: HTMLElement) {
  const root = roots.get(el)
  if (root) {
    root.unmount()
    roots.delete(el)
  }
}

// Expose a tiny API for script-tag usage
;(window as any).CreedaVAWidget = { mount, unmount }

export { mount, unmount }
