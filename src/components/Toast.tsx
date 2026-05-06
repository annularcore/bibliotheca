import { Check, AlertTriangle } from 'lucide-react'
import { theme } from '../theme'
import type { ToastState } from '../types'

export function Toast({ visible, message, type }: ToastState) {
  if (!visible) return null
  const isSuccess = type === 'success'
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
      background: isSuccess ? theme.successBg : theme.dangerBg,
      color: isSuccess ? theme.success : theme.danger,
      border: `1px solid ${(isSuccess ? theme.success : theme.danger)}33`,
      padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500,
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 8,
      maxWidth: 'calc(100vw - 48px)', textAlign: 'center',
    }}>
      {isSuccess ? <Check size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  )
}
