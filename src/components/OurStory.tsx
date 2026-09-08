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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <p
            className="text-xs uppercase tracking-[0.25em] mb-2"
            style={{ color: P.taupe, letterSpacing: "0.25em" }}
          >
            How it all began
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
            className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px"
            style={{
              background: `linear-gradient(to bottom, transparent, ${P.pink}50, ${P.pink}50, transparent)`,
            }}
          />

          <div className="flex flex-col gap-16">
            {story.map((item, i) => (
              <div
                key={item.year}
                className={`relative flex items-start gap-8 ${
                  i % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div
                  className={`flex-1 ${
                    i % 2 === 0 ? "text-right pr-8" : "text-left pl-8"
                  }`}
                >
                  <span
                    className="text-2xl block leading-none mb-2"
                    style={{ color: P.pink }}
                  >
                    {item.year}
                  </span>
                  <h3
                    className="font-display text-3xl mb-2"
                    style={{ color: P.burgundy }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed max-w-xs ml-auto"
                    style={{ color: `${P.black}99` }}
                  >
                    {item.body}
                  </p>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-2 timeline-dot" />
                <div className="flex-1" />
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
