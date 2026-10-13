// ── Wedding Photo Gallery — Google Apps Script ──────────────────────────────
//
// SETUP INSTRUCTIONS:
//   1. Go to script.google.com and create a NEW project (separate from your
//      existing wedding script).
//   2. Paste this entire file as the only file in the new project.
//   3. Set DRIVE_FOLDER_ID below to the ID of the Google Drive folder where
//      photos should be saved. The folder ID is the last segment of the
//      folder's URL: drive.google.com/drive/folders/<FOLDER_ID>
//   4. Click Deploy → New deployment → Web app.
//      - Execute as: Me
//      - Who has access: Anyone
//   5. Copy the /exec URL and set it as VITE_GALLERY_WEB_APP_URL in your
//      .env file.
//
// NOTE: Re-deploy (new version) every time you change this script.
// ─────────────────────────────────────────────────────────────────────────────

var DRIVE_FOLDER_ID = "1KfRxWq7tpY4mdEexEoX6ulW8TQ501Xds"

// ── CORS helper ───────────────────────────────────────────────────────────────
function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

// ── GET — return list of uploaded photos or proxy thumbnail ──────────────────
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {}
    var action = String(params.action || "list").trim().toLowerCase()

    if (action === "thumb" && params.id) {
      return getThumbnail(params.id)
    }

    return listPhotos()
  } catch (err) {
    return jsonResponse({ ok: false, message: String(err) })
  }
}

// Direct thumbnail proxy from DriveApp (100% reliable even when Google CDN is slow to index)
function getThumbnail(id) {
  try {
    var file = DriveApp.getFileById(id)
    var thumb = file.getThumbnail()
    if (thumb) {
      return jsonResponse({
        ok: true,
        dataUri: "data:" + thumb.getContentType() + ";base64," + Utilities.base64Encode(thumb.getBytes()),
      })
    }
    var blob = file.getBlob()
    return jsonResponse({
      ok: true,
      dataUri: "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes()),
    })
  } catch (err) {
    return jsonResponse({ ok: false, message: String(err) })
  }
}

function listPhotos() {
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID)
  var files = folder.getFiles()
  var photos = []

  while (files.hasNext()) {
    var file = files.next()
    var mimeType = file.getMimeType()

    // Only include image files
    if (!mimeType.startsWith("image/")) continue

    // Ensure file is publicly readable so direct URLs work
    try {
      if (file.getSharingAccess() !== DriveApp.Access.ANYONE_WITH_LINK) {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
      }
    } catch (_) {}

    var id = file.getId()
    photos.push({
      id: id,
      name: file.getName(),
      url: "https://lh3.googleusercontent.com/d/" + id,
      thumbnail: "https://lh3.googleusercontent.com/d/" + id + "=w600",
      fallbackThumbnail: "https://drive.google.com/thumbnail?id=" + id + "&sz=w600",
      uploadedAt: file.getDateCreated().toISOString(),
      mimeType: mimeType,
    })
  }

  // Most recently uploaded first
  photos.sort(function(a, b) {
    return new Date(b.uploadedAt) - new Date(a.uploadedAt)
  })

  return jsonResponse({ ok: true, photos: photos })
}

// ── POST — upload a single photo ─────────────────────────────────────────────
//
// The client sends a URLSearchParams body (no Content-Type: application/json)
// so Google Apps Script receives the fields via e.parameter — no preflight,
// no CORS issues.
//
function doPost(e) {
  try {
    // URLSearchParams POST — fields are in e.parameter
    var params = (e && e.parameter) ? e.parameter : {}

    // Fallback: try JSON body (for direct curl / testing)
    if (!params.action && e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents)
      } catch (_) {}
    }

    var action = String(params.action || "upload").trim().toLowerCase()

    if (action === "upload") {
      return handleUpload(params)
    }

    return jsonResponse({ ok: false, message: "Unknown action: " + action })
  } catch (err) {
    return jsonResponse({ ok: false, message: String(err) })
  }
}

function handleUpload(payload) {
  var base64Data = String(payload.data || "").trim()
  var fileName = String(payload.fileName || ("photo_" + Date.now() + ".jpg")).trim()
  var mimeType = String(payload.mimeType || "image/jpeg").trim()
  var uploaderName = String(payload.uploaderName || "").trim()

  if (!base64Data) {
    return jsonResponse({ ok: false, message: "No image data received." })
  }

  // Sanitize file name
  fileName = fileName.replace(/[^a-zA-Z0-9._\- ]/g, "_")

  // Prefix with uploader name if provided
  if (uploaderName) {
    fileName = uploaderName.replace(/[^a-zA-Z0-9 ]/g, "_") + "_" + fileName
  }

  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID)

  // Decode base64 -> bytes
  var bytes = Utilities.base64Decode(base64Data)
  var blob = Utilities.newBlob(bytes, mimeType, fileName)

  var file = folder.createFile(blob)

  // Make the file publicly readable so the thumbnail URL works
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)

  return jsonResponse({
    ok: true,
    message: "Photo uploaded successfully.",
    photo: {
      id: file.getId(),
      name: file.getName(),
      url: "https://lh3.googleusercontent.com/d/" + file.getId(),
      thumbnail: "https://lh3.googleusercontent.com/d/" + file.getId() + "=w600",
      fallbackThumbnail: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w600",
      uploadedAt: file.getDateCreated().toISOString(),
    },
  })
}
