# Frontend 2FA Tool

这是一个安全、离线优先的前端双因素认证 (2FA) 工具，基于 Next.js 构建。

## 功能特性

- 🔒 **安全**: 所有数据存储在本地，不上传服务器
- 📱 **QR 扫码**: 支持直接扫描 QR 码添加令牌 (使用 jsQR)
- ⌨️ **手动录入**: 支持手动输入密钥添加
- 🌓 **深色模式**: 内置明亮/深色主题切换
- 📤 **导入/导出**: 支持令牌数据的备份与恢复
- 🌐 **多语言**: 支持国际化

## 技术栈

- **框架**: Next.js 14
- **UI 组件**: Radix UI
- **样式**: Tailwind CSS
- **工具库**: jsQR, date-fns

## 环境变量

可以在部署时设置以下环境变量来配置页脚信息：

- `NEXT_PUBLIC_SHOW_FOOTER`: 是否显示页脚 (默认: true, 设置为 "false" 隐藏)
- `NEXT_PUBLIC_FILING_ICP`: ICP 备案号 (例如: 滇ICP备xxxxxxxx号)
- `NEXT_PUBLIC_FILING_SECURITY`: 公安联网备案号 (例如: 滇公网安备xxxxxxxxxxxxxx号)

## 声明

本项目由阿里云ESA提供加速、计算和保护

![阿里云ESA Pages](public/images/aliyun-esa.png)

## 开始使用

1. 安装依赖:

```bash
pnpm install
```

2. 启动开发服务器:

```bash
pnpm dev
```

3. 访问 [http://localhost:3000](http://localhost:3000)

## 构建

```bash
pnpm build
```

## 部署

本项目可以直接部署在阿里云 ESA Pages 上。
