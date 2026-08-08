/**
 * GameRoot.ts —— 顶层装配（模块：启动/依赖注入）
 *
 * 这里是把所有「模块」拼起来的地方：
 *   - 数据模型：InventoryModel / PlayerModel（纯逻辑，已单测）
 *   - 配置：ItemConfig（物品/价值单一来源）
 *   - UI：BackpackPanel / ShopPanel / Toast
 *   - 网络：UserApi（读写 SQL 后端）
 *
 * 以后新增系统（如任务、成就），只需 new 一个模块、注入、挂按钮即可。
 */
import { _decorator, Component, Label, Button } from 'cc';
import { InventoryModel } from './data/InventoryModel';
import { PlayerModel } from './data/PlayerModel';
import { INITIAL_GOLD, buildInitialInventory } from './config/ItemConfig';
import { BackpackPanel } from './ui/BackpackPanel';
import { ShopPanel } from './ui/ShopPanel';
import { Toast } from './ui/Toast';
import { UserApi } from './net/UserApi';
const { ccclass, property } = _decorator;

//const USER_ID = 1; // 演示用固定用户；真实项目从登录态获取

@ccclass('GameRoot')
export class GameRoot extends Component {
  @property(BackpackPanel) backpack: BackpackPanel = null!;
  @property(ShopPanel) shop: ShopPanel = null!;
  @property(Toast) toast: Toast = null!;
  @property(Label) goldLabel: Label = null!;
  @property(Button) openBackpackBtn: Button = null!;
  @property(Button) openShopBtn: Button = null!;

  private player = new PlayerModel(INITIAL_GOLD);
  private inventory = new InventoryModel();
  private api = new UserApi('http://localhost:3000');

  async onLoad() {
    // 【新增】从登录态获取真正的 USER_ID
    const savedUserId = sys.localStorage.getItem('loggedInUserId');
    if (savedUserId) {
        this.userId = savedUserId; // 提取登录存入的数据
    }

    // 1) 注入数据模型到 UI
    this.backpack.inventory = this.inventory;
    this.backpack.player = this.player;
    this.shop.inventory = this.inventory;
    this.shop.player = this.player;

    // 2) 注入回调（金币刷新 / 飘字 / 持久化）
    const onGold = (g: number) => { this.goldLabel.string = '💰 ' + g; };
    const onToast = (m: string) => this.toast.show(m);
    const persist = () => { this.api.saveInventory(USER_ID, this.inventory.toJSON()); };
    this.backpack.onGoldChanged = onGold;
    this.backpack.onToast = onToast;
    this.backpack.onChanged = persist;
    this.shop.onGoldChanged = onGold;
    this.shop.onToast = onToast;
    this.shop.onChanged = persist;

    // 3) 登录：从 SQL 后端拉取用户；失败则本地初始数据兜底
    try {
      const u = await this.api.fetchUser(USER_ID);
      this.player.bindUser(String(USER_ID), u.username);
      this.player.gold = u.gold;
      this.inventory.loadJSON(u.inventory);
    } catch (e) {
      console.warn('[GameRoot] 后端不可用，使用本地初始背包', e);
      this.inventory.loadJSON(buildInitialInventory());
    }
    onGold(this.player.gold);

    // 4) HUD 按钮
    this.openBackpackBtn.node.on(Button.EventType.CLICK, () => this.backpack.open());
    this.openShopBtn.node.on(Button.EventType.CLICK, () => this.shop.open());
  }
}
