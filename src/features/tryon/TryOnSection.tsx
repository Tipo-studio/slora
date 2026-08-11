import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react'
import { createGeneration, getGeneration, getTool, uploadSourceImage, type Generation, type ImageReference, type ToolDefinition } from '../../lib/sivitai'

const TRYON_TOOLS = [
  { id: 'try-on', slug: 'try-on', label: 'Try-on', description: 'See yourself wearing dresses, streetwear, bikinis, formal wear and more.' },
  { id: 'magic-editor', slug: 'magic-editor', label: 'Magic editor', description: 'Remove objects, replace backgrounds, change outfits or enhance every detail' },
  { id: 'ai-studio', slug: 'kol-ai', label: 'AI studio', description: 'Create photorealistic AI images from your ideas.' },
] as const

type TryOnTool = typeof TRYON_TOOLS[number]['id']
type ImageSlot = 'person' | 'clothes'

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const paths = { tl: 'M0 11.5V0.5H11.5', tr: 'M0.5 0.5H11.5V11.5', bl: 'M0 0.5V11.5H11.5', br: 'M0.5 11.5H11.5V0.5' }
  const place = { tl: 'left-0 top-0', tr: 'right-0 top-0', bl: 'bottom-0 left-0', br: 'bottom-0 right-0' }
  return <svg aria-hidden="true" className={`absolute ${place[position]}`} width="var(--corner)" height="var(--corner)" viewBox="0 0 12 12" fill="none"><path d={paths[position]} stroke="currentColor" strokeWidth="1.5" /></svg>
}

function TryOnUploadCard({ label, samples, previewUrl, isUploading, onFileChange }: { label: string; samples: readonly string[]; previewUrl: string | null; isUploading: boolean; onFileChange: (file: File | null) => void }) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => onFileChange(event.target.files?.[0] ?? null)
  return <label className={`tryon-upload-card ${previewUrl ? 'has-preview' : ''} ${isUploading ? 'is-uploading' : ''}`}>
    <input type="file" accept="image/png,image/jpeg" className="tryon-file-input" onChange={handleFileChange} disabled={isUploading} />
    <img className="tryon-upload-grid" src="/images/tryon/upload-grid.svg" alt="" aria-hidden="true" />
    {previewUrl && <img className="tryon-upload-preview" src={previewUrl} alt={`${label} preview`} />}
    <div className="tryon-upload-content">
      {!previewUrl && <><span className="tryon-upload-icon"><img src="/images/tryon/image-icon.svg" alt="" aria-hidden="true" /></span><span className="tryon-upload-note">jpeg, png formats up to 5Mb</span><span className="tryon-samples">{samples.map((sample) => <img key={sample} src={sample} alt="" />)}</span></>}
      <span className="tryon-upload-title">{isUploading ? 'Uploading…' : previewUrl ? 'Change image' : label}</span>
    </div>
  </label>
}

function MagicPromptCard({ prompt, onPromptChange }: { prompt: string; onPromptChange: (prompt: string) => void }) {
  return <div className="magic-prompt-card"><textarea value={prompt} onChange={(event) => onPromptChange(event.target.value)} placeholder="prompt here" aria-label="Image prompt" /></div>
}

async function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read the selected image.'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

function TryOnSection({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const [activeTool, setActiveTool] = useState<TryOnTool>('try-on')
  const [toolDefinition, setToolDefinition] = useState<ToolDefinition | null>(null)
  const [personPreviewUrl, setPersonPreviewUrl] = useState<string | null>(null)
  const [clothesPreviewUrl, setClothesPreviewUrl] = useState<string | null>(null)
  const [imageReferences, setImageReferences] = useState<Partial<Record<ImageSlot, ImageReference>>>({})
  const [uploadingSlot, setUploadingSlot] = useState<ImageSlot | null>(null)
  const [prompt, setPrompt] = useState('')
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [error, setError] = useState('')
  const previewUrlsRef = useRef({ person: null as string | null, clothes: null as string | null })
  const activeToolConfig = TRYON_TOOLS.find(({ id }) => id === activeTool) ?? TRYON_TOOLS[0]
  const isGenerating = generation?.status === 'queued' || generation?.status === 'processing'
  const generationId = generation?.generationId
  const resultOutput = generation?.outputs.find((output) => output.type === 'image' && output.url)

  useEffect(() => () => Object.values(previewUrlsRef.current).forEach((url) => { if (url) URL.revokeObjectURL(url) }), [])

  useEffect(() => {
    setToolDefinition(null)
    setError('')
    setGeneration(null)
    if (!activeToolConfig.slug) return
    let isCurrent = true
    void getTool(activeToolConfig.slug).then((tool) => { if (isCurrent) setToolDefinition(tool) }).catch((requestError: unknown) => { if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Unable to load this tool.') })
    return () => { isCurrent = false }
  }, [activeToolConfig.slug])

  useEffect(() => {
    if (!generationId || !isGenerating) return
    let isCurrent = true
    const poll = async () => {
      try {
        const nextGeneration = await getGeneration(generationId)
        if (isCurrent) setGeneration(nextGeneration)
      } catch (requestError) {
        if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Unable to check generation status.')
      }
    }
    void poll()
    const intervalId = window.setInterval(() => void poll(), 2500)
    return () => { isCurrent = false; window.clearInterval(intervalId) }
  }, [generationId, isGenerating])

  const updateImage = async (slot: ImageSlot, file: File | null) => {
    const currentUrl = previewUrlsRef.current[slot]
    if (currentUrl) URL.revokeObjectURL(currentUrl)
    const nextUrl = file ? URL.createObjectURL(file) : null
    previewUrlsRef.current[slot] = nextUrl
    if (slot === 'person') setPersonPreviewUrl(nextUrl)
    else setClothesPreviewUrl(nextUrl)
    setImageReferences((current) => ({ ...current, [slot]: undefined }))
    setError('')
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Images must be 5 MB or smaller.'); return }
    setUploadingSlot(slot)
    try {
      const reference = await uploadSourceImage(await toDataUrl(file), file.name)
      setImageReferences((current) => ({ ...current, [slot]: reference }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to upload image.')
    } finally {
      setUploadingSlot(null)
    }
  }

  const generate = async () => {
    if (!activeToolConfig.slug || !toolDefinition) { setError('This tool is not available yet.'); return }
    const inputs: Record<string, unknown> = {}
    for (const field of toolDefinition.inputSchema.fields) {
      if (field.hidden) continue
      if (field.type === 'image') {
        const slot = /garment|cloth|reference/i.test(field.name) ? 'clothes' : 'person'
        const reference = imageReferences[slot]
        if (field.required && !reference) { setError(`Please upload ${field.label ?? field.name}.`); return }
        if (reference) inputs[field.name] = { storageBucket: reference.storageBucket, storagePath: reference.storagePath, contentType: reference.contentType, originalName: reference.originalName }
      } else if (field.type === 'text' || field.type === 'textarea') {
        const value = prompt.trim()
        if (field.required && !value) { setError(`Please enter ${field.label ?? field.name}.`); return }
        if (value) inputs[field.name] = value
      }
    }
    setError('')
    try {
      const job = await createGeneration(activeToolConfig.slug, inputs)
      setGeneration({ ...job, outputs: [], errorMessage: null })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to start generation.')
    }
  }

  const selectTool = (tool: TryOnTool) => setActiveTool(tool)
  const personSamples = ['/images/tryon/person-1.png', '/images/tryon/person-2.png', '/images/tryon/person-3.png', '/images/tryon/person-4.png'] as const
  const clothesSamples = ['/images/tryon/clothes-1.png', '/images/tryon/clothes-2.png', '/images/tryon/clothes-3.png', '/images/tryon/clothes-4.png'] as const
  const loadingPreviewUrl = personPreviewUrl ?? clothesPreviewUrl
  const toolUsesImages = toolDefinition?.inputSchema.fields.some((field) => field.type === 'image' && !field.hidden)
  const toolUsesPrompt = toolDefinition?.inputSchema.fields.some((field) => (field.type === 'text' || field.type === 'textarea') && !field.hidden)

  return <section ref={sectionRef} id="tryon" className="tryon-screen relative z-10 min-h-screen snap-start" aria-label="Try-on tools">
    <img className="tryon-background" src="/images/tryon/background.png" alt="" aria-hidden="true" />
    <div className="tryon-tool-intro"><nav className="tryon-tool-menu" aria-label="Creative tools">{TRYON_TOOLS.map(({ id, label }) => <button key={id} type="button" className={activeTool === id ? 'is-active' : ''} aria-current={activeTool === id ? 'page' : undefined} onClick={() => selectTool(id)}><Corner position="tl" /><Corner position="tr" /><Corner position="bl" /><Corner position="br" /><span>{label}</span></button>)}</nav><p>{activeToolConfig.description}</p></div>
    <div className="tryon-layout"><div className="tryon-controls"><div className={`tryon-upload-stack ${activeTool === 'ai-studio' ? 'is-ai-studio' : ''}`}>
      {toolUsesImages && <TryOnUploadCard label={toolDefinition?.inputSchema.fields.find((field) => field.type === 'image' && !field.hidden)?.label ?? 'Upload image'} samples={personSamples} previewUrl={personPreviewUrl} isUploading={uploadingSlot === 'person'} onFileChange={(file) => void updateImage('person', file)} />}
      {toolUsesImages && toolDefinition?.inputSchema.fields.filter((field) => field.type === 'image' && !field.hidden).length === 2 && <TryOnUploadCard label={toolDefinition.inputSchema.fields.filter((field) => field.type === 'image' && !field.hidden)[1]?.label ?? 'Upload reference'} samples={clothesSamples} previewUrl={clothesPreviewUrl} isUploading={uploadingSlot === 'clothes'} onFileChange={(file) => void updateImage('clothes', file)} />}
      {toolUsesPrompt && <MagicPromptCard prompt={prompt} onPromptChange={setPrompt} />}
      <button type="button" className="tryon-cta button-primary" onClick={() => void generate()} disabled={isGenerating || uploadingSlot !== null || !toolDefinition}><img src="/images/tryon/try-now-icon.svg" alt="" aria-hidden="true" />{isGenerating ? 'GENERATING…' : 'TRY NOW'}</button>
      {error && <p className="tryon-status tryon-status-error" role="alert">{error}</p>}
      {generation?.status === 'failed' && <p className="tryon-status tryon-status-error" role="alert">{generation.errorMessage ?? 'Generation failed. Please try again.'}</p>}
    </div></div>
    <div className="tryon-preview" aria-label="Try-on result preview"><div key={`${activeTool}-${generation?.generationId ?? 'default'}-${isGenerating ? 'loading' : 'idle'}`} className={`tryon-phone-frame ${isGenerating ? 'is-loading' : ''}`} aria-label={isGenerating ? 'Generating image' : undefined}>
      {resultOutput?.url ? <img className="tryon-result-image" src={resultOutput.url} alt="Generated result" /> : isGenerating ? <img className={`tryon-genimg-placeholder ${loadingPreviewUrl ? 'has-uploaded-image' : ''}`} src={loadingPreviewUrl ?? '/images/tryon/genimg-loading.svg'} alt="" aria-hidden="true" /> : <img src="/images/tryon/phone-frame.svg" alt="" aria-hidden="true" />}
    </div></div><div className="tryon-model-illustration" aria-hidden="true"><img className="tryon-model" src="/images/tryon/model.png" alt="" /></div></div>
  </section>
}

export { TryOnSection }
