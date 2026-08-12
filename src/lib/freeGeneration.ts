const DEVICE_ID_STORAGE_KEY = 'slora-device-id'
const FREE_GENERATION_STORAGE_KEY = 'slora-free-generation-used'
const PURCHASED_GENERATIONS_STORAGE_KEY = 'slora-purchased-generations'
const FREE_GENERATION_LIMIT = 1
const FREE_GENERATION_CHANGED_EVENT = 'slora-free-generation-changed'

// Set VITE_FREE_GENERATION_LOCK_ENABLED=false to temporarily allow repeat test generations.
const FREE_GENERATION_LOCK_ENABLED = import.meta.env.VITE_FREE_GENERATION_LOCK_ENABLED !== 'false'

function createDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getDeviceId() {
  const existingDeviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existingDeviceId) return existingDeviceId

  const deviceId = createDeviceId()
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId)
  return deviceId
}

export function isFreeGenerationLockEnabled() {
  return FREE_GENERATION_LOCK_ENABLED
}

export function getFreeGenerationsRemaining() {
  const freeGenerations = !FREE_GENERATION_LOCK_ENABLED || window.localStorage.getItem(FREE_GENERATION_STORAGE_KEY) !== 'true'
    ? FREE_GENERATION_LIMIT
    : 0
  const purchasedGenerations = Number.parseInt(window.localStorage.getItem(PURCHASED_GENERATIONS_STORAGE_KEY) ?? '0', 10)
  return freeGenerations + (Number.isFinite(purchasedGenerations) ? Math.max(0, purchasedGenerations) : 0)
}

export function getPurchasedGenerationsRemaining() {
  const purchasedGenerations = Number.parseInt(window.localStorage.getItem(PURCHASED_GENERATIONS_STORAGE_KEY) ?? '0', 10)
  return Number.isFinite(purchasedGenerations) ? Math.max(0, purchasedGenerations) : 0
}

export function addPurchasedGenerations(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) return
  window.localStorage.setItem(PURCHASED_GENERATIONS_STORAGE_KEY, String(getPurchasedGenerationsRemaining() + amount))
  window.dispatchEvent(new Event(FREE_GENERATION_CHANGED_EVENT))
}

export function consumeGeneration() {
  const purchasedGenerations = getPurchasedGenerationsRemaining()
  if (purchasedGenerations > 0) {
    window.localStorage.setItem(PURCHASED_GENERATIONS_STORAGE_KEY, String(purchasedGenerations - 1))
  } else if (FREE_GENERATION_LOCK_ENABLED) {
    window.localStorage.setItem(FREE_GENERATION_STORAGE_KEY, 'true')
  }
  window.dispatchEvent(new Event(FREE_GENERATION_CHANGED_EVENT))
}

export function subscribeToFreeGenerationChanges(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === FREE_GENERATION_STORAGE_KEY || event.key === PURCHASED_GENERATIONS_STORAGE_KEY) callback()
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(FREE_GENERATION_CHANGED_EVENT, callback)
  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(FREE_GENERATION_CHANGED_EVENT, callback)
  }
}

export function markFreeGenerationUsed() {
  consumeGeneration()
}

export function resetFreeGenerationsForTesting() {
  if (!import.meta.env.DEV) return
  window.localStorage.removeItem(FREE_GENERATION_STORAGE_KEY)
  window.localStorage.removeItem(DEVICE_ID_STORAGE_KEY)
  window.dispatchEvent(new Event(FREE_GENERATION_CHANGED_EVENT))
}
