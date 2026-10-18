"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Standard mounted flag for hydration. */
import { useEffect, useState } from "react";

/** Avoids hydration mismatches for UI that depends on browser-only APIs. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
