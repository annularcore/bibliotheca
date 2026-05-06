import { BookOpen } from 'lucide-react'
import { theme } from '../theme'
import type { Book, Case } from '../types'

interface Props {
  book: Book
  cases: Case[]
  image: string | undefined
  onClick: () => void
}

export function BookCardGrid({ book, cases, image, onClick }: Props) {
  const caseName = cases.find((c) => c.id === book.caseId)?.name
  const isUntitled = book.title === '(無題)'

  return (
    <div
      onClick={onClick}
      style={{
        background: theme.bgCard, borderRadius: 12, overflow: 'hidden',
        cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${theme.border}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.accent + '44'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div style={{
        aspectRatio: '3/4', background: theme.bgInput,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {image
          ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <BookOpen size={32} style={{ color: theme.textMuted, opacity: 0.3 }} />
        }
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontSize: 13, fontWeight: 600, lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: isUntitled ? theme.textMuted : theme.text,
          fontStyle: isUntitled ? 'italic' : 'normal',
        }}>
          {book.title}
        </div>
        {book.author && <div style={{ fontSize: 11, color: theme.textDim, marginTop: 3 }}>{book.author}</div>}
        {caseName && <div style={{ fontSize: 10, color: theme.accent, marginTop: 4, opacity: 0.8 }}>📦 {caseName}</div>}
      </div>
    </div>
  )
}
