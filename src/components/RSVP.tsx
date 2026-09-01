import { useEffect, useMemo, useState } from "react"
import { fetchInvitees, type Invitee, P } from "../data/siteData"

type RSVPForm = {
  code: string
  attendance: string
  message: string
}

const SHEETS_URL = import.meta.env.VITE_SHEETS_WEB_APP_URL as string | undefined

async function submitRSVP(payload: Record<string, string>) {
  if (!SHEETS_URL) {
    return { ok: true, message: "Local demo mode: RSVP saved in memory." }
  }

  const response = await fetch(SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    body: new URLSearchParams(payload),
  })

  // no-cors responses are opaque — we can't read status/body, so we
  // optimistically treat a completed request as success.
  if (response.type === "opaque") {
    return { ok: true, message: "RSVP recorded successfully." }
  }

  const text = await response.text()
  if (!response.ok) {
    throw new Error(text || "Unable to save RSVP right now.")
  }

  return { ok: true, message: text || "RSVP recorded successfully." }
}

export function RSVP() {
  const [invitees, setInvitees] = useState<Invitee[]>([])
  const [isLoadingInvitees, setIsLoadingInvitees] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [form, setForm] = useState<RSVPForm>({ code: "", attendance: "", message: "" })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let active = true

    fetchInvitees()
      .then((loaded) => {
        if (!active) return
        setInvitees(loaded)
        // An empty list with no thrown error usually means the sheet
        // isn't configured/reachable rather than "zero guests exist".
        setLoadFailed(loaded.length === 0)
      })
      .catch(() => {
        if (!active) return
        setInvitees([])
        setLoadFailed(true)
      })
      .finally(() => {
        if (active) setIsLoadingInvitees(false)
      })

    return () => {
      active = false
    }
  }, [])

  const trimmedCode = form.code.trim()

  // Live lookup against the fetched Invitees sheet — this is what
  // gates the rest of the form.
  const matchedInvitee: Invitee | null = useMemo(() => {
    if (!trimmedCode) return null
    return (
      invitees.find(
        (invitee) => invitee.id.toLowerCase() === trimmedCode.toLowerCase(),
      ) ?? null
    )
  }, [invitees, trimmedCode])

  const codeStatus: "empty" | "checking" | "unavailable" | "valid" | "invalid" = isLoadingInvitees
    ? "checking"
    : loadFailed
      ? "unavailable"
      : !trimmedCode
        ? "empty"
        : matchedInvitee
          ? "valid"
          : "invalid"

  const isUnlocked = codeStatus === "valid"

  const handleCodeChange = (value: string) => {
    setErrorMessage("")
    setForm((current) => ({ ...current, code: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (codeStatus === "checking") {
      setErrorMessage("Still loading the guest list — please try again in a moment.")
      return
    }

    if (codeStatus === "unavailable") {
      setErrorMessage("The guest list is unavailable right now. Please try again later.")
      return
    }

    if (!matchedInvitee) {
      setErrorMessage("That code isn't on our guest list. Please double-check your invitation.")
      return
    }

    if (!form.attendance) {
      setErrorMessage("Please let us know if you'll be attending.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await submitRSVP({
        guestId: matchedInvitee.id,
        attendance: form.attendance,
        message: form.message,
      })
      setSubmitted(true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your RSVP right now. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Compact field styling pulled from the site palette (P) instead of
  // the earlier ad-hoc blue/black. Inputs sit on a soft champagne
  // fill with a taupe border, and the CTA uses the burgundy accent.
  const fieldClass =
    "w-full bg-transparent text-[0.95rem] outline-none placeholder:opacity-60"
  const fieldWrapClass =
    "flex items-center h-[48px] rounded-lg px-4 border transition-colors"
  const fieldStyle = {
    background: P.champagne,
    borderColor: P.taupe,
    color: P.black,
  }

  return (
    <section id="rsvp" className="py-16 px-4" style={{ background: P.beige }}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p
            className="font-script text-2xl md:text-3xl italic"
            style={{ color: P.burgundy, letterSpacing: "0.12em" }}
          >
            RSVP
          </p>
          <h2
            className="font-display mt-2"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.05, color: P.black }}
          >
            Join Our Special Day
          </h2>
          <div className="mt-3 flex items-center justify-center gap-3" style={{ color: P.burgundy }}>
            <span className="h-px w-12" style={{ background: P.burgundy }} />
            <span className="text-lg">♡</span>
            <span className="h-px w-12" style={{ background: P.burgundy }} />
          </div>
        </div>

        {submitted ? (
          <div
            className="mx-auto rounded-2xl border px-6 py-10 text-center shadow-sm"
            style={{ background: P.champagne, borderColor: P.taupe }}
          >
            <div className="text-3xl mb-3" style={{ color: P.burgundy }}>
              ♡
            </div>
            <h3 className="font-display text-2xl mb-2" style={{ color: P.black }}>
              Thank you, {matchedInvitee?.name}!
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: P.burgundyDk }}>
              We have received your RSVP and look forward to celebrating with you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto">
            {/* Step 1: guest code — the only thing typed to unlock the form */}
            <div className={fieldWrapClass} style={fieldStyle}>
              <input
                type="text"
                value={form.code}
                onChange={(event) => handleCodeChange(event.target.value)}
                placeholder="Enter your Guest Code"
                className={fieldClass}
                autoComplete="off"
              />
              {codeStatus === "valid" && <span className="text-base" style={{ color: "#2e7d32" }}>✓</span>}
              {codeStatus === "invalid" && <span className="text-base" style={{ color: P.burgundy }}>✕</span>}
            </div>

            {codeStatus === "invalid" && (
              <p className="mt-1.5 text-xs" style={{ color: P.burgundy }}>
                We couldn't find that code. Please check your invitation and try again.
              </p>
            )}

            {codeStatus === "checking" && (
              <p className="mt-1.5 text-xs opacity-60" style={{ color: P.black }}>
                Loading guest list...
              </p>
            )}

            {codeStatus === "unavailable" && (
              <p className="mt-1.5 text-xs" style={{ color: P.burgundy }}>
                We can't load the guest list right now. Please try again shortly.
              </p>
            )}

            {/* Step 2: everything below only opens up once a code matches */}
            <div
              className={`mt-3 space-y-3 transition-opacity ${
                isUnlocked ? "opacity-100" : "pointer-events-none opacity-40"
              }`}
            >
              <div className={fieldWrapClass} style={fieldStyle}>
                <span className="w-full text-[0.95rem]">
                  {matchedInvitee ? matchedInvitee.name : "Guest name will appear here"}
                </span>
              </div>

              <div className={fieldWrapClass} style={fieldStyle}>
                <select
                  value={form.attendance}
                  disabled={!isUnlocked}
                  onChange={(event) => {
                    setErrorMessage("")
                    setForm((current) => ({ ...current, attendance: event.target.value }))
                  }}
                  className={`${fieldClass} appearance-none`}
                >
                  <option value="">Will you attend?</option>
                  <option value="yes">Yes, I will attend</option>
                  <option value="no">No, I can&apos;t attend</option>
                </select>
                <span className="text-base" style={{ color: P.black }}>⌄</span>
              </div>

              <textarea
                value={form.message}
                disabled={!isUnlocked}
                onChange={(event) => {
                  setErrorMessage("")
                  setForm((current) => ({ ...current, message: event.target.value }))
                }}
                placeholder="Message"
                rows={3}
                className="w-full resize-none rounded-lg px-4 py-3 text-[0.9rem] outline-none placeholder:opacity-60 border"
                style={fieldStyle}
              />
            </div>

            {errorMessage && (
              <p className="mt-3 text-xs" style={{ color: P.burgundy }}>
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || !isUnlocked}
                className="w-full rounded-lg px-6 py-3 text-sm font-medium tracking-wide shadow-md transition-opacity hover:opacity-95 disabled:opacity-50"
                style={{ background: P.burgundy, color: P.champagne }}
              >
                {isSubmitting ? "Sending..." : "Submit RSVP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}