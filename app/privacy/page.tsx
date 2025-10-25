export default function PrivacyPage() {
  return (
    <main className="p-8 max-w-3xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

      <p className="mb-4">
        ToolCite respects your privacy. We do not sell personal information. We
        collect only the minimum data needed to operate this website and improve
        the tools we provide.
      </p>

      {/* === NEW: Cookies & Consent section for AdSense/CMP === */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-2">Cookies &amp; Consent</h2>
        <p className="leading-relaxed">
          ToolCite uses cookies and similar technologies to operate this site
          and to show and measure ads via Google AdSense. For visitors in the
          EEA, UK, and Switzerland, a Google-certified Consent Management
          Platform (CMP) displays a consent banner where you can choose
          <em> Consent</em> or <em>Manage options</em>. Your choices control
          whether cookies are used for purposes like ad personalisation,
          frequency capping, and analytics. You can change or withdraw consent
          at any time using the banner when it appears again (for example after
          clearing cookies). Learn more in Google’s policy:&nbsp;
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            https://policies.google.com/technologies/ads
          </a>
          .
        </p>
      </section>

      {/* You can keep your other sections below */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-2">Contact</h2>
        <p>
          If you have questions about this policy, contact us at
          &nbsp;<a href="mailto:support@toolcite.com" className="text-blue-600 underline">
            support@toolcite.com
          </a>.
        </p>
      </section>

      <p className="text-sm text-gray-500 mt-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </main>
  );
}
