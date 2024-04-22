import UserService from "../service/user-service.class";
import LoginReq from "../entity/login-req.class";
import { log, component, postMapping, reqBody, autoware } from "typespeed";


@component
export default class HttpPage {

  @autoware
  userService: UserService;

  @postMapping("/login")
  async index(@reqBody req: LoginReq) {
    const userName = req.inputname;
    const userPass = req.inputpass;
    // 用户是否存在
    let user = await this.userService.findUser(userName);
    if (user == null) {
      // 则注册
      this.userService.register(userName, userPass);
      user = await this.userService.findUser(userName);
    } else {
      // 存在则检查
      const [passed, userInfo] = await this.userService.login(userName, userPass);
      if (!passed) {
        // 用户名密码错误
        return {"success": false, "uid": 0, "access": "", "username": ""};
      }
      user = userInfo;
    }

    return {
      "success": true, 
      "uid": user.uid, 
      "access": await this.userService.createAccess(userName),
      "username": user.username
    };
  }

}