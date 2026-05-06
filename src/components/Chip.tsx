import { theme } from '../theme'

interface ChipProps {
  label: string
  selected?: boolean
  excluded?: boolean
  onClick?: () => void
  onDelete?: () => void
}

export function Chip({ label, selected, excluded, onClick, onDelete }: ChipProps) {
  const bg = excluded ? `${theme.danger}22` : selected ? theme.accentSoft : `${theme.border}66`
  const fg = excluded ? theme.danger : selected ? theme.accent : theme.textDim
  const borderColor = excluded ? `${theme.danger}66` : selected ? `${theme.accent}44` : 'transparent'
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s', userSelect: 'none',
        background: bg, color: fg,
        border: `1px solid ${borderColor}`,
        textDecoration: excluded ? 'line-through' : 'none',
      }}
    >
      {label}
      {onDelete && (
        <span
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{ marginLeft: 2, cursor: 'pointer', opacity: 0.6, lineHeight: 1 }}
        >
          ×
        </span>
      )}
    </span>
  )
}
