"use client";

import { useState, useSyncExternalStore } from "react";

let cached: "buy" | "preorder" | null = null;
let listeners: (() => void)[] = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): "buy" | "preorder" {
  return cached || "buy";
}

function getServerSnapshot(): "buy" | "preorder" {
  return "buy";
}

function fetchBuyMode() {
  fetch("/api/admin/settings")
    .then((r) => r.json())
    .then((s) => {
      cached = s.buy_button_mode === "preorder" ? "preorder" : "buy";
      listeners.forEach((l) => l());
    })
    .catch(() => {});
}

// Fetch once on module load
if (typeof window !== "undefined") {
  fetchBuyMode();
}

export function useBuyMode(): "buy" | "preorder" {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}