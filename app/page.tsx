"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import jsQR from "jsqr"
import {
  Plus,
  Camera,
  Upload,
  Settings,
  Copy,
  Trash2,
  Edit2,
  QrCode,
  Key,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Download,
  MoreVertical,
  Sun,
  Moon,
  Monitor,
  Languages,
  Check,
  Github,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/components/theme-provider"
import { useLanguage } from "@/lib/i18n"
import { TechBackground } from "@/components/tech-background"

interface TOTPToken {
  id: string
  name: string
  issuer: string
  secret: string
  algorithm: "SHA1" | "SHA256" | "SHA512"
  digits: 6 | 8
  period: number
  createdAt: number
}

interface AppSettings {
  showCodes: boolean
  autoRefresh: boolean
  sortBy: "name" | "issuer" | "recent"
}

// TOTP Generation functions
function base32Decode(encoded: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "")

  let bits = ""
  for (const char of cleanedInput) {
    const val = alphabet.indexOf(char)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, "0")
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(bits.slice(i * 8, (i + 1) * 8), 2)
  }

  return bytes
}

async function hmacSha(algorithm: string, key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: algorithm }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message)
  return new Uint8Array(signature)
}

async function generateTOTP(
  secret: string,
  algorithm: "SHA1" | "SHA256" | "SHA512" = "SHA1",
  digits: 6 | 8 = 6,
  period = 30,
): Promise<string> {
  const key = base32Decode(secret)
  const time = Math.floor(Date.now() / 1000 / period)

  const timeBuffer = new ArrayBuffer(8)
  const timeView = new DataView(timeBuffer)
  timeView.setBigUint64(0, BigInt(time), false)

  const hashAlgorithm = algorithm === "SHA1" ? "SHA-1" : algorithm === "SHA256" ? "SHA-256" : "SHA-512"
  const hmac = await hmacSha(hashAlgorithm, key, new Uint8Array(timeBuffer))

  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const otp = binary % Math.pow(10, digits)
  return otp.toString().padStart(digits, "0")
}

function parseOTPAuthURI(uri: string): Partial<TOTPToken> | null {
  try {
    const url = new URL(uri)
    if (url.protocol !== "otpauth:") return null
    if (url.host !== "totp") return null

    const path = decodeURIComponent(url.pathname.slice(1))
    const params = url.searchParams

    let issuer = params.get("issuer") || ""
    let name = path

    if (path.includes(":")) {
      const [iss, n] = path.split(":")
      issuer = issuer || iss
      name = n
    }

    return {
      name,
      issuer,
      secret: params.get("secret") || "",
      algorithm: (params.get("algorithm")?.toUpperCase() as "SHA1" | "SHA256" | "SHA512") || "SHA1",
      digits: Number.parseInt(params.get("digits") || "6") as 6 | 8,
      period: Number.parseInt(params.get("period") || "30"),
    }
  } catch {
    return null
  }
}

export default function TwoFactorAuth() {
  const [tokens, setTokens] = useState<TOTPToken[]>([])
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(30)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingToken, setEditingToken] = useState<TOTPToken | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  const [newToken, setNewToken] = useState({
    name: "",
    issuer: "",
    secret: "",
    algorithm: "SHA1" as "SHA1" | "SHA256" | "SHA512",
    digits: 6 as 6 | 8,
    period: 30,
  })

  const [settings, setSettings] = useState<AppSettings>({
    showCodes: true,
    autoRefresh: true,
    sortBy: "name",
  })

  // Load tokens and settings from localStorage
  useEffect(() => {
    const savedTokens = localStorage.getItem("2fa-tokens")
    const savedSettings = localStorage.getItem("2fa-settings")
    if (savedTokens) {
      setTokens(JSON.parse(savedTokens))
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save tokens to localStorage
  useEffect(() => {
    localStorage.setItem("2fa-tokens", JSON.stringify(tokens))
  }, [tokens])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("2fa-settings", JSON.stringify(settings))
  }, [settings])

  // Generate codes for all tokens
  const generateAllCodes = useCallback(async () => {
    const newCodes: Record<string, string> = {}
    for (const token of tokens) {
      try {
        newCodes[token.id] = await generateTOTP(token.secret, token.algorithm, token.digits, token.period)
      } catch {
        newCodes[token.id] = "Error"
      }
    }
    setCodes(newCodes)
  }, [tokens])

  // Timer for TOTP refresh
  useEffect(() => {
    generateAllCodes()

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = 30 - (now % 30)
      setTimeLeft(remaining)

      if (remaining === 30) {
        generateAllCodes()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [generateAllCodes])

  const addToken = () => {
    if (!newToken.name || !newToken.secret) {
      toast({
        title: t.error,
        description: t.fillRequired,
        variant: "destructive",
      })
      return
    }

    const cleanSecret = newToken.secret.replace(/\s/g, "").toUpperCase()

    const isDuplicate = tokens.some((token) => token.secret === cleanSecret)
    if (isDuplicate) {
      toast({
        title: t.duplicateToken,
        description: t.duplicateTokenDesc,
        variant: "destructive",
      })
      return
    }

    const token: TOTPToken = {
      id: crypto.randomUUID(),
      name: newToken.name,
      issuer: newToken.issuer,
      secret: cleanSecret,
      algorithm: newToken.algorithm,
      digits: newToken.digits,
      period: newToken.period,
      createdAt: Date.now(),
    }

    setTokens([...tokens, token])
    setNewToken({
      name: "",
      issuer: "",
      secret: "",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    })
    setShowAdvanced(false)
    setIsAddDialogOpen(false)

    toast({
      title: t.addSuccess,
      description: `${t.added} ${token.name}`,
    })
  }

  const addTokenDirectly = (parsed: {
    name?: string
    issuer?: string
    secret?: string
    algorithm?: string
    digits?: number
    period?: number
  }) => {
    if (!parsed.name || !parsed.secret) {
      toast({
        title: t.error,
        description: t.fillRequired,
        variant: "destructive",
      })
      return false
    }

    const cleanSecret = parsed.secret.replace(/\s/g, "").toUpperCase()

    const isDuplicate = tokens.some((token) => token.secret === cleanSecret)
    if (isDuplicate) {
      toast({
        title: t.duplicateToken,
        description: t.duplicateTokenDesc,
        variant: "destructive",
      })
      return false
    }

    const token: TOTPToken = {
      id: crypto.randomUUID(),
      name: parsed.name,
      issuer: parsed.issuer || "",
      secret: cleanSecret,
      algorithm: (parsed.algorithm as "SHA1" | "SHA256" | "SHA512") || "SHA1",
      digits: parsed.digits || 6,
      period: parsed.period || 30,
      createdAt: Date.now(),
    }

    setTokens((prev) => [...prev, token])
    setNewToken({
      name: "",
      issuer: "",
      secret: "",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    })
    setShowAdvanced(false)
    setIsAddDialogOpen(false)

    toast({
      title: t.addSuccess,
      description: `${t.added} ${token.name}`,
    })
    return true
  }

  const deleteToken = (id: string) => {
    const token = tokens.find((t) => t.id === id)
    setTokens(tokens.filter((t) => t.id !== id))
    toast({
      title: t.deleted,
      description: `${t.deleted} ${token?.name}`,
    })
  }

  const updateToken = () => {
    if (!editingToken) return
    setTokens(tokens.map((tk) => (tk.id === editingToken.id ? editingToken : tk)))
    setEditingToken(null)
    toast({
      title: t.updated,
      description: t.tokenUpdated,
    })
  }

  const copyCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: t.copied,
      description: `${name} ${t.codeCopied}`,
    })
  }

  // QR Code scanning from camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream

      setIsCameraOpen(true)

      // Wait for the video element to mount before attaching the stream
      await new Promise<void>((resolve, reject) => {
        let attempts = 0
        const waitForVideo = () => {
          if (videoRef.current) {
            resolve()
            return
          }
          attempts += 1
          if (attempts > 10) {
            reject(new Error("Video element not available"))
            return
          }
          requestAnimationFrame(waitForVideo)
        }
        waitForVideo()
      })

      if (!videoRef.current) {
        throw new Error("Video element not available")
      }

      videoRef.current.srcObject = stream
      // Wait for video to be ready before playing
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!
        video.onloadedmetadata = () => {
          video
            .play()
            .then(() => resolve())
            .catch(reject)
        }
        video.onerror = () => reject(new Error("Video load error"))
      })

      // Start scanning after a short delay to ensure video is rendering
      setTimeout(() => scanQRCode(), 500)
    } catch (error) {
      console.log("[v0] Camera error:", error)
      toast({
        title: t.cameraFailed,
        description: t.cameraPermission,
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    const scan = () => {
      if (!streamRef.current) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (code && code.data) {
          // Found QR code
          const parsed = parseOTPAuthURI(code.data)
          if (parsed) {
            stopCamera()
            addTokenDirectly(parsed)
            return
          }
        }
      }

      if (streamRef.current) {
        requestAnimationFrame(scan)
      }
    }

    // Wait for video to be ready before scanning
    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      scan()
    } else {
      video.addEventListener("loadeddata", scan, { once: true })
    }
  }

  // Handle image upload for QR scanning
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      })

      if (code && code.data) {
        const parsed = parseOTPAuthURI(code.data)
        if (parsed) {
          addTokenDirectly(parsed)
        } else {
          toast({
            title: t.scanFailed,
            description: t.invalidQRCode,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: t.scanFailed,
          description: t.noQRCodeFound,
          variant: "destructive",
        })
      }
    }
    img.src = URL.createObjectURL(file)

    // Reset file input
    if (event.target) {
      event.target.value = ""
    }
  }

  // Handle URI paste
  const handleURIPaste = (uri: string) => {
    const parsed = parseOTPAuthURI(uri)
    if (parsed) {
      setNewToken({
        name: parsed.name || "",
        issuer: parsed.issuer || "",
        secret: parsed.secret || "",
        algorithm: parsed.algorithm || "SHA1",
        digits: parsed.digits || 6,
        period: parsed.period || 30,
      })
      toast({
        title: t.parseSuccess,
        description: t.extractedInfo,
      })
    } else {
      toast({
        title: t.parseFailed,
        description: t.invalidUri,
        variant: "destructive",
      })
    }
  }

  // Export tokens
  const exportTokens = () => {
    const data = JSON.stringify(tokens, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "2fa-tokens-backup.json"
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: t.exportSuccess,
      description: t.exportedJson,
    })
  }

  // Import tokens
  const importTokens = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          setTokens([...tokens, ...imported])
          toast({
            title: t.importSuccess,
            description: `${t.added} ${imported.length} ${t.importedTokens}`,
          })
        }
      } catch {
        toast({
          title: t.importFailed,
          description: t.invalidFormat,
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  // Filter and sort tokens
  const filteredTokens = tokens
    .filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.issuer.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      switch (settings.sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "issuer":
          return a.issuer.localeCompare(b.issuer)
        case "recent":
          return b.createdAt - a.createdAt
        default:
          return 0
      }
    })

  // Cycle through themes
  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const handleAddDialogChange = (open: boolean) => {
    if (!open) {
      // Stop camera when dialog is closed
      stopCamera()
    }
    setIsAddDialogOpen(open)
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <TechBackground />
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t.appName}</h1>
                <p className="text-xs text-muted-foreground">{t.appDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                asChild
              >
                <a
                  href="https://github.com/handsomezhuzhu/2fa-tool"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub"
                >
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={cycleTheme}
                title={theme === "light" ? t.themeLight : theme === "dark" ? t.themeDark : t.themeSystem}
              >
                {theme === "light" && <Sun className="h-5 w-5" />}
                {theme === "dark" && <Moon className="h-5 w-5" />}
                {theme === "system" && <Monitor className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Languages className="h-5 w-5" />
                    <span className="sr-only">Toggle language</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("zh")}>中文 {language === "zh" && "✓"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("en")}>
                    English {language === "en" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.settings}</DialogTitle>
                    <DialogDescription>{t.settingsDesc}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t.showCodes}</Label>
                        <p className="text-sm text-muted-foreground">{t.showCodesDesc}</p>
                      </div>
                      <Switch
                        checked={settings.showCodes}
                        onCheckedChange={(checked) => setSettings({ ...settings, showCodes: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.sortBy}</Label>
                      <Select
                        value={settings.sortBy}
                        onValueChange={(value: "name" | "issuer" | "recent") =>
                          setSettings({ ...settings, sortBy: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">{t.sortByName}</SelectItem>
                          <SelectItem value="issuer">{t.sortByIssuer}</SelectItem>
                          <SelectItem value="recent">{t.sortByRecent}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="border-t pt-4 space-y-3">
                      <Label>{t.dataManagement}</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportTokens}>
                          <Download className="h-4 w-4 mr-2" />
                          {t.exportBackup}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <label>
                            <Upload className="h-4 w-4 mr-2" />
                            {t.importBackup}
                            <input type="file" accept=".json" className="hidden" onChange={importTokens} />
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 md:px-8 py-6 relative z-10">
        {/* Timer Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t.nextRefresh}</span>
            </div>
            <span className="text-sm font-medium">{timeLeft}s</span>
          </div>
          <Progress value={(timeLeft / 30) * 100} className="h-1" />
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogChange}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addToken}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.addNewToken}</DialogTitle>
                  <DialogDescription>{t.addNewTokenDesc}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="manual" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="manual">
                      <Key className="h-4 w-4 mr-2" />
                      {t.manualInput}
                    </TabsTrigger>
                    <TabsTrigger value="camera">
                      <Camera className="h-4 w-4 mr-2" />
                      {t.scanQr}
                    </TabsTrigger>
                    <TabsTrigger value="upload">
                      <Upload className="h-4 w-4 mr-2" />
                      {t.uploadImage}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>{t.otpauthUri}</Label>
                      <Input placeholder="otpauth://totp/..." onChange={(e) => handleURIPaste(e.target.value)} />
                      <p className="text-xs text-muted-foreground">{t.otpauthUriHint}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.name} *</Label>
                      <Input
                        placeholder={t.namePlaceholder}
                        value={newToken.name}
                        onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.issuer}</Label>
                      <Input
                        placeholder={t.issuerPlaceholder}
                        value={newToken.issuer}
                        onChange={(e) => setNewToken({ ...newToken, issuer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.secretKey} *</Label>
                      <Input
                        placeholder="JBSWY3DPEHPK3PXP"
                        value={newToken.secret}
                        onChange={(e) => setNewToken({ ...newToken, secret: e.target.value })}
                        className="font-mono"
                      />
                    </div>

                    {/* Advanced Settings */}
                    <div className="border-t pt-4">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {t.advancedSettings}
                      </button>

                      {showAdvanced && (
                        <div className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label>{t.algorithm}</Label>
                            <Select
                              value={newToken.algorithm}
                              onValueChange={(value: "SHA1" | "SHA256" | "SHA512") =>
                                setNewToken({ ...newToken, algorithm: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SHA1">{t.algorithmDefault}</SelectItem>
                                <SelectItem value="SHA256">SHA-256</SelectItem>
                                <SelectItem value="SHA512">SHA-512</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{t.digits}</Label>
                            <Select
                              value={newToken.digits.toString()}
                              onValueChange={(value) =>
                                setNewToken({ ...newToken, digits: Number.parseInt(value) as 6 | 8 })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="6">{t.digitsDefault}</SelectItem>
                                <SelectItem value="8">{t.digits8}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{t.period}</Label>
                            <Input
                              type="number"
                              value={newToken.period}
                              onChange={(e) =>
                                setNewToken({ ...newToken, period: Number.parseInt(e.target.value) || 30 })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="camera" className="mt-4">
                    <div className="space-y-4">
                      {!isCameraOpen ? (
                        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-4">
                          <Camera className="h-12 w-12 text-muted-foreground" />
                          <Button onClick={startCamera}>
                            <Camera className="h-4 w-4 mr-2" />
                            {t.startCamera}
                          </Button>
                        </div>
                      ) : (
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                          <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
                          <canvas ref={canvasRef} className="hidden" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-4 right-4"
                            onClick={stopCamera}
                          >
                            {t.closeCamera}
                          </Button>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground text-center">{t.scanHint}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4">
                    <div className="space-y-4">
                      <div
                        className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <QrCode className="h-12 w-12 text-muted-foreground" />
                        <div className="text-center">
                          <p className="font-medium">{t.uploadHint}</p>
                          <p className="text-sm text-muted-foreground">{t.uploadFormats}</p>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button onClick={addToken}>{t.add}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tokens List */}
        {filteredTokens.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.noTokens}</h3>
              <p className="text-muted-foreground mb-4">{t.noTokensHint}</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t.addToken}
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Update grid layout - always use single column
          <div className="grid gap-3 grid-cols-1">
            {filteredTokens.map((token) => (
              <TokenCard
                key={token.id}
                token={token}
                code={codes[token.id] || "------"}
                timeLeft={timeLeft}
                showCode={settings.showCodes}
                // Remove compactMode prop
                onCopy={() => copyCode(codes[token.id], token.name)}
                onEdit={() => setEditingToken(token)}
                onDelete={() => deleteToken(token.id)}
                t={t}
                language={language}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingToken} onOpenChange={(open) => !open && setEditingToken(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.editToken}</DialogTitle>
          </DialogHeader>
          {editingToken && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t.name}</Label>
                <Input
                  value={editingToken.name}
                  onChange={(e) => setEditingToken({ ...editingToken, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.issuer}</Label>
                <Input
                  value={editingToken.issuer}
                  onChange={(e) => setEditingToken({ ...editingToken, issuer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.secretKey}</Label>
                <Input
                  value={editingToken.secret}
                  onChange={(e) => setEditingToken({ ...editingToken, secret: e.target.value.toUpperCase().replace(/\s/g, "") })}
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t.algorithm}</Label>
                  <Select
                    value={editingToken.algorithm}
                    onValueChange={(value: "SHA1" | "SHA256" | "SHA512") =>
                      setEditingToken({ ...editingToken, algorithm: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHA1">SHA-1</SelectItem>
                      <SelectItem value="SHA256">SHA-256</SelectItem>
                      <SelectItem value="SHA512">SHA-512</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t.digits}</Label>
                  <Select
                    value={editingToken.digits.toString()}
                    onValueChange={(value) =>
                      setEditingToken({ ...editingToken, digits: parseInt(value) as 6 | 8 })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t.period}</Label>
                  <Select
                    value={editingToken.period.toString()}
                    onValueChange={(value) =>
                      setEditingToken({ ...editingToken, period: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30s</SelectItem>
                      <SelectItem value="60">60s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingToken(null)}>
              {t.cancel}
            </Button>
            <Button onClick={updateToken}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      {process.env.NEXT_PUBLIC_SHOW_FOOTER === "true" && (
        <footer className="border-t py-6 mt-auto relative z-10 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 text-center md:flex-row md:justify-between md:gap-4 px-4">
            <p className="text-xs tracking-wider text-muted-foreground">
              © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_FOOTER_COPYRIGHT || ""}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs tracking-wider text-muted-foreground/60">
              {process.env.NEXT_PUBLIC_ICP_NUMBER && (
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-muted-foreground"
                >
                  {process.env.NEXT_PUBLIC_ICP_NUMBER}
                </a>
              )}
              {process.env.NEXT_PUBLIC_ICP_NUMBER && process.env.NEXT_PUBLIC_PSB_NUMBER && (
                <span className="text-muted-foreground/30">|</span>
              )}
              {process.env.NEXT_PUBLIC_PSB_NUMBER && (
                <a
                  href="https://beian.mps.gov.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-muted-foreground"
                >
                  <img
                    alt="公安备案"
                    loading="lazy"
                    width="14"
                    height="14"
                    decoding="async"
                    className="opacity-60"
                    src="/images/beian.png"
                  />
                  {process.env.NEXT_PUBLIC_PSB_NUMBER}
                </a>
              )}
            </div>
          </div>
        </footer>
      )}

      <Toaster />
    </div>
  )
}

interface TokenCardProps {
  token: TOTPToken
  code: string
  timeLeft: number
  showCode: boolean
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
  t: Record<string, string>
  language: string
}

function TokenCard({ token, code, timeLeft, showCode, onCopy, onEdit, onDelete, t, language }: TokenCardProps) {
  const [visible, setVisible] = useState(showCode)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setVisible(showCode)
  }, [showCode])

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedCode =
    code.length === 6
      ? `${code.slice(0, 3)} ${code.slice(3)}`
      : code.length === 8
        ? `${code.slice(0, 4)} ${code.slice(4)}`
        : code

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Avatar and name - with truncation */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{token.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate" title={token.name}>
                {token.name}
              </p>
              {token.issuer && (
                <p className="text-xs text-muted-foreground truncate" title={token.issuer}>
                  {token.issuer}
                </p>
              )}
            </div>
          </div>

          {/* Right: Code and actions - fixed width */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setVisible(!visible)}
              className="p-1.5 hover:bg-muted rounded-md transition-colors"
              title={visible ? t.hideCode : t.showCode}
            >
              {visible ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <span
              className={`font-mono text-base font-bold min-w-[90px] text-center transition-colors ${
                copied ? "text-green-500" : ""
              }`}
            >
              {visible ? formattedCode : "••• •••"}
            </span>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} title={t.copy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t.edit}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
