import { theme } from '../theme'

interface InputProps {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  type?: string
  style?: React.CSSProperties
  accept?: string
  capture?: string
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const inputBase: React.CSSProperties = {
  width: '100%', background: theme.bgInput, border: `1px solid ${theme.border}`,
  borderRadius: 8, padding: '10px 14px', color: theme.text,
  fontSize: 14, fontFamily: "'Noto Sans JP', sans-serif", outline: 'none',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
}

export function Input({
  label, value, onChange, placeholder, multiline, type = 'text', style,
  accept, capture, onFileChange,
}: InputProps) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = theme.accent
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = theme.border
  }

  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, color: theme.textDim, marginBottom: 5, fontWeight: 500 }}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputBase, resize: 'vertical', minHeight: 80 }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ) : type === 'file' ? (
        <input
          type="file"
          accept={accept}
          capture={capture as any}
          onChange={onFileChange}
          style={{ ...inputBase, padding: '8px 12px' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputBase}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}
    </div>
  )
}
