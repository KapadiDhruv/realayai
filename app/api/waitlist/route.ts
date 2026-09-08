import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]!.trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  const { allowed } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'rate_limited', message: 'Too many attempts. Please try again in a bit.' },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'invalid_request', message: 'Malformed request.' },
      { status: 400 },
    )
  }

  // Honeypot: real visitors never see or fill this field (it's visually
  // hidden and out of tab order). If it's filled, this is almost certainly
  // a bot — return a success-shaped response so it doesn't learn the trap
  // exists, but skip writing anything to the sheet.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ success: true })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { success: false, error: 'invalid_email', message: 'Enter a valid email address.' },
      { status: 400 },
    )
  }

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET
  if (!scriptUrl || !secret) {
    console.error('Missing GOOGLE_APPS_SCRIPT_URL or GOOGLE_APPS_SCRIPT_SECRET env vars')
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Waitlist is temporarily unavailable.' },
      { status: 500 },
    )
  }

  const userType = typeof body.userType === 'string' ? body.userType.trim() : ''
  const availability = typeof body.availability === 'string' ? body.availability.trim() : ''
  const services = Array.isArray(body.services) ? body.services.filter((s): s is string => typeof s === 'string') : []

  let sheetResponse: Response
  try {
    sheetResponse = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, email, userType, availability, services }),
    })
  } catch (err) {
    console.error('Failed to reach Google Apps Script', err)
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Could not submit right now. Please try again shortly.' },
      { status: 502 },
    )
  }

  let sheetResult: { ok?: boolean; error?: string } | null = null
  try {
    sheetResult = await sheetResponse.json()
  } catch {
    // fall through — sheetResult stays null, handled below
  }

  if (!sheetResult || !sheetResult.ok) {
    if (sheetResult?.error === 'duplicate') {
      return NextResponse.json(
        { success: false, error: 'duplicate', message: "You're already on the waitlist." },
        { status: 409 },
      )
    }
    if (sheetResult?.error === 'invalid_email') {
      return NextResponse.json(
        { success: false, error: 'invalid_email', message: 'Enter a valid email address.' },
        { status: 400 },
      )
    }
    console.error('Apps Script rejected submission', sheetResult)
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Could not submit right now. Please try again shortly.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ success: true })
}
