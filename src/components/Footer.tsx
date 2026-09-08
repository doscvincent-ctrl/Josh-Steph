import { P } from "../data/siteData"

export function Footer() {
  return (
    <footer
      className="py-16 px-4 text-center"
      style={{ background: P.burgundy, borderTop: `1px solid ${P.pink}25` }}
    >
      <p
        className="text-lg font-semibold tracking-wide mb-3"
        style={{ color: P.champagne }}
      >
        Josh &amp; Steph
      </p>
      <p
        className="text-xs uppercase tracking-[0.25em] mb-6"
        style={{ color: `${P.pink}90`, letterSpacing: "0.25em" }}
      >
        February 5, 2027
      </p>
      <div
        className="h-px w-32 mx-auto mb-6"
        style={{
          background: `linear-gradient(to right, transparent, ${P.pink}40, transparent)`,
        }}
      />
      <p
        className="text-xs tracking-[0.15em]"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Made with love · Tagaytay City, Philippines
      </p>
    </footer>
  )
}
