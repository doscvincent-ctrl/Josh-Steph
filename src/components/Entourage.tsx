import { useEffect, useState } from "react"
import { ENTOURAGE, P, type EntourageMember } from "../data/siteData"

const SHEETS_URL = import.meta.env.VITE_SHEETS_WEB_APP_URL as string | undefined

const GROUP_ORDER = ["Bridesmaids", "Groomsmen", "Family", "Support Team"]

function normalizeMember(raw: Record<string, unknown>): EntourageMember | null {
  const name = String(raw.name ?? "").trim()
  if (!name) return null

  return {
    name,
    role: String(raw.role ?? "").trim(),
    group: String(raw.group ?? "Support Team").trim(),
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

  const orderedGroups = [...GROUP_ORDER, ...people.map((person) => person.group).filter((group) => !GROUP_ORDER.includes(group))]
  const groups = orderedGroups
    .map((label) => ({ label, people: people.filter((person) => person.group === label) }))
    .filter((group) => group.people.length > 0)

  if (!groups.length) return null

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

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {groups.map((group) => (
            <div
              key={group.label}
              className="rounded-sm p-6"
              style={{
                background: "rgba(255,255,255,0.22)",
                border: `1px solid ${P.pink}40`,
              }}
            >
              <p
                className="text-xs tracking-[0.22em] uppercase mb-5 text-center"
                style={{ color: P.burgundy }}
              >
                {group.label}
              </p>

              <div className="space-y-4">
                {group.people.map((person) => (
                  <div key={person.name} className="text-center">
                    <p
                      className="font-display text-xl"
                      style={{ color: P.burgundy }}
                    >
                      {person.name}
                    </p>
                    <p
                      className="text-xs uppercase tracking-[0.18em] mt-1"
                      style={{ color: P.taupe }}
                    >
                      {person.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
