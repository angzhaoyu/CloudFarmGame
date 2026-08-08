/**
 * ui/ShopItem.ts —— 商店「物品卡」Prefab 脚本（视图层，最薄）
 */
import { _decorator, Component, Label, Sprite, Button, SpriteFrame, resources } from 'cc';
import type { ShopDef } from '../data/ItemData';
const { ccclass, property } = _decorator;

@ccclass('ShopItem')
export class ShopItem extends Component {
  @property(Label) nameLabel: Label = null!;
  @property(Sprite) iconSprite: Sprite = null!;
  @property(Label) priceLabel: Label = null!;   // 💰 售价
  @property(Label) resaleLabel: Label = null!;  // 回收💰价值
  @property(Button) buyBtn: Button = null!;

  private data!: ShopDef;
  private onBuy?: (def: ShopDef) => void;

  init(def: ShopDef, onBuy: (def: ShopDef) => void) {
    this.data = def;
    this.onBuy = onBuy;
    this.nameLabel.string = def.name;
    this.priceLabel.string = '💰 ' + def.price;
    this.resaleLabel.string = '回收💰' + def.value;
    this.loadIcon(def.icon);
    this.buyBtn.node.on(Button.EventType.CLICK, () => this.onBuy?.(def));
  }

  private loadIcon(key: string) {
    resources.load(`textures/items/${key}`, SpriteFrame, (err, sf: SpriteFrame) => {
      if (!err && sf) this.iconSprite.spriteFrame = sf;
    });
  }
}
