// types/react-dom-shim.d.ts
import type * as React from "react";

declare module "react-dom" {
  export function createPortal(
    children: React.ReactNode,
    container: Element | DocumentFragment
  ): React.ReactPortal;
}

