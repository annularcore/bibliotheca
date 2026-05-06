import { useRef, useEffect } from 'react'
import { ChevronLeft, Archive, Download, Upload, FolderOpen, Layers, Tag, FolderInput } from 'lucide-react'
import { theme } from '../theme'
import { Btn } from '../components/Btn'
import { MasterManager } from '../components/MasterManager'
import type { Case, Genre, Tag as TagType } from '../types'

interface SettingsPageProps {
  cases: Case[]
  genres: Genre[]
  tags: TagType[]
  bookCount: number
  exportStatus: string | null
  folderImportStatus: string | null
  hasUnexportedChanges: boolean
  onAddCase: (name: string) => Promise<Case>
  onRenameCase: (id: string, name: string) => Promise<void>
  onDeleteCase: (id: string) => Promise<void>
  onAddGenre: (name: string) => Promise<Genre>
  onRenameGenre: (id: string, name: string) => Promise<void>
  onDeleteGenre: (id: string) => Promise<void>
  onAddTag: (name: string) => Promise<TagType>
  onRenameTag: (id: string, name: string) => Promise<void>
  onDeleteTag: (id: string) => Promise<void>
  onExport: () => Promise<void>
  onImport: (file: File) => Promise<void>
  onFolderImport: (files: FileList) => Promise<void>
  onBack: () => void
}

export function SettingsPage({
  cases, genres, tags, bookCount, exportStatus, folderImportStatus, hasUnexportedChanges,
  onAddCase, onRenameCase, onDeleteCase,
  onAddGenre, onRenameGenre, onDeleteGenre,
  onAddTag, onRenameTag, onDeleteTag,
  onExport, onImport, onFolderImport, onBack,
}: SettingsPageProps) {
  const importRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)
  const isExporting = !!exportStatus
  const isFolderImporting = !!folderImportStatus

  // webkitdirectory must be set as a DOM attribute (not a React prop)
  useEffect(() => {
    if (folderRef.current) {
      folderRef.current.setAttribute('webkitdirectory', '')
      folderRef.current.setAttribute('multiple', '')
    }
  }, [])

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100,
        background: theme.bg + 'ee', backdropFilter: 'blur(12px)',
      }}>
        <span onClick={onBack} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: theme.textDim, fontSize: 13 }}>
          <ChevronLeft size={18} /> 一覧
        </span>
      </div>

      <div className="fade-in" style={{ padding: '16px 20px 40px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, marginBottom: 20, color: theme.text }}>
          設定・データ管理
        </h2>

        {/* Backup */}
        <div style={{ background: theme.bgCard, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${theme.border}` }}>
          <h4 style={{ fontSize: 14, color: theme.accent, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 12px' }}>
            <Archive size={16} /> バックアップ
          </h4>
          <p style={{ fontSize: 12, color: theme.textDim, marginBottom: 12, lineHeight: 1.6 }}>
            現在 {bookCount} 冊登録済み。定期的なバックアップを推奨します。
          </p>
          {hasUnexportedChanges && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#3a1a1a', borderRadius: 8, fontSize: 12, color: theme.danger, fontWeight: 500, border: `1px solid ${theme.danger}44` }}>
              ⚠️ 前回のエクスポート以降に変更があります。バックアップをお忘れなく。
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn onClick={onExport} disabled={isExporting}>
              <Download size={15} /> {isExporting ? '処理中…' : 'ZIPでダウンロード'}
            </Btn>
            <Btn variant="ghost" onClick={() => importRef.current?.click()} disabled={isExporting}>
              <Upload size={15} /> インポート
            </Btn>
            <input
              type="file" accept=".zip,.json,application/zip,application/x-zip-compressed,application/json" ref={importRef} style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = '' }}
            />
          </div>
          {exportStatus && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: theme.accentSoft, borderRadius: 8, fontSize: 12, color: theme.accent, fontWeight: 500 }}>
              {exportStatus}
            </div>
          )}
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>
            インポートは ZIP（新形式）と JSON（旧バックアップ）の両方に対応しています。
          </p>
        </div>

        {/* Folder bulk import */}
        <div style={{ background: theme.bgCard, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${theme.border}` }}>
          <h4 style={{ fontSize: 14, color: theme.accent, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 12px' }}>
            <FolderInput size={16} /> フォルダ一括登録
          </h4>
          <p style={{ fontSize: 12, color: theme.textDim, marginBottom: 12, lineHeight: 1.6 }}>
            フォルダを選択すると、フォルダ名をケース名として中の画像を一括登録します。
            同名のケースが既にある場合はそのケースに追加します。
          </p>
          <Btn onClick={() => folderRef.current?.click()} disabled={isFolderImporting}>
            <FolderOpen size={15} /> {isFolderImporting ? folderImportStatus : 'フォルダを選択'}
          </Btn>
          <input
            type="file" accept="image/*" ref={folderRef} style={{ display: 'none' }}
            onChange={(e) => { const files = e.target.files; if (files?.length) onFolderImport(files); e.target.value = '' }}
          />
          {isFolderImporting && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: theme.accentSoft, borderRadius: 8, fontSize: 12, color: theme.accent, fontWeight: 500 }}>
              {folderImportStatus}
            </div>
          )}
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>
            ※ タイトルはすべて「(無題)」で登録されます。登録後に個別編集してください。
          </p>
        </div>

        {/* Masters */}
        <div style={{ background: theme.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${theme.border}` }}>
          <MasterManager
            title="ケース管理" items={cases} icon={FolderOpen}
            onAdd={async (n) => { await onAddCase(n) }}
            onRename={onRenameCase} onDelete={onDeleteCase}
          />
          <MasterManager
            title="ジャンル管理" items={genres} icon={Layers}
            onAdd={async (n) => { await onAddGenre(n) }}
            onRename={onRenameGenre} onDelete={onDeleteGenre}
          />
          <MasterManager
            title="タグ管理" items={tags} icon={Tag}
            onAdd={async (n) => { await onAddTag(n) }}
            onRename={onRenameTag} onDelete={onDeleteTag}
          />
        </div>
      </div>
    </>
  )
}
