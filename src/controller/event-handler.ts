import { log, component, SocketIo, io, autoware, error } from "typespeed";
import UserService from "../service/user-service";
import RoomService from "../service/room-service";
import { Player, SentCardsData, SentEvent, EventStartGame } from "../common/event-types";
import GameService from "../service/game-service";
import CardService from "../service/card-service";
import { NotActiveUserException } from "../common/exception";

@component
export default class EventHandler {

  static s2cReLogin = "s2cReLogin"; // 要求重新登录
  static s2cWaitingStatus = "s2cWaitingStatus"; // 等候状态
  static s2cStartGame = "s2cStartGame"; // 开始游戏，发送消息之前注意要updateRoom
  static s2cPlayCard = "s2cPlayCard"; // 决策出牌，发送消息之前注意要updateRoom
  static s2cGameOver = "s2cGameOver"; // 游戏结束

  @autoware
  userService: UserService;

  @autoware
  roomService: RoomService;

  @autoware
  gameService: GameService;

  @autoware
  cardService: CardService;

  // 加入等候
  @SocketIo.onEvent("c2sJoinWaiting")
  public async join(socket) {
    // 获取当前用户uid
    const uid = await this.userService.getUid(socket.id);
    // 当前用户在房间吗？
    let roomId = await this.roomService.findMyRoomId(uid);
    if(!roomId) {
      // 不在房间的话，创建用户并加入房间
      const userDto = await this.userService.findUser(uid);
      const player = this.gameService.createPlayer(uid, userDto.username, socket.id);
      roomId = await this.roomService.getWaitingRoomAndJoin(player);
      socket.join(roomId);
    }
    // 房间里的所有玩家读出来
    const players: Player[] = await this.roomService.getRoomPlayers(roomId);
    if(players.length != 4){
      // 未满4人，发送消息等待
      io.to(roomId).emit(EventHandler.s2cWaitingStatus, players.map(p => p.username));
    } else {
      // 满员，开始游戏，落座
      const [storePlayers, respMap] = this.gameService.gameStart(players);
      // 通知出牌
      for(let [socketId, msg] of respMap.entries()) {
        if(msg.active) { // 当前可以出牌人是散角4
          this.roomService.setNextActiveUid(roomId, msg.uid);
        }
        io.to(socketId).emit(EventHandler.s2cPlayCard, msg);
      }
      // 保存房间玩家
      this.roomService.updateRoomPlayers(roomId, storePlayers);
    }
  }

  // 出牌
  @SocketIo.onEvent("c2sPlayCard")
  public async play(socket, message) {
    let storePlayers: Player[] = null;
    let respMap: Map<string, EventStartGame> = null;
    // 获取当前用户uid
    const opUid = await this.userService.getUid(socket.id);
    const roomId = await this.roomService.findMyRoomId(opUid);
    // 检查当前用户是否可出牌者
    const validUid = await this.roomService.getNextActiveUid(roomId);
    if(validUid != opUid) {
      // 不是当前可出牌者，返回错误
      throw new NotActiveUserException(`${opUid} is not active user, {$player}, {$message}`);
    }

    const sentMsg = <SentEvent>JSON.parse(message);
    const players: Player[] = await this.roomService.getRoomPlayers(roomId);
    const nextPlayer = this.gameService.findNextNonWinPlayer(players, players.find((p) => p.uid == opUid));

    let sentCardsData: SentCardsData = {uid: opUid, cards: sentMsg.sentCards}
    if(sentMsg.pass == true) { // 点 pass
      // 因为点pass了这次什么牌也不算
      sentCardsData = await this.roomService.getRoomLastData(roomId);
      // 检查是否 ALL PASS
      const isAllPassed = this.gameService.isAllPass(players, nextPlayer.uid, sentCardsData);
      // ALL PASS 就可以随便出
      if(isAllPassed) {
        [storePlayers, respMap] = this.gameService.playAllPass(players, nextPlayer.uid, sentCardsData);
      } else{
        // 比较牌就是上家的，因为点pass了这次什么牌也不算
        [storePlayers, respMap] = this.gameService.playCompare(players, nextPlayer.uid, sentCardsData);
      }
    } else {
      // 比较牌是这次出的
      [storePlayers, respMap] = this.gameService.playCompare(players, nextPlayer.uid, sentCardsData);
    }

    await this.roomService.setRoomLastData(roomId, sentCardsData); // 保存这次的出牌
    this.roomService.setNextActiveUid(roomId, nextPlayer.uid); // 下一个出牌
    this.roomService.updateRoomPlayers(roomId, storePlayers); // 保存房间玩家
    // 通知出牌
    for(let [socketId, msg] of respMap.entries()) {
      io.to(socketId).emit(EventHandler.s2cPlayCard, msg);
    }
  }
}