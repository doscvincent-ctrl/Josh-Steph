import { useEffect, useState } from "react"
import { fetchEntourage, P, type EntourageMember } from "../data/siteData"
import { Loader } from "./Loader"

export function Entourage() {
  const [people, setPeople] = useState<EntourageMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchEntourage()
      .then((loaded) => {
        if (active && loaded.length) setPeople(loaded)
      })
      .catch(() => {
        // Leave the entourage empty if the sheet cannot be reached.
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])


  const roles = Array.from(new Set(people.map((person) => person.role || "Wedding Party")))

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

        {isLoading ? (
          <Loader label="Loading entourage" />
        ) : roles.length > 0 ? (
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
        ) : (
          <p
            className="text-center text-sm italic"
            style={{ color: `${P.black}88` }}
          >
            Our wedding party details are coming soon.
          </p>
        )}
      </div>
    </section>
  )
}
