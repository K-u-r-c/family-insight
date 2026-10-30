import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel, type PdfOptions } from '@shared/ipc'
import { writeFileAtomic } from './fsUtils'

const PAGE_SIZES = new Set(['A4', 'A3', 'Letter'])

function pageHtml(svg: string, options: PdfOptions): string {
  const size = PAGE_SIZES.has(options.pageSize) ? options.pageSize : 'A4'
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: ${size} ${options.landscape ? 'landscape' : 'portrait'}; margin: 10mm; }
html, body { margin: 0; height: 100%; background: #fff; }
body { display: flex; align-items: center; justify-content: center; }
svg { width: 100%; height: 100%; }
</style></head><body>${svg}</body></html>`
}

/** Loads the SVG into an invisible window (via a temp file, so large photos are fine). */
async function withPrintWindow<T>(
  svg: string,
  options: PdfOptions,
  run: (w: BrowserWindow) => Promise<T>
): Promise<T> {
  if (!svg.startsWith('<svg')) throw new Error('Expected SVG markup')
  const file = join(tmpdir(), `family-insight-print-${randomUUID()}.html`)
  await fs.writeFile(file, pageHtml(svg, options), 'utf8')
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      javascript: false
    }
  })
  try {
    await window.loadFile(file)
    return await run(window)
  } finally {
    window.destroy()
    await fs.rm(file, { force: true })
  }
}

export function registerPrintHandlers(isWritable: (path: string) => boolean): void {
  ipcMain.handle(
    IpcChannel.ExportPdf,
    async (_e, svg: unknown, options: unknown, path: unknown) => {
      if (typeof svg !== 'string' || typeof path !== 'string') return { ok: false, error: 'io' }
      const full = resolve(path)
      if (!isWritable(full)) return { ok: false, error: 'permission' }
      const opts = sanitize(options)
      try {
        const pdf = await withPrintWindow(svg, opts, (w) =>
          w.webContents.printToPDF({
            printBackground: true,
            preferCSSPageSize: true,
            landscape: opts.landscape
          })
        )
        await writeFileAtomic(full, pdf)
        return { ok: true, path: full }
      } catch {
        return { ok: false, error: 'io' }
      }
    }
  )

  // A part of the window (the map view) as PNG.
  ipcMain.handle(IpcChannel.CapturePng, async (event, rect: unknown, path: unknown) => {
    const r = (typeof rect === 'object' && rect !== null ? rect : {}) as Record<string, unknown>
    const n = (v: unknown): number =>
      typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : -1
    const area = { x: n(r.x), y: n(r.y), width: n(r.width), height: n(r.height) }
    if (typeof path !== 'string' || Object.values(area).some((v) => v < 0) || !area.width) {
      return { ok: false, error: 'io' }
    }
    const full = resolve(path)
    if (!isWritable(full)) return { ok: false, error: 'permission' }
    try {
      const image = await event.sender.capturePage(area)
      await writeFileAtomic(full, image.toPNG())
      return { ok: true, path: full }
    } catch {
      return { ok: false, error: 'io' }
    }
  })

  ipcMain.handle(IpcChannel.Print, async (_e, svg: unknown, options: unknown) => {
    if (typeof svg !== 'string') return false
    const opts = sanitize(options)
    return withPrintWindow(
      svg,
      opts,
      (w) =>
        new Promise<boolean>((done) =>
          w.webContents.print({ printBackground: true, landscape: opts.landscape }, (success) =>
            done(success)
          )
        )
    )
  })
}

function sanitize(options: unknown): PdfOptions {
  const o = (typeof options === 'object' && options !== null ? options : {}) as Record<
    string,
    unknown
  >
  return {
    pageSize:
      typeof o.pageSize === 'string' && PAGE_SIZES.has(o.pageSize)
        ? (o.pageSize as PdfOptions['pageSize'])
        : 'A4',
    landscape: o.landscape !== false
  }
}
