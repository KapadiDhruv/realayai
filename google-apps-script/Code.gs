/**
 * RelayAI waitlist — Google Apps Script Web App.
 *
 * Receives POSTs from the Next.js /api/waitlist route, checks the shared
 * secret, validates + normalizes the email, rejects duplicates against
 * the sheet, and appends a row.
 *
 * Setup: see google-apps-script/README.md.
 */

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties()
    var expectedSecret = props.getProperty('SHARED_SECRET')
    var sheetId = props.getProperty('SHEET_ID')

    if (!expectedSecret || !sheetId) {
      return jsonResponse({ ok: false, error: 'server_error', message: 'Script Properties not configured.' })
    }

    var body = JSON.parse(e.postData.contents)

    if (body.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'unauthorized' })
    }

    var email = normalizeEmail(body.email)
    if (!isValidEmail(email)) {
      return jsonResponse({ ok: false, error: 'invalid_email' })
    }

    var sheet = getWaitlistSheet(sheetId)

    if (emailExists(sheet, email)) {
      return jsonResponse({ ok: false, error: 'duplicate' })
    }

    sheet.appendRow([
      new Date(),
      email,
      body.userType || '',
      body.availability || '',
      Array.isArray(body.services) ? body.services.join(', ') : '',
    ])

    return jsonResponse({ ok: true })
  } catch (err) {
    return jsonResponse({ ok: false, error: 'server_error', message: String(err) })
  }
}

function getWaitlistSheet(sheetId) {
  var ss = SpreadsheetApp.openById(sheetId)
  var sheet = ss.getSheetByName('Waitlist')
  if (!sheet) {
    sheet = ss.insertSheet('Waitlist')
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Email', 'User Type', 'Availability', 'Services'])
  }
  return sheet
}

function emailExists(sheet, normalizedEmail) {
  var lastRow = sheet.getLastRow()
  if (lastRow < 2) return false
  var emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues() // column B
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === normalizedEmail) return true
  }
  return false
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Apps Script's ContentService can't set a custom HTTP status code — it
// always responds 200. The `ok` field in the body is what callers
// (the Next.js route) actually branch on.
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
