export default class PlayLogDto {
  constructor(
    public game_log_id: number,
    public room_id: string,
    public uid: number,
    public username: string,
    public role: number,
    public score: number,
    public rank: number,
    public player: string
  ){}
}