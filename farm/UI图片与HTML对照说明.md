# 农场 UI 图片素材 · 与网页设计稿 1:1 对照说明

## 一、这次做了什么

之前 farm 的 UI（背包/商店面板、金币 HUD、按钮、Toast）全部是**代码画出来的**（Graphics 画圆角矩形），
既不好看，也没法在 Cocos 编辑器里直接拖拽布局。

本次从网页设计稿 `backpack_reference.html`（在 git 历史里找到的原始设计文件，已还原到 `farm/design/`）
把每一块 UI 都**渲染成了 PNG 图片素材**，并重写了 farm 的 UI 代码：

- 所有背景、圆角面板、胶囊、按钮、格子、徽章都用**图片**（支持九宫格拉伸，圆角边框不变形）；
- **功能与网页 1:1**：分类 Tab、时间/名称排序（升降序箭头）、6 列可滚动网格、点格子看详情、
  「卖💰」出售、商店「购买」（买不起时价格变红 + 按钮禁用）、遮罩点空白关闭、× 关闭、
  金币 HUD、Toast 飘字、面板互斥、买卖实时同步后端……全部保留；
- 使用方式不变：**把 `GameRoot` 挂到 farm 场景的 Canvas 上即可**，UI 全部自动构建，零手动布局；
  图片素材同时也可以直接拖进编辑器做自定义布局。

> 登录界面（login）没有对应的 HTML 设计稿，维持原有代码绘制方式，本次未改动。

## 二、图片素材清单

素材目录：`farm/resources/textures/ui/`（18 张 PNG）

| 文件 | 用途（对应网页元素） | 逻辑尺寸 | 九宫格边距(纹理px) |
|---|---|---|---|
| `stage_bg.png` | 场景背景（天空→草地渐变，网页 `#stage`） | 拉伸全屏 | - |
| `sun.png` | 左上角太阳（网页 `#stage::before`） | 90×90 | - |
| `ground_strip.png` | 底部地面装饰条纹（网页 `#stage::after`） | 贴底铺满宽 | - |
| `gold_hud.png` | 金币胶囊（`.gold-hud`） | 170×42 | 42 |
| `shop_btn.png` | 商店圆形按钮（`.shop-btn`，含购物车图标） | 92×92 | 92 |
| `open_btn.png` | 背包圆形按钮（`.open-btn`，含竹篮图标） | 92×92 | 92 |
| `toast.png` | 飘字提示（`.toast`） | 480×44 | 44 |
| `overlay_scrim.png` | 面板遮罩（`.overlay` 背景） | 拉伸全屏 | - |
| `panel.png` | 面板主体（`.panel` 绿底金边圆角） | 680×524 | 18 |
| `panel_header.png` | 面板头部渐变条（`.panel-header`） | 680×56 | 15/15/15/4 |
| `toolbar.png` | 工具栏深色条（`.toolbar`） | 680×52 | 2/2/2/2 |
| `panel_footer.png` | 面板底部条（`.panel-footer`） | 680×44 | 2/2/2/2 |
| `tab_normal.png` | 分类 Tab 未选中（`.tab`） | 68×36 | 36 |
| `tab_active.png` | 分类 Tab 选中金色（`.tab.active`） | 68×36 | 36 |
| `sort_normal.png` | 排序按钮未选中（`.sort-btn`） | 76×32 | 28 |
| `sort_active.png` | 排序按钮选中（`.sort-btn.active`） | 76×32 | 28 |
| `close_btn.png` | × 关闭按钮（`.close-btn`，× 已画入图内） | 36×36 | 18 |
| `cell.png` | 背包格子 / 商店物品卡底（`.cell` / `.shop-item`） | 97.33×97.33 | 24 |
| `sell_badge.png` | 「卖💰N」小徽章（`.cell .sell`） | 56×22 | 16 |
| `buy_normal.png` | 「购买」按钮（`.buy-btn`） | 72×26 | 24 |
| `buy_disabled.png` | 「购买」按钮禁用态（`.buy-btn:disabled`） | 72×26 | 24 |

> 说明：
> - 小控件按 **2x 分辨率**输出（高清屏更清晰），大面板/背景 1x。
> - 尺寸/颜色全部取自 `backpack_reference.html` 的 CSS（圆角、描边、渐变、半透明都一致）。
> - 圆形按钮上的 🧺/🛒 图标（网页 emoji）已直接画进图片里；文字（背包/商店/金币数字…）
>   仍是 Cocos Label，保证动态更新。
> - **九宫格边距 = 圆角半径（纹理像素）**（2x 图 = 2×逻辑半径；边框画在圆角矩形内部，无需另加）。
>   详见《Cocos布局详细说明.md》9.1 / 9.2 节。

## 三、如何导入 Cocos 项目

1. 把 `farm/` 整个文件夹放进项目 `assets/`（和原来一样）；
2. **把 `farm/resources/textures/ui/` 的内容拷贝/合并到 `assets/resources/textures/ui/`**（没有就新建）
   —— 这是代码 `resources.load('textures/ui/xxx')` 加载图片的路径；
3. 物品图标仍按原约定放在 `assets/resources/textures/items/`（`CellItem`/`ShopItem` 会加载）；
4. 把 `GameRoot` 组件挂到 farm 场景的 Canvas 节点，运行即可。
   场景里**不需要**再手动搭任何节点；`login` 场景的跳转逻辑不变。

> 提示：如果只改了 UI 图片的路径，改 `farm/ui/Ui.ts` 顶部的 `UI_DIR` 常量一处即可。

## 四、代码结构（重写后）

```
farm/
  GameRoot.ts            # 场景入口：构建背景/HUD/按钮/Toast/两个面板 + 数据注入 + 同步
  ui/
    Ui.ts                # ★ 新增：UI 构建工具（setImg 九宫格 / ui / label / imgButton / addMaskRect / Widget 锚点）
    BackpackPanel.ts     # 背包面板（网页 1:1：header/toolbar/scroll/footer + Tab + 排序 + 出售 + 详情）
    ShopPanel.ts         # 商店面板（网页 1:1：header/toolbar/scroll/footer + Tab + 购买 + 买不起禁用）
    CellItem.ts          # 背包格子（名称/图标/数量/卖💰，点格子看详情）
    ShopItem.ts          # 商店物品卡（图标/名称/价格/回收/购买）
    Toast.ts             # 飘字（金色胶囊 + 淡出）
  resources/textures/ui/ # ★ 新增：全部 UI 图片素材
  design/                # ★ 新增：原始设计稿备份
    backpack_reference.html
    field/               # 农场土地页设计稿（index.html + 背景 + 24 块土地图，备用）
  config/ data/          # 未改动
```

各面板的节点层级与网页结构一一对应：

```
backpack_panel (遮罩 Sprite + Widget 全屏)
└─ panel (panel.png 九宫格 680×524)
   ├─ header (panel_header.png)
   │  ├─ 农 场 背 包 (Label #ffe9b0 22px)
   │  └─ × (close_btn.png Button)
   ├─ toolbar (toolbar.png)
   │  ├─ 全部/种子/果实/化肥 (tab_normal/active.png Button)
   │  └─ 排序 · 时间↓ · 名称 (sort_normal/active.png Button)
   ├─ scroll (Mask 裁剪 + ScrollView)
   │  └─ content (Grid Layout: 6 列, 格子 97.33, 间距 12)
   │     └─ cell (cell.png + 名称/图标/数量/卖💰)
   └─ footer (panel_footer.png)
      └─ 共 N 件物品 · 操作提示
```

## 五、功能对照表（网页 → Cocos）

| 网页功能 | Cocos 实现 |
|---|---|
| 金币 HUD（左上） | `gold_hud.png` + Label，买卖后实时刷新 |
| 商店/背包圆形入口按钮 | `shop_btn.png` / `open_btn.png`（图标已入图，文字 Label） |
| Toast 飘字（顶部居中，1.2s 淡出） | `toast.png` + tween |
| 点遮罩空白处关闭面板 | overlay `TOUCH_END` 判断 `e.target` |
| × 关闭按钮 | `close_btn.png` Button |
| 分类 Tab（选中金色） | `tab_active/normal.png` 切换 |
| 时间/名称排序 + 升降序箭头 | `sort_active/normal.png` + Label 箭头 |
| 6 列网格可滚动 | Grid Layout(FIXED_COL=6) + ScrollView |
| 空分类提示「该分类下暂无物品」 | 空状态 Label |
| 点格子看详情（网页 alert） | 飘字展示 【分类】名称 ×数量 · 回收价 · 获得于…（2.5s） |
| 「卖💰」出售 1 个 → 加金币/飘字/重渲染/存后端 | `sellOne()` + 回调链 |
| 商店买不起：价格变红 + 按钮禁用 | `#c0392b` + `Button.interactable=false` |
| 「购买」→ 扣金币/入背包/飘字/重渲染/存后端 | `spend()` + `addItem()` + 回调链 |
| footer 计数 + 提示文案 | Label 拼接（金币 / 在售种数） |
| 面板弹入动画（pop/fade） | scale 0.9→1 + UIOpacity |
| （网页无）背包/商店互斥 | `GameRoot.openBackpack/openShop` 互关 |

## 六、常见问题

- **控制台报 `图片加载失败：textures/ui/xxx`** → 图片没放进 `assets/resources/textures/ui/`，见第三节。
- **物品图标不显示** → 检查 `assets/resources/textures/items/<icon>.png` 是否存在（`icon` 见 `config/ItemConfig.ts`）。
- **想手动在编辑器里布局** → 用第三节的图片拖 Sprite（九宫格需在编辑器 Sprite 属性里把
  Type 设为 Sliced，并在 SpriteFrame 上设置九宫格边距；也可直接沿用代码里的 setImg 自动配置）。
- **想改颜色/尺寸** → 直接改 `farm/resources/textures/ui/` 里的 PNG；
  再改对应九宫格边距（`farm/ui/` 各文件里的 setImg 参数）。
- **设计稿备份** → `farm/design/backpack_reference.html`（背包+商店完整设计稿）、
  `farm/design/field/`（农场土地页设计稿 + 土地图片，后续做「种地」功能可直接使用）。
