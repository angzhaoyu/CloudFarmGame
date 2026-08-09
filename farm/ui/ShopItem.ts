/**
 * ui/ShopItem.ts —— 商店「物品卡」Prefab 脚本（对照网页结构）
 *
 * 网页中商店卡片结构（纵向排列）：
 *   .shop-item
 *     .icon    — emoji 图标（32px）
 *     .name    — 物品名（深色小字）
 *     .price   — "💰 {price}"（买不起时变红 .poor）
 *     .resale  — "回收💰{value}"（灰色小字）
 *     .buy-btn — "购买" 按钮（绿色，买不起时 disabled 灰色）
 *
 * Cocos 节点结构：
 *   ShopItem (挂载本脚本)
 *   ├── IconSprite   (Sprite: 物品图标)
 *   ├── NameLabel    (Label: 物品名)
 *   ├── PriceLabel   (Label: "💰 {price}")
 *   ├── ResaleLabel  (Label: "回收💰{value}")
 *   └── BuyBtn       (Button+Label: "购买")
 */
import { _decorator, Component, Label, Sprite, Button, SpriteFrame, resources, Color } from 'cc';
import type { ShopDef } from '../data/ItemData';
const { ccclass, property } = _decorator;

/** 价格正常色（网页 .price 默认：#3a2a12） */
const PRICE_NORMAL = new Color(58, 42, 18);
/** 价格买不起色（网页 .price.poor：#c0392b） */
const PRICE_POOR   = new Color(192, 57, 43);

@ccclass('ShopItem')
export class ShopItem extends Component {
  @property(Label)  nameLabel:   Label  = null!;
  @property(Sprite) iconSprite:  Sprite = null!;
  @property(Label)  priceLabel:  Label  = null!;   // "💰 {price}"
  @property(Label)  resaleLabel: Label  = null!;   // "回收💰{value}"
  @property(Button) buyBtn:      Button = null!;

  private data!: ShopDef;
  private onBuy?: (def: ShopDef) => void;

  /**
   * @param def   商品定义
   * @param onBuy 购买回调
   * @param gold  当前玩家金币（用于判断是否买得起 → 价格变红 / 按钮 disabled）
   */
  init(def: ShopDef, onBuy: (def: ShopDef) => void, gold?: number) {
    this.data = def;
    this.onBuy = onBuy;

    this.nameLabel.string  = def.name;
    this.priceLabel.string = '💰 ' + def.price;
    this.resaleLabel.string = '回收💰' + def.value;
    this.loadIcon(def.icon);

    // 买得起判断（网页 .price.poor + buy-btn:disabled）
    const canAfford = gold === undefined || gold >= def.price;
    this.priceLabel.color = canAfford ? PRICE_NORMAL : PRICE_POOR;
    this.buyBtn.interactable = canAfford;

    this.buyBtn.node.on(Button.EventType.CLICK, () => this.onBuy?.(def));
  }

  private loadIcon(key: string) {
    resources.load(`textures/items/${key}`, SpriteFrame, (err, sf: SpriteFrame) => {
      if (!err && sf) this.iconSprite.spriteFrame = sf;
    });
  }
}
