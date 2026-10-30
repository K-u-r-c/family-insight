import { createServer } from 'node:http'
import { Resvg } from '@resvg/resvg-js'

/**
 * A local stand-in for a map tile server (tests and screenshots never use the internet): every
 * tile is the same plain "paper" square with a faint grid.
 */
export async function startTileServer(): Promise<{
  url: string
  requests: string[]
  close: () => Promise<void>
}> {
  const tile = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
      <rect width="256" height="256" fill="#e9e4d8"/>
      <path d="M0 0.5H256M0.5 0V256M0 128.5H256M128.5 0V256" stroke="#d3cab8" stroke-width="1"/>
      <path d="M0 64.5H256M0 192.5H256M64.5 0V256M192.5 0V256" stroke="#ddd6c6" stroke-width="1"/>
    </svg>`
  )
    .render()
    .asPng()
  const requests: string[] = []
  const server = createServer((req, res) => {
    requests.push(req.url ?? '')
    res.writeHead(200, { 'Content-Type': 'image/png' }).end(tile)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as { port: number }).port
  return {
    url: `http://127.0.0.1:${port}/{z}/{x}/{y}.png`,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  }
}
