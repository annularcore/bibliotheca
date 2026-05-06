import { type LucideIcon } from 'lucide-react'
import { theme } from '../theme'

interface EmptyStateProps {
  icon: LucideIcon
  message: string
  sub?: string
}

export function EmptyState({ icon: Icon, message, sub }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: theme.textMuted }}>
      <Icon size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
      <p style={{ fontSize: 14, margin: 0, color: theme.textDim }}>{message}</p>
      {sub && <p style={{ fontSize: 12, margin: '6px 0 0', opacity: 0.6 }}>{sub}</p>}
    </div>
  )
}
