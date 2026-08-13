import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowLeft, Download, ImageIcon, Pencil, Shirt } from 'lucide-react'
import { ImageRevealBackground } from '../../components/home/ImageRevealBackground'
import { getLibraryImages, type LibraryImage } from '../../lib/imageLibrary'

type LibraryPageProps = {
  user: User | null
  onBack: () => void
  onOpenTool: (tool: 'try-on' | 'magic-editor', imageUrl: string) => void
}

const DUMMY_IMAGE_URLS = [
  '/images/tryon/mock-result.png',
  '/images/tryon/person-1.png',
  '/images/tryon/person-2.png',
  '/images/tryon/person-3.png',
  '/images/tryon/person-4.png',
  '/images/tryon/clothes-1.png',
  '/images/tryon/clothes-2.png',
  '/images/tryon/clothes-3.png',
  '/images/tryon/clothes-4.png',
] as const

function getDummyImages(): LibraryImage[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `dummy-${index}`,
    url: DUMMY_IMAGE_URLS[index % DUMMY_IMAGE_URLS.length],
    createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    layout: index % 7 === 0 ? 'wide' : index % 4 === 0 ? 'tall' : 'standard',
  }))
}

function LibraryPage({ user, onBack, onOpenTool }: LibraryPageProps) {
  const [images, setImages] = useState<LibraryImage[]>(() => {
    const savedImages = user ? getLibraryImages(user.id) : []
    return import.meta.env.DEV ? [...savedImages, ...getDummyImages()] : savedImages
  })

  useEffect(() => {
    const savedImages = user ? getLibraryImages(user.id) : []
    setImages(import.meta.env.DEV ? [...savedImages, ...getDummyImages()] : savedImages)
  }, [user])

  return <main className="library-page">
    <ImageRevealBackground />
    <header className="library-header">
      <button type="button" className="paywall-home" onClick={onBack} aria-label="Back to home"><img src="/images/full-logo.svg" alt="LGPSM" /></button>
      <button type="button" className="paywall-back" onClick={onBack}><ArrowLeft size={18} strokeWidth={1.5} />Back to home</button>
    </header>
    <section className="library-intro">
      <p>My library</p>
      <h1>Your creations</h1>
      <span>{images.length} image{images.length === 1 ? '' : 's'}</span>
    </section>
    {images.length > 0 ? <section className="library-grid" aria-label="Generated images">
      {images.map((image) => <article key={image.id} className={`library-image-card library-image-card-${image.layout ?? 'standard'}`}>
        <img src={image.url} alt="Generated creation" />
        <div className="library-image-actions">
          <time dateTime={image.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(image.createdAt))}</time>
          <div>
            <button type="button" aria-label="Try on this image" title="Try on" onClick={() => onOpenTool('try-on', image.url)}><Shirt size={17} strokeWidth={1.5} /></button>
            <button type="button" aria-label="Edit image" title="Edit" onClick={() => onOpenTool('magic-editor', image.url)}><Pencil size={16} strokeWidth={1.5} /></button>
            <a href={image.url} download="slora-creation.png" aria-label="Download image" title="Download"><Download size={17} strokeWidth={1.5} /></a>
          </div>
        </div>
      </article>)}
    </section> : <section className="library-empty">
      <ImageIcon size={34} strokeWidth={1.25} />
      <h2>No creations yet</h2>
      <p>Your generated images will appear here after you create them.</p>
      <button type="button" className="button-primary" onClick={onBack}>CREATE AN IMAGE</button>
    </section>}
  </main>
}

export { LibraryPage }
