"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

/**
 * Bottom-sheet confirmation for destructive or irreversible actions.
 *
 * <ConfirmDrawer open={open} onOpenChange={setOpen}>
 *   <ConfirmDrawer.Icon><Trash2 /></ConfirmDrawer.Icon>
 *   <ConfirmDrawer.Title>Delete transaction?</ConfirmDrawer.Title>
 *   <ConfirmDrawer.Description>This can't be undone.</ConfirmDrawer.Description>
 *   <ConfirmDrawer.Footer>
 *     <ConfirmDrawer.Cancel>Cancel</ConfirmDrawer.Cancel>
 *     <Button variant="danger" onClick={onConfirm}>Delete</Button>
 *   </ConfirmDrawer.Footer>
 * </ConfirmDrawer>
 */
function ConfirmDrawer({
  open,
  onOpenChange,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className={cn("flex flex-col items-center text-center px-5 pt-2 pb-6", className)}>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ConfirmDrawerIcon({
  variant = "danger",
  children,
}: {
  variant?: "danger" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center mb-3",
        variant === "danger" ? "bg-neg-soft text-neg" : "bg-bg-2 text-fg-1",
      )}
    >
      {children}
    </div>
  );
}

function ConfirmDrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerTitle>) {
  return <DrawerTitle className={cn("mb-1.5", className)} {...props} />;
}

function ConfirmDrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerDescription>) {
  return (
    <DrawerDescription
      className={cn("text-[13px] leading-relaxed max-w-75", className)}
      {...props}
    />
  );
}

/** Free slot for a preview of what's being confirmed (e.g. the affected item). */
function ConfirmDrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full mt-4", className)} {...props} />;
}

function ConfirmDrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid grid-cols-[1fr_2fr] gap-2 w-full mt-6", className)} {...props} />;
}

function ConfirmDrawerCancel({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <DrawerClose asChild>
      <Button variant="secondary" {...props}>
        {children}
      </Button>
    </DrawerClose>
  );
}

ConfirmDrawer.Icon = ConfirmDrawerIcon;
ConfirmDrawer.Title = ConfirmDrawerTitle;
ConfirmDrawer.Description = ConfirmDrawerDescription;
ConfirmDrawer.Body = ConfirmDrawerBody;
ConfirmDrawer.Footer = ConfirmDrawerFooter;
ConfirmDrawer.Cancel = ConfirmDrawerCancel;

export { ConfirmDrawer };
