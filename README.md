# 婚礼回忆视频自动剪辑

基于 [Remotion](https://remotion.dev) 的婚礼视频自动生成工具，支持 8 种画面布局、12 种动画和多种装饰特效，一键将照片渲染为高质量视频。

同时提供 Claude Code Skill（`skill.md`），让 Claude 接管从扫描照片到渲染视频的完整流程。

## 项目结构

```
wedding/
├── skill.md                  # Claude Code Skill 定义
├── resource/
│   ├── image/                # 照片目录（按章节分子目录）
│   └── music/                # 背景音乐
├── src/
│   ├── components/
│   │   ├── layouts/          # 8 种布局组件
│   │   ├── decorations/      # 装饰特效（花瓣、星光等）
│   │   └── shared/           # 共享组件（模糊背景）
│   ├── VideoComponent.tsx    # 主合成组件
│   └── Root.tsx              # Remotion 入口
└── public/                   # 静态资源
```

## Skill 功能

安装为 Claude Code Skill 后，Claude 可以自动完成：

1. **自动检测** — 扫描 `public/image/` 和 `public/music/` 目录，发现照片和音乐
2. **交互式问答** — 逐一确认章节、标题、风格、时长、音乐
3. **自动设计** — 编排画面布局和动画方案
4. **一键渲染** — 类型检查 + Remotion 渲染出片

### 使用方式

**自然语言触发：** 说"帮我生成婚礼视频"、"把这些照片做成视频"等。

**Skill 命令：** `/wedding-video`

## 本地开发

```bash
npm i
npm run dev        # 启动 Remotion Studio 预览
npx remotion render src/index.ts WeddingVideo out/wedding.mp4  # 渲染视频
```
