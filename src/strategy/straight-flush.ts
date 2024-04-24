import { KindCompare } from '../common/card-types';
import Card from "../entity/card";
import { testStraight } from "./straight";
import { testFlush } from "./flush";

export const testStraightFlush = (cards: Card[]): KindCompare[] => {
  // 先检查出所有的同花
  const flushCards = testFlush(cards);
  if (flushCards.length === 0) {
    return [];
  }
  const result:KindCompare[] = [];
  flushCards.forEach(c => {
    const straightCards = testStraight(c.group);
    if (straightCards.length > 0) {
      result.push(straightCards[0]);
    }
  })
  return result;
}
