import { useCallback, useEffect, useRef, useState } from "react"
import { fetchInvitees, P, type Invitee } from "../data/siteData"
import { useCurrentRoute } from "../utils/router"

const scratchPhoto = `${import.meta.env.BASE_URL}imports/d634c711-db0a-41c8-88da-079f1086bf0f.jpg`

type Particle = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  opacity: number
}

export function SaveTheDateScratch() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  const [isRevealed, setIsRevealed] = useState(false)
  const [scratchPercent, setScratchPercent] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const [copied, setCopied] = useState(false)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { navigateToMain } = useCurrentRoute()

  // Draw metallic gold/burgundy foil overlay on canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    const width = rect.width
    const height = rect.height

    // Foil gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, "#7B2937")
    grad.addColorStop(0.3, "#C49090")
    grad.addColorStop(0.6, "#5C1E2A")
    grad.addColorStop(1, "#7B2937")

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Gold dust texture overlay
    ctx.fillStyle = "rgba(242, 217, 200, 0.15)"
    for (let i = 0; i < 350; i++) {
      const rx = Math.random() * width
      const ry = Math.random() * height
      const rr = Math.random() * 2 + 0.5
      ctx.beginPath()
      ctx.arc(rx, ry, rr, 0, Math.PI * 2)
      ctx.fill()
    }

    // Border pattern inside canvas
    ctx.strokeStyle = "rgba(242, 217, 200, 0.4)"
    ctx.lineWidth = 2
    ctx.strokeRect(12, 12, width - 24, height - 24)

    // Center emblem & instruction text
    ctx.fillStyle = "#F2D9C8"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    ctx.font = "italic 28px 'Dancing Script', cursive"
    ctx.fillText("Save the Date", width / 2, height / 2 - 30)

    ctx.font = "600 11px 'Josefin Sans', sans-serif"
    ctx.letterSpacing = "0.25em"
    ctx.fillText("✨ SCRATCH WITH MOUSE OR FINGER ✨", width / 2, height / 2 + 15)

    ctx.font = "400 10px 'Josefin Sans', sans-serif"
    ctx.fillStyle = "rgba(242, 217, 200, 0.75)"
    ctx.fillText("Scratch to reveal our secret date", width / 2, height / 2 + 40)
  }, [])

  useEffect(() => {
    initCanvas()
    const handleResize = () => {
      if (!isRevealed) initCanvas()
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [initCanvas, isRevealed])

  // Spawn golden particles when scratching
  const spawnSparkles = (x: number, y: number) => {
    const colors = ["#F2D9C8", "#C49090", "#FFF", "#D4AF37"]
    const newParticles: Particle[] = []
    for (let i = 0; i < 4; i++) {
      newParticles.push({
        id: Math.random() + Date.now(),
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
      })
    }
    setParticles((prev) => [...prev.slice(-30), ...newParticles])
  }

  useEffect(() => {
    if (particles.length === 0) return
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.05,
          }))
          .filter((p) => p.opacity > 0),
      )
    }, 30)
    return () => clearInterval(interval)
  }, [particles])

  const checkScratchAmount = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || isRevealed) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const imgData = ctx.getImageData(0, 0, width, height)
    const pixels = imgData.data

    let transparentCount = 0
    const stride = 32
    const totalSampled = pixels.length / (4 * stride)

    for (let i = 3; i < pixels.length; i += 4 * stride) {
      if (pixels[i] === 0) {
        transparentCount++
      }
    }

    const percent = Math.round((transparentCount / totalSampled) * 100)
    setScratchPercent(percent)

    if (percent > 40 && !isRevealed) {
      triggerFullReveal()
    }
  }, [isRevealed])

  const triggerFullReveal = () => {
    setIsRevealed(true)
    setScratchPercent(100)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const scratchAt = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas || isRevealed) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = (x - rect.left) * (canvas.width / rect.width)
    const canvasY = (y - rect.top) * (canvas.height / rect.height)

    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()

    if (lastPointRef.current) {
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
      ctx.lineTo(canvasX, canvasY)
      ctx.lineWidth = 45 * 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.stroke()
    } else {
      ctx.arc(canvasX, canvasY, 45, 0, Math.PI * 2)
      ctx.fill()
    }

    lastPointRef.current = { x: canvasX, y: canvasY }
    spawnSparkles(x - rect.left, y - rect.top)
    checkScratchAmount()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawingRef.current = true
    lastPointRef.current = null
    scratchAt(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return
    scratchAt(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    isDrawingRef.current = false
    lastPointRef.current = null
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    isDrawingRef.current = true
    lastPointRef.current = null
    if (e.touches[0]) {
      scratchAt(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawingRef.current) return
    if (e.touches[0]) {
      scratchAt(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    isDrawingRef.current = false
    lastPointRef.current = null
  }

  const resetScratch = () => {
    setIsRevealed(false)
    setScratchPercent(0)
    setTimeout(() => initCanvas(), 50)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Save The Date - Josh & Steph",
          text: "Scratch to reveal Josh & Steph's wedding date!",
          url,
        })
        return
      } catch {
        // Fallback
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const downloadICal = () => {
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Josh and Steph Wedding//EN",
      "BEGIN:VEVENT",
      "SUMMARY:Josh & Steph Wedding",
      "DESCRIPTION:Save The Date! Celebrate with Josh & Steph on their wedding day in Tagaytay City.",
      "LOCATION:Fruella's Events Place, Tagaytay City, Philippines",
      "DTSTART:20270205T070000Z",
      "DTEND:20270205T140000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n")

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "Josh-Steph-Wedding-SaveTheDate.ics"
    link.click()
  }

  const toggleAudio = () => {
    if (!audioRef.current) {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(440, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 1.2)
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 1.5)
      } catch {
        // Audio API fallback
      }
      setIsPlayingMusic(true)
      setTimeout(() => setIsPlayingMusic(false), 2000)
    }
  }

  return (
    <div
      className="min-h-screen relative flex flex-col justify-between overflow-x-hidden font-script"
      style={{ background: P.burgundy, color: P.champagne }}
    >
      {/* Main Standalone Container */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-4 py-12 flex flex-col items-center text-center">
        {/* Title Heading */}
        <div className="mb-8">
          <h1 className="font-display text-5xl md:text-7xl text-white">
            Josh &amp; Steph
          </h1>
          <div className="mt-3 flex justify-center">
            <div
              className="h-px w-28"
              style={{
                background: `linear-gradient(to right, transparent, ${P.pink}, transparent)`,
              }}
            />
          </div>
          <p className="mt-4 text-sm text-white/80 max-w-md mx-auto leading-relaxed">
            Drag or swipe across the golden card below to scratch off the foil and reveal our date!
          </p>
        </div>

        {/* Scratch Card Frame */}
        <div
          ref={containerRef}
          className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
          style={{
            border: `2px solid ${P.pink}70`,
            boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 25px ${P.pink}40`,
          }}
        >
          {/* Underneath Revealed Photo & Details */}
          <div className="absolute inset-0 w-full h-full bg-black">
            <img
              src={scratchPhoto}
              alt="Josh & Steph Save The Date Photo"
              className="w-full h-full object-cover object-center"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${P.burgundyDk}F0 0%, rgba(92, 30, 42, 0.35) 50%, rgba(92, 30, 42, 0.75) 100%)`,
              }}
            />

            {/* Revealed Save The Date Card Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-between p-7 text-center z-10">
              <div className="pt-2">
                <span
                  className="text-[10px] uppercase tracking-[0.35em] block mb-1"
                  style={{ color: P.champagne }}
                >
                  We are getting married
                </span>
                <span className="font-display text-4xl text-white">
                  Josh &amp; Steph
                </span>
              </div>

              <div
                className="py-5 px-6 rounded-lg backdrop-blur-md border w-full max-w-xs shadow-lg"
                style={{
                  background: "rgba(123, 41, 55, 0.7)",
                  borderColor: `${P.pink}70`,
                }}
              >
                <p className="font-display text-4xl mb-1" style={{ color: P.pink }}>
                  February 5, 2027
                </p>
                <div
                  className="h-px w-16 mx-auto my-2"
                  style={{ background: `${P.pink}60` }}
                />
                <p className="text-xs tracking-[0.2em] uppercase text-white font-medium">
                  3:00 PM · Friday
                </p>
                <p className="text-[11px] text-white/90 italic mt-1">
                  Fruella’s Events Place
                </p>
                <p className="text-[10px] text-white/70 tracking-wider uppercase mt-0.5">
                  Tagaytay City, Philippines
                </p>
              </div>

              <div className="pb-2">
                <p className="font-display text-2xl" style={{ color: P.champagne }}>
                  &ldquo;Love begins in a moment, lasts a lifetime&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Canvas Scratch Overlay */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`absolute inset-0 w-full h-full cursor-pointer touch-none transition-opacity duration-700 z-20 ${isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
          />

          {/* Sparkle particles overlay */}
          <div className="absolute inset-0 pointer-events-none z-30">
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  opacity: p.opacity,
                  boxShadow: `0 0 8px ${p.color}`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </div>

          {/* Progress meter */}
          {!isRevealed && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] text-white/80">
              <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${scratchPercent}%`,
                    background: P.pink,
                  }}
                />
              </div>
              <span>{scratchPercent}% revealed</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-3 z-10">
          {!isRevealed ? (
            <button
              type="button"
              onClick={triggerFullReveal}
              className="px-6 py-2.5 text-xs uppercase tracking-[0.2em] rounded-sm transition-all duration-300 shadow-lg"
              style={{
                background: P.pink,
                color: P.burgundy,
                fontWeight: 600,
              }}
            >
              ✨ Reveal Instantly
            </button>
          ) : (
            <button
              type="button"
              onClick={resetScratch}
              className="px-6 py-2.5 text-xs uppercase tracking-[0.2em] rounded-sm border transition-all duration-300 hover:bg-white/10"
              style={{
                borderColor: `${P.pink}80`,
                color: P.champagne,
              }}
            >
              🔄 Scratch Again
            </button>
          )}

          <button
            type="button"
            onClick={toggleAudio}
            className="px-5 py-2.5 text-xs uppercase tracking-[0.2em] rounded-sm border transition-all duration-300 hover:bg-white/10 flex items-center gap-2"
            style={{
              borderColor: `${P.pink}50`,
              color: P.champagne,
            }}
          >
            <span>{isPlayingMusic ? "🎶 Chime Playing!" : "🎵 Play Music"}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="px-5 py-2.5 text-xs uppercase tracking-[0.2em] rounded-sm border transition-all duration-300 hover:bg-white/10"
            style={{
              borderColor: `${P.pink}50`,
              color: P.champagne,
            }}
          >
            {copied ? "✓ Link Copied!" : "🔗 Share Page"}
          </button>
        </div>
      </main>
    </div>
  )
}
