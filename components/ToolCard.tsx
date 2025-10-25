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
        "border-neutral-200 dark:border-neutral-800",
        "bg-white/95 dark:bg-[#161616]/95",
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl transition-colors",
          disabled
            ? "border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
            : "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-[#1e1e1e] dark:text-neutral-100"
        )}
      >
        {emoji ?? "🔧"}
      </div>

      {/* Text */}
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
            "mt-1 text-sm leading-snug",
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
      className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
      data-href={href}
    >
      {content}
    </button>
  );
}
