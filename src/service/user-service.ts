import UserDto from "../entity/user-dto";
import GameLogDto from "../entity/game-log-dto";
import PlayLogDto from "../entity/play-log-dto";
import { component, Redis, autoware, select, resultType, value, param, insert } from "typespeed";
import { Md5 } from 'ts-md5';


@component
export default class UserService {

  @value("secret")
  private secret: string;

  @autoware
  private redisObj: Redis;

  static USER_TOKEN = "user:token:";
  static USER_SOCKET_TO_USER = "user:online:socket:";
  static USER_USER_TO_SOCKET = "user:online:uid:";

  public async getSocketId(uid: number): Promise<string> {
    return await this.redisObj.get(UserService.USER_USER_TO_SOCKET + uid);
  }

  public async getUid(socketId: string): Promise<number> {
    return parseInt(await this.redisObj.get(UserService.USER_SOCKET_TO_USER + socketId));
  }

  // 设置UID和SOCKET_ID对应关系
  public async setSocketIdForUid(uid: number, socketId: string): Promise<void> {
    await this.redisObj.set(UserService.USER_SOCKET_TO_USER + socketId, uid);
    await this.redisObj.set(UserService.USER_USER_TO_SOCKET + uid, socketId);
  }

  // 从socketId删除用户ID和SocketId的对应关系
  public async delSocketIdForUid(socketId: string): Promise<void> {
    const uid = await this.getUid(socketId);
    await this.redisObj.del(UserService.USER_SOCKET_TO_USER + socketId);
    await this.redisObj.del(UserService.USER_USER_TO_SOCKET + uid);
  }

  // 当前注册比较简单，只要没有相同的用户名即可新注册
  public async register(inputName: string, inputPass: string): Promise<boolean> {
    // 开始注册
    const userPass = Md5.hashStr(inputName + this.secret + inputPass);
    await this.registerUser(inputName, userPass);
    return true;
  }

  // 检查登录
  public async login(inputName: string, inputPass: string): Promise<[boolean, UserDto]> {
    const userPass = Md5.hashStr(inputName + this.secret + inputPass);
    const exists = await this.checkUserLogin(inputName, userPass);
    if (!exists || !exists[0]) {
      return [false, null];
    }
    return [true, exists[0]];
  }

  // 创建访问令牌
  public async createAccess(userName: string): Promise<string> {
    const access = Md5.hashStr(userName + this.secret + new Date().getTime());
    await this.redisObj.set(UserService.USER_TOKEN + userName, access);
    return access;
  }

  // 检查Token是否正确
  public async checkAccess(userName: string, access: string): Promise<boolean> {
    const token = await this.redisObj.get(UserService.USER_TOKEN + userName);
    return token !== null && token === access;
  }

  // 找出当前用户资料
  public async findUser(findBy: string | number): Promise<UserDto> {
    let user;
    if (typeof findBy === "number") {
      user = await this.findUserById(findBy);
    } else {
      user = await this.findUserByName(findBy);
    }
    if (!user || !user[0]) {
      return null;
    } else {
      return user[0];
    }
  }

  @resultType(UserDto)
  @select("select * from `user` where uid = #{uid}")
  private async findUserById(@param("uid") uid: number): Promise<[UserDto]> { return; }

  @resultType(UserDto)
  @select("select * from `user` where username = #{userName}")
  private async findUserByName(@param("userName") userName: string): Promise<[UserDto]> { return; }

  @resultType(UserDto)
  @select("select * from `user` where username = #{userName} and password = #{userPass}")
  private async checkUserLogin(@param("userName") userName: string, @param("userPass") userPass: string): Promise<UserDto[]> { return; }

  @insert("insert into `user` (username, password) values (#{userName}, #{userPass})")
  private async registerUser(@param("userName") userName: string, @param("userPass") userPass: string) { }

  @insert("insert into `game_log` (room_id, start_time, end_time, user_ids, records) values (#{room_id}, #{start_time}, #{end_time}, #{user_ids}, #{records})")
  public async recordGameLog(gameLog: GameLogDto): Promise<number> { return null; }

  @insert("insert into `play_log` (game_log_id, room_id, uid, username, role, score, `rank`) values (#{game_log_id}, #{room_id}, #{uid}, #{username}, #{role}, #{score}, #{rank})")
  public async recordPlayLog(playLog: PlayLogDto): Promise<void> {}
}