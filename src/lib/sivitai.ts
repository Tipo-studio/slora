import { supabase } from './supabase'

const API_BASE_URL = 'https://sivitai-api.onrender.com'

type ToolField = {
  name: string
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

async function request<T>(path: string, init: RequestInit = {}, requiresAuth = false): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  if (requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Please sign in to use AI tools.')
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  const payload: T | ApiError = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error((payload as ApiError).message ?? 'Unable to complete this request.')
  return payload as T
}

export function getTool(slug: string) {
  return request<ToolDefinition>(`/api/tools/${encodeURIComponent(slug)}`)
}

export function uploadSourceImage(dataUrl: string, name: string) {
  return request<ImageReference>('/generations/source-images', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, name }),
  }, true)
}

export function createGeneration(slug: string, inputs: Record<string, unknown>) {
  return request<Pick<Generation, 'generationId' | 'status'>>(`/api/tools/${encodeURIComponent(slug)}/jobs`, {
    method: 'POST',
    body: JSON.stringify({ inputs }),
  }, true)
}

export function getGeneration(generationId: string) {
  return request<Generation>(`/generations/${encodeURIComponent(generationId)}`, {}, true)
}

export type { Generation, ImageReference, ToolDefinition, ToolField }
