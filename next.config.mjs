/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // You can remove this once everything compiles cleanly.
  // It only disables css optimizer to reduce LightningCSS noise during setup.
  experimental: { optimizeCss: false },
};


export default nextConfig;
