"use client";

import { Button } from "@/components/ui/Button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyOrderIdButton({ orderId }: { orderId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      iconLeft={
        copied ? (
          <Check className="h-3.5 w-3.5 text-brand-600" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        )
      }
      className="font-mono text-xs"
    >
      {copied ? "Copied" : `Copy #${orderId}`}
    </Button>
  );
}
