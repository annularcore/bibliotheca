import { useState } from 'react'
import { displayPublishedDate } from '../utils/date'
import { ChevronLeft, Edit, Trash2, FolderOpen, Archive } from 'lucide-react'
import { theme } from '../theme'
import { Btn } from '../components/Btn'
import { Chip } from '../components/Chip'
import { Modal } from '../components/Modal'
import type { Book, Case, Genre, Tag } from '../types'

interface DetailPageProps {
  book: Book | undefined
  cases: Case[]
  genres: Genre[]
  tags: Tag[]
  image: string | undefined
  onEdit: (book: Book) => void
  onDelete: (id: string) => void
  onBack: () => void
  onSearchByAuthor: (author: string) => void
}

export function DetailPage({ book, cases, genres, tags, image, onEdit, onDelete, onBack, onSearchByAuthor }: DetailPageProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!book) return <div style={{ padding: 24, color: theme.textDim }}>書籍が見つかりません</div>

  const caseName = cases.find((c) => c.id === book.caseId)?.name
  const genreNames = (book.genres ?? []).map((gId) => genres.find((g) => g.id === gId)?.name).filter(Boolean) as string[]
  const tagNames = (book.tags ?? []).map((tId) => tags.find((t) => t.id === tId)?.name).filter(Boolean) as string[]

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100,
        background: theme.bg + 'ee', backdropFilter: 'blur(12px)',
      }}>
        <span onClick={onBack} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: theme.textDim, fontSize: 13 }}>
          <ChevronLeft size={18} /> 一覧
        </span>
      </div>

      <div className="fade-in" style={{ padding: '16px 20px 40px' }}>
        {image && (
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', maxHeight: 320, display: 'flex', justifyContent: 'center', background: theme.bgCard }}>
            <img src={image} alt="" style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }} />
          </div>
        )}

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.3, color: theme.text }}>
          {book.title}
        </h2>
        {book.author && (
          <div
            onClick={() => onSearchByAuthor(book.author!)}
            style={{ fontSize: 14, color: theme.accent, marginBottom: 16, cursor: 'pointer', display: 'inline-block', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            {book.author}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {caseName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FolderOpen size={16} style={{ color: theme.accent, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>ケース</div>
                <div style={{ fontSize: 14 }}>{caseName}{book.caseLabel ? ` / ${book.caseLabel}` : ''}</div>
              </div>
            </div>
          )}
          {book.publishedDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Archive size={16} style={{ color: theme.accent, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>刊行時期</div>
                <div style={{ fontSize: 14 }}>{displayPublishedDate(book.publishedDate)}</div>
              </div>
            </div>
          )}
        </div>

        {genreNames.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>ジャンル</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {genreNames.map((g) => <Chip key={g} label={g} />)}
            </div>
          </div>
        )}

        {tagNames.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>タグ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tagNames.map((t) => <Chip key={t} label={t} />)}
            </div>
          </div>
        )}

        {book.note && (
          <div style={{
            background: theme.bgCard, borderRadius: 12, padding: 16, marginBottom: 20,
            border: `1px solid ${theme.border}`, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: theme.text,
          }}>
            {book.note}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => onEdit(book)}><Edit size={15} /> 編集</Btn>
          <Btn variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> 削除</Btn>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="削除の確認" width={360}>
        <p style={{ fontSize: 14, color: theme.textDim, marginBottom: 16 }}>
          「{book.title}」を削除します。この操作は取り消せません。
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setConfirmDelete(false)}>キャンセル</Btn>
          <Btn variant="danger" onClick={() => { onDelete(book.id); setConfirmDelete(false) }}>削除する</Btn>
        </div>
      </Modal>
    </>
  )
}
