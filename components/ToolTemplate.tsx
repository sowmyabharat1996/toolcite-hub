import AdUnit from "./AdUnit";
export default function ToolTemplate({
title, subtitle, children, footer
}:{ title:string; subtitle?:string; children:React.ReactNode; footer?:React.ReactNode }){
return (
<div className="container">
<header className="header">
<h1 className="title">{title}</h1>
{subtitle && <p className="sub">{subtitle}</p>}
</header>
<div style={{maxWidth:820, margin:"0 auto 16px"}}><AdUnit/></div>
<section className="card" style={{maxWidth:820, margin:"0 auto"}}>
{children}
</section>
<div style={{maxWidth:820, margin:"16px auto"}}><AdUnit/></div>
<footer className="footer">{footer ?? <>© {new Date().getFullYear()} ToolCite.com</>}</footer>
</div>
);
}