"use client";
import React from "react";

export default function KeywordList({ data, search, grouping, comparison }: any) {
  const showToast = (msg: string) => {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#333",
      color: "#fff",
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "14px",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity 0.3s ease",
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => (t.style.opacity = "1"));
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 400);
    }, 1500);
  };

  const filtered = data
    .flatMap((s: any) =>
      s.keywords.map((k: any) => ({
        ...k,
        source: s.source,
      }))
    )
    .filter((k: any) => k.text.toLowerCase().includes(search.toLowerCase()));

  const groups = grouping
    ? filtered.reduce((acc: any, k: any) => {
        const key = k.text.split(" ")[1] || "misc";
        (acc[key] = acc[key] || []).push(k);
        return acc;
      }, {})
    : { All: filtered };

  const diffColor = (n: number) =>
    n < 34 ? "bg-green-500" : n < 67 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div>
      {Object.entries(groups).map(([group, list]: any) => (
        <div key={group} className="mb-6">
          {grouping && (
            <h2 className="text-lg font-semibold mb-3 text-gray-700 capitalize">
              {group}
            </h2>
          )}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {list.map((k: any, i: number) => {
              const compDiff =
                comparison?.avg && comparison.count[k.intent]
                  ? comparison.avg - k.difficulty
                  : 0;
              const outline =
                compDiff > 0
                  ? "border-green-300"
                  : compDiff < 0
                  ? "border-red-300"
                  : "border-gray-100";
              return (
                <div
                  key={i}
                  onClick={() => showToast(`Copied: ${k.text}`)}
                  className={`p-3 border ${outline} rounded-lg bg-white hover:shadow transition cursor-pointer`}
                >
                  <p className="font-medium text-gray-800 mb-1">{k.text}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-white text-xs ${diffColor(
                        k.difficulty
                      )}`}
                    >
                      {k.difficulty}
                    </span>
                    <span className="text-gray-500">{k.intent}</span>
                    <span className="text-gray-400">{k.source}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
