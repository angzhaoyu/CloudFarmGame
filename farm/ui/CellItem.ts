/**
 * ui/CellItem.ts —— 背包「格子」（对照网页 .cell 结构：名称/图标/数量/卖💰）
 * 由 BackpackPanel.render() 动态创建；init() 里完成全部构建。
 * 交互：点格子 → 详情；点「卖💰」→ 出售 1 个（不触发详情）。
 */
import { _decorator, Color, Component, EventTouch, Label, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import type { InventoryStack } from '../data/ItemData';
import { imgButton, label, setImg, ui } from './Ui';
const { ccclass } = _decorator;

const CELL = 97.33;
const C_NAME  = new Color(91, 68, 34, 255);   // #5b4422
const C_COUNT = new Color(58, 42, 18, 255);   // #3a2a12
const C_SELL  = new Color(138, 75, 19, 255);  // #8a4b13

@ccclass('CellItem')
export class CellItem extends Component {
  private data!: InventoryStack;
  private sellNode!: Node;

  init(data: InventoryStack, onSell: (id: string) => void, onDetail: (st: InventoryStack) => void) {
    this.data = data;
    const ut = this.getComponent(UITransform);
    if (ut) ut.setContentSize(CELL, CELL);

    // 格子底（与网页 .cell 同款）
    setImg(this.node, 'cell.png', 24);

    // 名称（顶部居中）
    label(this.node, data.name, 11, C_NAME, 0, 37, 90, 14);

    // 图标（居中）
    const icon = ui('icon', this.node, 0, 6, 40, 40);
    this.loadIcon(data.icon, icon);

    // 数量（左下角）
    label(this.node, 'x' + data.count, 13, C_COUNT, -31, -37, 40, 16, true, false, true);

    // 卖💰（右下角）
    this.sellNode = imgButton(this.node, 24, -37, 56, 22, 'sell_badge.png', 16,
      () => onSell(data.id), 0.95);
    label(this.sellNode, '卖💰' + data.value, 11, C_SELL, 0, 0, 56, 22, false, false, true);
    // 点击出售按钮时阻止冒泡，避免触发「点格子看详情」
    this.sellNode.on(Node.EventType.TOUCH_END, (e: EventTouch) => { e.propagationStopped = true; });

    // 点格子看详情（网页 alert 的 Cocos 替代：飘字展示）
    this.node.on(Node.EventType.TOUCH_END, () => onDetail(data));
  }

  /** 图标：约定放在 resources/textures/items/<icon>.png */
  private loadIcon(key: string, node: Node) {
    const sp = node.addComponent(Sprite);
    sp.sizeMode = Sprite.SizeMode.CUSTOM;
    resources.load(`textures/items/${key}`, SpriteFrame, (err, sf) => {
      if (!err && sf) sp.spriteFrame = sf;
    });
  }
}
