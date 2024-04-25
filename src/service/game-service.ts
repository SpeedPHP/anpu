import { component, autoware, log } from "typespeed";
import { SentCardsData, Player, EventStartGame, deepHideCopy, Ready } from "../common/event-types";
import Card from "../entity/card";
import UserService from "../service/user-service";
import RoomService from "../service/room-service";
import CardService from "../service/card-service";
import { NotValidCardsException, NotOwnCardsException } from "../common/exception";

@component
export default class GameService {

  @autoware
  userService: UserService;

  @autoware
  roomService: RoomService;

  @autoware
  cardService: CardService;

  public gameStart(players: Player[]): [Player[], Map<string, EventStartGame>] {
    let resultMap = new Map<string, EventStartGame>(); // socketid => event
    // 落座
    this.playersSitDown(players);
    // 分牌，顺便看看谁是第一个
    const cards = this.cardService.newCards();
    for (let i = 0; i < 4; i++) {
      players[i]._cards = cards[i];
      players[i].cardCount = cards[i].length;
      if (this.cardService.hasFirstCard(cards[i])) { // 出牌人
        players[i].isAllPassed = true;
        players[i].active = true;
        players[i].hasDiamondFour = true;
      }
    }
    resultMap = this.handlePlayers(players, innerCards => {
      return {
        previousUid: 0,
        previousCard: [],
        availableCards: this.cardService.availableCardsByFirst(innerCards),
        enablePass: false, // 是否可以过牌：开始时和傍风时不能pass
        isAllPassed: false, // 是否所有玩家都pass了，即傍风
      }
    });
    return [players, resultMap]; // 返回 socketid => 整个内容 的数组，方便循环发送消息
  }

  // 打完了牌，赢了
  // 看看赢了几个，如果都赢了就结算
  public emptyWin() { }

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
  public playAllPass(players: Player[], currentUid: number, sentCardsData: SentCardsData): [Player[], Map<string, EventStartGame>] {
    let resultMap = new Map<string, EventStartGame>(); // socketid => event
    const currentPlayer = players.find(player => player.uid === currentUid);
    for (let i = 0; i < 4; i++) {
      if (players[i].uid == currentPlayer.uid) {
        players[i].active = true;
      } else {
        players[i].active = false;
      }
    }
    resultMap = this.handlePlayers(players, innerCards => {
      return {
        previousUid: sentCardsData.uid,
        previousCard: sentCardsData.cards, // 上家出牌
        availableCards: this.cardService.availableCardsByPassAll(innerCards),
        enablePass: false, // 是否可以过牌：开始时和傍风时不能pass
        isAllPassed: true, // 是否所有玩家都pass了，即傍风
      }
    });
    return [players, resultMap]; // 返回 socketid => 整个内容 的数组，方便循环发送消息
  }

  // 有比较牌，要比人家大: active是我自己
  public playCompare(players: Player[], currentUid: number, sentCardsData: SentCardsData): [Player[], Map<string, EventStartGame>] {
    // 先检查出牌对不对
    const sentCardPlayer = players.find(p => p.uid === sentCardsData.uid);
    if (!this.cardService.checkOwn(sentCardPlayer._cards, CardService.numToCard(sentCardsData.cards))) {
      throw new NotOwnCardsException(`${sentCardsData}`);
    }
    const [isValid, aCardKind, aCardCompare] = this.cardService.checkCard(CardService.numToCard(sentCardsData.cards));
    if (!isValid) {
      throw new NotValidCardsException(`${sentCardsData}`);
    }

    let resultMap = new Map<string, EventStartGame>(); // socketid => event
    const currentPlayer = players.find(player => player.uid === currentUid);
    for (let i = 0; i < 4; i++) {
      if (players[i].uid == currentPlayer.uid) {
        players[i].active = true;
      } else {
        players[i].active = false;
      }
      if (players[i].uid == sentCardsData.uid) { // 出牌家也要把牌减了
        players[i]._cards = players[i]._cards.filter(c => !sentCardsData.cards.includes(c.num));
      }
    }
    resultMap = this.handlePlayers(players, innerCards => {
      return {
        previousUid: sentCardsData.uid,
        previousCard: sentCardsData.cards, // 上家出牌
        availableCards: this.cardService.availableCardsByCompare(innerCards, aCardKind, aCardCompare), // 可用的牌组
        enablePass: true, // 是否可以过牌：开始时和傍风时不能pass
        isAllPassed: false, // 是否所有玩家都pass了，即傍风
      }
    });
    return [players, resultMap]; // 返回 socketid => 整个内容 的数组，方便循环发送消息
  }

  private handlePlayers(players: Player[], readyFunction: (c: Card[]) => Ready): Map<string, EventStartGame> {
    const resultMap = new Map<string, EventStartGame>();
    for (let player of players) {
      const event: EventStartGame = {
        uid: player.uid,
        username: player.username,
        myCards: CardService.cardToNum(player._cards), // 我的手牌
        active: player.active, // 是否可行动，准备出牌
        ready: player.active ? readyFunction(player._cards) : {}, // 行动，准备决策的内容
        leftPlayer: deepHideCopy(players.find(p => p.uid === player._leftPlayerUid)), // 左边玩家
        rightPlayer: deepHideCopy(players.find(p => p.uid === player._rightPlayerUid)), // 右边玩家
        upperPlayer: deepHideCopy(players.find(p => p.uid !== player._rightPlayerUid  // 上方玩家
          && p.uid !== player._leftPlayerUid && p.uid !== player.uid
        ))
      }
      resultMap.set(player._socketId, event);
    }
    return resultMap;
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
      _socketId: socketId, // 玩家socketId
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