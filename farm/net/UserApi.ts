/**
 * net/UserApi.ts —— 与后端通信的「网络层」（模块：网络，单一出入口）
 *
 * 所有和服务器打交道的代码只写在这里。换域名/换协议(HTTP→WebSocket)只动本文件。
 * 注意：Cocos Web 平台原生支持 fetch；原生(iOS/Android)平台若不支持，
 * 可把 fetch 换成 cc 的 HttpClient 或 jsb 的 XMLHttpRequest，调用处无需改动。
 */
import type { InventoryStack } from '../data/ItemData';

export interface RemoteUser {
  gold: number;
  inventory: InventoryStack[];
  extra: any;
  username: string | null;
}

export class UserApi {
  constructor(private base = 'http://localhost:3000') {}

  private async getJSON<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`);
    if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
    return (await res.json()) as T;
  }

  /** 拉取用户（金币 + 背包 + 扩展信息） */
  async fetchUser(id: string | number): Promise<RemoteUser> {
    const j = await this.getJSON<{ data: RemoteUser }>(`/api/users/${id}`);
    return j.data;
  }

  /** 整包保存背包 */
  async saveInventory(id: string | number, inventory: InventoryStack[]): Promise<void> {
    await fetch(`${this.base}/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory }),
    });
  }

  /** 增减金币（delta 正负均可） */
  async changeGold(id: string | number, delta: number): Promise<number> {
    const res = await fetch(`${this.base}/api/users/${id}/gold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });
    const j = await res.json();
    return j.data.gold;
  }

  /** 拉取最新物品目录（商店/价值可后台热更） */
  async fetchItems() {
    return this.getJSON<{ data: any }>('/api/items');
  }
}
