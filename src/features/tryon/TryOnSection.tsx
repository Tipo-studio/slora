import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react'

const TRYON_TOOLS = [
  { id: 'try-on', label: 'Try-on', description: 'See yourself wearing dresses, streetwear, bikinis, formal wear and more.' },
  { id: 'magic-editor', label: 'Magic editor', description: 'Remove objects, replace backgrounds, change outfits or enhance every detail' },
  { id: 'ai-studio', label: 'AI studio', description: 'See yourself wearing dresses, streetwear, bikinis, formal wear and more.' },
] as const

type TryOnTool = typeof TRYON_TOOLS[number]['id']


function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const paths = {
    tl: 'M0 11.5V0.5H11.5', tr: 'M0.5 0.5H11.5V11.5',
    bl: 'M0 0.5V11.5H11.5', br: 'M0.5 11.5H11.5V0.5',
  }
  const place = { tl: 'left-0 top-0', tr: 'right-0 top-0', bl: 'bottom-0 left-0', br: 'bottom-0 right-0' }
  return <svg aria-hidden="true" className={`absolute ${place[position]}`} width="var(--corner)" height="var(--corner)" viewBox="0 0 12 12" fill="none"><path d={paths[position]} stroke="currentColor" strokeWidth="1.5" /></svg>
}

function TryOnUploadCard({ label, samples, previewUrl, onPreviewChange }: { label: string; samples: readonly string[]; previewUrl: string | null; onPreviewChange: (file: File | null) => void }) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onPreviewChange(event.target.files?.[0] ?? null)
  }

  return <label className={`tryon-upload-card ${previewUrl ? 'has-preview' : ''}`}>
    <input type="file" accept="image/png,image/jpeg" className="tryon-file-input" onChange={handleFileChange} />
    <img className="tryon-upload-grid" src="/images/tryon/upload-grid.svg" alt="" aria-hidden="true" />
    {previewUrl && <img className="tryon-upload-preview" src={previewUrl} alt={`${label} preview`} />}
    <div className="tryon-upload-content">
      {!previewUrl && <><span className="tryon-upload-icon"><img src="/images/tryon/image-icon.svg" alt="" aria-hidden="true" /></span><span className="tryon-upload-note">jpeg, png formats up to 5Mb</span><span className="tryon-samples">{samples.map((sample) => <img key={sample} src={sample} alt="" />)}</span></>}
      <span className="tryon-upload-title">{previewUrl ? 'Change image' : label}</span>
    </div>
  </label>
}

function MagicPromptCard() {
  const [prompt, setPrompt] = useState('')
  return <div className="magic-prompt-card">
    <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="prompt here" aria-label="Magic editor prompt" />
    <div className="magic-prompt-controls">
      <label>Size <select defaultValue="1:1" aria-label="Image size"><option>1:1</option><option>4:5</option><option>16:9</option></select></label>
      <label>Quality <select defaultValue="2" aria-label="Image quality"><option>1</option><option>2</option><option>3</option></select></label>
    </div>
  </div>
}

function TryOnSection({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const [activeTool, setActiveTool] = useState<TryOnTool>('try-on')
  const [isTryOnLoading, setIsTryOnLoading] = useState(false)
  const [personPreviewUrl, setPersonPreviewUrl] = useState<string | null>(null)
  const [clothesPreviewUrl, setClothesPreviewUrl] = useState<string | null>(null)
  const previewUrlsRef = useRef({ person: null as string | null, clothes: null as string | null })
  const activeToolConfig = TRYON_TOOLS.find(({ id }) => id === activeTool) ?? TRYON_TOOLS[0]
  const updatePreview = (type: 'person' | 'clothes', file: File | null) => {
    const currentUrl = previewUrlsRef.current[type]
    if (currentUrl) URL.revokeObjectURL(currentUrl)
    const nextUrl = file ? URL.createObjectURL(file) : null
    previewUrlsRef.current[type] = nextUrl
    if (type === 'person') setPersonPreviewUrl(nextUrl)
    else setClothesPreviewUrl(nextUrl)
  }
  useEffect(() => () => {
    Object.values(previewUrlsRef.current).forEach((url) => {
      if (url) URL.revokeObjectURL(url)
    })
  }, [])
  const selectTool = (tool: TryOnTool) => {
    setActiveTool(tool)
    setIsTryOnLoading(false)
  }
  const personSamples = ['/images/tryon/person-1.png', '/images/tryon/person-2.png', '/images/tryon/person-3.png', '/images/tryon/person-4.png'] as const
  const clothesSamples = ['/images/tryon/clothes-1.png', '/images/tryon/clothes-2.png', '/images/tryon/clothes-3.png', '/images/tryon/clothes-4.png'] as const
  const loadingPreviewUrl = personPreviewUrl ?? clothesPreviewUrl

  return <section ref={sectionRef} id="tryon" className="tryon-screen relative z-10 min-h-screen snap-start" aria-label="Try-on tools">
    <img className="tryon-background" src="/images/tryon/background.png" alt="" aria-hidden="true" />
    <div className="tryon-tool-intro">
      <nav className="tryon-tool-menu" aria-label="Creative tools">
        {TRYON_TOOLS.map(({ id, label }) => <button key={id} type="button" className={activeTool === id ? 'is-active' : ''} aria-current={activeTool === id ? 'page' : undefined} onClick={() => selectTool(id)}><Corner position="tl" /><Corner position="tr" /><Corner position="bl" /><Corner position="br" /><span>{label}</span></button>)}
      </nav>
      <p>{activeToolConfig.description}</p>
    </div>
    <div className="tryon-layout">
      <div className="tryon-controls">
        <div className={`tryon-upload-stack ${activeTool === 'ai-studio' ? 'is-ai-studio' : ''}`}>
          {activeTool === 'ai-studio' ? <MagicPromptCard /> : <>
            <TryOnUploadCard label="Upload person" samples={personSamples} previewUrl={personPreviewUrl} onPreviewChange={(file) => updatePreview('person', file)} />
            {activeTool === 'magic-editor' ? <MagicPromptCard /> : <TryOnUploadCard label="Upload Cloths" samples={clothesSamples} previewUrl={clothesPreviewUrl} onPreviewChange={(file) => updatePreview('clothes', file)} />}
          </>}
          <button type="button" className="tryon-cta button-primary" onClick={() => setIsTryOnLoading(true)} disabled={isTryOnLoading}><img src="/images/tryon/try-now-icon.svg" alt="" aria-hidden="true" />TRY NOW</button>
        </div>
      </div>
      <div className="tryon-preview" aria-label="Try-on result preview">
        <div key={`${activeTool}-${isTryOnLoading ? 'loading' : 'default'}`} className={`tryon-phone-frame ${isTryOnLoading ? 'is-loading' : ''}`} data-figma-node-id={isTryOnLoading ? '11790:1568' : '11787:1320'} aria-label={isTryOnLoading ? 'Generating try-on image' : undefined}>
          {isTryOnLoading ? <img key="loading" className={`tryon-genimg-placeholder ${loadingPreviewUrl ? 'has-uploaded-image' : ''}`} src={loadingPreviewUrl ?? '/images/tryon/genimg-loading.svg'} alt="" aria-hidden="true" /> : <img key="default" src="/images/tryon/phone-frame.svg" alt="" aria-hidden="true" />}
        </div>
      </div>
      <div className="tryon-model-illustration" aria-hidden="true">
        <img className="tryon-model" data-figma-node-id="11787:1347" src="/images/tryon/model.png" alt="" />
      </div>
    </div>
  </section>
}

export { TryOnSection }
