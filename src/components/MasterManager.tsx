import { useState } from 'react'
import { Plus, Edit, Trash2, Check, X, type LucideIcon } from 'lucide-react'
import { theme } from '../theme'
import { Btn } from './Btn'

interface Item { id: string; name: string }

interface MasterManagerProps {
  title: string
  items: Item[]
  icon: LucideIcon
  onAdd: (name: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function MasterManager({ title, items, icon: Icon, onAdd, onRename, onDelete }: MasterManagerProps) {
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async () => {
    const trimmed = newName.trim()
    if (!trimmed || items.some((i) => i.name === trimmed)) return
    await onAdd(trimmed)
    setNewName('')
  }

  const commitEdit = async (id: string) => {
    const trimmed = editName.trim()
    if (trimmed) await onRename(id, trimmed)
    setEditId(null)
  }

  const inputStyle: React.CSSProperties = {
    background: theme.bgInput, border: `1px solid ${theme.border}`,
    borderRadius: 8, padding: '8px 12px', color: theme.text, fontSize: 13,
    fontFamily: "'Noto Sans JP', sans-serif", outline: 'none',
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ fontSize: 14, color: theme.accent, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px' }}>
        <Icon size={16} /> {title}
      </h4>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新規追加…"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{ ...inputStyle, flex: 1 }}
        />
        <Btn size="sm" onClick={handleAdd} disabled={!newName.trim()}><Plus size={14} /></Btn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
        {items.map((item) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
            background: theme.bgInput, borderRadius: 8, fontSize: 13, color: theme.text,
          }}>
            {editId === item.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(item.id)
                    if (e.key === 'Escape') setEditId(null)
                  }}
                  style={{ flex: 1, background: 'transparent', border: `1px solid ${theme.accent}`, borderRadius: 6, padding: '4px 8px', color: theme.text, fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif", outline: 'none' }}
                />
                <span onClick={() => commitEdit(item.id)} style={{ cursor: 'pointer', color: theme.success }}><Check size={14} /></span>
                <span onClick={() => setEditId(null)} style={{ cursor: 'pointer', color: theme.textDim }}><X size={14} /></span>
              </>
            ) : (
              <>
                <span style={{ flex: 1 }}>{item.name}</span>
                <span onClick={() => { setEditId(item.id); setEditName(item.name) }} style={{ cursor: 'pointer', color: theme.textDim }}><Edit size={13} /></span>
                <span onClick={() => onDelete(item.id)} style={{ cursor: 'pointer', color: theme.danger }}><Trash2 size={13} /></span>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <div style={{ fontSize: 12, color: theme.textMuted, padding: 8 }}>未登録</div>}
      </div>
    </div>
  )
}
