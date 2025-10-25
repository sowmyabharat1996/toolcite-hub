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
      className={`cursor-pointer select-none rounded-2xl p-5 sm:p-6 border backdrop-blur-lg
        ${disabled
          ? "bg-[#1a1a1a]/60 border-neutral-800 opacity-40 cursor-not-allowed"
          : "bg-gradient-to-br from-[#141414]/90 to-[#0d0d0d]/90 border-neutral-700 hover:border-blue-500 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(0,0,0,0.6)] transition-all duration-300"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${disabled ? "opacity-60" : "text-white"}`}>
          {iconNode}
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${disabled ? "text-gray-500" : "text-white"}`}>
            {heading}
          </h3>
          {description && (
            <p className={`text-sm mt-1 ${disabled ? "text-gray-600" : "text-gray-400"}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
