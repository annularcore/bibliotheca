export interface Book {
  id: string
  title: string
  author: string | null
  genres: string[]
  tags: string[]
  caseId: string
  caseLabel: string | null
  publishedDate: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface Case {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Genre {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type SortKey =
  | 'createdAt_desc' | 'createdAt_asc'
  | 'title_asc' | 'title_desc'
  | 'author_asc'
  | 'publishedDate_desc' | 'publishedDate_asc'

export type ViewMode = 'grid' | 'list'

export type Page = 'list' | 'detail' | 'form' | 'settings'

export interface ToastState {
  visible: boolean
  message: string
  type: 'success' | 'error'
}
