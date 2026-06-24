import { useEffect, useState } from "react";

let cached: "buy" | "preorder" | null = null;

export function useBuyMode(): "buy" | "preorder" {
  const [mode, setMode] = useState<"buy" | "preorder">(cached || "buy");

  useEffect(() => {
    if (cached) { setMode(cached); return; }
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((s) => {
        const m = s.buy_button_mode === "preorder" ? "preorder" : "buy";
        cached = m;
        setMode(m);
      })
      .catch(() => {});
  }, []);

  return mode;
}
