// A minimal Electron "browser" for the documentation tests: one offscreen window that Playwright
// drives. Using the Electron that the app already depends on avoids downloading another browser.
import { app, BrowserWindow } from 'electron'

app.whenReady().then(() => {
  const window = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    webPreferences: { offscreen: true, backgroundThrottling: false }
  })
  void window.loadURL('about:blank')
})
