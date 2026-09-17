import { Details } from "./components/Details"
import { Entourage } from "./components/Entourage"
import { Footer } from "./components/Footer"
import { Gallery } from "./components/Gallery"
import { Hero } from "./components/Hero"
import { Nav } from "./components/Nav"
import { OurStory } from "./components/OurStory"
import { RSVP } from "./components/RSVP"
import { SaveTheDateScratch } from "./components/SaveTheDateScratch"
import { Wishlist } from "./components/Wishlist"
import { useCurrentRoute } from "./utils/router"

export default function App() {
  const { isScratchPage } = useCurrentRoute()

  if (isScratchPage) {
    return <SaveTheDateScratch />
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <OurStory />
      <Gallery />
      <Details />
      <Entourage />
      <Wishlist />
      <RSVP />
      <Footer />
    </div>
  )
}
