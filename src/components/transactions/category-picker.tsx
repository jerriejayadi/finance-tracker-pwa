"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, LayoutGrid, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Quick grid is 2 rows of 4; when there are more categories, the last slot is "More". */
const QUICK_SLOTS = 8;

type PickerCategory = { id: string; name: string; icon: string };

/* ------------------------------------------------------------------ */
/*  Tile                                                               */
/* ------------------------------------------------------------------ */

function CategoryTile({
  selected,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "h-16 min-w-0 px-1 border rounded-md flex flex-col items-center justify-center gap-1 cursor-pointer text-[11px] transition-colors",
        selected
          ? "border-brand bg-brand-soft text-brand"
          : "border-line bg-bg-2 text-fg-1 hover:bg-bg-3",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function CategoryTileIcon({ children }: { children: React.ReactNode }) {
  return <span className="text-[18px] leading-none">{children}</span>;
}

function CategoryTileLabel({ children }: { children: React.ReactNode }) {
  return <span className="w-full truncate text-center leading-tight">{children}</span>;
}

CategoryTile.Icon = CategoryTileIcon;
CategoryTile.Label = CategoryTileLabel;

/* ------------------------------------------------------------------ */
/*  Quick grid (main view)                                             */
/* ------------------------------------------------------------------ */

/**
 * Compact 2-row grid of the top categories (callers pass them pre-ranked).
 * The selected category is always visible, even when it isn't in the top slots.
 */
function CategoryQuickGrid({
  categories,
  value,
  onChange,
  onMore,
}: {
  categories: PickerCategory[];
  value: string;
  onChange: (id: string) => void;
  onMore: () => void;
}) {
  const t = useTranslations("transaction");
  const hasMore = categories.length > QUICK_SLOTS;

  const visible = React.useMemo(() => {
    if (!hasMore) return categories;
    const top = categories.slice(0, QUICK_SLOTS - 1);
    if (top.some((c) => c.id === value)) return top;
    const selected = categories.find((c) => c.id === value);
    return selected ? [...top.slice(0, -1), selected] : top;
  }, [categories, value, hasMore]);

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {visible.map((c) => (
        <CategoryTile key={c.id} selected={value === c.id} onClick={() => onChange(c.id)}>
          <CategoryTile.Icon>{c.icon}</CategoryTile.Icon>
          <CategoryTile.Label>{c.name}</CategoryTile.Label>
        </CategoryTile>
      ))}
      {hasMore && (
        <CategoryTile onClick={onMore} className="border-dashed bg-transparent">
          <CategoryTile.Icon>
            <LayoutGrid size={18} strokeWidth={1.75} />
          </CategoryTile.Icon>
          <CategoryTile.Label>
            {t("moreCategories")} · {categories.length}
          </CategoryTile.Label>
        </CategoryTile>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Full picker view (searchable)                                      */
/* ------------------------------------------------------------------ */

function CategoryPickerView({
  categories,
  value,
  onSelect,
  onBack,
}: {
  categories: PickerCategory[];
  value: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const t = useTranslations("transaction");
  const [search, setSearch] = React.useState("");
  const query = search.trim().toLowerCase();
  const filtered = query
    ? categories.filter((c) => c.name.toLowerCase().includes(query))
    : categories;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 px-5">
        <Button
          variant="secondary"
          size="icon"
          onClick={onBack}
          className="w-8 h-8 rounded-full text-fg-1"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </Button>
        <h3 className="text-[17px] font-semibold tracking-[-0.005em]">
          {t("selectCategory")}
        </h3>
        <div className="w-8" />
      </div>

      <div className="overflow-y-auto flex-1 px-5 pb-6">
        {/* Search */}
        <div className="mb-3">
          <Input
            icon={<Search size={16} strokeWidth={1.75} />}
            placeholder={t("searchCategories")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 bg-bg-0"
          />
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {filtered.map((c) => (
              <CategoryTile
                key={c.id}
                selected={value === c.id}
                onClick={() => {
                  onSelect(c.id);
                  onBack();
                }}
              >
                <CategoryTile.Icon>{c.icon}</CategoryTile.Icon>
                <CategoryTile.Label>{c.name}</CategoryTile.Label>
              </CategoryTile>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-[13px] text-fg-2">
            {t("noCategoriesFound")}
          </p>
        )}
      </div>
    </>
  );
}

export { CategoryTile, CategoryQuickGrid, CategoryPickerView };
