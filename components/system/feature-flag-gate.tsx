"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getFeatureFlags } from "@/lib/local-state";
import type { FeatureFlagKey } from "@/lib/feature-flags";

export function FeatureFlagGate({ flag, children, fallback = null }: { flag: FeatureFlagKey; children: ReactNode; fallback?: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function refresh() {
      setEnabled(getFeatureFlags()[flag]);
    }

    refresh();
    window.addEventListener("meaningful-routes-local-state", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [flag]);

  return enabled ? children : fallback;
}
