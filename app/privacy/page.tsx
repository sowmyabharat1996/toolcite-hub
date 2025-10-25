export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#0b0b0b] to-[#121212] text-gray-200 py-16 px-6">
      <section className="max-w-4xl mx-auto">
        {/* ===== Header ===== */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        <p className="text-gray-400 text-center text-lg leading-relaxed mb-12">
          At <span className="text-blue-400 font-semibold">ToolCite Hub</span>, we respect your
          privacy. This page explains what data we collect, how it’s used, and the limited cases in
          which we share it. By using this website, you consent to this policy.
        </p>

        {/* ===== Sections ===== */}
        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Information We Collect</h2>
            <p>
              ToolCite Hub does not require sign-ups or user accounts. We only collect anonymous usage
              data to improve site performance and usability. This includes browser type, device
              information, and approximate location (city-level) — never personally identifiable
              data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Cookies & Analytics</h2>
            <p>
              We use cookies to maintain site functionality (for example, theme preference) and to
              measure website traffic via tools like Google Analytics. These cookies help us
              understand which tools are most useful and how visitors navigate ToolCite Hub.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">
              Google AdSense & Consent
            </h2>
            <p>
              ToolCite Hub displays ads served by Google AdSense. Google may use cookies or device
              identifiers to show personalized or non-personalized ads.  
              Users in the EEA, UK, and Switzerland will see a consent banner (powered by Google’s
              Consent Management Platform) allowing ad-personalization control.  
              You can revisit or update your consent anytime by clearing your browser cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Third-Party Links</h2>
            <p>
              Our website may include links to external sites. ToolCite Hub is not responsible for the
              privacy practices or content of third-party websites. We encourage you to review their
              respective privacy policies before interacting with them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Data Security</h2>
            <p>
              We do not store personal data. However, all traffic is served securely over HTTPS using
              modern encryption. We also rely on trusted hosting platforms such as Vercel and Google
              Cloud, which maintain high security and compliance standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Your Rights</h2>
            <p>
              If you are located in the EEA, UK, or similar jurisdictions, you have the right to
              access, rectify, or request deletion of personal data (if any were collected). Since
              ToolCite Hub does not collect identifiable data, these rights are generally not
              applicable — but we remain open to questions or concerns at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Contact</h2>
            <p>
              For privacy inquiries or concerns, please contact us at{" "}
              <a
                href="mailto:support@toolcite.com"
                className="text-blue-400 underline hover:text-blue-300 transition-colors"
              >
                support@toolcite.com
              </a>
              .
            </p>
          </section>
        </div>

        {/* ===== Footer ===== */}
        <p className="text-sm text-gray-500 text-center mt-16">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </section>
    </main>
  );
}
