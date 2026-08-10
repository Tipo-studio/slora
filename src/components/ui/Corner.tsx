export type CornerPosition = 'tl' | 'tr' | 'bl' | 'br'

export function Corner({ position }: { position: CornerPosition }) {
  const paths = {
    tl: 'M0 11.5V0.5H11.5', tr: 'M0.5 0.5H11.5V11.5',
    bl: 'M0 0.5V11.5H11.5', br: 'M0.5 11.5H11.5V0.5',
  }
  const place = { tl: 'left-0 top-0', tr: 'right-0 top-0', bl: 'bottom-0 left-0', br: 'bottom-0 right-0' }
  return <svg aria-hidden="true" className={`absolute ${place[position]}`} width="var(--corner)" height="var(--corner)" viewBox="0 0 12 12" fill="none"><path d={paths[position]} stroke="currentColor" strokeWidth="1.5" /></svg>
}
