import React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { P } from "../data/siteData"
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

  // Envelope opening states: 'closed' | 'opening' | 'opened'
  const [envelopeState, setEnvelopeState] = useState<"closed" | "opening" | "opened">("closed")
  const [isRevealed, setIsRevealed] = useState(false)
  const [scratchPercent, setScratchPercent] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const [copied, setCopied] = useState(false)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { navigateToMain } = useCurrentRoute()

  // Background music setup
  const musicUrl = `${import.meta.env.BASE_URL}music.mp3`
  const fallbackMusicUrl = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=wedding-piano-112191.mp3"

  useEffect(() => {
    const audio = new Audio(musicUrl)
    audio.loop = true
    audio.volume = 0.5

    audio.onerror = () => {
      audio.src = fallbackMusicUrl
    }

    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [musicUrl])

  const toggleAudio = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlayingMusic) {
      audio.pause()
      setIsPlayingMusic(false)
    } else {
      try {
        await audio.play()
        setIsPlayingMusic(true)
      } catch (err) {
        console.warn("Audio play prevented:", err)
      }
    }
  }

  // Handle Envelope Open Action
  const handleOpenEnvelope = () => {
    if (envelopeState !== "closed") return
    setEnvelopeState("opening")

    // Attempt to start soft audio on envelope opening interaction
    if (audioRef.current && !isPlayingMusic) {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => { })
    }

    setTimeout(() => {
      setEnvelopeState("opened")
    }, 1100)
  }

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

    // Luxury foil gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, P.rosewoodPink)
    grad.addColorStop(0.25, "#B66C7E")
    grad.addColorStop(0.5, P.rosewoodPinkDk)
    grad.addColorStop(0.75, P.pink)
    grad.addColorStop(1, P.rosewoodPink)

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Gold sparkles texture overlay
    ctx.fillStyle = "rgba(242, 217, 200, 0.2)"
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * width
      const ry = Math.random() * height
      const rr = Math.random() * 2 + 0.5
      ctx.beginPath()
      ctx.arc(rx, ry, rr, 0, Math.PI * 2)
      ctx.fill()
    }

    // Elegant inner double border line
    ctx.strokeStyle = "rgba(242, 217, 200, 0.45)"
    ctx.lineWidth = 1.5
    ctx.strokeRect(10, 10, width - 20, height - 20)

    ctx.strokeStyle = "rgba(242, 217, 200, 0.25)"
    ctx.lineWidth = 1
    ctx.strokeRect(14, 14, width - 28, height - 28)

    // Center emblem & instruction text
    ctx.fillStyle = "#F2D9C8"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    ctx.font = "italic 32px 'Dancing Script', cursive"
    ctx.fillText("Save the Date", width / 2, height / 2 - 35)

    ctx.font = "600 11px 'Josefin Sans', sans-serif"
    ctx.letterSpacing = "0.28em"
    ctx.fillText("✨ SCRATCH TO REVEAL OUR DATE ✨", width / 2, height / 2 + 15)

    ctx.font = "400 10px 'Josefin Sans', sans-serif"
    ctx.fillStyle = "rgba(242, 217, 200, 0.75)"
    ctx.fillText("Drag mouse or finger across the foil", width / 2, height / 2 + 40)
  }, [])

  useEffect(() => {
    if (envelopeState === "opened") {
      initCanvas()
    }
  }, [initCanvas, envelopeState])

  // Sparkles generator
  const spawnSparkles = (x: number, y: number) => {
    const colors = ["#F2D9C8", "#C49090", "#FFF", "#D4AF37"]
    const newParticles: Particle[] = []
    for (let i = 0; i < 5; i++) {
      newParticles.push({
        id: Math.random() + Date.now(),
        x,
        y,
        vx: (Math.random() - 0.5) * 4.5,
        vy: (Math.random() - 0.5) * 4.5 - 1,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
      })
    }
    setParticles((prev) => [...prev.slice(-40), ...newParticles])
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

  // Ultra-Accurate Pixel Sampling Calculation
  const checkScratchAmount = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || isRevealed) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imgData.data

    let transparentCount = 0
    const stride = 16 * 4 // sample every 16th pixel alpha
    let totalSampled = 0

    for (let i = 3; i < pixels.length; i += stride) {
      totalSampled++
      if (pixels[i] < 30) {
        transparentCount++
      }
    }

    const percent = Math.min(100, Math.round((transparentCount / totalSampled) * 100))
    setScratchPercent(percent)

    if (percent > 45 && !isRevealed) {
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

  // Smooth Interpolated Path Scratching
  const scratchPath = (x0: number, y0: number, x1: number, y1: number) => {
    const canvas = canvasRef.current
    if (!canvas || isRevealed) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const startX = (x0 - rect.left) * scaleX
    const startY = (y0 - rect.top) * scaleY
    const endX = (x1 - rect.left) * scaleX
    const endY = (y1 - rect.top) * scaleY

    const dx = endX - startX
    const dy = endY - startY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const radius = 42 * 2 // 42px radius scaled by 2x canvas ratio

    ctx.globalCompositeOperation = "destination-out"
    const steps = Math.max(1, Math.ceil(dist / 4))

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const cx = startX + dx * t
      const cy = startY + dy * t

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    spawnSparkles(x1 - rect.left, y1 - rect.top)
    checkScratchAmount()
  }

  const handlePointerDown = (x: number, y: number) => {
    isDrawingRef.current = true
    lastPointRef.current = { x, y }
    scratchPath(x, y, x, y)
  }

  const handlePointerMove = (x: number, y: number) => {
    if (!isDrawingRef.current) return
    if (lastPointRef.current) {
      scratchPath(lastPointRef.current.x, lastPointRef.current.y, x, y)
    }
    lastPointRef.current = { x, y }
  }

  const handlePointerUp = () => {
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

  return (
    <div
      className="min-h-screen relative overflow-x-hidden font-script"
      style={{ background: P.rosewoodPink, color: P.champagne }}
    >
      {/* 1. ENVELOPE UNOPENED / OPENING STATE (COVERS WHOLE PAGE) */}
      {envelopeState !== "opened" && (
        <div
          onClick={handleOpenEnvelope}
          className={`fixed inset-0 w-full h-[100dvh] z-30 overflow-hidden flex flex-col justify-between items-center select-none cursor-pointer transition-all duration-700 ${
            envelopeState === "opening" ? "scale-[1.01]" : ""
          }`}
          style={{
            background: P.rosewoodPinkDk,
          }}
        >
          {/* Inside Envelope Lining Texture / Gradient */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${P.champagne}20, transparent 75%), ${P.rosewoodPink}`,
            }}
          />

          {/* Double Gold / Champagne Inset Border */}
          <div className="absolute inset-3 sm:inset-6 md:inset-8 border border-[#F2D9C8]/25 rounded-md pointer-events-none z-10" />
          <div className="absolute inset-4 sm:inset-7 md:inset-9 border border-[#F2D9C8]/15 rounded pointer-events-none z-10" />

          {/* Vintage Postmark / Stamp in Top Right */}
          <div className="absolute top-6 right-6 sm:top-9 sm:right-9 z-20 flex flex-col items-center pointer-events-none opacity-85">
            <div className="border border-dashed border-[#F2D9C8]/60 px-3 py-2 rounded bg-[#844452]/80 backdrop-blur-sm text-center shadow-lg">
              <span className="block text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-[#F2D9C8]/80 font-medium">
                Wedding Mail
              </span>
              <span className="font-display text-xl sm:text-2xl text-[#F2D9C8] font-bold block my-0.5 leading-none">
                J &amp; S
              </span>
              <span className="block text-[8px] sm:text-[9px] uppercase tracking-widest text-amber-200/90 font-semibold">
                05·02·27
              </span>
            </div>
            {/* Postal wavy stamp cancellation lines */}
            <div className="mt-1 flex flex-col gap-0.5 opacity-40">
              <div className="w-14 sm:w-16 h-px bg-[#F2D9C8]" />
              <div className="w-12 sm:w-14 h-px bg-[#F2D9C8] ml-2" />
              <div className="w-14 sm:w-16 h-px bg-[#F2D9C8]" />
            </div>
          </div>

          {/* Audio Quick Toggle in Top Left */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleAudio()
            }}
            className="absolute top-6 left-6 sm:top-9 sm:left-9 z-40 px-3 py-1.5 rounded-full border border-[#F2D9C8]/30 bg-[#844452]/70 backdrop-blur-md text-xs text-[#F2D9C8] flex items-center gap-1.5 hover:bg-[#844452] transition-colors shadow-md"
          >
            <span>{isPlayingMusic ? "⏸️" : "🎵"}</span>
            <span className="text-[10px] sm:text-[11px] tracking-wider uppercase font-medium">
              {isPlayingMusic ? "Pause" : "Music"}
            </span>
          </button>

          {/* Envelope Flaps Graphic (Full screen SVG) */}
          <svg
            viewBox="0 0 400 280"
            className="absolute inset-0 w-full h-full z-10 pointer-events-none"
            preserveAspectRatio="none"
          >
            {/* Left Flap */}
            <polygon
              points="0,0 200,140 0,280"
              fill={`${P.rosewoodPinkDk}F2`}
              stroke={`${P.pink}35`}
              strokeWidth="1"
            />
            {/* Right Flap */}
            <polygon
              points="400,0 200,140 400,280"
              fill={`${P.rosewoodPinkDk}F2`}
              stroke={`${P.pink}35`}
              strokeWidth="1"
            />
            {/* Bottom Flap */}
            <polygon
              points="0,280 200,135 400,280"
              fill={`${P.rosewoodPinkDk}`}
              stroke={`${P.pink}45`}
              strokeWidth="1.5"
            />
          </svg>

          {/* Top Animated Flap */}
          <div
            className={`absolute top-0 left-0 right-0 h-1/2 z-20 origin-top transition-transform duration-1000 ${
              envelopeState === "opening" ? "-rotate-x-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            <svg viewBox="0 0 400 140" className="w-full h-full" preserveAspectRatio="none">
              <polygon
                points="0,0 200,140 400,0"
                fill={`${P.rosewoodPinkDk}`}
                stroke={`${P.pink}60`}
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Card preview sticking out when opening */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 bottom-8 w-[88%] max-w-lg h-[70%] rounded-t-2xl z-0 transition-all duration-1000 shadow-2xl ${
              envelopeState === "opening"
                ? "-translate-y-36 sm:-translate-y-48 scale-105 opacity-100"
                : "translate-y-4 opacity-40"
            }`}
            style={{
              background: P.pink,
              border: `2px solid ${P.champagne}`,
            }}
          />

          {/* Front Envelope Typography (Top Half) */}
          <div className="relative z-20 pt-16 sm:pt-20 md:pt-24 text-center px-4 pointer-events-none">
            <p
              className="text-xs sm:text-sm uppercase tracking-[0.35em] mb-2 font-medium"
              style={{ color: P.champagne }}
            >
              Save The Date
            </p>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl text-white drop-shadow-md">
              Josh &amp; Steph
            </h1>
            <div className="mt-3 flex justify-center">
              <div
                className="h-px w-36"
                style={{
                  background: `linear-gradient(to right, transparent, ${P.pink}, transparent)`,
                }}
              />
            </div>
            <p className="mt-2 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#F2D9C8]/80 font-light">
              February 5, 2027 · Tagaytay City
            </p>
          </div>

          {/* Wax Seal in Center */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center transition-all duration-500 ${
              envelopeState === "opening" ? "scale-150 opacity-0" : "scale-100 opacity-100 hover:scale-110"
            }`}
          >
            {/* Soft pulsing glow aura */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-25 bg-amber-300 pointer-events-none"
              style={{ animationDuration: "3s" }}
            />

            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center shadow-2xl relative select-none"
              style={{
                background: `radial-gradient(circle at 35% 35%, #D4AF37, ${P.rosewoodPink} 90%)`,
                border: `3px solid ${P.champagne}`,
                boxShadow: "0 15px 35px rgba(0,0,0,0.65), inset 0 0 12px rgba(255,255,255,0.45)",
              }}
            >
              <span className="font-display text-3xl sm:text-4xl text-white font-bold leading-none">J &amp; S</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-200 mt-1 font-semibold">
                05·02·27
              </span>
            </div>
          </div>

          {/* Instruction prompt (Bottom Half) */}
          <div className="relative z-20 pb-10 sm:pb-14 text-center pointer-events-none px-4">
            <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-amber-200/95 font-medium animate-pulse drop-shadow">
              ✉️ Tap the wax seal to open your invitation
            </p>
          </div>
        </div>
      )}

      {/* 2. ENVELOPE OPENED: PHOTO SCRATCH CARD */}
      {envelopeState === "opened" && (
        <main className="relative z-10 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col items-center text-center min-h-screen justify-center">
          {/* Title Heading */}
          <div className="mb-5 sm:mb-6">
            <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: P.champagne }}>
              Save The Date
            </p>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-white">
              Josh &amp; Steph
            </h1>
            <div className="mt-2 flex justify-center">
              <div
                className="h-px w-28"
                style={{
                  background: `linear-gradient(to right, transparent, ${P.pink}, transparent)`,
                }}
              />
            </div>
          </div>

          <p className="mb-4 text-xs uppercase tracking-[0.25em]" style={{ color: P.pink }}>
            ✨ Scratch the foil below to reveal our date!
          </p>

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
                    background: `linear-gradient(to top, ${P.rosewoodPinkDk}F0 0%, rgba(132, 68, 82, 0.35) 50%, rgba(132, 68, 82, 0.75) 100%)`,
                  }}
                />

                {/* Revealed Save The Date Card Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-between p-7 text-center z-10">
                  <div className="pt-2">
                    <span className="text-[10px] uppercase tracking-[0.35em] block mb-1" style={{ color: P.champagne }}>
                      We are getting married
                    </span>
                    <span className="font-display text-4xl text-white">Josh &amp; Steph</span>
                  </div>

                  <div
                    className="py-5 px-6 rounded-lg backdrop-blur-md border w-full max-w-xs shadow-lg"
                    style={{
                      background: "rgba(166, 94, 110, 0.7)",
                      borderColor: `${P.pink}70`,
                    }}
                  >
                    <p className="font-display text-4xl mb-1" style={{ color: P.pink }}>
                      February 5, 2027
                    </p>
                    <div className="h-px w-16 mx-auto my-2" style={{ background: `${P.pink}60` }} />
                    <p className="text-xs tracking-[0.2em] uppercase text-white font-medium">3:00 PM · Friday</p>
                    <p className="text-[11px] text-white/90 italic mt-1">Fruella’s Events Place</p>
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
                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={(e) => {
                  if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
                }}
                onTouchMove={(e) => {
                  if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
                }}
                onTouchEnd={handlePointerUp}
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
                    color: P.rosewoodPink,
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
                <span>{isPlayingMusic ? "⏸️ Pause Music" : "🎵 Play Music"}</span>
              </button>

              <button
                type="button"
                onClick={() => setEnvelopeState("closed")}
                className="px-5 py-2.5 text-xs uppercase tracking-[0.2em] rounded-sm border transition-all duration-300 hover:bg-white/10"
                style={{
                  borderColor: `${P.pink}50`,
                  color: P.champagne,
                }}
              >
                ✉️ View Envelope
              </button>
            </div>
        </main>
      )}
    </div>
  )
}
