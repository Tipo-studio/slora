const IMAGE_LIBRARY_STORAGE_KEY = 'slora-image-library'

type LibraryImage = {
  id: string
  url: string
  createdAt: string
  layout?: 'standard' | 'tall' | 'wide'
}

type ImageLibrary = Record<string, LibraryImage[]>

function readLibrary(): ImageLibrary {
  try {
    return JSON.parse(window.localStorage.getItem(IMAGE_LIBRARY_STORAGE_KEY) ?? '{}') as ImageLibrary
  } catch {
    return {}
  }
}

export function getLibraryImages(userId: string) {
  return readLibrary()[userId] ?? []
}

export function addLibraryImages(userId: string, urls: string[]) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))]
  if (uniqueUrls.length === 0) return

  const library = readLibrary()
  const existing = library[userId] ?? []
  const existingUrls = new Set(existing.map((image) => image.url))
  const newImages = uniqueUrls
    .filter((url) => !existingUrls.has(url))
    .map((url) => ({ id: crypto.randomUUID(), url, createdAt: new Date().toISOString() }))

  if (newImages.length === 0) return
  window.localStorage.setItem(IMAGE_LIBRARY_STORAGE_KEY, JSON.stringify({ ...library, [userId]: [...newImages, ...existing] }))
}

export type { LibraryImage }
