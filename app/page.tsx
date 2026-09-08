'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { trackEvent } from '@/lib/analytics'

const services = ['ChatGPT', 'Claude', 'Gemini', 'GitHub Copilot', 'Cursor', 'Other']

const faqs = [
  ['What exactly is RelayAI?', 'RelayAI is a marketplace concept for flexible, time-limited access to premium AI tools. It is designed to help occasional users avoid a full monthly commitment while helping subscribers make better use of unused capacity.'],
  ['Can owners choose when their plan is available?', 'Yes. Owners choose the exact days, date range, or recurring window in a month when other people can use eligible unused access. You stay in control, can block dates around your own work, and can pause or stop availability at any time.'],
  ['Do I need to buy a full subscription?', 'No. The marketplace is designed around temporary access options, with durations that could range from hours to days depending on the service and availability.'],
  ['Can I earn money if I already pay for AI subscriptions?', 'The owner side is designed to help eligible subscribers make unused access available and potentially recover part of their cost. Earnings are not guaranteed and would depend on demand, service rules, and availability.'],
  ['Am I guaranteed to recover part of my subscription cost?', "No. Recovering cost only happens if someone actually wants your unused access during your available window — think of it like renting out a spare room: you only earn when there's a tenant. If demand for a service is low, or nobody needs access on the days you've opened up, there's nothing to recover that period. The $4–8 example on this page is illustrative, not a promise."],
  ['Do I give my password to another person?', 'The intended model is controlled platform access rather than direct password exchange. We are designing around time-limited access, monitoring, and automatic expiry.'],
  ['Is this affiliated with OpenAI or Anthropic?', 'No. RelayAI is an independent marketplace concept and does not imply endorsement or affiliation with any AI provider unless explicitly stated.'],
  ['Is it available now?', 'Not yet. We are validating demand and building the early-access community before launching the marketplace.'],
]

const chapters = [
  {
    kicker: 'THE PROBLEM',
    title: "You're paying for AI even when you're not using it.",
    copy: 'Premium AI tools are becoming essential for developers, founders, students, researchers, and creators. But subscriptions are still built around fixed monthly billing — you pay for the whole month whether you touch it or not.',
  },
  {
    kicker: 'THE IDEA',
    title: 'Turn unused AI access into something useful.',
    copy: 'Occasional users get temporary access without a full subscription. Subscribers make their unused time available and recover part of what they already pay. One marketplace, both sides win.',
  },
  {
    kicker: 'HOW IT WORKS',
    title: 'Simple by design.',
    copy: 'Browse available AI services, pick a duration, and get controlled access for the period you paid for — no password exchange, no leftover access once the window closes.',
    steps: [
      ['01', 'Choose what you need', 'Browse available AI services and access durations.'],
      ['02', 'Set your availability', 'Owners choose the days or recurring window others can use. Pause anytime.'],
      ['03', 'Get controlled access', 'Access is provided for the purchased period, without direct password exchange.'],
      ['04', 'Use it. Return it.', 'When the period ends, access automatically expires.'],
    ],
  },
  {
    kicker: 'THE MATH',
    title: "A subscription doesn't have to be all-or-nothing.",
    copy: "Here's what it could look like using Claude Pro ($20/mo) as an example. Actual pricing and earnings would depend on the service and marketplace demand — like renting out a spare room, you only earn when someone actually wants it.",
    calc: true,
  },
]

function track(event: string, detail?: string) {
  trackEvent(event, detail ? { label: detail } : undefined)
}

function useScrollSpy(count: number) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = refs.current.indexOf(entry.target as HTMLDivElement)
            if (index !== -1) setActive(index)
          }
        })
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    )
    refs.current.slice(0, count).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [count])

  return { active, refs }
}

export default function Page() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedWindow, setSelectedWindow] = useState('Weekends')
  const [selectedDays, setSelectedDays] = useState<string[]>(['Sat', 'Sun'])
  const availabilityDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const { active: activeChapter, refs: chapterRefs } = useScrollSpy(chapters.length)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const form = event.currentTarget
    const data = new FormData(form)
    const email = String(data.get('email') ?? '').trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userType: data.get('userType'),
          availability: data.get('availability'),
          services: selectedServices,
          // Honeypot: left blank by real visitors, filled in by most bots.
          website: data.get('website'),
        }),
      })

      const result = await response.json().catch(() => null)

      if (response.ok && result?.success) {
        setSubmitted(true)
        trackEvent('form_submit', { form_name: 'waitlist' })
      } else {
        setFormError(result?.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setFormError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function scrollToWaitlist(source: string) {
    track('cta_click', source)
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" onClick={() => track('nav_logo')}>
          <span className="brand-mark">↗</span> RelayAI
        </a>
        <div className="nav-links">
          <a href="#story">The story</a>
          <a href="#sides">For you</a>
          <a href="#faq">FAQ</a>
        </div>
        <button className="button button-dark nav-cta" onClick={() => scrollToWaitlist('nav')}>
          Join waitlist <span>↗</span>
        </button>
      </nav>

      {/* PAGE 1 — HERO */}
      <section id="top" className="hero section-shell">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> Market validation · Early access</p>
          <h1>AI access, <em>when you need it.</em></h1>
          <p className="hero-lede">Get temporary access to premium AI tools without committing to a full month — or turn the unused time on subscriptions you already pay for into value.</p>
          <div className="hero-actions">
            <button className="button button-dark" onClick={() => scrollToWaitlist('hero')}>Join the waitlist <span>↗</span></button>
            <a className="text-link" href="#story" onClick={() => track('cta_click', 'hero_how')}>See how it works <span>↓</span></a>
          </div>
          <p className="microcopy">Free to join · No payment required · No credentials collected</p>
        </div>
        <div className="hero-visual" aria-label="Conceptual marketplace preview">
          <div className="visual-label">RELAYAI / ACCESS MARKETPLACE <span>CONCEPT</span></div>
          <div className="market-card owner-card">
            <div className="card-top"><span className="tiny-label">SUBSCRIPTION OWNER</span><span className="pill green">Using now</span></div>
            <div className="service-title"><span className="service-icon claude" aria-hidden="true">✳</span><div><strong>Claude Pro</strong><small>Monthly subscription</small></div></div>
            <div className="metric-row"><div><small>Monthly cost</small><strong>$20</strong></div><div><small>Used this month</small><strong>10 days</strong></div></div>
            <div className="progress"><span style={{ width: '42%' }} /></div>
            <small className="muted">20 days currently unused</small>
            <div className="owner-window"><small>Owner availability</small><strong>Weekends · 4 days</strong><span>Paused whenever needed</span></div>
          </div>
          <div className="relay-line"><span /><b>unused access</b><span /></div>
          <div className="market-card user-card">
            <div className="card-top"><span className="tiny-label">TEMPORARY USER</span><span className="pill orange">3 day access</span></div>
            <div className="service-title"><span className="service-icon claude" aria-hidden="true">✳</span><div><strong>Claude Pro</strong><small>Flexible access</small></div></div>
            <div className="price-row"><div><small>Pay only for what you need</small><strong>$3.99</strong></div><button className="mini-button" onClick={() => scrollToWaitlist('marketplace')}>Get early access ↗</button></div>
          </div>
          <div className="visual-foot"><span>subscription</span><span>→</span><span>temporary access</span><span>→</span><span>lower cost</span></div>
          <p className="visual-disclaimer">Example uses Claude Pro ($20/mo) for illustration. RelayAI is not affiliated with or endorsed by Anthropic.</p>
        </div>
      </section>

      {/* PAGE 2 — THE STORY (scrollytelling) */}
      <section id="story" className="section-shell story-section">
        <div className="story-rail">
          <div className="section-kicker">THE STORY</div>
          <ol className="story-index">
            {chapters.map((chapter, index) => (
              <li key={chapter.kicker} className={index === activeChapter ? 'active' : ''}>
                <span>{String(index + 1).padStart(2, '0')}</span>{chapter.kicker}
              </li>
            ))}
          </ol>
          <div className="story-progress" aria-hidden="true">
            <span style={{ height: `${((activeChapter + 1) / chapters.length) * 100}%` }} />
          </div>
        </div>
        <div className="story-chapters">
          {chapters.map((chapter, index) => (
            <div className="story-chapter" key={chapter.kicker} ref={(el) => { chapterRefs.current[index] = el }}>
              <span className="story-chapter-kicker">{chapter.kicker} / {String(index + 1).padStart(2, '0')}</span>
              <h2>{chapter.title}</h2>
              <p className="body-copy">{chapter.copy}</p>

              {chapter.steps && (
                <div className="steps-grid">
                  {chapter.steps.map(([num, title, copy]) => (
                    <div className="step" key={num}>
                      <span>{num}</span><h3>{title}</h3><p>{copy}</p>
                    </div>
                  ))}
                </div>
              )}

              {chapter.calc && (
                <div className="calculator">
                  <div className="calc-title-row">
                    <span className="service-icon claude small" aria-hidden="true">✳</span>
                    <div><strong>Claude Pro</strong><small>$20/mo · illustrative example</small></div>
                  </div>
                  <div className="calc-lines">
                    <div><span>Monthly subscription</span><b>$20</b></div>
                    <div><span>Owner uses</span><b>10 days</b></div>
                    <div><span>Unused period</span><b>20 days</b></div>
                    <div className="calc-total"><span>Potential recovered cost</span><b>$4–8<small> / example</small></b></div>
                  </div>
                  <p className="calc-demand-note">Only if someone actually rents that unused time — like a spare room, no tenant means no earnings.</p>
                  <button className="text-link" onClick={() => scrollToWaitlist('economics')}>Help shape the model ↗</button>
                  <p className="calc-disclaimer">Not a guarantee · not affiliated with or endorsed by Anthropic</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PAGE 3 — TWO SIDES */}
      <section id="sides" className="section-shell sides-section">
        <div className="section-kicker">TWO SIDES / BUILT FOR BOTH</div>
        <h2>Whichever side you're on, it works for you.</h2>
        <div className="audience-grid">
          <article id="users" className="audience-card user-audience">
            <span className="card-label">FOR PEOPLE WHO NEED AI</span>
            <h3>Only pay for the access you need.</h3>
            <ul><li>Lower upfront cost</li><li>Short-term access</li><li>Multiple AI services</li><li>No unnecessary monthly commitment</li></ul>
            <button className="button button-outline" onClick={() => scrollToWaitlist('user_audience')}>Join as a user <span>↗</span></button>
          </article>
          <article id="owners" className="audience-card owner-audience">
            <span className="card-label">FOR PEOPLE WHO ALREADY PAY</span>
            <h3>Get more value from subscriptions you purchase from us.
</h3>
            <ul><li>Use your subscription normally</li><li>Make eligible unused access available</li><li>Potentially recover part of your cost</li><li>Pause or stop whenever you need it</li></ul>
            <button className="button button-dark" onClick={() => scrollToWaitlist('owner_audience')}>Join as an owner <span>↗</span></button>
          </article>
        </div>

        <div className="availability-grid">
          <div>
            <span className="card-label">OWNER CONTROL</span>
            <h3 className="availability-heading">You choose when your unused access is available.</h3>
            <p className="body-copy">Not an always-on handover. Pick specific days, a date range, or a recurring period inside your monthly billing cycle, then pause or stop whenever your plans change.</p>
            <div className="trust-strip">
              <span>Controlled access</span><span>Time-limited sessions</span><span>No password exchange</span><span>Automatic expiry</span>
            </div>
          </div>
          <div className="availability-card">
            <div className="availability-card-head"><span className="tiny-label">YOUR MONTHLY WINDOW</span><span className="pill">Editable</span></div>
            <div className="availability-service"><span className="service-icon claude small" aria-hidden="true">✳</span><strong>Claude Pro</strong><small>$20/mo</small></div>
            <div className="window-picker">
              <button className={`window-option ${selectedWindow === 'Weekends' ? 'active' : ''}`} onClick={() => { setSelectedWindow('Weekends'); track('availability_window', 'weekends') }}>
                <strong>Weekends</strong><small>Recurring · 8 days</small>
              </button>
              <button className={`window-option ${selectedWindow === 'Custom dates' ? 'active' : ''}`} onClick={() => { setSelectedWindow('Custom dates'); track('availability_window', 'custom') }}>
                <strong>Custom dates</strong><small>Choose a range</small>
              </button>
            </div>
            <div className="calendar-row">
              {availabilityDays.map((day) => (
                <button key={day} className={`day-chip ${selectedDays.includes(day) ? 'selected' : ''}`} aria-pressed={selectedDays.includes(day)} onClick={() => setSelectedDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]))}>
                  {day}
                </button>
              ))}
            </div>
            <div className="availability-summary"><span>Available this month</span><strong>{selectedDays.length * 2} days <small>· {selectedWindow}</small></strong></div>
            <button className="pause-button" onClick={() => track('availability_pause')}>Pause availability <span>Ⅱ</span></button>
          </div>
        </div>
      </section>

      {/* PAGE 4 — FAQ + WAITLIST */}
      <section id="waitlist" className="section-shell waitlist-section">
        <div className="waitlist-copy">
          <div className="section-kicker">EARLY ACCESS</div>
          <h2>Be one of the first to try it.</h2>
          <p>We&apos;re validating the idea before building the marketplace. Join the waitlist and help shape how it works.</p>
          <div className="waitlist-note"><span className="status-dot" /> Early members will help determine services, durations, pricing, and owner incentives.</div>
        </div>
        <div className="form-card">
          {submitted ? (
            <div className="success-state">
              <span className="success-mark">✓</span>
              <h3>You&apos;re on the list.</h3>
              <p>We&apos;ll let you know when early access opens.</p>
              <button className="text-link" onClick={() => setSubmitted(false)}>Add another response ↗</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="honeypot-field" aria-hidden="true">
                <label htmlFor="website">Company website</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <label>Email<input name="email" type="email" placeholder="you@example.com" required /></label>
              <label>What best describes you?
                <select name="userType" required defaultValue="">
                  <option value="" disabled>Select one</option>
                  <option>I want cheaper AI access</option>
                  <option>I already pay for AI subscriptions</option>
                  <option>I want to earn from unused access</option>
                  <option>Both</option>
                  <option>I&apos;m just curious</option>
                </select>
              </label>
              <label>If you share access, when would you prefer?
                <select name="availability" defaultValue="">
                  <option value="">Select a preference</option>
                  <option>Weekends</option>
                  <option>Weekday evenings</option>
                  <option>A specific date range each month</option>
                  <option>Whenever I&apos;m not using it</option>
                  <option>I&apos;m not planning to share</option>
                </select>
              </label>
              <fieldset>
                <legend>Which AI tools do you use? <small>optional</small></legend>
                <div className="checkbox-grid">
                  {services.map((service) => (
                    <label key={service}>
                      <input type="checkbox" checked={selectedServices.includes(service)} onChange={() => setSelectedServices((current) => (current.includes(service) ? current.filter((item) => item !== service) : [...current, service]))} /> <span>{service}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <button className="button button-dark full-button" type="submit" disabled={submitting} onClick={() => track('waitlist_started')}>
                {submitting ? 'Joining…' : 'Join the waitlist'} <span>↗</span>
              </button>
              <p className="form-disclaimer">No payment required. We will never ask for your AI account password or API key.</p>
            </form>
          )}
        </div>
      </section>

      <section id="faq" className="section-shell faq-section">
        <div className="faq-grid">
          <div>
            <div className="section-kicker">QUESTIONS</div>
            <h2>Good questions deserve clear answers.</h2>
          </div>
          <div>
            {faqs.map(([question, answer], index) => (
              <div className="faq-item" key={question}>
                <button onClick={() => { setOpenFaq(openFaq === index ? null : index); track('faq_open', question) }} aria-expanded={openFaq === index}>
                  <span>{question}</span><b>{openFaq === index ? '−' : '+'}</b>
                </button>
                {openFaq === index && <p>{answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div>
          <p className="eyebrow"><span className="status-dot" /> RelayAI / early access</p>
          <h2>AI access, when you need it.</h2>
          <p>Pay for the access you need. Get more value from the subscriptions you already have.</p>
          <button className="button button-light" onClick={() => scrollToWaitlist('final')}>Join the waitlist <span>↗</span></button>
          <small>Free to join · No payment required</small>
        </div>
      </section>

      <footer className="site-footer section-shell">
        <a className="brand" href="#top"><span className="brand-mark">↗</span> RelayAI</a>
        <div className="footer-links">
          <a href="#story">The story</a><a href="#users">For users</a><a href="#owners">For owners</a><a href="#faq">FAQ</a><a href="#waitlist">Waitlist</a>
        </div>
        <p>© 2026 RelayAI. An independent marketplace concept. No provider affiliation implied.</p>
      </footer>
    </main>
  )
}
