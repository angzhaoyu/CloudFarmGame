/**
 * ui/BackpackPanel.ts —— 背包面板（完全对照网页 backpack.html 的结构与行为）
 *
 * ★ 网页结构还原 ★
 *
 * BackpackPanel  (挂载本脚本)
 * ├── Overlay     (全屏半透明 Sprite 遮罩 1280×720，⚠️不是 Mask！点击空白处关闭面板)
 * │   └── Panel   (Sprite，主面板 680×?，绿色渐变背景 + 金色边框)
 * │       ├── Header  (横向 Layout)
 * │       │   ├── TitleLabel   (Label: "农 场 背 包"，金色 #ffe9b0)
 * │       │   └── CloseBtn     (Button: "×"，暗红背景 #5a2733)
 * │       ├── Toolbar (横向 Layout，左右分区)
 * │       │   ├── Tabs (横向 Layout)
 * │       │   │   ├── TabAll   (Button+Sprite+Label: "全部")
 * │       │   │   ├── TabSeed  (Button+Sprite+Label: "种子")
 * │       │   │   ├── TabFruit (Button+Sprite+Label: "果实")
 * │       │   │   └── TabFert  (Button+Sprite+Label: "化肥")
 * │       │   └── Sort (横向 Layout)
 * │       │       ├── SortLabel (Label: "排序"，灰金色 #d7c79a)
 * │       │       ├── SortTime  (Button+Sprite+Label: "时间 ↓")
 * │       │       └── SortName  (Button+Sprite+Label: "名称")
 * │       ├── ScrollView (ScrollView 组件，高 372)
 * │       │   └── view
 * │       │       └── Content (Grid Layout，6 列)
 * │       └── Footer (横向 Layout)
 * │           ├── FooterLabel  (Label: "共 0 件物品")
 * │           └── HintLabel    (Label: "点格子看详情 · 点「卖💰」出售 · 可上下滑动")
 */
import { _decorator, Component, Node, Prefab, Label, Sprite, Button, ScrollView, Layout, instantiate, Color } from 'cc';
import { InventoryModel } from '../data/InventoryModel';
import { PlayerModel } from '../data/PlayerModel';
import type { InventoryStack, ItemCategory } from '../data/ItemData';
import { CellItem } from './CellItem';
const { ccclass, property } = _decorator;

/** Tab 正常色（网页 .tab 默认：rgba(0,0,0,.2) 上的浅金文字 → Cocos 用按钮 Sprite 色近似） */
const TAB_NORMAL = new Color(243, 232, 207);
/** Tab 激活色（网页 .tab.active：bg #d9b56a） */
const TAB_ACTIVE = new Color(217, 181, 106);
/** 排序按钮正常色 */
const SORT_NORMAL = new Color(243, 232, 207);
/** 排序按钮激活色（网页 .sort-btn.active：border #ffe9b0、bg rgba(217,181,106,.28)） */
const SORT_ACTIVE = new Color(255, 233, 176);

@ccclass('BackpackPanel')
export class BackpackPanel extends Component {

  /* ===== 遮罩 ===== */
  /** 全屏半透明遮罩节点（挂 Sprite 组件，不是 Mask！点击空白处关闭面板） */
  @property(Node)      overlay:     Node       = null!;

  /* ===== 主面板 ===== */
  @property(Node)      panel:       Node       = null!;

  /* ===== Header ===== */
  @property(Label)     titleLabel:  Label      = null!;   // "农 场 背 包"
  @property(Button)    closeBtn:    Button     = null!;   // "×"

  /* ===== Toolbar — 分类 Tab ===== */
  @property([Node])    tabNodes:    Node[]     = [];      // 顺序: 全部 / 种子 / 果实 / 化肥

  /* ===== Toolbar — 排序 ===== */
  @property(Label)     sortLabel:   Label      = null!;   // 固定文字 "排序"
  @property([Node])    sortNodes:   Node[]     = [];      // 顺序: 时间 / 名称

  /* ===== ScrollView ===== */
  @property(ScrollView) scrollView: ScrollView = null!;
  @property(Node)      content:     Node       = null!;
  @property(Prefab)    cellPrefab:  Prefab     = null!;

  /* ===== Footer ===== */
  @property(Label)     footerLabel: Label      = null!;   // "共 0 件物品"
  @property(Label)     hintLabel:   Label      = null!;   // "点格子看详情 · 点「卖💰」出售 · 可上下滑动"
  @property(Label)     goldLabel:   Label      = null!;   // 在 HUD 或 footer 中显示金币（按原代码保留）

  /* ===== 由 GameRoot 注入 ===== */
  inventory!: InventoryModel;
  player!: PlayerModel;
  onGoldChanged: (gold: number) => void = () => {};
  onToast: (msg: string) => void = () => {};
  onChanged: () => void = () => {};

  /** 互斥回调：打开背包前先通知 GameRoot 关闭其他面板 */
  onRequestOpen: () => void = () => {};

  private category: ItemCategory | 'all' = 'all';
  private sortKey: 'time' | 'name' = 'time';
  private sortDir: 'asc' | 'desc' = 'desc';

  /* ---------- 生命周期 ---------- */

  onLoad() {
    // 初始隐藏
    this.overlay.active = false;

    // 标题（带空格，和网页一致）
    if (this.titleLabel) this.titleLabel.string = '农 场 背 包';

    // 固定提示
    if (this.hintLabel) this.hintLabel.string = '点格子看详情 · 点「卖💰」出售 · 可上下滑动';
    if (this.sortLabel) this.sortLabel.string = '排序';

    // 关闭按钮
    if (this.closeBtn) {
      this.closeBtn.node.on(Button.EventType.CLICK, () => this.close());
    }

    // ★ 点击遮罩空白处关闭（模拟网页 overlay.click → closeBackpack）
    if (this.overlay) {
      this.overlay.on(Node.EventType.TOUCH_END, (event: any) => {
        // 只有点在遮罩本身（而非子面板）才关闭
        const target = event.target as Node;
        if (target === this.overlay) {
          this.close();
        }
      });
    }

    // 分类 Tab 绑定
    const cats: (ItemCategory | 'all')[] = ['all', 'seed', 'fruit', 'fert'];
    this.tabNodes.forEach((n, i) => {
      n.on(Button.EventType.CLICK, () => this.setCategory(cats[i]));
    });

    // 排序按钮绑定
    const keys: ('time' | 'name')[] = ['time', 'name'];
    this.sortNodes.forEach((n, i) => {
      n.on(Button.EventType.CLICK, () => this.setSort(keys[i]));
    });

    this.refreshTab();
    this.refreshSort();
  }

  /* ---------- 公共接口 ---------- */

  /** 打开面板（先互斥关闭其他面板） */
  open() {
    this.onRequestOpen();
    this.overlay.active = true;
    this.render();
  }

  /** 关闭面板 */
  close() {
    this.overlay.active = false;
  }

  /** 是否处于打开状态 */
  get isOpen(): boolean {
    return this.overlay.active;
  }

  /* ---------- 分类切换 ---------- */

  private setCategory(c: ItemCategory | 'all') {
    this.category = c;
    this.refreshTab();
    this.render();
  }

  private refreshTab() {
    const idx = ['all', 'seed', 'fruit', 'fert'].indexOf(this.category);
    this.tabNodes.forEach((n, i) => {
      const sp = n.getComponent(Sprite);
      if (sp) sp.color = i === idx ? TAB_ACTIVE : TAB_NORMAL;
    });
  }

  /* ---------- 排序切换 ---------- */

  private setSort(k: 'time' | 'name') {
    if (this.sortKey === k) {
      this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc';
    } else {
      this.sortKey = k;
      this.sortDir = 'desc';
    }
    this.refreshSort();
    this.render();
  }

  /** 刷新排序按钮文字和高亮（网页：激活按钮显示 "时间 ↓"/"时间 ↑"，非激活只显示文字） */
  private refreshSort() {
    const labels = [
      '时间' + (this.sortKey === 'time' ? (this.sortDir === 'desc' ? ' ↓' : ' ↑') : ''),
      '名称' + (this.sortKey === 'name' ? (this.sortDir === 'desc' ? ' ↓' : ' ↑') : ''),
    ];
    this.sortNodes.forEach((n, i) => {
      const lb = n.getComponentInChildren(Label);
      if (lb) lb.string = labels[i];
      const sp = n.getComponent(Sprite);
      if (sp) sp.color = (this.sortKey === (i === 0 ? 'time' : 'name')) ? SORT_ACTIVE : SORT_NORMAL;
    });
  }

  /* ---------- 渲染网格 ---------- */

  render() {
    this.content.removeAllChildren();

    const list: InventoryStack[] = this.inventory.query({
      category: this.category,
      sort: this.sortKey,
      dir: this.sortDir,
    });

    for (const it of list) {
      const cell = instantiate(this.cellPrefab);
      cell.getComponent(CellItem)!.init(it, (id) => this.sellItem(id));
      this.content.addChild(cell);
    }

    this.content.getComponent(Layout)?.updateLayout();

    // Footer（网页格式）
    if (this.footerLabel) this.footerLabel.string = `共 ${list.length} 件物品`;
    if (this.goldLabel) this.goldLabel.string = '💰 ' + this.player.gold;

    // ScrollView 回到顶部
    if (this.scrollView) this.scrollView.scrollToTop(0);
  }

  /* ---------- 出售 ---------- */

  private sellItem(id: string) {
    const gain = this.inventory.sellOne(id);
    if (gain <= 0) return;
    this.player.addGold(gain);
    this.onGoldChanged(this.player.gold);
    this.onToast(`+${gain} 💰 出售`);
    this.render();
    this.onChanged();
  }
}
