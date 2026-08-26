import { supabase } from './supabase'

const REQUEST_TIMEOUT_MS = 30_000

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim() || import.meta.env.NEXT_PUBLIC_API_URL?.trim()
  if (!configuredUrl) return '/sivitai-api'

  try {
    const parsed = new URL(configuredUrl, window.location.origin)
    const isLocalUrl = import.meta.env.DEV && ['http:', 'https:'].includes(parsed.protocol)
    const isProductionUrl = parsed.protocol === 'https:'
    if (!isLocalUrl && !isProductionUrl) throw new Error('Unsupported API protocol.')
    return parsed.origin === window.location.origin ? parsed.pathname.replace(/\/$/, '') || '/' : parsed.toString().replace(/\/$/, '')
  } catch {
    return '/sivitai-api'
  }
}

const API_BASE_URL = resolveApiBaseUrl()

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

type ApiError = { message?: string; error?: string; details?: string }

type LibraryImage = {
  id: string
  url: string
  downloadUrl: string | null
  createdAt: string
  width: number | null
  height: number | null
}

type MyLibraryApiItem = {
  outputId: string
  url: string | null
  downloadUrl: string | null
  createdAt: string
  width: number | null
  height: number | null
}

type MyLibraryApiResponse = {
  items: MyLibraryApiItem[]
  nextCursor: string | null
}

// React Strict Mode can initiate parallel API requests before Supabase persists a
// guest session. Share the sign-in operation so only one anonymous user is created.
let anonymousSignIn: Promise<string> | null = null

async function getAccessToken(auth: 'required' | 'optional' | 'none') {
  if (auth === 'none') return null

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) return session.access_token

  if (auth === 'optional') {
    anonymousSignIn ??= supabase.auth.signInAnonymously()
      .then(({ data, error }) => {
        if (data.session?.access_token) return data.session.access_token
        if (error) throw error
        throw new Error('No guest session was returned.')
      })
      .finally(() => { anonymousSignIn = null })

    try {
      return await anonymousSignIn
    } catch {
      throw new Error('Guest generation is unavailable right now. Please try again later.')
    }
  }

  throw new Error('Please sign in to use AI tools.')
}

async function request<T>(path: string, init: RequestInit = {}, auth: 'required' | 'optional' | 'none' = 'none'): Promise<T> {
  if (!path.startsWith('/')) throw new Error('Invalid API request path.')

  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')

  if (auth !== 'none') {
    const accessToken = await getAccessToken(auth)
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const abortController = new AbortController()
  const timeoutId = window.setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal: abortController.signal })
    const payload: T | ApiError = await response.json().catch(() => ({}))
    if (!response.ok) {
      const apiError = payload as ApiError
      throw new Error(apiError.message ?? apiError.error ?? apiError.details ?? 'Unable to complete this request.')
    }
    return payload as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The request timed out. Please try again.')
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function getTool(slug: string) {
  return request<ToolDefinition>(`/api/tools/${encodeURIComponent(slug)}`)
}

export type ReferralSummary = {
  referralCode: string
  successfulReferrals: number
  bonusGenerations: number
}

export type ReferralLeaderboardItem = {
  rank: number
  account: string
  totalReferrals: number
}

export type ReferralHistoryItem = {
  friendAccount: string
  joinedAt: string
  status: 'successful' | 'pending'
  reward: number | null
}

export async function requestReferralSummary() {
  const { data, error } = await supabase.rpc('get_my_referral_summary')
  if (error) throw new Error(error.message)
  return data as ReferralSummary
}

export async function requestReferralLeaderboard(limit = 10) {
  const { data, error } = await supabase.rpc('get_referral_leaderboard', { p_limit: limit })
  if (error) throw new Error(error.message)
  return (data ?? []).map((item: { rank: number; account: string; total_referrals: number }) => ({ rank: item.rank, account: item.account, totalReferrals: item.total_referrals })) as ReferralLeaderboardItem[]
}

export async function requestReferralHistory(limit = 20) {
  const { data, error } = await supabase.rpc('get_my_referral_history', { p_limit: limit })
  if (error) throw new Error(error.message)
  return (data ?? []).map((item: { friend_account: string; joined_at: string; status: 'successful' | 'pending'; reward: number | null }) => ({ friendAccount: item.friend_account, joinedAt: item.joined_at, status: item.status, reward: item.reward })) as ReferralHistoryItem[]
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

export type PromoRedemptionResponse = {
  code: string
  generationsGranted: number
  creditsRemaining: number
  package: string | null
}

export function redeemPromoCode(code: string) {
  return request<PromoRedemptionResponse>('/api/promotions/redeem', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  }, 'required')
}

export type JoinBetaSubmission = {
  role: string
  goals: string[]
  task: string
  exampleName: string | null
}

export async function submitJoinBeta(submission: JoinBetaSubmission) {
  const { data, error } = await supabase.rpc('submit_join_beta', {
    p_role: submission.role,
    p_goals: submission.goals,
    p_task: submission.task,
    p_example_name: submission.exampleName,
  })
  if (error) throw new Error(error.message)
  return data as { generationsGranted: number; creditsRemaining: number; alreadySubmitted: boolean }
}

export type BillingSummary = {
  balance: number
  package: string | null
}

type BillingSummaryApiResponse = {
  creditBalance?: number | string | null
  balance?: number | string | null
  creditsRemaining?: number | string | null
  credits?: number | string | null
  package?: string | null
  currentPackage?: string | null
  activePackage?: { productName?: string | null } | null
}

function toNonNegativeNumber(value: number | string | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null
}

export async function requestBillingSummary() {
  const response = await request<BillingSummaryApiResponse>('/api/billing/me', {}, 'required')
  const balance = toNonNegativeNumber(response.creditBalance ?? response.balance ?? response.creditsRemaining ?? response.credits)
  if (balance === null) throw new Error('Billing API returned an invalid credit balance.')
  return { balance, package: response.package ?? response.currentPackage ?? response.activePackage?.productName ?? null } satisfies BillingSummary
}

export function createGeneration(slug: string, inputs: Record<string, unknown>, deviceId: string, freeGeneration: boolean) {
  return request<Pick<Generation, 'generationId' | 'status'>>(`/api/tools/${encodeURIComponent(slug)}/jobs`, {
    method: 'POST',
    headers: { 'X-Device-ID': deviceId },
    body: JSON.stringify({ inputs, deviceId, freeGeneration }),
  }, 'optional')
}

export async function getGeneration(generationId: string) {
  const generation = await request<Generation>(`/generations/${encodeURIComponent(generationId)}`, {}, 'optional')
  return {
    ...generation,
    outputs: generation.outputs.map((output) => ({
      ...output,
      url: isSafeRemoteUrl(output.url) ? output.url : null,
      downloadUrl: isSafeRemoteUrl(output.downloadUrl) ? output.downloadUrl : null,
    })),
  }
}

export function isSafeRemoteUrl(url: string | null | undefined) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || (import.meta.env.DEV && parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))
  } catch {
    return false
  }
}

export async function getMyLibrary(cursor?: string) {
  const query = new URLSearchParams({ limit: '20' })
  if (cursor) query.set('cursor', cursor)
  // The deployed API exposes the user's saved creations at /generations/gallery.
  // /generations/library is currently interpreted as /generations/:id by that API,
  // which produces “id must be a UUID”.
  const response = await request<MyLibraryApiResponse>(`/generations/gallery?${query.toString()}`, {}, 'required')

  return {
    ...response,
    items: response.items.flatMap((item) => item.url && isSafeRemoteUrl(item.url) ? [{
      id: item.outputId,
      url: item.url,
      downloadUrl: isSafeRemoteUrl(item.downloadUrl) ? item.downloadUrl : null,
      createdAt: item.createdAt,
      width: item.width,
      height: item.height,
    }] : []),
  }
}

export type { Generation, ImageReference, LibraryImage, ToolDefinition, ToolField }
