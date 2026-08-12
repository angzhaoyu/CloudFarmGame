/**
 * ui/Toast.ts —— 飘字提示（顶部居中金色胶囊，样式与网页 toast 一致）
 * 节点由 GameRoot 创建（480×44），本组件负责补背景图 + 文字 + 淡出动画。
 */
import { _decorator, Color, Component, Label, tween, UIOpacity } from 'cc';
import { label, setImg } from './Ui';
const { ccclass } = _decorator;

const GOLD = new Color(255, 233, 176, 255); // #ffe9b0

@ccclass('Toast')
export class Toast extends Component {
  private lb!: Label;

  onLoad() {
    setImg(this.node, 'toast.png', 44);
    this.lb = label(this.node, '', 18, GOLD, 0, 0, 460, 40);
    this.node.active = false;
  }

  show(msg: string, duration = 1.2) {
    this.lb.string = msg;
    const op = this.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
    op.opacity = 255;
    this.node.active = true;
    tween(op).stop();
    tween(op).delay(duration).to(0.25, { opacity: 0 }).call(() => (this.node.active = false)).start();
  }
}
