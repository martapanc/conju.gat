"use client";

import Practice from "@/components/Practice";
import { WithData } from "../providers";

export default function DiguesPage() {
  return <WithData>{(data) => <Practice data={data} mode="diu" />}</WithData>;
}
