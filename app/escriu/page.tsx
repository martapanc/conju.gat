"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Practice from "@/components/Practice";
import { WithData } from "../providers";

function Drill() {
  const verb = useSearchParams().get("v");
  return (
    <WithData>
      {(data) => <Practice data={data} mode="escriu" initialVerb={verb} />}
    </WithData>
  );
}

export default function EscriuPage() {
  return (
    <Suspense fallback={<p className="empty">Carregant…</p>}>
      <Drill />
    </Suspense>
  );
}
