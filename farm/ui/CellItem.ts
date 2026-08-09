/**
 * ui/CellItem.ts —— 背包「格子」Prefab 脚本（对照网页结构）
 *
 * 网页中 .cell 结构：
 *   .cell (正方形, 奶油色渐变背景, 金色边框, 圆角12)
 *     .name   — 物品名（绝对定位 top:5，居中，小字深色 #5b4422）
 *     .icon   — emoji 图标（居中，大字 36px）
 *     .foot   — 底部横排
 *       .count  — "x{count}"（左，粗体 #3a2a12）
 *       .sell   — "卖💰{value}" 按钮（右，金色半透明背景）
 *
 * Cocos 节点结构：
 *   CellItem (挂载本脚本)
 *   ├── NameLabel   (Label: 物品名，顶部居中)
 *   ├── IconSprite  (Sprite: 物品图标，居中)
 *   └── Foot (Node 或 Layout，底部横排)
 *       ├── CountLabel (Label: "x5")
 *       └── SellBtn    (Button+Label: "卖💰8")
 */
import { _decorator, Component, Label, Sprite, Button, SpriteFrame, resources } from 'cc';
import type { InventoryStack } from '../data/ItemData';
const { ccclass, property } = _decorator;

@ccclass('CellItem')
export class CellItem extends Component {
  @property(Label)  nameLabel:   Label  = null!;   // 物品名
  @property(Sprite) iconSprite:  Sprite = null!;   // 物品图标
  @property(Label)  countLabel:  Label  = null!;   // "x5"
  @property(Label)  valueLabel:  Label  = null!;   // sell 按钮上的文字 "卖💰8"
  @property(Button) sellBtn:     Button = null!;   // 出售按钮

  private data!: InventoryStack;
  private onSell?: (id: string) => void;

  init(data: InventoryStack, onSell: (id: string) => void) {
    this.data   = data;
    this.onSell = onSell;

    this.nameLabel.string  = data.name;
    this.countLabel.string = 'x' + data.count;
    this.valueLabel.string = '卖💰' + data.value;
    this.loadIcon(data.icon);

    this.sellBtn.node.on(Button.EventType.CLICK, () => this.onSell?.(data.id));
  }

  /** 图标：约定放在 resources/textures/items/<icon>.png */
  private loadIcon(key: string) {
    resources.load(`textures/items/${key}`, SpriteFrame, (err, sf: SpriteFrame) => {
      if (!err && sf) this.iconSprite.spriteFrame = sf;
    });
  }
}
