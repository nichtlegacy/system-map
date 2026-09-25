/**
 * Two inputs, one hub: the same shape the maps are made of. Inline rather than
 * a file so it follows the theme tokens.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path
        d="M8 9h9M8 23h9M17 9v14M17 9h3.2M17 23h3.2"
        stroke="var(--color-line-3)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="6" cy="9" r="3.2" fill="var(--color-fg)" />
      <circle cx="6" cy="23" r="3.2" fill="var(--color-fg)" />
      <circle cx="24" cy="16" r="4" fill="var(--color-accent)" />
    </svg>
  );
}
