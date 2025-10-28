// app/tools/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ToolRenderer from "@/components/ToolRenderer";
import { TOOLS } from "@/lib/tools";
import { softwareAppSchema, faqSchema, breadcrumbSchema } from "@/lib/schema";
import { TOOL_FAQS } from "@/lib/tool-faqs";

// Keep in sync with components/ToolRenderer.tsx REGISTRY
const AVAILABLE_COMPONENTS = [
  "qr-code-generator",
  "image-compressor",
  "regex-tester",
  "speed-test",
  "keyword-research-basic",
  "color-palette-generator",
  "meta-og-generator",
] as const;

const hasComponent = (slug: string): slug is (typeof AVAILABLE_COMPONENTS)[number] =>
  (AVAILABLE_COMPONENTS as readonly string[]).includes(slug);

// ----- SSG params
export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

/** Next 15: both `params` and `searchParams` are Promises in PageProps */
type ParamsPromise = Promise<{ slug: string }>;
type SearchParamsPromise = Promise<Record<string, string | string[] | undefined>>;

// ----- Per-page metadata (per-tool OG with size)
export async function generateMetadata(
  { params, searchParams }: { params: ParamsPromise; searchParams: SearchParamsPromise }
): Promise<Metadata> {
  const { slug } = await params;
  await searchParams; // keep type parity (even if unused)

  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return { title: "Tool Not Found | ToolCite" };

  // Per-tool OG (relative path is fine because metadataBase is set site-wide)
  const perToolOg = `/og/tools/${slug}.png`;
  const ogImage = perToolOg || "/og-default.png";

  return {
    title: `${tool.name} – Free Online Tool`,
    description: `${tool.description} Fast, accurate, and free.`,
    keywords: tool.keywords,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: {
      title: tool.name,
      description: tool.description,
      url: `https://toolcite.com/tools/${tool.slug}`,
      siteName: "ToolCite",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: tool.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: tool.name,
      description: tool.description,
      images: [ogImage],
    },
  };
}

// ----- Page (unwrap in a child)
export default function ToolPage({
  params,
  searchParams,
}: {
  params: ParamsPromise;
  searchParams: SearchParamsPromise;
}) {
  return <ResolvedToolPage params={params} searchParams={searchParams} />;
}

async function ResolvedToolPage({
  params,
  searchParams,
}: {
  params: ParamsPromise;
  searchParams: SearchParamsPromise;
}) {
  const { slug } = await params;
  await searchParams;

  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();

  const faqs = TOOL_FAQS[slug] ?? [];
  const renderActualTool = hasComponent(slug);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* JSON-LD: SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema(tool)) }}
      />
      {/* JSON-LD: FAQ */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }}
        />
      )}
      {/* JSON-LD: Breadcrumbs (category to /tools; final crumb without URL) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: "https://toolcite.com" },
              { name: tool.category, url: "https://toolcite.com/tools" },
              { name: tool.name },
            ])
          ),
        }}
      />

      {/* Header */}
      <h1 className="text-3xl font-semibold">
        {tool.icon} {tool.name} – Free Online Tool
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">{tool.description}</p>

      {/* Main tool panel */}
      <section className="mt-6 rounded-2xl border p-6 bg-white/70 dark:bg-neutral-900">
        {renderActualTool ? (
          <ToolRenderer slug={slug} />
        ) : (
          <>
            <p className="text-lg">
              We’re building this tool now. Check back soon or explore other tools on the homepage.
            </p>
            {tool.status !== "live" && (
              <p className="mt-3 text-sm text-gray-500">Coming soon — we’re shipping these one by one.</p>
            )}
          </>
        )}
      </section>

      {/* SEO-supporting content */}
      <section className="prose prose-slate dark:prose-invert mt-10">
        <h2>How to Use {tool.name}</h2>
        <ol>
          <li>Open the tool on this page.</li>
          <li>Provide your input and adjust options as needed.</li>
          <li>Copy, download, or share the result.</li>
        </ol>

        <h2>Features</h2>
        <ul>
          <li>Fast, private, no sign-up required.</li>
          <li>Mobile-friendly and accessible on any device.</li>
          <li>Export &amp; share (where applicable).</li>
        </ul>

        <h2>FAQ</h2>
        {faqs.length > 0 ? (
          <ul>
            {faqs.map((f, i) => (
              <li key={i}>
                <strong>{f.q}</strong>
                <div>{f.a}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p>We’ll add common questions and answers for this tool soon.</p>
        )}
      </section>
    </main>
  );
}
