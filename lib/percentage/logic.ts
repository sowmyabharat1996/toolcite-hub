export type PercentMode = "of" | "increase" | "decrease";
export function calcPercentage({mode, base, value}:{mode:PercentMode;base:number;value:number}){
if(mode==="of") return (base*value)/100; // X% of base
if(mode==="increase") return base + (base*value)/100; // base + X%
return base - (base*value)/100; // base - X%
}