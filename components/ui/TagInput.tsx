"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface Props {
  tags: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

/** Free tags input — Enter or comma to add, backspace to remove last. */
export function TagInput({ tags, onChange, placeholder }: Props) {
  const [value, setValue] = useState("");

  const add = (raw: string) => {
    const t = raw.trim().replace(/,$/, "").trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(value);
    } else if (e.key === "Backspace" && value === "" && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-2 py-2 focus-within:border-accent/60">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-[4px] bg-elevated px-2 py-1 font-mono text-xs text-ink"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-muted hover:text-skip"
            aria-label={`Retirer ${tag}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => value && add(value)}
        placeholder={tags.length ? "" : placeholder}
        className="min-w-[120px] flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
      />
    </div>
  );
}
