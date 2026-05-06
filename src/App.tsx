import { useState, useEffect, useCallback, useRef } from 'react'
import { bookRepository } from './repositories/bookRepository'
import { caseRepository } from './repositories/caseRepository'
import { genreRepository } from './repositories/genreRepository'
import { tagRepository } from './repositories/tagRepository'
import { now } from './utils/id'
import { useMasters } from './hooks/useMasters'
import { useBooks } from './hooks/useBooks'
import { useBackup } from './hooks/useBackup'
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
  const { books, images, loadBooksAndImages, appendBooksAndImages,
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

  const backup = useBackup({
    showToast, onReload: loadAll,
    books, cases, genres, tags,
    handleAddCase, appendBooksAndImages,
  })
  const { exportStatus, folderImportStatus, hasUnexportedChanges,
    handleExport, handleImport, handleFolderImport } = backup

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
