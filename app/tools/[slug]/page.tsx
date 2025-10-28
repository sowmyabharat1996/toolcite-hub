// app/tools/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TOOLS } from "@/lib/tools";
import { softwareAppSchema, faqSchema, breadcrumbSchema } from "@/lib/schema";
import { TOOL_FAQS } from "@/lib/tool-faqs";
import ToolRenderer from "@/components/ToolRenderer";

// Keep in sync with ToolRenderer's internal registry
const AVAILABLE_COMPONENTS = [
  "qr-code-generator",
  "image-compressor",
  "regex-tester",
  "speed-test",
  "keyword-research-basic",
  "color-palette-generator",
  "meta-og-generator",
] as const;

const hasComponent = (slug: string) =>
  (AVAILABLE_COMPONENTS as readonly string[]).includes(slug);

// --- Static params for SSG ---
export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

// --- Metadata (seed-aware for keyword tool) ---
type GenMetaArgs =
  | { params: { slug: string }; searchParams?: { q?: string } }
  // Next 15 sometimes passes Promises; support both:
  | { params: Promise<{ slug: string }>; searchParams?: { q?: string } };

export async function generateMetadata(args: GenMetaArgs): Promise<Metadata> {
  const params = "then" in args.params ? await args.params : args.params;
  const { slug } = params;
  const seed = (args.searchParams?.q || "Keyword Research").trim();

  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return { title: "Tool Not Found | ToolCite" };

  const baseOg = {
    images: ["/og-default.png"],
    siteName: "ToolCite",
    type: "website" as const,
  };

  const isKW = slug === "keyword-research-basic" || slug === "keyword-research";

  if (isKW) {
    const title = `${seed} – Keyword Research (AI Dashboard)`;
    const url = `https://toolcite.com/tools/${slug}?q=${encodeURIComponent(seed)}`;
    return {
      title,
      description: `AI dashboard for “${seed}”: intent mix, difficulty, KSI, Top-3 picks, and PDF/PNG export.`,
      keywords: [
        "keyword research",
        "seo tool",
        "ai keyword ideas",
        "difficulty",
        "intent",
        seed,
      ],
      // Keep canonical stable (avoid query duplication)
      alternates: { canonical: `/tools/${slug}` },
      openGraph: {
        ...baseOg,
        title,
        description: `AI keyword insights for “${seed}”.`,
        url,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: `AI keyword insights for “${seed}”.`,
        images: ["/og-default.png"],
      },
    };
  }

  // Default metadata for other tools
  return {
    title: `${tool.name} – Free Online Tool`,
    description: `${tool.description} Fast, accurate, and free.`,
    keywords: tool.keywords,
    alternates: { canonical: `/tools/${tool.slug}` },
    openGraph: {
      ...baseOg,
      title: tool.name,
      description: tool.description,
      url: `https://toolcite.com/tools/${tool.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: tool.name,
      description: tool.description,
      images: ["/og-default.png"],
    },
  };
}

// --- Page ---
type PageArgs =
  | { params: { slug: string }; searchParams?: { q?: string } }
  | { params: Promise<{ slug: string }>; searchParams?: { q?: string } };

export default async function ToolPage(args: PageArgs) {
  const params = "then" in args.params ? await args.params : args.params;
  const { slug } = params;

  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();

  const faqs = TOOL_FAQS[slug] ?? [];
  const renderActualTool = hasComponent(slug);

  const seed = (args.searchParams?.q || "Keyword Research").trim();
  const isKW = slug === "keyword-research-basic" || slug === "keyword-research";

  // JSON-LD blobs
  const ldSoftware = softwareAppSchema(tool);
  const ldFaq = faqs.length ? faqSchema(faqs) : null;
  const ldBreadcrumb = breadcrumbSchema([
    { name: "Home", url: "https://toolcite.com" },
    { name: tool.category },
    { name: tool.name },
  ]);
  const ldKW =
    isKW
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Keyword Research (AI Dashboard)",
          applicationCategory: "SEO Tool",
          operatingSystem: "Web",
          url: `https://toolcite.com/tools/${slug}?q=${encodeURIComponent(seed)}`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description: `Find seed keywords and insights for “${seed}”. AI scoring, charts, PDF/PNG export.`,
        }
      : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldSoftware) }}
      />
      {ldFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldFaq) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
      {ldKW && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldKW) }}
        />
      )}

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
              <p className="mt-3 text-sm text-gray-500">
                Coming soon — we’re shipping these one by one.
              </p>
            )}
          </>
        )}
      </section>

      {/* SEO-supporting content scaffold */}
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
          <li>Export & share (where applicable).</li>
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
