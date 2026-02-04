"use client"

import { useEffect, useRef } from "react"

export function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      draw()
    }

    const draw = () => {
      const isDark = document.documentElement.classList.contains("dark")
      
      // Fill with base background color - pure black/white
      ctx.fillStyle = isDark ? "#0a0a0a" : "#fafafa"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw sophisticated gradient - top left corner glow (grayscale only)
      const gradient1 = ctx.createRadialGradient(
        0, 0, 0,
        0, 0, canvas.width * 0.8
      )
      
      if (isDark) {
        gradient1.addColorStop(0, "rgba(255, 255, 255, 0.03)")
        gradient1.addColorStop(0.5, "rgba(255, 255, 255, 0.015)")
        gradient1.addColorStop(1, "rgba(0, 0, 0, 0)")
      } else {
        gradient1.addColorStop(0, "rgba(0, 0, 0, 0.02)")
        gradient1.addColorStop(0.5, "rgba(0, 0, 0, 0.01)")
        gradient1.addColorStop(1, "rgba(255, 255, 255, 0)")
      }
      
      ctx.fillStyle = gradient1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw second gradient - bottom right corner glow (grayscale only)
      const gradient2 = ctx.createRadialGradient(
        canvas.width, canvas.height, 0,
        canvas.width, canvas.height, canvas.width * 0.6
      )
      
      if (isDark) {
        gradient2.addColorStop(0, "rgba(255, 255, 255, 0.025)")
        gradient2.addColorStop(0.5, "rgba(255, 255, 255, 0.01)")
        gradient2.addColorStop(1, "rgba(0, 0, 0, 0)")
      } else {
        gradient2.addColorStop(0, "rgba(0, 0, 0, 0.015)")
        gradient2.addColorStop(0.5, "rgba(0, 0, 0, 0.008)")
        gradient2.addColorStop(1, "rgba(255, 255, 255, 0)")
      }
      
      ctx.fillStyle = gradient2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw subtle grid - grayscale only
      const gridSize = 60
      ctx.lineWidth = 1
      
      // Vertical lines
      for (let x = 0; x <= canvas.width; x += gridSize) {
        const lineGradient = ctx.createLinearGradient(x, 0, x, canvas.height)
        if (isDark) {
          lineGradient.addColorStop(0, "rgba(255, 255, 255, 0)")
          lineGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.04)")
          lineGradient.addColorStop(0.7, "rgba(255, 255, 255, 0.04)")
          lineGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
        } else {
          lineGradient.addColorStop(0, "rgba(0, 0, 0, 0)")
          lineGradient.addColorStop(0.3, "rgba(0, 0, 0, 0.05)")
          lineGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.05)")
          lineGradient.addColorStop(1, "rgba(0, 0, 0, 0)")
        }
        ctx.strokeStyle = lineGradient
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Horizontal lines
      for (let y = 0; y <= canvas.height; y += gridSize) {
        const lineGradient = ctx.createLinearGradient(0, y, canvas.width, y)
        if (isDark) {
          lineGradient.addColorStop(0, "rgba(255, 255, 255, 0)")
          lineGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.04)")
          lineGradient.addColorStop(0.7, "rgba(255, 255, 255, 0.04)")
          lineGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
        } else {
          lineGradient.addColorStop(0, "rgba(0, 0, 0, 0)")
          lineGradient.addColorStop(0.3, "rgba(0, 0, 0, 0.05)")
          lineGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.05)")
          lineGradient.addColorStop(1, "rgba(0, 0, 0, 0)")
        }
        ctx.strokeStyle = lineGradient
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    resize()

    // Observe theme changes
    const observer = new MutationObserver(() => {
      draw()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    window.addEventListener("resize", resize)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
