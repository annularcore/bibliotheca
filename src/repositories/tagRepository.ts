import { db } from '../db'
import type { Tag } from '../types'
import { now } from '../utils/id'

export const tagRepository = {
  async getAll(): Promise<Tag[]> {
    return db.tags.toArray()
  },

  async save(item: Tag): Promise<Tag> {
    const exists = await db.tags.get(item.id)
    const record = exists
      ? { ...item, updatedAt: now() }
      : { ...item, createdAt: now(), updatedAt: now() }
    await db.tags.put(record)
    return record
  },

  async delete(id: string): Promise<void> {
    await db.tags.delete(id)
  },

  async bulkSave(items: Tag[]): Promise<void> {
    await db.tags.bulkPut(items)
  },
}
