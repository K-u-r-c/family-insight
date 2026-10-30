// Generates app icons from build/icon.svg: PNGs (Linux + 1024 master), icon.ico (Windows) and
// icon.icns (macOS). Run with `npm run icons` after editing the SVG.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const build = join(root, 'build')
const svg = readFileSync(join(build, 'icon.svg'), 'utf8')

const png = (size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()

// Master and Linux sizes
writeFileSync(join(build, 'icon.png'), png(1024))
mkdirSync(join(build, 'icons'), { recursive: true })
for (const size of [16, 24, 32, 48, 64, 128, 256, 512, 1024]) {
  writeFileSync(join(build, 'icons', `${size}x${size}.png`), png(size))
}

// ICO: PNG-compressed entries (supported since Windows Vista)
function ico(sizes) {
  const images = sizes.map((s) => ({ size: s, data: png(s) }))
  const header = Buffer.alloc(6 + images.length * 16)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach((img, i) => {
    const e = 6 + i * 16
    header.writeUInt8(img.size >= 256 ? 0 : img.size, e)
    header.writeUInt8(img.size >= 256 ? 0 : img.size, e + 1)
    header.writeUInt8(0, e + 2)
    header.writeUInt8(0, e + 3)
    header.writeUInt16LE(1, e + 4)
    header.writeUInt16LE(32, e + 6)
    header.writeUInt32LE(img.data.length, e + 8)
    header.writeUInt32LE(offset, e + 12)
    offset += img.data.length
  })
  return Buffer.concat([header, ...images.map((i) => i.data)])
}
writeFileSync(join(build, 'icon.ico'), ico([16, 24, 32, 48, 64, 128, 256]))

// ICNS: PNG entries
function icns(entries) {
  const chunks = entries.map(([type, size]) => {
    const data = png(size)
    const head = Buffer.alloc(8)
    head.write(type, 0, 'ascii')
    head.writeUInt32BE(data.length + 8, 4)
    return Buffer.concat([head, data])
  })
  const body = Buffer.concat(chunks)
  const head = Buffer.alloc(8)
  head.write('icns', 0, 'ascii')
  head.writeUInt32BE(body.length + 8, 4)
  return Buffer.concat([head, body])
}
writeFileSync(
  join(build, 'icon.icns'),
  icns([
    ['icp4', 16],
    ['icp5', 32],
    ['icp6', 64],
    ['ic07', 128],
    ['ic08', 256],
    ['ic09', 512],
    ['ic10', 1024],
    ['ic11', 32],
    ['ic12', 64],
    ['ic13', 256],
    ['ic14', 512]
  ])
)
// DMG window background (1× and 2×)
const bg = readFileSync(join(build, 'background.svg'), 'utf8')
writeFileSync(
  join(build, 'background.png'),
  new Resvg(bg, { fitTo: { mode: 'width', value: 540 } }).render().asPng()
)
writeFileSync(
  join(build, 'background@2x.png'),
  new Resvg(bg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng()
)

console.log('Icons written to build/')
