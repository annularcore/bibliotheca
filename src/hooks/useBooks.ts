import { useState, useCallback } from 'react'
import { bookRepository } from '../repositories/bookRepository'
import { getBookImage, setBookImage, deleteBookImage } from '../utils/image'
import { now } from '../utils/id'
import type { Book, ToastState } from '../types'

type ShowToast = (message: string, type?: ToastState['type']) => void

export function useBooks(showToast: ShowToast) {
  const [books, setBooks] = useState<Book[]>([])
  const [images, setImages] = useState<Record<string, string>>({})

  const loadImagesProgressively = useCallback(async (bookList: Book[]) => {
    const BATCH = 5
    for (let i = 0; i < bookList.length; i += BATCH) {
      const batch = bookList.slice(i, i + BATCH)
      const entries = await Promise.all(batch.map(async (b) => {
        const img = await getBookImage(b.id)
        return img ? [b.id, img] as [string, string] : null
      }))
      const newImgs: Record<string, string> = {}
      for (const e of entries) { if (e) newImgs[e[0]] = e[1] }
      if (Object.keys(newImgs).length > 0) setImages((prev) => ({ ...prev, ...newImgs }))
    }
  }, [])

  const loadBooksAndImages = useCallback(async (b: Book[]) => {
    setBooks(b)
    setImages({})
    await loadImagesProgressively(b)
  }, [loadImagesProgressively])

  const handleSaveBook = async (bookData: Book, imageData: string | null | undefined) => {
    await bookRepository.save(bookData)
    if (imageData !== undefined) {
      if (imageData) await setBookImage(bookData.id, imageData)
      else await deleteBookImage(bookData.id)
    }
    setBooks((prev) => {
      const idx = prev.findIndex((b) => b.id === bookData.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = bookData; return next }
      return [...prev, bookData]
    })
    if (imageData !== undefined) {
      setImages((prev) => {
        const next = { ...prev }
        if (imageData) next[bookData.id] = imageData
        else delete next[bookData.id]
        return next
      })
    }
    showToast('保存しました')
  }

  const handleDeleteBook = async (id: string) => {
    await bookRepository.delete(id)
    setBooks((prev) => prev.filter((b) => b.id !== id))
    setImages((prev) => { const next = { ...prev }; delete next[id]; return next })
    showToast('削除しました')
  }

  const handleBatchDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => bookRepository.delete(id)))
    const idSet = new Set(ids)
    setBooks((prev) => prev.filter((b) => !idSet.has(b.id)))
    setImages((prev) => {
      const next = { ...prev }
      for (const id of ids) delete next[id]
      return next
    })
    showToast(`${ids.length}冊削除しました`)
  }

  // Common logic for batch genre/tag assignment
  const batchAddLabel = async (
    field: 'genres' | 'tags',
    ids: string[],
    itemId: string,
    typeName: string,
  ) => {
    const updated = books
      .filter((b) => ids.includes(b.id) && !(b[field] ?? []).includes(itemId))
      .map((b) => ({ ...b, [field]: [...(b[field] ?? []), itemId], updatedAt: now() }))
    if (updated.length === 0) { showToast(`すでに全冊に${typeName}が付いています`); return }
    await Promise.all(updated.map((b) => bookRepository.save(b)))
    const updatedMap = new Map(updated.map((b) => [b.id, b]))
    setBooks((prev) => prev.map((b) => updatedMap.get(b.id) ?? b))
    showToast(`${updated.length}冊に${typeName}を追加しました`)
  }

  const handleBatchAddGenre = (ids: string[], genreId: string) =>
    batchAddLabel('genres', ids, genreId, 'ジャンル')
  const handleBatchAddTag = (ids: string[], tagId: string) =>
    batchAddLabel('tags', ids, tagId, 'タグ')

  // For master delete cleanup (cases/genres/tags removed in-memory from books)
  const cleanupBookField = (field: 'caseId', value: string, replacement: string) => {
    setBooks((prev) => prev.map((b) => b[field] === value ? { ...b, [field]: replacement } : b))
  }
  const cleanupBookArrayField = (field: 'genres' | 'tags', id: string) => {
    setBooks((prev) => prev.map((b) => ({ ...b, [field]: (b[field] ?? []).filter((x) => x !== id) })))
  }

  return {
    books, images, setBooks, setImages,
    loadBooksAndImages,
    handleSaveBook, handleDeleteBook, handleBatchDelete,
    handleBatchAddGenre, handleBatchAddTag,
    cleanupBookField, cleanupBookArrayField,
  }
}
