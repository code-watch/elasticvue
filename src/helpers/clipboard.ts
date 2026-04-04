import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { buildConfig } from '../buildConfig.ts'

export const writeToClipboard = (text: string) => {
  if (buildConfig.tauri) {
    return writeText(text)
  } else {
    return Promise.resolve(navigator.clipboard.writeText(text))
  }
}

export const readFromClipboard = () => {
  if (buildConfig.tauri) {
    return readText()
  }
  return navigator.clipboard.readText()
}

/**
 * Route navigator.clipboard through the Tauri plugin (same IPC as writeToClipboard).
 * Needed for code that calls the Web Clipboard API directly (e.g. codemirror-vim "+ register).
 * WebView2 often does not expose a working async clipboard the same way a normal browser does.
 */
export function installTauriNavigatorClipboardShim() {
  if (!buildConfig.tauri) return
  try {
    const clip = navigator.clipboard
    if (!clip) return
    Object.defineProperty(clip, 'writeText', {
      value: (text: string) => writeText(text),
      configurable: true,
      enumerable: true,
      writable: true
    })
    Object.defineProperty(clip, 'readText', {
      value: () => readText(),
      configurable: true,
      enumerable: true,
      writable: true
    })
  } catch {
    /* clipboard object may be sealed in some WebView builds */
  }
}
