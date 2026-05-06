// Generates PNG icons for the PWA manifest using only built-in Node.js modules.
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.allocUnsafe(4)
  lenBuf.writeUInt32BE(data.length)
  const crcBuf = Buffer.allocUnsafe(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])))
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf])
}

function createBookIconPNG(size) {
  const BG  = [15, 16, 35]      // #0f1023
  const ACC = [212, 168, 67]    // #d4a843
  const DIM = [148, 117, 47]    // darker accent for spine

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB color type
  ihdr[10] = ihdr[11] = ihdr[12] = 0

  // Book shape: centered rectangle with a spine on the left
  const bx = Math.floor(size * 0.25)
  const by = Math.floor(size * 0.20)
  const bw = Math.floor(size * 0.50)
  const bh = Math.floor(size * 0.60)
  const sw = Math.max(3, Math.floor(bw * 0.14))  // spine width

  const rowBytes = 1 + size * 3
  const raw = Buffer.allocUnsafe(size * rowBytes)

  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0  // filter: None
    for (let x = 0; x < size; x++) {
      const inBook  = x >= bx && x < bx + bw && y >= by && y < by + bh
      const inSpine = x >= bx && x < bx + sw && y >= by && y < by + bh

      const [r, g, b] = inSpine ? DIM : inBook ? ACC : BG
      const off = y * rowBytes + 1 + x * 3
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b
    }
  }

  const idat = pngChunk('IDAT', deflateSync(raw, { level: 9 }))
  const iend = pngChunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), idat, iend])
}

mkdirSync('public', { recursive: true })
writeFileSync('public/pwa-192x192.png',   createBookIconPNG(192))
writeFileSync('public/pwa-512x512.png',   createBookIconPNG(512))
writeFileSync('public/apple-touch-icon.png', createBookIconPNG(180))
console.log('Icons generated: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png')
