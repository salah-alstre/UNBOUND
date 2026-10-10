/** Technology labels as a real list of bordered chips; `limit` trims long stacks on compact cards. */
export function TechChips({ items, limit, label = "Technologies" }: { items: readonly string[]; limit?: number; label?: string }) {
  const shown = limit ? items.slice(0, limit) : items;
  const rest = items.length - shown.length;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
      {shown.map((t) => (
        <li key={t} className="mono border border-line bg-raise px-2 py-1 text-paper">
          {t}
        </li>
      ))}
      {rest > 0 ? <li className="mono px-1 py-1 text-dim">+{rest}</li> : null}
    </ul>
  );
}
