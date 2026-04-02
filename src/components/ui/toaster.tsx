"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      theme="light"
      richColors={false}
      toastOptions={{
        className: "border border-zinc-200 bg-white text-zinc-950",
      }}
    />
  );
}
