'use client'

import Script from 'next/script'
import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { GA_MEASUREMENT_ID, isAnalyticsEnabled, pageview } from '@/lib/analytics'

// Watches route changes and reports a GA4 page_view for each one, including
// the initial load. Automatic gtag "Enhanced Measurement" page_view tracking
// is disabled in config below (send_page_view: false) so this is the single
// source of truth and the initial view is never double-counted.
function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.toString()

  useEffect(() => {
    if (!isAnalyticsEnabled) return
    pageview(pathname, new URLSearchParams(query))
    // `query` (a string) is the dependency, not `searchParams` (an object),
    // so this can't re-fire on an incidental re-render that leaves the
    // actual search params unchanged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, query])

  return null
}

export function GoogleAnalytics() {
  if (!isAnalyticsEnabled) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
      {/* useSearchParams requires a Suspense boundary in the app router */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}
