const INVITEES_SHEET_NAME = "Invitees"

// The Invitees sheet is now the single source of truth for both who's
// invited AND their RSVP response. There is no separate RSVP sheet —
// submitting an RSVP updates the guest's own row in place.
const INVITEE_HEADERS = ["Code", "Name", "Email", "Max Guests", "Attendance", "Message"]

function doGet(e) {
  const action = String(e && e.parameter && e.parameter.action ? e.parameter.action : "")
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()

  if (action === "invitees" || action === "guests") {
    return jsonResponse({ ok: true, invitees: getInvitees(spreadsheet) })
  }

  return jsonResponse({
    ok: true,
    invitees: getInvitees(spreadsheet),
    sheets: [spreadsheet.getSheetByName(INVITEES_SHEET_NAME)?.getName() || INVITEES_SHEET_NAME],
  })
}

function doPost(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = spreadsheet.getSheetByName(INVITEES_SHEET_NAME) || spreadsheet.insertSheet(INVITEES_SHEET_NAME)
  ensureHeaders(sheet, INVITEE_HEADERS)

  const data = parseFormData(e)
  const submittedCode = String(data.guestId || data.code || "").trim().toLowerCase()
  const attendance = String(data.attendance || "").trim().toLowerCase()

  if (!submittedCode) {
    return jsonResponse({ ok: false, message: "Invalid guest code." })
  }

  if (attendance !== "yes" && attendance !== "no") {
    return jsonResponse({ ok: false, message: "Attendance is required." })
  }

  const values = sheet.getDataRange().getValues()
  const headers = values[0].map((header) => String(header || "").trim().toLowerCase().replace(/\s+/g, ""))

  const codeCol = headers.indexOf("code")
  const nameCol = headers.indexOf("name")
  const emailCol = headers.indexOf("email")
  const attendanceCol = headers.indexOf("attendance")
  const messageCol = headers.indexOf("message")

  for (let i = 1; i < values.length; i++) {
    const rowCode = String(values[i][codeCol] || "").trim().toLowerCase()
    if (rowCode !== submittedCode) continue

    const rowNumber = i + 1 // sheet rows are 1-indexed; row 1 is the header

    if (attendanceCol !== -1) {
      sheet.getRange(rowNumber, attendanceCol + 1).setValue(attendance)
    }
    if (messageCol !== -1) {
      sheet.getRange(rowNumber, messageCol + 1).setValue(String(data.message || ""))
    }

    const name = nameCol !== -1 ? String(values[i][nameCol] || "").trim() : ""
    const email = emailCol !== -1 ? String(values[i][emailCol] || "").trim() : ""

    if (email) {
      try {
        MailApp.sendEmail({
          to: email,
          subject: "RSVP confirmation",
          htmlBody: [
            `<p>Dear ${escapeHtml(name || "guest")},</p>`,
            "<p>Thank you for responding to our wedding invitation.</p>",
            `<p><strong>Attendance:</strong> ${escapeHtml(attendance === "yes" ? "Attending" : "Not attending")}</p>`,
            "<p>We look forward to celebrating with you.</p>",
          ].join(""),
        })
      } catch (error) {
        console.error(`RSVP saved, but confirmation email failed: ${error}`)
      }
    }

    return jsonResponse({ ok: true, message: "RSVP recorded successfully." })
  }

  // Reaching here means no row on the Invitees sheet matched the code.
  return jsonResponse({ ok: false, message: "Invalid guest code." })
}

function getInvitees(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(INVITEES_SHEET_NAME) || spreadsheet.insertSheet(INVITEES_SHEET_NAME)
  ensureHeaders(sheet, INVITEE_HEADERS)

  const data = sheet.getDataRange().getValues()
  if (data.length <= 1) return []

  const headers = data[0].map((header) => String(header || "").trim().toLowerCase().replace(/\s+/g, ""))

  return data.slice(1)
    .filter((row) => row.some((cell) => cell !== "" && cell !== null))
    .map((row, index) => {
      const record = {}
      headers.forEach((header, columnIndex) => {
        record[header] = row[columnIndex] ?? ""
      })

      const id = String(
        record.code ?? record.id ?? record.inviteid ?? record.inviteeid ?? record.slug ?? "",
      ).trim()
      const name = String(
        record.name ?? record.fullname ?? record.guestname ?? record.attendee ?? record.invitee ?? "",
      ).trim()
      const email = String(record.email ?? record.emailaddress ?? record.guestemail ?? "").trim()
      const maxGuests = Number(
        record.maxguests ?? record.guests ?? record.guestcount ?? record.maxguestcount ?? 1,
      )
      const attendance = String(record.attendance ?? "").trim().toLowerCase()

      return {
        id,
        name: name || `Guest ${index + 1}`,
        email: email || "",
        maxGuests: Number.isFinite(maxGuests) && maxGuests > 0 ? maxGuests : 1,
        attendance: attendance === "yes" || attendance === "no" ? attendance : "",
      }
    })
    // A row must have a code to be usable for RSVP lookup — rows
    // without one are ignored entirely rather than auto-generated,
    // since the code is meant to be assigned deliberately per guest.
    .filter((invitee) => invitee.id && (invitee.name || invitee.email))
}

function ensureHeaders(sheet, headers) {
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0]
  const hasHeaders = headers.every((header, index) => currentHeaders[index] === header)

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.setFrozenRows(1)
  }
}

function parseFormData(e) {
  if (!e) return {}

  if (e.parameter && (e.parameter.guestId || e.parameter.code)) {
    return Object.fromEntries(
      Object.entries(e.parameter).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
    )
  }

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents)
    } catch (error) {
      return {}
    }
  }

  return {}
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}