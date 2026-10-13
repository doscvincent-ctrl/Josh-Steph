import { Details } from "./components/Details"
import { Entourage } from "./components/Entourage"
import { Footer } from "./components/Footer"
import { Gallery } from "./components/Gallery"
import { Hero } from "./components/Hero"
import { Nav } from "./components/Nav"
import { OurStory } from "./components/OurStory"
import { RSVP } from "./components/RSVP"
import { SaveTheDateScratch } from "./components/SaveTheDateScratch"
import { SharedGallery } from "./components/SharedGallery"
import { Wishlist } from "./components/Wishlist"
import { useCurrentRoute } from "./utils/router"

export default function App() {
  const { isScratchPage, isGalleryPage } = useCurrentRoute()

  if (isScratchPage) {
    return <SaveTheDateScratch />
  }

  if (isGalleryPage) {
    return <SharedGallery />
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
