const IMAGE_LIBRARY_STORAGE_KEY = 'slora-image-library'
const HIDDEN_LIBRARY_IMAGE_STORAGE_KEY = 'slora-hidden-library-images'

type LibraryImage = {
  id: string
  url: string
  createdAt: string
  layout?: 'standard' | 'tall' | 'wide'
}

type ImageLibrary = Record<string, LibraryImage[]>
type HiddenLibraryImages = Record<string, string[]>

function readLibrary(): ImageLibrary {
  try {
    return JSON.parse(window.localStorage.getItem(IMAGE_LIBRARY_STORAGE_KEY) ?? '{}') as ImageLibrary
  } catch {
    return {}
  }
}

function readHiddenLibraryImages(): HiddenLibraryImages {
  try {
    return JSON.parse(window.localStorage.getItem(HIDDEN_LIBRARY_IMAGE_STORAGE_KEY) ?? '{}') as HiddenLibraryImages
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

export function deleteLibraryImage(userId: string, imageId: string) {
  const library = readLibrary()
  const images = library[userId] ?? []
  window.localStorage.setItem(IMAGE_LIBRARY_STORAGE_KEY, JSON.stringify({ ...library, [userId]: images.filter((image) => image.id !== imageId) }))
}

export function getHiddenLibraryImageIds(userId: string) {
  return new Set(readHiddenLibraryImages()[userId] ?? [])
}

export function hideLibraryImage(userId: string, imageId: string) {
  const hiddenImages = readHiddenLibraryImages()
  const hiddenImageIds = new Set(hiddenImages[userId] ?? [])
  hiddenImageIds.add(imageId)
  window.localStorage.setItem(HIDDEN_LIBRARY_IMAGE_STORAGE_KEY, JSON.stringify({ ...hiddenImages, [userId]: [...hiddenImageIds] }))
}

export type { LibraryImage }
