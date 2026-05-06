import { db } from '../db'
import type { Book } from '../types'
import { now } from '../utils/id'

export const bookRepository = {
  async getAll(): Promise<Book[]> {
    return db.books.toArray()
  },

  async save(book: Book): Promise<Book> {
    const exists = await db.books.get(book.id)
    const record = exists
      ? { ...book, updatedAt: now() }
      : { ...book, createdAt: now(), updatedAt: now() }
    await db.books.put(record)
    return record
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.books, db.images, async () => {
      await db.books.delete(id)
      await db.images.delete(id)
    })
  },

  async bulkSave(books: Book[]): Promise<void> {
    await db.books.bulkPut(books)
  },
}
