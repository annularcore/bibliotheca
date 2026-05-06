import { theme } from '../theme'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: number
}

export function Modal({ open, onClose, title, children, width = 420 }: ModalProps) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.bgCard, borderRadius: 16, padding: 24,
          width: '100%', maxWidth: width, maxHeight: '80vh', overflowY: 'auto',
          border: `1px solid ${theme.border}`, boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: theme.text, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            {title}
          </h3>
          <span onClick={onClose} style={{ cursor: 'pointer', color: theme.textDim, fontSize: 20 }}>×</span>
        </div>
        {children}
      </div>
    </div>
  )
}
