import { DETAILS, P } from "../data/siteData"

export function Details() {
  return (
    <section
      id="details"
      className="py-28 px-4"
      style={{ background: P.burgundy }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="font-script italic text-lg mb-2"
            style={{ color: P.champagne, letterSpacing: "0.25em" }}
          >
            Mark your calendar
          </p>
          <h2 className="font-display text-white text-5xl md:text-6xl">
            Wedding Details
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

        <div className="grid sm:grid-cols-2 gap-6">
          {DETAILS.map((d) => (
            <div
              key={d.label}
              className="text-center p-8 transition-colors"
              style={{
                border: `1px solid ${P.pink}30`,
                background: "rgba(196,144,144,0.08)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.border = `1px solid ${P.pink}60`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.border = `1px solid ${P.pink}30`)
              }
            >
              <div
                className="text-3xl mb-4 font-display"
                style={{ color: P.pink }}
              >
                {d.icon}
              </div>
              <p
                className="text-xs tracking-[0.25em] uppercase mb-4"
                style={{ color: P.pink }}
              >
                {d.label}
              </p>
              <div
                className="h-px mb-4 mx-6"
                style={{ background: `${P.pink}30` }}
              />
              <p className="font-display text-white text-sm leading-loose">
                {d.line1}
              </p>
              <p
                className="font-display italic text-base mt-1"
                style={{ color: P.champagne }}
              >
                {d.line2}
              </p>
              <p className="text-xs mt-2 tracking-wide text-white/50">
                {d.line3}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mt-10 p-6 text-center"
          style={{ border: `1px solid ${P.pink}30` }}
        >
          <p
            className="text-xs tracking-[0.2em] uppercase mb-2"
            style={{ color: `${P.pink}99` }}
          >
            Location
          </p>
          <p className="font-display text-white/80 text-sm">
            Fruella’s Events Place Tagaytay
          </p>
          <a
            href="https://www.google.com/maps/place/Fruella's+Events+Venue+Tagaytay/@14.1327979,120.9289331,17z/data=!3m1!4b1!4m6!3m5!1s0x33bd796d1fd7f119:0x5fccd52277bc6f1!8m2!3d14.1327979!4d120.931508!16s%2Fg%2F11v0gyk507?entry=ttu&g_ep=EgoyMDI2MDgyNi4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-4 text-xs tracking-[0.2em] uppercase pb-0.5 transition-colors"
            style={{ color: P.pink, borderBottom: `1px solid ${P.pink}40` }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderBottomColor = P.pink)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderBottomColor = `${P.pink}40`)
            }
          >
            View on Google Maps →
          </a>
        </div>
      </div>
    </section>
  )
}
