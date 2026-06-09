"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-[#151515] px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[rgba(239,68,68,0.12)] flex items-center justify-center text-2xl">
        ⚠️
      </div>
      <div>
        <h1 className="text-xl font-semibold text-white font-[family-name:var(--font-display)]">
          Something went wrong
        </h1>
        <p className="text-sm text-[#9CA3AF] mt-1 max-w-sm">
          An unexpected error occurred. You can try again — if it keeps
          happening, refresh the page.
        </p>
      </div>
      <Button
        onClick={reset}
        className="bg-[#8478D4] text-white hover:bg-[#9488e0]"
      >
        Try again
      </Button>
    </div>
  );
}
