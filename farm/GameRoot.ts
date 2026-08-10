/**
 * GameRoot.ts —— 顶层装配（模块：启动/依赖注入）
 *
 * farm 场景入口。流程：
 *   login 场景登录成功 → localStorage('loggedInUserId') → director.loadScene('farm')
 *   → 本组件读取登录态，从 Flask + MySQL 后端拉取金币与背包，注入各 UI 模块。
 *
 * 这里是把所有「模块」拼起来的地方：
 *   - 数据模型：InventoryModel / PlayerModel（纯逻辑，不依赖引擎）
 *   - 配置：ItemConfig（物品/价值单一来源）
 *   - UI：BackpackPanel / ShopPanel / Toast
 *   - 网络：UserApi（已合并到 login/Net.ts，统一继承登录态 + SERVER + 实时API）
 *
 * 以后新增系统（如任务、成就），只需 new 一个模块、注入、挂按钮即可。
 */
import { _decorator, Component, Label, Button, sys, director } from 'cc';
import { InventoryModel } from './data/InventoryModel';
import { PlayerModel } from './data/PlayerModel';
import { INITIAL_GOLD, buildInitialInventory } from './config/ItemConfig';
import { BackpackPanel } from './ui/BackpackPanel';
import { ShopPanel } from './ui/ShopPanel';
import { Toast } from './ui/Toast';
import { UserApi, RemoteUserState } from '../login/Net';  // 统一从 login/Net 继承登录态、SERVER、UserApi（解决继承失败 + 减少重复文件）
import { LOGIN_UID_KEY, LOGIN_NAME_KEY } from '../login/Net';
const { ccclass, property } = _decorator;

/** 未检测到登录态时的演示账号（用于单独预览 farm 场景调试） */
const DEMO_USER_ID = 1;

@ccclass('GameRoot')
export class GameRoot extends Component {
  @property(BackpackPanel) backpack: BackpackPanel = null!;
  @property(ShopPanel) shop: ShopPanel = null!;
  @property(Toast) toast: Toast = null!;
  @property(Label) goldLabel: Label = null!;
  @property(Button) openBackpackBtn: Button = null!;
  @property(Button) openShopBtn: Button = null!;

  /** 可选：返回登录场景按钮（在编辑器里绑定才生效，不绑定自动忽略） */
  @property(Button) backLoginBtn: Button = null!;

  /** 返回登录按钮跳转的场景名（需加入构建场景列表） */
  @property
  loginSceneName = 'login';

  private player = new PlayerModel(INITIAL_GOLD);
  private inventory = new InventoryModel();
  private api = new UserApi();

  /** 当前玩家 id（数据库 users 表主键；未登录时为演示账号） */
  private userId: string | number = DEMO_USER_ID;

  async onLoad() {
    // —— 0) 读取登录态（login 场景登录成功时写入 localStorage） ——
    const savedId = sys.localStorage.getItem(LOGIN_UID_KEY);
    const savedName = sys.localStorage.getItem(LOGIN_NAME_KEY);
    if (savedId) {
      const n = Number(savedId);
      this.userId = isNaN(n) ? savedId : n;
    } else {
      console.warn('[GameRoot] 未检测到登录信息，使用演示账号 id=' + DEMO_USER_ID);
    }
    if (savedName) this.player.username = savedName;

    // 1) 注入数据模型到 UI
    this.backpack.inventory = this.inventory;
    this.backpack.player = this.player;
    this.shop.inventory = this.inventory;
    this.shop.player = this.player;

    // 2) 注入回调（金币刷新 / 飘字 / 持久化）
    const onGold = (g: number) => { this.goldLabel.string = '💰 ' + g; };
    const onToast = (m: string) => this.toast.show(m);

    /**
     * 实时验证+更新：每次操作后保存并立即从后端拉取最新权威数据
     * 解决“后台数据时时验证和更新”
     */
    const persist = async () => {
      try {
        const latest: RemoteUserState = await this.api.saveAndSync(
          this.userId,
          this.player.gold,
          this.inventory.toJSON()
        );
        // 用服务端返回的权威数据覆盖本地（时时验证）
        this.player.gold = latest.gold;
        if (latest.inventory && latest.inventory.length > 0) {
          this.inventory.loadJSON(latest.inventory);
        }
        onGold(this.player.gold);
        // 可选：重新渲染当前打开的面板（背包/商店）
        if (this.backpack && this.backpack.panel && this.backpack.panel.active) {
          this.backpack.render();
        }
        if (this.shop && this.shop.panel && this.shop.panel.active) {
          this.shop.render();
        }
      } catch (err) {
        console.warn('[GameRoot] 实时保存/同步失败（后端不可用？），仅本地保存', err);
        // 降级：仅保存不刷新
        this.api.saveInventory(this.userId, this.player.gold, this.inventory.toJSON())
          .catch(() => {});
      }
    };

    this.backpack.onGoldChanged = onGold;
    this.backpack.onToast = onToast;
    this.backpack.onChanged = persist;
    this.shop.onGoldChanged = onGold;
    this.shop.onToast = onToast;
    this.shop.onChanged = persist;

    // 3) 从 SQL 后端拉取玩家状态；失败则本地初始数据兜底
    try {
      const s = await this.api.fetchState(this.userId);
      this.player.bindUser(String(this.userId), s.username ?? savedName);
      this.player.gold = s.gold;
      if (s.inventory.length > 0) {
        this.inventory.loadJSON(s.inventory);
      } else {
        // 新用户库里还没有背包 → 发一套初始背包并立即落库
        this.inventory.loadJSON(buildInitialInventory());
        persist();  // async ok
      }
    } catch (e) {
      console.warn('[GameRoot] 后端不可用，使用本地初始背包', e);
      this.inventory.loadJSON(buildInitialInventory());
    }
    onGold(this.player.gold);

    // 4) HUD 按钮
    this.openBackpackBtn.node.on(Button.EventType.CLICK, () => this.backpack.open());
    this.openShopBtn.node.on(Button.EventType.CLICK, () => this.shop.open());
    if (this.backLoginBtn) {
      this.backLoginBtn.node.on(Button.EventType.CLICK, () => this.backToLogin());
    }
  }

  /** 退出登录：清除登录态并返回 login 场景 */
  private backToLogin() {
    sys.localStorage.removeItem(LOGIN_UID_KEY);
    sys.localStorage.removeItem(LOGIN_NAME_KEY);
    director.loadScene(this.loginSceneName || 'login');
  }
}
