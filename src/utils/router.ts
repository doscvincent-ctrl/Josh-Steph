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
    hash === "#save-the-date" ||
    hash === "#photo-scratch" ||
    view === "save-the-date" ||
    view === "photo-scratch" ||
    view === "scratch" ||
    q.includes("save-the-date") ||
    q.includes("photo-scratch") ||
    q.includes("scratch") ||
    q.includes("save the date")
  )
}

export function useCurrentRoute() {
  const [isScratchPage, setIsScratchPage] = useState(isSaveTheDatePath)

  useEffect(() => {
    const handleLocationChange = () => {
      setIsScratchPage(isSaveTheDatePath())
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
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const navigateToScratch = () => {
    const url = new URL(window.location.href)
    url.searchParams.set("view", "save-the-date")
    window.history.pushState({}, "", url.toString())
    setIsScratchPage(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return { isScratchPage, navigateToMain, navigateToScratch }
}
