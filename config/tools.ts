export type Tool = { slug: string; title: string; emoji: string; href: string; category: string; kind: "proxy"|"native" };
export const tools: Tool[] = [
{ slug: "weather", title: "Weather", emoji: "🌤", href: "/weather", category: "Weather", kind: "proxy" },
{ slug: "percentage", title: "Percentage Calculator", emoji: "➗", href: "/native/percentage", category: "Math", kind: "native" }
// Add more: speed/emi/bmi etc.
];