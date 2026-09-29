"use client";

import * as React from "react";

const DEFAULT_DELAY = 500;
/** Finger travel (px) that counts as a scroll rather than a hold. */
const MOVE_TOLERANCE = 10;

/**
 * Pointer handlers that fire `onLongPress` after holding for `delay` ms.
 * Moving past a small tolerance (i.e. scrolling) cancels the hold, and the
 * click that follows a completed long press is swallowed so it doesn't also
 * count as a tap.
 */
export function useLongPress(
  onLongPress: () => void,
  { delay = DEFAULT_DELAY }: { delay?: number } = {},
) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = React.useRef<{ x: number; y: number } | null>(null);
  const fired = React.useRef(false);

  const cancel = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }, []);

  React.useEffect(() => cancel, [cancel]);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        fired.current = true;
        timer.current = null;
        navigator.vibrate?.(10);
        onLongPress();
      }, delay);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    // Android opens the context menu on hold; that's our gesture now
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClickCapture: (e: React.MouseEvent) => {
      if (!fired.current) return;
      fired.current = false;
      e.stopPropagation();
      e.preventDefault();
    },
  };
}
