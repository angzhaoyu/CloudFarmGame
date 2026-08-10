/**
 * ui/BackpackPanel.ts —— 背包面板（对照 backpack_reference.html 1:1 还原）
 *
 * 结构（与网页一致）：
 *   overlay 遮罩（点空白关闭）→ panel（绿底金边圆角）
 *     → header（"农 场 背 包"标题 + × 关闭）
 *     → toolbar（全部/种子/果实/化肥 4 个 Tab + "排序" + 时间/名称按钮）
 *     → scroll（6 列网格，可上下滑动）
 *     → footer（"共 N 件物品" + 操作提示）
 * 交互（与网页一致）：Tab 过滤、排序切换升降序、点格子看详情、点「卖💰」出售 1 个。
 * 图片素材：farm/resources/textures/ui/（拷入 assets/resources/textures/ui/）。
 */
import { _decorator, Color, Component, EventTouch, Label, Layout, Node, ScrollView, Size, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { InventoryModel } from '../data/InventoryModel';
import { PlayerModel } from '../data/PlayerModel';
import type { ItemCategory, InventoryStack } from '../data/ItemData';
import { CATEGORY_LABEL } from '../data/ItemData';
import { CellItem } from './CellItem';
import { addMaskRect, imgButton, label, setImg, timeAgo, ui } from './Ui';
const { ccclass } = _decorator;

// —— 与网页 CSS 一致的尺寸 ——
const PANEL_W = 680;
const PANEL_H = 524;                  // header 56 + toolbar 52 + scroll 372 + footer 44
const HEADER_H = 56;
const TOOLBAR_H = 52;
const FOOTER_H = 44;
const SCROLL_H = PANEL_H - HEADER_H - TOOLBAR_H - FOOTER_H; // 372
const CELL = 97.33;                   // (680-36-5*12)/6
const GAP = 12;
const COLS = 6;
const GRID_W = COLS * CELL + (COLS - 1) * GAP;             // 644

// —— 与网页 CSS 一致的颜色 ——
const C_TITLE   = new Color(255, 233, 176, 255); // #ffe9b0 标题/选中
const C_TEXT    = new Color(243, 232, 207, 255); // #f3e8cf 普通文字
const C_TEXT_D  = new Color(58, 42, 18, 255);    // #3a2a12 选中文字
const C_HINT    = new Color(201, 180, 132, 255); // #c9b484 footer 提示
const C_SORT_LB = new Color(215, 199, 154, 255); // #d7c79a 排序label
const C_EMPTY   = new Color(233, 220, 184, 255); // #e9dcb8 空状态

@ccclass('BackpackPanel')
export class BackpackPanel extends Component {
  // —— 由 GameRoot 注入 ——
  inventory!: InventoryModel;
  player!: PlayerModel;
  onGoldChanged: (gold: number) => void = () => {};
  onToast: (msg: string, duration?: number) => void = () => {};
  onChanged: () => void = () => {};

  private panel!: Node;
  private scrollView!: ScrollView;
  private content!: Node;
  private emptyNode!: Node;
  private footerLabel!: Label;
  private tabs: { node: Node; lb: Label; cat: ItemCategory | 'all' }[] = [];
  private sortBtns: { node: Node; lb: Label; key: 'time' | 'name' }[] = [];

  private category: ItemCategory | 'all' = 'all';
  private sortKey: 'time' | 'name' = 'time';
  private sortDir: 'asc' | 'desc' = 'desc';
  isOpen = false;

  onLoad() { this.build(); }

  // ==================== 构建 ====================

  private build() {
    // —— 遮罩：点空白关闭（与网页 e.target === overlay 一致）——
    setImg(this.node, 'overlay_scrim.png');
    this.node.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
      if (e.target === this.node) this.close();
    });
    this.node.active = false;

    // —— 面板主体 ——
    this.panel = ui('panel', this.node, 0, 0, PANEL_W, PANEL_H);
    setImg(this.panel, 'panel.png', 21);
    const top = PANEL_H / 2;

    // —— header：标题 + × 关闭 ——
    const header = ui('header', this.panel, 0, top - HEADER_H / 2, PANEL_W, HEADER_H);
    setImg(header, 'panel_header.png', [22, 4, 22, 4]);
    label(header, '农 场 背 包', 22, C_TITLE, -150, 0, 320, 40, true, false, true);
    imgButton(header, PANEL_W / 2 - 22 - 18, 0, 36, 36, 'close_btn.png', 22,
      () => this.close(), 0.9);

    // —— toolbar：分类 Tab + 排序 ——
    const toolbar = ui('toolbar', this.panel, 0, top - HEADER_H - TOOLBAR_H / 2, PANEL_W, TOOLBAR_H);
    setImg(toolbar, 'toolbar.png', [18, 2, 18, 2]);

    const cats: (ItemCategory | 'all')[] = ['all', 'seed', 'fruit', 'fert'];
    const catText = ['全部', '种子', '果实', '化肥'];
    let tx = -PANEL_W / 2 + 18 + 34;
    cats.forEach((cat, i) => {
      const n = imgButton(toolbar, tx, 0, 68, 36, 'tab_normal.png', 40,
        () => this.setCategory(cat), 0.95);
      const lb = label(n, catText[i], 14, C_TEXT, 0, 0, 68, 36);
      this.tabs.push({ node: n, lb, cat });
      tx += 68 + 8;
    });

    label(toolbar, '排序', 12, C_SORT_LB, 154, 0, 30, 20);
    const sortDefs: { key: 'time' | 'name'; text: string; x: number }[] = [
      { key: 'time', text: '时间', x: 200 },
      { key: 'name', text: '名称', x: 284 },
    ];
    for (const d of sortDefs) {
      const n = imgButton(toolbar, d.x, 0, 76, 32, 'sort_normal.png', 32,
        () => this.setSort(d.key), 0.95);
      const lb = label(n, d.text, 13, C_TEXT, 0, 0, 76, 32);
      this.sortBtns.push({ node: n, lb, key: d.key });
    }

    // —— scroll：6 列网格 ——
    const scroll = ui('scroll', this.panel, 0, -PANEL_H / 2 + FOOTER_H + SCROLL_H / 2, PANEL_W, SCROLL_H);
    addMaskRect(scroll, PANEL_W, SCROLL_H, 0);
    this.content = ui('content', scroll, 0, 0, GRID_W, SCROLL_H);
    const layout = this.content.addComponent(Layout);
    layout.type = Layout.Type.GRID;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    layout.startAxis = Layout.AxisDirection.HORIZONTAL;
    layout.constraint = Layout.Constraint.FIXED_COL;
    layout.constraintNum = COLS;
    layout.cellSize = new Size(CELL, CELL);
    layout.spacingX = GAP;
    layout.spacingY = GAP;
    this.scrollView = scroll.addComponent(ScrollView);
    this.scrollView.content = this.content;
    this.scrollView.vertical = true;
    this.scrollView.horizontal = false;
    this.scrollView.inertia = true;
    this.scrollView.brake = 0.75;
    this.scrollView.elastic = true;
    this.scrollView.bounceDuration = 0.4;

    // 空状态提示（网页：该分类下暂无物品）
    this.emptyNode = ui('empty', scroll, 0, 0, GRID_W, 200);
    label(this.emptyNode, '该分类下暂无物品', 14, C_EMPTY, 0, 0, GRID_W, 40);
    this.emptyNode.active = false;

    // —— footer ——
    const footer = ui('footer', this.panel, 0, -PANEL_H / 2 + FOOTER_H / 2, PANEL_W, FOOTER_H);
    setImg(footer, 'panel_footer.png', [22, 4, 22, 4]);
    this.footerLabel = label(footer, '', 13, C_TEXT, -170, 0, 340, 30, true);
    label(footer, '点格子看详情 · 点「卖💰」出售 · 可上下滑动', 13, C_HINT, 165, 0, 340, 30, false, true);

    this.refreshTab();
    this.refreshSort();
  }

  // ==================== 开关 ====================

  open() {
    this.isOpen = true;
    this.node.active = true;
    this.render();
    // 弹入动画（网页 pop + fade）
    const op = this.panel.getComponent(UIOpacity) || this.panel.addComponent(UIOpacity);
    op.opacity = 0;
    this.panel.setScale(0.9, 0.9, 1);
    tween(op).stop();
    tween(op).to(0.18, { opacity: 255 }).start();
    tween(this.panel).stop();
    tween(this.panel).to(0.22, { scale: new Vec3(1, 1, 1) }).start();
  }

  close() {
    this.isOpen = false;
    this.node.active = false;
  }

  // ==================== 渲染 ====================

  render() {
    this.content.removeAllChildren();
    const list = this.inventory.query({ category: this.category, sort: this.sortKey, dir: this.sortDir });
    if (list.length === 0) {
      this.emptyNode.active = true;
    } else {
      this.emptyNode.active = false;
      for (const it of list) {
        const cell = new Node('cell_' + it.id);
        cell.layer = this.node.layer;
        cell.addComponent(UITransform).setContentSize(CELL, CELL);
        const ci = cell.addComponent(CellItem);
        ci.init(it,
          (id) => this.sellItem(id),
          (st) => this.showDetail(st));
        this.content.addChild(cell);
      }
    }
    this.content.getComponent(Layout)?.updateLayout();
    this.footerLabel.string = `共 ${list.length} 件物品`;
    this.scrollView.scrollToTop(0);
  }

  // ==================== Tab / 排序 ====================

  private setCategory(c: ItemCategory | 'all') {
    this.category = c;
    this.refreshTab();
    this.render();
  }

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

  private refreshTab() {
    const idx = ['all', 'seed', 'fruit', 'fert'].indexOf(this.category);
    this.tabs.forEach((t, i) => {
      const active = i === idx;
      setImg(t.node, active ? 'tab_active.png' : 'tab_normal.png', 40);
      t.lb.color = active ? C_TEXT_D : C_TEXT;
      t.lb.isBold = active;
    });
  }

  private refreshSort() {
    this.sortBtns.forEach((b) => {
      const active = this.sortKey === b.key;
      setImg(b.node, active ? 'sort_active.png' : 'sort_normal.png', 32);
      const arrow = active ? (this.sortDir === 'desc' ? ' ↓' : ' ↑') : '';
      b.lb.string = (b.key === 'time' ? '时间' : '名称') + arrow;
      b.lb.color = active ? C_TITLE : C_TEXT;
      b.lb.isBold = active;
    });
  }

  // ==================== 交互 ====================

  private showDetail(st: InventoryStack) {
    this.onToast(`【${CATEGORY_LABEL[st.category]}】${st.name} × ${st.count} · 回收价 💰${st.value} · 获得于 ${timeAgo(st.acquired)}`, 2.5);
  }

  private sellItem(id: string) {
    const st = this.inventory.findByItemId(id);
    const name = st ? st.name : '';
    const gain = this.inventory.sellOne(id);
    if (gain <= 0) return;
    this.player.addGold(gain);
    this.onGoldChanged(this.player.gold);
    this.onToast(`+${gain} 💰 出售${name ? ' ' + name : ''}`);
    this.render();
    this.onChanged();
  }
}
