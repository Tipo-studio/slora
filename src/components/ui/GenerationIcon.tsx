type GenerationIconProps = {
  size?: number
}

function GenerationIcon({ size = 16 }: GenerationIconProps) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 0.666687C8 0.666687 8.64271 3.78646 9.71429 5.25002C10.7859 6.71358 14 8.00002 14 8.00002C14 8.00002 10.7859 9.28646 9.71429 10.75C8.64271 12.2136 8 15.3334 8 15.3334C8 15.3334 7.35729 12.2136 6.28571 10.75C5.21414 9.28646 2 8.00002 2 8.00002C2 8.00002 5.25388 6.6593 6.28571 5.25002C7.31755 3.84074 8 0.666687 8 0.666687Z" fill="#080D14" /></svg>
}

export { GenerationIcon }
export default GenerationIcon
