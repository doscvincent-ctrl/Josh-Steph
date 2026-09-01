const INVITEES_SHEET_NAME = "Invitees"

// Invitees is the single source of truth.
// Recommended columns:
// Code | Guest 1 | Guest 2 | Guest 3 | ... | Email | Attendance | Attending Guests | Message
//
// Each Guest N column contains one person's name. The Attending Guests column
// stores a JSON array so attendance can be recorded independently per person.

const REQUIRED_HEADERS = ["Code", "Guest 1", "Email", "Attendance", "Attending Guests", "Message"]

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
  const sheet =
    spreadsheet.getSheetByName(INVITEES_SHEET_NAME) ||
    spreadsheet.insertSheet(INVITEES_SHEET_NAME)

  ensureHeaders(sheet, REQUIRED_HEADERS)

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
  if (values.length === 0) {
    return jsonResponse({ ok: false, message: "Invitee sheet is empty." })
  }

  const headers = values[0].map((header) =>
    String(header || "").trim().toLowerCase().replace(/\s+/g, ""),
  )

  const codeCol = headers.indexOf("code")
  const emailCol = headers.indexOf("email")
  const attendanceCol = headers.indexOf("attendance")
  const attendingGuestsCol = headers.indexOf("attendingguests")
  const messageCol = headers.indexOf("message")

  if (codeCol === -1) {
    return jsonResponse({ ok: false, message: "The Invitees sheet is missing the Code column." })
  }

  let submittedGuests = []
  try {
    submittedGuests = JSON.parse(String(data.attendingGuests || "[]"))
  } catch {
    submittedGuests = []
  }

  for (let i = 1; i < values.length; i++) {
    const rowCode = String(values[i][codeCol] || "").trim().toLowerCase()
    if (rowCode !== submittedCode) continue

    const rowNumber = i + 1

    if (attendanceCol !== -1) {
      sheet.getRange(rowNumber, attendanceCol + 1).setValue(attendance)
    }

    if (attendingGuestsCol !== -1) {
      sheet
        .getRange(rowNumber, attendingGuestsCol + 1)
        .setValue(JSON.stringify(submittedGuests))
    }

    if (messageCol !== -1) {
      sheet.getRange(rowNumber, messageCol + 1).setValue(String(data.message || ""))
    }

    const nameEntries = getGuestNames(headers, values[i])
    const email = emailCol !== -1 ? String(values[i][emailCol] || "").trim() : ""

    if (email) {
      try {
        const attendingNames = submittedGuests
          .filter((guest) => guest && guest.attending)
          .map((guest) => String(guest.name || "").trim())
          .filter(Boolean)

        MailApp.sendEmail({
          to: email,
          subject: "RSVP confirmation",
          htmlBody: [
            `<p>Dear ${escapeHtml(nameEntries[0] || "guest")},</p>`,
            "<p>Thank you for responding to our wedding invitation.</p>",
            `<p><strong>Attendance:</strong> ${escapeHtml(attendance === "yes" ? "Attending" : "Not attending")}</p>`,
            attendance === "yes"
              ? `<p><strong>Guests attending:</strong> ${escapeHtml(attendingNames.join(", ") || "None")}</p>`
              : "",
            "<p>We look forward to celebrating with you.</p>",
          ].join(""),
        })
      } catch (error) {
        console.error(`RSVP saved, but confirmation email failed: ${error}`)
      }
    }

    return jsonResponse({ ok: true, message: "RSVP recorded successfully." })
  }

  return jsonResponse({ ok: false, message: "Invalid guest code." })
}

function getInvitees(spreadsheet) {
  const sheet =
    spreadsheet.getSheetByName(INVITEES_SHEET_NAME) ||
    spreadsheet.insertSheet(INVITEES_SHEET_NAME)

  ensureHeaders(sheet, REQUIRED_HEADERS)

  const data = sheet.getDataRange().getValues()
  if (data.length <= 1) return []

  const headers = data[0].map((header) =>
    String(header || "").trim().toLowerCase().replace(/\s+/g, ""),
  )

  return data
    .slice(1)
    .filter((row) => row.some((cell) => cell !== "" && cell !== null))
    .map((row, index) => {
      const record = {}
      headers.forEach((header, columnIndex) => {
        record[header] = row[columnIndex] ?? ""
      })

      const id = String(
        record.code ??
          record.id ??
          record.inviteid ??
          record.inviteeid ??
          record.slug ??
          "",
      ).trim()

      const names = getGuestNames(headers, row)

      const email = String(
        record.email ?? record.emailaddress ?? record.guestemail ?? "",
      ).trim()

      const attendance = String(record.attendance ?? "").trim().toLowerCase()

      let attendingGuests = []
      const rawAttendingGuests = record.attendingguests

      if (rawAttendingGuests) {
        try {
          const parsed = JSON.parse(String(rawAttendingGuests))
          if (Array.isArray(parsed)) {
            attendingGuests = parsed
          }
        } catch {
          attendingGuests = []
        }
      }

      return {
        id,
        names: names.length ? names : [`Guest ${index + 1}`],
        email,
        attendance:
          attendance === "yes" || attendance === "no" ? attendance : "",
        attendingGuests,
      }
    })
    .filter((invitee) => invitee.id && invitee.names.length)
}

function getGuestNames(headers, row) {
  return headers
    .map((header, index) => {
      const match = header.match(/^guest(\d+)$/)
      if (!match) return null

      return {
        number: Number(match[1]),
        name: String(row[index] || "").trim(),
      }
    })
    .filter((item) => item !== null && item.name)
    .sort((a, b) => a.number - b.number)
    .map((item) => item.name)
}

function ensureHeaders(sheet, headers) {
  const lastColumn = Math.max(sheet.getLastColumn(), headers.length)
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]

  headers.forEach((header) => {
    const exists = currentHeaders.some(
      (current) =>
        String(current || "").trim().toLowerCase().replace(/\s+/g, "") ===
        header.toLowerCase().replace(/\s+/g, ""),
    )

    if (!exists) {
      const newColumn = sheet.getLastColumn() + 1
      sheet.getRange(1, newColumn).setValue(header)
    }
  })

  sheet.setFrozenRows(1)
}

function parseFormData(e) {
  if (!e) return {}

  if (e.parameter && (e.parameter.guestId || e.parameter.code)) {
    return Object.fromEntries(
      Object.entries(e.parameter).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    )
  }

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents)
    } catch {
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
