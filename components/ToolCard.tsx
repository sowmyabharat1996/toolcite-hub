"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface ToolCardProps {
  href?: string;
  label: string;
  icon: ReactNode;
  description?: string;
  disabled?: boolean;
  redirect?: boolean;
}

/**
 * ToolCard — modern glassmorphic card.
 * All rounded / hover / shadow handled inline (no @apply issues).
 */
export default function ToolCard({
  href,
  label,
  icon,
  description,
  disabled = false,
  redirect = false,
}: ToolCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (disabled) return;
    if (redirect && href) {
      window.location.href = href; // Mobile-safe redirect
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`card-hover cursor-pointer select-none p-5 sm:p-6 backdrop-blur-lg border rounded-2xl
        ${
          disabled
            ? "bg-white/5 dark:bg-[#111]/60 border-neutral-800 cursor-not-allowed opacity-40"
            : "bg-white/10 dark:bg-[#161616]/80 border-neutral-700 hover:border-blue-500 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-transform duration-300 ease-in-out"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${disabled ? "opacity-50" : "opacity-100"}`}>
          {icon}
        </div>

        <div>
          <h3
            className={`text-lg font-semibold ${
              disabled ? "text-gray-400" : "text-white"
            }`}
          >
            {label}
          </h3>

          {description && (
            <p
              className={`text-sm mt-1 ${
                disabled ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
