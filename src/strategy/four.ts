import { KindCompare } from '../common/card-types';
import Card from "../entity/card";

export const testFour = (cards: Card[]): KindCompare[] => {
  const result:KindCompare[] = [];
  let groups: Map<number, Card[]> = new Map();
  for(let card of cards) {
    if (groups.has(card.point)) {
      groups.get(card.point)!.push(card);
    } else {
      groups.set(card.point, [card]);
    }
  }
  for(let [point, fourCards] of groups.entries()) {
    if (fourCards.length == 4) {
      result.push(...handleFour(fourCards, cards, point));
    }
  }
  return result;
}

// 四个一组进去，和整个数组进去，把余下的元素拼凑成很多组
function handleFour(fourCards: Card[], allCards: Card[], compare:number) : KindCompare[] {
  const fourNums = fourCards.map(card => card.num);
  return allCards.filter(card => !fourNums.includes(card.num)).map(card => ({
    group: [...fourCards, card],
    compare: compare
  }));
}