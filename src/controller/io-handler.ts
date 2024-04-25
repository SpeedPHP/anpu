import { component, SocketIo, error, autoware, log } from "typespeed";
import UserService from "../service/user-service";

@component
export default class IoHandler {

  @autoware
  userService: UserService;

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
    // TODO:用户连上后，取消托管
  }

  @SocketIo.onDisconnect
  public disconnet(socket, reason) {
    // TODO: 用户掉线只能托管了
  }

  @SocketIo.onError
  public error(socket, err) {
    error(err);
    socket.emit("", err.name);
    //setTimeout(() => socket.disconnect(true), 1000);
  }
}