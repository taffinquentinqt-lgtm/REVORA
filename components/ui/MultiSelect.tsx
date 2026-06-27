"use client";

interface Props<T extends string> {
  options: readonly T[];
  selected: T[];
  onChange: (next: T[]) => void;
}

/** Pill-style multi-select (toggle chips). */
export function MultiSelect<T extends string>({
  options,
  selected,
  onChange,
}: Props<T>) {
  const toggle = (opt: T) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-accent bg-accent/15 text-ink"
                : "border-border bg-surface text-muted hover:text-ink hover:border-accent/50"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
