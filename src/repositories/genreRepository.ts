import { db } from '../db'
import type { Genre } from '../types'
import { now } from '../utils/id'

export const genreRepository = {
  async getAll(): Promise<Genre[]> {
    return db.genres.toArray()
  },

  async save(item: Genre): Promise<Genre> {
    const exists = await db.genres.get(item.id)
    const record = exists
      ? { ...item, updatedAt: now() }
      : { ...item, createdAt: now(), updatedAt: now() }
    await db.genres.put(record)
    return record
  },

  async delete(id: string): Promise<void> {
    await db.genres.delete(id)
  },

  async bulkSave(items: Genre[]): Promise<void> {
    await db.genres.bulkPut(items)
  },
}
