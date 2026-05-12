# wedding-video-skill

基于 [Remotion](https://remotion.dev) 的婚礼回忆视频自动剪辑工具，封装为 Claude Code Skill，支持 8 种画面布局、12 种动画和多种装饰特效。

> **Skill 文件**：[`skill.md`](skill.md) — Claude Code 读取此文件后自动接管从扫描照片到渲染视频的完整流程。

## 使用方法

### 1. 安装

```bash
git clone https://github.com/SUSTechWLA/wedding-video-skill.git
cd wedding-video-skill
npm install
```

### 2. 准备照片

在 `public/images/` 下按章节创建子目录，将照片放入对应目录：

```
public/
├── images/
│   ├── 婚纱照/           # 每个子目录 = 一个章节
│   │   ├── 001.jpg       # 支持 jpg/png/heic
│   │   ├── 002.jpg
│   │   └── ...
│   ├── 桂林/
│   │   ├── DSC02793.jpg
│   │   └── ...
│   ├── 新疆/
│   │   └── ...
│   └── 领证/            # 可标记为 emphasis 章节
│       └── ...
└── music/
    └── perfect.mp3       # 背景音乐
```

- **目录命名**：使用中文名（如"婚纱照"），Skill 会自动推断章节标题
- **至少 2 个子目录**，Skill 才会通过自动检测触发
- **照片数量不限**，Skill 会根据照片数量自动分配时长

### 3. 准备音乐

在 `public/music/` 下放入 1-2 首背景音乐（mp3/m4a/wav）：

```
public/music/
└── Ed Sheeran - Perfect.mp3
```

### 4. 触发 Skill

将项目目录在 Claude Code 中打开，通过以下方式触发：

| 方式 | 说明 |
|------|------|
| **自然语言** | 在项目目录下说"帮我生成婚礼视频"、"把这些照片做成视频" |
| **自动检测** | Skill 检测到 `public/images/` 下 ≥2 个照片目录 + `public/music/` 存在即自动激活 |

### 5. 执行流程

触发后 Skill 按 6 个阶段自动执行：

```
Phase 1: 扫描      →  自动发现照片目录和音乐文件
Phase 2: 问答      →  逐一确认章节、标题、风格、时长、音乐
Phase 3: 设计      →  编排画面布局和动画方案
Phase 4: 计划      →  生成精确到文件的实施计划
Phase 5: 执行      →  子代理逐一实现每个组件
Phase 6: 渲染      →  类型检查 + Remotion 渲染出片
```

## 项目结构

```
wedding-video-skill/
├── skill.md                  # Claude Code Skill 定义
├── public/
│   ├── images/               # 照片（按章节分目录）
│   └── music/                # 背景音乐
├── src/
│   ├── components/
│   │   ├── layouts/          # 8 种布局组件
│   │   ├── decorations/      # 装饰特效（花瓣、星光等）
│   │   └── shared/           # 共享组件（模糊背景）
│   ├── VideoComponent.tsx    # 主合成组件
│   └── Root.tsx              # Remotion 入口
└── docs/                     # 设计文档和计划
```

## 本地开发

```bash
npm run dev                     # 启动 Remotion Studio 预览
npx tsc --noEmit                # 类型检查
npx remotion render src/index.ts WeddingVideo out/wedding.mp4  # 渲染
```

## 技术栈

- **视频引擎**：[Remotion](https://remotion.dev) (React + TypeScript)
- **样式**：Tailwind CSS v4
- **Skill 流程**：[Superpowers](https://github.com/anthropics/superpowers) 技能链
