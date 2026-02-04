"use client"

import { useEffect, useRef } from "react"

export function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let time = 0
    
    // Pulse points that will glow
    const pulsePoints: { x: number; y: number; phase: number; speed: number }[] = []
    
    const initPulsePoints = () => {
      pulsePoints.length = 0
      const gridSize = 60
      for (let x = 0; x <= canvas.width; x += gridSize) {
        for (let y = 0; y <= canvas.height; y += gridSize) {
          if (Math.random() > 0.85) {
            pulsePoints.push({
              x,
              y,
              phase: Math.random() * Math.PI * 2,
              speed: 0.02 + Math.random() * 0.02
            })
          }
        }
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initPulsePoints()
    }

    const draw = () => {
      const isDark = document.documentElement.classList.contains("dark")
      time += 0.016
      
      // Fill with base background color - pure black/white
      ctx.fillStyle = isDark ? "#0a0a0a" : "#fafafa"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Animated gradient position
      const gradientOffset1X = Math.sin(time * 0.3) * 100
      const gradientOffset1Y = Math.cos(time * 0.2) * 100
      const gradientOffset2X = Math.cos(time * 0.25) * 80
      const gradientOffset2Y = Math.sin(time * 0.35) * 80

      // Draw sophisticated gradient - top left corner glow (grayscale only)
      const gradient1 = ctx.createRadialGradient(
        gradientOffset1X,
        gradientOffset1Y,
        0,
        gradientOffset1X,
        gradientOffset1Y,
        canvas.width * 0.8
      )
      
      if (isDark) {
        gradient1.addColorStop(0, "rgba(255, 255, 255, 0.04)")
        gradient1.addColorStop(0.5, "rgba(255, 255, 255, 0.02)")
        gradient1.addColorStop(1, "rgba(0, 0, 0, 0)")
      } else {
        gradient1.addColorStop(0, "rgba(0, 0, 0, 0.025)")
        gradient1.addColorStop(0.5, "rgba(0, 0, 0, 0.012)")
        gradient1.addColorStop(1, "rgba(255, 255, 255, 0)")
      }
      
      ctx.fillStyle = gradient1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw second gradient - bottom right corner glow (grayscale only)
      const gradient2 = ctx.createRadialGradient(
        canvas.width + gradientOffset2X,
        canvas.height + gradientOffset2Y,
        0,
        canvas.width + gradientOffset2X,
        canvas.height + gradientOffset2Y,
        canvas.width * 0.6
      )
      
      if (isDark) {
        gradient2.addColorStop(0, "rgba(255, 255, 255, 0.03)")
        gradient2.addColorStop(0.5, "rgba(255, 255, 255, 0.015)")
        gradient2.addColorStop(1, "rgba(0, 0, 0, 0)")
      } else {
        gradient2.addColorStop(0, "rgba(0, 0, 0, 0.02)")
        gradient2.addColorStop(0.5, "rgba(0, 0, 0, 0.01)")
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

      // Draw animated pulse points at grid intersections
      for (const point of pulsePoints) {
        const pulse = Math.sin(time * point.speed * 60 + point.phase) * 0.5 + 0.5
        const radius = 2 + pulse * 3
        const opacity = 0.1 + pulse * 0.2
        
        const glowGradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, radius * 4
        )
        
        if (isDark) {
          glowGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`)
          glowGradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.3})`)
          glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
        } else {
          glowGradient.addColorStop(0, `rgba(0, 0, 0, ${opacity * 0.8})`)
          glowGradient.addColorStop(0.5, `rgba(0, 0, 0, ${opacity * 0.2})`)
          glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)")
        }
        
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius * 4, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(animationFrameId)
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
