import { theme } from '../theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface BtnProps {
  children: React.ReactNode
  variant?: Variant
  size?: Size
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
  type?: 'button' | 'submit'
}

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 12 },
  md: { padding: '10px 18px', fontSize: 13 },
  lg: { padding: '12px 24px', fontSize: 14 },
}

const variants: Record<Variant, React.CSSProperties> = {
  primary:   { background: theme.accent, color: '#0f1023' },
  secondary: { background: theme.border, color: theme.text },
  ghost:     { background: 'transparent', color: theme.textDim, border: `1px solid ${theme.border}` },
  danger:    { background: theme.dangerBg, color: theme.danger, border: `1px solid ${theme.danger}33` },
}

export function Btn({
  children, variant = 'primary', size = 'md',
  onClick, disabled, style, type = 'button',
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'all 0.2s', opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        ...sizes[size], ...variants[variant], ...style,
      }}
    >
      {children}
    </button>
  )
}
