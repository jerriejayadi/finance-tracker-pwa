import { enUS, id } from "date-fns/locale";
import type { Locale as DateLocale } from "date-fns";

const dateLocaleMap: Record<string, DateLocale> = {
  en: enUS,
  id: id,
};

export function getDateLocale(locale: string): DateLocale {
  return dateLocaleMap[locale] ?? enUS;
}
