// components/ToolCard.tsx
import * as React from "react";

type Props = {
  href?: string;              // target url (internal or external)
  label: string;              // visible label
  icon?: React.ReactNode;     // optional icon (emoji / svg)
  disabled?: boolean;         // for "Coming soon"
  redirect?: boolean;         // true => use <a> full navigation (best for redirects)
};

export default function ToolCard({
  href = "#",
  label,
  icon,
  disabled,
  redirect,
}: Props) {
  const base =
    "block w-full rounded-2xl bg-white text-gray-900 shadow-md hover:shadow-lg " +
    "px-5 py-4 text-base md:text-lg font-medium " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 " +
    "active:scale-[.99] transition visited:text-inherit";
  const off = "opacity-60 pointer-events-none";

  // For redirected tools use a plain <a> to force full navigation (fixes mobile back tap).
  if (redirect) {
    return (
      <a href={href} className={`${base} ${disabled ? off : ""}`} target="_self" rel="noopener">
        <span className="inline-flex items-center gap-2">
          {icon} <span>{label}</span>
        </span>
      </a>
    );
  }

  // Default (non-clickable or you can later switch to Next Link for internal pages)
  return (
    <div className={`${base} ${disabled ? off : ""}`}>
      <span className="inline-flex items-center gap-2">
        {icon} <span>{label}</span>
      </span>
    </div>
  );
}
