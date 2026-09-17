import { useEffect, useState } from "react"
import { P } from "../data/siteData"
import { useCurrentRoute } from "../utils/router"

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { navigateToScratch } = useCurrentRoute()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const navItems = [
    { label: "Our Story", href: "#our-story" },
    { label: "Gallery", href: "#gallery" },
    { label: "Details", href: "#details" },
    { label: "Entourage", href: "#entourage" },
    { label: "Wishlist", href: "#wishlist" },
    { label: "RSVP", href: "#rsvp" },
  ]

  return (
    <>
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
          <a
            href="#"
            className="text-sm font-semibold tracking-[0.2em] transition-opacity hover:opacity-80"
            style={{ color: P.champagne }}
          >
            J &amp; S
          </a>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 lg:gap-8">
              {navItems.map(({ label, href }) => (
                <a key={label} href={href} className="nav-link">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
