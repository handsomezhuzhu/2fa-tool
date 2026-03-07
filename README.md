# 2FA Authenticator / 两步验证器

一个纯前端的 TOTP 两步验证工具，支持多种添加令牌方式，数据完全存储在本地浏览器中。

A pure frontend TOTP two-factor authentication tool with multiple token import methods. All data is stored locally in your browser.

## Features / 功能特性

- **多种添加方式** - 手动输入密钥、扫描二维码、上传二维码图片
- **高级设置** - 支持 SHA-1/256/512 算法、6/8位验证码、30/60秒刷新周期
- **完整编辑** - 可编辑令牌的所有信息（名称、发行者、密钥、算法等）
- **一键复制** - 点击验证码即可复制，带视觉反馈
- **数据管理** - 支持导入/导出备份（JSON格式）
- **去重检测** - 自动检测重复令牌
- **主题切换** - 支持亮色/暗色/跟随系统三种主题
- **多语言** - 支持中文/英文切换
- **纯前端** - 无需后端，数据存储在浏览器 localStorage
- **静态部署** - 支持导出为静态文件部署到任意平台

## Tech Stack / 技术栈

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- jsQR (二维码识别)

## Environment Variables / 环境变量

所有环境变量均为可选配置：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NEXT_PUBLIC_SHOW_FOOTER` | 是否显示页脚（默认隐藏） | `true` |
| `NEXT_PUBLIC_FOOTER_COPYRIGHT` | 版权所有者名称 | `Your Name` |
| `NEXT_PUBLIC_ICP_NUMBER` | ICP备案号（完整文本） | `京ICP备xxxxxxxx号` |
| `NEXT_PUBLIC_PSB_NUMBER` | 公安备案号（完整文本） | `京公网安备xxxxxxxxxxxxxx号` |

## Deployment / 部署

### Vercel

直接导入 GitHub 仓库即可，无需额外配置。

### 静态部署（阿里云 ESA / Cloudflare Pages 等）

项目已配置为静态导出模式，构建后会生成 `out` 目录。

**构建配置：**

\`\`\`
安装命令：npm install
构建命令：npm run build
静态资源目录：out
Node.js 版本：20.x 或 22.x
\`\`\`

### 本地开发

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
\`\`\`

## Security / 安全说明

- 所有令牌数据仅存储在浏览器本地 localStorage 中
- 不会向任何服务器发送数据
- 建议定期导出备份以防数据丢失
- 导出的 JSON 文件包含敏感密钥信息，请妥善保管

## License / 许可证

MIT
