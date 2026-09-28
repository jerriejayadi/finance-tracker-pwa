"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function BulkImportButton({ className }: { className?: string }) {
  const tDash = useTranslations("dashboard");
  return (
    <Link
      href="/import"
      className={cn(
        "bg-bg-1 border-line text-fg-0 hover:bg-bg-2 flex h-11 items-center justify-center gap-2 rounded-sm border text-[13px] font-medium transition-colors",
        className,
      )}
    >
      <Upload size={16} strokeWidth={1.75} className="text-brand" />
      {tDash("bulkImport")}
    </Link>
  );
}
