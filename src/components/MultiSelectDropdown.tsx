import { useState } from 'react'
import { Plus } from 'lucide-react'
import { theme } from '../theme'
import { Chip } from './Chip'

interface Item { id: string; name: string }

interface MultiSelectDropdownProps {
  label: string
  items: Item[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onAdd: (name: string) => Promise<void>
  placeholder?: string
  addPlaceholder?: string
}

export function MultiSelectDropdown({
  label, items, selectedIds, onToggle, onAdd, addPlaceholder,
}: MultiSelectDropdownProps) {
  const [newValue, setNewValue] = useState('')
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? items.filter((i) => i.name.toLowerCase().includes(filter.toLowerCase()))
    : items

  const handleAdd = async () => {
    const val = newValue.trim()
    if (!val || items.some((i) => i.name === val)) return
    await onAdd(val)
    setNewValue('')
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: theme.textDim, marginBottom: 6, fontWeight: 500 }}>
        {label} {selectedIds.length > 0 && <span style={{ color: theme.accent }}>({selectedIds.length})</span>}
      </label>

      {items.length > 8 && (
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="絞り込み…"
          style={{
            width: '100%', background: theme.bgInput, border: `1px solid ${theme.border}`,
            borderRadius: 6, padding: '6px 10px', color: theme.text, fontSize: 12,
            fontFamily: "'Noto Sans JP', sans-serif", outline: 'none',
            boxSizing: 'border-box', marginBottom: 8,
          }}
        />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {filtered.length === 0 && (
          <span style={{ fontSize: 12, color: theme.textMuted }}>
            {items.length === 0 ? '項目がありません' : '一致する項目がありません'}
          </span>
        )}
        {filtered.map((item) => (
          <Chip
            key={item.id}
            label={item.name}
            selected={selectedIds.includes(item.id)}
            onClick={() => onToggle(item.id)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={addPlaceholder ?? '新規追加…'}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{
            flex: 1, background: theme.bgInput, border: `1px solid ${theme.border}`,
            borderRadius: 6, padding: '6px 10px', color: theme.text, fontSize: 12,
            fontFamily: "'Noto Sans JP', sans-serif", outline: 'none',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!newValue.trim()}
          style={{
            background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 6,
            padding: '4px 8px', cursor: newValue.trim() ? 'pointer' : 'not-allowed',
            color: theme.textDim, display: 'flex', alignItems: 'center',
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
