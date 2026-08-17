import type { Generation } from '../../lib/sivitai'

const TRYON_SESSION_STORAGE_KEY = 'slora-tryon-session'
const PENDING_GUEST_GENERATION_STORAGE_KEY = 'slora-pending-guest-generation'

type TryOnTool = 'try-on' | 'magic-editor' | 'ai-studio'
type GuestImage = { dataUrl: string; name: string }
type PendingGuestGeneration = {
  activeTool: TryOnTool
  guestImages: Record<string, GuestImage | undefined>
  prompt: string
}

type SavedTryOnSession = {
  activeTool: TryOnTool
  generation: Generation | null
  guestImages: Record<string, GuestImage | undefined>
  prompt: string
  isLimitedGeneration: boolean
}

function getSavedTryOnSession(): SavedTryOnSession | null {
  try {
    const saved = window.sessionStorage.getItem(TRYON_SESSION_STORAGE_KEY)
    if (!saved) return null

    const session = JSON.parse(saved) as Partial<SavedTryOnSession>
    if (session.activeTool !== 'try-on' && session.activeTool !== 'magic-editor' && session.activeTool !== 'ai-studio') return null

    return {
      activeTool: session.activeTool,
      generation: session.generation?.generationId && session.generation.status ? session.generation : null,
      guestImages: session.guestImages ?? {},
      prompt: session.prompt ?? '',
      isLimitedGeneration: session.isLimitedGeneration ?? false,
    }
  } catch {
    window.sessionStorage.removeItem(TRYON_SESSION_STORAGE_KEY)
    return null
  }
}

function saveTryOnSession(session: SavedTryOnSession) {
  window.sessionStorage.setItem(TRYON_SESSION_STORAGE_KEY, JSON.stringify(session))
}

function savePendingGuestGeneration(generation: PendingGuestGeneration) {
  window.sessionStorage.setItem(PENDING_GUEST_GENERATION_STORAGE_KEY, JSON.stringify(generation))
}

function getPendingGuestGeneration(): PendingGuestGeneration | null {
  try {
    const saved = window.sessionStorage.getItem(PENDING_GUEST_GENERATION_STORAGE_KEY)
    if (!saved) return null
    const generation = JSON.parse(saved) as Partial<PendingGuestGeneration>
    if (generation.activeTool !== 'try-on' && generation.activeTool !== 'magic-editor' && generation.activeTool !== 'ai-studio') return null
    return { activeTool: generation.activeTool, guestImages: generation.guestImages ?? {}, prompt: generation.prompt ?? '' }
  } catch {
    window.sessionStorage.removeItem(PENDING_GUEST_GENERATION_STORAGE_KEY)
    return null
  }
}

function clearPendingGuestGeneration() {
  window.sessionStorage.removeItem(PENDING_GUEST_GENERATION_STORAGE_KEY)
}

function clearTryOnSession() {
  window.sessionStorage.removeItem(TRYON_SESSION_STORAGE_KEY)
}

export { clearPendingGuestGeneration, clearTryOnSession, getPendingGuestGeneration, getSavedTryOnSession, savePendingGuestGeneration, saveTryOnSession }
export type { GuestImage, PendingGuestGeneration, SavedTryOnSession, TryOnTool }
