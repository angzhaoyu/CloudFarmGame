/**
 * ui/CellItem.ts —— 背包「格子」Prefab 脚本（视图层，最薄）
 * 只负责把一份 InventoryStack 显示出来 + 把出售事件抛给外部回调。
 */
import { _decorator, Component, Label, Sprite, Button, SpriteFrame, resources } from 'cc';
import type { InventoryStack } from '../data/ItemData';
const { ccclass, property } = _decorator;

@ccclass('CellItem')
export class CellItem extends Component {
  @property(Label) nameLabel: Label = null!;
  @property(Sprite) iconSprite: Sprite = null!;
  @property(Label) countLabel: Label = null!;
  @property(Label) valueLabel: Label = null!;   // 卖💰N
  @property(Button) sellBtn: Button = null!;

  private data!: InventoryStack;
  private onSell?: (id: string) => void;

  init(data: InventoryStack, onSell: (id: string) => void) {
    this.data = data;
    this.onSell = onSell;
    this.nameLabel.string = data.name;
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
