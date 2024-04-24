import { log, component, SocketIo, io, autoware, resource } from "typespeed";
import UserService from "../service/user-service";
import RoomService from "../service/room-service";
import { Player } from "../common/event-types";
import GameService from "../service/game-service";
import CardService from "../service/card-service";

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
      this.gameService.gameStart(players);
      
      // 通知第一个人出牌

    }
  }

  // 出牌
  @SocketIo.onEvent("c2sPlayCard")
  public play(socket, message) {
    // 注意要重新取出房间内的玩家

  }
}