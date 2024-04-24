import { component, autoware, log } from "typespeed";
import { Player } from "../common/event-types";
import Card from "../entity/card";
import UserService from "../service/user-service";
import RoomService from "../service/room-service";
import CardService from "../service/card-service";

@component
export default class GameService {

  @autoware
  userService: UserService;

  @autoware
  roomService: RoomService;

  @autoware
  cardService: CardService;

  public gameStart(players: Player[]) {
    // 满员，开始游戏，落座
    this.playersSitDown(players);
    // 分牌，顺便看看谁是第一个
    const cards = this.cardService.newCards();
    for(let i = 0; i < 4; i++) {
      players[i]._cards = cards[i];
      players[i].cardCount = cards[i].length;
      if(this.cardService.hasFirstCard(cards[i])) { // 出牌人
        players[i].isAllPassed = true;
        players[i].active = true;
        players[i].hasDiamondFour = true;
      }
    }
  }

  // card play

  // 返回 socketid => 整个内容 的数组，方便循环发送消息

  

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
      _socketId: socketId, // 玩家socketId
      _cards: null, // 玩家手牌
      _auto: false, // 是否托管
    };
  }
  
}