# 农场 UI 布局详细说明（Cocos Creator 3.8）

> 本文档给出 farm 场景 UI 的**全部节点、位置、尺寸、图片、九宫格边距、文字、颜色**的精确数值，
> 与 `farm/design/backpack_reference.html`（网页设计稿）1:1 对应，可直接照着在 Cocos 编辑器里手动搭建，
> 或修改代码里的对应常量。

---

## 一、场景与全局设置

| 项目 | 值 |
|---|---|
| 场景名 | `farm`（跳转自 login 场景，`LoginMain.FARM_SCENE`） |
| 设计分辨率 | **1280 × 720**（横屏基准） |
| 适配策略 | **FIXED_HEIGHT（固定高度）**：逻辑高度恒为 720，宽度随屏幕比例变化 |
| 挂载方式 | 把 `GameRoot` 组件挂到 **Canvas** 节点上，UI 全部自动构建 |
| 渲染顺序 | 按节点在 Canvas 下的**添加顺序**（后添加的在上层）：背景 → 太阳 → 地面条纹 → 金币HUD → 商店按钮 → 背包按钮 → 退出登录 → 面板(背包→商店) → **Toast(最上层)** |

> 坐标约定：本文档中「相对位置」为子节点相对父节点**中心**的偏移（Cocos 坐标，y 向上为正）；
> 「屏幕坐标」为 1280×720 下**左上角为原点、y 向下**（与网页 CSS 一致），方便对照 HTML。

---

## 二、节点树总览（含位置/尺寸）

```
Canvas  (1280×720)
├─ stage_bg        Sprite stage_bg.png          全屏拉伸 (Widget 四边=0)
├─ sun             Sprite sun.png              90×90   (屏幕: 左上 80,46)
├─ ground_strip    Sprite ground_strip.png     1280×180 (屏幕: 贴底 y=540..720)
├─ gold_hud        Sprite gold_hud.png (slice46) 170×42 (屏幕: 左上 18,18)
│  └─ lb_💰         Label "💰 500" 18px粗 #ffe9b0  150×40 @(0,0) 居中
├─ shop_btn        Button+图 shop_btn.png (slice100) 92×92 (屏幕: 左下 36,36)
│  └─ lb_商店       Label "商店" 16px粗 #fff     92×20 @(0,-16)
├─ open_btn        Button+图 open_btn.png (slice100) 92×92 (屏幕: 右下 36,36)
│  └─ lb_背包       Label "背包" 16px粗 #fff     92×20 @(0,-16)
├─ lb_退出登录      Label "退出登录" 14px #d7c79a  120×30 @(0,-330)（Canvas 居中下侧）
├─ backpack_panel  BackpackPanel（遮罩全屏，默认隐藏）
│  └─ panel         Sprite panel.png (slice21) 680×524 @(0,0)  （屏幕居中 300,98..980,622）
│     ├─ header     Sprite panel_header.png [22,4,22,4] 680×56 @(0,234)
│     │  ├─ lb_农 场 背 包  Label 22px粗 #ffe9b0 320×40 @(-150,0) 左对齐
│     │  └─ btn_close  Button close_btn.png (slice22) 36×36 @(300,0)
│     ├─ toolbar    Sprite toolbar.png [18,2,18,2] 680×52 @(0,180)
│     │  ├─ tab×4    Button tab_normal/active.png (slice40) 68×36 @(-288,-212,-136,-60, 0)
│     │  ├─ lb_排序   Label "排序" 12px #d7c79a 30×20 @(154,0)
│     │  ├─ btn_时间  Button sort_normal/active.png (slice32) 76×32 @(200,0)
│     │  └─ btn_名称  Button sort_normal/active.png (slice32) 76×32 @(284,0)
│     ├─ scroll      Mask(矩形) + ScrollView 680×372 @(0,-32)
│     │  ├─ content   Grid Layout(FIXED_COL=6) 644×372 @(0,0)
│     │  │  └─ cell×N  CellItem 97.33×97.33（见第五节）
│     │  └─ empty     Label "该分类下暂无物品" 14px #e9dcb8 644×200 @(0,0)（空时显示）
│     └─ footer     Sprite panel_footer.png [22,4,22,4] 680×44 @(0,-240)
│        ├─ lb_footer  Label "共 N 件物品" 13px #f3e8cf 340×30 @(-170,0) 左对齐
│        └─ lb_hint    Label "点格子看详情 · 点「卖💰」出售 · 可上下滑动" 13px #c9b484 340×30 @(165,0) 右对齐
├─ shop_panel    ShopPanel（遮罩全屏，默认隐藏）——结构与背包面板相同，差异见第四节
└─ toast         Toast 480×44 (屏幕: 顶部居中 y=90)
   └─ lb          Label 18px #ffe9b0 460×40 @(0,0) 居中
```

---

## 三、场景级元素（Canvas 直接子节点）

| 节点 | 大小 W×H | 相对 Canvas 中心 (x,y) | Widget 锚点 | 图片（九宫格 inset） | 说明 |
|---|---|---|---|---|---|
| `stage_bg` | 1280×720 | 任意 | 四边=0（铺满） | `stage_bg.png`（无） | 天空→草地渐变，铺满全屏 |
| `sun` | 90×90 | — | top=46, left=80 | `sun.png`（无） | 左上角太阳（网页 `#stage::before`），屏幕坐标 (80,46) |
| `ground_strip` | 1280×180 | — | left=0, right=0, bottom=0 | `ground_strip.png`（无） | 底部装饰条纹，屏幕 y=540..720 |
| `gold_hud` | 170×42 | — | top=18, left=18 | `gold_hud.png`（46） | 金币胶囊（网页 `.gold-hud`），屏幕 (18,18) |
| `shop_btn` | 92×92 | — | left=36, bottom=36 | `shop_btn.png`（100） | 商店圆形按钮（🛒 已入图），屏幕左下 (36,36) |
| `open_btn` | 92×92 | — | right=36, bottom=36 | `open_btn.png`（100） | 背包圆形按钮（🧺 已入图），屏幕右下 (36,36) |
| `lb_退出登录` | 120×30 | (0, -330) | 无 | — | 纯文字按钮（Button Transition=NONE），屏幕 (580..700, 45..75) |
| `toast` | 480×44 | — | top=90, hCenter | `toast.png`（48） | Toast 容器，屏幕顶部居中 (400,90)，**最上层**（网页 z-index:30） |
| `backpack_panel` | 全屏 | — | 四边=0 | `overlay_scrim.png`（无） | 背包面板根（默认隐藏），含遮罩+面板 |
| `shop_panel` | 全屏 | — | 四边=0 | `overlay_scrim.png`（无） | 商店面板根（默认隐藏），含遮罩+面板 |

### 按钮上的文字

| 节点 | 文字 | 字号 | 粗细 | 颜色 | 大小 | 相对位置 |
|---|---|---|---|---|---|---|
| gold_hud 内 | `💰 {金币}` | 18 | 粗 | `#ffe9b0` | 150×40 | (0, 0) 居中 |
| shop_btn 内 | `商店` | 16 | 粗 | `#ffffff` | 92×20 | (0, -16) |
| open_btn 内 | `背包` | 16 | 粗 | `#ffffff` | 92×20 | (0, -16) |
| 退出登录 | `退出登录` | 14 | 常规 | `#d7c79a` | 120×30 | (0, -330) |
| toast 内 | 飘字内容 | 18 | 常规 | `#ffe9b0` | 460×40 | (0, 0) 居中 |

---

## 四、面板结构（BackpackPanel / ShopPanel 共用）

面板整体 **680×524**，垂直分 4 段：header 56 + toolbar 52 + scroll 372 + footer 44 = 524。
面板屏幕位置：**居中 (300, 98) ~ (980, 622)**。打开动画：scale 0.9→1 + 透明度 0→255（0.18~0.22s）。

| 段 | 节点 | 大小 | 相对 panel (x,y) | 图片（九宫格） | 说明 |
|---|---|---|---|---|---|
| 底 | `panel` | 680×524 | (0,0) | `panel.png`（21） | 绿底(上#5a7a33→下#38521f) 金边(#d9b56a, 3px) 圆角18 + 内发光白6% |
| 1 | `header` | 680×56 | (0, **234**) | `panel_header.png`（[22,4,22,4]） | 顶部渐变条 + 底部 2px 金边；圆角贴合面板 |
| 2 | `toolbar` | 680×52 | (0, **180**) | `toolbar.png`（[18,2,18,2]） | 深色条 rgba(0,0,0,.22) + 底 1px 金边 |
| 3 | `scroll` | 680×372 | (0, **-32**) | — | `Mask`(GRAPHICS_RECT 矩形) + `ScrollView`(垂直滚动, inertia, elastic) |
| 4 | `footer` | 680×44 | (0, **-240**) | `panel_footer.png`（[22,4,22,4]） | 顶部 2px 金边 |

### header（y=234）

| 节点 | 大小 | 相对 header (x,y) | 文字/图片 |
|---|---|---|---|
| 标题 | 320×40 | (-150, 0) 左对齐 | `农 场 背 包` / `农 场 商 店`，22px 粗，`#ffe9b0`（字距约 4px 效果） |
| × 关闭按钮 | 36×36 | (300, 0) | `close_btn.png`（22），Button SCALE 0.9 |

### toolbar（y=180）—— 背包版

| 节点 | 大小 | 相对 toolbar (x,y) | 文字/图片 |
|---|---|---|---|
| Tab「全部」 | 68×36 | (-288, 0) | `tab_normal.png` / `tab_active.png`（40） |
| Tab「种子」 | 68×36 | (-212, 0) | 同上（**默认选中**：金色底 #d9b56a + 深字 #3a2a12 粗体） |
| Tab「果实」 | 68×36 | (-136, 0) | 同上 |
| Tab「化肥」 | 68×36 | (-60, 0) | 同上 |
| 「排序」Label | 30×20 | (154, 0) | 12px，`#d7c79a` |
| 「时间」按钮 | 76×32 | (200, 0) | `sort_normal.png` / `sort_active.png`（32），文字 13px，**默认选中** `时间 ↓` |
| 「名称」按钮 | 76×32 | (284, 0) | 同上，未选中 `名称` |

> Tab 文字 14px：选中 `#3a2a12` 粗体，未选中 `#f3e8cf`。
> 排序按钮文字 13px：选中 `#ffe9b0` 粗体 + ` ↓`/` ↑`，未选中 `#f3e8cf`。

### toolbar（y=180）—— 商店版（差异）

| 节点 | 大小 | 相对 toolbar (x,y) | 文字/图片 |
|---|---|---|---|
| Tab「种子」 | 68×36 | (-288, 0) | 默认选中 |
| Tab「化肥」 | 68×36 | (-212, 0) | 未选中 |
| 「仅售 种子 / 化肥」Label | 140×20 | (252, 0) 右对齐 | 12px，`#d7c79a`（**商店无排序按钮**） |

### scroll（y=-32）与网格

| 节点 | 大小 | 说明 |
|---|---|---|
| `scroll` | 680×372 | Mask 矩形裁剪 + ScrollView（vertical=true, horizontal=false, inertia, elastic） |
| `content` | 644×372 | 相对 scroll (0,0)，左右各留 18px 边距（= (680-644)/2，与网页 padding 18 一致） |
| 布局 | `Layout.Type.GRID` | `FIXED_COL` 固定 6 列；`startAxis=HORIZONTAL`；`resizeMode=CONTAINER` |
| 格子尺寸 | **97.33×97.33** | = (680-36-5×12)/6 |
| 间距 | gap 12（横/纵） | spacingX=spacingY=12 |
| `empty` 空状态 | 644×200 @(0,0) | Label `该分类下暂无物品` 14px `#e9dcb8`，无物品时显示 |

> 网格位置：content 内第 c 列格子中心 x = -322 + c×109 + 48.67（即屏幕 x = 318 + c×109 + 48.67）；
> 第 r 行中心 y（相对 content）= 372/2 - 48.67 - r×109（屏幕 y 顶部 = 206 + r×109）。
> 完整 6 列网格：屏幕 x 318~962，滚动区屏幕 y 206~578。

### footer（y=-240）

| 节点 | 大小 | 相对 footer (x,y) | 文字 |
|---|---|---|---|
| 左 Label | 340×30 | (-170, 0) 左对齐 | 背包：`共 N 件物品`；商店：`金币：N 💰  ·  在售 M 种`，13px `#f3e8cf` |
| 右 Label | 340×30 | (165, 0) 右对齐 | 背包：`点格子看详情 · 点「卖💰」出售 · 可上下滑动`；商店：`点「购买」放入背包 · 售价=回收价×2`，13px `#c9b484` |

---

## 五、背包格子 CellItem（97.33×97.33）

| 节点 | 大小 | 相对格子 (x,y) | 文字/图片 |
|---|---|---|---|
| 底 | 97.33×97.33 | (0,0) | `cell.png`（28），米色渐变(上#f5ecd4→下#e6d4ab) + 棕边(#b89b63, 2px) 圆角12 |
| 名称 | 90×14 | (0, **37**) 居中 | 11px，`#5b4422`，顶部（约距顶 5px） |
| 图标 | 40×40 | (0, **6**) | `textures/items/{icon}.png` 动态加载，居中 |
| 数量 | 40×16 | (-31, **-37**) 左对齐 | `x{N}` 13px 粗，`#3a2a12`，左下（距左约 6px） |
| 卖💰按钮 | 56×22 | (24, **-37**) | `sell_badge.png`（18）+ 文字 `卖💰{N}` 11px 粗 `#8a4b13`，右下 |

交互：
- 点格子本体 → 详情飘字：`【分类】名称 × 数量 · 回收价 💰N · 获得于 X小时前`（2.5s）；
- 点「卖💰」→ 出售 1 个（已阻止冒泡，不会触发详情）。

---

## 六、商店物品卡 ShopItem（97.33×97.33）

| 节点 | 大小 | 相对卡片 (x,y) | 文字/图片 |
|---|---|---|---|
| 底 | 97.33×97.33 | (0,0) | `cell.png`（28），与背包格子同款 |
| 图标 | 26×26 | (0, **24**) | `textures/items/{icon}.png` |
| 名称 | 90×14 | (0, **6**) | 11px，`#5b4422` |
| 价格 | 90×16 | (0, **-7**) | `💰 {价格}` 12px 粗；买得起 `#3a2a12`，**买不起 `#c0392b`（红）** |
| 回收价 | 90×12 | (0, **-19**) | `回收💰{N}` 9px，`#8a7a55` |
| 购买按钮 | 72×26 | (0, **-34**) | `buy_normal.png` / `buy_disabled.png`（28）+ `购买` 13px 粗 `#ffffff`；买不起时 `Button.interactable=false`（置灰，与网页 :disabled 一致） |

---

## 七、Toast

| 项目 | 值 |
|---|---|
| 节点大小 | 480×44，屏幕顶部居中 (400, 90)，最上层 |
| 背景 | `toast.png`（九宫格 48），底 rgba(20,30,12,.92) + 金边 #ffe9b0 2px 圆角22 |
| 文字 | 18px `#ffe9b0`，460×40 居中 |
| 动画 | 显示后停留 `duration` 秒（默认 1.2），0.25s 淡出并隐藏 |

---

## 八、屏幕绝对坐标速查（1280×720，左上原点，与 HTML 一致）

| 元素 | 屏幕矩形 (x, y, w, h) |
|---|---|
| 太阳 | (80, 46, 90, 90) |
| 金币 HUD | (18, 18, 170, 42) |
| 商店按钮 | (36, 592, 92, 92) |
| 背包按钮 | (1152, 592, 92, 92) |
| Toast | (400, 90, 480, 44) |
| 面板 | (300, 98, 680, 524) |
| 面板 header | (300, 98, 680, 56) |
| 面板 toolbar | (300, 154, 680, 52) |
| 面板 scroll | (300, 206, 680, 372) |
| 面板 footer | (300, 578, 680, 44) |
| Tab 全部/种子/果实/化肥 | (318, 162, 68, 36) / (394, ...) / (470, ...) / (546, ...) |
| 排序 时间/名称 | (500, 164, 76, 32) / (584, 164, 76, 32) |
| × 关闭按钮 | (922, 108, 36, 36) |
| 格子 (第1行) | 屏幕 x：318, 427, 536, 645, 754, 863；y：206~303.33（每格 97.33，行距 109） |
| 地面条纹 | (0, 540, 1280, 180) |

---

## 九、图片素材表（纹理尺寸 / 逻辑尺寸 / 九宫格 inset）

> 素材在 `farm/resources/textures/ui/`，导入时拷贝/合并到 `assets/resources/textures/ui/`。
> 小控件按 2x 输出（高清屏更清晰）；「九宫格 inset」单位为**纹理像素**（编辑器 SpriteFrame 里填写的值）。

| 图片 | 纹理尺寸 | 逻辑尺寸 | inset（四边/数组） |
|---|---|---|---|
| `stage_bg.png` | 8×720（横向拉伸） | 全屏 | 无 |
| `sun.png` | 180×180 | 90×90 | 无 |
| `ground_strip.png` | 1280×180 | 1280×180 | 无 |
| `gold_hud.png` | 340×84 | 170×42 | 46 |
| `shop_btn.png` / `open_btn.png` | 184×184 | 92×92 | 100 |
| `toast.png` | 960×88 | 480×44 | 48 |
| `overlay_scrim.png` | 4×4 | 全屏 | 无（拉伸） |
| `panel.png` | 680×524 | 680×524 | 21 |
| `panel_header.png` | 680×56 | 680×56 | [22, 4, 22, 4] |
| `toolbar.png` | 680×52 | 680×52 | [18, 2, 18, 2] |
| `panel_footer.png` | 680×44 | 680×44 | [22, 4, 22, 4] |
| `tab_normal.png` / `tab_active.png` | 136×72 | 68×36 | 40 |
| `sort_normal.png` / `sort_active.png` | 152×64 | 76×32 | 32 |
| `close_btn.png` | 72×72 | 36×36 | 22 |
| `cell.png` | 400×400 | 97.33×97.33 | 28 |
| `sell_badge.png` | 112×44 | 56×22 | 18 |
| `buy_normal.png` / `buy_disabled.png` | 144×52 | 72×26 | 28 |

> 九宫格 inset 含义：图片四个边向内多少像素不可拉伸（保护圆角/边框）。
> 例如 `panel.png` inset=21：圆角半径 18 + 边框 3 ≈ 21，拉伸中间区域时四角不变形。
> 数组 [左, 上, 右, 下] 可分别设置（header/toolbar/footer 顶部圆角只保上下边距不同）。

### 9.1 slice（九宫格边距）到底是什么？

直观示意图见 `farm/design/slice示意图.png`：

```
┌─────────────┬─────────────┬─────────────┐
│   左上角    │   上边线    │   右上角    │  ← 四角 = 保护区（圆角+边框），永远不变形
│  40×40 不变 │   垂直拉伸  │  40×40 不变 │
├─────────────┼─────────────┼─────────────┤
│   左边线    │   中间区域  │   右边线    │  ← 节点变宽/变高时，
│   水平拉伸  │  双向拉伸   │   水平拉伸  │     只有这 9 格中的"边"和"中间"被拉伸
├─────────────┼─────────────┼─────────────┤
│   左下角    │   下边线    │   右下角    │
│  40×40 不变 │   垂直拉伸  │  40×40 不变 │
└─────────────┴─────────────┴─────────────┘
   ← 40px →    ← 可拉伸区 →    ← 40px →
```

**要点：**

1. **数字单位是"纹理像素"（图片本身的像素），不是 UI 逻辑坐标**。
   例如 `setImg(node, 'tab_normal.png', 40)` 的 40 = 图片 136×72 里四边各向内 40px 不拉伸。

2. **为什么是 40？** 我们的图片按 **2x 绘制**（高清屏更清晰），
   所以：`slice ≈ 2 × (圆角半径 + 边框宽度)`。
   tab 圆角半径 18 逻辑px → 纹理 36px，加边框 2px×2 ≈ 40px。✅
   同理 `panel.png` slice 21：圆角 18 + 边框 3 = 21（该图为 1x 绘制，无需乘 2）。

3. **什么时候有用？** 只有节点尺寸 ≠ 图片原始尺寸（被拉宽/拉高）时才需要。
   例如 panel 始终 680×524 时填不填都行；但如果哪天把面板拉宽到 800，
   有 slice=21 就能保证四角圆角和金边不变形，只有中间被拉伸。

4. **固定尺寸的控件（Tab 68×36、圆形按钮 92×92 从不改变尺寸）slice 填什么数字都不影响显示**，
   填 40/100 只是为了"万一将来要拉伸也安全"。

5. **在 Cocos 编辑器里对应操作**（手动搭建时）：
   选中 SpriteFrame 资源 → Inspector 里设置 insets（Left/Top/Right/Bottom，单位=纹理像素）
   → 节点 Sprite 组件 Type 选 **Sliced**。
   代码里则是一行 `setImg(node, 'xxx.png', slice)` 自动完成（见 `farm/ui/Ui.ts`）。

6. **slice 传数组可以四边不同**：`setImg(node, 'panel_header.png', [22, 4, 22, 4])`
   = 左22 / 上4 / 右22 / 下4。header 顶部要贴合面板圆角所以上边距小，下边有分隔线所以 4px 也够。

### 9.2 每张图的 slice 数值来源

| 图片 | 纹理尺寸 | 圆角(逻辑) | 边框(逻辑) | slice = 2×(圆角+边框) | 实际填写 |
|---|---|---|---|---|---|
| `gold_hud.png` | 340×84 (2x) | 21 | 2 | 2×(21+2) = 46 | 46 |
| `toast.png` | 960×88 (2x) | 22 | 2 | 2×(22+2) = 48 | 48 |
| `panel.png` | 680×524 (1x) | 18 | 3 | 18+3 = 21 | 21 |
| `tab_normal/active.png` | 136×72 (2x) | 18 | 2 | 2×(18+2) = 40 | 40 |
| `sort_normal/active.png` | 152×64 (2x) | 14 | 2 | 2×(14+2) = 32 | 32 |
| `close_btn.png` | 72×72 (2x) | 9 | 2 | 2×(9+2) = 22 | 22 |
| `cell.png` | 400×400 (2x) | 12 | 2 | 2×(12+2) = 28 | 28 |
| `sell_badge.png` | 112×44 (2x) | 8 | 1 | 2×(8+1) = 18 | 18 |
| `buy_normal/disabled.png` | 144×52 (2x) | 12 | 2 | 2×(12+2) = 28 | 28 |
| `panel_header.png` | 680×56 (1x) | 15(仅顶部) | 2 | 顶≈4（贴面板圆角）/ 左22 右22 / 下4 | [22,4,22,4] |
| `toolbar.png` / `panel_footer.png` | 680×52/44 (1x) | 0 | 2 | 横边 18 / 竖边 2 | [18,2,18,2] / [22,4,22,4] |
| `shop_btn.png` / `open_btn.png` | 184×184 (2x) | 圆形 | 4 | 100（随便一个大值，圆形不拉伸） | 100 |

> 圆形按钮、胶囊形（Tab/金币HUD/Toast）因为**四边全是圆角**，垂直方向本来就无法拉伸，
> slice 只要 ≥ 半径就能整体保护，数值大小无实际影响。

---

## 十、颜色表（全部取自网页 CSS）

| 颜色 | 用途 |
|---|---|
| `#ffe9b0` (255,233,176) | 金币文字、面板标题、选中排序文字、Toast 文字、金色描边 |
| `#d9b56a` (217,181,106) | 面板金边、Tab 选中底、卖💰徽章边 |
| `#f3e8cf` (243,232,207) | 普通文字（Tab 未选中、排序未选中、footer 左侧） |
| `#3a2a12` (58,42,18) | 金色底上的深色文字（Tab 选中、格子数量、商品价格） |
| `#c9b484` (201,180,132) | footer 右侧提示文字 |
| `#d7c79a` (215,199,154) | 「排序」Label、「仅售 种子 / 化肥」、退出登录 |
| `#e9dcb8` (233,220,184) | 空状态提示 |
| `#5b4422` (91,68,34) | 格子/物品卡名称 |
| `#8a4b13` (138,75,19) | 「卖💰N」文字 |
| `#c0392b` (192,57,43) | 商店价格（买不起时变红） |
| `#8a7a55` (138,122,85) | 商店回收价 |
| `#ffffff` | 圆形按钮文字、购买按钮文字 |
| 面板渐变 | 上 `#5a7a33` → 下 `#38521f` |
| 格子渐变 | 上 `#f5ecd4` → 下 `#e6d4ab` |
| 遮罩 | rgba(8, 20, 10, 0.55) |
| 场景背景渐变 | `#bfe9ff`(0%) → `#a6e08a`(52%) → `#6cbf4e`(100%) |

---

## 十一、字号表

| 字号 | 用途 |
|---|---|
| 22 粗 | 面板标题（农 场 背 包 / 农 场 商 店） |
| 18 | 金币 HUD、Toast |
| 16 粗 | 商店/背包圆形按钮文字 |
| 14 | Tab 文字、空状态提示、退出登录 |
| 13 | 排序按钮、footer 左右文字、购买按钮、格子数量 |
| 12 | 「排序」Label、商店「仅售」提示、商品价格 |
| 11 | 格子名称、卖💰文字、商品名称 |
| 9 | 商店回收价 |

---

## 十二、在编辑器里手动搭建（可选，替代代码构建）

如果不想用代码构建，可以照下面步骤在 farm 场景 Canvas 下手动搭（数值全部见上文）：

1. **导入图片**：把 `farm/resources/textures/ui/` 放进 `assets/resources/textures/ui/`；
   逐个选中 SpriteFrame，按第九节设置九宫格 inset；Sprite 组件 Type 选 **Sliced**（无 inset 的选 Simple）。
2. **搭场景层**：Canvas 下依次创建 背景/太阳/地面条纹（Sprite）、金币胶囊（Sprite+Label）、
   两个圆形按钮（Sprite+Button+Label，锚点左下/右下 36,36）、退出登录（Label+Button）。
3. **搭面板**（背包/商店各一套，先 `active=false`）：
   - 根节点全屏 Sprite（overlay_scrim）+ 同尺寸透明节点拦截点击（或代码里用 TOUCH_END 判断点空白关闭）；
   - 子节点 `panel`（680×524 Sliced）→ 依次加 `header`（680×56）/ `toolbar`（680×52）/
     `scroll`（680×372，加 Mask=矩形 + ScrollView，把 content 拖给它）/ `footer`（680×44）；
   - header 里：标题 Label（左对齐 @-150,0）+ × 按钮（@300,0）；
   - toolbar 里：4 个 Tab 按钮（起点 @-288，间隔 76）+ 「排序」Label（@154）+ 2 个排序按钮（@200/@284）；
   - scroll 里：`content`（644×372）加 Layout Grid（FIXED_COL=6，cell 97.33，gap 12），
     再放格子 Prefab（97.33×97.33，内部：名称@(0,37)、图标@(0,6)、数量@(-31,-37)、卖💰@(24,-37)）；
   - footer 里：左右两个 Label（@-170 左对齐 / @165 右对齐）；
4. **搭 Toast**：480×44 Sliced + Label（@0,0），顶部居中 top=90；
5. **挂脚本**：面板根挂 `BackpackPanel` / `ShopPanel`、格子挂 `CellItem`、物品卡挂 `ShopItem`、
   Toast 挂 `Toast`，把各节点引用拖到对应 `@property`；也可以像现在代码这样全自动构建，二选一。

> 若用手动搭建并启用 BackpackPanel 脚本，需要把脚本里的 `@property` 引用（panel/scrollView/content/
> footerLabel/tabNodes/sortNodes）都绑定好——当前代码版是自动构建，无需任何绑定。

---

## 十三、常见修改指南

| 想改什么 | 改哪里 |
|---|---|
| 面板宽/高/圆角/颜色 | 重新生成 `panel.png` 或直接改图；代码里改 `PANEL_W/PANEL_H`（BackpackPanel/ShopPanel 顶部常量） |
| 格子大小/列数/间距 | 代码里改 `CELL / COLS / GAP / GRID_W`（两个面板同名常量） |
| 面板整体位置 | 改 `panel` 节点位置（当前 (0,0) 居中） |
| 按钮/文字颜色、字号 | 各文件顶部的颜色常量（C_*）与 `label()` 的 size 参数 |
| 图片路径 | `farm/ui/Ui.ts` 顶部的 `UI_DIR` |
| 九宫格边距 | 各文件 `setImg(..., slice)` 的参数 |
| 网格行距/列距 | `layout.spacingX / spacingY` |
| 滚动行为 | `scrollView.inertia / brake / elastic / bounceDuration` |
| Toast 停留时长 | `toast.show(msg, duration)` 第二个参数（详情飘字传 2.5s） |
| 屏幕适配 | `GameRoot.onLoad` 里的 `view.setDesignResolutionSize(1280, 720, FIXED_HEIGHT)` |

---

## 十四、与网页设计稿的对应关系

| 网页（backpack_reference.html） | Cocos |
|---|---|
| `#stage` 渐变背景 | `stage_bg.png` |
| `#stage::before` 太阳 | `sun.png` @(80,46) |
| `#stage::after` 地面条纹 | `ground_strip.png` |
| `.gold-hud` | `gold_hud.png` @(18,18) 170×42 |
| `.shop-btn` / `.open-btn` | `shop_btn.png` / `open_btn.png` @(36,592)/(1152,592) 92×92 |
| `.toast` | `toast.png` @(400,90) 480×44 |
| `.overlay` | `overlay_scrim.png` 全屏 |
| `.panel` | `panel.png` 680×524 |
| `.panel-header` | `panel_header.png` 680×56 |
| `.toolbar` | `toolbar.png` 680×52 |
| `.scroll-view` | Mask+ScrollView 680×372 |
| `.panel-footer` | `panel_footer.png` 680×44 |
| `.tab` / `.tab.active` | `tab_normal.png` / `tab_active.png` 68×36 |
| `.sort-btn` / `.sort-btn.active` | `sort_normal.png` / `sort_active.png` 76×32 |
| `.close-btn` | `close_btn.png` 36×36 |
| `.cell` | `cell.png` 97.33×97.33 |
| `.cell .sell` | `sell_badge.png` 56×22 |
| `.buy-btn` / `:disabled` | `buy_normal.png` / `buy_disabled.png` 72×26 |
| 网页 z-index 30（Toast 最上） | 节点添加顺序：Toast 最后创建（最上层） |
