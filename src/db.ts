import Dexie, { type Table } from 'dexie'
import type { Book, Case, Genre, Tag } from './types'

export interface BookImage {
  bookId: string
  data: string
}

class BibliothecaDB extends Dexie {
  books!: Table<Book>
  images!: Table<BookImage>
  cases!: Table<Case>
  genres!: Table<Genre>
  tags!: Table<Tag>

  constructor() {
    super('bibliotheca')
    this.version(1).stores({
      books:  'id, caseId, createdAt',
      images: 'bookId',
      cases:  'id, name',
      genres: 'id, name',
      tags:   'id, name',
    })
  }
}

export const db = new BibliothecaDB()
