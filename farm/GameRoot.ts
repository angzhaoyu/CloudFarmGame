/**
 * GameRoot.ts —— 顶层装配（模块：启动/依赖注入）
 *
 * 对照网页 backpack.html 的行为：
 *   - 背包和商店各自有全屏 Overlay 遮罩
 *   - 打开一个面板时，另一个自动关闭（互斥）
 *   - 点击遮罩空白处关闭面板
 *   - HUD：左上角金币、左下角商店按钮、右下角背包按钮
 */
import { _decorator, Component, Label, Button, sys, director } from 'cc';
import { InventoryModel } from './data/InventoryModel';
import { PlayerModel } from './data/PlayerModel';
import { INITIAL_GOLD, buildInitialInventory } from './config/ItemConfig';
import { BackpackPanel } from './ui/BackpackPanel';
import { ShopPanel } from './ui/ShopPanel';
import { Toast } from './ui/Toast';
import { UserApi, RemoteUserState } from '../login/Net';
import { LOGIN_UID_KEY, LOGIN_NAME_KEY } from '../login/Net';
const { ccclass, property } = _decorator;

const DEMO_USER_ID = 1;

@ccclass('GameRoot')
export class GameRoot extends Component {
  @property(BackpackPanel) backpack: BackpackPanel = null!;
  @property(ShopPanel)     shop:     ShopPanel     = null!;
  @property(Toast)         toast:    Toast         = null!;
  @property(Label)         goldLabel: Label        = null!;   // HUD 左上角金币
  @property(Button)        openBackpackBtn: Button = null!;   // HUD 右下角背包按钮
  @property(Button)        openShopBtn:     Button = null!;   // HUD 左下角商店按钮

  @property(Button)        backLoginBtn: Button    = null!;
  @property                loginSceneName           = 'login';

  private player    = new PlayerModel(INITIAL_GOLD);
  private inventory = new InventoryModel();
  private api       = new UserApi();
  private userId: string | number = DEMO_USER_ID;

  async onLoad() {
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

    /* 1) 注入数据模型 */
    this.backpack.inventory = this.inventory;
    this.backpack.player    = this.player;
    this.shop.inventory     = this.inventory;
    this.shop.player        = this.player;

    /* 2) 注入回调 */
    const onGold  = (g: number) => { this.goldLabel.string = '💰 ' + g; };
    const onToast = (m: string) => this.toast.show(m);

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
        if (this.backpack.isOpen) this.backpack.render();
        if (this.shop.isOpen)     this.shop.render();
      } catch (err) {
        console.warn('[GameRoot] 实时保存/同步失败', err);
        this.api.saveInventory(this.userId, this.player.gold, this.inventory.toJSON()).catch(() => {});
      }
    };

    this.backpack.onGoldChanged = onGold;
    this.backpack.onToast       = onToast;
    this.backpack.onChanged     = persist;
    this.shop.onGoldChanged     = onGold;
    this.shop.onToast           = onToast;
    this.shop.onChanged         = persist;

    /* ★★★ 3) 面板互斥：打开一个 → 自动关闭另一个 ★★★ */
    this.backpack.onRequestOpen = () => {
      if (this.shop.isOpen) this.shop.close();
    };
    this.shop.onRequestOpen = () => {
      if (this.backpack.isOpen) this.backpack.close();
    };

    /* 4) 从后端拉取数据 */
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

    /* 5) HUD 按钮 */
    this.openBackpackBtn.node.on(Button.EventType.CLICK, () => this.backpack.open());
    this.openShopBtn.node.on(Button.EventType.CLICK, () => this.shop.open());
    if (this.backLoginBtn) {
      this.backLoginBtn.node.on(Button.EventType.CLICK, () => this.backToLogin());
    }
  }

  private backToLogin() {
    sys.localStorage.removeItem(LOGIN_UID_KEY);
    sys.localStorage.removeItem(LOGIN_NAME_KEY);
    director.loadScene(this.loginSceneName || 'login');
  }
}
