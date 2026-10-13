import { useEffect, useState } from "react"

export function isSaveTheDatePath(): boolean {
  if (typeof window === "undefined") return false

  const path = window.location.pathname.toLowerCase()
  const hash = window.location.hash.toLowerCase()
  const search = window.location.search.toLowerCase()

  const params = new URLSearchParams(window.location.search)
  const q = (params.get("q") || params.get("search") || params.get("query") || "").toLowerCase()
  const view = (params.get("view") || params.get("page") || "").toLowerCase()

  return (
    path.includes("save-the-date") ||
    path.includes("photo-scratch") ||
    path.includes("scratch") ||
    hash === "#save-the-date" ||
    hash === "#photo-scratch" ||
    hash === "#scratch" ||
    view === "save-the-date" ||
    view === "photo-scratch" ||
    view === "scratch" ||
    q.includes("save-the-date") ||
    q.includes("photo-scratch") ||
    q.includes("scratch") ||
    q.includes("save the date")
  )
}

export function isSharedGalleryPath(): boolean {
  if (typeof window === "undefined") return false

  const path = window.location.pathname.toLowerCase()
  const hash = window.location.hash.toLowerCase()
  const params = new URLSearchParams(window.location.search)
  const view = (params.get("view") || params.get("page") || "").toLowerCase()
  const q = (params.get("q") || params.get("search") || params.get("query") || "").toLowerCase()

  return (
    path.includes("shared-gallery") ||
    path.includes("photo-gallery") ||
    path.includes("gallery") ||
    hash === "#shared-gallery" ||
    hash === "#photo-gallery" ||
    hash === "#gallery" ||
    view === "shared-gallery" ||
    view === "gallery" ||
    view === "photo-gallery" ||
    q.includes("shared-gallery") ||
    q.includes("gallery")
  )
}

export function useCurrentRoute() {
  const [isScratchPage, setIsScratchPage] = useState(isSaveTheDatePath)
  const [isGalleryPage, setIsGalleryPage] = useState(isSharedGalleryPath)

  useEffect(() => {
    const handleLocationChange = () => {
      setIsScratchPage(isSaveTheDatePath())
      setIsGalleryPage(isSharedGalleryPath())
    }

    window.addEventListener("popstate", handleLocationChange)
    window.addEventListener("hashchange", handleLocationChange)

    return () => {
      window.removeEventListener("popstate", handleLocationChange)
      window.removeEventListener("hashchange", handleLocationChange)
    }
  }, [])

  const navigateToMain = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete("view")
    url.searchParams.delete("page")
    url.searchParams.delete("q")
    url.searchParams.delete("search")
    url.searchParams.delete("query")
    url.hash = ""
    window.history.pushState({}, "", url.pathname + url.search)
    setIsScratchPage(false)
    setIsGalleryPage(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const navigateToScratch = () => {
    const url = new URL(window.location.href)
    url.searchParams.set("view", "save-the-date")
    window.history.pushState({}, "", url.toString())
    setIsScratchPage(true)
    setIsGalleryPage(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const navigateToGallery = () => {
    window.history.pushState({}, "", "/shared-gallery")
    setIsGalleryPage(true)
    setIsScratchPage(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return { isScratchPage, isGalleryPage, navigateToMain, navigateToScratch, navigateToGallery }
}
