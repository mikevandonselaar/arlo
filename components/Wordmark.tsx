interface WordmarkProps {
  className?: string;
}

/**
 * Temporary text wordmark. Colour comes from the parent (text-ink, or
 * text-on-accent on the blue screen); size from `className`.
 *
 * To switch to the final logo: replace the <span> below with the logo <svg>
 * (fill="currentColor", height="1em") — nothing else in the app has to change.
 */
export function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <span
      aria-label="utan"
      className={`inline-block font-sans font-medium tracking-[0.04em] leading-none select-none ${className}`}
    >
      UTAN
    </span>
  );
}
