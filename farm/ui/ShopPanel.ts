/**
 * ui/ShopPanel.ts —— 商店面板（完全对照网页 backpack.html 的结构与行为）
 *
 * ★ 网页结构还原 ★
 *
 * ShopPanel  (挂载本脚本)
 * ├── Overlay     (全屏半透明遮罩，点击遮罩关闭面板)
 * │   └── Panel   (Sprite，主面板 680×?，绿色渐变背景 + 金色边框)
 * │       ├── Header  (横向 Layout)
 * │       │   ├── TitleLabel   (Label: "农 场 商 店"，金色 #ffe9b0)
 * │       │   └── CloseBtn     (Button: "×"，暗红背景 #5a2733)
 * │       ├── Toolbar (横向 Layout，左右分区)
 * │       │   ├── Tabs (横向 Layout)
 * │       │   │   ├── TabSeed  (Button+Sprite+Label: "种子")
 * │       │   │   └── TabFert  (Button+Sprite+Label: "化肥")
 * │       │   └── InfoLabel   (Label: "仅售 种子 / 化肥"，灰金色 #d7c79a)
 * │       ├── ScrollView (ScrollView 组件，高 372)
 * │       │   └── view
 * │       │       └── Content (Grid Layout，6 列)
 * │       └── Footer (横向 Layout)
 * │           ├── FooterLabel  (Label: "金币：0 💰 · 在售 N 种")
 * │           └── HintLabel    (Label: "点「购买」放入背包 · 售价=回收价×2")
 */
import { _decorator, Component, Node, Prefab, Label, Sprite, Button, ScrollView, Layout, instantiate, Color } from 'cc';
import { InventoryModel } from '../data/InventoryModel';
import { PlayerModel } from '../data/PlayerModel';
import type { ShopDef, ItemCategory } from '../data/ItemData';
import { SHOP_ITEMS } from '../config/ItemConfig';
import { ShopItem } from './ShopItem';
const { ccclass, property } = _decorator;

const TAB_NORMAL = new Color(243, 232, 207);
const TAB_ACTIVE = new Color(217, 181, 106);

@ccclass('ShopPanel')
export class ShopPanel extends Component {

  /* ===== 遮罩 ===== */
  @property(Node)      overlay:        Node       = null!;

  /* ===== 主面板 ===== */
  @property(Node)      panel:          Node       = null!;

  /* ===== Header ===== */
  @property(Label)     titleLabel:     Label      = null!;   // "农 场 商 店"
  @property(Button)    closeBtn:       Button     = null!;   // "×"

  /* ===== Toolbar — 分类 Tab ===== */
  @property([Node])    tabNodes:       Node[]     = [];      // 顺序: 种子 / 化肥

  /* ===== Toolbar — 提示文字 ===== */
  @property(Label)     infoLabel:      Label      = null!;   // "仅售 种子 / 化肥"（网页右侧固定文字）

  /* ===== ScrollView ===== */
  @property(ScrollView) scrollView:    ScrollView = null!;
  @property(Node)      content:        Node       = null!;
  @property(Prefab)    shopItemPrefab: Prefab     = null!;

  /* ===== Footer ===== */
  @property(Label)     footerLabel:    Label      = null!;   // "金币：500 💰 · 在售 21 种"
  @property(Label)     hintLabel:      Label      = null!;   // "点「购买」放入背包 · 售价=回收价×2"
  @property(Label)     goldLabel:      Label      = null!;   // 保留向后兼容（可选，和 footerLabel 二选一）

  /* ===== 由 GameRoot 注入 ===== */
  inventory!: InventoryModel;
  player!: PlayerModel;
  onGoldChanged: (gold: number) => void = () => {};
  onToast: (msg: string) => void = () => {};
  onChanged: () => void = () => {};

  /** 互斥回调 */
  onRequestOpen: () => void = () => {};

  private category: Extract<ItemCategory, 'seed' | 'fert'> = 'seed';

  /* ---------- 生命周期 ---------- */

  onLoad() {
    this.overlay.active = false;

    // 标题（带空格，和网页一致）
    if (this.titleLabel) this.titleLabel.string = '农 场 商 店';

    // 固定提示
    if (this.infoLabel) this.infoLabel.string = '仅售 种子 / 化肥';
    if (this.hintLabel) this.hintLabel.string = '点「购买」放入背包 · 售价=回收价×2';

    // 关闭按钮
    if (this.closeBtn) {
      this.closeBtn.node.on(Button.EventType.CLICK, () => this.close());
    }

    // ★ 点击遮罩空白处关闭
    if (this.overlay) {
      this.overlay.on(Node.EventType.TOUCH_END, (event: any) => {
        const target = event.target as Node;
        if (target === this.overlay) {
          this.close();
        }
      });
    }

    // 分类 Tab（网页商店只有 种子 / 化肥 两个 tab）
    const cats: ('seed' | 'fert')[] = ['seed', 'fert'];
    this.tabNodes.forEach((n, i) => {
      n.on(Button.EventType.CLICK, () => this.setCategory(cats[i]));
    });

    this.refreshTab();
  }

  /* ---------- 公共接口 ---------- */

  open() {
    this.onRequestOpen();
    this.overlay.active = true;
    this.render();
  }

  close() {
    this.overlay.active = false;
  }

  get isOpen(): boolean {
    return this.overlay.active;
  }

  /* ---------- 分类切换 ---------- */

  private setCategory(c: 'seed' | 'fert') {
    this.category = c;
    this.refreshTab();
    this.render();
  }

  private refreshTab() {
    const idx = ['seed', 'fert'].indexOf(this.category);
    this.tabNodes.forEach((n, i) => {
      const sp = n.getComponent(Sprite);
      if (sp) sp.color = i === idx ? TAB_ACTIVE : TAB_NORMAL;
    });
  }

  /* ---------- 渲染网格 ---------- */

  render() {
    this.content.removeAllChildren();

    const list: ShopDef[] = SHOP_ITEMS.filter(s => s.category === this.category);

    for (const def of list) {
      const item = instantiate(this.shopItemPrefab);
      item.getComponent(ShopItem)!.init(def, (d) => this.buy(d), this.player.gold);
      this.content.addChild(item);
    }

    this.content.getComponent(Layout)?.updateLayout();

    // Footer（网页格式："金币：500 💰 · 在售 21 种"）
    if (this.footerLabel) this.footerLabel.string = `金币：${this.player.gold} 💰  ·  在售 ${list.length} 种`;
    // 保留兼容旧 goldLabel
    if (this.goldLabel) this.goldLabel.string = '💰 ' + this.player.gold;

    if (this.scrollView) this.scrollView.scrollToTop(0);
  }

  /* ---------- 购买 ---------- */

  private buy(def: ShopDef) {
    if (!this.player.spend(def.price)) {
      this.onToast('金币不足 💰');
      return;
    }
    this.inventory.addItem(def, 1);
    this.onGoldChanged(this.player.gold);
    this.onToast(`-${def.price} 💰 购买 ${def.name}`);
    this.render();
    this.onChanged();
  }
}
