import { useEffect, useState } from "react"
import { ENTOURAGE, P, type EntourageMember } from "../data/siteData"

const SHEETS_URL = import.meta.env.VITE_SHEETS_WEB_APP_URL as string | undefined

function normalizeMember(raw: Record<string, unknown>): EntourageMember | null {
  const name = String(raw.name ?? "").trim()
  if (!name) return null

  return {
    name,
    role: String(raw.role ?? "").trim(),
  }
}

export function Entourage() {
  const [people, setPeople] = useState(ENTOURAGE)

  useEffect(() => {
    if (!SHEETS_URL) return

    fetch(`${SHEETS_URL}?action=entourage`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        const rows = Array.isArray((payload as { entourage?: unknown[] })?.entourage)
          ? (payload as { entourage: unknown[] }).entourage
          : []
        const loaded = rows
          .map((item) => typeof item === "object" && item ? normalizeMember(item as Record<string, unknown>) : null)
          .filter((item): item is EntourageMember => item !== null)
        if (loaded.length) setPeople(loaded)
      })
      .catch(() => {
        // Keep the local fallback if the sheet cannot be reached.
      })
  }, [])

  const roles = Array.from(new Set(people.map((person) => person.role || "Wedding Party")))

  if (!roles.length) return null

  return (
    <section
      id="entourage"
      className="py-28 px-4"
      style={{ background: P.beige }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="font-script italic text-lg mb-2"
            style={{ color: P.taupe, letterSpacing: "0.25em" }}
          >
            Meet the people who cheer us on
          </p>
          <h2
            className="font-display text-5xl md:text-6xl"
            style={{ color: P.burgundy }}
          >
            Entourage
          </h2>
          <div className="mt-4 flex justify-center">
            <div
              className="h-px w-24"
              style={{
                background: `linear-gradient(to right, transparent, ${P.pink}, transparent)`,
              }}
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role}
              className="rounded-sm p-6"
              style={{
                background: "rgba(255,255,255,0.22)",
                border: `1px solid ${P.pink}40`,
              }}
            >
              <p
                className="font-display text-3xl mb-5 text-center"
                style={{ color: P.burgundy }}
              >
                {role}
              </p>

              <div className="space-y-2 text-center">
                {people
                  .filter((person) => (person.role || "Wedding Party") === role)
                  .map((person) => (
                    <p key={person.name} className="text-base font-normal tracking-wide" style={{ color: P.black }}>
                      {person.name}
                    </p>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
