import { log, component, SocketIo, io, autoware, error } from "typespeed";
import UserService from "../service/user-service";
import RoomService from "../service/room-service";
import { Player, SentCardsData, SentEvent, EventStartGame, Ready } from "../common/event-types";
import GameService from "../service/game-service";
import CardService from "../service/card-service";
import { NotActiveUserException, NotOwnCardsException } from "../common/exception";

@component
export default class EventHandler {

  static AUTO_PLAY_DELAY_SECOND = 5000; // 自动托管的出牌延迟毫秒
  static s2cReLogin = "s2cReLogin"; // 要求重新登录
  static s2cWaitingStatus = "s2cWaitingStatus"; // 等候状态
  static s2cStartGame = "s2cStartGame"; // 开始游戏，发送消息之前注意要updateRoom
  static s2cPlayCard = "s2cPlayCard"; // 决策出牌，发送消息之前注意要updateRoom
  static s2cGameOver = "s2cGameOver"; // 游戏结束

  @autoware userService: UserService;
  @autoware roomService: RoomService;
  @autoware gameService: GameService;
  @autoware cardService: CardService;

  // 加入等候
  @SocketIo.onEvent("c2sJoinWaiting")
  public async join(socket) {
    // 获取当前用户uid
    const uid = await this.userService.getUid(socket.id);
    // 当前用户在房间吗？
    let roomId = await this.roomService.findMyRoomId(uid);
    if (!roomId) {
      // 不在房间的话，创建用户并加入房间
      const userDto = await this.userService.findUser(uid);
      const newPlayer = this.gameService.createPlayer(uid, userDto.username, socket.id);
      roomId = await this.roomService.getWaitingRoomAndJoin(newPlayer);
    }
    socket.join(roomId);
    // 房间里的所有玩家读出来
    const players: Player[] = await this.roomService.getRoomPlayers(roomId);
    if (players.length != 4) {
      // 未满4人，发送消息等待
      io.to(roomId).emit(EventHandler.s2cWaitingStatus, players.map(p => p.username));
    } else {
      // 满员，开始游戏，落座
      const [storePlayers, respMsg] = this.gameService.gameStart(players);
      this.roomService.restartRoom(roomId);
      // 保存房间玩家
      this.roomService.updateRoomPlayers(roomId, storePlayers);
      // 通知出牌
      for (let msg of respMsg) {
        if (msg.active) { // 当前可以出牌人是散角4
          this.roomService.setNextActiveUid(roomId, msg.uid);
        }
        const socketId = await this.userService.getSocketId(msg.uid);
        if (socketId) {
          io.to(socketId).emit(EventHandler.s2cStartGame, msg);
        } else if (msg.active) {
          // 是当前准备出牌的玩家，并且socketId不见了，就要托管。
          this.autoPlay(msg.uid, msg.ready as Ready);
        }
      }
    }
  }

  // 出牌
  @SocketIo.onEvent("c2sPlayCard")
  public async userPlay(socket, message) {
    // 获取当前用户uid
    const opUid = await this.userService.getUid(socket.id);
    this.play(opUid, message as SentEvent);
  }

  // 托管，延时自动玩
  public async autoPlay(opUid: number, ready: Ready) {
    setTimeout(() => {
      this.play(opUid, {
        sentCards: ready.availableCards.length > 0 ? // 托管出牌策略：随机
          ready.availableCards[Math.floor(Math.random() * ready.availableCards.length)] : [],
        pass: ready.enablePass == true && ready.availableCards.length == 0,
      })
    }, EventHandler.AUTO_PLAY_DELAY_SECOND);
  }

  private async play(opUid: number, sentMsg: SentEvent) {
    const roomId = await this.roomService.findMyRoomId(opUid);
    // 检查当前用户是否可出牌者
    const validUid = await this.roomService.getNextActiveUid(roomId);
    if (validUid != opUid) {
      // 不是当前可出牌者，返回错误
      throw new NotActiveUserException(`${opUid} is not active user, ${sentMsg}`);
    }
    const players: Player[] = await this.roomService.getRoomPlayers(roomId);
    const nextPlayer = this.gameService.findNextNonWinPlayer(players, players.find((p) => p.uid == opUid));

    let storePlayers: Player[];
    let respMsg: EventStartGame[];
    let sentCardsData: SentCardsData = { uid: opUid, cards: sentMsg.sentCards }
    if (sentMsg.pass == true) { // 点 pass
      // 因为点pass了这次什么牌也不算
      sentCardsData = await this.roomService.getRoomLastData(roomId);
      // 检查是否 ALL PASS
      const isAllPassed = this.gameService.isAllPass(players, nextPlayer.uid, sentCardsData);
      // ALL PASS 就可以随便出
      if (isAllPassed) {
        [storePlayers, respMsg] = this.gameService.playAllPass(players, nextPlayer.uid, sentCardsData);
      } else {
        // 比较牌就是上家的，因为点pass了这次什么牌也不算
        [storePlayers, respMsg] = this.gameService.playCompare(players, nextPlayer.uid, sentCardsData);
      }
    } else {
      // 判定大小地主
      let [isBigBoss, isMiniBoss] = this.cardService.isBoss(sentMsg.sentCards);
      if(isBigBoss == true) players.find(p => p.uid == opUid).isBigBoss = true;
      if(isMiniBoss == true) players.find(p => p.uid == opUid).isMiniBoss = true;

      const isValid = this.gameService.checkAndDropCards(players.find(p => p.uid == opUid), sentMsg.sentCards);
      if(isValid == false) {
        throw new NotOwnCardsException("not valid cards");
      }
      // TODO 检查是否赢了
      // log(sentCardsData);
      // 比较牌是这次出的
      [storePlayers, respMsg] = this.gameService.playCompare(players, nextPlayer.uid, sentCardsData);
    }
    await this.roomService.setRoomLastData(roomId, sentCardsData); // 保存这次的出牌
    this.roomService.setNextActiveUid(roomId, nextPlayer.uid); // 下一个出牌
    this.roomService.updateRoomPlayers(roomId, storePlayers); // 保存房间玩家
    // 通知出牌
    for (let msg of respMsg) {
      const socketId = await this.userService.getSocketId(msg.uid);
      if (socketId) {
        io.to(socketId).emit(EventHandler.s2cPlayCard, msg);
      } else if (msg.active) {
        // 是当前准备出牌的玩家，并且socketId不见了，就要托管。
        this.autoPlay(msg.uid, msg.ready as Ready);
      }
    }
  }
}