import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowLeft, Download, ImageIcon, Pencil, RefreshCw, Shirt, Trash2, X } from 'lucide-react'
import { getMyLibrary, isSafeRemoteUrl, type LibraryImage } from '../../lib/sivitai'
import { getHiddenLibraryImageIds, hideLibraryImage } from '../../lib/imageLibrary'

type LibraryPageProps = {
  user: User | null
  onBack: () => void
  onOpenTool: (tool: 'try-on' | 'magic-editor', imageUrl: string) => void
}

function formatLibraryDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function LibraryPage({ user, onBack, onOpenTool }: LibraryPageProps) {
  const [images, setImages] = useState<LibraryImage[]>([])
  const [previewImage, setPreviewImage] = useState<LibraryImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)

  async function refreshLibrary() {
    if (!user || user.is_anonymous || isLoading) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await getMyLibrary()
      setImages(response.items.filter((image) => !getHiddenLibraryImageIds(user.id).has(image.id)))
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load your library.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isCurrent = true

    if (!user || user.is_anonymous) {
      setImages([])
      setError(null)
      setIsLoading(false)
      return () => { isCurrent = false }
    }

    setIsLoading(true)
    setError(null)
    void getMyLibrary()
      .then((response) => {
        if (isCurrent) setImages(response.items.filter((image) => !getHiddenLibraryImageIds(user.id).has(image.id)))
      })
      .catch((requestError: unknown) => {
        if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Unable to load your library.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => { isCurrent = false }
  }, [user])

  function openTool(tool: 'try-on' | 'magic-editor', imageUrl: string) {
    if (!isSafeRemoteUrl(imageUrl)) {
      setError('This image URL is invalid or unavailable.')
      return
    }
    setPreviewImage(null)
    onOpenTool(tool, imageUrl)
  }

  function deleteImage(image: LibraryImage) {
    if (deletingImageId || !window.confirm('Remove this image from your library on this device?')) return

    setDeletingImageId(image.id)
    setError(null)
    try {
      hideLibraryImage(user!.id, image.id)
      setImages((currentImages) => currentImages.filter((currentImage) => currentImage.id !== image.id))
      setPreviewImage((currentImage) => currentImage?.id === image.id ? null : currentImage)
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to remove this image from this device.')
    } finally {
      setDeletingImageId(null)
    }
  }


  return <main className="library-page">
    <header className="library-header">
      <button type="button" className="paywall-home" onClick={onBack} aria-label="Back to home"><img src="/images/full-logo.svg" alt="LGPSM" /></button>
      <button type="button" className="paywall-back" onClick={onBack}><ArrowLeft size={18} strokeWidth={1.5} />Back to home</button>
    </header>
    <section className="library-intro">
      <p>My library</p>
      <h1>Your creations</h1>
      <span>{images.length} image{images.length === 1 ? '' : 's'}</span>
      {user && !user.is_anonymous ? <button type="button" className="library-refresh" onClick={() => void refreshLibrary()} disabled={isLoading} aria-label="Refresh library"><RefreshCw size={15} strokeWidth={1.5} className={isLoading ? 'is-spinning' : undefined} />{isLoading ? 'Refreshing…' : 'Refresh'}</button> : null}
    </section>
    {isLoading ? <section className="library-empty" aria-live="polite">
      <ImageIcon size={34} strokeWidth={1.25} />
      <h2>Loading your creations</h2>
      <p>Please wait while we load your library.</p>
    </section> : error ? <section className="library-empty" role="alert">
      <ImageIcon size={34} strokeWidth={1.25} />
      <h2>Unable to load your library</h2>
      <p>{error}</p>
    </section> : images.length > 0 ? <section className="library-grid" aria-label="Generated images">
      {images.map((image) => <article key={image.id} className="library-image-card library-image-card-standard">
        <button type="button" className="library-image-preview-trigger" onClick={() => setPreviewImage(image)} aria-label="View full image preview"><img src={image.url} alt="Generated creation" /></button>
        <div className="library-image-actions">
          <time dateTime={image.createdAt}>{formatLibraryDate(image.createdAt)}</time>
          <div>
            <button type="button" aria-label="Try on this image" title="Try on" onClick={() => openTool('try-on', image.url)}><Shirt size={17} strokeWidth={1.5} /></button>
            <button type="button" aria-label="Edit image" title="Edit" onClick={() => openTool('magic-editor', image.url)}><Pencil size={16} strokeWidth={1.5} /></button>
            {image.downloadUrl ? <a href={image.downloadUrl} download="slora-creation.png" aria-label="Download image" title="Download"><Download size={17} strokeWidth={1.5} /></a> : null}
            <button type="button" className="is-delete" aria-label="Remove image from this device" title="Remove from library" onClick={() => void deleteImage(image)} disabled={deletingImageId === image.id}><Trash2 size={16} strokeWidth={1.5} /></button>
          </div>
        </div>
      </article>)}
    </section> : <section className="library-empty">
      <ImageIcon size={34} strokeWidth={1.25} />
      <h2>{user && !user.is_anonymous ? 'No creations yet' : 'Sign in to view your library'}</h2>
      <p>{user && !user.is_anonymous ? 'Your generated images will appear here after you create them.' : 'Your saved creations are available after you sign in.'}</p>
      <button type="button" className="button-primary" onClick={onBack}>{user && !user.is_anonymous ? 'CREATE AN IMAGE' : 'BACK TO HOME'}</button>
    </section>}
    {previewImage && <div className="library-full-preview" role="dialog" aria-modal="true" aria-label="Full image preview">
      <button type="button" className="library-full-preview-backdrop" onClick={() => setPreviewImage(null)} aria-label="Close full image preview" />
      <div className="library-full-preview-content">
        <img src={previewImage.url} alt="Generated creation" />
        <button type="button" className="library-full-preview-close" onClick={() => setPreviewImage(null)} aria-label="Close full image preview"><X size={20} /></button>
        <div className="library-full-preview-actions">
          <button type="button" onClick={() => openTool('try-on', previewImage.url)}><Shirt size={17} strokeWidth={1.5} />Try on</button>
          <button type="button" onClick={() => openTool('magic-editor', previewImage.url)}><Pencil size={16} strokeWidth={1.5} />Edit</button>
          {previewImage.downloadUrl ? <a href={previewImage.downloadUrl} download="slora-creation.png"><Download size={17} strokeWidth={1.5} />Download</a> : null}
          <button type="button" className="is-delete" onClick={() => void deleteImage(previewImage)} disabled={deletingImageId === previewImage.id}><Trash2 size={16} strokeWidth={1.5} />{deletingImageId === previewImage.id ? 'Removing…' : 'Remove'}</button>
        </div>
      </div>
    </div>}
  </main>
}

export { LibraryPage }
