// lib/core/guard.ts (tiny helpers – input validation, etc.)
export const clamp = (n:number, min:number, max:number)=> Math.max(min, Math.min(max, n));
export const isNumber = (v:unknown): v is number => typeof v === "number" && !Number.isNaN(v);