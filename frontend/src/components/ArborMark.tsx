interface ArborMarkProps {
  className?: string;
  /** Drop the terminal dots and one branch. Use below ~20px, where they blob together. */
  simple?: boolean;
  title?: string;
}

/**
 * Arbor's mark: an asymmetric branching stem with terminal nodes.
 *
 * Drawn on the same 24x24 grid at the same 1.5 stroke weight as the Heroicons
 * 24/outline set the rest of the app uses, so it sits beside HomeIcon and
 * friends without looking borrowed from somewhere else.
 *
 * The branches deliberately fork at different heights. A symmetric version
 * reads as a rune or a "Y"; the asymmetry plus the terminal dots make it read
 * as a branching structure -- a graph of work growing out of capture, which is
 * the pun the product name is already making.
 */
export default function ArborMark({ className = 'h-6 w-6', simple = false, title }: ArborMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={simple ? 2.5 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={simple ? 'M12 21V9' : 'M12 21V5.5'} />
      <path d="M12 14.5 L6.5 9" />
      {simple ? (
        <path d="M12 14.5 L17.5 9" />
      ) : (
        <>
          <path d="M12 10 L17.5 4.5" />
          {/* terminal nodes — the thing that makes it a structure, not a twig */}
          <circle cx="12" cy="4.6" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="5.9" cy="8.4" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="18.1" cy="3.9" r="1.3" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
