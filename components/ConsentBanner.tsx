'use client'

import { useEffect, useState } from 'react'
import { isAnalyticsEnabled, updateConsent } from '@/lib/analytics'
import { getStoredConsent, storeConsent, type ConsentChoice } from '@/lib/consent'

// Renders nothing on the server and on first client render (so there's no
// hydration mismatch), then reveals itself only if the visitor hasn't made a
// choice yet. GA4 already defaults to consent-denied (see GoogleAnalytics.tsx)
// so there is no window where analytics runs before this decides anything.
export function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isAnalyticsEnabled) return
    if (getStoredConsent() === null) setVisible(true)
  }, [])

  if (!isAnalyticsEnabled || !visible) return null

  function choose(choice: ConsentChoice) {
    storeConsent(choice)
    updateConsent(choice)
    setVisible(false)
  }

  return (
    <div className="consent-banner" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <p>
        We use Google Analytics to understand site traffic. No personal data is sold, and nothing is
        tracked until you accept.
      </p>
      <div className="consent-banner-actions">
        <button className="button button-outline" onClick={() => choose('denied')}>
          Reject
        </button>
        <button className="button button-dark" onClick={() => choose('granted')}>
          Accept
        </button>
      </div>
    </div>
  )
}
