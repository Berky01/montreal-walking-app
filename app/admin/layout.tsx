import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (process.env.ENABLE_ADMIN_TOOLS !== "true") {
    notFound();
  }

  return children;
}
