import { useState, useRef } from 'react'
import { normalizePublishedDate } from '../utils/date'
import { ChevronLeft, Camera, X, Plus, Save, Image as ImageIcon } from 'lucide-react'
import { theme } from '../theme'
import { Btn } from '../components/Btn'
import { Input, inputBase } from '../components/Input'
import { MultiSelectDropdown } from '../components/MultiSelectDropdown'
import { compressImage } from '../utils/image'
import { generateId, now } from '../utils/id'
import type { Book, Case, Genre, Tag } from '../types'

interface FormPageProps {
  book: Book | null
  cases: Case[]
  genres: Genre[]
  tags: Tag[]
  image: string | null
  onSave: (book: Book, imageData: string | null | undefined, continueAdding: boolean) => Promise<void>
  onCancel: () => void
  onAddGenre: (name: string) => Promise<Genre>
  onAddTag: (name: string) => Promise<Tag>
  onAddCase: (name: string) => Promise<Case>
}

export function FormPage({ book, cases, genres, tags, image: existingImage, onSave, onCancel, onAddGenre, onAddTag, onAddCase }: FormPageProps) {
  const isEdit = !!book
  const [title, setTitle] = useState(book?.title ?? '')
  const [author, setAuthor] = useState(book?.author ?? '')
  const [selectedGenres, setSelectedGenres] = useState<string[]>(book?.genres ?? [])
  const [selectedTags, setSelectedTags] = useState<string[]>(book?.tags ?? [])
  const [caseId, setCaseId] = useState(book?.caseId ?? '')
  const [caseLabel, setCaseLabel] = useState(book?.caseLabel ?? '')
  const [publishedDate, setPublishedDate] = useState(book?.publishedDate ?? '')
  const [note, setNote] = useState(book?.note ?? '')
  const [imageData, setImageData] = useState<string | null>(existingImage ?? null)
  const [imageChanged, setImageChanged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newCase, setNewCase] = useState('')
  const [showNewCase, setShowNewCase] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setImageData(compressed)
    setImageChanged(true)
  }

  const handleSave = async (continueAdding: boolean) => {
    if (!caseId) return
    setSaving(true)
    const bookData: Book = {
      id: book?.id ?? generateId(),
      title: title.trim() || '(無題)',
      author: author.trim() || null,
      genres: selectedGenres,
      tags: selectedTags,
      caseId,
      caseLabel: caseLabel.trim() || null,
      publishedDate: normalizePublishedDate(publishedDate),
      note: note.trim() || null,
      createdAt: book?.createdAt ?? now(),
      updatedAt: now(),
    }
    await onSave(bookData, imageChanged ? imageData : undefined, continueAdding)
    if (continueAdding) {
      setTitle(''); setAuthor(''); setSelectedGenres([]); setSelectedTags([])
      setCaseId(''); setCaseLabel(''); setPublishedDate(''); setNote('')
      setImageData(null); setImageChanged(false)
    }
    setSaving(false)
  }

  const handleAddCaseInline = async () => {
    if (!newCase.trim() || cases.some((c) => c.name === newCase.trim())) return
    const created = await onAddCase(newCase.trim())
    setCaseId(created.id)
    setNewCase('')
    setShowNewCase(false)
  }

  const inputStyle: React.CSSProperties = { ...inputBase, padding: '8px 10px', fontSize: 13 }

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100,
        background: theme.bg + 'ee', backdropFilter: 'blur(12px)',
      }}>
        <span onClick={onCancel} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: theme.textDim, fontSize: 13 }}>
          <ChevronLeft size={18} /> {isEdit ? '詳細' : '一覧'}
        </span>
      </div>

      <div className="fade-in" style={{ padding: '16px 20px 40px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, marginBottom: 20, color: theme.text }}>
          {isEdit ? '書籍を編集' : '書籍を登録'}
        </h2>

        {/* Cover Image */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: theme.textDim, marginBottom: 6, fontWeight: 500 }}>表紙画像</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 90, height: 120, borderRadius: 8, overflow: 'hidden',
              background: theme.bgInput, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px dashed ${theme.border}`, flexShrink: 0,
            }}>
              {imageData
                ? <img src={imageData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <ImageIcon size={24} style={{ color: theme.textMuted, opacity: 0.3 }} />
              }
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Btn variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                <Camera size={14} /> {imageData ? '変更' : '撮影 / 選択'}
              </Btn>
              {imageData && (
                <Btn variant="ghost" size="sm" onClick={() => { setImageData(null); setImageChanged(true) }}>
                  <X size={14} /> 削除
                </Btn>
              )}
              <input type="file" accept="image/*" capture="environment" ref={fileRef} onChange={handleImageChange} style={{ display: 'none' }} />
            </div>
          </div>
        </div>

        <Input label="タイトル" value={title} onChange={setTitle} placeholder="書籍タイトル" />
        <Input label="作家名" value={author} onChange={setAuthor} placeholder="作家名" />
        <Input label="刊行時期" value={publishedDate} onChange={setPublishedDate} placeholder="yyyy/mm" />

        <MultiSelectDropdown
          label="ジャンル" items={genres} selectedIds={selectedGenres}
          onToggle={(id) => setSelectedGenres((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
          onAdd={async (name) => { const c = await onAddGenre(name); setSelectedGenres((prev) => [...prev, c.id]) }}
          placeholder="ジャンルを選択…" addPlaceholder="新しいジャンルを追加…"
        />

        <MultiSelectDropdown
          label="タグ" items={tags} selectedIds={selectedTags}
          onToggle={(id) => setSelectedTags((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
          onAdd={async (name) => { const c = await onAddTag(name); setSelectedTags((prev) => [...prev, c.id]) }}
          placeholder="タグを選択…" addPlaceholder="新しいタグを追加…"
        />

        {/* Case */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: theme.textDim, marginBottom: 6, fontWeight: 500 }}>ケース *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              style={{ ...inputStyle, flex: 1, border: `1px solid ${!caseId ? theme.danger + '66' : theme.border}` }}
            >
              <option value="">-- ケースを選択 --</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Btn variant="ghost" size="sm" onClick={() => setShowNewCase(!showNewCase)}><Plus size={14} /></Btn>
          </div>
          {showNewCase && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input
                value={newCase}
                onChange={(e) => setNewCase(e.target.value)}
                placeholder="新規ケース名…"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCaseInline()}
                style={{ ...inputStyle, flex: 1 }}
              />
              <Btn size="sm" onClick={handleAddCaseInline} disabled={!newCase.trim()}>追加</Btn>
            </div>
          )}
        </div>

        <Input label="ケース補足ラベル" value={caseLabel} onChange={setCaseLabel} placeholder="例：上段、奥側" />
        <Input label="自由記述（メモ・感想）" value={note} onChange={setNote} placeholder="自分の言葉でメモを残す…" multiline />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          <Btn onClick={() => handleSave(false)} disabled={!caseId || saving}>
            <Save size={15} /> {isEdit ? '更新' : '登録'}
          </Btn>
          {!isEdit && (
            <Btn variant="secondary" onClick={() => handleSave(true)} disabled={!caseId || saving}>
              <Plus size={15} /> 登録して続ける
            </Btn>
          )}
          <Btn variant="ghost" onClick={onCancel}>キャンセル</Btn>
        </div>
      </div>
    </>
  )
}
