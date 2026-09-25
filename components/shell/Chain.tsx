/**
 * A run of short facts along the bottom rail, separated by hairlines rather
 * than by punctuation: the divider is a piece of structure, so it can be as
 * quiet as it likes without the eye reading it as a word.
 *
 * `step` numbers the items, for a chain that really is a sequence.
 */
export function Chain({
  items,
  step = false,
  label,
}: {
  items: string[];
  step?: boolean;
  /** Accessible name for the list — the rail itself has no room for one. */
  label: string;
}) {
  return (
    <ol aria-label={label} className="flex items-center">
      {items.map((item, i) => (
        <li key={item} className="flex items-center whitespace-nowrap">
          {i > 0 && (
            <span aria-hidden className="mx-3 h-2.5 w-px shrink-0 bg-line-2" />
          )}
          {step && (
            <span className="mr-1.5 font-mono text-[10px] tabular-nums text-line-3">
              {i + 1}
            </span>
          )}
          <span className="text-[10.5px] text-fg-3">{item}</span>
        </li>
      ))}
    </ol>
  );
}
