const SHEET_NAME = "RSVPs"
const HEADERS = [
  "Timestamp",
  "Full Name",
  "Email",
  "Guests",
  "Attendance",
  "Meal Preference",
  "Message",
  "Guest Count",
]

function doPost(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME)
  ensureHeaders(sheet)

  const data = JSON.parse(e.postData.contents)
  sheet.appendRow([
    data.createdAt || new Date().toISOString(),
    data.name || "",
    data.email || "",
    data.guests || "",
    data.attendance || "",
    data.meal || "",
    data.message || "",
    Number(data.guestCount || data.guests || 0),
  ])

  if (data.email) {
    MailApp.sendEmail({
      to: data.email,
      subject: "RSVP confirmation",
      htmlBody: [
        `<p>Dear ${escapeHtml(data.name || "guest")},</p>`,
        "<p>Thank you for responding to our wedding invitation.</p>",
        `<p><strong>Attendance:</strong> ${escapeHtml(data.attendance || "Not specified")}<br>` +
          `<strong>Guests:</strong> ${escapeHtml(String(data.guests || "1"))}<br>` +
          `<strong>Meal preference:</strong> ${escapeHtml(data.meal || "Not specified")}</p>`,
        "<p>We look forward to celebrating with you.</p>",
      ].join(""),
    })
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON)
}

function ensureHeaders(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0]
  const hasHeaders = HEADERS.every((header, index) => currentHeaders[index] === header)

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    sheet.setFrozenRows(1)
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
