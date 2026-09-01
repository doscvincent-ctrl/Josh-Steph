const imagePath = (filename: string) =>
  `${import.meta.env.BASE_URL}imports/${filename}`

const heroPhoto = imagePath("cda69251-0cda-4945-bb14-314d33e6b53b.jpg")
const photoColor = imagePath("fea8cf50-57b0-49fb-a259-3f6e655716c8.jpg")
const photoBW = imagePath("baeb4bd6-b687-4114-84d6-8552788cbfc7.jpg")

export const P = {
  burgundy: "#7B2937",
  burgundyDk: "#5C1E2A",
  pink: "#C49090",
  champagne: "#F2D9C8",
  beige: "#EDE0D0",
  taupe: "#C4A090",
  black: "#1A1A1A",
}

export const COUPLE_PHOTOS = [
  { src: photoColor, alt: "Josh and Steph holding hands and laughing — color" },
  { src: photoBW, alt: "Josh and Steph holding hands — black and white" },
  { src: heroPhoto, alt: "Josh and Steph holding up their childhood photos" },
]

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
