/**
 * ui/Ui.ts —— UI 构建小工具（配合 resources/textures/ui 下的 HTML 同款图片）
 *
 * 约定：UI 图片放在 Cocos 项目的 assets/resources/textures/ui/ 下，
 * 与本仓库 farm/resources/textures/ui/ 一一对应（拷入项目时整体拷贝/合并该文件夹）。
 * slice = 九宫格边距（纹理像素）：传入后 Sprite 按九宫格拉伸，圆角与边框不变形。
 */
import { Button, Color, Graphics, Label, Layers, Mask, Node, resources, Sprite, SpriteFrame, UITransform, Widget } from 'cc';

/** UI 图片目录（相对 resources 包） */
export const UI_DIR = 'textures/ui';

/** 创建一个带 UITransform 的 UI 节点并挂到父节点 */
export function ui(name: string, parent: Node, x: number, y: number, w: number, h: number): Node {
    const n = new Node(name);
    n.layer = Layers.Enum.UI_2D;
    const ut = n.addComponent(UITransform);
    ut.setContentSize(w, h);
    parent.addChild(n);
    n.setPosition(x, y);
    return n;
}

/** 创建一个 Label（left / right 控制对齐，bold 加粗） */
export function label(parent: Node, text: string, size: number, color: Color,
                      x: number, y: number, w: number, h: number,
                      left = false, right = false, bold = false): Label {
    const n = ui('lb_' + text.replace(/\s/g, '').slice(0, 10), parent, x, y, w, h);
    const lb = n.addComponent(Label);
    lb.string = text;
    lb.fontSize = size;
    lb.lineHeight = Math.round(size * 1.25);
    lb.color = color;
    lb.isBold = bold;
    lb.horizontalAlign = right ? Label.HorizontalAlign.RIGHT
        : (left ? Label.HorizontalAlign.LEFT : Label.HorizontalAlign.CENTER);
    lb.verticalAlign = Label.VerticalAlign.CENTER;
    return lb;
}

/** 九宫格边距：一个数 = 四边相同；数组 = [左, 上, 右, 下]（纹理像素） */
export type Slice = number | [number, number, number, number];

/** 给节点设置一张 UI 图片（异步加载，加载完成后自动按节点尺寸显示） */
export function setImg(node: Node, name: string, slice?: Slice): void {
    const sp = node.getComponent(Sprite) || node.addComponent(Sprite);
    resources.load(`${UI_DIR}/${name}`, SpriteFrame, (err, sf) => {
        if (err || !sf) {
            console.warn(`[Ui] 图片加载失败：${UI_DIR}/${name}（请确认已拷入 assets/resources/textures/ui/）`, err);
            return;
        }
        if (slice !== undefined) {
            if (Array.isArray(slice)) {
                sf.insetLeft = slice[0];
                sf.insetTop = slice[1];
                sf.insetRight = slice[2];
                sf.insetBottom = slice[3];
            } else {
                sf.insetLeft = sf.insetTop = sf.insetRight = sf.insetBottom = slice;
            }
            sp.sizeMode = Sprite.SizeMode.CUSTOM;
            sp.type = Sprite.Type.SLICED;   // 九宫格拉伸
        } else {
            sp.sizeMode = Sprite.SizeMode.CUSTOM;
            sp.type = Sprite.Type.SIMPLE;
        }
        sp.spriteFrame = sf;
    });
}

/** 图片按钮（九宫格/普通背景 + 缩放点击反馈） */
export function imgButton(parent: Node, x: number, y: number, w: number, h: number,
                          img: string, slice: Slice | undefined, cb: () => void, zoom = 0.92): Node {
    const n = ui('btn_' + img.replace('.png', ''), parent, x, y, w, h);
    setImg(n, img, slice);
    const b = n.addComponent(Button);
    b.transition = Button.Transition.SCALE;
    b.zoomScale = zoom;
    n.on(Button.EventType.CLICK, cb);
    return n;
}

/** 给节点加矩形遮罩（ScrollView 内容裁剪用） */
export function addMaskRect(node: Node, w: number, h: number, radius = 0): void {
    const g = node.addComponent(Graphics);
    g.fillColor = new Color(255, 255, 255, 255);
    g.roundRect(-w / 2, -h / 2, w, h, radius);
    g.fill();
    const m = node.addComponent(Mask);
    m.type = Mask.Type.GRAPHICS_RECT;
}

/** 节点四边贴满父节点（全屏拉伸） */
export function addStretch(node: Node, margin = 0): void {
    const w = node.addComponent(Widget);
    w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
    w.top = w.bottom = w.left = w.right = margin;
}

/** 锚定到父节点的某条边/中心 */
export function addAnchor(node: Node, o: {
    top?: number; bottom?: number; left?: number; right?: number;
    hCenter?: boolean; vCenter?: boolean;
}): void {
    const w = node.addComponent(Widget);
    if (o.top !== undefined) { w.isAlignTop = true; w.top = o.top; }
    if (o.bottom !== undefined) { w.isAlignBottom = true; w.bottom = o.bottom; }
    if (o.left !== undefined) { w.isAlignLeft = true; w.left = o.left; }
    if (o.right !== undefined) { w.isAlignRight = true; w.right = o.right; }
    if (o.hCenter) w.isAlignHorizontalCenter = true;
    if (o.vCenter) w.isAlignVerticalCenter = true;
}

/** 相对时间文案（与网页一致：刚刚 / N小时前 / N天前） */
export function timeAgo(ts: number): string {
    const h = Math.floor((Date.now() - ts) / 3600000);
    if (h < 1) return '刚刚';
    if (h < 24) return h + '小时前';
    return Math.floor(h / 24) + '天前';
}
