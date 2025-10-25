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
        "relative flex flex-col gap-3 rounded-2xl border border-neutral-800/60 p-4 backdrop-blur-md shadow-md card-hover",
        "bg-white/10 dark:bg-[#161616]/80 text-neutral-100",
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border text-xl",
            disabled
              ? "border-neutral-700 bg-neutral-900 text-neutral-500"
              : "border-neutral-700 bg-neutral-950 text-neutral-100"
          )}
        >
          {emoji ?? "🔧"}
        </div>

        <h3 className="text-base font-semibold">
          {title}
          {disabled && (
            <span className="ml-2 text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
          )}
        </h3>
      </div>

      <p className="text-sm text-neutral-400 leading-snug">{description}</p>
    </div>
  );

  if (disabled) return <div>{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
      data-href={href}
    >
      {content}
    </button>
  );
}
