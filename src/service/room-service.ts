import { component, log, autoware, Redis } from "typespeed";
import { Player, SentCardsData, formatDate } from "../common/event-types";

@component
export default class RoomService {

  @autoware
  private redisObj: Redis;

  static USER_TO_ROOM_ID = "room:user:";
  static ROOM_WAITING = "room:waiting:";
  static ROOM_PLAYERS = "room:player:";
  static ROOM_PREVIOUS_ACTIVE_USER = "room:previous_active:";
  static ROOM_LAST_SENT_DATA = "room:last_sent_data:";
  static ROOM_GAME_RECORD = "room:game_record:";
  static ROOM_GAME_START_TIME = "room:start_time:";

  // 获取我所在的房间
  public async findMyRoomId(uid: number): Promise<string> {
    return await this.redisObj.get(RoomService.USER_TO_ROOM_ID + uid);
  }

  // 取得房间内所有的玩家
  public async getRoomPlayers(roomId: string): Promise<Player[]> {
    const playerStrings = await this.redisObj.smembers(RoomService.ROOM_PLAYERS + roomId);
    return playerStrings.map(playerString => JSON.parse(playerString));
  }

  // 设置下一次可出牌的玩家
  public async setNextActiveUid(roomId: string, uid: number) {
    await this.redisObj.set(RoomService.ROOM_PREVIOUS_ACTIVE_USER + roomId, uid);
  }

  // 取可出牌的玩家
  public async getNextActiveUid(roomId: string): Promise<number> {
    const uid = await this.redisObj.get(RoomService.ROOM_PREVIOUS_ACTIVE_USER + roomId);
    return uid ? parseInt(uid) : null;
  }

  // 设置最后出牌的人和牌
  public async setRoomLastData(roomId: string, data: SentCardsData): Promise<void> {
    await this.redisObj.set(RoomService.ROOM_LAST_SENT_DATA + roomId, JSON.stringify(data));
  }

  // 获取最后出牌的人和牌
  public async getRoomLastData(roomId: string): Promise<SentCardsData | null> {
    const data = await this.redisObj.get(RoomService.ROOM_LAST_SENT_DATA + roomId);
    if (!data) return null;
    return <SentCardsData>JSON.parse(data);
  }

  // 记录游戏
  public async recordGame(roomId: string, uid: number, cards: number[]): Promise<void> {
    const record = `${formatDate(new Date())}-${uid}-${cards.join(',')}`;
    await this.redisObj.rpush(RoomService.ROOM_GAME_RECORD + roomId, record);
  }

  // 获取游戏记录并删除
  public async getAndClearGameRecord(roomId: string): Promise<[string, string[]]> {
    const record = await this.redisObj.lrange(RoomService.ROOM_GAME_RECORD + roomId, 0, -1);
    const startTime = await this.redisObj.get(RoomService.ROOM_GAME_START_TIME + roomId);
    // await this.redisObj.del(RoomService.ROOM_GAME_RECORD + roomId);
    // await this.redisObj.del(RoomService.ROOM_GAME_START_TIME + roomId);
    return [startTime, record];
  }

  // 更新房间内的玩家！
  public async updateRoomPlayers(roomId: string, players: Player[]) {
    await this.redisObj.del(RoomService.ROOM_PLAYERS + roomId);
    await this.redisObj.sadd(RoomService.ROOM_PLAYERS + roomId, ...players.map(player => JSON.stringify(player)));
  }

  // 加入一个等待中房间，如果就近一个等待房间已经满员，那么开启下一个等待房间并加入
  // 返回当前房间的id
  public async getWaitingRoomAndJoin(player: Player): Promise<string> {
    let waitingRoomId = await this.redisObj.get(RoomService.ROOM_WAITING);
    if (!waitingRoomId ||
      (waitingRoomId && await this.getPlayerCount(waitingRoomId) >= 4)) {
      waitingRoomId = await this.createRoomAndJoin(player);
      await this.redisObj.set(RoomService.ROOM_WAITING, waitingRoomId);
    } else {
      await this.redisObj.sadd(RoomService.ROOM_PLAYERS + waitingRoomId, JSON.stringify(player));
    }
    await this.redisObj.set(RoomService.USER_TO_ROOM_ID + player.uid, waitingRoomId);
    return waitingRoomId;
  }

  // 重新开始
  public async restartRoom(roomId: string): Promise<void> {
    await this.redisObj.del(RoomService.ROOM_PREVIOUS_ACTIVE_USER + roomId);
    await this.redisObj.del(RoomService.ROOM_LAST_SENT_DATA + roomId);
    await this.redisObj.set(RoomService.ROOM_GAME_START_TIME + roomId, formatDate(new Date()));
  }

  // 创建一个等待房间，并加入
  private async createRoomAndJoin(player: Player): Promise<string> {
    const playerInfo = JSON.stringify(player);
    const roomId = this.generateRandomString(10);
    await this.redisObj.sadd(RoomService.ROOM_PLAYERS + roomId, playerInfo);
    return roomId;
  }

  // 房间有几个玩家在等？
  private async getPlayerCount(roomId: string): Promise<number> {
    return await this.redisObj.scard(RoomService.ROOM_PLAYERS + roomId);
  }

  private generateRandomString(length: number): string {
    // 定义可能的字符集合
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    // 生成随机字符串
    for (let i = 0; i < length; i++) {
      // chars.length给出字符集合的长度，Math.random()生成0到1之间的随机数，乘以长度并取整得到索引
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

}