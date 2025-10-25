// components/ToolCard.tsx
"use client";

import { cn } from "./cn";

export type ToolCardProps = {
  title: string;
  description: string;
  emoji?: string;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export default function ToolCard({
  title,
  description,
  emoji,
  href,
  disabled = false,
  onClick,
}: ToolCardProps) {
  const content = (
    <div
      className={cn(
        "group relative flex h-full w-full items-start gap-3 rounded-2xl border p-4 shadow-sm transition-all",
        "bg-white/95 dark:bg-neutral-900/95 border-neutral-200 dark:border-neutral-800",
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-md active:scale-[0.99]"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl",
          disabled
            ? "border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
            : "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
        )}
      >
        {emoji ?? "🔧"}
      </div>

      <div className="flex flex-col">
        <h3
          className={cn(
            "text-base font-semibold",
            disabled ? "text-neutral-500" : "text-neutral-900 dark:text-neutral-100"
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mt-1 text-sm",
            disabled ? "text-neutral-400" : "text-neutral-600 dark:text-neutral-400"
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );

  if (disabled) return <div>{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      data-href={href}
    >
      {content}
    </button>
  );
}
