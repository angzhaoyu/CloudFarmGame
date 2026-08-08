/**
 * ui/BackpackPanel.ts —— 背包面板（视图层 + 交互编排）
 *
 * 关键解耦：本类不持有任何「数据/经济规则」，
 * 规则都在注入进来的 InventoryModel / PlayerModel 里。
 * 这样以后改排序、改价值，都不用动 UI。
 */
import { _decorator, Component, Node, Prefab, Label, Sprite, Button, ScrollView, Layout, instantiate, Color } from 'cc';
import { InventoryModel } from '../data/InventoryModel';
import { PlayerModel } from '../data/PlayerModel';
import type { InventoryStack, ItemCategory } from '../data/ItemData';
import { CellItem } from './CellItem';
const { ccclass, property } = _decorator;

const COLOR_NORMAL = new Color(243, 232, 207);
const COLOR_ACTIVE = new Color(217, 181, 106);

@ccclass('BackpackPanel')
export class BackpackPanel extends Component {
  @property(Node) panel: Node = null!;
  @property(ScrollView) scrollView: ScrollView = null!;
  @property(Node) content: Node = null!;
  @property(Prefab) cellPrefab: Prefab = null!;
  @property(Label) footerLabel: Label = null!;
  @property(Label) goldLabel: Label = null!;
  @property([Node]) tabNodes: Node[] = [];      // 顺序: 全部/种子/果实/化肥
  @property([Node]) sortNodes: Node[] = [];      // 顺序: 时间/名称

  // —— 由 GameRoot 注入 ——
  inventory!: InventoryModel;
  player!: PlayerModel;
  onGoldChanged: (gold: number) => void = () => {};
  onToast: (msg: string) => void = () => {};
  onChanged: () => void = () => {};   // 数据变化后通知外层持久化

  private category: ItemCategory | 'all' = 'all';
  private sortKey: 'time' | 'name' = 'time';
  private sortDir: 'asc' | 'desc' = 'desc';

  onLoad() {
    this.panel.active = false;
    const cats: (ItemCategory | 'all')[] = ['all', 'seed', 'fruit', 'fert'];
    this.tabNodes.forEach((n, i) => n.on(Button.EventType.CLICK, () => this.setCategory(cats[i])));
    const keys: ('time' | 'name')[] = ['time', 'name'];
    this.sortNodes.forEach((n, i) => n.on(Button.EventType.CLICK, () => this.setSort(keys[i])));
    this.refreshTab();
    this.refreshSort();
  }

  open() { this.panel.active = true; this.render(); }
  close() { this.panel.active = false; }

  private setCategory(c: ItemCategory | 'all') { this.category = c; this.refreshTab(); this.render(); }

  private setSort(k: 'time' | 'name') {
    if (this.sortKey === k) this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc';
    else { this.sortKey = k; this.sortDir = 'desc'; }
    this.refreshSort();
    this.render();
  }

  private refreshTab() {
    const idx = ['all', 'seed', 'fruit', 'fert'].indexOf(this.category);
    this.tabNodes.forEach((n, i) => {
      const sp = n.getComponent(Sprite);
      if (sp) sp.color = i === idx ? COLOR_ACTIVE : COLOR_NORMAL;
    });
  }

  private refreshSort() {
    const labels = ['时间' + (this.sortKey === 'time' ? (this.sortDir === 'desc' ? ' ↓' : ' ↑') : ''),
                    '名称' + (this.sortKey === 'name' ? (this.sortDir === 'desc' ? ' ↓' : ' ↑') : '')];
    this.sortNodes.forEach((n, i) => {
      const lb = n.getComponentInChildren(Label);
      if (lb) lb.string = labels[i];
      const sp = n.getComponent(Sprite);
      if (sp) sp.color = (this.sortKey === (i === 0 ? 'time' : 'name')) ? COLOR_ACTIVE : COLOR_NORMAL;
    });
  }

  render() {
    this.content.removeAllChildren();
    const list: InventoryStack[] = this.inventory.query({ category: this.category, sort: this.sortKey, dir: this.sortDir });
    for (const it of list) {
      const cell = instantiate(this.cellPrefab);
      cell.getComponent(CellItem).init(it, (id) => this.sellItem(id));
      this.content.addChild(cell);
    }
    this.content.getComponent(Layout)?.updateLayout();
    this.footerLabel.string = `共 ${list.length} 件物品`;
    this.goldLabel.string = '💰 ' + this.player.gold;
  }

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
