// Lays out a .finsight file like the tree canvas, prints readability metrics and writes an SVG
// and a PNG to a temp directory. Dev only: `npm run layout:preview -- <file> [options]`.
// The TypeScript part (scripts/layout-preview.ts) is loaded through Vite, which resolves the
// extensionless imports of src/core.
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] }
})
try {
  const { main } = await server.ssrLoadModule('/scripts/layout-preview.ts')
  process.exitCode = await main(process.argv.slice(2))
} finally {
  await server.close()
}
