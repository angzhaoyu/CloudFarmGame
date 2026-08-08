/**
 * net/UserApi.ts —— 农场模块与后端通信的「网络层」（模块：网络，单一出入口）
 *
 * 所有和服务器打交道的代码只写在这里，与登录共用同一个后端：
 * baseUrl 直接复用 login/ServerConfig.ts 的 SERVER（改地址只需改一处）。
 *
 * 对齐的 Flask + MySQL 后端接口（见根目录《数据库使用说明.md》）：
 *   GET  /api/game/state?user_id=<id>  → 返回 { success, data: { username, gold/coins, inventory } }
 *   POST /api/game/inventory           → body { user_id, gold, inventory } 整包保存背包（顺带同步金币）
 *
 * 注意：Cocos Web 平台原生支持 fetch；微信小游戏没有 fetch，
 * 正式接微信时可把 fetch 换成 wx.request（login/Net.ts 里有现成的双端封装可参考），
 * 或引入 axios-miniprogram 等适配层，调用处无需改动。
 */
import { SERVER } from '../../login/ServerConfig';
import { INITIAL_GOLD, getItemDef } from '../config/ItemConfig';
import type { InventoryStack } from '../data/ItemData';

/** 拉取玩家状态后统一整理成这个结构喂给 GameRoot */
export interface RemoteUserState {
  username: string | null;
  gold: number;
  inventory: InventoryStack[];
}

export class UserApi {
  /** 默认与登录共用同一个服务器地址（login/ServerConfig.ts） */
  constructor(private base: string = SERVER.baseUrl) {}

  private async getJSON<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`);
    if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
    return (await res.json()) as T;
  }

  /** 拉取玩家状态（用户名 + 金币 + 背包） */
  async fetchState(id: string | number): Promise<RemoteUserState> {
    const j = await this.getJSON<any>(`/api/game/state?user_id=${encodeURIComponent(id)}`);
    const d = (j && (j.data ?? j)) || {};

    // 金币字段名容错：服务端可能叫 gold 或 coins（users 表为 coins）
    const goldRaw = d.gold ?? d.coins ?? d.user?.gold ?? d.user?.coins;

    const rows: any[] = Array.isArray(d.inventory) ? d.inventory : [];
    const inventory = rows.map(row => toStack(row)).filter((s): s is InventoryStack => !!s && s.count > 0);

    return {
      username: d.username ?? d.user?.username ?? null,
      gold: typeof goldRaw === 'number' && isFinite(goldRaw) ? goldRaw : INITIAL_GOLD,
      inventory,
    };
  }

  /**
   * 整包保存背包（购买 / 出售后立即调用）。
   * gold 一并上送，服务端可同步更新 users.coins；不处理可直接忽略。
   */
  async saveInventory(id: string | number, gold: number, inventory: InventoryStack[]): Promise<void> {
    const res = await fetch(`${this.base}/api/game/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: id,
        gold,
        inventory: inventory.map(toRow),
      }),
    });
    if (!res.ok) throw new Error(`POST /api/game/inventory -> ${res.status}`);
  }
}

/** 数据库行 / 服务端对象 → 运行时 InventoryStack（字段名做容错映射） */
function toStack(row: any): InventoryStack | null {
  if (!row || typeof row !== 'object') return null;
  const id = String(row.item_id ?? row.id ?? '');
  if (!id) return null;

  // 静态信息（名称/图标/回收价）允许服务端只存 item_id，其余用 ItemConfig 补齐
  const def = getItemDef(id);
  const acquired = typeof row.acquired === 'number'
    ? row.acquired
    : (row.acquired_at ? (Date.parse(row.acquired_at) || Date.now()) : Date.now());

  return {
    id,
    name: row.item_name ?? row.name ?? def?.name ?? id,
    icon: row.icon ?? def?.icon ?? '',
    category: row.category ?? def?.category ?? 'fruit',
    value: row.value ?? def?.value ?? 1,
    count: Math.max(0, Math.floor(Number(row.count) || 0)),
    acquired,
  };
}

/** 运行时 InventoryStack → 数据库行（对齐 player_inventory 表字段） */
function toRow(s: InventoryStack) {
  return {
    item_id: s.id,
    item_name: s.name,
    icon: s.icon,
    category: s.category,
    count: s.count,
    value: s.value,
    acquired_at: new Date(s.acquired).toISOString(),
  };
}
