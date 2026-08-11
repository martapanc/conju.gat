"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Pages render their content only once the verbs have loaded, so the document
 * is short at navigation time and the browser keeps the previous scroll
 * offset. Reset it explicitly on every route change.
 */
export default function ScrollTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
