import JSZip from 'jszip'
import { db } from '../db'
import { bookRepository } from '../repositories/bookRepository'
import { caseRepository } from '../repositories/caseRepository'
import { genreRepository } from '../repositories/genreRepository'
import { tagRepository } from '../repositories/tagRepository'
import { setBookImage } from './image'
import { now } from './id'

interface BackupData {
  version: number
  exportedAt: string
  books: ReturnType<typeof Object.values>
  cases: ReturnType<typeof Object.values>
  genres: ReturnType<typeof Object.values>
  tags: ReturnType<typeof Object.values>
  images?: Record<string, string>
}

export interface ImportResult {
  books: { added: number; overwritten: number }
  cases: { added: number; overwritten: number }
  genres: { added: number; overwritten: number }
  tags: { added: number; overwritten: number }
}

function mergeItems<T extends { id: string }>(
  existing: T[],
  incoming: T[]
): { merged: T[]; added: number; overwritten: number } {
  const map = new Map(existing.map((x) => [x.id, x]))
  let added = 0, overwritten = 0
  for (const item of incoming) {
    if (map.has(item.id)) overwritten++
    else added++
    map.set(item.id, item)
  }
  return { merged: Array.from(map.values()), added, overwritten }
}

export async function exportAsZip(onProgress?: (msg: string) => void): Promise<Blob> {
  onProgress?.('データ取得中…')
  const [books, cases, genres, tags] = await Promise.all([
    bookRepository.getAll(),
    caseRepository.getAll(),
    genreRepository.getAll(),
    tagRepository.getAll(),
  ])

  const zip = new JSZip()
  const data = { version: 1, exportedAt: now(), books, cases, genres, tags }
  zip.file('data.json', JSON.stringify(data, null, 2))

  const imgFolder = zip.folder('images')!
  const total = books.length
  for (let i = 0; i < total; i++) {
    if (i % 5 === 0) onProgress?.(`画像取得中… (${i}/${total})`)
    const entry = await db.images.get(books[i].id)
    if (entry?.data) {
      const base64 = entry.data.split(',')[1]
      imgFolder.file(`${books[i].id}.jpg`, base64, { base64: true })
    }
  }

  onProgress?.('圧縮中…')
  return zip.generateAsync({ type: 'blob' })
}

export async function importFile(file: File): Promise<ImportResult> {
  if (file.name.endsWith('.zip')) {
    return _importZip(file)
  }
  return _importJson(file)
}

async function _importZip(file: File): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(file)
  const dataFile = zip.file('data.json')
  if (!dataFile) throw new Error('data.json が見つかりません')

  const data: BackupData = JSON.parse(await dataFile.async('text'))
  const result = await _mergeAndSave(data)

  const imgFiles = Object.values(zip.files).filter(
    (f) => f.name.startsWith('images/') && !f.dir
  )
  for (const f of imgFiles) {
    const bookId = f.name.replace('images/', '').replace('.jpg', '')
    const base64 = await f.async('base64')
    await setBookImage(bookId, `data:image/jpeg;base64,${base64}`)
  }

  return result
}

async function _importJson(file: File): Promise<ImportResult> {
  const text = await file.text()
  const data: BackupData = JSON.parse(text)
  if (!data.books || !data.version) throw new Error('バックアップ形式が不正です')

  const result = await _mergeAndSave(data)

  if (data.images) {
    for (const [bookId, imgData] of Object.entries(data.images)) {
      await setBookImage(bookId, imgData)
    }
  }

  return result
}

async function _mergeAndSave(data: BackupData): Promise<ImportResult> {
  const [eb, ec, eg, et] = await Promise.all([
    bookRepository.getAll(),
    caseRepository.getAll(),
    genreRepository.getAll(),
    tagRepository.getAll(),
  ])

  const bRes = mergeItems(eb, (data.books ?? []) as any[])
  const cRes = mergeItems(ec, (data.cases ?? []) as any[])
  const gRes = mergeItems(eg, (data.genres ?? []) as any[])
  const tRes = mergeItems(et, (data.tags ?? []) as any[])

  await Promise.all([
    bookRepository.bulkSave(bRes.merged),
    caseRepository.bulkSave(cRes.merged),
    genreRepository.bulkSave(gRes.merged),
    tagRepository.bulkSave(tRes.merged),
  ])

  return {
    books:  { added: bRes.added, overwritten: bRes.overwritten },
    cases:  { added: cRes.added, overwritten: cRes.overwritten },
    genres: { added: gRes.added, overwritten: gRes.overwritten },
    tags:   { added: tRes.added, overwritten: tRes.overwritten },
  }
}
