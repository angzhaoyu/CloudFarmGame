// ============================================================
// 网络请求封装：自动适配两种环境
//   1) 微信小游戏：wx.request
//   2) 浏览器 / Cocos 预览：XMLHttpRequest
// 后端接口返回统一格式：{ success, message?, user?, regions? }
// ============================================================

export interface UserInfo {
    id?: number;            // 数据库 users 表主键，farm 场景按它拉取玩家数据
    username: string;
    region: string;
    coins: number;
    level: number;
    exp: number;
    diamonds: number;
    created_at?: string;
}

export interface ApiResult {
    success: boolean;
    message?: string;
    code?: string;
    user?: UserInfo;
    regions?: string[];
}

/** 登录态在 localStorage 中的键名（login 与 farm 场景共享，解决继承问题） */
export const LOGIN_UID_KEY = 'loggedInUserId';
export const LOGIN_NAME_KEY = 'loggedInUsername';

/** 服务器地址配置（从原 ServerConfig 合并，避免重复文件） */
export const SERVER = {
    /** 
     * ★★★ 必须写完整地址 ★★★
     * Cocos Creator 编辑器预览时请务必写成：
     *   baseUrl: 'http://127.0.0.1:8000'
     * 
     * 写成空字符串、'/' 或不带协议的地址会导致：
     *   fetch(...) 变成 "++/api/game/state?user_id=1++" → 400 错误
     */
    baseUrl: 'http://127.0.0.1:8000',
};

type Callback = (status: number, data: ApiResult | null) => void;

function parseData(raw: any): ApiResult | null {
    try {
        if (typeof raw === 'string') return JSON.parse(raw);
        if (raw && typeof raw === 'object') return raw;
    } catch (e) { /* 非 JSON */ }
    return null;
}

export function httpJson(url: string, method: 'GET' | 'POST', body: object | null, cb: Callback) {
    const wxGlobal = (globalThis as any).wx;

    // ---------- 微信小游戏环境 ----------
    if (wxGlobal && typeof wxGlobal.request === 'function') {
        wxGlobal.request({
            url: url,
            method: method,
            data: body || {},
            header: { 'Content-Type': 'application/json' },
            success: (res: any) => cb(res.statusCode || 0, parseData(res.data)),
            fail: (err: any) =>
                cb(-1, { success: false, message: '网络请求失败：' + ((err && err.errMsg) || '未知错误') }),
        });
        return;
    }

    // ---------- 浏览器 / Cocos 预览环境 ----------
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;
        cb(xhr.status, parseData(xhr.responseText));
    };
    xhr.onerror = () =>
        cb(-1, { success: false, message: '无法连接服务器，请确认后端已启动（http://127.0.0.1:8000）' });
    xhr.send(body ? JSON.stringify(body) : undefined);
}

export const Http = {
    get(url: string, cb: Callback) { httpJson(url, 'GET', null, cb); },
    post(url: string, body: object, cb: Callback) { httpJson(url, 'POST', body, cb); },
};

// ============================================================
// 农场游戏 API（从 farm/net/UserApi.ts 合并而来，减少重复网络文件）
// 复用 login/Net 的 Http / SERVER
// ============================================================

/** 拉取玩家状态后统一整理成这个结构喂给 GameRoot */
export interface RemoteUserState {
  username: string | null;
  gold: number;
  inventory: any[];  // InventoryStack[] ; 避免循环依赖，运行时为 farm/data/ItemData 中的
}

/** 游戏状态 API（与后端 /api/game/* 对接） */
export class UserApi {
  private _base: string;

  constructor(base?: string) {
    this._base = base || SERVER.baseUrl || 'http://127.0.0.1:8000';
  }

  /** 永远返回一个合法的完整 URL 前缀 */
  private _getSafeBase(): string {
    const raw = (this._base || (SERVER as any).baseUrl || 'http://127.0.0.1:8000') + '';
    let b = raw.trim().replace(/\/+$/, '');

    // 任何可疑值直接重置
    if (!b || b.length < 10 || b === '/' || b === 'http:' || b === 'https:' || !b.includes('.')) {
      b = 'http://127.0.0.1:8000';
    }
    if (!b.startsWith('http')) {
      b = 'http://' + b.replace(/^\/+/, '');
    }
    return b;
  }

  /** 终极防御：无论如何都返回一个合法的 http 地址 */
  private _normalizeBase(): string {
    let b = String(this._base || (SERVER as any).baseUrl || 'http://127.0.0.1:8000').trim();
    b = b.replace(/\/+$/g, '');
    if (!b || b.length < 7 || !b.includes('.')) {
      b = 'http://127.0.0.1:8000';
    }
    if (!/^https?:\/\//i.test(b)) {
      b = 'http://' + b.replace(/^\/+/, '');
    }
    return b;
  }


  /** 
   * 极度防御的 baseUrl 构造器
   * 专门修复 Cocos Creator 编辑器预览中出现的：
   *   GET ++/api/game/state?user_id=1++ -> 400
   */
  private getBaseUrl(): string {
    return this._normalizeBase();
  }

  private buildUrl(path: string): string {
    const base = this._getSafeBase();
    if (/^https?:\/\//i.test(path)) return path;

    const clean = path.startsWith('/') ? path : '/' + path;
    let url = base + clean;

    // 无论如何都不允许坏 URL
    if (!url.includes('://') || url.startsWith('/') || url.includes('++')) {
      console.error('[UserApi] 强制修正坏URL:', url);
      url = 'http://127.0.0.1:8000' + clean;
    }
    return url;
  }

  public setBaseUrl(url: string) { this._base = url; }

  private async getJSON<T>(path: string): Promise<T> {
    let url = this.buildUrl(path);

    // === 关键调试日志（在编辑器预览中能直接看到问题）===
    console.log('[UserApi] 真实请求URL:', url);

    // 终极保险：任何异常 URL 都强制使用安全默认
    if (!url || !url.includes('://') || url.includes('++') || url.startsWith('/') || url.length < 10) {
      const cleanPath = path.startsWith('/') ? path : '/' + path;
      url = 'http://127.0.0.1:8000' + cleanPath;
      console.error('[UserApi] 检测到异常URL，已强制修正为安全地址:', url);
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-cache' as any,
    });
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    return (await res.json()) as T;
  }

  async fetchState(id: string | number): Promise<RemoteUserState> {
    const urlPath = `/api/game/state?user_id=${encodeURIComponent(String(id))}`;
    const j = await this.getJSON<any>(urlPath);
    const d = (j && (j.data ?? j)) || {};
    const goldRaw = d.gold ?? d.coins ?? d.user?.gold ?? d.user?.coins;
    const rows: any[] = Array.isArray(d.inventory) ? d.inventory : [];
    const inventory = rows.map((row: any) => toStack(row)).filter((s: any): s is any => !!s && s.count > 0);
    return {
      username: d.username ?? d.user?.username ?? null,
      gold: typeof goldRaw === 'number' && isFinite(goldRaw) ? goldRaw : 500,
      inventory,
    };
  }

  async saveInventory(id: string | number, gold: number, inventory: any[]): Promise<void> {
    const url = this.buildUrl('/api/game/inventory');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id, gold, inventory: inventory.map(toRow) }),
    });
    if (!res.ok) throw new Error(`POST ${url} -> ${res.status}`);
  }

  async saveAndSync(id: string | number, gold: number, inventory: any[]): Promise<RemoteUserState> {
    await this.saveInventory(id, gold, inventory);
    return await this.fetchState(id);
  }
}

/** 数据库行 / 服务端对象 → InventoryStack 容错映射 */
function toStack(row: any): any | null {
  if (!row || typeof row !== 'object') return null;
  const id = String(row.item_id ?? row.id ?? '');
  if (!id) return null;
  const acquired = typeof row.acquired === 'number'
    ? row.acquired
    : (row.acquired_at ? (Date.parse(row.acquired_at) || Date.now()) : Date.now());
  return {
    id,
    name: row.item_name ?? row.name ?? id,
    icon: row.icon ?? '',
    category: row.category ?? 'fruit',
    value: row.value ?? 1,
    count: Math.max(0, Math.floor(Number(row.count) || 0)),
    acquired,
  };
}

/** 运行时 → 数据库行 */
function toRow(s: any) {
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
