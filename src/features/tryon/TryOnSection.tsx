import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react'
import type { User } from '@supabase/supabase-js'
import { ChevronLeft, ChevronRight, Download, Maximize2, Pencil, Shirt, X } from 'lucide-react'
import { createGeneration, getGeneration, getTool, isSafeRemoteUrl, requestBillingSummary, uploadSourceImage, type Generation, type ImageReference, type ToolDefinition } from '../../lib/sivitai'
import { getCurrentPackage, getDeviceId, getFreeGenerationsRemaining, resetFreeGenerationsForTesting, subscribeToFreeGenerationChanges } from '../../lib/freeGeneration'
import { addLibraryImages } from '../../lib/imageLibrary'
import { MAGIC_EDITOR_PROMPTS, getMagicEditorPrompt } from './magicEditorPrompts'
import { clearPendingGuestGeneration, getPendingGuestGeneration, getSavedTryOnSession, savePendingGuestGeneration, saveTryOnSession, type GuestImage, type TryOnTool } from './tryonSession'

const TRYON_TOOLS = [
  { id: 'try-on', slug: 'try-on', label: 'Try-on', description: 'See yourself wearing dresses, streetwear, bikinis, formal wear and more.' },
  { id: 'magic-editor', slug: 'magic-editor', label: 'Magic editor', description: 'Remove objects, replace backgrounds, change outfits or enhance every detail' },
  { id: 'ai-studio', slug: 'kol-ai', label: 'AI studio', description: 'Create photorealistic AI images from your ideas.' },
] as const

type ImageSlot = 'person' | 'clothes'

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const paths = { tl: 'M0 11.5V0.5H11.5', tr: 'M0.5 0.5H11.5V11.5', bl: 'M0 0.5V11.5H11.5', br: 'M0.5 11.5H11.5V0.5' }
  const place = { tl: 'left-0 top-0', tr: 'right-0 top-0', bl: 'bottom-0 left-0', br: 'bottom-0 right-0' }
  return <svg aria-hidden="true" className={`absolute ${place[position]}`} width="var(--corner)" height="var(--corner)" viewBox="0 0 12 12" fill="none"><path d={paths[position]} stroke="currentColor" strokeWidth="1.5" /></svg>
}

function TryOnUploadCard({ label, samples, previewUrl, isUploading, onFileChange, onSampleSelect }: { label: string; samples: readonly string[]; previewUrl: string | null; isUploading: boolean; onFileChange: (file: File | null) => void; onSampleSelect: (sampleUrl: string) => void }) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => onFileChange(event.target.files?.[0] ?? null)
  const selectSample = (event: React.MouseEvent<HTMLButtonElement>, sampleUrl: string) => {
    event.preventDefault()
    event.stopPropagation()
    onSampleSelect(sampleUrl)
  }
  return <label className={`tryon-upload-card ${previewUrl ? 'has-preview' : ''} ${isUploading ? 'is-uploading' : ''}`}>
    <input type="file" accept="image/png,image/jpeg" className="tryon-file-input" onChange={handleFileChange} disabled={isUploading} />
    <img className="tryon-upload-grid" src="/images/tryon/upload-grid.svg" alt="" aria-hidden="true" />
    {previewUrl && <img className="tryon-upload-preview" src={previewUrl} alt={`${label} preview`} />}
    <div className="tryon-upload-content">
      {!previewUrl && <><span className="tryon-upload-icon"><img src="/images/tryon/image-icon.svg" alt="" aria-hidden="true" /></span><span className="tryon-upload-note">jpeg, png formats up to 5Mb</span><span className="tryon-samples" aria-label={`Suggested ${label} images`}>{samples.map((sample, index) => <button key={sample} type="button" className="tryon-sample-button" aria-label={`Use suggested image ${index + 1}`} onMouseDown={(event) => event.preventDefault()} onClick={(event) => selectSample(event, sample)}><img src={sample} alt="" /></button>)}</span></>}
      <span className="tryon-upload-title">{isUploading ? 'Uploading…' : previewUrl ? 'Change image' : label}</span>
    </div>
  </label>
}

function MagicPromptCard({ prompt, onPromptChange, canWriteCustomPrompt, showSuggestions }: { prompt: string; onPromptChange: (prompt: string) => void; canWriteCustomPrompt: boolean; showSuggestions: boolean }) {
  const [isIdeasOpen, setIsIdeasOpen] = useState(false)
  const visibleSuggestions = canWriteCustomPrompt ? MAGIC_EDITOR_PROMPTS : MAGIC_EDITOR_PROMPTS.slice(0, 6)
  const selectSuggestion = (suggestion: typeof MAGIC_EDITOR_PROMPTS[number]) => {
    onPromptChange(getMagicEditorPrompt(suggestion))
    setIsIdeasOpen(false)
  }

  useEffect(() => {
    if (!isIdeasOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsIdeasOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isIdeasOpen])

  return <div className={`magic-prompt-card ${canWriteCustomPrompt ? 'has-custom-prompt' : 'is-suggestions-only'}`}>
    {canWriteCustomPrompt && <label className="magic-prompt-input"><span>Custom prompt</span><textarea value={prompt} onChange={(event) => onPromptChange(event.target.value)} placeholder="Describe the edit you want to make…" aria-label="Custom image prompt" /></label>}
    {showSuggestions && <div className="magic-prompt-suggestions" aria-label="Magic Editor prompt suggestions">
      <div className="magic-prompt-suggestions-heading"><span>{canWriteCustomPrompt ? 'Quick ideas' : 'Choose an edit style'}</span>{!canWriteCustomPrompt && <small>Studio unlocks custom prompts</small>}</div>
      <div className="magic-prompt-suggestion-list magic-prompt-inline-list">
        {visibleSuggestions.map((suggestion) => {
          const suggestionPrompt = getMagicEditorPrompt(suggestion)
          return <button key={suggestion.id} type="button" className={prompt === suggestionPrompt ? 'is-selected' : ''} aria-pressed={prompt === suggestionPrompt} onClick={() => selectSuggestion(suggestion)}>{suggestion.label}</button>
        })}
        <button type="button" className="magic-prompt-show-all" aria-expanded={isIdeasOpen} aria-controls="magic-prompt-ideas-dialog" onClick={() => setIsIdeasOpen(true)}>Show all ideas</button>
      </div>
      {isIdeasOpen && <div className="magic-prompt-ideas-dialog" role="presentation">
        <button type="button" className="magic-prompt-ideas-backdrop" aria-label="Close all ideas" onClick={() => setIsIdeasOpen(false)} />
        <div id="magic-prompt-ideas-dialog" className="magic-prompt-ideas-popover" role="dialog" aria-modal="true" aria-label="All Magic Editor prompt ideas">
          <div className="magic-prompt-ideas-header"><div><span>All ideas</span><small>{MAGIC_EDITOR_PROMPTS.length} edit styles</small></div><button type="button" aria-label="Close all ideas" onClick={() => setIsIdeasOpen(false)}>×</button></div>
          <div className="magic-prompt-suggestion-list">{MAGIC_EDITOR_PROMPTS.map((suggestion) => {
            const suggestionPrompt = getMagicEditorPrompt(suggestion)
            return <button key={suggestion.id} type="button" className={prompt === suggestionPrompt ? 'is-selected' : ''} aria-pressed={prompt === suggestionPrompt} onClick={() => selectSuggestion(suggestion)}>{suggestion.label}</button>
          })}</div>
        </div>
      </div>}
    </div>}
  </div>
}

async function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read the selected image.'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

function TryOnSection({ sectionRef, user, onRequestLogin, onOpenPaywall, initialTool, initialImageUrl }: { sectionRef: RefObject<HTMLElement | null>; user: User | null; onRequestLogin: () => void; onOpenPaywall: (plan: 'one-time' | 'creator' | 'studio', returnToResult?: boolean) => void; initialTool?: 'try-on' | 'magic-editor'; initialImageUrl?: string | null }) {
  const [savedSession] = useState(getSavedTryOnSession)
  const [activeTool, setActiveTool] = useState<TryOnTool>(() => initialTool ?? savedSession?.activeTool ?? 'try-on')
  const [toolDefinition, setToolDefinition] = useState<ToolDefinition | null>(null)
  const [personPreviewUrl, setPersonPreviewUrl] = useState<string | null>(null)
  const [clothesPreviewUrl, setClothesPreviewUrl] = useState<string | null>(null)
  const [imageReferences, setImageReferences] = useState<Record<string, ImageReference | undefined>>({})
  const [guestImages, setGuestImages] = useState<Record<string, GuestImage | undefined>>(() => savedSession?.guestImages ?? {})
  const [uploadingFieldName, setUploadingFieldName] = useState<string | null>(null)
  const [prompt, setPrompt] = useState(() => savedSession?.prompt ?? '')
  const [generation, setGeneration] = useState<Generation | null>(() => savedSession?.generation ?? null)
  const [freeGenerationsRemaining, setFreeGenerationsRemaining] = useState(() => getFreeGenerationsRemaining())
  const [currentPackage, setCurrentPackage] = useState(() => getCurrentPackage())
  const [error, setError] = useState('')
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  const [isLimitedGeneration, setIsLimitedGeneration] = useState(() => savedSession?.isLimitedGeneration ?? false)
  const previewUrlsRef = useRef({ person: null as string | null, clothes: null as string | null })
  const uploadVersionRef = useRef<Record<ImageSlot, number>>({ person: 0, clothes: 0 })
  const activeToolConfig = TRYON_TOOLS.find(({ id }) => id === activeTool) ?? TRYON_TOOLS[0]
  const isGenerating = generation?.status === 'queued' || generation?.status === 'processing'
  const generationId = generation?.generationId
  const resultOutputs = generation?.outputs.filter((output) => output.type === 'image' && output.url) ?? []
  const resultOutput = resultOutputs[selectedResultIndex] ?? resultOutputs[0]
  const isGuestResult = Boolean(resultOutput?.url && (!user || user.is_anonymous))
  const isLimitResult = Boolean(resultOutput?.url && isLimitedGeneration)
  const isLockedResult = isGuestResult || isLimitResult

  useEffect(() => () => Object.values(previewUrlsRef.current).forEach((url) => { if (url) URL.revokeObjectURL(url) }), [])

  useEffect(() => {
    try {
      saveTryOnSession({ activeTool, generation, guestImages, prompt, isLimitedGeneration })
    } catch {
      setError('Your browser could not save this trial session. Keep this tab open to preserve the current generation.')
    }
  }, [activeTool, generation, guestImages, prompt, isLimitedGeneration])

  useEffect(() => {
    setToolDefinition(null)
    setError('')
    if (!activeToolConfig.slug) return
    let isCurrent = true
    void getTool(activeToolConfig.slug).then((tool) => { if (isCurrent) setToolDefinition(tool) }).catch((requestError: unknown) => { if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Unable to load this tool.') })
    return () => { isCurrent = false }
  }, [activeToolConfig.slug])

  useEffect(() => {
    if (!toolDefinition || initialImageUrl) return
    const imageFields = toolDefinition.inputSchema.fields.filter((field) => field.type === 'image' && !field.hidden)
    if (!personPreviewUrl) setPersonPreviewUrl(guestImages[imageFields[0]?.name]?.dataUrl ?? null)
    if (!clothesPreviewUrl) setClothesPreviewUrl(guestImages[imageFields[1]?.name]?.dataUrl ?? null)
  }, [clothesPreviewUrl, guestImages, initialImageUrl, personPreviewUrl, toolDefinition])

  useEffect(() => {
    if (!initialImageUrl || !toolDefinition) return
    if (!isSafeRemoteUrl(initialImageUrl)) {
      setError('The selected library image URL is invalid or unavailable.')
      return
    }
    const imageField = toolDefinition.inputSchema.fields.find((field) => field.type === 'image' && !field.hidden)
    if (!imageField) return
    let isCurrent = true

    void fetch(initialImageUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load the selected library image.')
        const blob = await response.blob()
        const contentType = blob.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
        return new File([blob], 'library-image.png', { type: contentType })
      })
      .then(async (file) => {
        if (!isCurrent) return
        const uploadVersion = ++uploadVersionRef.current.person
        const previousPreviewUrl = previewUrlsRef.current.person
        if (previousPreviewUrl) URL.revokeObjectURL(previousPreviewUrl)
        previewUrlsRef.current.person = null
        setPersonPreviewUrl(initialImageUrl)
        setImageReferences((current) => ({ ...current, [imageField.name]: undefined }))
        setGuestImages((current) => ({ ...current, [imageField.name]: undefined }))
        setGeneration(null)
        setSelectedResultIndex(0)
        setIsLimitedGeneration(false)
        setUploadingFieldName(imageField.name)

        try {
          const dataUrl = await toDataUrl(file)
          const reference = await uploadSourceImage(dataUrl, file.name)
          if (!isCurrent || uploadVersion !== uploadVersionRef.current.person) return
          setImageReferences((current) => ({ ...current, [imageField.name]: reference }))
          if (user?.is_anonymous || !user) setGuestImages((current) => ({ ...current, [imageField.name]: { dataUrl, name: file.name } }))
        } catch (requestError) {
          if (isCurrent && uploadVersion === uploadVersionRef.current.person) setError(requestError instanceof Error ? requestError.message : 'Unable to upload the selected library image.')
        } finally {
          if (isCurrent && uploadVersion === uploadVersionRef.current.person) setUploadingFieldName(null)
        }
      })
      .catch(() => {
        if (isCurrent) setError('Unable to prepare the selected library image.')
      })

    return () => { isCurrent = false }
  }, [initialImageUrl, toolDefinition, user])

  useEffect(() => {
    if (getFreeGenerationsRemaining() > 0) setIsLimitedGeneration(false)
  }, [])

  useEffect(() => subscribeToFreeGenerationChanges(() => {
    setFreeGenerationsRemaining(getFreeGenerationsRemaining())
    setCurrentPackage(getCurrentPackage())
  }), [])

  useEffect(() => {
    if (!user || user.is_anonymous) return
    let isCurrent = true
    void requestBillingSummary()
      .then(({ balance, package: packageName }) => {
        if (!isCurrent) return
        setFreeGenerationsRemaining(balance)
        if (packageName === 'One time' || packageName === 'Creator' || packageName === 'Studio') setCurrentPackage(packageName)
      })
      .catch(() => undefined)
    return () => { isCurrent = false }
  }, [user])

  useEffect(() => {
    if (!user || user.is_anonymous || new URLSearchParams(window.location.search).get('resume') !== 'guest-generation') return
    const pendingGuestGeneration = getPendingGuestGeneration()
    if (!pendingGuestGeneration) return

    if (getFreeGenerationsRemaining() <= 0) {
      const previewImage = Object.values(pendingGuestGeneration.guestImages).find(Boolean)
      clearPendingGuestGeneration()
      window.history.replaceState({}, '', '/?upgrade=guest-generation')
      setGeneration({
        generationId: `guest-upgrade-${crypto.randomUUID()}`,
        status: 'completed',
        outputs: previewImage ? [{ id: `guest-upgrade-preview-${crypto.randomUUID()}`, type: 'image', url: previewImage.dataUrl, downloadUrl: null }] : [],
        errorMessage: null,
      })
      setIsLimitedGeneration(true)
      return
    }

    let isCurrent = true
    const resumeGeneration = async () => {
      setActiveTool(pendingGuestGeneration.activeTool)
      setPrompt(pendingGuestGeneration.prompt)
      setGuestImages(pendingGuestGeneration.guestImages)
      setGeneration(null)
      setError('')

      try {
        const nextTool = TRYON_TOOLS.find((tool) => tool.id === pendingGuestGeneration.activeTool)
        if (!nextTool) throw new Error('The selected tool is unavailable.')
        const definition = await getTool(nextTool.slug)
        const inputs: Record<string, unknown> = {}

        for (const field of definition.inputSchema.fields) {
          if (field.hidden) continue
          if (field.type === 'image') {
            const guestImage = pendingGuestGeneration.guestImages[field.name]
            if (field.required && !guestImage) throw new Error(`Please upload ${field.label ?? field.name}.`)
            if (guestImage) {
              const reference = await uploadSourceImage(guestImage.dataUrl, guestImage.name)
              inputs[field.name] = { storageBucket: reference.storageBucket, storagePath: reference.storagePath, contentType: reference.contentType, originalName: reference.originalName }
            }
          } else if (field.type === 'text' || field.type === 'textarea') {
            const value = pendingGuestGeneration.prompt.trim()
            if (field.required && !value) throw new Error(`Please enter ${field.label ?? field.name}.`)
            if (value) inputs[field.name] = value
          }
        }

        const job = await createGeneration(nextTool.slug, inputs, getDeviceId(), true)
        if (!isCurrent) return
        clearPendingGuestGeneration()
        window.history.replaceState({}, '', '/')
        setGeneration({ ...job, outputs: [], errorMessage: null })
      } catch (requestError) {
        if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Unable to resume your generation.')
      }
    }

    void resumeGeneration()
    return () => { isCurrent = false }
  }, [user])

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

  useEffect(() => {
    if (selectedResultIndex >= resultOutputs.length) setSelectedResultIndex(0)
  }, [resultOutputs.length, selectedResultIndex])

  useEffect(() => {
    if (!user || user.is_anonymous || generation?.status !== 'completed') return
    addLibraryImages(user.id, generation.outputs.filter((output) => output.type === 'image' && output.url).map((output) => output.url!))
  }, [generation, user])

  useEffect(() => {
    if (!isFullPreviewOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullPreviewOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isFullPreviewOpen])

  const selectSuggestedImage = async (slot: ImageSlot, fieldName: string, sampleUrl: string) => {
    if (!isSafeRemoteUrl(new URL(sampleUrl, window.location.origin).href) && !sampleUrl.startsWith('/')) {
      setError('The suggested image URL is invalid.')
      return
    }
    setError('')
    setUploadingFieldName(fieldName)
    try {
      const response = await fetch(sampleUrl)
      if (!response.ok) throw new Error('Unable to load the suggested image.')
      const blob = await response.blob()
      const extension = blob.type === 'image/jpeg' ? 'jpg' : 'png'
      await updateImage(slot, fieldName, new File([blob], `suggested-image.${extension}`, { type: blob.type || 'image/png' }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to use the suggested image.')
    } finally {
      setUploadingFieldName(null)
    }
  }

  const updateImage = async (slot: ImageSlot, fieldName: string, file: File | null) => {
    if (file && !['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only PNG and JPEG images are supported.')
      return
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setError('Images must be 5 MB or smaller.')
      return
    }

    const uploadVersion = ++uploadVersionRef.current[slot]
    const currentUrl = previewUrlsRef.current[slot]
    if (currentUrl) URL.revokeObjectURL(currentUrl)
    const nextUrl = file ? URL.createObjectURL(file) : null
    previewUrlsRef.current[slot] = nextUrl
    if (slot === 'person') setPersonPreviewUrl(nextUrl)
    else setClothesPreviewUrl(nextUrl)
    setImageReferences((current) => ({ ...current, [fieldName]: undefined }))
    setGuestImages((current) => ({ ...current, [fieldName]: undefined }))
    setGeneration(null)
    setSelectedResultIndex(0)
    setIsLimitedGeneration(false)
    setError('')
    if (!file) return
    setUploadingFieldName(fieldName)
    try {
      const dataUrl = await toDataUrl(file)
      if (user?.is_anonymous || !user) {
        if (uploadVersion !== uploadVersionRef.current[slot]) return
        setGuestImages((current) => ({ ...current, [fieldName]: { dataUrl, name: file.name } }))
        return
      }

      const reference = await uploadSourceImage(dataUrl, file.name)
      if (uploadVersion !== uploadVersionRef.current[slot]) return
      setImageReferences((current) => ({ ...current, [fieldName]: reference }))
    } catch (requestError) {
      if (uploadVersion === uploadVersionRef.current[slot]) setError(requestError instanceof Error ? requestError.message : 'Unable to upload image.')
    } finally {
      if (uploadVersion === uploadVersionRef.current[slot]) setUploadingFieldName(null)
    }
  }

  const generate = async () => {
    if (!user || user.is_anonymous) {
      setError('Please sign in to create an image.')
      return
    }
    if (!activeToolConfig.slug || !toolDefinition) { setError('This tool is not available yet.'); return }
    if (uploadingFieldName) { setError('Please wait for the new image to finish uploading.'); return }
    const inputs: Record<string, unknown> = {}
    for (const field of toolDefinition.inputSchema.fields) {
      if (field.hidden) continue
      if (field.type === 'image') {
        const reference = imageReferences[field.name]
        const guestImage = guestImages[field.name]
        if (field.required && !reference && !guestImage) { setError(`Please upload ${field.label ?? field.name}.`); return }
        if (reference) inputs[field.name] = { storageBucket: reference.storageBucket, storagePath: reference.storagePath, contentType: reference.contentType, originalName: reference.originalName }
        else if (guestImage) inputs[field.name] = guestImage
      } else if (field.type === 'text' || field.type === 'textarea') {
        const value = prompt.trim()
        if (field.required && !value) { setError(`Please enter ${field.label ?? field.name}.`); return }
        if (value) inputs[field.name] = value
      }
    }
    setError('')
    try {
      if (!user || user.is_anonymous) {
        const imageField = toolDefinition.inputSchema.fields.find((field) => field.type === 'image' && !field.hidden)
        const guestImage = imageField ? guestImages[imageField.name] : undefined
        if (!guestImage) { setError('Please upload an image to preview your result.'); return }

        savePendingGuestGeneration({ activeTool, guestImages, prompt })
        setError('Please sign in to create an image. Your uploaded session is saved and can resume after sign-in.')
        return
      }

      const isLimitedGeneration = freeGenerationsRemaining <= 0
      if (isLimitedGeneration) {
        setIsLimitedGeneration(true)
        setError('You have no credits remaining. Please choose a package to continue.')
        return
      }
      setIsLimitedGeneration(false)

      const job = await createGeneration(activeToolConfig.slug, inputs, getDeviceId(), false)
      const billing = await requestBillingSummary()
      setFreeGenerationsRemaining(billing.balance)
      if (billing.package === 'One time' || billing.package === 'Creator' || billing.package === 'Studio') setCurrentPackage(billing.package)
      setSelectedResultIndex(0)
      setGeneration({ ...job, outputs: [], errorMessage: null })
    } catch (requestError) {
      setIsLimitedGeneration(false)
      setError(requestError instanceof Error ? requestError.message : 'Unable to start generation.')
    }
  }

  const retryGeneration = () => {
    setGeneration(null)
    setIsLimitedGeneration(false)
    setError('')
    void generate()
  }

  const selectTool = (tool: TryOnTool) => {
    if (tool === activeTool) return
    setGeneration(null)
    setSelectedResultIndex(0)
    setIsLimitedGeneration(false)
    setActiveTool(tool)
  }

  const resetGenerationForTesting = () => {
    resetFreeGenerationsForTesting()
    setFreeGenerationsRemaining(getFreeGenerationsRemaining())
    setIsLimitedGeneration(false)
    setGeneration(null)
    setError('Generation reset to 1 for local testing.')
  }

  const startNewSessionWithResult = async (tool: TryOnTool) => {
    if (!resultOutput?.url) return
    const nextTool = TRYON_TOOLS.find((item) => item.id === tool)
    if (!nextTool) return

    setError('')
    try {
      const [nextToolDefinition, response] = await Promise.all([getTool(nextTool.slug), fetch(resultOutput.url)])
      if (!response.ok) throw new Error('Unable to prepare the generated image for a new session.')
      const imageField = nextToolDefinition.inputSchema.fields.find((field) => field.type === 'image' && !field.hidden)
      if (!imageField) throw new Error('This tool does not accept an input image.')

      setUploadingFieldName(imageField.name)
      const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/png'
      const extension = contentType === 'image/jpeg' ? 'jpg' : 'png'
      const resultFile = new File([await response.blob()], `generated-result.${extension}`, { type: contentType })
      const resultReference = await uploadSourceImage(await toDataUrl(resultFile), resultFile.name)

      const previousPreviewUrl = previewUrlsRef.current.person
      if (previousPreviewUrl) URL.revokeObjectURL(previousPreviewUrl)
      setActiveTool(tool)
      setGeneration(null)
      setPrompt('')
      setPersonPreviewUrl(resultOutput.url)
      setClothesPreviewUrl(null)
      previewUrlsRef.current = { person: null, clothes: null }
      setImageReferences({ [imageField.name]: resultReference })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to open a new session.')
    } finally {
      setUploadingFieldName(null)
    }
  }

  const downloadResult = () => {
    const downloadUrl = resultOutput?.downloadUrl ?? resultOutput?.url
    if (!downloadUrl) return
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'aishop-result.png'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const personSamples = ['/images/tryon/person-1.png', '/images/tryon/person-2.png', '/images/tryon/person-3.png', '/images/tryon/person-4.png'] as const
  const clothesSamples = ['/images/tryon/clothes-1.png', '/images/tryon/clothes-2.png', '/images/tryon/clothes-3.png', '/images/tryon/clothes-4.png'] as const
  const loadingPreviewUrl = personPreviewUrl ?? clothesPreviewUrl
  const toolUsesImages = toolDefinition?.inputSchema.fields.some((field) => field.type === 'image' && !field.hidden)
  const toolUsesPrompt = toolDefinition?.inputSchema.fields.some((field) => (field.type === 'text' || field.type === 'textarea') && !field.hidden)
  const isPaidUser = Boolean(user && !user.is_anonymous)
  const canWriteCustomMagicPrompt = activeTool !== 'magic-editor' || (isPaidUser && currentPackage === 'Studio')

  return <section ref={sectionRef} id="tryon" className="tryon-screen relative z-10 min-h-screen" aria-label="Try-on tools">
    <div className="tryon-tool-intro"><nav className="tryon-tool-menu" aria-label="Creative tools">{TRYON_TOOLS.map(({ id, label }) => <button key={id} type="button" className={activeTool === id ? 'is-active' : ''} aria-current={activeTool === id ? 'page' : undefined} onClick={() => selectTool(id)}><Corner position="tl" /><Corner position="tr" /><Corner position="bl" /><Corner position="br" /><span>{label}</span></button>)}</nav><p>{activeToolConfig.description}</p></div>
    <div className="tryon-layout"><div className="tryon-controls"><div className={`tryon-upload-stack ${activeTool === 'ai-studio' ? 'is-ai-studio' : ''}`}>
      {toolUsesImages && <TryOnUploadCard label={toolDefinition?.inputSchema.fields.find((field) => field.type === 'image' && !field.hidden)?.label ?? 'Upload image'} samples={personSamples} previewUrl={personPreviewUrl} isUploading={uploadingFieldName === toolDefinition?.inputSchema.fields.find((field) => field.type === 'image' && !field.hidden)?.name} onFileChange={(file) => { const field = toolDefinition?.inputSchema.fields.find((item) => item.type === 'image' && !item.hidden); if (field) void updateImage('person', field.name, file) }} onSampleSelect={(sampleUrl) => { const field = toolDefinition?.inputSchema.fields.find((item) => item.type === 'image' && !item.hidden); if (field) void selectSuggestedImage('person', field.name, sampleUrl) }} />}
      {toolUsesImages && toolDefinition?.inputSchema.fields.filter((field) => field.type === 'image' && !field.hidden).length === 2 && <TryOnUploadCard label={toolDefinition.inputSchema.fields.filter((field) => field.type === 'image' && !field.hidden)[1]?.label ?? 'Upload reference'} samples={clothesSamples} previewUrl={clothesPreviewUrl} isUploading={uploadingFieldName === toolDefinition.inputSchema.fields.filter((field) => field.type === 'image' && !field.hidden)[1]?.name} onFileChange={(file) => { const field = toolDefinition.inputSchema.fields.filter((item) => item.type === 'image' && !item.hidden)[1]; if (field) void updateImage('clothes', field.name, file) }} onSampleSelect={(sampleUrl) => { const field = toolDefinition.inputSchema.fields.filter((item) => item.type === 'image' && !item.hidden)[1]; if (field) void selectSuggestedImage('clothes', field.name, sampleUrl) }} />}
      {toolUsesPrompt && <MagicPromptCard prompt={prompt} onPromptChange={setPrompt} canWriteCustomPrompt={canWriteCustomMagicPrompt} showSuggestions={activeTool === 'magic-editor'} />}
      <button type="button" className="tryon-cta button-primary" onClick={() => void generate()} disabled={isGenerating || uploadingFieldName !== null}><img src="/images/tryon/try-now-icon.svg" alt="" aria-hidden="true" />{isGenerating ? 'GENERATING…' : 'TRY NOW'}</button>
      <p className="tryon-free-count" aria-live="polite"><strong>{freeGenerationsRemaining}</strong> free generation{freeGenerationsRemaining === 1 ? '' : 's'} remaining</p>
      {import.meta.env.DEV && <button type="button" className="tryon-test-reset" onClick={resetGenerationForTesting}>RESET GENERATION FOR TESTING</button>}
      {error && <p className="tryon-status tryon-status-error" role="alert">{error}</p>}
      {generation?.status === 'failed' && <div className="tryon-status tryon-status-error" role="alert"><p>{generation.errorMessage ?? 'Generation failed. Please try again.'}</p><button type="button" className="tryon-retry-button" onClick={retryGeneration} disabled={uploadingFieldName !== null}>TRY AGAIN</button></div>}
    </div></div>
    <div className="tryon-preview" aria-label="Try-on result preview"><div key={`${activeTool}-${generation?.generationId ?? 'default'}-${isGenerating ? 'loading' : resultOutput?.url ? 'result' : 'idle'}`} className={`tryon-phone-frame ${isGenerating ? 'is-loading' : ''} ${resultOutput?.url ? 'has-result' : ''} ${resultOutputs.length > 1 ? 'has-multiple-results' : ''} ${isLockedResult ? 'is-locked' : ''}`} aria-label={isGenerating ? 'Generating image' : undefined}>
      {resultOutput?.url ? isLockedResult ? <img className="tryon-result-image" src={resultOutput.url} alt="" aria-hidden="true" /> : <button type="button" className="tryon-result-preview-button" onClick={() => setIsFullPreviewOpen(true)} aria-label="Open full image preview"><img className="tryon-result-image" src={resultOutput.url} alt="Generated result" /><span><Maximize2 size={18} strokeWidth={1.75} />View full image</span></button> : isGenerating ? <img className={`tryon-genimg-placeholder ${loadingPreviewUrl ? 'has-uploaded-image' : ''}`} src={loadingPreviewUrl ?? '/images/tryon/genimg-loading.svg'} alt="" aria-hidden="true" /> : <img src="/images/tryon/tryon-phone-frame.png" alt="" aria-hidden="true" />}
      {isGuestResult && <div className="tryon-login-gate"><p>YOUR RESULT IS READY</p><strong>Sign in to reveal your image</strong><button type="button" className="button-primary" onClick={onRequestLogin}>SIGN IN TO REVEAL</button></div>}
      {isLimitResult && !isGuestResult && <div className="tryon-login-gate tryon-limit-gate"><p>YOUR FREE GENERATION IS USED</p><strong>Unlock your result and keep creating</strong><div><button type="button" className="button-primary" onClick={() => onOpenPaywall('studio', true)}>UPGRADE</button><button type="button" className="button-secondary" onClick={() => onOpenPaywall('one-time', true)}>BUY ONE TIME</button></div></div>}
    </div>{resultOutputs.length > 1 && <div className="tryon-result-selector" role="tablist" aria-label="Generated image results"><button type="button" className="tryon-result-arrow" onClick={() => setSelectedResultIndex((index) => (index - 1 + resultOutputs.length) % resultOutputs.length)} aria-label="Show previous result"><ChevronLeft size={16} strokeWidth={1.75} /></button>{resultOutputs.map((output, index) => <button key={output.id} type="button" role="tab" aria-selected={selectedResultIndex === index} className={selectedResultIndex === index ? 'is-active' : ''} onClick={() => setSelectedResultIndex(index)} aria-label={`Show result ${index + 1}`}><img src={output.url ?? ''} alt={`Generated result ${index + 1}`} /></button>)}<button type="button" className="tryon-result-arrow" onClick={() => setSelectedResultIndex((index) => (index + 1) % resultOutputs.length)} aria-label="Show next result"><ChevronRight size={16} strokeWidth={1.75} /></button></div>}{resultOutput?.url && !isLockedResult && <div className="tryon-result-actions" aria-label="Generated image actions">
      <button type="button" className="tryon-result-icon-button" onClick={downloadResult} aria-label="Download result"><Download size={16} strokeWidth={1.75} /></button>
      <button type="button" className="tryon-result-action-button" onClick={() => void startNewSessionWithResult('magic-editor')} disabled={uploadingFieldName !== null}><Pencil size={16} strokeWidth={1.75} />Magic edit</button>
      <button type="button" className="tryon-result-action-button" onClick={() => void startNewSessionWithResult('try-on')} disabled={uploadingFieldName !== null}><Shirt size={16} strokeWidth={1.75} />Try-on again</button>
    </div>}</div><div className="tryon-model-illustration" aria-hidden="true"><img className="tryon-model" src="/images/tryon/model.png" alt="" /></div></div>
    {isFullPreviewOpen && resultOutput?.url && <div className="tryon-full-preview" role="dialog" aria-modal="true" aria-label="Full generated image preview"><button type="button" className="tryon-full-preview-backdrop" onClick={() => setIsFullPreviewOpen(false)} aria-label="Close full image preview" /><div className="tryon-full-preview-content"><button type="button" className="tryon-full-preview-close" onClick={() => setIsFullPreviewOpen(false)} aria-label="Close full image preview"><X size={20} strokeWidth={1.75} /></button><img src={resultOutput.url} alt="Generated result full preview" /></div></div>}
  </section>
}

export { TryOnSection }
