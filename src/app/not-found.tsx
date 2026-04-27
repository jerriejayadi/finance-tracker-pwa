import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Illustrated empty state */}
      <div className="relative mb-8">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-brand-soft blur-[28px] scale-125 pointer-events-none" />

        {/* Concentric rings */}
        <div className="relative w-[180px] h-[180px]">
          <div className="absolute inset-0 rounded-full border border-line-soft" />
          <div className="absolute inset-4 rounded-full border border-line" />
          <div className="absolute inset-9 rounded-full border border-line border-dashed opacity-40" />

          {/* Center card */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[88px] h-[88px] bg-bg-1 border border-line rounded-2xl flex flex-col items-center justify-center gap-1">
              <span className="font-mono text-[28px] font-semibold tracking-[-0.04em] text-brand">
                404
              </span>
              <div className="w-6 h-px bg-line" />
            </div>
          </div>

          {/* Floating chips */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-bg-1 border border-line rounded-full px-2.5 py-1 text-[10px] text-fg-2 whitespace-nowrap">
            route not found
          </div>
          <div className="absolute bottom-2 -right-3 bg-bg-1 border border-line rounded-full px-2 py-1 text-[10px] text-fg-3 font-mono">
            ¯\_(ツ)_/¯
          </div>
        </div>
      </div>

      {/* Copy */}
      <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-fg-0">
        Page not found
      </h1>
      <p className="text-[14px] text-fg-2 leading-[1.5] mt-2 max-w-[28ch]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Actions */}
      <div className="flex gap-2.5 mt-8 w-full max-w-[280px]">
        <Link
          href="/"
          className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-sm bg-transparent text-fg-0 border border-line text-[15px] font-medium hover:bg-bg-1 transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back
        </Link>
        <Link
          href="/"
          className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-sm bg-brand text-brand-ink border border-transparent text-[15px] font-medium hover:bg-brand-hi transition-colors"
        >
          <Home size={16} strokeWidth={1.75} />
          Home
        </Link>
      </div>
    </div>
  );
}
