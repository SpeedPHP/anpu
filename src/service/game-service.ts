import { component, autoware, log } from "typespeed";
import { SentCardsData, Player, EventPlayCard, deepHideCopy, Ready } from "../common/event-types";
import Card from "../entity/card";
import UserService from "../service/user-service";
import RoomService from "../service/room-service";
import CardService from "../service/card-service";
import { NotValidCardsException } from "../common/exception";
import { Role } from "../common/card-types";

@component
export default class GameService {

  @autoware userService: UserService;
  @autoware roomService: RoomService;
  @autoware cardService: CardService;

  public gameStart(players: Player[]): [Player[], EventPlayCard[]] {
    // 落座
    this.playersSitDown(players);
    // 分牌，顺便看看谁是第一个
    const cards = this.cardService.newCards();
    for (let i = 0; i < 4; i++) {
      players[i]._cards = cards[i];
      players[i].cardCount = cards[i].length;
      // 隐藏看看是否是大小地主
      const [isBigBoss, isMiniBoss] = this.cardService.isBoss(CardService.cardToNum(cards[i]));
      if (isBigBoss && isMiniBoss) {
        players[i]._role = Role.DoubleBoss;
      } else if (isBigBoss) {
        players[i]._role = Role.BigBoss;
      } else if (isMiniBoss) {
        players[i]._role = Role.MiniBoss;
      } else {
        players[i]._role = Role.Poor;
      }
      if (this.cardService.hasFirstCard(cards[i])) { // 出牌人
        players[i].isAllPassed = true;
        players[i].active = true;
        players[i].hasDiamondFour = true;
      }
    }
    return [players, this.handlePlayers(players, [], innerCards => {
      return {
        previousUid: 0,
        previousCard: [],
        availableCards: this.cardService.availableCardsByFirst(innerCards),
        enablePass: false, // 是否可以过牌：开始时和傍风时不能pass
        isAllPassed: false, // 是否所有玩家都pass了，即傍风
      }
    })];
  }

  // 打完了牌，赢了
  // 看看赢了几个，如果都赢了就结算，返回true则游戏结束
  public checkWinOver(players: Player[], sentData: SentCardsData): boolean {
    // 检查当前用户是否赢了
    const currentPlayer = players.find(player => player.uid === sentData.uid);
    if (currentPlayer._cards.length === 0 || currentPlayer._cards.every(c => sentData.cards.includes(c.num))) { // 剩下的就是出的牌，或者没牌了，就赢了
      // 设置当前用户为赢
      currentPlayer.winRank = players.filter(p => p.winRank > 0).length + 1;
      const isDoubleBoss = players.some(p => p._role == Role.DoubleBoss);
      if (this.isOver(players, isDoubleBoss)) { // 完结了
        /**
         * 
1	  2	  3  	4
双	农	农	农
农	双	农	农
农	农	双	农
农	农	农	双

主	主	农	农
主	农	主	农
主	农	农	主

农	农	主	主
农	主	主	农
农	主	农	主
         */
        if(isDoubleBoss){ // 有双地，只要找双地在什么位置
          const doubleBossPlayer = players.find(p => p._role == Role.DoubleBoss);
          if(doubleBossPlayer.winRank == 1) {
            players.forEach(p => p.winScore = (p._role == Role.DoubleBoss) ? 6 : -2);
          } else if(doubleBossPlayer.winRank == 2) {
            players.forEach(p => p.winScore = (p._role == Role.DoubleBoss) ? 3 : -1);
          } else if(doubleBossPlayer.winRank == 3){
            players.forEach(p => p.winScore = (p._role == Role.DoubleBoss) ? -3 : 1);
          } else {
            players.forEach(p => p.winScore = (p._role == Role.DoubleBoss) ? -6 : 2);
          }
        } else {
          const firstPlayer = players.find(p => p.winRank == 1);
          const secondPlayer = players.find(p => p.winRank == 2);
          const thirdPlayer = players.find(p => p.winRank == 3);
          if(firstPlayer._role != Role.Poor) { 
            // 第一名是地主
            if(secondPlayer._role != Role.Poor) { // 主 主 农 农
              players.forEach(p => p.winScore = (p._role != Role.Poor) ? 2 : -2); // 主前农后
            } else {
              if(thirdPlayer._role != Role.Poor) { // 主 农 主 农
                players.forEach(p => p.winScore = (p._role != Role.Poor) ? 1 : -1);
              }else{ // 主 农 农 主
                players.forEach(p => p.winScore = (p._role != Role.Poor) ? 0 : 0);
              }
            }
          } else { 
            // 第一名是贫农
            if(secondPlayer._role == Role.Poor) { // 农 农 主 主
              players.forEach(p => p.winScore = (p._role != Role.Poor) ? -2 : 2); // 主前农后
            } else {
              if(thirdPlayer._role == Role.Poor) { // 农 主 农 主
                players.forEach(p => p.winScore = (p._role != Role.Poor) ? -1 : 1);
              } else { // 农 主 主 农
                players.forEach(p => p.winScore = (p._role != Role.Poor) ? 0 : 0);
              }
            }
          }
        }
        return true; // 结束，并计算完成
      } else {
        return false; // 有人结束，返回false
      }
    }
    return false; // 未打完手牌，返回false
  }

  // 判定两组是否有一组结束了
  private isOver(players: Player[], isDoubleBoss: boolean): boolean {
    const bossWinCount: number = players.filter(p => p._role != Role.Poor).filter(p => p.winRank > 0).length;
    const poorWinCount: number = players.filter(p => p._role == Role.Poor).filter(p => p.winRank > 0).length;
    if (isDoubleBoss) { // 双地的情况
      return bossWinCount == 1 || poorWinCount == 3;
    } else {
      return bossWinCount == 2 || poorWinCount == 2;
    }
  }

  // 看看是否傍风，或者全大
  public isAllPass(players: Player[], currentUid: number, sentData: SentCardsData): boolean {
    // 如果出牌人是我自己，则全大
    if (currentUid === sentData.uid) return true;
    const currentPlayer = players.find(player => player.uid === currentUid);
    const leftPlayer = players.find(player => player.uid === currentPlayer._leftPlayerUid);
    players.find(player => player.uid === currentPlayer._leftPlayerUid);
    if (leftPlayer.winRank > 0) { // 上家赢了
      if (leftPlayer.uid == sentData.uid) return true; // 如果牌也是上家出的，那就all pass
      const upperPlayer = players.find(player => player.uid === leftPlayer._leftPlayerUid);
      if (upperPlayer.winRank > 0 && upperPlayer.uid == sentData.uid) {
        // 上家赢了，再上家也赢了，再上家也是出牌人，那也是all pass
        return true;
      }
    }
    return false;
  }

  // 全大，随便出: active是我自己
  public playAllPass(players: Player[], currentUid: number, sentCardsData: SentCardsData): [Player[], EventPlayCard[]] {
    const currentPlayer = players.find(player => player.uid === currentUid);
    for (let i = 0; i < 4; i++) {
      if (players[i].uid == currentPlayer.uid) {
        players[i].active = true;
      } else {
        players[i].active = false;
      }
    }
    return [players, this.handlePlayers(players, sentCardsData.cards, innerCards => {
      return {
        previousUid: sentCardsData.uid,
        previousCard: sentCardsData.cards, // 上家出牌
        availableCards: this.cardService.availableCardsByPassAll(innerCards),
        enablePass: false, // 是否可以过牌：开始时和傍风时不能pass
        isAllPassed: true, // 是否所有玩家都pass了，即傍风
      }
    })];
  }

  // 检查牌和去掉牌
  public checkAndDropCards(player: Player, sentCardNums: number[]): boolean {
    const cardNums = CardService.cardToNum(player._cards);
    if (sentCardNums.every(n => cardNums.includes(n))) {
      player._cards = player._cards.filter(card => !sentCardNums.includes(card.num));
      return true;
    } else {
      false; // 牌不在，出错
    }
  }

  // 有比较牌，要比人家大: active是我自己
  public playCompare(players: Player[], currentUid: number, sentCardsData: SentCardsData): [Player[], EventPlayCard[]] {
    const [isValid, aCardKind, aCardCompare] = this.cardService.checkCard(CardService.numToCard(sentCardsData.cards));
    if (!isValid) {
      throw new NotValidCardsException(`${sentCardsData}`);
    }

    const currentPlayer = players.find(player => player.uid === currentUid);
    for (let i = 0; i < 4; i++) {
      players[i].active = players[i].uid == currentPlayer.uid;
    }
    return [players, this.handlePlayers(players, sentCardsData.cards, innerCards => {
      return {
        previousUid: sentCardsData.uid,
        previousCard: sentCardsData.cards, // 上家出牌
        availableCards: this.cardService.availableCardsByCompare(innerCards, aCardKind, aCardCompare), // 可用的牌组
        enablePass: true, // 是否可以过牌：开始时和傍风时不能pass
        isAllPassed: false, // 是否所有玩家都pass了，即傍风
      }
    })];
  }

  private handlePlayers(players: Player[], lastCards: number[], readyFunction: (c: Card[]) => Ready): EventPlayCard[] {
    const resultMsg: EventPlayCard[] = [];
    for (let player of players) {
      const event: EventPlayCard = {
        uid: player.uid,
        username: player.username,
        myCards: CardService.cardToNum(player._cards), // 我的手牌
        lastCards: lastCards,
        active: player.active, // 是否可行动，准备出牌
        ready: player.active ? readyFunction(player._cards) : {}, // 行动，准备决策的内容
        leftPlayer: deepHideCopy(players.find(p => p.uid === player._leftPlayerUid)), // 左边玩家
        rightPlayer: deepHideCopy(players.find(p => p.uid === player._rightPlayerUid)), // 右边玩家
        upperPlayer: deepHideCopy(players.find(p => p.uid !== player._rightPlayerUid  // 上方玩家
          && p.uid !== player._leftPlayerUid && p.uid !== player.uid
        ))
      }
      resultMsg.push(event);
    }
    return resultMsg;
  }

  // 安排座次，即设定上下位
  public playersSitDown(players: Player[]): Player[] {
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const nextIndex = (i + 1) % players.length;
      const prevIndex = (i - 1 + players.length) % players.length;
      player._leftPlayerUid = players[prevIndex].uid;
      player._rightPlayerUid = players[nextIndex].uid;
    }
    return players;
  }

  // 初始化一个玩家
  public createPlayer(uid: number, username: string, socketId: string): Player {
    return {
      uid: uid,
      username: username,

      cardCount: 0, // 剩余牌数
      active: false, // 是否在行动，准备出牌
      winRank: 0, // 第几名，默认0未赢
      isBigBoss: false, // 是否是大地主
      isMiniBoss: false, // 是否是小地主
      isAllPassed: false, // 是否所有玩家都pass了，即傍风
      hasDiamondFour: false,

      _leftPlayerUid: 0, // 上家玩家uid
      _rightPlayerUid: 0, // 下家玩家uid
      _cards: null, // 玩家手牌
      _auto: false, // 是否托管
    };
  }

  // 找到下一位且没赢的
  public findNextNonWinPlayer(players: Player[], currentPlayer: Player): Player {
    let nextUid = currentPlayer._rightPlayerUid;
    // 看看现在的下一位是哪位
    while (true) {
      let nextTmp = players.find(player => player.uid === nextUid);
      if (nextTmp.winRank != 0) { // 已经赢了
        nextUid = nextTmp._rightPlayerUid;
      } else {
        break;
      }
    }
    return players.find(player => player.uid === nextUid);
  }
}