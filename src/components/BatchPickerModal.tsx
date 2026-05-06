import { theme } from '../theme'
import { Btn } from './Btn'
import { Modal } from './Modal'

interface Item { id: string; name: string }

interface BatchPickerModalProps {
  open: boolean
  onClose: () => void
  title: string
  itemLabel: string  // "ジャンル" or "タグ" 等
  selectedCount: number
  items: Item[]
  isBusy: boolean
  onSelect: (id: string) => void
}

export function BatchPickerModal({
  open, onClose, title, itemLabel, selectedCount, items, isBusy, onSelect,
}: BatchPickerModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={360}>
      <p style={{ fontSize: 13, color: theme.textDim, marginBottom: 14 }}>
        選択中の {selectedCount} 冊に付与する{itemLabel}を選んでください。<br />
        すでに付いているものはスキップします。
      </p>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: theme.textMuted }}>
          {itemLabel}が登録されていません。設定画面から追加してください。
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {items.map((item) => (
            <button
              key={item.id}
              disabled={isBusy}
              onClick={() => onSelect(item.id)}
              style={{
                background: theme.accentSoft, border: `1px solid ${theme.accent}44`,
                borderRadius: 20, padding: '6px 14px', color: theme.accent,
                fontSize: 13, cursor: isBusy ? 'default' : 'pointer',
                fontFamily: "'Noto Sans JP', sans-serif", opacity: isBusy ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>閉じる</Btn>
      </div>
    </Modal>
  )
}
