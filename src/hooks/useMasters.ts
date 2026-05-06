import { useState } from 'react'
import { caseRepository } from '../repositories/caseRepository'
import { genreRepository } from '../repositories/genreRepository'
import { tagRepository } from '../repositories/tagRepository'
import { generateId, now } from '../utils/id'
import type { Case, Genre, Tag } from '../types'

const sortByName = <T extends { name: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name, 'ja'))

export function useMasters() {
  const [cases, setCases] = useState<Case[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  // ── Case handlers ──────────────────────────────────────────
  const handleAddCase = async (name: string): Promise<Case> => {
    const item: Case = { id: generateId(), name, createdAt: now(), updatedAt: now() }
    await caseRepository.save(item)
    setCases((prev) => sortByName([...prev, item]))
    return item
  }
  const handleRenameCase = async (id: string, name: string) => {
    const item = cases.find((x) => x.id === id)
    if (!item) return
    const updated = { ...item, name, updatedAt: now() }
    await caseRepository.save(updated)
    setCases((prev) => sortByName(prev.map((x) => x.id === id ? updated : x)))
  }
  const handleDeleteCase = async (id: string) => {
    await caseRepository.delete(id)
    setCases((prev) => prev.filter((x) => x.id !== id))
  }

  // ── Genre handlers ──────────────────────────────────────────
  const handleAddGenre = async (name: string): Promise<Genre> => {
    const item: Genre = { id: generateId(), name, createdAt: now(), updatedAt: now() }
    await genreRepository.save(item)
    setGenres((prev) => sortByName([...prev, item]))
    return item
  }
  const handleRenameGenre = async (id: string, name: string) => {
    const item = genres.find((x) => x.id === id)
    if (!item) return
    const updated = { ...item, name, updatedAt: now() }
    await genreRepository.save(updated)
    setGenres((prev) => sortByName(prev.map((x) => x.id === id ? updated : x)))
  }
  const handleDeleteGenre = async (id: string) => {
    await genreRepository.delete(id)
    setGenres((prev) => prev.filter((x) => x.id !== id))
  }

  // ── Tag handlers ──────────────────────────────────────────
  const handleAddTag = async (name: string): Promise<Tag> => {
    const item: Tag = { id: generateId(), name, createdAt: now(), updatedAt: now() }
    await tagRepository.save(item)
    setTags((prev) => sortByName([...prev, item]))
    return item
  }
  const handleRenameTag = async (id: string, name: string) => {
    const item = tags.find((x) => x.id === id)
    if (!item) return
    const updated = { ...item, name, updatedAt: now() }
    await tagRepository.save(updated)
    setTags((prev) => sortByName(prev.map((x) => x.id === id ? updated : x)))
  }
  const handleDeleteTag = async (id: string) => {
    await tagRepository.delete(id)
    setTags((prev) => prev.filter((x) => x.id !== id))
  }

  // Used by external loaders (e.g. initial load, import)
  const setAllMasters = (c: Case[], g: Genre[], t: Tag[]) => {
    setCases(sortByName(c)); setGenres(sortByName(g)); setTags(sortByName(t))
  }

  return {
    cases, genres, tags, setAllMasters,
    handleAddCase, handleRenameCase, handleDeleteCase,
    handleAddGenre, handleRenameGenre, handleDeleteGenre,
    handleAddTag, handleRenameTag, handleDeleteTag,
  }
}
