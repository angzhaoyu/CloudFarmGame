/**
 * GameRoot.ts —— 顶层装配（模块：启动/依赖注入/场景 UI 构建）
 *
 * ★ 使用方式：把本组件挂到 farm 场景的 Canvas 节点上即可，
 *   UI 全部由代码 + resources/textures/ui 下的图片构建（对照 backpack_reference.html 1:1），
 *   无需在编辑器里手动搭 UI；图片素材也能直接拖进编辑器做自定义布局。
 *
 * 流程：
 *  1. 设置设计分辨率 1280x720（固定高度）。
 *  2. 构建场景：背景渐变天空 / 太阳 / 地面条纹 / 金币 HUD / 商店·背包按钮 / Toast / 两个面板。
 *  3. 读取登录态，注入数据模型与回调（金币刷新、飘字、持久化同步）。
 *  4. 面板互斥（打开背包自动关闭商店，反之亦然）。
 *  5. 初始化拉取后端状态，失败自动降级至本地初始数据。
 */
import { _decorator, Button, Color, Component, director, Label, Layers, Node, ResolutionPolicy, sys, UITransform, view } from 'cc';
import { InventoryModel } from './data/InventoryModel';
import { PlayerModel } from './data/PlayerModel';
import { INITIAL_GOLD, buildInitialInventory } from './config/ItemConfig';
import { BackpackPanel } from './ui/BackpackPanel';
import { ShopPanel } from './ui/ShopPanel';
import { Toast } from './ui/Toast';
import { UserApi, RemoteUserState } from '../login/Net';
import { LOGIN_UID_KEY, LOGIN_NAME_KEY } from '../login/Net';
import { addAnchor, addStretch, imgButton, label, setImg, ui } from './ui/Ui';

const { ccclass, property } = _decorator;

export const DESIGN_W = 1280;   // 设计宽度（横屏基准）
export const DESIGN_H = 720;    // 设计高度

const DEMO_USER_ID = 1;

const GOLD  = new Color(255, 233, 176, 255); // #ffe9b0
const WHITE = new Color(255, 255, 255, 255);
const MUTED = new Color(215, 199, 154, 255); // #d7c79a

@ccclass('GameRoot')
export class GameRoot extends Component {
  @property loginSceneName = 'login';

  private player    = new PlayerModel(INITIAL_GOLD);
  private inventory = new InventoryModel();
  private api       = new UserApi();
  private userId: string | number = DEMO_USER_ID;

  private goldLabel!: Label;
  private toast!: Toast;
  private backpack!: BackpackPanel;
  private shop!: ShopPanel;

  async onLoad() {
    // 与登录场景一致的适配策略（固定高度 720，宽度自适应）
    view.setDesignResolutionSize(DESIGN_W, DESIGN_H, ResolutionPolicy.FIXED_HEIGHT);

    /* 0) 读取登录态 */
    const savedId   = sys.localStorage.getItem(LOGIN_UID_KEY);
    const savedName = sys.localStorage.getItem(LOGIN_NAME_KEY);
    if (savedId) {
      const n = Number(savedId);
      this.userId = isNaN(n) ? savedId : n;
    } else {
      console.warn('[GameRoot] 未检测到登录信息，使用演示账号 id=' + DEMO_USER_ID);
    }
    if (savedName) this.player.username = savedName;

    /* 1) 构建场景 UI（背景/HUD/入口按钮/Toast/面板） */
    this.buildSceneUI();

    /* 2) 注入回调与持久化逻辑 */
    const onGold  = (g: number) => { this.goldLabel.string = '💰 ' + g; };
    const onToast = (m: string, d = 1.2) => this.toast.show(m, d);

    const persist = async () => {
      try {
        const latest: RemoteUserState = await this.api.saveAndSync(
          this.userId, this.player.gold, this.inventory.toJSON()
        );
        this.player.gold = latest.gold;
        if (latest.inventory && latest.inventory.length > 0) {
          this.inventory.loadJSON(latest.inventory);
        }
        onGold(this.player.gold);

        // 仅在面板已打开时才渲染，避免空操作报错
        if (this.backpack.isOpen) this.backpack.render();
        if (this.shop.isOpen)     this.shop.render();
      } catch (err) {
        console.warn('[GameRoot] 实时保存/同步失败，执行降级策略', err);
        // 降级：仅保存，不阻塞后续流程
        this.api.saveInventory(this.userId, this.player.gold, this.inventory.toJSON())
          .catch(() => {});
      }
    };

    this.backpack.onGoldChanged = onGold;
    this.backpack.onToast       = onToast;
    this.backpack.onChanged     = persist;
    this.shop.onGoldChanged     = onGold;
    this.shop.onToast           = onToast;
    this.shop.onChanged         = persist;

    /* 3) 从后端拉取状态 */
    try {
      const s = await this.api.fetchState(this.userId);
      this.player.bindUser(String(this.userId), s.username ?? savedName);
      this.player.gold = s.gold;
      if (s.inventory.length > 0) {
        this.inventory.loadJSON(s.inventory);
      } else {
        this.inventory.loadJSON(buildInitialInventory());
        persist();
      }
    } catch (e) {
      console.warn('[GameRoot] 后端不可用，使用本地初始背包', e);
      this.inventory.loadJSON(buildInitialInventory());
    }
    onGold(this.player.gold);
  }

  // ==================== 场景 UI 构建 ====================

  private buildSceneUI() {
    // —— 背景：网页 stage 的渐变天空→草地（铺满全屏）——
    const bg = ui('stage_bg', this.node, 0, 0, DESIGN_W, DESIGN_H);
    setImg(bg, 'stage_bg.png');
    addStretch(bg);

    // —— 太阳（左上角，同网页 46px/80px）——
    const sun = ui('sun', this.node, 0, 0, 90, 90);
    setImg(sun, 'sun.png');
    addAnchor(sun, { top: 46, left: 80 });

    // —— 地面装饰条纹（贴底、宽度铺满）——
    const strip = ui('ground_strip', this.node, 0, 0, DESIGN_W, 180);
    setImg(strip, 'ground_strip.png');
    addAnchor(strip, { left: 0, right: 0, bottom: 0 });

    // —— 金币 HUD（左上角，同网页 .gold-hud）——
    const hud = ui('gold_hud', this.node, 0, 0, 170, 42);
    setImg(hud, 'gold_hud.png', 42);
    addAnchor(hud, { top: 18, left: 18 });
    this.goldLabel = label(hud, '💰 ' + this.player.gold, 18, GOLD, 0, 0, 150, 40, false, false, true);

    // —— 商店按钮（左下角圆形，同网页 .shop-btn）——
    const shopBtn = imgButton(this.node, 0, 0, 92, 92, 'shop_btn.png', 92,
      () => this.openShop(), 0.92);
    addAnchor(shopBtn, { left: 36, bottom: 36 });
    label(shopBtn, '商店', 16, WHITE, 0, -16, 92, 20, false, false, true);

    // —— 背包按钮（右下角圆形，同网页 .open-btn）——
    const bpBtn = imgButton(this.node, 0, 0, 92, 92, 'open_btn.png', 92,
      () => this.openBackpack(), 0.92);
    addAnchor(bpBtn, { right: 36, bottom: 36 });
    label(bpBtn, '背包', 16, WHITE, 0, -16, 92, 20, false, false, true);

    // —— 退出登录（底部居中，保留原有功能）——
    const logout = label(this.node, '退出登录', 14, MUTED, 0, -330, 120, 30);
    const lb = logout.node.addComponent(Button);
    lb.transition = Button.Transition.NONE;
    logout.node.on(Button.EventType.CLICK, () => this.backToLogin());

    // —— 两个面板（先建节点再注入，最后挂到场景触发 onLoad）——
    this.backpack = this.createBackpack();
    this.shop = this.createShop();

    // —— Toast（顶部居中；最后创建 = 渲染在最上层，与网页 z-index:30 > overlay:10 一致）——
    const toastNode = ui('toast', this.node, 0, 0, 480, 44);
    addAnchor(toastNode, { top: 90, hCenter: true });
    this.toast = toastNode.addComponent(Toast);
  }

  private createBackpack(): BackpackPanel {
    const n = new Node('backpack_panel');
    n.layer = Layers.Enum.UI_2D;
    n.addComponent(UITransform).setContentSize(10, 10);
    const bp = n.addComponent(BackpackPanel);
    bp.inventory = this.inventory;
    bp.player = this.player;
    this.node.addChild(n);
    addStretch(n);
    return bp;
  }

  private createShop(): ShopPanel {
    const n = new Node('shop_panel');
    n.layer = Layers.Enum.UI_2D;
    n.addComponent(UITransform).setContentSize(10, 10);
    const sp = n.addComponent(ShopPanel);
    sp.inventory = this.inventory;
    sp.player = this.player;
    this.node.addChild(n);
    addStretch(n);
    return sp;
  }

  // ==================== 面板互斥 ====================

  private openBackpack() {
    if (this.shop.isOpen) this.shop.close();
    this.backpack.open();
  }

  private openShop() {
    if (this.backpack.isOpen) this.backpack.close();
    this.shop.open();
  }

  // ==================== 返回登录 ====================

  private backToLogin() {
    sys.localStorage.removeItem(LOGIN_UID_KEY);
    sys.localStorage.removeItem(LOGIN_NAME_KEY);
    director.loadScene(this.loginSceneName || 'login');
  }
}
