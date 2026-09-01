const imagePath = (filename: string) =>
  `${import.meta.env.BASE_URL}imports/${filename}`

const heroPhoto = imagePath("cda69251-0cda-4945-bb14-314d33e6b53b.jpg")

const importedImages = import.meta.glob(
  "../imports/*.{jpg,jpeg,png,webp}",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>

export const P = {
  burgundy: "#7B2937",
  burgundyDk: "#5C1E2A",
  pink: "#C49090",
  champagne: "#F2D9C8",
  beige: "#EDE0D0",
  taupe: "#C4A090",
  black: "#1A1A1A",
}

export const COUPLE_PHOTOS = Object.entries(importedImages)
  .sort(([first], [second]) => first.localeCompare(second))
  .map(([path, src]) => {
    const filename = path.split("/").pop()?.replace(/\.[^.]+$/, "") || "photo"
    const alt = filename
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())

    return { src, alt: `Josh and Steph ${alt}` }
  })

export const STORY = [
  {
    year: "2019",
    title: "First Glance",
    body: "A crowded autumn gala, two strangers reaching for the same glass of champagne. They laughed. The world stopped.",
  },
  {
    year: "2020",
    title: "Through Lockdown",
    body: "Long calls stretching past midnight, shared playlists, handwritten letters slipped under the door. Distance only drew them closer.",
  },
  {
    year: "2022",
    title: "The Prenup Session",
    body: "Golden hour in the countryside — their first photoshoot together. Every frame proved they were meant to be captured side by side.",
  },
  {
    year: "2024",
    title: "The Proposal",
    body: "Under the same oak tree from that field photo, he got down on one knee. She said yes before he even finished the question.",
  },
]

export const DETAILS = [
  {
    icon: "♡",
    label: "Ceremony",
    line1: "February 5, 2027 · 4:00 PM",
    line2: "The Grand Ballroom",
    line3: "Tagaytay City, Philippines",
  },
  {
    icon: "◇",
    label: "Reception",
    line1: "February 5, 2027 · 7:00 PM",
    line2: "Rosewood Gardens",
    line3: "Cocktails, Dinner & Dancing",
  },
  {
    icon: "◈",
    label: "Dress Code",
    line1: "Black Tie Optional",
    line2: "Burgundy & Dusty Pink",
    line3: "Celebrate in elegance",
  },
]
