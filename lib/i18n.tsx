"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "zh" | "en"

const translations = {
  zh: {
    // Header
    appName: "2FA 验证器",
    appDescription: "安全的双因素认证工具",

    // Timer
    nextRefresh: "下次刷新",

    // Search
    searchPlaceholder: "搜索令牌...",

    // Add token
    addToken: "添加令牌",
    addNewToken: "添加新令牌",
    addNewTokenDesc: "手动输入密钥或扫描二维码",
    manualInput: "手动输入",
    scanQr: "扫码",
    uploadImage: "上传图片",
    otpauthUri: "otpauth URI (可选)",
    otpauthUriHint: "粘贴完整的 URI 可自动填充以下信息",
    name: "名称",
    namePlaceholder: "例如：GitHub",
    issuer: "发行者",
    issuerPlaceholder: "例如：GitHub Inc.",
    secretKey: "密钥",
    advancedSettings: "高级设置",
    algorithm: "算法",
    algorithmDefault: "SHA-1 (默认)",
    digits: "验证码位数",
    digitsDefault: "6 位 (默认)",
    digits8: "8 位",
    period: "刷新周期 (秒)",
    cancel: "取消",
    add: "添加",
    save: "保存",

    // Camera
    startCamera: "启动相机",
    closeCamera: "关闭相机",
    scanHint: "将二维码对准框内即可自动识别",

    // Upload
    uploadHint: "点击上传二维码图片",
    uploadFormats: "支持 PNG, JPG, GIF",

    // Token card
    copyCode: "复制验证码",
    edit: "编辑",
    delete: "删除",
    copy: "复制",

    // Empty state
    noTokens: "暂无令牌",
    noTokensHint: "点击“添加令牌”开始添加您的第一个 2FA 令牌",

    // Edit dialog
    editToken: "编辑令牌",

    // Settings
    settings: "设置",
    settingsDesc: "自定义您的 2FA 验证器",
    showCodes: "显示验证码",
    showCodesDesc: "默认显示或隐藏验证码",
    compactMode: "紧凑模式",
    compactModeDesc: "使用更紧凑的列表布局",
    sortBy: "排序方式",
    sortByName: "按名称",
    sortByIssuer: "按发行者",
    sortByRecent: "按添加时间",
    dataManagement: "数据管理",
    exportBackup: "导出备份",
    importBackup: "导入备份",
    theme: "主题",
    themeLight: "浅色",
    themeDark: "深色",
    themeSystem: "跟随系统",
    language: "语言",

    // Toast messages
    error: "错误",
    fillRequired: "请填写名称和密钥",
    addSuccess: "添加成功",
    added: "已添加",
    deleted: "已删除",
    updated: "已更新",
    tokenUpdated: "令牌信息已更新",
    copied: "已复制",
    codeCopied: "的验证码已复制到剪贴板",
    cameraFailed: "相机访问失败",
    cameraPermission: "请确保已授予相机权限",
    imageUploaded: "图片已上传",
    imageUploadedHint: "请手动输入二维码中的 otpauth:// URI",
    parseSuccess: "解析成功",
    extractedInfo: "已从 URI 中提取信息",
    parseFailed: "解析失败",
    invalidUri: "无效的 otpauth URI",
    exportSuccess: "导出成功",
    exportedJson: "令牌已导出为 JSON 文件",
    importSuccess: "导入成功",
    importedTokens: "个令牌",
    importFailed: "导入失败",
    invalidFormat: "无效的文件格式",
  },
  en: {
    // Header
    appName: "2FA Authenticator",
    appDescription: "Secure two-factor authentication tool",

    // Timer
    nextRefresh: "Next refresh",

    // Search
    searchPlaceholder: "Search tokens...",

    // Add token
    addToken: "Add Token",
    addNewToken: "Add New Token",
    addNewTokenDesc: "Enter secret key manually or scan QR code",
    manualInput: "Manual",
    scanQr: "Scan",
    uploadImage: "Upload",
    otpauthUri: "otpauth URI (optional)",
    otpauthUriHint: "Paste full URI to auto-fill the form",
    name: "Name",
    namePlaceholder: "e.g., GitHub",
    issuer: "Issuer",
    issuerPlaceholder: "e.g., GitHub Inc.",
    secretKey: "Secret Key",
    advancedSettings: "Advanced Settings",
    algorithm: "Algorithm",
    algorithmDefault: "SHA-1 (default)",
    digits: "Code Length",
    digitsDefault: "6 digits (default)",
    digits8: "8 digits",
    period: "Refresh Period (seconds)",
    cancel: "Cancel",
    add: "Add",
    save: "Save",

    // Camera
    startCamera: "Start Camera",
    closeCamera: "Close Camera",
    scanHint: "Align QR code within the frame",

    // Upload
    uploadHint: "Click to upload QR code image",
    uploadFormats: "Supports PNG, JPG, GIF",

    // Token card
    copyCode: "Copy Code",
    edit: "Edit",
    delete: "Delete",
    copy: "Copy",

    // Empty state
    noTokens: "No Tokens",
    noTokensHint: 'Click "Add Token" to add your first 2FA token',

    // Edit dialog
    editToken: "Edit Token",

    // Settings
    settings: "Settings",
    settingsDesc: "Customize your 2FA Authenticator",
    showCodes: "Show Codes",
    showCodesDesc: "Show or hide codes by default",
    compactMode: "Compact Mode",
    compactModeDesc: "Use a more compact list layout",
    sortBy: "Sort By",
    sortByName: "By Name",
    sortByIssuer: "By Issuer",
    sortByRecent: "By Date Added",
    dataManagement: "Data Management",
    exportBackup: "Export Backup",
    importBackup: "Import Backup",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    language: "Language",

    // Toast messages
    error: "Error",
    fillRequired: "Please fill in name and secret key",
    addSuccess: "Success",
    added: "Added",
    deleted: "Deleted",
    updated: "Updated",
    tokenUpdated: "Token info updated",
    copied: "Copied",
    codeCopied: "'s code copied to clipboard",
    cameraFailed: "Camera access failed",
    cameraPermission: "Please grant camera permission",
    imageUploaded: "Image uploaded",
    imageUploadedHint: "Please manually enter the otpauth:// URI from the QR code",
    parseSuccess: "Parsed successfully",
    extractedInfo: "Extracted info from URI",
    parseFailed: "Parse failed",
    invalidUri: "Invalid otpauth URI",
    exportSuccess: "Export successful",
    exportedJson: "Tokens exported as JSON file",
    importSuccess: "Import successful",
    importedTokens: "tokens",
    importFailed: "Import failed",
    invalidFormat: "Invalid file format",
  },
}

type Translations = typeof translations.zh

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh")

  useEffect(() => {
    const stored = localStorage.getItem("2fa-language") as Language | null
    if (stored) {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    localStorage.setItem("2fa-language", lang)
    setLanguageState(lang)
  }

  const t = translations[language]

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
