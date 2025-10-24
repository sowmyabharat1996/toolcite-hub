"use client";
import { useEffect } from "react";
export default function AdUnit(){
useEffect(()=>{ try{(window as any).adsbygoogle=(window as any).adsbygoogle||[]; (window as any).adsbygoogle.push({});}catch{} },[]);
return (
<ins className="adsbygoogle" style={{display:"block",minHeight:90}}
data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // replace
data-ad-slot="0000000000" // replace
data-ad-format="auto" data-full-width-responsive="true" />
);
}