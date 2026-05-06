import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Grid3X3, List, Filter, RotateCcw, Settings, BookOpen, CheckSquare, Trash2, Check, Tag as TagIcon, Layers } from 'lucide-react'
import { theme } from '../theme'
import { Btn } from '../components/Btn'
import { Chip } from '../components/Chip'
import { BookCardGrid } from '../components/BookCardGrid'
import { BookCardList } from '../components/BookCardList'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import type { Book, Case, Genre, Tag, SortKey, ViewMode } from '../types'

interface ListPageProps {
  books: Book[]
  cases: Case[]
  genres: Genre[]
  tags: Tag[]
  images: Record<string, string>
  searchQuery: string
  filterCase: string
  filterGenres: string[]
  filterTags: string[]
  sortBy: SortKey
  viewMode: ViewMode
  showFilters: boolean
  onSearchChange: (v: string) => void
  onFilterCaseChange: (v: string) => void
  onFilterGenresChange: (ids: string[]) => void
  onFilterTagsChange: (ids: string[]) => void
  onSortChange: (v: SortKey) => void
  onViewModeChange: (v: ViewMode) => void
  onToggleFilters: () => void
  onResetFilters: () => void
  onSelectBook: (id: string) => void
  onNewBook: () => void
  onSettings: () => void
  onBatchDelete: (ids: string[]) => Promise<void>
  onBatchAddTag: (ids: string[], tagId: string) => Promise<void>
  onBatchAddGenre: (ids: string[], genreId: string) => Promise<void>
  restoreScrollY?: number
  hasUnexportedChanges?: boolean
}

export function ListPage({
  books, cases, genres, tags, images,
  searchQuery, filterCase, filterGenres, filterTags, sortBy, viewMode, showFilters,
  onSearchChange, onFilterCaseChange, onFilterGenresChange, onFilterTagsChange,
  onSortChange, onViewModeChange, onToggleFilters, onResetFilters,
  onSelectBook, onNewBook, onSettings, onBatchDelete, onBatchAddTag, onBatchAddGenre, restoreScrollY, hasUnexportedChanges,
}: ListPageProps) {
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [isTagging, setIsTagging] = useState(false)
  const [showGenrePicker, setShowGenrePicker] = useState(false)
  const [isGenring, setIsGenring] = useState(false)
  const [filterTagsMode, setFilterTagsMode] = useState<'or' | 'and'>('or')

  useEffect(() => {
    if (restoreScrollY) window.scrollTo({ top: restoreScrollY, behavior: 'instant' })
  }, [])

  const filteredBooks = useMemo(() => {
    let result = [...books]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((b) =>
        (b.title ?? '').toLowerCase().includes(q) ||
        (b.author ?? '').toLowerCase().includes(q) ||
        (b.note ?? '').toLowerCase().includes(q)
      )
    }
    if (filterCase) result = result.filter((b) => b.caseId === filterCase)
    if (filterGenres.length > 0) {
      if (filterGenres.includes('__none__')) result = result.filter((b) => (b.genres ?? []).length === 0)
      else result = result.filter((b) => (b.genres ?? []).some((g) => filterGenres.includes(g)))
    }
    if (filterTags.length > 0) {
      if (filterTags.includes('__none__')) result = result.filter((b) => (b.tags ?? []).length === 0)
      else if (filterTagsMode === 'and') result = result.filter((b) => filterTags.every((t) => (b.tags ?? []).includes(t)))
      else result = result.filter((b) => (b.tags ?? []).some((t) => filterTags.includes(t)))
    }

    const [field, dir] = sortBy.split('_')
    result.sort((a, b) => {
      let va: string, vb: string
      if (field === 'createdAt') { va = a.createdAt ?? ''; vb = b.createdAt ?? '' }
      else if (field === 'title') { va = (a.title ?? '').toLowerCase(); vb = (b.title ?? '').toLowerCase() }
      else if (field === 'author') { va = (a.author ?? '').toLowerCase(); vb = (b.author ?? '').toLowerCase() }
      else if (field === 'publishedDate') { va = a.publishedDate ?? ''; vb = b.publishedDate ?? '' }
      else { va = ''; vb = '' }
      if (va < vb) return dir === 'asc' ? -1 : 1
      if (va > vb) return dir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [books, searchQuery, filterCase, filterGenres, filterTags, filterTagsMode, sortBy])

  const activeFilterCount = (filterCase ? 1 : 0) + (filterGenres.length > 0 ? 1 : 0) + (filterTags.length > 0 ? 1 : 0)

  const toggleGenre = (id: string) =>
    onFilterGenresChange(filterGenres.includes(id) ? filterGenres.filter((x) => x !== id) : [...filterGenres, id])
  const toggleTag = (id: string) =>
    onFilterTagsChange(filterTags.includes(id) ? filterTags.filter((x) => x !== id) : [...filterTags, id])

  const enterSelectMode = () => { setSelectMode(true); setSelectedIds(new Set()) }
  const exitSelectMode  = () => { setSelectMode(false); setSelectedIds(new Set()) }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allFilteredSelected = filteredBooks.length > 0 && filteredBooks.every((b) => selectedIds.has(b.id))
  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredBooks.forEach((b) => next.delete(b.id))
        return next
      })
    } else {
      setSelectedIds((prev) => new Set([...prev, ...filteredBooks.map((b) => b.id)]))
    }
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    await onBatchDelete(Array.from(selectedIds))
    setIsDeleting(false)
    setConfirmDelete(false)
    exitSelectMode()
  }

  const handleApplyTag = async (tagId: string) => {
    setIsTagging(true)
    await onBatchAddTag(Array.from(selectedIds), tagId)
    setIsTagging(false)
    setShowTagPicker(false)
  }

  const handleApplyGenre = async (genreId: string) => {
    setIsGenring(true)
    await onBatchAddGenre(Array.from(selectedIds), genreId)
    setIsGenring(false)
    setShowGenrePicker(false)
  }

  // Card click: in select mode → toggle; normal → navigate
  const handleCardClick = (id: string) => {
    if (selectMode) toggleSelect(id)
    else onSelectBook(id)
  }

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100,
        background: theme.bg + 'ee', backdropFilter: 'blur(12px)',
      }}>
        {selectMode ? (
          <>
            <span style={{ fontSize: 14, color: theme.textDim, fontWeight: 500 }}>
              {selectedIds.size}件選択中
            </span>
            <Btn variant="ghost" size="sm" onClick={exitSelectMode}>キャンセル</Btn>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={22} style={{ color: theme.accent }} />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
                Bibliotheca
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="ghost" size="sm" onClick={enterSelectMode} style={{ color: theme.textDim }}>
                <CheckSquare size={16} />
              </Btn>
              <div style={{ position: 'relative' }}>
                <Btn variant="ghost" size="sm" onClick={onSettings}><Settings size={16} /></Btn>
                {hasUnexportedChanges && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2, width: 8, height: 8,
                    borderRadius: '50%', background: theme.danger, pointerEvents: 'none',
                  }} />
                )}
              </div>
              <Btn size="sm" onClick={onNewBook}><Plus size={16} /> 登録</Btn>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="fade-in" style={{ padding: '12px 16px', paddingBottom: selectMode ? 96 : 80 }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="タイトル・作家名・メモで検索…"
            style={{
              width: '100%', background: theme.bgCard, border: `1px solid ${theme.border}`,
              borderRadius: 10, padding: '10px 38px 10px 38px', color: theme.text, fontSize: 13,
              fontFamily: "'Noto Sans JP', sans-serif", outline: 'none', boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <span onClick={() => onSearchChange('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: theme.textMuted }}>×</span>
          )}
        </div>

        {/* Filter/Sort Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn variant={showFilters ? 'primary' : 'ghost'} size="sm" onClick={onToggleFilters} style={{ position: 'relative' }}>
            <Filter size={14} /> フィルタ
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%',
                background: theme.accent, color: theme.bg, fontSize: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>{activeFilterCount}</span>
            )}
          </Btn>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            style={{
              background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8,
              padding: '6px 10px', color: theme.textDim, fontSize: 12, outline: 'none',
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            <option value="createdAt_desc">登録日 (新→古)</option>
            <option value="createdAt_asc">登録日 (古→新)</option>
            <option value="title_asc">タイトル (あ→ん)</option>
            <option value="title_desc">タイトル (ん→あ)</option>
            <option value="author_asc">作家名 (あ→ん)</option>
            <option value="publishedDate_desc">刊行時期 (新→古)</option>
            <option value="publishedDate_asc">刊行時期 (古→新)</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {(['grid', 'list'] as ViewMode[]).map((mode) => (
              <span key={mode} onClick={() => onViewModeChange(mode)} style={{
                cursor: 'pointer', padding: 6, borderRadius: 6,
                background: viewMode === mode ? theme.accentSoft : 'transparent',
                color: viewMode === mode ? theme.accent : theme.textMuted,
              }}>
                {mode === 'grid' ? <Grid3X3 size={16} /> : <List size={16} />}
              </span>
            ))}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="fade-in" style={{ background: theme.bgCard, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${theme.border}` }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: 500 }}>ケース</div>
              <select
                value={filterCase}
                onChange={(e) => onFilterCaseChange(e.target.value)}
                style={{ width: '100%', background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 10px', color: theme.text, fontSize: 12, fontFamily: "'Noto Sans JP', sans-serif", outline: 'none' }}
              >
                <option value="">すべて</option>
                {cases.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: 500 }}>ジャンル (OR)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Chip label="(なし)" selected={filterGenres.includes('__none__')} onClick={() => toggleGenre('__none__')} />
                {genres.map((g) => <Chip key={g.id} label={g.name} selected={filterGenres.includes(g.id)} onClick={() => toggleGenre(g.id)} />)}
              </div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                タグ
                <span
                  onClick={() => setFilterTagsMode((m) => m === 'or' ? 'and' : 'or')}
                  style={{
                    cursor: 'pointer', fontSize: 10, padding: '1px 7px', borderRadius: 10, fontWeight: 600,
                    background: filterTagsMode === 'and' ? theme.accent : theme.bgInput,
                    color: filterTagsMode === 'and' ? theme.bg : theme.textMuted,
                    border: `1px solid ${filterTagsMode === 'and' ? theme.accent : theme.border}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {filterTagsMode.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Chip label="(なし)" selected={filterTags.includes('__none__')} onClick={() => toggleTag('__none__')} />
                {tags.map((t) => <Chip key={t.id} label={t.name} selected={filterTags.includes(t.id)} onClick={() => toggleTag(t.id)} />)}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <Btn variant="ghost" size="sm" onClick={onResetFilters} style={{ marginTop: 6 }}>
                <RotateCcw size={12} /> フィルタをリセット
              </Btn>
            )}
          </div>
        )}

        {/* Count */}
        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 10 }}>
          {filteredBooks.length} / {books.length} 冊
        </div>

        {/* Book List */}
        {filteredBooks.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            message={books.length === 0 ? '蔵書が登録されていません' : '条件に一致する書籍がありません'}
            sub={books.length === 0 ? '右上の「登録」ボタンから始めましょう' : '検索条件を変更してみてください'}
          />
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {filteredBooks.map((book) => (
              <div key={book.id} style={{ position: 'relative' }} onClick={() => handleCardClick(book.id)}>
                <BookCardGrid book={book} cases={cases} image={images[book.id]} onClick={() => {}} />
                {selectMode && <SelectOverlay selected={selectedIds.has(book.id)} />}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredBooks.map((book) => (
              <div key={book.id} style={{ position: 'relative' }} onClick={() => handleCardClick(book.id)}>
                <BookCardList book={book} cases={cases} genres={genres} tags={tags} image={images[book.id]} onClick={() => {}} />
                {selectMode && <SelectOverlay selected={selectedIds.has(book.id)} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Select mode bottom action bar */}
      {selectMode && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 800, padding: '12px 16px',
          background: theme.bgCard, borderTop: `1px solid ${theme.border}`,
          display: 'flex', gap: 10, alignItems: 'center', zIndex: 200,
          boxSizing: 'border-box',
        }}>
          <Btn variant="ghost" size="sm" onClick={handleSelectAll}>
            {allFilteredSelected ? '選択解除' : '全選択'}
          </Btn>
          <span style={{ flex: 1, fontSize: 12, color: theme.textMuted, textAlign: 'center' }}>
            {selectedIds.size > 0 ? `${selectedIds.size}件選択中` : '書籍をタップして選択'}
          </span>
          <Btn
            variant="ghost" size="sm"
            onClick={() => setShowGenrePicker(true)}
            disabled={selectedIds.size === 0}
          >
            <Layers size={14} /> ジャンル付与
          </Btn>
          <Btn
            variant="ghost" size="sm"
            onClick={() => setShowTagPicker(true)}
            disabled={selectedIds.size === 0}
          >
            <TagIcon size={14} /> タグ付与
          </Btn>
          <Btn
            variant="danger" size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={selectedIds.size === 0}
          >
            <Trash2 size={14} /> 削除 {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Btn>
        </div>
      )}

      {/* Genre picker modal */}
      <Modal open={showGenrePicker} onClose={() => setShowGenrePicker(false)} title="ジャンルを一括付与" width={360}>
        <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 14 }}>
          選択中の {selectedIds.size} 冊に付与するジャンルを選んでください。<br />
          すでに付いているものはスキップします。
        </p>
        {genres.length === 0 ? (
          <p style={{ fontSize: 13, color: theme.textMuted }}>ジャンルが登録されていません。設定画面から追加してください。</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {genres.map((g) => (
              <button
                key={g.id}
                disabled={isGenring}
                onClick={() => handleApplyGenre(g.id)}
                style={{
                  background: theme.accentSoft, border: `1px solid ${theme.accent}44`,
                  borderRadius: 20, padding: '6px 14px', color: theme.accent,
                  fontSize: 13, cursor: isGenring ? 'default' : 'pointer',
                  fontFamily: "'Noto Sans JP', sans-serif", opacity: isGenring ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setShowGenrePicker(false)}>閉じる</Btn>
        </div>
      </Modal>

      {/* Tag picker modal */}
      <Modal open={showTagPicker} onClose={() => setShowTagPicker(false)} title="タグを一括付与" width={360}>
        <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 14 }}>
          選択中の {selectedIds.size} 冊に付与するタグを選んでください。<br />
          すでに付いているものはスキップします。
        </p>
        {tags.length === 0 ? (
          <p style={{ fontSize: 13, color: theme.textMuted }}>タグが登録されていません。設定画面から追加してください。</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {tags.map((t) => (
              <button
                key={t.id}
                disabled={isTagging}
                onClick={() => handleApplyTag(t.id)}
                style={{
                  background: theme.accentSoft, border: `1px solid ${theme.accent}44`,
                  borderRadius: 20, padding: '6px 14px', color: theme.accent,
                  fontSize: 13, cursor: isTagging ? 'default' : 'pointer',
                  fontFamily: "'Noto Sans JP', sans-serif", opacity: isTagging ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setShowTagPicker(false)}>閉じる</Btn>
        </div>
      </Modal>

      {/* Batch delete confirmation */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="一括削除の確認" width={360}>
        <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 16 }}>
          {selectedIds.size}冊を削除します。この操作は取り消せません。
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setConfirmDelete(false)}>キャンセル</Btn>
          <Btn variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? '削除中…' : '削除する'}
          </Btn>
        </div>
      </Modal>
    </>
  )
}

// Checkbox overlay shown on each card in select mode
function SelectOverlay({ selected }: { selected: boolean }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 12, pointerEvents: 'none',
      background: selected ? 'rgba(212,168,67,0.15)' : 'rgba(0,0,0,0.25)',
      border: `2px solid ${selected ? theme.accent : 'transparent'}`,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
      padding: 8,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${selected ? theme.accent : 'rgba(255,255,255,0.7)'}`,
        background: selected ? theme.accent : 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <Check size={13} style={{ color: theme.bg }} />}
      </div>
    </div>
  )
}
