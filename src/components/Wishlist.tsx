import { useEffect, useState } from "react"
import { fetchWishlist, P, type GiftPreference } from "../data/siteData"
import { Loader } from "./Loader"

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


function GiftIcon() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full border" style={{ borderColor: `${P.rosewoodPink}55`, color: P.rosewoodPink }} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-5 w-5">
        <path d="M3.5 10h17v10h-17zM2.5 6.5h19v3.5h-19zM12 6.5V20M12 6.5H8.7A2.2 2.2 0 1 1 12 3.8v2.7Zm0 0h3.3a2.2 2.2 0 1 0-3.3-2.7v2.7Z" />
      </svg>
    </span>
  )
}

function MoneyIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full border" style={{ borderColor: `${P.rosewoodPink}55`, color: P.rosewoodPink }} aria-hidden="true">
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
  const [gifts, setGifts] = useState<GiftPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGift, setSelectedGift] = useState<GiftPreference | null>(null)
  const [reservedGiftIds, setReservedGiftIds] = useState<Set<string>>(new Set())
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false)
  const [reservationError, setReservationError] = useState("")
  const [reservationSuccess, setReservationSuccess] = useState("")
  const [reservationForm, setReservationForm] = useState({
    guestName: "",
    guestEmail: "",
    message: "",
  })
  // Tracks gift ids whose QR image failed to load, so a bad/misconfigured
  // link shows a clear message instead of a broken-image icon.
  const [brokenQr, setBrokenQr] = useState<Record<string, boolean>>({})
  const markQrBroken = (id: string) => setBrokenQr((current) => ({ ...current, [id]: true }))

  useEffect(() => {
    let active = true

    fetchWishlist()
      .then((loaded) => {
        if (!active) return
        if (loaded.length) {
          setGifts(loaded)
          setReservedGiftIds(
            new Set(loaded.filter((gift) => gift.reserved).map((gift) => gift.id)),
          )
        }
      })
      .catch(() => {
        // Leave gifts empty if unavailable.
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const monetaryGifts = gifts.filter(isMonetaryGift)
  const registryGifts = gifts.filter((gift) => !isMonetaryGift(gift))

  const openReservation = (gift: GiftPreference) => {
    if (reservedGiftIds.has(gift.id)) return
    setReservationError("")
    setReservationSuccess("")
    setReservationForm({ guestName: "", guestEmail: "", message: "" })
    setSelectedGift(gift)
  }

  const closeReservation = () => {
    if (isSubmittingReservation) return
    setSelectedGift(null)
    setReservationError("")
  }

  const submitReservation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedGift) return

    if (!SHEETS_URL) {
      setReservationError("Gift reservations are not connected yet. Please contact the couple.")
      return
    }

    setIsSubmittingReservation(true)
    setReservationError("")

    try {
      const response = await fetch(SHEETS_URL, {
        method: "POST",
        body: new URLSearchParams({
          action: "reserve-gift",
          giftId: selectedGift.id,
          giftTitle: selectedGift.title,
          guestName: reservationForm.guestName.trim(),
          guestEmail: reservationForm.guestEmail.trim(),
          message: reservationForm.message.trim(),
        }),
      })
      const payload = (await response.json()) as { ok?: boolean; message?: string }

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.message || "Unable to reserve this gift right now.")
      }

      setReservedGiftIds((current) => new Set(current).add(selectedGift.id))
      setReservationSuccess(`${selectedGift.title} is reserved. Thank you!`)
      setSelectedGift(null)
    } catch (error) {
      setReservationError(
        error instanceof Error
          ? error.message
          : "Unable to reserve this gift right now. Please try again.",
      )
    } finally {
      setIsSubmittingReservation(false)
    }
  }

  return (
    <section id="wishlist" className="px-4 py-24" style={{ background: P.champagne }}>
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.14em]" style={{ color: P.rosewoodPink }}>
            With grateful hearts
          </p>
          <h2 className="font-display mt-2 text-4xl md:text-5xl" style={{ color: P.black }}>
            Gift Preferences
          </h2>
          <div className="soft-divider mx-auto mt-5 max-w-48" />
          <p className="mt-6 text-sm leading-7" style={{ color: P.rosewoodPinkDk }}>
            Your presence is the greatest gift. For those who have asked, these are a few things that would help us begin our next chapter together.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-12">
            <Loader label="Loading gift preferences" />
          </div>
        ) : (
          <>
            {registryGifts.length > 0 && (
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {registryGifts.map((gift) => {
                  const isReserved = reservedGiftIds.has(gift.id)

                  return (
              <article
                key={gift.id}
                role="button"
                tabIndex={isReserved ? -1 : 0}
                aria-disabled={isReserved}
                onClick={() => openReservation(gift)}
                onKeyDown={(event) => {
                  if (!isReserved && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault()
                    openReservation(gift)
                  }
                }}
                className={`group flex min-h-64 flex-col rounded-sm border p-6 transition-transform duration-300 ${isReserved ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:-translate-y-1"}`}
                style={{ background: P.beige, borderColor: `${P.taupe}80` }}
              >
                <div className="flex items-start justify-between">
                  <GiftIcon />
                  <span className="text-right text-[0.63rem] uppercase tracking-[0.17em]" style={{ color: isReserved ? P.taupe : P.rosewoodPink }}>
                    {isReserved ? "Reserved" : gift.category}
                  </span>
                </div>
                <div className="mt-auto pt-8">
                  <h3 className="text-base font-semibold tracking-wide" style={{ color: P.black }}>{gift.title}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: P.rosewoodPinkDk }}>{gift.description}</p>
                  <p className="mt-5 text-xs uppercase tracking-[0.14em]" style={{ color: isReserved ? P.taupe : P.rosewoodPink }}>
                    {isReserved ? "Thank you for reserving this gift" : "Click to reserve"}
                  </p>
                  {gift.qrCode && !brokenQr[gift.id] && (
                    <div
                      className="mx-auto mt-5 w-full max-w-[140px] overflow-hidden rounded-lg shadow-sm"
                      style={{ background: "white" }}
                    >
                      <img
                        src={qrImageUrl(gift.qrCode)}
                        alt={`QR code for ${gift.title}`}
                        className="block h-auto w-full"
                        onError={() => markQrBroken(gift.id)}
                      />
                    </div>
                  )}
                  {gift.qrCode && !brokenQr[gift.id] && (
                    <p className="mt-2 text-center text-[0.6rem] uppercase tracking-[0.14em]" style={{ color: P.rosewoodPinkDk }}>
                      Scan to send a gift
                    </p>
                  )}
                  {gift.qrCode && brokenQr[gift.id] && (
                    <p className="mt-5 text-xs italic" style={{ color: P.rosewoodPinkDk }}>
                      QR code unavailable — check the sharing settings on the linked image.
                    </p>
                  )}
                  {gift.link && (
                    <a href={externalUrl(gift.link)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="mt-5 inline-block text-xs uppercase tracking-[0.14em] transition-opacity hover:opacity-70" style={{ color: P.rosewoodPink, borderBottom: `1px solid ${P.rosewoodPink}70` }}>
                      View gift ↗
                    </a>
                  )}
                </div>
              </article>
                  )
                })}
          </div>
        )}

        {/* Featured monetary-gift QR section — pulled out of the regular
            grid so the QR code is large enough to scan comfortably, and
            labeled with its own subheading so it reads as a distinct group.
            Placed after the regular gift grid intentionally. */}
        {monetaryGifts.length > 0 && (
          <>
            <div className="mx-auto mt-16 max-w-2xl text-center">
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: P.rosewoodPink }}>
                For Monetary Gifts
              </p>
              <div className="soft-divider mx-auto mt-3 max-w-24" />
              <p className="mt-6 text-sm leading-7" style={{ color: P.rosewoodPinkDk }}>
                While our unofficial theme song is... "How do I live without you," we'd still need the practicals of everyday life! We'd gladly accept monetary gifts as we learn the beautiful art of living together. Your generosity will help us build our little home, stock our fridge, and fund important married-life essentials... like rice, dishwashing liquid, and the occasional Grab delivery on days when "what's for dinner?" becomes a serious discussion.
              </p>
            </div>

            <div className={`mx-auto mt-8 grid max-w-4xl gap-6 ${monetaryGifts.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {monetaryGifts.map((gift) => (
                <article
                  key={gift.id}
                  className="flex flex-col items-center rounded-xl border p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1 sm:p-8"
                  style={{ background: P.beige, borderColor: `${P.taupe}50` }}
                >
                  <MoneyIcon />
                  <h3 className="font-display mt-3 text-2xl" style={{ color: P.black }}>
                    {gift.title}
                  </h3>
                  {gift.description && (
                    <p className="mt-2 text-sm leading-6" style={{ color: P.rosewoodPinkDk }}>
                      {gift.description}
                    </p>
                  )}

                  {gift.qrCode && !brokenQr[gift.id] ? (
                    // No fixed square crop here — bank/e-wallet QR screenshots
                    // rarely come pre-cropped to a perfect square, so this
                    // scales the image's own natural aspect ratio instead of
                    // letterboxing it. A capped width keeps it from
                    // overwhelming the card on any screen size.
                    <div
                      className="mt-6 w-full max-w-[220px] overflow-hidden rounded-lg shadow-md sm:max-w-[260px]"
                      style={{ background: "white" }}
                    >
                      <img
                        src={qrImageUrl(gift.qrCode)}
                        alt={`QR code for ${gift.title}`}
                        className="block h-auto w-full"
                        onError={() => markQrBroken(gift.id)}
                      />
                    </div>
                  ) : gift.qrCode ? (
                    <p className="mt-6 text-xs italic" style={{ color: P.rosewoodPinkDk }}>
                      QR code unavailable — check the sharing settings on the linked image.
                    </p>
                  ) : (
                    <p className="mt-6 text-xs italic" style={{ color: P.rosewoodPinkDk }}>
                      QR code coming soon.
                    </p>
                  )}

                  <p className="mt-4 text-[0.65rem] uppercase tracking-[0.14em]" style={{ color: P.rosewoodPinkDk }}>
                    Scan to send a gift
                  </p>
                </article>
              ))}
            </div>
          </>
        )}

        {registryGifts.length === 0 && monetaryGifts.length === 0 && (
          <p className="mt-12 text-center text-sm italic" style={{ color: P.rosewoodPinkDk }}>
            Gift preferences are on their way — thank you for your patience.
          </p>
        )}
          </>
        )}

        {reservationSuccess && (
          <p className="mt-5 text-center text-sm" style={{ color: P.rosewoodPink }} role="status">
            {reservationSuccess}
          </p>
        )}
      </div>

      {selectedGift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReservation()
          }}
        >
          <div
            className="max-h-full w-full max-w-lg overflow-y-auto rounded-sm border p-7 shadow-2xl sm:p-9"
            style={{ background: P.beige, borderColor: `${P.taupe}80` }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-reservation-title"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.16em]" style={{ color: P.taupe }}>
                  Gift reservation
                </p>
                <h2 id="gift-reservation-title" className="font-display mt-2 text-3xl" style={{ color: P.black }}>
                  {selectedGift.title}
                </h2>
              </div>
              <button type="button" onClick={closeReservation} className="text-2xl leading-none" style={{ color: P.rosewoodPink }} aria-label="Close gift reservation form">
                &times;
              </button>
            </div>

            <p className="mt-5 text-sm leading-6" style={{ color: P.rosewoodPinkDk }}>
              Let us know who is reserving this gift. We will mark it as reserved for the couple.
            </p>

            <form className="mt-7 space-y-5" onSubmit={submitReservation}>
              <label className="block text-sm" style={{ color: P.rosewoodPinkDk }}>
                Your name
                <input
                  required
                  type="text"
                  value={reservationForm.guestName}
                  onChange={(event) => setReservationForm((current) => ({ ...current, guestName: event.target.value }))}
                  className="rsvp-input mt-2"
                  style={{ color: P.black, borderColor: `${P.taupe}80` }}
                />
              </label>
              <label className="block text-sm" style={{ color: P.rosewoodPinkDk }}>
                Email address
                <input
                  required
                  type="email"
                  value={reservationForm.guestEmail}
                  onChange={(event) => setReservationForm((current) => ({ ...current, guestEmail: event.target.value }))}
                  className="rsvp-input mt-2"
                  style={{ color: P.black, borderColor: `${P.taupe}80` }}
                />
              </label>
              <label className="block text-sm" style={{ color: P.rosewoodPinkDk }}>
                Note <span className="text-xs opacity-70">(optional)</span>
                <textarea
                  rows={3}
                  value={reservationForm.message}
                  onChange={(event) => setReservationForm((current) => ({ ...current, message: event.target.value }))}
                  className="rsvp-input mt-2 resize-y"
                  style={{ color: P.black, borderColor: `${P.taupe}80` }}
                />
              </label>

              {reservationError && (
                <p className="text-sm" style={{ color: P.rosewoodPink }} role="alert">
                  {reservationError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmittingReservation}
                className="w-full border px-5 py-3 text-xs uppercase tracking-[0.16em] transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-50"
                style={{ background: P.rosewoodPink, borderColor: P.rosewoodPink, color: P.champagne }}
              >
                {isSubmittingReservation ? "Reserving..." : "Reserve this gift"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}