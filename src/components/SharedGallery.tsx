import { useCallback, useEffect, useRef, useState } from "react"

const GALLERY_URL = import.meta.env.VITE_GALLERY_WEB_APP_URL as string | undefined

interface Photo {
  id: string
  name: string
  url: string
  thumbnail: string
  fallbackThumbnail?: string
  uploadedAt: string
  localPreview?: string
}

type UploadStatus = "idle" | "uploading" | "success" | "error"

interface FilePreview {
  file: File
  previewUrl: string
  status: UploadStatus
  error?: string
}

// Convert a File to a base64 string (without the data-URL prefix)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip "data:<mime>;base64," prefix
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function SharedGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [uploaderName, setUploaderName] = useState("")
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


  // ── Fetch uploaded photos ──────────────────────────────────────────────────
  const fetchPhotos = useCallback(async () => {
    if (!GALLERY_URL) {
      setLoadingPhotos(false)
      return
    }
    try {
      const res = await fetch(GALLERY_URL)
      const json = await res.json()
      if (json.ok) setPhotos(json.photos ?? [])
      else setFetchError(json.message || "Failed to load photos.")
    } catch {
      setFetchError("Could not reach the gallery server.")
    } finally {
      setLoadingPhotos(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  // ── File selection ─────────────────────────────────────────────────────────
  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"))
    const newPreviews: FilePreview[] = list.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      status: "idle",
    }))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ""
  }

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  const uploadAll = async () => {
    if (!GALLERY_URL) return
    const pending = previews.filter((p) => p.status === "idle")
    if (!pending.length) return

    // Mark all as uploading
    setPreviews((prev) =>
      prev.map((p) => (p.status === "idle" ? { ...p, status: "uploading" } : p)),
    )

    await Promise.all(
      pending.map(async (preview) => {
        try {
          const base64 = await fileToBase64(preview.file)
          const res = await fetch(GALLERY_URL, {
            method: "POST",
            body: new URLSearchParams({
              action: "upload",
              fileName: preview.file.name,
              mimeType: preview.file.type,
              data: base64,
              uploaderName: uploaderName.trim(),
            }),
          })
          const json = await res.json()
          setPreviews((prev) =>
            prev.map((p) =>
              p.previewUrl === preview.previewUrl
                ? { ...p, status: json.ok ? "success" : "error", error: json.message }
                : p,
            ),
          )
          if (json.ok && json.photo) {
            setPhotos((prev) => [
              {
                ...json.photo,
                localPreview: preview.previewUrl,
              },
              ...prev,
            ])
          }
        } catch {
          setPreviews((prev) =>
            prev.map((p) =>
              p.previewUrl === preview.previewUrl
                ? { ...p, status: "error", error: "Upload failed. Please try again." }
                : p,
            ),
          )
        }
      }),
    )
  }

  const clearDone = () => {
    setPreviews((prev) => prev.filter((p) => p.status !== "success"))
  }

  const pendingCount = previews.filter((p) => p.status === "idle").length
  const uploadingCount = previews.filter((p) => p.status === "uploading").length
  const successCount = previews.filter((p) => p.status === "success").length

  // ── Lightbox keyboard handler ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null)
      if (e.key === "ArrowRight" && lightbox) {
        const idx = photos.findIndex((p) => p.id === lightbox.id)
        if (idx < photos.length - 1) setLightbox(photos[idx + 1])
      }
      if (e.key === "ArrowLeft" && lightbox) {
        const idx = photos.findIndex((p) => p.id === lightbox.id)
        if (idx > 0) setLightbox(photos[idx - 1])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, photos])

  const isConfigured = Boolean(GALLERY_URL)

  return (
    <div className="min-h-screen" style={{ background: "#EDE0D0" }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <header
        className="relative flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7B2937 0%, #4a1520 60%, #2d0c12 100%)",
          minHeight: "340px",
        }}
      >
        {/* Soft bokeh circles */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 20% 50%, rgba(196,144,144,0.18) 0%, transparent 55%), radial-gradient(circle at 80% 30%, rgba(242,217,200,0.12) 0%, transparent 50%)",
          }}
        />
        <p
          className="text-xs tracking-[0.22em] uppercase mb-3 animate-fade-up"
          style={{ color: "#C49090" }}
        >
          Josh &amp; Stephanie
        </p>
        <h1
          className="font-display text-5xl md:text-6xl mb-3 animate-fade-up delay-200"
          style={{ color: "#F2D9C8" }}
        >
          Shared Gallery
        </h1>
        <p
          className="text-sm tracking-widest uppercase animate-fade-up delay-400"
          style={{ color: "rgba(242,217,200,0.65)", letterSpacing: "0.18em" }}
        >
          Upload your favourite moments from our wedding day
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        <section>
          <div className="soft-divider mb-8">
            <span
              className="font-display text-2xl"
              style={{ color: "#7B2937" }}
            >
              Upload Photos
            </span>
          </div>

          {!isConfigured && (
            <div
              className="rounded-xl p-5 mb-6 text-sm text-center"
              style={{
                background: "rgba(123,41,55,0.08)",
                border: "1px dashed rgba(123,41,55,0.4)",
                color: "#7B2937",
              }}
            >
              <strong>Gallery not yet configured.</strong> Deploy{" "}
              <code className="font-mono text-xs bg-white/60 px-1 rounded">Gallery.gs</code> and
              add <code className="font-mono text-xs bg-white/60 px-1 rounded">VITE_GALLERY_WEB_APP_URL</code>{" "}
              to your <code className="font-mono text-xs bg-white/60 px-1 rounded">.env</code> to enable uploads.
            </div>
          )}

          {/* Name field */}
          <div className="mb-4 max-w-md">
            <label
              htmlFor="uploader-name"
              className="block text-xs tracking-[0.15em] uppercase mb-2"
              style={{ color: "#7B2937" }}
            >
              Your Name <span style={{ color: "rgba(26,26,26,0.4)" }}>(optional)</span>
            </label>
            <input
              id="uploader-name"
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="e.g. Maria Santos"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(196,144,144,0.5)",
                color: "#1A1A1A",
                fontFamily: "'Josefin Sans', sans-serif",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#7B2937")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(196,144,144,0.5)")}
            />
          </div>

          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            aria-label="Drop zone: click or drag photos here to upload"
            className="rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 select-none"
            style={{
              minHeight: "180px",
              border: isDragging
                ? "2px dashed #7B2937"
                : "2px dashed rgba(196,144,144,0.5)",
              background: isDragging
                ? "rgba(123,41,55,0.06)"
                : "rgba(255,255,255,0.35)",
              transform: isDragging ? "scale(1.01)" : "scale(1)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(123,41,55,0.1)" }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7B2937"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium" style={{ color: "#7B2937" }}>
                Click or drag &amp; drop photos here
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(26,26,26,0.5)" }}>
                JPG, PNG, HEIC, WEBP — multiple files supported
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            aria-hidden="true"
          />

          {/* Preview grid */}
          {previews.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {previews.map((preview, i) => (
                  <div
                    key={preview.previewUrl}
                    className="relative rounded-xl overflow-hidden"
                    style={{ aspectRatio: "1", background: "#D8C8B8" }}
                  >
                    <img
                      src={preview.previewUrl}
                      alt={preview.file.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Status overlay */}
                    {preview.status === "uploading" && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(26,26,26,0.55)" }}
                      >
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin"
                        />
                      </div>
                    )}
                    {preview.status === "success" && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(34,100,60,0.55)" }}
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                    {preview.status === "error" && (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
                        style={{ background: "rgba(123,41,55,0.7)" }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p className="text-white text-xs text-center leading-tight">{preview.error || "Failed"}</p>
                      </div>
                    )}
                    {/* Remove button (idle only) */}
                    {preview.status === "idle" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removePreview(i) }}
                        aria-label={`Remove ${preview.file.name}`}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-opacity"
                        style={{ background: "rgba(26,26,26,0.65)" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action row */}
              <div className="flex flex-wrap gap-3 items-center">
                {pendingCount > 0 && (
                  <button
                    id="upload-photos-btn"
                    onClick={uploadAll}
                    disabled={!isConfigured || uploadingCount > 0}
                    className="px-6 py-3 rounded-full text-sm font-medium tracking-wider uppercase transition-all duration-200 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #7B2937, #4a1520)",
                      color: "#F2D9C8",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {uploadingCount > 0
                      ? `Uploading… (${uploadingCount})`
                      : `Upload ${pendingCount} photo${pendingCount !== 1 ? "s" : ""}`}
                  </button>
                )}
                {successCount > 0 && (
                  <button
                    onClick={clearDone}
                    className="px-5 py-3 rounded-full text-sm tracking-wider uppercase transition-all"
                    style={{
                      background: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(196,144,144,0.5)",
                      color: "#7B2937",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Clear done ({successCount})
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Gallery grid ───────────────────────────────────────────────── */}
        <section>
          <div className="soft-divider mb-8">
            <span
              className="font-display text-2xl"
              style={{ color: "#7B2937" }}
            >
              {photos.length > 0 ? `${photos.length} Memories` : "Wedding Memories"}
            </span>
          </div>

          {loadingPhotos && (
            <div className="flex justify-center py-16">
              <div
                className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(196,144,144,0.3)", borderTopColor: "#7B2937" }}
              />
            </div>
          )}

          {!loadingPhotos && fetchError && (
            <p className="text-center text-sm py-10" style={{ color: "rgba(123,41,55,0.7)" }}>
              {fetchError}
            </p>
          )}

          {!loadingPhotos && !fetchError && !isConfigured && (
            <p className="text-center text-sm py-10" style={{ color: "rgba(26,26,26,0.45)" }}>
              Photos will appear here once the gallery is configured and guests start uploading.
            </p>
          )}

          {!loadingPhotos && !fetchError && isConfigured && photos.length === 0 && (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(196,144,144,0.18)" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C49090" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="font-display text-xl" style={{ color: "#C49090" }}>No photos yet</p>
              <p className="text-sm mt-2" style={{ color: "rgba(26,26,26,0.45)" }}>
                Be the first to share a memory!
              </p>
            </div>
          )}

          {photos.length > 0 && (
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
            >
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onClick={() => setLightbox(photo)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Lightbox ────────────────────────────────────────────────────────── */}
      {lightbox && (
        <LightboxModal
          photo={lightbox}
          onClose={() => setLightbox(null)}
          onPrev={
            (() => {
              const idx = photos.findIndex((p) => p.id === lightbox.id)
              return idx > 0 ? () => setLightbox(photos[idx - 1]) : undefined
            })()
          }
          onNext={
            (() => {
              const idx = photos.findIndex((p) => p.id === lightbox.id)
              return idx < photos.length - 1 ? () => setLightbox(photos[idx + 1]) : undefined
            })()
          }
        />
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        className="text-center py-8 text-xs tracking-widest uppercase"
        style={{ color: "rgba(26,26,26,0.4)" }}
      >
        Josh &amp; Stephanie · Wedding Memories
      </footer>
    </div>
  )
}

// ── Photo Grid Card with Resilient Multi-Level Fallback ───────────────────────
function PhotoCard({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  // Cascading candidates: local preview (instant) -> CDN -> Drive thumbnail -> direct download -> alt CDN
  const candidates = [
    photo.localPreview,
    photo.thumbnail,
    photo.fallbackThumbnail || `https://drive.google.com/thumbnail?id=${photo.id}&sz=w600`,
    `https://drive.usercontent.google.com/download?id=${photo.id}&export=view`,
    `https://lh3.googleusercontent.com/u/0/d/${photo.id}=w600`,
  ].filter(Boolean) as string[]

  const [srcIndex, setSrcIndex] = useState(0)
  const [proxyUri, setProxyUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const currentSrc = proxyUri || candidates[srcIndex]

  const handleError = () => {
    // If we have more candidates, advance to the next candidate
    if (!proxyUri && srcIndex < candidates.length - 1) {
      setSrcIndex((prev) => prev + 1)
      return
    }

    // If all direct candidates failed and we haven't fetched from the GAS proxy yet, try it!
    if (!proxyUri && GALLERY_URL) {
      fetch(`${GALLERY_URL}?action=thumb&id=${photo.id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.ok && json.dataUri) {
            setProxyUri(json.dataUri)
            setFailed(false)
          } else {
            setFailed(true)
          }
        })
        .catch(() => setFailed(true))
      return
    }

    setFailed(true)
  }

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRetrying(true)
    setFailed(false)
    setLoading(true)
    setProxyUri(null)
    setSrcIndex(0)
    setTimeout(() => setRetrying(false), 500)
  }

  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl overflow-hidden cursor-pointer border-0 p-0 block w-full text-left"
      style={{ aspectRatio: "1", background: "#EAE0D5" }}
      aria-label={`View photo ${photo.name}`}
    >
      {/* Loading Shimmer Skeleton */}
      {loading && !failed && (
        <div className="absolute inset-0 animate-pulse flex items-center justify-center" style={{ background: "#E6DBD0" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8A495" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}

      {/* Main Image */}
      {!failed && (
        <img
          src={currentSrc}
          alt={photo.name}
          referrerPolicy="no-referrer"
          onLoad={() => {
            setLoading(false)
            setFailed(false)
          }}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            loading ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {/* Failed Card */}
      {failed && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center"
          style={{ background: "#F5ECE6" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C49090" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-[11px] font-medium mt-1 truncate max-w-full px-1" style={{ color: "#7D1D3F" }}>
            Processing photo...
          </p>
          <button
            onClick={handleRetry}
            className="mt-2 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full text-white font-medium shadow-sm transition-transform active:scale-95"
            style={{ background: "#7D1D3F" }}
          >
            {retrying ? "Retrying..." : "Reload"}
          </button>
        </div>
      )}

      {/* Hover Overlay */}
      {!failed && !loading && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5"
          style={{ background: "linear-gradient(to top, rgba(26,26,26,0.6) 0%, transparent 60%)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
      )}
    </button>
  )
}

// ── Lightbox Modal ────────────────────────────────────────────────────────────
function LightboxModal({
  photo,
  onClose,
  onPrev,
  onNext,
}: {
  photo: Photo
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}) {
  const candidates = [
    photo.localPreview,
    photo.url,
    `https://drive.google.com/thumbnail?id=${photo.id}&sz=w2048`,
    `https://drive.usercontent.google.com/download?id=${photo.id}&export=view`,
    photo.thumbnail,
    photo.fallbackThumbnail,
  ].filter(Boolean) as string[]

  const [srcIndex, setSrcIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSrcIndex(0)
    setLoading(true)
  }, [photo.id])

  const currentSrc = candidates[srcIndex] || photo.url

  const handleError = () => {
    if (srcIndex < candidates.length - 1) {
      setSrcIndex((prev) => prev + 1)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,4,6,0.92)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Prev */}
      {onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          aria-label="Previous photo"
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      <img
        src={currentSrc}
        alt={photo.name}
        referrerPolicy="no-referrer"
        onLoad={() => setLoading(false)}
        onError={handleError}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl transition-opacity duration-300 ${
          loading ? "opacity-30" : "opacity-100"
        }`}
      />

      {/* Next */}
      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          aria-label="Next photo"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
        style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
