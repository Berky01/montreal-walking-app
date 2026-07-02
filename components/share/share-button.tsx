"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareButton({
  text,
  title,
  url,
  variant = "secondary"
}: {
  text?: string;
  title: string;
  url?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(Boolean(navigator.share));
  }, []);

  async function share() {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    setCopied(false);
    setShared(false);

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      return;
    }
  }

  return (
    <Button onClick={share} type="button" variant={variant}>
      {copied || shared ? <Check aria-hidden="true" size={17} /> : canNativeShare ? <Share2 aria-hidden="true" size={17} /> : <Copy aria-hidden="true" size={17} />}
      {shared ? "Shared" : copied ? "Copied" : "Share"}
    </Button>
  );
}
