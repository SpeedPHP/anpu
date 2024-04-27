import Card from "../entity/card";
import { Role } from "../common/card-types";

export type EventWaitingStatus = {
  roomUsers: string[] // 等待中的用户名称列表
}

// 记录当前出牌人和出牌
export type SentCardsData = {
  uid: number // 出牌的用户
  cards: number[] // 出牌的牌
}

// 出牌的数据
export type SentEvent = {
  sentCards: number[], // 出牌
  pass: boolean, // 是否pass
}

export type EventRelogin = {}

export type EventPlayCard = {
  uid: number;
  username: string;
  myCards: number[]; // 我的手牌
  lastCards: number[]; // 最后的手牌
  active: boolean; // 是否可行动，准备出牌

  ready: Ready | {}, // 行动，准备决策的内容

  leftPlayer: Player; // 左边玩家
  rightPlayer: Player; // 右边玩家
  upperPlayer: Player; // 上方玩家
}

// 结束结算
export type EventGameOver = {
  continue: boolean, // 是否继续游戏，或者直接退出到准备阶段
  currentPlayer: Player; // 当前玩家
  
  leftPlayer: Player; // 左边玩家
  rightPlayer: Player; // 右边玩家
  upperPlayer: Player; // 上方玩家
}

export type Ready = {
  previousUid: number, // 上家玩家uid，为0则没有上家
  previousCard: number[], // 上家出牌
  availableCards: number[][], // 可用的牌组
  enablePass: boolean, // 是否可以过牌：开始时和傍风时不能pass
  isAllPassed: boolean, // 是否所有玩家都pass了，即傍风
}

export type Player = {
  uid: number,
  username: string,
  active?: boolean, // 是否在行动，准备出牌
  winRank?: number, // 第几名，默认0未赢
  winScore?: number, // 赢的分数
  isBigBoss?: boolean, // 是否是大地主
  isMiniBoss?: boolean, // 是否是小地主
  isAllPassed?: boolean, // 是否所有玩家都pass了，即傍风
  hasDiamondFour?: boolean, // 是否有散角4

  /** 以下是非显示的属性 */
  _leftPlayerUid?: number, // 上家玩家uid
  _rightPlayerUid?: number, // 下家玩家uid
  //_socketId?: string, // 玩家socketId
  _cards?: Card[], // 玩家手牌
  _auto?: boolean, // 是否托管
  _role?: Role, // 赢的角色
}

// 复制对象，但去除下划线的属性
export function deepHideCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof RegExp) return new RegExp(obj) as T;
  if (obj instanceof Map) {
    return new Map(Array.from(obj.entries()).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [deepHideCopy(k), deepHideCopy(v)])) as T;
  }
  // 处理普通对象和数组
  const clone: any = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && !key.startsWith('_')) {
      clone[key] = deepHideCopy(obj[key]);
    }
  }
  return clone;
}