import { component, SocketIo, error, autoware, log } from "typespeed";
import UserService from "../service/user-service";

@component
export default class IoHandler {

  @autoware userService: UserService;

  @SocketIo.onConnected
  async connected(socket, next) {
    if(!socket.handshake && !socket.handshake.auth) {
      next("Not Auth!");return;
    }
    const authObj = socket.handshake.auth;
    const user = await this.userService.findUser(authObj.uid);
    if(!user){
      next("Not Valid User!");return;
    }
    const isValid = await this.userService.checkAccess(user.username, authObj.access);
    if(!isValid){
      next("Not Valid Access!");return;
    }
    await this.userService.setSocketIdForUid(user.uid, socket.id);
    // TODO:用户连上后，取消托管，如果有房间加回房间
  }

  @SocketIo.onDisconnect
  public async disconnet(socket, reason) {
    // 用户掉线删除socket id的对应关系，然后让程序自动托管
    await this.userService.delSocketIdForUid(socket.id);
  }

  @SocketIo.onError
  public error(socket, err) {
    error(err);
    setTimeout(() => socket.disconnect(true), 1000);
  }
}