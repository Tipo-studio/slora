import type { User } from '@supabase/supabase-js'

export function getAvatarUrl(user: User) {
  const metadataAvatar = user.user_metadata.avatar_url
  if (metadataAvatar) return String(metadataAvatar)

  const seed = encodeURIComponent(user.id)
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=0f172a&shapeColor=22d3ee,818cf8,f472b6,4ade80,facc15&radius=50&scale=82`
}
