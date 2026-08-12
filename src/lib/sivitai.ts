import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.DEV
  ? '/sivitai-api'
  : import.meta.env.NEXT_PUBLIC_API_URL ?? 'https://sivitai-api.onrender.com'

type ToolField = {
  name: string
  role?: 'source' | 'reference'
  type: 'image' | 'text' | 'textarea' | 'select' | 'number' | 'boolean'
  label?: string
  required?: boolean
  hidden?: boolean
  default?: unknown
  options?: string[]
  enum?: string[]
}

type ToolDefinition = {
  slug: string
  name: string
  inputSchema: { fields: ToolField[] }
}

type ImageReference = {
  storageBucket: string
  storagePath: string
  contentType: string
  originalName: string
  imageUrl?: string
}

type GenerationOutput = {
  id: string
  type: string
  url: string | null
  downloadUrl: string | null
}

type Generation = {
  generationId: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  outputs: GenerationOutput[]
  errorMessage: string | null
}

type ApiError = { message?: string }

async function getAccessToken(auth: 'required' | 'optional' | 'none') {
  if (auth === 'none') return null

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) return session.access_token

  if (auth === 'optional') {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (data.session?.access_token) return data.session.access_token
    if (error) throw new Error('Guest generation is unavailable right now. Please try again later.')
  }

  throw new Error('Please sign in to use AI tools.')
}

async function request<T>(path: string, init: RequestInit = {}, auth: 'required' | 'optional' | 'none' = 'none'): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  if (auth !== 'none') {
    const accessToken = await getAccessToken(auth)
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  const payload: T | ApiError = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error((payload as ApiError).message ?? 'Unable to complete this request.')
  return payload as T
}

export function getTool(slug: string) {
  return request<ToolDefinition>(`/api/tools/${encodeURIComponent(slug)}`)
}

type ImageUploadResponse = ImageReference | {
  data?: ImageReference
  image?: ImageReference
  sourceImage?: ImageReference
}

function getImageReference(response: ImageUploadResponse): ImageReference {
  const reference = 'storageBucket' in response
    ? response
    : response.data ?? response.image ?? response.sourceImage

  if (!reference?.storageBucket || !reference.storagePath || !reference.contentType || !reference.originalName) {
    throw new Error('Image upload did not return a valid source-image reference. Please try again.')
  }

  return reference
}

export async function uploadSourceImage(dataUrl: string, name: string) {
  const response = await request<ImageUploadResponse>('/generations/source-images', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, name }),
  }, 'optional')
  return getImageReference(response)
}

export function createGeneration(slug: string, inputs: Record<string, unknown>, deviceId: string, freeGeneration: boolean) {
  return request<Pick<Generation, 'generationId' | 'status'>>(`/api/tools/${encodeURIComponent(slug)}/jobs`, {
    method: 'POST',
    headers: { 'X-Device-ID': deviceId },
    body: JSON.stringify({ inputs, deviceId, freeGeneration }),
  }, 'optional')
}

export function getGeneration(generationId: string) {
  return request<Generation>(`/generations/${encodeURIComponent(generationId)}`, {}, 'optional')
}

export type { Generation, ImageReference, ToolDefinition, ToolField }
