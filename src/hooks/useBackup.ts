import { useState, useMemo } from 'react'
import { bookRepository } from '../repositories/bookRepository'
import { exportAsZip, importFile } from '../utils/backup'
import { compressImage, setBookImage } from '../utils/image'
import { generateId, now } from '../utils/id'
import type { Book, Case, Genre, Tag, ToastState } from '../types'

type ShowToast = (message: string, type?: ToastState['type']) => void

interface UseBackupDeps {
  showToast: ShowToast
  onReload: () => Promise<void>
  books: Book[]
  cases: Case[]
  genres: Genre[]
  tags: Tag[]
  handleAddCase: (name: string) => Promise<Case>
  appendBooksAndImages: (newBooks: Book[], newImages: Record<string, string>) => void
}

export function useBackup({
  showToast, onReload, books, cases, genres, tags,
  handleAddCase, appendBooksAndImages,
}: UseBackupDeps) {
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [folderImportStatus, setFolderImportStatus] = useState<string | null>(null)
  const [lastExportedAt, setLastExportedAt] = useState(() => localStorage.getItem('lastExportedAt') ?? '')

  const markExported = () => {
    const exportedAt = new Date().toISOString()
    localStorage.setItem('lastExportedAt', exportedAt)
    setLastExportedAt(exportedAt)
  }

  const handleExport = async () => {
    try {
      setExportStatus('準備中…')
      const blob = await exportAsZip((msg) => setExportStatus(msg))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.href = url
      a.download = `bibliotheca_backup_${date}.zip`
      a.click()
      URL.revokeObjectURL(url)
      markExported()
      setExportStatus(null)
      showToast('バックアップをダウンロードしました')
    } catch (e) {
      setExportStatus(null)
      showToast('エクスポート失敗: ' + (e as Error).message, 'error')
    }
  }

  const handleImport = async (file: File) => {
    try {
      const result = await importFile(file)
      await onReload()
      markExported()
      showToast(`インポート完了（書籍: +${result.books.added}, 更新${result.books.overwritten}件）`)
    } catch (e) {
      showToast('インポート失敗: ' + (e as Error).message, 'error')
    }
  }

  const handleFolderImport = async (files: FileList) => {
    if (files.length === 0) return

    const allFiles = Array.from(files)
    const firstRelPath = (allFiles[0] as any).webkitRelativePath as string
    const folderName = firstRelPath.split('/')[0]

    // Direct children only, image files only
    const imageFiles = allFiles.filter((f) => {
      const parts = ((f as any).webkitRelativePath as string).split('/')
      return parts.length === 2 && f.type.startsWith('image/')
    })

    if (imageFiles.length === 0) {
      showToast('対象の画像ファイルが見つかりませんでした', 'error')
      return
    }

    // Find or create the case matching folder name
    let targetCase = cases.find((c) => c.name === folderName)
    if (!targetCase) targetCase = await handleAddCase(folderName)

    const newBooks: Book[] = []
    const newImages: Record<string, string> = {}

    for (let i = 0; i < imageFiles.length; i++) {
      setFolderImportStatus(`処理中… (${i + 1}/${imageFiles.length})`)
      const compressed = await compressImage(imageFiles[i])
      const id = generateId()
      const book: Book = {
        id, title: '(無題)', author: null, genres: [], tags: [],
        caseId: targetCase!.id, caseLabel: null, publishedDate: null, note: null,
        createdAt: now(), updatedAt: now(),
      }
      await bookRepository.save(book)
      await setBookImage(id, compressed)
      newBooks.push(book)
      newImages[id] = compressed
    }

    appendBooksAndImages(newBooks, newImages)
    setFolderImportStatus(null)
    showToast(`${imageFiles.length}冊を「${folderName}」ケースに登録しました`)
  }

  const hasUnexportedChanges = useMemo(() => {
    const allItems = [...books, ...cases, ...genres, ...tags] as { updatedAt?: string; createdAt?: string }[]
    if (allItems.length === 0) return false
    const lastChangedAt = allItems.reduce((max, item) => {
      const t = item.updatedAt ?? item.createdAt ?? ''
      return t > max ? t : max
    }, '')
    return !lastExportedAt || lastChangedAt > lastExportedAt
  }, [books, cases, genres, tags, lastExportedAt])

  return {
    exportStatus, folderImportStatus, hasUnexportedChanges,
    handleExport, handleImport, handleFolderImport,
  }
}
