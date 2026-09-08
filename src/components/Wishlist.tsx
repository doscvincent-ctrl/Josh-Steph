import { useEffect, useState } from "react"
import { GIFT_PREFERENCES, P, type GiftPreference } from "../data/siteData"

// Gifts share the same Google Apps Script web app and spreadsheet as RSVP.
const SHEETS_URL = import.meta.env.VITE_SHEETS_WEB_APP_URL as string | undefined

// A gift row is treated as a "monetary gift" (GCash, bank transfer, etc.)
// purely by its Category text — no sheet schema change needed. In the
// Wishlist sheet, set that row's Category to something containing
// "monetary" or "cash" (e.g. "Monetary Gift", "Cash Gift") and it will
// automatically render in the featured QR section below instead of the
// regular gift grid.
function isMonetaryGift(gift: GiftPreference) {
  return /monetary|cash/i.test(gift.category)
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
    qrCode: String(
      raw.qrCode ?? raw.qrcode ?? raw.qr_code ?? raw["QR Code"] ?? "",
    ),
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

function MoneyIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border" style={{ borderColor: `${P.burgundy}55`, color: P.burgundy }} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-6 w-6">
        <rect x="2.5" y="6" width="19" height="12" rx="1.6" />
        <circle cx="12" cy="12" r="2.6" />
        <path d="M5.5 8.5v0M18.5 15.5v0" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function externalUrl(link: string) {
  const trimmed = link.trim()
  if (!trimmed) return ""

  return /^https?:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`
}

function qrImageUrl(link: string) {
  const url = externalUrl(link)

  // Recognize the common Google Drive share-link shapes:
  //   .../file/d/FILE_ID/view
  //   .../open?id=FILE_ID
  //   ...?id=FILE_ID  (already a uc/thumbnail-style link)
  const fileIdMatch =
    url.match(/drive\.google\.com\/file\/d\/([^/?]+)/i) ||
    url.match(/drive\.google\.com\/open\?id=([^&]+)/i) ||
    url.match(/[?&]id=([^&]+)/i)

  const fileId = fileIdMatch ? fileIdMatch[1] : null

  // The "thumbnail" endpoint embeds far more reliably than "uc?export=view",
  // which Google has been known to block for hotlinked <img> tags.
  return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : url
}

export function Wishlist() {
  const [gifts, setGifts] = useState(GIFT_PREFERENCES)
  // Tracks gift ids whose QR image failed to load, so a bad/misconfigured
  // link shows a clear message instead of a broken-image icon.
  const [brokenQr, setBrokenQr] = useState<Record<string, boolean>>({})
  const markQrBroken = (id: string) => setBrokenQr((current) => ({ ...current, [id]: true }))

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

  const monetaryGifts = gifts.filter(isMonetaryGift)
  const registryGifts = gifts.filter((gift) => !isMonetaryGift(gift))

  return (
    <section id="wishlist" className="px-4 py-24" style={{ background: P.champagne }}>
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.14em]" style={{ color: P.burgundy }}>
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

        {/* Featured monetary-gift QR section — pulled out of the regular
            grid so the QR code is large enough to scan comfortably, and
            labeled with its own subheading so it reads as a distinct group. */}
        {monetaryGifts.length > 0 && (
          <>
            <div className="mx-auto mt-14 max-w-2xl text-center">
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: P.burgundy }}>
                For Monetary Gifts
              </p>
              <div className="soft-divider mx-auto mt-3 max-w-24" />
            </div>

            <div className={`mx-auto mt-8 grid max-w-3xl gap-5 ${monetaryGifts.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {monetaryGifts.map((gift) => (
                <article
                  key={gift.id}
                  className="flex flex-col items-center rounded-sm border p-8 text-center"
                  style={{ background: P.beige, borderColor: `${P.taupe}80` }}
                >
                  <MoneyIcon />
                  <span className="mt-4 text-[0.63rem] uppercase tracking-[0.17em]" style={{ color: P.burgundy }}>
                    {gift.category}
                  </span>
                  <h3 className="font-display mt-2 text-2xl" style={{ color: P.black }}>
                    {gift.title}
                  </h3>
                  {gift.description && (
                    <p className="mt-2 text-sm leading-6" style={{ color: P.burgundyDk }}>
                      {gift.description}
                    </p>
                  )}

                  {gift.qrCode && !brokenQr[gift.id] ? (
                    <div className="mt-6 border p-3" style={{ background: "white", borderColor: `${P.taupe}80` }}>
                      <img
                        src={qrImageUrl(gift.qrCode)}
                        alt={`QR code for ${gift.title}`}
                        className="mx-auto aspect-square w-48 object-contain"
                        onError={() => markQrBroken(gift.id)}
                      />
                    </div>
                  ) : gift.qrCode ? (
                    <p className="mt-6 text-xs italic" style={{ color: P.burgundyDk }}>
                      QR code unavailable — check the sharing settings on the linked image.
                    </p>
                  ) : (
                    <p className="mt-6 text-xs italic" style={{ color: P.burgundyDk }}>
                      QR code coming soon.
                    </p>
                  )}

                  <p className="mt-3 text-[0.65rem] uppercase tracking-[0.14em]" style={{ color: P.burgundyDk }}>
                    Scan to send a gift
                  </p>

                  {gift.link && (
                    <a
                      href={externalUrl(gift.link)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block text-xs uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
                      style={{ color: P.burgundy, borderBottom: `1px solid ${P.burgundy}70` }}
                    >
                      View details ↗
                    </a>
                  )}
                </article>
              ))}
            </div>
          </>
        )}

        {registryGifts.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {registryGifts.map((gift) => (
              <article key={gift.id} className="group flex min-h-64 flex-col rounded-sm border p-6 transition-transform duration-300 hover:-translate-y-1" style={{ background: P.beige, borderColor: `${P.taupe}80` }}>
                <div className="flex items-start justify-between">
                  <GiftIcon />
                  <span className="text-[0.63rem] uppercase tracking-[0.17em]" style={{ color: P.burgundy }}>{gift.category}</span>
                </div>
                <div className="mt-auto pt-8">
                  <h3 className="text-base font-semibold tracking-wide" style={{ color: P.black }}>{gift.title}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: P.burgundyDk }}>{gift.description}</p>
                  {gift.qrCode && !brokenQr[gift.id] && (
                    <div className="mt-5 border p-2" style={{ background: "white", borderColor: `${P.taupe}80` }}>
                      <img
                        src={qrImageUrl(gift.qrCode)}
                        alt={`QR code for ${gift.title}`}
                        className="mx-auto aspect-square w-32 object-contain"
                        onError={() => markQrBroken(gift.id)}
                      />
                      <p className="mt-2 text-center text-[0.6rem] uppercase tracking-[0.14em]" style={{ color: P.burgundyDk }}>
                        Scan to send a gift
                      </p>
                    </div>
                  )}
                  {gift.qrCode && brokenQr[gift.id] && (
                    <p className="mt-5 text-xs italic" style={{ color: P.burgundyDk }}>
                      QR code unavailable — check the sharing settings on the linked image.
                    </p>
                  )}
                  {gift.link && (
                    <a href={externalUrl(gift.link)} target="_blank" rel="noreferrer" className="mt-5 inline-block text-xs uppercase tracking-[0.14em] transition-opacity hover:opacity-70" style={{ color: P.burgundy, borderBottom: `1px solid ${P.burgundy}70` }}>
                      View gift ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-9 text-center">
          <p className="text-sm italic" style={{ color: P.burgundy }}>A contribution toward our future together is also deeply appreciated.</p>
        </div>
      </div>
    </section>
  )
}