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
  .sort(([first], [second]) => first.localeCompare(second))
  .map(([path, src]) => {
    const filename = path.split("/").pop()?.replace(/\.[^.]+$/, "") || "photo"
    const alt = filename
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())

    return { src, alt: `Josh and Steph ${alt}` }
  })

export type StoryItem = {
  year: string
  title: string
  body: string
}

export const DETAILS = [
  {
    icon: "♡",
    label: "Ceremony & Reception",
    line1: "February 5, 2027 · 3:00 PM",
    line2: "Fruella’s Events Place",
    line3: "Tagaytay City, Philippines",
  },
  // {
  //   icon: "◇",
  //   label: "Reception",
  //   line1: "February 5, 2027 · 5:00 PM",
  //   line2: "Fruella’s Events Place",
  //   line3: "Tagaytay City, Philippines",
  // },
  {
    icon: "◈",
    label: "Dress Code",
    line1: "Black Tie Optional",
    line2: "Burgundy & Dusty Pink",
    line3: "Celebrate in elegance",
  },
]

export type DetailItem = (typeof DETAILS)[number]

export type GiftPreference = {
  id: string
  title: string
  description: string
  category: string
  link?: string
  qrCode?: string
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
      const response = await fetch(candidateUrl)
      if (!response.ok) continue

      const text = await response.text()
      if (!text) continue

      const parsed = JSON.parse(text) as unknown
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
    const response = await fetch(`${sheetUrl}?action=${action}`)
    if (!response.ok) return []

    const parsed = (await response.json()) as Record<string, unknown>
    return Array.isArray(parsed[key]) ? (parsed[key] as T[]) : []
  } catch {
    return []
  }
}

export function fetchStory(): Promise<StoryItem[]> {
  return fetchSheetCollection<StoryItem>("story", "story")
}

export function fetchDetails(): Promise<DetailItem[]> {
  return fetchSheetCollection<DetailItem>("details", "details")
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
