export default function TermsPage() {
  return (
    <main className="p-8 max-w-3xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Terms of Use</h1>

      <p className="mb-4">
        Welcome to ToolCite Hub. By accessing or using our site, you agree to
        comply with and be bound by these Terms of Use. If you do not agree with
        any part of these terms, please do not use this website.
      </p>

      <section className="mt-6">
        <h2 className="text-2xl font-semibold mb-2">Use of Website</h2>
        <p>
          ToolCite provides a growing collection of free, browser-based tools
          designed to help with everyday tasks. You agree to use these tools
          responsibly, for lawful purposes, and without attempting to disrupt or
          misuse the platform.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-2xl font-semibold mb-2">Intellectual Property</h2>
        <p>
          All content, branding, and user interface design belong to ToolCite
          unless otherwise noted. You may not copy, modify, or redistribute any
          part of this website without prior permission.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-2xl font-semibold mb-2">Disclaimer</h2>
        <p>
          All tools are provided “as-is” without any warranties. ToolCite makes
          no guarantees about accuracy, reliability, or suitability for any
          specific purpose. Use at your own discretion.
        </p>
      </section>

      {/* === NEW: Privacy & Cookies Section === */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-2">Privacy &amp; Cookies</h2>
        <p className="leading-relaxed text-gray-700">
          ToolCite uses cookies and similar technologies to operate this site
          and deliver ads through Google AdSense. For users in the EEA, UK, and
          Switzerland, Google’s Consent Management Platform (CMP) shows a
          consent banner allowing you to accept or manage cookie preferences.
          You can review or change consent at any time by revisiting the banner
          or clearing your browser cookies. For details, please read our{" "}
          <a href="/privacy" className="text-blue-600 underline">
            Privacy Policy
          </a>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-2">Contact</h2>
        <p>
          For any questions regarding these terms, contact us at{" "}
          <a
            href="mailto:support@toolcite.com"
            className="text-blue-600 underline"
          >
            support@toolcite.com
          </a>
          .
        </p>
      </section>

      <p className="text-sm text-gray-500 mt-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </main>
  );
}
