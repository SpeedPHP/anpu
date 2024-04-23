import { log } from "typespeed";
import { KindCompare, combinations } from '../common/card-types';
import Card from "../entity/card";

export const testFlush = (cards: Card[]): KindCompare[] => {
  // 选出所有的同花色，不够5张马上返回
  cards.sort((a, b) => a.num - b.num);
  const sameSuit = [[],[],[],[]];
  const result:KindCompare[] = [];

  for(let card of cards) {
    sameSuit[card.suit].push(card);
  }

  // 每组相同的花色，找出它们的所有5个组合
  sameSuit.forEach(x => {
    if(x.length >= 5) {
      const comb = combinations<Card>(x, 5);
      for(let c of comb) {
        let compareBiggestNum = c[0];
        for(let i = 1; i < c.length; i++) {
          if(c[i].num > compareBiggestNum.num) {
            compareBiggestNum = c[i];
          }
        }
        result.push({
          group: c,
          compare: compareBiggestNum.num
        });
      }
    }
  });

  return result;
}


