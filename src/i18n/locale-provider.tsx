"use client";

import * as React from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import id from "@/messages/id.json";
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from "./config";

// Locale is resolved in the browser (from the NEXT_LOCALE cookie) instead of on
// the server, so the root layout doesn't read cookies and pages can be
// prerendered as static — which lets <Link> prefetch them fully.

const MESSAGES = { en, id } satisfies Record<Locale, typeof en>;

export const LOCALE_PENDING_ATTR = "data-locale-pending";

function readCookieLocale(): Locale {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

function writeCookieLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const noopSubscribe = () => () => {};
const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const SetLocaleContext = React.createContext<(locale: Locale) => void>(() => {});

export const useSetLocale = () => React.useContext(SetLocaleContext);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Server snapshot is the default locale; after hydration React re-renders
  // with the cookie value if it differs.
  const locale = React.useSyncExternalStore(subscribe, readCookieLocale, () => defaultLocale);
  const timeZone = React.useSyncExternalStore(noopSubscribe, getBrowserTimeZone, () => "UTC");

  const setLocale = React.useCallback((next: Locale) => {
    writeCookieLocale(next);
    listeners.forEach((l) => l());
  }, []);

  React.useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    // Only reveal once the rendered locale matches the cookie, so non-default
    // locale users never see a flash of default-locale text.
    if (locale === readCookieLocale()) root.removeAttribute(LOCALE_PENDING_ATTR);
  }, [locale]);

  return (
    <SetLocaleContext.Provider value={setLocale}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    </SetLocaleContext.Provider>
  );
}

/**
 * Inline <head> script: runs before first paint and hides the page when the
 * cookie locale isn't the default one, until LocaleProvider has switched.
 * Auto-reveals after 3s as a safety net if JS fails to hydrate.
 */
export const localeInitScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]*)/);var l=m&&m[1];if(l&&l!=="${defaultLocale}"&&${JSON.stringify(locales)}.indexOf(l)>-1){var d=document.documentElement;d.setAttribute("${LOCALE_PENDING_ATTR}","");d.lang=l;setTimeout(function(){d.removeAttribute("${LOCALE_PENDING_ATTR}")},3000)}}catch(e){}})()`;
