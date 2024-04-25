import { log, component, SocketIo, io, error, resource } from "typespeed";
import UserService from "../service/user-service";

@component
export default class SocketHandler {

  @resource()
  userService: UserService;

  @SocketIo.onConnected
  async connected(socket, next) {
    const access = await this.userService.createAccess("zzz");
    console.log(access)
    console.log(socket.handshake.auth);
    socket.emit("all", "11");
    setTimeout(() => socket.disconnect(true), 5000);
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
  }
}