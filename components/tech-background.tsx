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
    let particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number

      constructor(width: number, height: number) {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.size = Math.random() * 2 + 1
        this.opacity = Math.random() * 0.5 + 0.1
      }

      update(width: number, height: number) {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1
      }

      draw(ctx: CanvasRenderingContext2D, isDark: boolean) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = isDark 
          ? `rgba(100, 200, 255, ${this.opacity})` 
          : `rgba(50, 100, 150, ${this.opacity * 0.5})`
        ctx.fill()
      }
    }

    const initParticles = () => {
      particles = []
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000)
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height))
      }
    }

    const drawGrid = (isDark: boolean) => {
      const gridSize = 50
      ctx.strokeStyle = isDark 
        ? "rgba(100, 200, 255, 0.03)" 
        : "rgba(50, 100, 150, 0.05)"
      ctx.lineWidth = 1

      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    const drawConnections = (isDark: boolean) => {
      const maxDistance = 120
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.2
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = isDark 
              ? `rgba(100, 200, 255, ${opacity})` 
              : `rgba(50, 100, 150, ${opacity * 0.5})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      const isDark = document.documentElement.classList.contains("dark")
      
      // Fill with base background color
      ctx.fillStyle = isDark ? "hsl(224, 71%, 4%)" : "hsl(0, 0%, 100%)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw subtle gradient overlay
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 1.5
      )
      
      if (isDark) {
        gradient.addColorStop(0, "rgba(30, 60, 100, 0.1)")
        gradient.addColorStop(1, "rgba(10, 20, 40, 0)")
      } else {
        gradient.addColorStop(0, "rgba(200, 230, 255, 0.2)")
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)")
      }
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawGrid(isDark)

      // Update and draw particles
      for (const particle of particles) {
        particle.update(canvas.width, canvas.height)
        particle.draw(ctx, isDark)
      }

      drawConnections(isDark)

      animationFrameId = requestAnimationFrame(animate)
    }

    resize()
    initParticles()
    animate()

    window.addEventListener("resize", () => {
      resize()
      initParticles()
    })

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
