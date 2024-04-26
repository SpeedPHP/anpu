import { component, SocketIo, error, autoware, log } from "typespeed";
import UserService from "../service/user-service";
import RoomService from "../service/room-service";

@component
export default class IoHandler {

  @autoware userService: UserService;
  @autoware roomService: RoomService;

  @SocketIo.onConnected
  async connected(socket, next) {
    if (!socket.handshake && !socket.handshake.auth) {
      next("Not Auth!"); return;
    }
    const authObj = socket.handshake.auth;
    const user = await this.userService.findUser(authObj.uid);
    if (!user) {
      next("Not Valid User!"); return;
    }
    const isValid = await this.userService.checkAccess(user.username, authObj.access);
    if (!isValid) {
      next("Not Valid Access!"); return;
    }

    // 用户连上后，取消托管，如果有房间加回房间
    const roomId = await this.roomService.findMyRoomId(user.uid);
    if (roomId) {
      socket.join(roomId);
    }

    await this.userService.setSocketIdForUid(user.uid, socket.id);
  }

  @SocketIo.onDisconnect
  public async disconnet(socket, reason) {
    // 用户掉线删除socket id的对应关系，离开所有房间，然后让程序自动托管
    const roomId = await this.roomService.findMyRoomId(socket.handshake.auth.uid);
    if (roomId) {
      log("leave room by " + socket.handshake.auth.uid);
      socket.join(roomId);
    }
    await this.userService.delSocketIdForUid(socket.id);
  }

  @SocketIo.onError
  public error(socket, err) {
    error(err);
    setTimeout(() => socket.disconnect(true), 1000);
  }
}