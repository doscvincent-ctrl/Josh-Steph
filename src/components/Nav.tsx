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

  const searchResults = [
    {
      title: "✨ Save The Date — Interactive Photo Scratch",
      description: "Interactive scratch card page to reveal Josh & Steph's wedding date",
      type: "page",
      action: () => {
        setSearchOpen(false)
        navigateToScratch()
      },
    },
    {
      title: "Our Story",
      description: "How Josh and Steph met and their journey together",
      type: "section",
      href: "#our-story",
    },
    {
      title: "Wedding Details & Venue",
      description: "Date, time, dress code, and Fruella's Events Place map",
      type: "section",
      href: "#details",
    },
    {
      title: "Wedding Entourage",
      description: "Meet the principal sponsors, groomsmen, and bridesmaids",
      type: "section",
      href: "#entourage",
    },
    {
      title: "Gift Preferences & Wishlist",
      description: "Gift list and GCash / Bank monetary registry details",
      type: "section",
      href: "#wishlist",
    },
    {
      title: "RSVP Form",
      description: "Confirm your attendance and party details",
      type: "section",
      href: "#rsvp",
    },
  ].filter((item) =>
    searchQuery.trim() === ""
      ? true
      : item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true)
                setSearchQuery("")
              }}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] px-3 py-1.5 rounded-full border transition-all hover:bg-white/10"
              style={{ borderColor: `${P.pink}40`, color: P.champagne }}
              aria-label="Search website"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="w-3.5 h-3.5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <span>Search</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Global Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false)
          }}
        >
          <div
            className="w-full max-w-lg rounded-lg border p-6 shadow-2xl relative"
            style={{ background: P.burgundyDk, borderColor: `${P.pink}60` }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: `${P.pink}30` }}>
              <div className="flex items-center gap-3 w-full">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5 text-white/50 flex-shrink-0"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  autoFocus
                  placeholder="Search pages or sections (e.g. Save The Date, RSVP, Story)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-white/60 hover:text-white text-xl leading-none ml-2"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.title}
                    onClick={() => {
                      if (item.action) {
                        item.action()
                      } else if (item.href) {
                        setSearchOpen(false)
                        window.location.hash = item.href
                      }
                    }}
                    className="p-3 rounded-md border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold" style={{ color: P.pink }}>
                        {item.title}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-white/70">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-1">{item.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/50 text-center py-6">
                  No matching results found for "{searchQuery}". Try searching "Save The Date" or "RSVP".
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
