const DEVICE_ID_STORAGE_KEY = 'slora-device-id'

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
