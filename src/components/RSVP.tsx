import { useEffect, useMemo, useState } from "react"
import { fetchInvitees, type Invitee, P } from "../data/siteData"

type RSVPForm = {
  code: string
  attendance: string
  attendingGuests: boolean[]
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
  const [form, setForm] = useState<RSVPForm>({
    code: "",
    attendance: "",
    attendingGuests: [],
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let active = true

    fetchInvitees()
      .then((loaded) => {
        if (!active) return
        setInvitees(loaded)
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

  // The sheet is row-based: every person is a row, and people in the same
  // invitation share the same Code. fetchInvitees groups those rows for us.
  const matchedParty = useMemo(() => {
    if (!trimmedCode) return null

    const matchingRows = invitees.filter(
      (invitee) => invitee.id.toLowerCase() === trimmedCode.toLowerCase(),
    )

    return matchingRows.length > 0 ? matchingRows : null
  }, [invitees, trimmedCode])

  const names = matchedParty?.map((invitee) => invitee.name) ?? []
  const isUnlocked = !!matchedParty

  const codeStatus: "empty" | "checking" | "unavailable" | "valid" | "invalid" =
    isLoadingInvitees
      ? "checking"
      : loadFailed
        ? "unavailable"
        : !trimmedCode
          ? "empty"
          : matchedParty
            ? "valid"
            : "invalid"

  useEffect(() => {
    if (matchedParty) {
      setForm((current) => ({
        ...current,
        attendance: "",
        attendingGuests: matchedParty.map(
          (invitee) => invitee.attendance === "yes",
        ),
      }))
    } else {
      setForm((current) => ({
        ...current,
        attendance: "",
        attendingGuests: [],
      }))
    }
  }, [matchedParty])

  const handleCodeChange = (value: string) => {
    setErrorMessage("")
    setSubmitted(false)
    setForm((current) => ({ ...current, code: value }))
  }

  const toggleGuest = (index: number) => {
    setErrorMessage("")

    setForm((current) => {
      const attendingGuests = [...current.attendingGuests]
      attendingGuests[index] = !attendingGuests[index]

      return {
        ...current,
        attendance: attendingGuests.some(Boolean) ? "yes" : "",
        attendingGuests,
      }
    })
  }

  const handleAttendanceChange = (value: string) => {
    setErrorMessage("")

    setForm((current) => ({
      ...current,
      attendance: value,
      attendingGuests:
        value === "no"
          ? current.attendingGuests.map(() => false)
          : current.attendingGuests,
    }))
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

    if (!matchedParty) {
      setErrorMessage("That code isn't on our guest list. Please double-check your invitation.")
      return
    }

    if (!form.attendance) {
      setErrorMessage("Please let us know who will be attending.")
      return
    }

    if (
      form.attendance === "yes" &&
      !form.attendingGuests.some(Boolean)
    ) {
      setErrorMessage("Please check off at least one guest who will be attending.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await submitRSVP({
        guestId: matchedParty[0].id,
        attendance: form.attendance,
        attendingGuests: JSON.stringify(
          matchedParty.map((invitee, index) => ({
            name: invitee.name,
            email: invitee.email,
            attending:
              form.attendance === "yes" && !!form.attendingGuests[index],
          })),
        ),
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

  const fieldClass =
    "w-full bg-transparent text-[0.95rem] outline-none placeholder:opacity-60"
  const fieldWrapClass =
    "flex items-center min-h-[48px] rounded-lg px-4 border transition-colors"
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
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              lineHeight: 1.05,
              color: P.black,
            }}
          >
            Join Our Special Day
          </h2>
          <div
            className="mt-3 flex items-center justify-center gap-3"
            style={{ color: P.burgundy }}
          >
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
            <h3
              className="font-display text-2xl mb-2"
              style={{ color: P.black }}
            >
              Thank you, {names[0] ?? "Guest"}!
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: P.burgundyDk }}
            >
              {form.attendance === "yes"
                ? "We've saved your RSVP and look forward to celebrating with you."
                : "We've received your response and are sorry you can't make it."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto">
            <div className={fieldWrapClass} style={fieldStyle}>
              <input
                type="text"
                value={form.code}
                onChange={(event) => handleCodeChange(event.target.value)}
                placeholder="Enter your Guest Code"
                className={fieldClass}
                autoComplete="off"
              />
              {codeStatus === "valid" && (
                <span className="text-base" style={{ color: "#2e7d32" }}>
                  ✓
                </span>
              )}
              {codeStatus === "invalid" && (
                <span className="text-base" style={{ color: P.burgundy }}>
                  ✕
                </span>
              )}
            </div>

            {codeStatus === "invalid" && (
              <p className="mt-1.5 text-xs" style={{ color: P.burgundy }}>
                We couldn't find that code. Please check your invitation and try again.
              </p>
            )}

            {codeStatus === "checking" && (
              <p
                className="mt-1.5 text-xs opacity-60"
                style={{ color: P.black }}
              >
                Loading guest list...
              </p>
            )}

            {codeStatus === "unavailable" && (
              <p className="mt-1.5 text-xs" style={{ color: P.burgundy }}>
                We can't load the guest list right now. Please try again shortly.
              </p>
            )}

            <div
              className={`mt-3 space-y-3 transition-opacity ${
                isUnlocked
                  ? "opacity-100"
                  : "pointer-events-none opacity-40"
              }`}
            >
              <div
                className="rounded-lg border px-4 py-3"
                style={fieldStyle}
              >
                <p
                  className="mb-2 text-xs uppercase tracking-[0.12em]"
                  style={{ color: P.burgundyDk }}
                >
                  Guests
                </p>

                {matchedParty ? (
                  <div className="space-y-1">
                    {matchedParty.map((invitee, index) => (
                      <label
                        key={`${invitee.id}-${index}-${invitee.name}`}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={!!form.attendingGuests[index]}
                          disabled={!isUnlocked || form.attendance === "no"}
                          onChange={() => toggleGuest(index)}
                          className="h-4 w-4"
                        />
                        <span className="text-[0.95rem]">
                          {invitee.name}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <span className="text-[0.95rem]">
                    Guest names will appear here
                  </span>
                )}
              </div>

              <div className={fieldWrapClass} style={fieldStyle}>
                <select
                  value={form.attendance}
                  disabled={!isUnlocked}
                  onChange={(event) =>
                    handleAttendanceChange(event.target.value)
                  }
                  className={`${fieldClass} appearance-none`}
                >
                  <option value="">Will you attend?</option>
                  <option value="yes">Yes, we will attend</option>
                  <option value="no">No, we can't attend</option>
                </select>
                <span className="text-base" style={{ color: P.black }}>
                  ⌄
                </span>
              </div>

              {matchedParty && matchedParty.length > 1 && form.attendance === "yes" && (
                <p className="text-xs" style={{ color: P.burgundyDk }}>
                  Please check the names of everyone who will be attending.
                </p>
              )}

              <textarea
                value={form.message}
                disabled={!isUnlocked}
                onChange={(event) => {
                  setErrorMessage("")
                  setForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
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
                style={{
                  background: P.burgundy,
                  color: P.champagne,
                }}
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
