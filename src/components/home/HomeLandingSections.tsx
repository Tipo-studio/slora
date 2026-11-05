import { useState } from 'react'
import { GenerationIcon } from '../ui/GenerationIcon'
import './home-landing.css'

type GalleryFilter = 'All' | 'Try-on' | 'Editor' | 'AI studio' | 'Lifestyle'

const featureCards = [
  {
    title: 'Try-on Everything',
    image: '/images/home-feature-tryon.png',
    alt: 'Virtual outfit try-on preview',
    points: ['Wear anything. Stay yourself.', 'Keep your real face and identity', 'Realistic outfit replacement', 'Your body stays yours', 'Keep your pose & background', 'Works with everyday photos'],
  },
  {
    title: 'AI Magic Editor',
    image: '/images/home-feature-editor.png',
    alt: 'AI fashion editing preview',
    points: ['Edit anything. Keep everything that matters.', 'Change outfits instantly', 'Replace backgrounds naturally', 'Preserve your face perfectly', 'Keep accessories you love', 'Professional-quality edits'],
  },
  {
    title: 'AI Studio',
    image: '/images/home-feature-studio.png',
    alt: 'AI-generated fashion model gallery',
    points: ['Generate beautiful images from simple prompts', 'Generate beautiful, realistic virtual models. Customize face, style, outfit and personality', 'Build a consistent AI character across generations'],
  },
]

const tools = [
  { title: 'AI Studio', copy: 'Create portraits, avatars, fashion photos and artistic images from a simple prompt.', action: 'join' },
  { title: 'Magic Editor', copy: 'Remove objects, replace backgrounds, change outfits or enhance every detail.', action: 'editor' },
  { title: 'TRY-ON EVERYTHING', copy: 'See yourself wearing dresses, streetwear, bikinis, formal wear and more.', action: 'try-on' },
  { title: 'VIDEO E COMMERCE', copy: 'Coming soon', action: 'join' },
] as const

const galleryItems = [
  { src: '/images/home-gallery-tryon-1.png', alt: 'Fashion try-on on a motorcycle', category: 'Try-on' },
  { src: '/images/home-gallery-tryon-2.png', alt: 'Casual fashion outfit preview', category: 'Try-on' },
  { src: '/images/home-gallery-lifestyle-1.png', alt: 'Lifestyle fashion portrait', category: 'Lifestyle' },
  { src: '/images/home-gallery-lifestyle-2.png', alt: 'Summer outfit portrait', category: 'Try-on' },
  { src: '/images/home-gallery-lifestyle-3.png', alt: 'Street style outfit preview', category: 'Lifestyle' },
  { src: '/images/home-gallery-editor.png', alt: 'AI fashion edit preview', category: 'Editor' },
  { src: '/images/home-gallery-studio.png', alt: 'AI-generated fashion portrait', category: 'AI studio' },
] as const

const galleryFilters: GalleryFilter[] = ['All', 'Try-on', 'Editor', 'AI studio', 'Lifestyle']

function HomeLandingSections({ onOpenJoinBeta, onOpenFunction, onOpenPaywall }: {
  onOpenJoinBeta: () => void
  onOpenFunction: (tool?: 'try-on' | 'magic-editor') => void
  onOpenPaywall: (plan: 'one-time' | 'creator' | 'studio', returnToResult?: boolean) => void
}) {
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>('All')
  const filteredGallery = activeFilter === 'All' ? galleryItems : galleryItems.filter((item) => item.category === activeFilter)

  const openTool = (action: typeof tools[number]['action']) => {
    if (action === 'try-on') {
      onOpenFunction('try-on')
      return
    }
    if (action === 'editor') {
      onOpenFunction('magic-editor')
      return
    }
    onOpenJoinBeta()
  }

  return <>
    <section className="home-marquee" aria-label="Slora tools">
      <div className="home-marquee-track">
        {['AI Try-on', 'Magic Editor', 'TRY-ON', 'AI STUDIO', 'AI Generation'].map((label) => <span key={label}>{label}</span>)}
      </div>
    </section>

    <section id="features" className="home-features" aria-labelledby="home-features-title">
      <div className="home-section-inner">
        <header className="home-section-heading home-features-heading">
          <h2 id="home-features-title">Why Slora<br />Feels Different</h2>
          <p>Experience AI that creates natural, realistic results—faster, smarter, and effortlessly.</p>
        </header>
        <div className="home-feature-grid">
          {featureCards.map((card) => <article className="home-feature-card" key={card.title}>
            <img className="home-feature-image" src={card.image} alt={card.alt} />
            <div className="home-feature-copy">
              <h3>{card.title}</h3>
              <ul>{card.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </div>
          </article>)}
        </div>
      </div>
    </section>

    <section id="functions" className="home-functions" aria-labelledby="home-functions-title">
      <div className="home-section-inner">
        <header className="home-section-heading">
          <h2 id="home-functions-title">Everything<br />You Need to Create</h2>
          <p>Create, edit and transform stunning images with powerful AI tools—all in one place.</p>
        </header>
        <div className="home-tool-list">
          {tools.map((tool) => <button className="home-tool-row" key={tool.title} type="button" onClick={() => openTool(tool.action)}>
            <span className="home-tool-copy"><span className="home-tool-title">{tool.title}</span><span className="home-tool-description">{tool.copy}</span></span>
            <img src="/images/arrow-design.svg" alt="" aria-hidden="true" />
          </button>)}
        </div>
      </div>
    </section>

    <section id="gallery" className="home-gallery" aria-labelledby="home-gallery-title">
      <div className="home-section-inner">
        <header className="home-gallery-heading">
          <div>
            <p className="home-eyebrow">Creative showcase</p>
            <h2 id="home-gallery-title">Explore what<br />you can create</h2>
          </div>
          <div className="home-gallery-intro">
            <p>Discover thousands of styles you can create with just one photo.</p>
            <div className="home-gallery-filters" role="group" aria-label="Filter gallery images">
              {galleryFilters.map((filter) => <button key={filter} type="button" aria-pressed={activeFilter === filter} className={activeFilter === filter ? 'is-active' : ''} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
            </div>
          </div>
        </header>
        {activeFilter === 'All' ? <div className="home-gallery-mosaic">
          <div className="home-gallery-top-row">
            <img src={galleryItems[0].src} alt={galleryItems[0].alt} />
            <img src={galleryItems[1].src} alt={galleryItems[1].alt} />
            <div className="home-gallery-side-stack">
              <img src={galleryItems[2].src} alt={galleryItems[2].alt} />
              <div className="home-gallery-count"><strong>10K+</strong><span>Beta creators</span></div>
            </div>
          </div>
          <div className="home-gallery-bottom-row">{galleryItems.slice(3).map((item) => <img key={item.src} src={item.src} alt={item.alt} />)}</div>
        </div> : <div className="home-gallery-filtered">
          {filteredGallery.map((item) => <img key={item.src} src={item.src} alt={item.alt} />)}
        </div>}
      </div>
    </section>

    <section id="closing-cta" className="home-closing-cta" aria-labelledby="home-closing-title">
      <div className="home-closing-content">
        <p className="home-eyebrow">Ready to Explore Your Creativity?</p>
        <h2 id="home-closing-title">Everything AI Can Do for<br />Your Photos</h2>
        <p className="home-closing-description">Everything starts with a single photo.</p>
        <button type="button" className="home-closing-button" onClick={() => onOpenFunction('try-on')}><GenerationIcon size={24} />TRY NOW</button>
      </div>
      <div className="home-closing-divider" />
    </section>

    <footer className="home-footer">
      <div className="home-footer-top">
        <div className="home-footer-brand">
          <img src="/images/full-logo.svg" alt="Slora" />
          <p>Slora is a mobile-first AI image generation and editing app built for creators who need high-quality visuals fast.</p>
          <div className="home-footer-socials"><a href="https://t.me/sloraart" target="_blank" rel="noreferrer">Telegram</a><span>x.com</span><span>discord</span></div>
        </div>
        <nav className="home-footer-links" aria-label="Footer">
          <div><strong>Product</strong><a href="#features">Features</a><button type="button" onClick={() => onOpenPaywall('creator')}>Pricing</button><a href="#gallery">Gallery</a></div>
          <div><strong>Company</strong><span>About</span><span>Careers</span><span>Contact</span></div>
          <div><strong>Legal</strong><span>Privacy</span><span>Terms</span><span>Guidelines</span></div>
        </nav>
      </div>
      <div className="home-footer-bottom"><span>© 2026 Slora AI. All rights reserved.</span><span>Mobile-First AI Generation</span></div>
    </footer>
  </>
}

export { HomeLandingSections }
