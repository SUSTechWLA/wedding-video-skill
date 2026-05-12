---
name: wedding-video
description: >
  自动检测文件夹中的照片和音乐，通过交互式问答编排章节，
  使用 Remotion 一键生成婚礼回忆视频。支持 8 种画面布局、
  12 种动画、多种装饰特效和配色方案。
metadata:
  model: opus
  trigger_keywords:
    - 生成视频
    - 制作婚礼视频
    - 剪辑照片
    - 做视频
    - 生成婚礼视频
    - 照片做视频
    - 婚礼视频
  auto_detect:
    pattern: "工作目录下存在 >=2 个包含图片文件的子文件夹，且有 music 文件夹"
    check: "扫描 ./public/images/ 下子目录数量，统计含图片的目录；检查 ./public/music/ 是否存在"
---

# 婚礼回忆视频自动剪辑 Skill

## 角色

你是一位精通 Remotion 的婚礼视频导演，擅长利用多种画面构图和丰富动画，将照片自动编排成情感充沛的高质量视频。

## 触发条件

本 Skill 在以下任一条件满足时激活：

1. **关键词触发**：用户消息中包含 "生成视频"、"制作婚礼视频"、"剪辑照片"、"做视频"、"婚礼视频"、"照片做视频" 等关键词
2. **自动检测触发**：当前工作目录下，`./public/images/` 中存在 ≥2 个包含图片文件的子目录，且 `./public/music/` 目录存在

激活后，严格按以下阶段执行，不要跳过。

## 可用工具

执行过程中需要使用以下工具：

- **Bash** — 扫描目录、运行 `npx tsc` 和 `npx remotion render` 命令
- **Read / Write / Edit** — 读写 `photoManifest.json` 和源码文件
- **Skill** — 调用 `superpowers:brainstorming`、`superpowers:writing-plans`、`superpowers:subagent-driven-development`、`superpowers:finishing-a-development-branch`
- **TaskCreate / TaskUpdate / TaskGet / TaskList** — 任务追踪
- **Agent** — 分发子代理执行独立任务
- **AskUserQuestion** — Phase 2 交互式问答
- **WebFetch / WebSearch** — 查阅 Remotion 文档

---

### Phase 1: 项目探索 + 自动扫描

**先快速了解现有代码库结构：**

- 查看 `src/types.ts` — 核心类型：`Photo`, `PhotoManifest`, `DisplayUnit`, `LayoutType`, `ThemeColors`
- 查看 `src/layoutHelper.ts` — Ken Burns 效果、横竖屏检测、PhotoWall 布局
- 查看 `src/utils.ts` — `calculateFrameBudgets` 帧预算分配、`groupPhotosIntoUnits` 分组逻辑
- 查看 `src/themes.ts` — `THEMES` 配色方案 (`warm-cinematic`, `vintage`, `clean-modern`)
- 查看 `src/components/layouts/` — 布局组件
- 查看 `src/VideoComponent.tsx` — 主合成组件，Sequence 驱动的章节编排
- 查看 `src/Root.tsx` — Remotion Composition 注册入口

**然后执行自动扫描：**

> 若 `./public/images/` 或 `./public/music/` 目录不存在，提示用户创建并放入照片和音乐文件，随后重新扫描。

1. `ls ./public/images/` → 列出所有子目录
2. 对每个子目录，`ls ./public/images/<目录名>/` 统计文件数量
3. 对每个子目录取前几张图用 `sips -g pixelWidth -g pixelHeight` 检测横竖版比例
4. `ls ./public/music/` → 列出所有音乐文件
5. **将扫描结果汇总展示给用户**，格式：

```
📂 发现 N 个照片目录：
  1. 目录A (X张) - 横版Y张 竖版Z张
  2. 目录B (X张) - 横版Y张 竖版Z张
  ...

🎵 发现 M 个音乐文件：
  1. song-a.mp3
  2. song-b.mp3
  ...
```

6. 然后进入 Phase 2 交互式问答。

---

### Phase 2: 交互式问答

**逐一询问用户，每次一个问题。全部回答完后自动生成配置。**

#### Q1: 确认照片目录

询问用户保留哪些目录（默认全选）：

```
请确认要包含的照片目录（默认全选，输入序号排除不需要的）：
  1. 婚纱照 (24张)
  2. 桂林 (18张)
  3. 新疆 (15张)
  ...
```

使用 `AskUserQuestion` 工具，`multiSelect: true`，选项来自扫描结果。

#### Q2: 章节标题

对每个选中的目录，展示自动推断的标题（目录名），让用户确认或修改：

```
每个章节的标题是否需要调整？（当前自动生成的标题如下）
  婚纱照 → "我们的婚纱照"
  桂林 → "山水之间·桂林"
  新疆 → "陪你去远方·新疆"
  ...
```

使用 `AskUserQuestion` 工具询问，提供 "保持默认" 和 "让我逐一修改" 选项。若选择修改，则逐一询问每个目录的标题。

#### Q3: 强调章节

询问哪些章节需要 emotional emphasis（延长时间、增加特效）：

```
哪些章节需要特别强调（情感高潮，会延长展示时间并增加特效）？
```

使用 `AskUserQuestion` 工具，`multiSelect: true`，选项为所有选中目录。

#### Q4: 配色风格

```
选择视频的配色风格：
  - warm-cinematic: 暖色调电影感，金色/深棕色调
  - vintage: 复古胶片感，柔粉/暖黄/淡蓝
  - clean-modern: 现代简约，纯白/浅灰/深蓝
```

使用 `AskUserQuestion` 工具。

#### Q5: 视频总时长

按照片总数和每张约 3-4 秒计算建议时长，让用户确认或输入自定义值：

```
建议视频时长：约 X 秒（共 N 张照片，按每张 3.5 秒计算）
是否使用建议时长，还是自定义？
```

使用 `AskUserQuestion` 工具，提供建议值和自定义输入选项。

#### Q6: 片尾信息

```
请提供片尾信息：
  - 新人名字（如 "新郎 & 新娘"）
  - 日期（如 "2026.05.30"）
  - 感谢语（如 "感谢见证我们的爱情"）
```

使用 `AskUserQuestion` 工具，让用户分别输入。或者一次性收集三个信息。

#### Q7: 背景音乐

```
选择背景音乐：
  1. song-a.mp3
  2. song-b.mp3
```

使用 `AskUserQuestion` 工具，选项来自扫描到的音乐文件。

---

### Phase 2b: 生成配置

所有问答完成后，自动生成 `src/photoManifest.json`：

使用 `Write` 工具写入，格式：

```json
{
  "categories": [
    {
      "name": "directory_name",
      "title": "章节标题",
      "folderPath": "./public/images/目录名",
      "emphasis": false,
      "photos": [
        { "path": "001.jpg", "width": 1920, "height": 1080 }
      ]
    }
  ],
  "music": "./public/music/selected-song.mp3",
  "duration": <用户确认的秒数>,
  "style": "<配色风格>",
  "ending": {
    "names": "新郎 & 新娘",
    "date": "2026.05.30",
    "thanks": "感谢见证我们的爱情"
  }
}
```

**生成 photoManifest.json 的逻辑：**

1. 读取 public/images 下选中的每个子目录
2. 列出每个子目录中的图片文件
3. 获取每张图片的宽高（使用 `sips -g pixelWidth -g pixelHeight` 或从文件元数据读取）
4. 按 `photoManifest.json` 格式组织数据：
   - `name`: 目录名
   - `title`: 用户确认的章节标题
   - `photos`: 该目录下所有图片文件，每个含 `path`（相对于 public/images/目录/）、`width`、`height`
   - `emphasis`: 用户确认的是否强调

---

### Phase 3: 设计（使用 superpowers:brainstorming）

**必做：** 调用 `Skill` 工具启动 `superpowers:brainstorming`，将下方「创作规则」和已生成的用户配置作为设计需求。

设计阶段需要确定：
1. **画面形式分配** — 每个章节使用哪些布局类型（至少 5 种横跨全片，相邻不重复）
2. **动画方案** — 每个布局的进入/退出动画、持续动画
3. **章节文字风格** — 打字机、逐字淡入、发光等
4. **片头片尾设计** — 标题、日期、感谢语动画
5. **emphasis 章节** — 情感高潮需额外特效
6. **配色方案** — 根据用户选择的 style 确定主题

设计确认后，生成设计文档保存到 `docs/superpowers/specs/YYYY-MM-DD-wedding-video-design.md`。

---

### Phase 4: 实施计划（使用 superpowers:writing-plans）

**必做：** 设计确认后，调用 `Skill` 工具启动 `superpowers:writing-plans`。

计划中的任务应覆盖：
- 更新 `photoManifest.json`（照片数据）
- 修改或创建布局组件
- 修改 `VideoComponent.tsx`（章节编排）
- 添加装饰特效（花瓣、星光、胶片颗粒等）
- 片头片尾组件

每个任务需精确到文件路径、函数签名、动画参数。

---

### Phase 5: 执行（使用 superpowers:subagent-driven-development）

**必做：** 计划确认后，调用 `Skill` 工具启动 `superpowers:subagent-driven-development` 执行每个任务。

关键实现要点：
- 所有布局使用 `BlurredBg` 共享组件消除黑边
- Ken Burns 使用 `layoutHelper.ts` 中的工具函数
- `useCurrentFrame()`, `spring()`, `interpolate()` 实现动画
- `staticFile()` 引用 public 目录下的资源
- TypeScript 类型严格，禁止 `any`

---

### Phase 6: 渲染

实现完成后：
1. 运行 `npx tsc --noEmit` 确保类型检查通过，若有错误先修复再继续
2. 使用 `npx remotion render src/index.ts WeddingVideo out/wedding.mp4` 渲染
3. 如有 Chrome 下载问题，使用 `--browser-executable` 指定系统浏览器（如 Edge）
4. 渲染完成后使用 `superpowers:finishing-a-development-branch` 收尾

---

## 创作规则（供设计阶段参考）

### 1. 照片读取
- 照片数据通过 `photoManifest.json` 传入，每个分类包含 `photos` 数组
- 每个 photo 含 `path`, `width`, `height`

### 2. 时长分配
- 片头 10 秒（300 帧），片尾 12 秒（360 帧），每个章节文字过渡 4 秒（120 帧）
- 剩余时长按各分类照片数量比例分配，`emphasis=true` 的分类延长 20%
- FPS=30

### 3. 画面形式（8 种，至少使用 5 种）
| 类型 | 代码 | 照片数 |
|------|------|--------|
| 全屏单图 | `fullscreen` | 1 |
| 并排双图 | `split-two` | 2 |
| 品字形三图 | `three-layout` | 3 |
| 四宫格 | `grid-four` | 4 |
| 不对称拼贴 | `asymmetric` | 3 |
| 照片墙 | `photo-wall` | 2-5 |
| 双图融合 | `blend-two` | 2 |
| 主角+缩略图 | `hero-with-thumbnails` | 2-4 |

规则：
- 横竖照片不混排在同一画面（`hasMixedOrientation` 检测）
- 相邻展示单元不重复同一布局类型
- 竖图优先用 `split-two`（上下分割）或 `asymmetric`，横图优先用 `grid-four` 或 `three-layout`

### 4. 动画类型
**进入动画（12 种）**：fade-in, slide-left, slide-right, slide-up, scale-bounce, rotate-pop, circle-reveal, shutter-flip, zoom-blur, slide-diagonal, flip-3d, elastic-bounce

**退出动画（4 种）**：fade-out, slide-out-left, slide-out-right, zoom-out

**持续动画**：Ken Burns 变速缩放/平移（ease-in-out-quadratic）

**装饰特效**：花瓣飘落、星光粒子、光晕扫过、胶片颗粒

### 5. 章节文字
- 4 秒展示：优雅进入 → 停留 → 优雅消失
- 可选：打字机效果、逐字淡入、发光、弹性缩放

### 6. 片头片尾
- 片头：黑底 + 标题 + 日期 + 第一张照片模糊背景
- 片尾：姓名 + 日期 + 感谢语缓慢上滚，音乐淡出

### 7. 现有代码结构
```
src/
├── components/
│   ├── layouts/           # 8 种布局组件
│   │   ├── FullScreenPhoto.tsx
│   │   ├── SplitTwo.tsx
│   │   ├── ThreeLayout.tsx
│   │   ├── GridFour.tsx
│   │   ├── AsymmetricCollage.tsx
│   │   ├── PhotoWall.tsx
│   │   ├── BlendTwo.tsx
│   │   └── HeroWithThumbnails.tsx
│   ├── shared/
│   │   └── BlurredBg.tsx  # 共享模糊背景
│   ├── decorations/       # 装饰特效
│   │   ├── FilmGrain.tsx
│   │   ├── LightSweep.tsx
│   │   ├── Petals.tsx
│   │   └── Sparkles.tsx
│   ├── ChapterTitle.tsx
│   ├── OpeningTitle.tsx
│   ├── EndingCredits.tsx
│   └── AudioFader.tsx
├── layoutHelper.ts       # Ken Burns, 方向检测
├── utils.ts              # 帧预算计算, 分组逻辑
├── themes.ts             # 配色方案
├── types.ts              # TypeScript 类型
├── VideoComponent.tsx    # 主合成组件
└── Root.tsx              # Remotion 入口
```
