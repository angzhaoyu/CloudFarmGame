/**
 * PlayerModel.ts —— 玩家「模型层」（纯逻辑，不依赖引擎）
 * 目前管理金币 + 当前用户 id；以后可扩展等级、体力等。
 */
export class PlayerModel {
  gold: number;
  userId: string | null = null;
  username: string | null = null;

  constructor(initialGold = 500) {
    this.gold = initialGold;
  }

  /** 加金币（出售时） */
  addGold(amount: number): void {
    if (amount <= 0) return;
    this.gold += amount;
  }

  /** 花金币（购买时）。不够返回 false 且不扣。 */
  spend(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }

  bindUser(id: string, username: string | null): void {
    this.userId = id;
    this.username = username;
  }

  toJSON() {
    return { gold: this.gold, userId: this.userId, username: this.username };
  }
}
