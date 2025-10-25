"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface ToolCardProps {
  href?: string;
  title?: string;
  label?: string;
  description?: string;
  icon?: ReactNode;
  emoji?: string | ReactNode;
  disabled?: boolean;
  redirect?: boolean;
}

export default function ToolCard({
  href,
  title,
  label,
  description,
  icon,
  emoji,
  disabled = false,
  redirect = false,
}: ToolCardProps) {
  const router = useRouter();
  const heading = title ?? label ?? "";
  const iconNode: ReactNode = icon ?? emoji ?? "🔧";

  const handleClick = () => {
    if (disabled) return;
    if (redirect && href) window.location.href = href;
    else if (href) router.push(href);
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer select-none rounded-2xl p-5 sm:p-6
        border border-neutral-800 bg-[#111]/60 backdrop-blur-xl
        shadow-[0_10px_30px_rgba(0,0,0,0.45)]
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.55)] border-neutral-700 hover:border-blue-500 transition-transform duration-300"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${disabled ? "opacity-60" : "opacity-100"}`}>{iconNode}</div>
        <div>
          <h3 className={`text-lg font-semibold ${disabled ? "text-gray-400" : "text-white"}`}>
            {heading}
          </h3>
          {description && (
            <p className={`text-sm mt-1 ${disabled ? "text-gray-500" : "text-gray-400"}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
