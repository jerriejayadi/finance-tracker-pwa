"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  searchCurrencies,
  type Currency,
} from "@/lib/currencies";
import { useUpdateProfile } from "@/services/profile/profile.hooks";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrencyPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCurrency: string;
}

export function CurrencyPickerDrawer({
  open,
  onOpenChange,
  currentCurrency,
}: CurrencyPickerDrawerProps) {
  const [query, setQuery] = React.useState("");
  const updateProfile = useUpdateProfile();

  const { popular, all } = searchCurrencies(query);

  const handleSelect = (code: string) => {
    updateProfile.mutate(
      { currency_preference: code },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  // Reset search when drawer closes
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-0">
          <DrawerTitle className="text-center">Currency</DrawerTitle>
          <DrawerDescription className="sr-only">
            Select your preferred currency
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-5 pb-8 pt-4">
          {/* Search */}
          <Input
            type="text"
            placeholder="Search currencies..."
            icon={<Search size={16} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="!h-11"
          />

          {/* Popular chips */}
          {popular.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {popular.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  disabled={updateProfile.isPending}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
                    currentCurrency === c.code
                      ? "border-brand/30 bg-brand-soft text-brand"
                      : "border-line bg-bg-1 text-fg-0 hover:bg-bg-2"
                  )}
                >
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                  {currentCurrency === c.code && (
                    <Check size={12} strokeWidth={2.5} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-line" />

          {/* Full list */}
          <div className="flex flex-col overflow-y-auto max-h-[40vh] -mx-5">
            {all.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-fg-2">
                No currencies found
              </div>
            ) : (
              all.map((c) => (
                <CurrencyRow
                  key={c.code}
                  currency={c}
                  selected={currentCurrency === c.code}
                  onSelect={handleSelect}
                  disabled={updateProfile.isPending}
                />
              ))
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CurrencyRow({
  currency,
  selected,
  onSelect,
  disabled,
}: {
  currency: Currency;
  selected: boolean;
  onSelect: (code: string) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(currency.code)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 px-5 py-3 transition-colors cursor-pointer",
        selected ? "bg-brand-soft" : "hover:bg-bg-1"
      )}
    >
      <span className="text-[18px]">{currency.flag}</span>
      <div className="flex-1 text-left">
        <div className="text-[14px] font-medium text-fg-0">
          {currency.name}
        </div>
        <div className="text-[12px] font-mono text-fg-2">
          {currency.code} · {currency.symbol}
        </div>
      </div>
      {selected && (
        <Check size={16} strokeWidth={2.5} className="text-brand" />
      )}
    </button>
  );
}
