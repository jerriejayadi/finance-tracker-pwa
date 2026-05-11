"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        className:
          "!bg-bg-1 !border !border-line !text-fg-0 !text-[13px] !font-sans !shadow-md",
      }}
    />
  );
}
