// If you later switch logic to a remote API, this module changes, UI stays same.
import { calcPercentage, PercentMode } from "./logic";
export type PercentInput = { mode: PercentMode; base: number; value: number };
export function computePercent(i: PercentInput){ return calcPercentage(i); }