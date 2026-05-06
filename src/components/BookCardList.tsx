import { BookOpen } from 'lucide-react'
import { theme } from '../theme'
import { displayPublishedDate } from '../utils/date'
import type { Book, Case, Genre, Tag } from '../types'

interface Props {
  book: Book
  cases: Case[]
  genres: Genre[]
  tags: Tag[]
  image: string | undefined
  onClick: () => void
}

export function BookCardList({ book, cases, genres, tags, image, onClick }: Props) {
  const caseName = cases.find((c) => c.id === book.caseId)?.name
  const genreNames = (book.genres ?? []).map((gId) => genres.find((g) => g.id === gId)?.name).filter(Boolean) as string[]
  const tagNames = (book.tags ?? []).map((tId) => tags.find((t) => t.id === tId)?.name).filter(Boolean) as string[]

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 14, padding: 14, background: theme.bgCard,
        borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
        border: `1px solid ${theme.border}`, alignItems: 'center',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent + '44' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border }}
    >
      <div style={{
        width: 52, height: 70, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
        background: theme.bgInput, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {image
          ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <BookOpen size={20} style={{ color: theme.textMuted, opacity: 0.3 }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: theme.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {book.title}
        </div>
        {book.author && <div style={{ fontSize: 12, color: theme.textDim, marginTop: 2 }}>{book.author}</div>}
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {caseName && (
            <span style={{ fontSize: 10, background: theme.accentSoft, color: theme.accent, padding: '2px 8px', borderRadius: 10 }}>
              📦 {caseName}
            </span>
          )}
          {genreNames.slice(0, 2).map((g) => (
            <span key={g} style={{ fontSize: 10, background: `${theme.border}66`, color: theme.textDim, padding: '2px 8px', borderRadius: 10 }}>
              {g}
            </span>
          ))}
          {tagNames.slice(0, 3).map((t) => (
            <span key={t} style={{ fontSize: 10, background: 'transparent', color: theme.textMuted, padding: '2px 6px', borderRadius: 10, border: `1px solid ${theme.border}` }}>
              #{t}
            </span>
          ))}
          {book.publishedDate && (
            <span style={{ fontSize: 10, color: theme.textMuted, marginLeft: 'auto', flexShrink: 0 }}>
              {displayPublishedDate(book.publishedDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
