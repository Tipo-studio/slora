type MagicEditorPrompt = {
  id: string
  label: string
  prompt: string
}

const GLOBAL_IDENTITY_LOCK = `GLOBAL IDENTITY LOCK — Apply to every prompt

Preserve the original person's identity exactly. Keep the same face, facial features, skin characteristics, hairstyle unless explicitly requested, body shape, body proportions, expression, pose, hand position, body position, camera angle, perspective, framing and composition. Do not reshape the face or body. The person must remain clearly recognizable as the exact same individual. Only modify the elements explicitly requested below.`

const MAGIC_EDITOR_PROMPTS: MagicEditorPrompt[] = [
  { id: 'luxury-fashion', label: 'Luxury Fashion', prompt: `Replace only the model's outfit with an elegant luxury fashion look. Use premium fabrics, sophisticated tailoring and refined styling. Keep the result photorealistic with natural fabric folds, shadows and accurate interaction with the body.` },
  { id: 'trendy-streetwear', label: 'Trendy Streetwear', prompt: `Replace only the clothing with modern trending streetwear. Create a stylish everyday look with layered pieces, contemporary proportions and realistic materials. Preserve all original accessories unless they conflict with the new clothing.` },
  { id: 'summer-vacation', label: 'Summer Vacation', prompt: `Transform the styling into a premium summer vacation look. Replace the outfit with elegant resort wear and change the environment into a bright tropical destination. Match environmental lighting naturally to the subject.` },
  { id: 'professional-business', label: 'Professional Business', prompt: `Replace the outfit with a modern professional business look suitable for a premium corporate portrait. Use clean tailoring and understated styling. Keep the original background and lighting.` },
  { id: 'evening-party', label: 'Evening Party', prompt: `Replace the outfit with an elegant evening party look. Introduce subtle sophisticated nighttime lighting while keeping the original person, pose and composition unchanged.` },
  { id: 'clean-white-studio', label: 'Clean White Studio', prompt: `Replace only the background with a clean premium white photography studio. Add realistic soft studio lighting and natural contact shadows while preserving the subject completely.` },
  { id: 'luxury-interior', label: 'Luxury Interior', prompt: `Replace only the background with a sophisticated luxury hotel or modern premium interior. Match depth of field, perspective, reflections and lighting to the original subject.` },
  { id: 'city-night', label: 'City Night', prompt: `Transform only the environment into a modern city at night with elegant urban lights and subtle bokeh. Add realistic ambient light interaction on the model without changing the person.` },
  { id: 'beach-sunset', label: 'Beach Sunset', prompt: `Replace the background with a beautiful beach during sunset. Introduce warm natural sunset light, realistic atmospheric depth and subtle rim lighting while preserving the model exactly.` },
  { id: 'lifestyle-cafe', label: 'Lifestyle Café', prompt: `Place the subject naturally inside a stylish modern café. Preserve the original pose and camera composition. Match perspective, depth of field and environmental lighting realistically.` },
  { id: 'golden-hour', label: 'Golden Hour', prompt: `Keep the image composition and environment but transform the lighting into beautiful golden-hour sunlight. Add warm directional light, subtle rim light and realistic soft shadows.` },
  { id: 'neon-night', label: 'Neon Night', prompt: `Transform the lighting into sophisticated cinematic neon lighting with subtle blue, purple and pink reflections. Maintain realistic skin tones and avoid excessive artificial glow.` },
  { id: 'fashion-editorial', label: 'Fashion Editorial', prompt: `Transform the image into a premium fashion editorial photograph. Apply sophisticated studio lighting, refined contrast, clean skin tones and professional fashion color grading while preserving identity and composition.` },
  { id: 'cinematic-movie', label: 'Cinematic Movie', prompt: `Give the photograph a cinematic movie aesthetic with dramatic but realistic lighting, controlled contrast, cinematic color grading, subtle depth and film-like atmosphere. Do not change the model or composition.` },
  { id: 'vintage-film', label: 'Vintage Film', prompt: `Transform the photograph into an authentic analog film aesthetic with subtle grain, slightly faded colors, gentle highlight roll-off and nostalgic film tones. Keep facial details sharp and recognizable.` },
  { id: 'korean-drama', label: 'Korean Drama', prompt: `Apply a premium Korean drama visual aesthetic with soft natural lighting, clean skin tones, slightly pastel colors, gentle contrast and cinematic depth of field. Preserve all physical characteristics.` },
  { id: 'fashion-magazine', label: 'Fashion Magazine', prompt: `Transform the image into a high-end fashion magazine editorial photograph. Use premium lighting, polished color grading, refined styling and sophisticated visual direction. Do not add text, logos or typography.` },
  { id: 'movie-poster', label: 'Movie Poster', prompt: `Transform the photograph into a dramatic cinematic movie-poster visual. Introduce atmospheric lighting, strong depth, controlled contrast and cinematic color grading while keeping the person's identity and pose exactly unchanged. Do not add text.` },
  { id: 'cyberpunk', label: 'Cyberpunk', prompt: `Transform the environment into a sophisticated futuristic cyberpunk city with neon architecture, atmospheric depth and realistic colored light reflections. Keep the model photorealistic and completely recognizable.` },
  { id: 'dreamy-fantasy', label: 'Dreamy Fantasy', prompt: `Transform the surrounding environment into an elegant dreamy fantasy scene with soft atmospheric light, subtle glowing particles, beautiful depth and cinematic softness. Keep the person realistic rather than turning them into an illustration.` },
]

function getMagicEditorPrompt(prompt: MagicEditorPrompt) {
  return `${GLOBAL_IDENTITY_LOCK}\n\n${prompt.prompt}`
}

export { MAGIC_EDITOR_PROMPTS, getMagicEditorPrompt }
export type { MagicEditorPrompt }
