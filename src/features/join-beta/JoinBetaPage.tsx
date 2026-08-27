import { useEffect, useState, type ChangeEvent } from 'react'
import { submitJoinBeta } from '../../lib/sivitai'
import { SiteHeader, type SiteHeaderProps } from '../../components/SiteHeader'
import { Popup } from '../../components/ui/Popup'
import { CheckCircle2 } from 'lucide-react'

const JOIN_BETA_ROLES = ['Fashion Brand Owner', 'Online Seller', 'Marketing Agency', 'Content Creator', 'Photographer', 'Designer', 'E-commerce Team', 'Retail Store Manager']
const JOIN_BETA_GOALS = ['Create model photos without hiring models', 'Change clothing on existing photos', 'Generate product marketing content', 'Create social media posts faster', 'Build lookbooks and catalogs', 'write what you want']

type JoinBetaPageProps = { onBack: () => void; onRequestLogin: () => void } & SiteHeaderProps

function JoinBetaPage({ onBack, user, onRequestLogin, ...headerProps }: JoinBetaPageProps) {
  const [role, setRole] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [task, setTask] = useState('')
  const [exampleName, setExampleName] = useState('')
  const [examplePreviewUrl, setExamplePreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false)
  useEffect(() => () => {
    if (examplePreviewUrl) URL.revokeObjectURL(examplePreviewUrl)
  }, [examplePreviewUrl])
  const handleExampleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setExampleName(file.name)
    setExamplePreviewUrl(URL.createObjectURL(file))
  }
  const toggleGoal = (goal: string) => setGoals((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal])

  return <main className="join-beta-page" data-figma-node-id="11798:1773">
    <SiteHeader {...headerProps} user={user} onLogoClick={onBack} />
    <img className="join-beta-logo" src="/images/join-beta-logo.svg" alt="Join beta" />
    <div className="join-beta-model" aria-hidden="true"><img src="/images/tryon/model.png" alt="" /><img src="/images/tryon/model-shadow.svg" alt="" /></div>
    <form className="join-beta-form" onSubmit={(event) => { event.preventDefault(); if (!user || user.is_anonymous) { onRequestLogin(); return }; if (!role || goals.length === 0 || !task.trim()) { setError('Please complete the required beta questions.'); return }; setIsSubmitting(true); setError(''); void submitJoinBeta({ role, goals, task: task.trim(), exampleName: exampleName || null }).then((result) => { setMessage(result.alreadySubmitted ? 'Your beta application was already submitted. Your 5 generations are available.' : 'Beta application submitted. 5 generations were added to your account.'); setIsSuccessPopupOpen(true); window.localStorage.setItem('join-beta-submitted', 'true'); window.dispatchEvent(new Event('join-beta-submitted')) }).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to submit your beta application.')).finally(() => setIsSubmitting(false)) }}>
      <section className="join-beta-question"><div className="join-beta-heading"><span className={`join-beta-step ${role ? 'is-active' : 'is-muted'}`}><img src={`/images/join-beta-step${role ? '' : '-muted'}.svg`} alt="" aria-hidden="true" />1</span><h1>What best describes you?</h1></div><div className="join-beta-options join-beta-role-options">{JOIN_BETA_ROLES.map((item) => <button key={item} type="button" className={`join-beta-chip ${role === item ? 'is-selected' : ''}`} onClick={() => setRole(item)}>{role === item && <img src="/images/join-beta-role.svg" alt="" aria-hidden="true" />}{item}</button>)}</div></section>
      <section className="join-beta-question"><div className="join-beta-heading"><span className={`join-beta-step ${goals.length > 0 ? 'is-active' : 'is-muted'}`}><img src={`/images/join-beta-step${goals.length > 0 ? '' : '-muted'}.svg`} alt="" aria-hidden="true" />2</span><h2>What are you hoping to achieve with AI-generated fashion images?</h2></div><div className="join-beta-options join-beta-goal-options">{JOIN_BETA_GOALS.map((item) => <button key={item} type="button" className={`join-beta-goal ${goals.includes(item) ? 'is-selected' : ''}`} onClick={() => toggleGoal(item)}><span className="join-beta-checkbox">{goals.includes(item) && <img src="/images/join-beta-check.svg" alt="" aria-hidden="true" />}</span>{item}</button>)}</div></section>
      <section className="join-beta-question"><div className="join-beta-heading"><span className={`join-beta-step ${task.trim() ? 'is-active' : 'is-muted'}`}><img src={`/images/join-beta-step${task.trim() ? '' : '-muted'}.svg`} alt="" aria-hidden="true" />1</span><h2>If you could magically automate one task, what would it be?</h2></div><textarea className="join-beta-textarea" value={task} onChange={(event) => setTask(event.target.value)} placeholder={'"Upload a clothing photo and instantly generate 20 realistic model images for different body types and poses."'} /></section>
      <section className="join-beta-question"><div className="join-beta-heading"><span className={`join-beta-step ${exampleName ? 'is-active' : 'is-muted'}`}><img src={`/images/join-beta-step${exampleName ? '' : '-muted'}.svg`} alt="" aria-hidden="true" />2</span><h2>Upload an example (Optional but highly valuable)</h2></div><label className={`join-beta-upload ${examplePreviewUrl ? 'has-preview' : ''}`}><input type="file" accept="image/png,image/jpeg" onChange={handleExampleChange} />{examplePreviewUrl ? <img className="join-beta-upload-preview" src={examplePreviewUrl} alt="Uploaded example preview" /> : <span className="join-beta-upload-icon"><img src="/images/join-beta-image.svg" alt="" aria-hidden="true" /></span>}<span>{exampleName || "Show us what you're trying to create."}</span></label></section>
      <section className="join-beta-footer"><p>Thank you for helping us build a better product.</p><button type="submit" className="join-beta-submit button-primary" disabled={isSubmitting}><img src="/images/join-beta-step.svg" alt="" aria-hidden="true" />{isSubmitting ? 'SUBMITTING…' : 'TAKE FREE NOW'}</button><p className="join-beta-reward">You'll receive:<br /><strong>5 generations now</strong><br />Early Access Invitation at Launch</p>{error && <p className="join-beta-status is-error" role="alert">{error}</p>}</section>
    </form>
    <Popup open={isSuccessPopupOpen} title="Join Beta Success" onClose={() => { setIsSuccessPopupOpen(false); window.dispatchEvent(new Event('join-beta-submitted')) }} icon={<CheckCircle2 size={48} strokeWidth={1.5} color="#10b981" />} className="join-beta-success-popup">
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151' }}>{message}</p>
        <button type="button" onClick={() => { setIsSuccessPopupOpen(false); window.dispatchEvent(new Event('join-beta-submitted')); onBack() }} style={{ padding: '12px 32px', border: 'none', borderRadius: '8px', background: '#000', color: '#fff', fontSize: '14px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>START CREATING</button>
      </div>
    </Popup>
  </main>
}

export { JoinBetaPage }
