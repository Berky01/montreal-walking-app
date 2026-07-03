import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { areAdminToolsEnabled } from "@/lib/admin/access";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (!areAdminToolsEnabled()) {
    notFound();
  }

  return children;
}
