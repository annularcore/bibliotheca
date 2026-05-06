import { db } from '../db'
import type { Case } from '../types'
import { now } from '../utils/id'

export const caseRepository = {
  async getAll(): Promise<Case[]> {
    return db.cases.toArray()
  },

  async save(item: Case): Promise<Case> {
    const exists = await db.cases.get(item.id)
    const record = exists
      ? { ...item, updatedAt: now() }
      : { ...item, createdAt: now(), updatedAt: now() }
    await db.cases.put(record)
    return record
  },

  async delete(id: string): Promise<void> {
    await db.cases.delete(id)
  },

  async bulkSave(items: Case[]): Promise<void> {
    await db.cases.bulkPut(items)
  },
}
