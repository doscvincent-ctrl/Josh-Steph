const INVITEES_SHEET_NAME = "Invitees"

// Each invited person has their own row.
// People belonging to the same invitation share the same Code.
//
// Example:
// Code   | Name          | Email              | Attendance | Message
// MC001  | Michael Chen  | michael@email.com   | yes        |
// MC001  | Sarah Chen    |                    | yes        |
// MC001  | Daniel Chen   |                    | no         |
//
// There is intentionally NO "Max Guests" column. The number of guests in a
// party is determined by how many rows have the same Code.

const INVITEE_HEADERS = ["Code", "Name", "Email", "Attendance", "Message"]

function doGet(e) {
  const action = String(
    e && e.parameter && e.parameter.action ? e.parameter.action : "",
  )
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()

  if (action === "invitees" || action === "guests") {
    return jsonResponse({
      ok: true,
      invitees: getInvitees(spreadsheet),
    })
  }

  return jsonResponse({
    ok: true,
    invitees: getInvitees(spreadsheet),
    sheets: [
      spreadsheet.getSheetByName(INVITEES_SHEET_NAME)?.getName() ||
        INVITEES_SHEET_NAME,
    ],
  })
}

function doPost(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const sheet =
    spreadsheet.getSheetByName(INVITEES_SHEET_NAME) ||
    spreadsheet.insertSheet(INVITEES_SHEET_NAME)

  ensureHeaders(sheet, INVITEE_HEADERS)

  const data = parseFormData(e)
  const submittedCode = String(data.guestId || data.code || "")
    .trim()
    .toLowerCase()

  if (!submittedCode) {
    return jsonResponse({
      ok: false,
      message: "Invalid guest code.",
    })
  }

  const values = sheet.getDataRange().getValues()

  if (values.length <= 1) {
    return jsonResponse({
      ok: false,
      message: "No invitees were found.",
    })
  }

  const headers = values[0].map((header) =>
    String(header || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ""),
  )

  const codeCol = headers.indexOf("code")
  const nameCol = headers.indexOf("name")
  const emailCol = headers.indexOf("email")
  const attendanceCol = headers.indexOf("attendance")
  const messageCol = headers.indexOf("message")

  if (codeCol === -1 || nameCol === -1) {
    return jsonResponse({
      ok: false,
      message: "The Invitees sheet must contain Code and Name columns.",
    })
  }

  let attendingGuests = []

  try {
    const parsed = JSON.parse(String(data.attendingGuests || "[]"))
    if (Array.isArray(parsed)) {
      attendingGuests = parsed
    }
  } catch {
    attendingGuests = []
  }

  const partyRows = []
  const rowByGuest = {}

  // Find EVERY row with the submitted code.
  for (let i = 1; i < values.length; i++) {
    const rowCode = String(values[i][codeCol] || "")
      .trim()
      .toLowerCase()

    if (rowCode !== submittedCode) continue

    const rowNumber = i + 1
    const name = String(values[i][nameCol] || "").trim()
    const email =
      emailCol !== -1 ? String(values[i][emailCol] || "").trim() : ""

    const guest = {
      rowNumber,
      name,
      email,
    }

    partyRows.push(guest)

    const key = normalizeName(name)
    if (key) {
      rowByGuest[key] = guest
    }
  }

  if (partyRows.length === 0) {
    return jsonResponse({
      ok: false,
      message: "Invalid guest code.",
    })
  }

  // Update each person's own row according to the checkbox selection.
  partyRows.forEach((guest) => {
    const submittedGuest = attendingGuests.find(
      (item) =>
        item &&
        normalizeName(item.name) === normalizeName(guest.name),
    )

    const isAttending = !!(submittedGuest && submittedGuest.attending)
    const rowAttendance = isAttending ? "yes" : "no"

    if (attendanceCol !== -1) {
      sheet
        .getRange(guest.rowNumber, attendanceCol + 1)
        .setValue(rowAttendance)
    }

    if (messageCol !== -1) {
      sheet
        .getRange(guest.rowNumber, messageCol + 1)
        .setValue(String(data.message || ""))
    }
  })

  // Send one confirmation email per unique email address.
  const uniqueEmails = {}

  partyRows.forEach((guest) => {
    if (guest.email) {
      uniqueEmails[guest.email.toLowerCase()] = guest.email
    }
  })

  Object.keys(uniqueEmails).forEach((emailKey) => {
    const email = uniqueEmails[emailKey]

    try {
      const attendingNames = partyRows
        .filter((guest) => {
          const submittedGuest = attendingGuests.find(
            (item) =>
              item &&
              normalizeName(item.name) === normalizeName(guest.name),
          )

          return !!(submittedGuest && submittedGuest.attending)
        })
        .map((guest) => guest.name)
        .filter(Boolean)

      const firstName =
        partyRows.find(
          (guest) => guest.email.toLowerCase() === emailKey,
        )?.name || "guest"

      MailApp.sendEmail({
        to: email,
        subject: "RSVP confirmation",
        htmlBody: [
          `<p>Dear ${escapeHtml(firstName)},</p>`,
          "<p>Thank you for responding to our wedding invitation.</p>",
          "<p><strong>Guests attending:</strong></p>",
          attendingNames.length
            ? `<ul>${attendingNames
                .map((name) => `<li>${escapeHtml(name)}</li>`)
                .join("")}</ul>`
            : "<p>No guests will be attending.</p>",
          "<p>We look forward to celebrating with you.</p>",
        ].join(""),
      })
    } catch (error) {
      console.error(
        `RSVP saved, but confirmation email failed: ${error}`,
      )
    }
  })

  return jsonResponse({
    ok: true,
    message: "RSVP recorded successfully.",
  })
}

function getInvitees(spreadsheet) {
  const sheet =
    spreadsheet.getSheetByName(INVITEES_SHEET_NAME) ||
    spreadsheet.insertSheet(INVITEES_SHEET_NAME)

  ensureHeaders(sheet, INVITEE_HEADERS)

  const data = sheet.getDataRange().getValues()

  if (data.length <= 1) {
    return []
  }

  const headers = data[0].map((header) =>
    String(header || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ""),
  )

  const invitees = []

  data.slice(1).forEach((row) => {
    if (!row.some((cell) => cell !== "" && cell !== null)) {
      return
    }

    const record = {}

    headers.forEach((header, columnIndex) => {
      record[header] = row[columnIndex] ?? ""
    })

    const id = String(
      record.code ??
        record.guestcode ??
        record.invitecode ??
        record.id ??
        record.inviteid ??
        record.inviteeid ??
        record.guestid ??
        record.slug ??
        "",
    ).trim()

    const name = String(
      record.name ??
        record.fullname ??
        record.guestname ??
        record.attendee ??
        record.invitee ??
        "",
    ).trim()

    const email = String(
      record.email ??
        record.emailaddress ??
        record.guestemail ??
        record.attendeeemail ??
        "",
    ).trim()

    const attendance = String(record.attendance ?? "")
      .trim()
      .toLowerCase()

    // One row = one person. Do not merge people here.
    if (!id || !name) return

    invitees.push({
      id,
      name,
      email,
      attendance:
        attendance === "yes" || attendance === "no" ? attendance : "",
    })
  })

  return invitees
}

function ensureHeaders(sheet, headers) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1)
  const currentHeaders = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]

  headers.forEach((header) => {
    const exists = currentHeaders.some(
      (current) =>
        String(current || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "") ===
        header.toLowerCase().replace(/\s+/g, ""),
    )

    if (!exists) {
      const newColumn = sheet.getLastColumn() + 1
      sheet.getRange(1, newColumn).setValue(header)
      currentHeaders.push(header)
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

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
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
