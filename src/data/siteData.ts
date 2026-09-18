const imagePath = (filename: string) =>
  `${import.meta.env.BASE_URL}imports/${filename}`

const heroPhoto = imagePath("d634c711-db0a-41c8-88da-079f1086bf0f.jpg")

const importedImages = import.meta.glob(
  "../imports/*.{jpg,jpeg,png,webp}",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>

export const P = {
  burgundy: "#7B2937",
  burgundyDk: "#5C1E2A",
  pink: "#C49090",
  champagne: "#F2D9C8",
  beige: "#EDE0D0",
  taupe: "#C4A090",
  black: "#1A1A1A",
}

export const COUPLE_PHOTOS = Object.entries(importedImages)
  .filter(([path]) => !path.endsWith("799754334_922069957193988_2678038894682432545_n.png"))
  .sort(([first], [second]) => first.localeCompare(second))
  .map(([path, src]) => {
    const filename = path.split("/").pop()?.replace(/\.[^.]+$/, "") || "photo"
    const alt = filename
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())

    return { src, alt: `Josh and Steph ${alt}` }
  })

export type StoryItem = {
  heSaid: string
  sheSaid: string
}

export type DetailItem = {
  icon: string
  label: string
  line1: string
  line2: string
  line3: string
}

export type GiftPreference = {
  id: string
  title: string
  description: string
  category: string
  link?: string
  qrCode?: string
  reserved?: boolean
}

export type EntourageMember = {
  name: string
  role: string
}

export type Invitee = {
  id: string
  name: string
  email: string
  attendance?: string
  attending?: boolean
}

function normalizeInvitee(raw: Record<string, unknown>): Invitee | null {
  const lookup = Object.entries(raw).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      const normalizedKey = key
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")

      acc[normalizedKey] = value
      return acc
    },
    {},
  )

  const name = String(
    lookup.name ??
    lookup.fullname ??
    lookup.guestname ??
    lookup.fullnameaslisted ??
    lookup.attendee ??
    lookup.invitee ??
    "",
  ).trim()

  const email = String(
    lookup.email ??
    lookup.emailaddress ??
    lookup.guestemail ??
    lookup.attendeeemail ??
    "",
  ).trim()

  // Every person has their own row, but everyone in the same party uses
  // the same Code. The Code therefore groups the rows into one invitation.
  const idValue = String(
    lookup.code ??
    lookup.guestcode ??
    lookup.invitecode ??
    lookup.id ??
    lookup.inviteid ??
    lookup.inviteeid ??
    lookup.guestid ??
    lookup.slug ??
    lookup.linkid ??
    "",
  ).trim()

  const attendance = String(lookup.attendance ?? "")
    .trim()
    .toLowerCase()

  if (!name || !idValue) return null

  return {
    id: idValue,
    name,
    email,
    attendance:
      attendance === "yes" || attendance === "no" ? attendance : "",
  }
}

function normalizeMember(raw: Record<string, unknown>): EntourageMember | null {
  const name = String(raw.name ?? "").trim()
  if (!name) return null

  return {
    name,
    role: String(raw.role ?? "").trim(),
  }
}

function normalizeGift(raw: Record<string, unknown>): GiftPreference | null {
  const title = String(raw.title ?? raw.name ?? "").trim()
  if (!title) return null

  return {
    id: String(raw.id ?? raw.slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    title,
    description: String(raw.description ?? raw.details ?? ""),
    category: String(raw.category ?? "For our home"),
    link: String(raw.link ?? raw.url ?? ""),
    reserved: raw.reserved === true || String(raw.reserved).toLowerCase() === "true",
    qrCode: String(
      raw.qrCode ?? raw.qrcode ?? raw.qr_code ?? raw["QR Code"] ?? "",
    ),
  }
}

let fetchQueue: Promise<unknown> = Promise.resolve()
const jsonCache = new Map<string, unknown>()

async function queuedFetchJson(url: string, retries = 2): Promise<unknown> {
  if (jsonCache.has(url)) {
    return jsonCache.get(url)
  }

  const result = fetchQueue.then(async () => {
    // Small delay between consecutive requests to Google Apps Script
    await new Promise((r) => setTimeout(r, 150))

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const text = await response.text()
        if (!text || text.trim().startsWith("<")) {
          throw new Error("Received non-JSON response from Google Apps Script")
        }
        const json = JSON.parse(text)
        jsonCache.set(url, json)
        return json
      } catch (err) {
        if (attempt === retries) throw err
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      }
    }
  })

  fetchQueue = result.catch(() => { })
  return result
}

export async function fetchInvitees(): Promise<Invitee[]> {
  const sheetUrl = import.meta.env.VITE_SHEETS_WEB_APP_URL as string | undefined

  if (!sheetUrl) {
    return []
  }

  const candidateUrls = [
    `${sheetUrl}?action=invitees`,
    `${sheetUrl}?action=guests`,
    sheetUrl,
  ]

  for (const candidateUrl of candidateUrls) {
    try {
      const parsed = await queuedFetchJson(candidateUrl)
      const rows = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { invitees?: unknown })?.invitees)
          ? (parsed as { invitees: unknown[] }).invitees
          : Array.isArray((parsed as { data?: unknown[] })?.data)
            ? (parsed as { data: unknown[] }).data
            : Array.isArray((parsed as { rows?: unknown[] })?.rows)
              ? (parsed as { rows: unknown[] }).rows
              : []

      const invitees = rows
        .map((row) =>
          typeof row === "object" && row !== null
            ? normalizeInvitee(row as Record<string, unknown>)
            : null,
        )
        .filter((item): item is Invitee => item !== null)

      if (invitees.length > 0) {
        return invitees
      }
    } catch {
      // Ignore failed fetches and continue to the next URL.
    }
  }

  return []
}

async function fetchSheetCollection<T>(
  action: string,
  key: string,
): Promise<T[]> {
  const sheetUrl = import.meta.env.VITE_SHEETS_WEB_APP_URL as string | undefined
  if (!sheetUrl) return []

  try {
    const parsed = (await queuedFetchJson(`${sheetUrl}?action=${action}`)) as Record<string, unknown>
    return Array.isArray(parsed[key]) ? (parsed[key] as T[]) : []
  } catch {
    return []
  }
}

type RawStoryItem = {
  heSaid?: string
  sheSaid?: string
  title?: string
  body?: string
}

export async function fetchStory(): Promise<StoryItem[]> {
  const items = await fetchSheetCollection<RawStoryItem>("story", "story")

  return items.flatMap((item) => {
    const fallback = item.body || ""
    const heSaid = item.heSaid || fallback
    const sheSaid = item.sheSaid || fallback

    if (!heSaid && !sheSaid) return []

    return [{ heSaid, sheSaid }]
  })
}

export function fetchDetails(): Promise<DetailItem[]> {
  return fetchSheetCollection<DetailItem>("details", "details")
}

export async function fetchEntourage(): Promise<EntourageMember[]> {
  const rows = await fetchSheetCollection<Record<string, unknown>>("entourage", "entourage")
  return rows
    .map((item) => (typeof item === "object" && item ? normalizeMember(item) : null))
    .filter((item): item is EntourageMember => item !== null)
}

export async function fetchWishlist(): Promise<GiftPreference[]> {
  const sheetUrl = import.meta.env.VITE_SHEETS_WEB_APP_URL as string | undefined
  if (!sheetUrl) return []

  try {
    const parsed = (await queuedFetchJson(`${sheetUrl}?action=wishlist`)) as Record<string, unknown>
    const rows = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.gifts)
        ? (parsed.gifts as Record<string, unknown>[])
        : []
    return rows
      .map((item) => (typeof item === "object" && item ? normalizeGift(item) : null))
      .filter((item): item is GiftPreference => item !== null)
  } catch {
    return []
  }
}

export function buildInviteLink(inviteeId: string) {
  if (typeof window === "undefined") {
    return `/?invite=${encodeURIComponent(inviteeId)}#rsvp`
  }

  const url = new URL(window.location.href)
  url.searchParams.set("invite", inviteeId)
  url.hash = "rsvp"

  return url.toString()
}

