import Card from "../entity/card.class";

export enum Suit {
  '大葵',
  '散角',
  '花仔',
  '红桃'
}

export const Point: string[] = [
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
  '2',
  '3'
];

export enum Kind {
  "ONE", /* 单张 */
  "PAIR", /* 对 */
  "FULLHOUSE", /* 三带二 */
  "FLUSH", /* 同花 */
  "FOUR", /* 四带一 */
  "STRAIGHT", /* 顺子 */
  "STRAIGHTFLUSH", /* 同花顺 */
}
// {组，比较点数}
export type KindCompare = { group: Card[], compare: number };