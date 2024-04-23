import { KindCompare, combinations } from '../common/card-types';
import Card from "../entity/card";

export const testPair = (cards: Card[]): KindCompare[] => {
  const result: KindCompare[] = [];
  let groups: Map<number, Card[]> = new Map();
  for(let card of cards) {
    if (groups.has(card.point)) {
      groups.get(card.point)!.push(card);
    } else {
      groups.set(card.point, [card]);
    }
  }
  const twoGroup: Card[][] = [];
  for(let cardList of groups.values()) {
    if (cardList.length == 4) { // 四张也算2张
      twoGroup.push(...combinations(cardList, 2));
    }
    if(cardList.length == 3) { // 三张也算2张
      twoGroup.push(...combinations(cardList, 2));
    }
    if (cardList.length == 2) { // 2张
      twoGroup.push(cardList);
    }
  }
  // 如果没有对，直接返回
  if (twoGroup.length == 0) {return [];}
  for(let two of twoGroup) {
    result.push({
      group: two,
      compare: Math.max(...two.map(card => card.num)),
    });
  }
  return result;
}