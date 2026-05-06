import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { bookRepository } from './repositories/bookRepository'
import { caseRepository } from './repositories/caseRepository'
import { genreRepository } from './repositories/genreRepository'
import { tagRepository } from './repositories/tagRepository'
import { getBookImage, setBookImage, deleteBookImage, compressImage } from './utils/image'
import { exportAsZip, importFile } from './utils/backup'
import { generateId, now } from './utils/id'
import { useMasters } from './hooks/useMasters'
import { ListPage } from './pages/ListPage'
import { DetailPage } from './pages/DetailPage'
import { FormPage } from './pages/FormPage'
import { SettingsPage } from './pages/SettingsPage'
import { Toast } from './components/Toast'
import { theme } from './theme'
import type { Book, Page, SortKey, ViewMode, ToastState } from './types'

export default function App() {
  const [page, setPage] = useState<Page>('list')
  const [books, setBooks] = useState<Book[]>([])
  const masters = useMasters()
  const { cases, genres, tags, setAllMasters,
    handleAddCase, handleRenameCase,
    handleAddGenre, handleRenameGenre,
    handleAddTag, handleRenameTag } = masters
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' })

  // List page state (kept in App to preserve across navigation)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCase, setFilterCase] = useState('')
  const [filterGenres, setFilterGenres] = useState<string[]>([])
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortKey>('createdAt_desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [lastExportedAt, setLastExportedAt] = useState(() => localStorage.getItem('lastExportedAt') ?? '')
  const [folderImportStatus, setFolderImportStatus] = useState<string | null>(null)

  const initialLoadDone = useRef(false)
  const listScrollY = useRef(0)

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  const loadImagesProgressively = useCallback(async (bookList: Book[]) => {
    const BATCH = 5
    for (let i = 0; i < bookList.length; i += BATCH) {
      const batch = bookList.slice(i, i + BATCH)
      const entries = await Promise.all(batch.map(async (b) => {
        const img = await getBookImage(b.id)
        return img ? [b.id, img] as [string, string] : null
      }))
      const newImgs: Record<string, string> = {}
      for (const e of entries) { if (e) newImgs[e[0]] = e[1] }
      if (Object.keys(newImgs).length > 0) setImages((prev) => ({ ...prev, ...newImgs }))
    }
  }, [])

  const loadAll = useCallback(async () => {
    try {
      const [b, c, g, t] = await Promise.all([
        bookRepository.getAll(), caseRepository.getAll(),
        genreRepository.getAll(), tagRepository.getAll(),
      ])
      setBooks(b); setAllMasters(c, g, t)
      setImages({})
      setLoading(false)
      await loadImagesProgressively(b)
    } catch (e) {
      console.error('Load failed:', e)
      setLoading(false)
    }
  }, [loadImagesProgressively])

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      navigator.storage?.persist()
      loadAll()
    }
  }, [loadAll])

  // ── Book handlers ──────────────────────────────────────────
  const handleSaveBook = async (bookData: Book, imageData: string | null | undefined, continueAdding: boolean) => {
    await bookRepository.save(bookData)
    if (imageData !== undefined) {
      if (imageData) await setBookImage(bookData.id, imageData)
      else await deleteBookImage(bookData.id)
    }
    setBooks((prev) => {
      const idx = prev.findIndex((b) => b.id === bookData.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = bookData; return next }
      return [...prev, bookData]
    })
    if (imageData !== undefined) {
      setImages((prev) => {
        const next = { ...prev }
        if (imageData) next[bookData.id] = imageData
        else delete next[bookData.id]
        return next
      })
    }
    showToast('保存しました')
    if (!continueAdding) setPage('list')
  }

  const handleDeleteBook = async (id: string) => {
    await bookRepository.delete(id)
    setBooks((prev) => prev.filter((b) => b.id !== id))
    setImages((prev) => { const next = { ...prev }; delete next[id]; return next })
    showToast('削除しました')
    setPage('list')
  }

  const handleBatchAddGenre = async (ids: string[], genreId: string) => {
    const updated = books
      .filter((b) => ids.includes(b.id) && !(b.genres ?? []).includes(genreId))
      .map((b) => ({ ...b, genres: [...(b.genres ?? []), genreId], updatedAt: now() }))
    if (updated.length === 0) { showToast('すでに全冊にジャンルが付いています'); return }
    await Promise.all(updated.map((b) => bookRepository.save(b)))
    const updatedMap = new Map(updated.map((b) => [b.id, b]))
    setBooks((prev) => prev.map((b) => updatedMap.get(b.id) ?? b))
    showToast(`${updated.length}冊にジャンルを追加しました`)
  }

  const handleBatchAddTag = async (ids: string[], tagId: string) => {
    const updated = books
      .filter((b) => ids.includes(b.id) && !(b.tags ?? []).includes(tagId))
      .map((b) => ({ ...b, tags: [...(b.tags ?? []), tagId], updatedAt: now() }))
    if (updated.length === 0) { showToast('すでに全冊にタグが付いています'); return }
    await Promise.all(updated.map((b) => bookRepository.save(b)))
    const updatedMap = new Map(updated.map((b) => [b.id, b]))
    setBooks((prev) => prev.map((b) => updatedMap.get(b.id) ?? b))
    showToast(`${updated.length}冊にタグを追加しました`)
  }

  const handleBatchDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => bookRepository.delete(id)))
    const idSet = new Set(ids)
    setBooks((prev) => prev.filter((b) => !idSet.has(b.id)))
    setImages((prev) => {
      const next = { ...prev }
      for (const id of ids) delete next[id]
      return next
    })
    showToast(`${ids.length}冊削除しました`)
  }

  // ── Master delete handlers (with book cleanup) ──────────────
  const handleDeleteCase = async (id: string) => {
    await masters.handleDeleteCase(id)
    const affected = books.filter((b) => b.caseId === id).map((b) => ({ ...b, caseId: '' as string, updatedAt: now() }))
    await Promise.all(affected.map((b) => bookRepository.save(b)))
    setBooks((prev) => prev.map((b) => b.caseId === id ? { ...b, caseId: '' } : b))
  }
  const handleDeleteGenre = async (id: string) => {
    await masters.handleDeleteGenre(id)
    setBooks((prev) => prev.map((b) => ({ ...b, genres: (b.genres ?? []).filter((gId) => gId !== id) })))
  }
  const handleDeleteTag = async (id: string) => {
    await masters.handleDeleteTag(id)
    setBooks((prev) => prev.map((b) => ({ ...b, tags: (b.tags ?? []).filter((tId) => tId !== id) })))
  }

  // ── Export / Import ──────────────────────────────────────────
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
      const exportedAt = new Date().toISOString()
      localStorage.setItem('lastExportedAt', exportedAt)
      setLastExportedAt(exportedAt)
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
      await loadAll()
      const exportedAt = new Date().toISOString()
      localStorage.setItem('lastExportedAt', exportedAt)
      setLastExportedAt(exportedAt)
      showToast(`インポート完了（書籍: +${result.books.added}, 更新${result.books.overwritten}件）`)
    } catch (e) {
      showToast('インポート失敗: ' + (e as Error).message, 'error')
    }
  }

  // ── Folder bulk import ──────────────────────────────────────
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

    setBooks((prev) => [...prev, ...newBooks])
    setImages((prev) => ({ ...prev, ...newImages }))
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

  // ── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: theme.textDim }}>
        <div style={{ fontSize: 14 }}>読み込み中…</div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: "'Noto Sans JP', sans-serif", background: theme.bg, color: theme.text,
      minHeight: '100vh', maxWidth: 800, margin: '0 auto', position: 'relative',
    }}>
      {page === 'list' && (
        <ListPage
          books={books} cases={cases} genres={genres} tags={tags} images={images}
          searchQuery={searchQuery} filterCase={filterCase} filterGenres={filterGenres}
          filterTags={filterTags} sortBy={sortBy} viewMode={viewMode} showFilters={showFilters}
          onSearchChange={setSearchQuery}
          onFilterCaseChange={setFilterCase}
          onFilterGenresChange={setFilterGenres}
          onFilterTagsChange={setFilterTags}
          onSortChange={setSortBy}
          onViewModeChange={setViewMode}
          onToggleFilters={() => setShowFilters((v) => !v)}
          onResetFilters={() => { setFilterCase(''); setFilterGenres([]); setFilterTags([]) }}
          onSelectBook={(id) => { listScrollY.current = window.scrollY; setSelectedBookId(id); setPage('detail') }}
          onNewBook={() => { listScrollY.current = window.scrollY; setEditingBook(null); setPage('form') }}
          onSettings={() => { listScrollY.current = window.scrollY; setPage('settings') }}
          hasUnexportedChanges={hasUnexportedChanges}
          restoreScrollY={listScrollY.current}
          onBatchDelete={handleBatchDelete}
          onBatchAddTag={handleBatchAddTag}
          onBatchAddGenre={handleBatchAddGenre}
        />
      )}

      {page === 'detail' && (
        <DetailPage
          book={books.find((b) => b.id === selectedBookId)}
          cases={cases} genres={genres} tags={tags}
          image={selectedBookId ? images[selectedBookId] : undefined}
          onEdit={(book) => { setEditingBook(book); setPage('form') }}
          onDelete={handleDeleteBook}
          onBack={() => { setSelectedBookId(null); setPage('list') }}
          onSearchByAuthor={(author) => { setSearchQuery(author); setSelectedBookId(null); setPage('list') }}
        />
      )}

      {page === 'form' && (
        <FormPage
          book={editingBook}
          cases={cases} genres={genres} tags={tags}
          image={editingBook ? (images[editingBook.id] ?? null) : null}
          onSave={handleSaveBook}
          onCancel={() => {
            if (editingBook) { setPage('detail') }
            else { setEditingBook(null); setPage('list') }
          }}
          onAddGenre={handleAddGenre}
          onAddTag={handleAddTag}
          onAddCase={handleAddCase}
        />
      )}

      {page === 'settings' && (
        <SettingsPage
          cases={cases} genres={genres} tags={tags} bookCount={books.length}
          exportStatus={exportStatus} folderImportStatus={folderImportStatus}
          hasUnexportedChanges={hasUnexportedChanges}
          onAddCase={handleAddCase} onRenameCase={handleRenameCase} onDeleteCase={handleDeleteCase}
          onAddGenre={handleAddGenre} onRenameGenre={handleRenameGenre} onDeleteGenre={handleDeleteGenre}
          onAddTag={handleAddTag} onRenameTag={handleRenameTag} onDeleteTag={handleDeleteTag}
          onExport={handleExport} onImport={handleImport} onFolderImport={handleFolderImport}
          onBack={() => setPage('list')}
        />
      )}

      <Toast {...toast} />
    </div>
  )
}
