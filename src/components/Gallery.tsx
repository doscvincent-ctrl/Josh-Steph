import { useState } from "react"
import { COUPLE_PHOTOS, P } from "../data/siteData"

export function Gallery() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <section
      id="gallery"
      className="py-28 px-4"
      style={{ background: P.champagne }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="font-script italic text-lg mb-2"
            style={{ color: P.taupe, letterSpacing: "0.25em" }}
          >
            Captured moments
          </p>
          <h2
            className="font-display text-5xl md:text-6xl"
            style={{ color: P.burgundy }}
          >
            Prenup Gallery
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

        <div className="gallery-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="gallery-item cursor-pointer sm:row-span-2"
            style={{ backgroundColor: P.burgundy }}
            onClick={() => setActive(0)}
          >
            <img
              src={COUPLE_PHOTOS[0].src}
              alt={COUPLE_PHOTOS[0].alt}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div
            className="gallery-item cursor-pointer"
            style={{ backgroundColor: P.burgundy }}
            onClick={() => setActive(1)}
          >
            <img
              src={COUPLE_PHOTOS[1].src}
              alt={COUPLE_PHOTOS[1].alt}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div
            className="gallery-item cursor-pointer"
            style={{ backgroundColor: P.burgundy }}
            onClick={() => setActive(2)}
          >
            <img
              src={COUPLE_PHOTOS[2].src}
              alt={COUPLE_PHOTOS[2].alt}
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {active !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setActive(null)}
          >
            <button
              className="absolute top-6 right-8 text-3xl font-light transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
              onClick={() => setActive(null)}
              onMouseEnter={(e) => (e.currentTarget.style.color = P.pink)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              ×
            </button>
            <img
              src={COUPLE_PHOTOS[active].src}
              alt={COUPLE_PHOTOS[active].alt}
              className="max-h-[82vh] max-w-[calc(100vw-2rem)] sm:max-h-[90vh] sm:max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 flex gap-3">
              {COUPLE_PHOTOS.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActive(i)
                  }}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ background: i === active ? P.pink : `${P.pink}40` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
