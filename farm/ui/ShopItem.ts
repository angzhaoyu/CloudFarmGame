/**
 * ui/ShopItem.ts —— 商店「物品卡」（对照网页 .shop-item 结构：图标/名称/价格/回收/购买）
 * 由 ShopPanel.render() 动态创建；init() 里完成全部构建。
 * 买不起时：价格变红 + 购买按钮置灰禁用（与网页 .price.poor / button:disabled 一致）。
 */
import { _decorator, Button, Color, Component, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import type { ShopDef } from '../data/ItemData';
import { imgButton, label, setImg, ui } from './Ui';
const { ccclass } = _decorator;

const CELL = 97.33;
const C_NAME   = new Color(91, 68, 34, 255);   // #5b4422
const C_PRICE  = new Color(58, 42, 18, 255);   // #3a2a12
const C_POOR   = new Color(192, 57, 43, 255);  // #c0392b（买不起）
const C_RESALE = new Color(138, 122, 85, 255); // #8a7a55
const WHITE    = new Color(255, 255, 255, 255);

@ccclass('ShopItem')
export class ShopItem extends Component {
  init(def: ShopDef, canBuy: boolean, onBuy: (def: ShopDef) => void) {
    const ut = this.getComponent(UITransform);
    if (ut) ut.setContentSize(CELL, CELL);

    // 底（与背包格子同款）
    setImg(this.node, 'cell.png', 28);

    // 图标
    const icon = ui('icon', this.node, 0, 24, 26, 26);
    const sp = icon.addComponent(Sprite);
    sp.sizeMode = Sprite.SizeMode.CUSTOM;
    resources.load(`textures/items/${def.icon}`, SpriteFrame, (err, sf) => {
      if (!err && sf) sp.spriteFrame = sf;
    });

    // 名称 / 价格（买不起变红）/ 回收价
    label(this.node, def.name, 11, C_NAME, 0, 6, 90, 14);
    label(this.node, '💰 ' + def.price, 12, canBuy ? C_PRICE : C_POOR, 0, -7, 90, 16, false, false, true);
    label(this.node, '回收💰' + def.value, 9, C_RESALE, 0, -19, 90, 12);

    // 购买按钮（买不起禁用）
    const btn = imgButton(this.node, 0, -34, 72, 26,
      canBuy ? 'buy_normal.png' : 'buy_disabled.png', 28,
      () => onBuy(def), 0.95);
    if (!canBuy) btn.getComponent(Button)!.interactable = false;
    label(btn, '购买', 13, WHITE, 0, 0, 72, 26, false, false, true);
  }
}
