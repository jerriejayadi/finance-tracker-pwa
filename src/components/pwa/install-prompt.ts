"use client";

import { useSyncExternalStore } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

/**
 * - `prompt`: browser fired `beforeinstallprompt`; we can show the native dialog
 * - `ios`: iOS Safari has no install API; user must use Share → Add to Home Screen
 * - `installed`: already running as an installed app
 * - `unavailable`: not installable right now (unsupported browser, criteria unmet)
 */
export type InstallState = "prompt" | "ios" | "installed" | "unavailable";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS reports itself as Mac
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Call once, as early as possible (root layout), so the event isn't missed. */
export function initInstallPrompt() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    // Suppress Chrome's mini-infobar; we show our own entry point instead.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    emit();
  });
}

function getSnapshot(): InstallState {
  if (installed || isStandalone()) return "installed";
  if (deferredPrompt) return "prompt";
  if (isIos()) return "ios";
  return "unavailable";
}

function getServerSnapshot(): InstallState {
  return "unavailable";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shows the native install dialog. The event is single-use, so it is cleared afterwards. */
export async function promptInstall() {
  if (!deferredPrompt) return "unavailable" as const;
  const event = deferredPrompt;
  deferredPrompt = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  emit();
  return outcome;
}

export function useInstallPrompt() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
