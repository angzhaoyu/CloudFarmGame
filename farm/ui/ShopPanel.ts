/**
 * ui/ShopPanel.ts —— 商店面板（视图层 + 交互编排）
 * 与 BackpackPanel 同构；商品来自 ItemConfig.SHOP_ITEMS（仅种子+化肥）。
 */
import { _decorator, Component, Node, Prefab, Label, Sprite, Button, ScrollView, Layout, instantiate, Color } from 'cc';
import { InventoryModel } from '../data/InventoryModel';
import { PlayerModel } from '../data/PlayerModel';
import type { ShopDef, ItemCategory } from '../data/ItemData';
import { SHOP_ITEMS } from '../config/ItemConfig';
import { ShopItem } from './ShopItem';
const { ccclass, property } = _decorator;

const COLOR_NORMAL = new Color(243, 232, 207);
const COLOR_ACTIVE = new Color(217, 181, 106);

@ccclass('ShopPanel')
export class ShopPanel extends Component {
  @property(Node) panel: Node = null!;
  @property(ScrollView) scrollView: ScrollView = null!;
  @property(Node) content: Node = null!;
  @property(Prefab) shopItemPrefab: Prefab = null!;
  @property(Label) goldLabel: Label = null!;
  @property([Node]) tabNodes: Node[] = [];   // 顺序: 种子/化肥

  inventory!: InventoryModel;
  player!: PlayerModel;
  onGoldChanged: (gold: number) => void = () => {};
  onToast: (msg: string) => void = () => {};
  onChanged: () => void = () => {};

  private category: Extract<ItemCategory, 'seed' | 'fert'> = 'seed';

  onLoad() {
    this.panel.active = false;
    const cats: ('seed' | 'fert')[] = ['seed', 'fert'];
    this.tabNodes.forEach((n, i) => n.on(Button.EventType.CLICK, () => this.setCategory(cats[i])));
    this.refreshTab();
  }

  open() { this.panel.active = true; this.render(); }
  close() { this.panel.active = false; }

  private setCategory(c: 'seed' | 'fert') { this.category = c; this.refreshTab(); this.render(); }

  private refreshTab() {
    const idx = ['seed', 'fert'].indexOf(this.category);
    this.tabNodes.forEach((n, i) => {
      const sp = n.getComponent(Sprite);
      if (sp) sp.color = i === idx ? COLOR_ACTIVE : COLOR_NORMAL;
    });
  }

  render() {
    this.content.removeAllChildren();
    const list: ShopDef[] = SHOP_ITEMS.filter(s => s.category === this.category);
    for (const def of list) {
      const item = instantiate(this.shopItemPrefab);
      item.getComponent(ShopItem).init(def, (d) => this.buy(d));
      this.content.addChild(item);
    }
    this.content.getComponent(Layout)?.updateLayout();
    this.goldLabel.string = '💰 ' + this.player.gold;
  }

  private buy(def: ShopDef) {
    if (!this.player.spend(def.price)) { this.onToast('金币不足 💰'); return; }
    this.inventory.addItem(def, 1);
    this.onGoldChanged(this.player.gold);
    this.onToast(`-${def.price} 💰 购买 ${def.name}`);
    this.render();
    this.onChanged();
  }
}
