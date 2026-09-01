import { useEffect, useState } from "react"
import { COUPLE_PHOTOS, P } from "../data/siteData"

const heroPhoto = COUPLE_PHOTOS[2].src

function useCountdown(targetDate: string) {
  const calc = () => {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    }
  }

  const [time, setTime] = useState(calc)

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  })

  return time
}

export function Hero() {
  const { days, hours, minutes, seconds } = useCountdown("2027-02-05T16:00:00")

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{ backgroundColor: P.burgundy }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroPhoto}
          alt="Josh and Steph holding hands and laughing"
          className="w-full h-full object-cover object-top"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        <p
          className="font-script italic text-xl tracking-widest animate-fade-up"
          style={{ color: P.champagne, letterSpacing: "0.35em" }}
        >
          Together Forever
        </p>

        <h1
          className="font-display text-white animate-fade-up delay-200"
          style={{ fontSize: "clamp(3rem,8vw,6rem)", lineHeight: 1.05 }}
        >
          Josh
          <span
            className="mx-4 font-script italic font-light"
            style={{ color: P.pink }}
          >
            &amp;
          </span>
          Steph
        </h1>

        <div className="soft-divider w-48 animate-fade-up delay-400">
          <span
            className="font-script italic text-sm"
            style={{ color: P.champagne, letterSpacing: "0.3em" }}
          >
            05 · 02 · 2027
          </span>
        </div>

        <p className="text-white/70 text-sm tracking-[0.2em] uppercase animate-fade-up delay-400">
          Tagaytay City, Philippines
        </p>

        <div className="grid grid-cols-4 gap-3 mt-6 animate-fade-up delay-600">
          {[
            { label: "Days", value: days },
            { label: "Hours", value: hours },
            { label: "Mins", value: minutes },
            { label: "Secs", value: seconds },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="countdown-box flex flex-col items-center justify-center px-4 py-3 min-w-[70px]"
            >
              <span
                className="font-display text-3xl font-bold leading-none"
                style={{ color: P.pink }}
              >
                {String(value).padStart(2, "0")}
              </span>
              <span className="text-white/50 text-[10px] tracking-[0.2em] uppercase mt-1">
                {label}
              </span>
            </div>
          ))}
        </div>

        <a
          href="#rsvp"
          className="mt-6 animate-fade-up delay-600 px-8 py-3 text-xs tracking-[0.25em] uppercase transition-all duration-300"
          style={{ border: `1px solid ${P.pink}`, color: P.pink }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = P.pink
            e.currentTarget.style.color = P.burgundy
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = P.pink
          }}
        >
          RSVP Now
        </a>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div
          className="w-px h-8"
          style={{
            background: `linear-gradient(to bottom, ${P.pink}80, transparent)`,
          }}
        />
      </div>
    </section>
  )
}
