import { useEffect, useState } from "react"
import { P } from "../data/siteData"

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? `${P.burgundyDk}F5` : "transparent",
        backdropFilter: scrolled ? "blur(8px)" : "none",
        borderBottom: scrolled ? `1px solid ${P.pink}30` : "none",
        padding: scrolled ? "0.75rem 2rem" : "1.5rem 2rem",
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span
          className="font-display italic text-lg tracking-wide"
          style={{ color: P.champagne }}
        >
          J &amp; S
        </span>
        <div className="hidden sm:flex gap-8">
          {[
            "Our Story",
            "Gallery",
            "Details",
            "RSVP",
          ].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(" ", "-")}`}
              className="nav-link"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
