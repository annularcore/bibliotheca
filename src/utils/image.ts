import { db } from '../db'

export async function getBookImage(bookId: string): Promise<string | null> {
  const entry = await db.images.get(bookId)
  return entry?.data ?? null
}

export async function setBookImage(bookId: string, data: string): Promise<void> {
  await db.images.put({ bookId, data })
}

export async function deleteBookImage(bookId: string): Promise<void> {
  await db.images.delete(bookId)
}

export function compressImage(file: File, maxDim = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > height && width > maxDim) {
          height = (height * maxDim) / width
          width = maxDim
        } else if (height > maxDim) {
          width = (width * maxDim) / height
          height = maxDim
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}
