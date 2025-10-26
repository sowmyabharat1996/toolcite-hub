// app/tools/[slug]/page.tsx
import { TOOLS } from "@/lib/tools";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Build-time params generation (can stay sync)
export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

// ✅ Next 15: params is a Promise — await it here
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return { title: "Tool Not Found" };

  return {
    title: `${tool.name} – Free Online Tool`,
    description: `${tool.description} Fast, accurate, and free.`,
    keywords: tool.keywords,
    openGraph: {
      title: tool.name,
      description: tool.description,
      images: ["/og-default.png"],
    },
  };
}

// ✅ Next 15: await params in the page too
export default async function ToolPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold">
        {tool.icon} {tool.name} – Free Online Tool
      </h1>

      <section className="mt-6 rounded-2xl border p-6">
        <p className="text-lg">{tool.description}</p>
        {tool.status !== "live" && (
          <p className="mt-3 text-sm text-gray-500">Coming soon — we’re building this now.</p>
        )}
      </section>

      <section className="prose prose-slate dark:prose-invert mt-10">
        <h2>How to Use {tool.name}</h2>
        <ol>
          <li>Open the tool and provide your input.</li>
          <li>Adjust options as needed.</li>
          <li>Copy, download, or share the result.</li>
        </ol>
        <h2>Features</h2>
        <ul>
          <li>Fast, private, no sign-up.</li>
          <li>Mobile-friendly on any device.</li>
          <li>Export & share (where applicable).</li>
        </ul>
      </section>
    </main>
  );
}
