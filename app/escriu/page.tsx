"use client";

import Practice from "@/components/Practice";
import { WithData } from "../providers";

export default function EscriuPage() {
  return <WithData>{(data) => <Practice data={data} mode="escriu" />}</WithData>;
}
