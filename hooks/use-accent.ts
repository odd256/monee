"use client";

/* eslint-disable react-hooks/set-state-in-effect -- localStorage is browser-only; sync after hydration. */
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_ACCENT,
  applyAccent,
  readAccent,
  type AccentId,
} from "@/lib/theme/accent";

export function useAccent() {
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);

  useEffect(() => {
    setAccentState(readAccent());
  }, []);

  const setAccent = useCallback((id: AccentId) => {
    applyAccent(id);
    setAccentState(id);
  }, []);

  return { accent, setAccent };
}
