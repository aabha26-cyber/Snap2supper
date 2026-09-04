"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-3xl border border-tomato/30 bg-tomato/8 px-4 py-3 text-sm"
      role="alert"
    >
      <p className="flex items-start gap-2 text-ink">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-tomato" />
        <span>{message}</span>
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-fit rounded-full border-tomato/40"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

export function LoadingNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin text-leaf" />
      {children}
    </p>
  );
}
