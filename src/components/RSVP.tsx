import { useState } from "react"
import { P } from "../data/siteData"

type RSVPForm = {
  name: string
  email: string
  guests: string
  attendance: string
  meal: string
  message: string
}

const SHEETS_URL = import.meta.env.VITE_SHEETS_WEB_APP_URL as string | undefined

async function submitRSVP(form: RSVPForm) {
  const payload = {
    ...form,
    createdAt: new Date().toISOString(),
    guestCount: Number(form.guests || 0),
  }

  if (!SHEETS_URL) {
    return { ok: true, message: "Local demo mode: RSVP saved in memory." }
  }

  const body = new URLSearchParams({
    ...payload,
    guestCount: String(payload.guestCount),
  })

  const response = await fetch(SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  })

  if (response.type === "opaque") {
    return {
      ok: true,
      message: "RSVP recorded successfully.",
    }
  }

  const text = await response.text()

  if (!response.ok) {
    throw new Error(text || "Unable to save RSVP right now.")
  }

  return {
    ok: true,
    message: text || "RSVP recorded successfully.",
  }
}

export function RSVP() {
  const [form, setForm] = useState<RSVPForm>({
    name: "",
    email: "",
    guests: "1",
    attendance: "",
    meal: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const set =
    (field: keyof RSVPForm) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      setErrorMessage("")
      setForm((f) => ({ ...f, [field]: e.target.value }))
    }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await submitRSVP(form)
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

  return (
    <section
      id="rsvp"
      className="py-28 px-4 relative overflow-hidden"
      style={{ background: P.burgundyDk }}
    >
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
        style={{ background: P.pink }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-10"
        style={{ background: P.pink }}
      />

      <div className="max-w-xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <p
            className="font-script italic text-lg mb-2"
            style={{ color: P.champagne, letterSpacing: "0.25em" }}
          >
            You&apos;re invited
          </p>
          <h2 className="font-display text-white text-5xl md:text-6xl">RSVP</h2>
          <div className="mt-4 flex justify-center">
            <div
              className="h-px w-24"
              style={{
                background: `linear-gradient(to right, transparent, ${P.pink}, transparent)`,
              }}
            />
          </div>
          <p className="text-white/55 text-sm mt-4 tracking-wide">
            Please respond by January 5, 2027
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-16">
            <div
              className="text-5xl font-display mb-4"
              style={{ color: P.pink }}
            >
              ♡
            </div>
            <h3 className="font-display text-white text-3xl mb-3">
              Thank you, {form.name}!
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              We have received your RSVP and can&apos;t wait to celebrate with
              you.
              <br />A confirmation email has been sent to {form.email}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: P.champagne }}
                >
                  Full Name *
                </label>
                <input
                  className="rsvp-input"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={set("name")}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: P.champagne }}
                >
                  Email Address *
                </label>
                <input
                  className="rsvp-input"
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={set("email")}
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: P.champagne }}
                >
                  Attendance *
                </label>
                <select
                  className="rsvp-input rsvp-select"
                  value={form.attendance}
                  onChange={set("attendance")}
                  required
                >
                  <option value="">Please select</option>
                  <option value="yes">Joyfully accepts</option>
                  <option value="no">Regretfully declines</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: P.champagne }}
                >
                  Number of Guests
                </label>
                <select
                  className="rsvp-input rsvp-select"
                  value={form.guests}
                  onChange={set("guests")}
                >
                  {["1", "2", "3", "4"].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === "1" ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: P.champagne }}
              >
                Meal Preference
              </label>
              <select
                className="rsvp-input rsvp-select"
                value={form.meal}
                onChange={set("meal")}
              >
                <option value="">Select preference</option>
                <option value="beef">Braised Beef Tenderloin</option>
                <option value="fish">Pan-Seared Sea Bass</option>
                <option value="veg">Roasted Vegetable Wellington</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: P.champagne }}
              >
                Message to the Couple
              </label>
              <textarea
                className="rsvp-input resize-none"
                rows={3}
                placeholder="Share your wishes, dietary restrictions, or a special note..."
                value={form.message}
                onChange={set("message")}
              />
            </div>

            {errorMessage && (
              <p className="text-xs tracking-[0.12em] text-[#f8c8c8]">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 py-4 text-xs tracking-[0.3em] uppercase font-bold transition-all duration-300 disabled:opacity-60"
              style={{ background: P.pink, color: P.burgundy }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = P.taupe
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = P.pink
              }}
            >
              {isSubmitting ? "Sending..." : "Send RSVP"}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
