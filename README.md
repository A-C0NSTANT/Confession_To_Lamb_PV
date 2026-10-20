# 《向修女忏悔吧》PV 重建

这是一个由用户与 agent 协作完成的 PV 重建工程：参考原片的构图、时序和动画，用独立素材、图层和动画代码重新生成画面。当前场景已经完成角色替换，可以作为制作自己版本的起点。

Fork 后，保留想沿用的背景、文字和运动，替换每个场景的图片，再让 agent 调整比例、支点、表情和动画代码即可。场景中的素材与动画数据就是工程内容，修改后直接渲染。

## 基础思想

原片用于观察和测量：哪些元素出现、放在哪里、怎样运动、何时切换。可以从中提取适合复用的静态内容，再从空场景组合，而不是逐帧覆盖原人物后继续修补残留。

工程将四件事分开：

- **素材**：角色、背景、文字、表情和装饰的外观。
- **图层与构图**：比例、位置、裁切、遮挡和父子关系。
- **动画**：整体运动、局部摆动、网格变形及差分切换。
- **特效**：闪白、RGB 分离、撕裂、颗粒等处理。

先把静态构图摆对，再做整体运动，最后补局部动画和特效。运动由指定帧号求值，便于单独抽查一帧、局部修改和重复渲染。平滑用来消除测量噪声，同时保留原片有意的停格、硬切与故障效果。

## 技术栈

- **JavaScript、PixiJS 8、Canvas 2D、着色器**：场景、图层、人物和特效。
- **Node.js、Playwright、Chromium／Edge**：按帧驱动浏览器渲染。
- **FFmpeg**：视频编码、音轨合入和后期合成。
- **Python、OpenCV、NumPy、Pillow、SciPy**：制作时按需分析原片、处理素材和估计曲线；渲染现有场景不需要 Python。
- **ImageGen 或绘图工具**：按需补充角色、表情和缺失素材。

## 运行

准备 Node.js 20 或更新版本与 FFmpeg，在仓库根目录执行：

```sh
npm ci
npx playwright install chromium
ffmpeg -version

npm run scenes
npm run render -- 02-title
```

Windows 可以双击 `render.cmd`，输入场景编号，例如 `2`。也可以直接进入某段目录运行 `node render.mjs`。

抽查关键帧：

```sh
npm run render -- 02-title --frames=0,60,140 --out=outputs/title-preview
```

默认视频写入 `outputs/<场景目录名>/`。`--frames` 指定本段的 0 基帧号；抽帧时 `--out` 是目录，渲染视频时是文件。各段的 `--stage`、`--expressions` 等开关以该段入口实际支持的参数为准。

FFmpeg 需要能从 PATH 找到，也可用 `FFMPEG_PATH` 或 `--ffmpeg` 指定；浏览器可用 `BROWSER_PATH` 或 `--browser` 指定。Windows 支持的环境可加 `--gpu=d3d11` 使用硬件渲染，兼容性排查可用 `--gpu=swiftshader`。

## 文件结构

```text
README.md                         本文
render.mjs / render.cmd           选择并运行某一场景
package.json / package-lock.json  Node 依赖与运行命令
scripts/
  runtime.mjs                     浏览器、FFmpeg、临时目录和输出路径
  render.ps1                      Windows 交互启动
scenes/
  01-intro/
  02-title/
  ...
  12-finale/
    assets/                       贴图、音轨、轨道和绑定数据
    src/                          构图、人物动画与特效代码
    vendor/                       固定版本的 PixiJS
    render.mjs                    本段渲染与编码
    package.json                  本段的直接运行入口
postproduction/
  chinese-subtitles/              对完整底片叠加中文字幕
licenses/                         第三方库许可文本
outputs/                          运行后生成的图片与视频，不上传
archive/                          本地原片、候选素材、旧产物和分析历史，不上传
```

每个场景自带实际使用的素材和动画数据。`assets/scene.json` 等 JSON 保存布局、运动和时序；`rig.json`、`character-rig.json` 等保存人物分层与绑定。它们是渲染输入，字段以对应源码的读取方式为准。

`src/scene.js` 一般是阅读场景的入口：它装配背景、人物、文字和前景，并按帧更新。`character*.mjs`、`expression.mjs` 等处理人物；`effects.mjs`、`glitch.mjs` 等处理特效。`render.mjs` 负责浏览器与编码，角色动作通常在 `src/` 或相关动画数据里修改。

| 场景 | 内容 |
| --- | --- |
| `01-intro` | 开场背景、像素元素与对白 |
| `02-title` | 标题、角色入场、局部动画与制作信息 |
| `03-verse` | 读书立绘、小人入场与表情 |
| `04-prayer` | 祈祷对白与人物状态 |
| `05-sins-spin` | 多画面、对白与旋转 |
| `06-confession` | 教堂界面、头身运动与表情 |
| `07-pixel-followers` | 像素行人、步态和场景切换 |
| `08-character-interlude` | 角色插图、歌词与效果 |
| `09-chant` | 咏唱、歌词、多画面和旋转 |
| `10-confession-finale` | 终幕对白与表情 |
| `11-battle` | 破屏、人物分层与战斗界面 |
| `12-finale` | 结尾立绘、剪影、频谱与收尾 |

## 换成自己的角色

可以先从 `02-title` 入手，它集中展示了整体运动、手臂摆动和眨眼。

1. 让 agent 阅读 `src/scene.js` 和相关人物模块，确认实际加载的图片与动画数据。
2. 替换 `assets/reach.png` 等角色图。保留原文件名可以减少改代码；画布尺寸和角色比例变化较大时，同步调整缩放、位置和锚点。
3. 查看 `assets/character-rig.json` 与 `assets/character-animation.json`，按新角色调整支点、影响区域和曲线。
4. 先抽查入场、稳定和切换附近的画面，再渲染完整片段。

替换其他场景时沿用同一思路。整图运动可以直接复用；头、手、衣物等局部动作需要与新素材的结构匹配。已有表情差分能沿用时直接调整，形状不合适时重新绘制。静态使用的整张立绘无需为了统一形式而预先拆层。

素材放在对应场景中，文件名和用途可以直接从源码追踪。新增、替换或删去素材时，直接修改加载代码和实际使用的数据。

## 与 agent 协作

用户负责选图、角色神态、动作意图和最终观感；agent 负责测量、素材处理、图层组织、曲线与绑定实现，以及渲染。反馈尽量具体到本段帧号、部位和预期动作。

可以这样开始：

> 先阅读 README 和 scenes/02-title 的代码。把角色换成我提供的透明 PNG，保留原有背景、文字和时间节奏。先完成静态构图和整图入场，再按新图调整手臂与眨眼。直接修改该段素材和动画代码，输出几张关键帧及一段预览。

一般按以下顺序推进：

1. **看原片和已有代码**：确认该段的布局、切换点与可复用内容。
2. **准备素材、摆静态构图**：先确定占比、裁切、文字和图层关系。
3. **还原整体运动**：处理人物、背景和文字的位置、旋转、横纵缩放与显隐。
4. **补局部动画和表情**：使用父子图层、支点、局部网格、遮罩或差分。
5. **补效果与衔接**：对照闪白、故障、停格和镜头切换，输出完整片段。

看预览时重点检查：人物比例与神态、文字是否稳定、连续动作是否突变、绑定是否带动了无关区域、差分有无旧像素或露底。对替换角色按新的设计判断外观，对保留部分和运动时序对照原片。

## 完整成片与字幕

各段可以单独渲染。完成后让 agent 按原片时序拼接，检查相邻片段的共有帧、间隔、音轨和过渡。

`postproduction/chinese-subtitles` 可对完整底片叠加现有字幕：

```sh
npm run render -- chinese-subtitles --input=outputs/my-pv.mp4
```

修改字幕内容时，查看它的 `assets/events.json` 和文字贴图。该后期原有时序对应本工程成片；如果重新剪辑，应一并调整曝光区间。

## 许可证

本项目原创代码采用 [MIT 许可证](LICENSE)。PixiJS 的许可文本保留在 `licenses/`；原 PV 音轨及第三方图像素材沿用各自的授权范围。
