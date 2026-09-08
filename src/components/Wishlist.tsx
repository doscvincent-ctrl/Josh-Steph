import { useEffect, useState } from "react"
import { GIFT_PREFERENCES, P, type GiftPreference } from "../data/siteData"

// Gifts share the same Google Apps Script web app and spreadsheet as RSVP.
const SHEETS_URL = import.meta.env.VITE_SHEETS_WEB_APP_URL as string | undefined

function normalizeGift(raw: Record<string, unknown>): GiftPreference | null {
  const title = String(raw.title ?? raw.name ?? "").trim()
  if (!title) return null

  return {
    id: String(raw.id ?? raw.slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    title,
    description: String(raw.description ?? raw.details ?? ""),
    category: String(raw.category ?? "For our home"),
    link: String(raw.link ?? raw.url ?? ""),
  }
}

function GiftIcon() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full border" style={{ borderColor: `${P.burgundy}55`, color: P.burgundy }} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-5 w-5">
        <path d="M3.5 10h17v10h-17zM2.5 6.5h19v3.5h-19zM12 6.5V20M12 6.5H8.7A2.2 2.2 0 1 1 12 3.8v2.7Zm0 0h3.3a2.2 2.2 0 1 0-3.3-2.7v2.7Z" />
      </svg>
    </span>
  )
}

export function Wishlist() {
  const [gifts, setGifts] = useState(GIFT_PREFERENCES)

  useEffect(() => {
    if (!SHEETS_URL) return

    fetch(`${SHEETS_URL}?action=wishlist`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { gifts?: unknown[] })?.gifts)
            ? (payload as { gifts: unknown[] }).gifts
            : []
        const loaded = rows
          .map((item) => (typeof item === "object" && item ? normalizeGift(item as Record<string, unknown>) : null))
          .filter((item): item is GiftPreference => item !== null)
        if (loaded.length) setGifts(loaded)
      })
      .catch(() => {
        // The local list remains available if the optional database is offline.
      })
  }, [])

  return (
    <section id="wishlist" className="px-4 py-24" style={{ background: P.champagne }}>
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-script text-2xl italic tracking-[0.14em]" style={{ color: P.burgundy }}>
            With grateful hearts
          </p>
          <h2 className="font-display mt-2 text-4xl md:text-5xl" style={{ color: P.black }}>
            Gift Preferences
          </h2>
          <div className="soft-divider mx-auto mt-5 max-w-48" />
          <p className="mt-6 text-sm leading-7" style={{ color: P.burgundyDk }}>
            Your presence is the greatest gift. For those who have asked, these are a few things that would help us begin our next chapter together.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift) => (
            <article key={gift.id} className="group flex min-h-64 flex-col rounded-sm border p-6 transition-transform duration-300 hover:-translate-y-1" style={{ background: P.beige, borderColor: `${P.taupe}80` }}>
              <div className="flex items-start justify-between">
                <GiftIcon />
                <span className="text-[0.63rem] uppercase tracking-[0.17em]" style={{ color: P.burgundy }}>{gift.category}</span>
              </div>
              <div className="mt-auto pt-8">
                <h3 className="font-display text-xl" style={{ color: P.black }}>{gift.title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: P.burgundyDk }}>{gift.description}</p>
                {gift.link && (
                  <a href={gift.link} target="_blank" rel="noreferrer" className="mt-5 inline-block text-xs uppercase tracking-[0.14em] transition-opacity hover:opacity-70" style={{ color: P.burgundy, borderBottom: `1px solid ${P.burgundy}70` }}>
                    View gift ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-9 text-center">
          <p className="font-display italic text-lg" style={{ color: P.burgundy }}>A contribution toward our future together is also deeply appreciated.</p>
        </div>
      </div>
    </section>
  )
}
