# Monee

本地优先的个人记账 PWA。账单先保存在浏览器 IndexedDB 里，离线也能记；连接 GitHub 后，账本会按年同步到你自己拥有的私有仓库。

## 特性

- 本地优先：无需注册，打开就能记，离线可用
- GitHub 存储：数据放在自己的仓库，历史提交就是版本记录
- 多账本：一个仓库下按 `books/<id>/` 隔离
- 分类、统计、预算：按月/按年查看收支结构
- PWA：可安装到桌面/手机，Service Worker 预缓存应用外壳
- 无后端：不经过任何 Monee 服务器

## 技术栈

- Next.js 16 App Router（静态导出）
- React 19 + HeroUI v3 + Tailwind CSS v4
- Zustand + Dexie（IndexedDB）
- Recharts
- Serwist（Service Worker）
- GitHub REST API（Fine-grained PAT）

## 开发

```bash
bun install
bun run dev
```

打开 http://localhost:3000。

## 构建与预览

```bash
bun run build   # 生成 out/ 并注入 Service Worker
bun run preview # 在 http://localhost:4173 预览 out/
```

`bun run build` 会：

1. 执行 `next build`，静态导出到 `out/`
2. 用 esbuild 打包 `lib/pwa/sw.ts`
3. 用 `@serwist/build` 注入预缓存清单，生成 `out/sw.js`

## 测试

```bash
bun run typecheck
bun run lint
bun run test
```

重点覆盖金额换算、LWW 合并、分类统计等纯逻辑。

## GitHub 数据布局

```text
monee-data/                 # 你的私有仓库
  books/
    default/
      meta.json             # 分类、标签、账户、预算、设置
      bills/
        2026.json           # 该年全部账单（含墓碑记录）
```

同步使用 GitHub Git Data API：一次提交可以原子地更新多个文件；只上传发生变化的年份文件。合并策略为每条记录按 `updatedAt` 做 last-write-wins，删除使用墓碑（`deletedAt`），所以不同账单的并发编辑不会互相覆盖。

## 连接 GitHub

1. 创建一个私有仓库，例如 `monee-data`
2. 创建 Fine-grained Token，只授权该仓库，权限选择 **Contents: Read and write**
3. 在 Monee 的「设置 → GitHub 同步」或首次引导页填入 Token / 所有者 / 仓库名
4. 点击「测试连接」，保存后点击「立即同步」

Token 只保存在本机 IndexedDB，不会写入仓库或发送到其他服务器。

## 部署

### Cloudflare Pages（推荐）

- 构建命令：`bun run build`
- 输出目录：`out`
- 无需环境变量；`public/_headers` 会提供缓存与安全头

### GitHub Pages

线上地址：<https://odd256.github.io/monee/>

首次部署需要在仓库的 **Settings → Pages → Build and deployment** 中把 **Source** 设为 **GitHub Actions**。之后每次推送到 `main`，或手动运行 `Deploy to GitHub Pages` workflow，都会自动构建并发布。

workflow 会：

1. 通过 `actions/configure-pages` 取得 Pages 的 base path（项目站点为 `/monee`，自定义域名为空）
2. 执行 `bun run build`，并把 base path 传给 `NEXT_PUBLIC_BASE_PATH`
3. 上传 `out/` 并部署到 Pages

本地验证项目站点构建：

```bash
NEXT_PUBLIC_BASE_PATH=/monee bun run build
```

PowerShell：

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/monee"; bun run build
```

构建后 `out/index.html` 中的资源路径应以 `/monee/_next/` 开头。`public/.nojekyll` 会保留在产物中，避免 GitHub Pages 忽略 `_next` 目录。

## 目录

```text
app/                 路由与页面
components/          UI 组件
hooks/               数据加载 hooks
lib/domain/          纯业务逻辑（类型、金额、日期、统计、预算）
lib/db/              Dexie 数据层
lib/github/          GitHub HTTP 封装
lib/sync/            拉取、合并、推送、调度
lib/store/           Zustand 状态
lib/pwa/             Service Worker 与注册
scripts/             PWA 构建、图标、预览脚本
tests/               Vitest 环境
```

## 隐私

Monee 没有后端服务器，不收集、不上传、不分析账本数据。唯一的网络请求是你配置的 GitHub API。
