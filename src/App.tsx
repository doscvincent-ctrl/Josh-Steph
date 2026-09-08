import { Details } from "./components/Details"
import { Entourage } from "./components/Entourage"
import { Footer } from "./components/Footer"
import { Gallery } from "./components/Gallery"
import { Hero } from "./components/Hero"
import { Nav } from "./components/Nav"
import { OurStory } from "./components/OurStory"
import { RSVP } from "./components/RSVP"
import { Wishlist } from "./components/Wishlist"

export default function App() {
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
