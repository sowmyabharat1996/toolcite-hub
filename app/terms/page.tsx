export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#0b0b0b] to-[#121212] text-gray-200 py-16 px-6">
      <section className="max-w-4xl mx-auto">
        {/* ===== Header ===== */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Terms of Use
        </h1>

        <p className="text-gray-400 text-center text-lg leading-relaxed mb-12">
          Welcome to <span className="text-blue-400 font-semibold">ToolCite Hub</span>.  
          By using our site, you agree to follow these Terms of Use.  
          Please read them carefully — if you disagree with any part,  
          kindly refrain from using the website.
        </p>

        {/* ===== Sections ===== */}
        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Use of Website</h2>
            <p>
              ToolCite Hub offers a growing collection of free, browser-based tools designed for
              everyday productivity. You agree to use these tools responsibly, for lawful purposes,
              and without attempting to disrupt, misuse, or exploit the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Intellectual Property</h2>
            <p>
              All content, design elements, branding, and code are the property of ToolCite Hub unless
              otherwise stated. You may not copy, modify, distribute, or republish any part of this
              website without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Disclaimer</h2>
            <p>
              All tools are provided <em>“as is”</em> without any warranties, express or implied.
              ToolCite Hub makes no guarantees about the accuracy, reliability, or suitability of
              tools for any particular purpose. Use at your own discretion and risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Privacy & Cookies</h2>
            <p>
              ToolCite Hub uses cookies and similar technologies to operate and improve this website.
              Google AdSense may deliver ads, and users in the EEA, UK, and Switzerland will see a
              consent banner managed by Google’s CMP.  
              You may change your preferences anytime by clearing cookies or revisiting the banner.  
              For more details, please review our{" "}
              <a
                href="/privacy"
                className="text-blue-400 underline hover:text-blue-300 transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-blue-400 mb-2">Contact</h2>
            <p>
              For any questions regarding these terms, please contact us at{" "}
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
