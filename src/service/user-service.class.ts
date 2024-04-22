import UserDto from "../entity/user-dto.class";
import { component, Redis, autoware, select, resultType, value, param, insert } from "typespeed";
import { Md5 } from 'ts-md5';


@component
export default class UserService {

  @value("secret")
  private secret: string;

  @autoware
  private redisObj: Redis;

  static USER_TOKEN_PREFIX = "user:token:";

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
    await this.redisObj.set(UserService.USER_TOKEN_PREFIX + userName, access);
    return access;
  }

  // 检查Token是否正确
  public async checkAccess(userName: string, access: string): Promise<boolean> {
    const token = await this.redisObj.get(UserService.USER_TOKEN_PREFIX + userName);
    return token !== null && token === access;
  }

  // 找出当前用户资料
  public async findUser(userName: string): Promise<UserDto> {
    const user = await this.findUserByName(userName);
    if (!user || !user[0]) {
      return null;
    } else {
      return user[0];
    }
  }

  @resultType(UserDto)
  @select("select * from `user` where username = #{userName}")
  private async findUserByName(@param("userName") userName: string): Promise<[UserDto]> { return; }

  @resultType(UserDto)
  @select("select * from `user` where username = #{userName} and password = #{userPass}")
  private async checkUserLogin(@param("userName") userName: string, @param("userPass") userPass: string): Promise<UserDto[]> { return; }

  @insert("insert into `user` (username, password) values (#{userName}, #{userPass})")
  private async registerUser(@param("userName") userName: string, @param("userPass") userPass: string) { }

  /**
CREATE TABLE `user` (
  `uid` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
   */
}