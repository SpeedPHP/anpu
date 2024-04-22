import { log, component, SocketIo, io, autoware, resource } from "typespeed";
import UserService from "../service/user-service.class";

@component
export default class SocketHandler {

  @resource()
  userService: UserService;

  @SocketIo.onConnected
  async connected(socket, next) {
    //const access = await this.userService.createAccess("zzz");
    //console.log(access)
    console.log(socket.handshake.auth);

  }
}