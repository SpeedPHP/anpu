
export type EventWaitingStatus = {
  roomUserCount:number // 一起等候人数
}

export type EventRelogin = {}

export type EventStartGame = {
  uid:number,
  username:string,
  myCards:number[], // 我的手牌
  active:boolean, // 是否可行动，准备出牌
  
  ready: Ready, // 行动，准备决策的内容
  
  leftPlayer: Player, // 左边玩家
  rightPlayer: Player, // 右边玩家
  upperPlayer: Player // 上方玩家
}

export type EventPlayCard = {
  uid:number;
  username:string;
  myCards:number[]; // 我的手牌
  active:boolean; // 是否可行动，准备出牌

  ready: Ready; // 行动，准备决策的内容

  leftPlayer: Player; // 左边玩家
  rightPlayer: Player; // 右边玩家
  upperPlayer: Player; // 上方玩家
}
// 结束结算
export type EventGameOver = {
  myCards:number[], // 我的手牌
  myWinRank:number, // 我的排名
  isBigBoss: boolean, // 是否是大地主
  isMiniBoss: boolean, // 是否是小地主
}

export type Ready = {
  previousCard: number[], // 上家出牌
  availableCards: number[][], // 可用的牌组
  enablePass: boolean, // 是否可以过牌：开始时和傍风时不能pass
  isAllPassed: boolean, // 是否所有玩家都pass了，即傍风
}

export type Player = {
  uid:number,
  username:string,
  cardCount: number, // 剩余牌数
  active: boolean, // 是否在行动，准备出牌
  winRank: number, // 第几名，默认0未赢
  isBigBoss: boolean, // 是否是大地主
  isMiniBoss: boolean, // 是否是小地主
  isPrevious: boolean, // 是否是上家
  isAllPassed: boolean, // 是否所有玩家都pass了，即傍风

      /** 以下是非显示的属性 */
  leftPlayerUid: number, // 上家玩家uid
  rightPlayerUid: number, // 下家玩家uid
}