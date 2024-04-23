import { log, component, SocketIo, io, autoware, resource } from "typespeed";
import UserService from "../service/user-service";

@component
export default class EventHandler {

  static s2cReLogin = "s2cReLogin";
  static s2cWaitingStatus = "s2cWaitingStatus";
  static s2cStartGame = "s2cStartGame";
  static s2cPlayCard = "s2cPlayCard";
  static s2cGameOver = "s2cGameOver";

  @autoware
  userService: UserService;

  // 加入等候
  @SocketIo.onEvent("c2sJoinWaiting")
  public async join(socket) {
    // 获取当前用户uid
    const uid = await this.userService.getUid(socket.id);
    // 当前用户在房间吗？
    

    // socket.join("private-room");
    // io.to("private-room").emit("all", "");
  }

  // 出牌
  @SocketIo.onEvent("c2sPlayCard")
  public play(socket, message) {
    // socket.join("private-room");
    // io.to("private-room").emit("all", "");
  }
}