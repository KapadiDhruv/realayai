// Shared source of truth for the visitor's analytics consent choice.
//
// The key here must match the one hardcoded in the inline consent-default
// script in components/GoogleAnalytics.tsx — that script runs before any
// React code (and before gtag.js loads) so it can set Google Consent Mode's
// default state synchronously, and it reads localStorage directly rather
// than importing this module.
export const CONSENT_STORAGE_KEY = 'relayai_consent'

export type ConsentChoice = 'granted' | 'denied'

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function storeConsent(choice: ConsentChoice) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice)
  } catch {
    // Storage may be unavailable (private mode, disabled storage) — the
    // banner will just reappear next visit, which is an acceptable fallback.
  }
}
