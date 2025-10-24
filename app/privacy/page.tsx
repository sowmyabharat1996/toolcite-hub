export const dynamic = "force-static";
export default function Privacy(){
return (
<div className="container" style={{maxWidth:800}}>
<h1>Privacy Policy</h1>
<p>Effective: {new Date().toLocaleDateString()}</p>
<p>ToolCite uses cookies and may show Google AdSense ads. See Google Ads Settings to manage personalization.</p>
<h2>Data</h2><ul><li>Usage analytics</li><li>IP/logs for security</li></ul>
<h2>Contact</h2><p>contact@toolcite.com</p>
</div>
);
}