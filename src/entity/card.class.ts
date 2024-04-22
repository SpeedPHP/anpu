import { Suit } from '../common/types';


export default class Card {
  constructor(
    public num: number, // 当前牌在内存的数
    public suit: Suit, // 花色
    public point: number, // 牌面值
    public suitName: string, // 花色名
    public pointName: string, // 牌面名
    public realPoint: number = 0, // 顺子里计算的比较值
  ){}
}
