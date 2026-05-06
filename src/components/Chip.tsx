import { theme } from '../theme'

interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  onDelete?: () => void
}

export function Chip({ label, selected, onClick, onDelete }: ChipProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s', userSelect: 'none',
        background: selected ? theme.accentSoft : `${theme.border}66`,
        color: selected ? theme.accent : theme.textDim,
        border: `1px solid ${selected ? theme.accent + '44' : 'transparent'}`,
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
