import { Details } from "./components/Details"
import { Footer } from "./components/Footer"
import { Gallery } from "./components/Gallery"
import { Hero } from "./components/Hero"
import { Nav } from "./components/Nav"
import { OurStory } from "./components/OurStory"
import { RSVP } from "./components/RSVP"

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <OurStory />
      <Gallery />
      <Details />
      <RSVP />
      <Footer />
    </div>
  )
}
