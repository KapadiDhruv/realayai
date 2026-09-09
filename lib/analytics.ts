// Thin, privacy-conscious wrapper around GA4's gtag.js.
//
// Never pass PII (email, name, phone, address, tokens, form contents) as
// event params here — GA4 event params are visible in Google's reporting
// UI and exports. Send identifiers/categories/labels only.

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// GA4 loads only in production builds and only when the measurement ID is
// configured, so local development never sends real traffic to GA.
export const isAnalyticsEnabled = Boolean(GA_MEASUREMENT_ID) && process.env.NODE_ENV === 'production'

type GtagEventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

// Pushes straight to `dataLayer` (the same thing the standard gtag.js snippet's
// own `function gtag(){dataLayer.push(arguments)}` shim does) instead of
// calling `window.gtag` directly. This means calls made before gtag.js has
// finished loading — notably the consent default set from GoogleAnalytics.tsx,
// and any consent update a visitor triggers in that window — are queued
// correctly rather than silently dropped.
function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
}

// Query params that are safe (and useful) to report to GA4. Anything not on
// this list is stripped before the URL is sent, so a token, code, or other
// sensitive value that ends up in the query string never reaches GA4.
const ALLOWED_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'gbraid',
  'wbraid',
  'msclkid',
])

function buildSafePageLocation(pathname: string, searchParams?: URLSearchParams): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const filtered = new URLSearchParams()
  searchParams?.forEach((value, key) => {
    if (ALLOWED_QUERY_PARAMS.has(key)) filtered.set(key, value)
  })
  const query = filtered.toString()
  return `${origin}${pathname}${query ? `?${query}` : ''}`
}

/**
 * Sends a GA4 page_view for the given route. Called on load and on
 * client-side navigation.
 *
 * Explicitly sets `page_location`/`page_title` (the real GA4 automatically-
 * collected fields — GA4 has no "page_path" parameter, that's a Universal
 * Analytics concept) rather than letting gtag.js read the raw
 * `window.location`, so unlisted query params (tokens, emails, etc.) never
 * reach GA4 even if they appear in the URL.
 */
export function pageview(pathname: string, searchParams?: URLSearchParams) {
  if (!isAnalyticsEnabled) return
  try {
    gtag('event', 'page_view', {
      page_location: buildSafePageLocation(pathname, searchParams),
      page_title: typeof document !== 'undefined' ? document.title : undefined,
    })
  } catch {
    // Analytics must never break the app.
  }
}

/**
 * Sends a custom GA4 event.
 *
 * trackEvent("cta_click", { button_name: "Get Started", location: "hero" })
 *
 * Do not include personally identifiable information in `params` — no
 * emails, names, phone numbers, addresses, tokens, or raw form contents.
 */
export function trackEvent(eventName: string, params?: GtagEventParams) {
  if (!isAnalyticsEnabled) return
  try {
    gtag('event', eventName, params)
  } catch {
    // Analytics must never break the app.
  }
}

/**
 * Reusable outbound-link click handler. Attach to any external <a> to
 * report the destination without leaking query strings that might carry
 * sensitive data.
 *
 * <a href={url} onClick={() => trackOutboundClick(url)}>
 */
export function trackOutboundClick(url: string) {
  try {
    const { origin, pathname } = new URL(url)
    trackEvent('outbound_click', { url: origin + pathname })
  } catch {
    // Not a valid absolute URL — skip rather than send something unreliable.
  }
}
