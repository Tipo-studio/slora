import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type PopupProps = {
  open: boolean
  title: string
  titleId?: string
  onClose: () => void
  children: ReactNode
  eyebrow?: string
  description?: string
  icon?: ReactNode
  className?: string
  closeDisabled?: boolean
}

function Popup({ open, title, titleId, onClose, children, eyebrow, description, icon, className = '', closeDisabled = false }: PopupProps) {
  if (!open) return null
  const headingId = titleId ?? 'app-popup-title'

  return createPortal(
    <div className={`app-popup ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <button type="button" className="app-popup-backdrop" onClick={onClose} aria-label={`Close ${title}`} />
      <section className="app-popup-panel" onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="app-popup-close" onClick={onClose} aria-label={`Close ${title}`} disabled={closeDisabled}>
          <X size={18} strokeWidth={1.75} />
        </button>
        {(icon || eyebrow) && <div className="app-popup-heading-mark">{icon}<span>{eyebrow}</span></div>}
        <h2 id={headingId} className="app-popup-title">{title}</h2>
        {description && <p className="app-popup-description">{description}</p>}
        <div className="app-popup-content">{children}</div>
      </section>
    </div>,
    document.body,
  )
}

export { Popup }
export type { PopupProps }
