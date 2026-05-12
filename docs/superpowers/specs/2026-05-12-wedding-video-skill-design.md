# Wedding Video Skill — 设计文档

## 目标

将现有的 `skill.md` 改造为一个正式的 Claude Code Skill，支持：
- 自动检测文件夹结构（多图片目录 + music 目录）
- 关键词触发 + 自动检测双重激活
- 交互式引导问答，自动生成配置
- 完整 Superpowers 技能链（brainstorm → plan → execute → render）

## 改动范围

**仅重写 1 个文件：`skill.md`**，其余代码完全复用。

## 文件结构

```
wedding/
├── skill.md                    # ✏️ 重写
├── resource/
│   ├── image/                  # 不变 — 照片分类目录
│   └── music/                  # 不变 — 背景音乐
├── src/
│   ├── photoManifest.json      # 🔧 Skill 自动生成
│   └── ...                     # 不变
└── ...
```

## Skill 结构

```
元数据头部 (name, description, triggers, allowed-tools, model)
  ↓
角色定位 — 婚礼视频导演
  ↓
触发条件 — 关键词列表 + 自动检测逻辑
  ↓
Phase 1: 扫描文件夹 → 汇总展示
  ↓
Phase 2: 交互式问答（7 个问题）→ 生成 photoManifest.json
  ↓
Phase 3: 设计 → superpowers:brainstorming
  ↓
Phase 4: 计划 → superpowers:writing-plans
  ↓
Phase 5: 执行 → superpowers:subagent-driven-development
  ↓
Phase 6: 渲染 → tsc --noEmit → remotion render
  ↓
创作规则 — 7 种布局、动画、装饰、配色（保持不变）
  ↓
代码结构参考 — 文件树（保持不变）
```

## 元数据

- **name**: `wedding-video`
- **description**: 自动检测照片和音乐，交互式编排章节，使用 Remotion 一键生成婚礼回忆视频
- **trigger keywords**: 生成视频, 制作婚礼视频, 剪辑照片, 做视频, 生成婚礼视频, 照片做视频
- **autoDetect**: 扫描目录下 >=2 个含图片文件夹 + 一个 music 文件夹
- **model**: opus

## Phase 1: 自动扫描

1. `ls ./resource/image/` → 列出所有子目录，统计每个目录的图片数量
2. `ls ./resource/music/` → 列出所有音乐文件
3. 汇总输出给用户确认

## Phase 2: 交互式问答（7 个问题，逐一询问）

| 顺序 | 问题 | 选项来源 |
|------|------|----------|
| 1 | 保留哪些目录？ | 扫描结果，默认全选 |
| 2 | 每个章节的标题？ | 目录名自动推断，可修改 |
| 3 | 哪些章节需要强调？ | 选中的目录 |
| 4 | 选哪个配色风格？ | warm-cinematic / vintage / clean-modern |
| 5 | 视频总时长？（秒） | 自动按照片数计算建议值 |
| 6 | 片尾：名字？日期？感谢语？ | 自由输入 |
| 7 | 选哪首背景音乐？ | 扫描到的文件列表 |

回答完成后自动生成 `photoManifest.json` 和用户配置。

## Phase 3-5: Superpowers 技能链（保持不变）

- Phase 3: 调用 `superpowers:brainstorming` 设计画面分配、动画方案
- Phase 4: 调用 `superpowers:writing-plans` 生成实施计划
- Phase 5: 调用 `superpowers:subagent-driven-development` 执行每个任务

## Phase 6: 渲染

1. `npx tsc --noEmit` 类型检查
2. `npx remotion render WeddingVideo out/wedding.mp4` 渲染
3. 调用 `superpowers:finishing-a-development-branch` 收尾

## 不修改的部分

- 7 种布局组件（FullScreenPhoto, SplitTwo, ThreeLayout, GridFour, AsymmetricCollage, PhotoWall, BlendTwo）
- 4 种装饰特效（FilmGrain, LightSweep, Petals, Sparkles）
- 共享组件（BlurredBg, ChapterTitle, OpeningTitle, EndingCredits, AudioFader）
- 工具函数（layoutHelper.ts, utils.ts, themes.ts, types.ts）
- Remotion 配置（Root.tsx, VideoComponent.tsx, remotion.config.ts）
