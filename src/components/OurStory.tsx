import { useEffect, useState } from "react"
import { fetchStory, P, type StoryItem } from "../data/siteData"
import { Loader } from "./Loader"

export function OurStory() {
  const [story, setStory] = useState<StoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchStory()
      .then((loadedStory) => {
        if (active) setStory(loadedStory)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <section
      id="our-story"
      className="py-28 px-4"
      style={{ background: P.beige }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-2"
            style={{ color: P.taupe, letterSpacing: "0.25em" }}
          >
            How it happened
          </p>
          <h2
            className="font-display text-5xl md:text-6xl"
            style={{ color: P.burgundy }}
          >
            Our Story
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
          <Loader label="Loading our story" />
        ) : story.length > 0 ? (
          <div className="relative">
            <div
              className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px"
              style={{
                background: `linear-gradient(to bottom, transparent, ${P.pink}80, ${P.pink}80, transparent)`,
              }}
            />

            <div className="flex flex-col gap-20">
              {story.map((item, i) => (
                <div key={item.year} className="relative">
                  <div className="relative z-10 flex justify-center mb-8">
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 76,
                        height: 76,
                        background: P.champagne,
                        border: `2px solid ${P.burgundy}`,
                      }}
                    >
                      <span className="font-display font-bold" style={{ color: P.burgundy, fontSize: "1.25rem", fontWeight: 900, WebkitTextStroke: "0.35px currentColor" }}>
                        {item.year}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-0">
                    <div
                      className={`p-8 md:p-10 ${i % 2 === 1 ? "md:order-2 md:pl-14" : "md:pr-14"}`}
                      style={{
                        borderLeft: `3px solid ${P.taupe}`,
                        borderRight: i % 2 === 1 ? `3px solid ${P.taupe}` : "none",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#2c2c2c",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: "0.65rem", color: "#f8f4ee", letterSpacing: "0.05em" }}>
                            J
                          </span>
                        </div>
                        <p className="text-xs uppercase" style={{ color: P.taupe, letterSpacing: "0.18em" }}>
                          He Said
                        </p>
                      </div>
                      <blockquote
                        className="font-display"
                        style={{ fontSize: "1.35rem", lineHeight: 1.55, color: P.black, fontStyle: "italic" }}
                      >
                        &ldquo;{item.heSaid}&rdquo;
                      </blockquote>
                      <p className="mt-4 text-xs" style={{ color: `${P.black}88` }}>
                        Josh, {item.year}
                      </p>
                    </div>

                    <div
                      className={`p-8 md:p-10 ${i % 2 === 1 ? "md:order-1" : ""}`}
                      style={{ borderRight: `3px solid ${P.pink}`, textAlign: "right" }}
                    >
                      <div className="flex items-center justify-end gap-3 mb-5">
                        <p className="text-xs uppercase" style={{ color: P.pink, letterSpacing: "0.18em" }}>
                          She Said
                        </p>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: P.pink,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: "0.65rem", color: "#fff", letterSpacing: "0.05em" }}>
                            S
                          </span>
                        </div>
                      </div>
                      <blockquote
                        className="font-display"
                        style={{ fontSize: "1.35rem", lineHeight: 1.55, color: P.black, fontStyle: "italic" }}
                      >
                        &ldquo;{item.sheSaid}&rdquo;
                      </blockquote>
                      <p className="mt-4 text-xs" style={{ color: `${P.black}88` }}>
                        Steph, {item.year}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p
            className="pb-4 text-center text-sm italic"
            style={{ color: `${P.black}88` }}
          >
            The story of how we began is on its way — check back soon.
          </p>
        )}
      </div>
    </section>
  )
}
