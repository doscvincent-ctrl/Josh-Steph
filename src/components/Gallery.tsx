import { useState } from "react"
import { COUPLE_PHOTOS, P } from "../data/siteData"

export function Gallery() {
  const [active, setActive] = useState<number | null>(null)
  const [orientations, setOrientations] = useState<
    Record<string, "portrait" | "landscape">
  >({})

  const setOrientation = (src: string, image: HTMLImageElement) => {
    setOrientations((current) => ({
      ...current,
      [src]: image.naturalHeight > image.naturalWidth ? "portrait" : "landscape",
    }))
  }

  return (
    <section
      id="gallery"
      className="py-28 px-4"
      style={{ background: P.champagne }}
    >
      <div className="max-w-4xl mx-auto">
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

        <div className="gallery-grid">
          {COUPLE_PHOTOS.map((photo, index) => (
            <div
              key={photo.src}
              className={`gallery-item gallery-item--${orientations[photo.src] || "landscape"} gallery-item--variant-${index % 5} cursor-pointer`}
              style={{ backgroundColor: P.burgundy }}
              onClick={() => setActive(index)}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover object-top"
                onLoad={(event) => setOrientation(photo.src, event.currentTarget)}
              />
            </div>
          ))}
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
