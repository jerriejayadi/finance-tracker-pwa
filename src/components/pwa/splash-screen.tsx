import { cn } from "@/lib/utils";

const SPLASH_SEEN_ATTR = "data-splash-seen";
const SPLASH_SESSION_KEY = "ft-splash";

/**
 * Inline <head> script: marks <html> when the splash already played in this
 * session so it's hidden before first paint (tab switches / reloads skip it).
 */
export const splashInitScript = `(function(){try{var s=sessionStorage;if(s.getItem("${SPLASH_SESSION_KEY}")){document.documentElement.setAttribute("${SPLASH_SEEN_ATTR}","")}else{s.setItem("${SPLASH_SESSION_KEY}","1")}}catch(e){}})()`;

/**
 * Cold-start splash. Pure CSS so it paints with the static HTML, before
 * hydration: the in/out mark assembles (income pill, then expense pill
 * "balancing" into place), the wordmark rises, then the overlay fades out.
 * Stays `visible` even while <body> is hidden for a pending locale.
 */
export function SplashScreen() {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-bg-0 animate-splash-out visible fixed inset-0 z-100 flex flex-col items-center justify-center motion-reduce:hidden",
        "[html[data-splash-seen]_&]:hidden",
      )}
    >
      <div className="bg-brand animate-splash-glow pointer-events-none absolute h-72 w-72 rounded-full blur-3xl" />

      <div className="relative flex flex-col items-center gap-5">
        <svg
          width={88}
          height={88}
          viewBox="0 0 44 44"
          fill="none"
          className="animate-splash-tile overflow-visible"
        >
          <rect width="44" height="44" rx="10" className="fill-brand" />
          <rect
            x="10"
            y="12"
            width="24"
            height="8"
            rx="4"
            className="fill-brand-ink animate-splash-in transform-fill origin-left"
          />
          <rect
            x="10"
            y="24"
            width="15"
            height="8"
            rx="4"
            fillOpacity={0.45}
            className="fill-brand-ink animate-splash-balance transform-fill origin-left"
          />
        </svg>

        <div className="flex flex-col items-center gap-2">
          <span className="animate-splash-rise text-fg-0 text-[22px] font-semibold tracking-[-0.02em]">
            FinTrack
          </span>
          <span className="ft-num animate-splash-rise-late text-fg-2 flex items-center gap-3 text-[12px]">
            <span className="text-pos">+ in</span>
            <span className="bg-fg-3 h-1 w-1 rounded-full" />
            <span className="text-neg">− out</span>
          </span>
        </div>
      </div>
    </div>
  );
}
