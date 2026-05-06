import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { bookRepository } from './repositories/bookRepository'
import { caseRepository } from './repositories/caseRepository'
import { genreRepository } from './repositories/genreRepository'
import { tagRepository } from './repositories/tagRepository'
import { compressImage, setBookImage } from './utils/image'
import { exportAsZip, importFile } from './utils/backup'
import { generateId, now } from './utils/id'
import { useMasters } from './hooks/useMasters'
import { useBooks } from './hooks/useBooks'
import { ListPage } from './pages/ListPage'
import { DetailPage } from './pages/DetailPage'
import { FormPage } from './pages/FormPage'
import { SettingsPage } from './pages/SettingsPage'
import { Toast } from './components/Toast'
import { theme } from './theme'
import type { Book, Page, SortKey, ViewMode, ToastState } from './types'

export default function App() {
  const [page, setPage] = useState<Page>('list')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' })

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  const masters = useMasters()
  const { cases, genres, tags, setAllMasters,
    handleAddCase, handleRenameCase,
    handleAddGenre, handleRenameGenre,
    handleAddTag, handleRenameTag } = masters

  const booksHook = useBooks(showToast)
  const { books, images, setBooks, setImages, loadBooksAndImages,
    handleSaveBook: saveBook, handleDeleteBook: deleteBook,
    handleBatchDelete, handleBatchAddGenre, handleBatchAddTag,
    cleanupBookField, cleanupBookArrayField } = booksHook

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

  const loadAll = useCallback(async () => {
    try {
      const [b, c, g, t] = await Promise.all([
        bookRepository.getAll(), caseRepository.getAll(),
        genreRepository.getAll(), tagRepository.getAll(),
      ])
      setAllMasters(c, g, t)
      setLoading(false)
      await loadBooksAndImages(b)
    } catch (e) {
      console.error('Load failed:', e)
      setLoading(false)
    }
  }, [setAllMasters, loadBooksAndImages])

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      navigator.storage?.persist()
      loadAll()
    }
  }, [loadAll])

  // ── Book handlers (wrapping useBooks with navigation) ──────
  const handleSaveBook = async (bookData: Book, imageData: string | null | undefined, continueAdding: boolean) => {
    await saveBook(bookData, imageData)
    if (!continueAdding) setPage('list')
  }
  const handleDeleteBook = async (id: string) => {
    await deleteBook(id)
    setPage('list')
  }

  // ── Master delete handlers (with book cleanup) ──────────────
  const handleDeleteCase = async (id: string) => {
    await masters.handleDeleteCase(id)
    const affected = books.filter((b) => b.caseId === id).map((b) => ({ ...b, caseId: '' as string, updatedAt: now() }))
    await Promise.all(affected.map((b) => bookRepository.save(b)))
    cleanupBookField('caseId', id, '')
  }
  const handleDeleteGenre = async (id: string) => {
    await masters.handleDeleteGenre(id)
    cleanupBookArrayField('genres', id)
  }
  const handleDeleteTag = async (id: string) => {
    await masters.handleDeleteTag(id)
    cleanupBookArrayField('tags', id)
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
