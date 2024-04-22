export default class UserDto {
  constructor(
    public uid: number, 
    public username: string,
    public access: string,
  ){}
}