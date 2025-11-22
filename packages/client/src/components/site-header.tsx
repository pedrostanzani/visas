"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <Link href="/">
      <h1
        className={cn(
          "font-black tracking-tighter uppercase",
          isHome ? "text-3xl" : "text-2xl"
        )}
      >
        Do I need a Visa?
      </h1>
    </Link>
  );
}

