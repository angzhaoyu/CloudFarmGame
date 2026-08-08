/**
 * ui/Toast.ts —— 飘字提示（视图层）
 */
import { _decorator, Component, Label, tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Toast')
export class Toast extends Component {
  @property(Label) label: Label = null!;
  private timer: any = null;

  show(msg: string, duration = 1.2) {
    this.label.string = msg;
    const op = this.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
    op.opacity = 255;
    this.node.active = true;
    tween(op).delay(duration).to(0.25, { opacity: 0 }).call(() => (this.node.active = false)).start();
  }
}
