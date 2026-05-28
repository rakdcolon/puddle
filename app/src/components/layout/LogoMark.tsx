export default function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <span className="flex items-center gap-[7px]" aria-label="puddle">
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '2px',
          borderRadius: '3px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <i style={{ background: 'var(--color-ink)', display: 'block' }} />
        <i style={{ background: 'var(--color-accent)', display: 'block' }} />
        <i style={{ background: 'var(--color-accent)', display: 'block' }} />
        <i style={{ background: 'var(--color-ink)', display: 'block' }} />
      </span>
      <span
        style={{
          fontSize: size,
          fontWeight: 500,
          letterSpacing: '-0.4px',
          lineHeight: 1,
          color: 'var(--color-ink)',
          fontStyle: 'normal',
        }}
      >
        puddle
      </span>
    </span>
  )
}
