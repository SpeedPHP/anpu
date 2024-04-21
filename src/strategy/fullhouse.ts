import { log } from "typespeed";
import { KindCompare, combinations } from '../common/types';
import Card from "../entity/card.class";

export const testFullhouse = (cards: Card[]): KindCompare[] => {
  const result: KindCompare[] = [];
  let groups: Map<number, Card[]> = new Map();
  for(let card of cards) {
    if (groups.has(card.point)) {
      groups.get(card.point)!.push(card);
    } else {
      groups.set(card.point, [card]);
    }
  }
  const threeGroup: Card[][] = [];
  const twoGroup: Card[][] = [];
  for(let cardList of groups.values()) {
    if (cardList.length == 4) { // 四张也算三张，也算2张
      threeGroup.push(...combinations(cardList, 3));
      twoGroup.push(...combinations(cardList, 2));
    }
    if(cardList.length == 3) { // 三张算三张也算2张
      threeGroup.push(cardList);
      twoGroup.push(...combinations(cardList, 2));
    }
    if (cardList.length == 2) { // 2张
      twoGroup.push(cardList);
    }
  }
  // 如果没有2和三张，直接返回
  if (twoGroup.length == 0 && threeGroup.length == 0) {return [];}

  // 组合三张和一对，但它们的牌不能相同
  for(let three of threeGroup) {
    for(let two of twoGroup) {
      if (three[0].point != two[0].num) {
        result.push({
          group: three.concat(two),
          compare: three[2].num,
        });
      }
    }
  }
  return result;
}