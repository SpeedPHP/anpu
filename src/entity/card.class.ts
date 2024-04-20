import { Suit } from '../common/types';


export default class Card {
  /**
   * @param num 当前牌在内存的数
   * @param suit 花色
   * @param point 牌面值
   */
  constructor(
    public num: number, 
    public suit: Suit, 
    public point: number,
    public suitName: string,
    public pointName: string,
    public realPoint: number = 0,
  ){}
}