export default class GameLogDto {
  constructor(
    public room_id: string,
    public start_time: string,
    public end_time: string,
    public user_ids: string,
    public records: string
  ){}
}