import { KindCompare } from '../common/card-types';
import Card from "../entity/card";

export const testStraight = (cards: Card[]): KindCompare[] => {
  const result: KindCompare[] = [];
  let currentGroup: Card[] = [];
  cards = changeStraight(cards);
  cards.sort((a, b) => a.realPoint - b.realPoint);
  //log(cards)
  for (let i = 0; i < cards.length; i++) {
    if (
        i === 0 || 
        cards[i].realPoint - cards[i - 1].realPoint === 1 || 
        cards[i].realPoint == cards[i - 1].realPoint
      ) { 
      currentGroup.push(cards[i]);
    } else {
      if (currentGroup.length >= 5) {
        result.push(...handleLine(currentGroup))
      }
      currentGroup = [cards[i]];
    }
     
  }
  if (currentGroup.length >= 5) {
    result.push(...handleLine(currentGroup))
  }
  // 由于handleLine里面相同多开一组，那么当下一个元素迭代为i时，还是会多一个，因此需要去重。
  const uniqueObjects = [...new Set(result.map(v => JSON.stringify(v)))].map(v => JSON.parse(v));
  return uniqueObjects;
}

// 处理取得的可能会重复的，顺序的排列
function handleLine(cards: Card[]) {
  const result:KindCompare[] = [];
  for (let i = 0; i < cards.length; i++) {
    let lastCard = cards[i];
    let currentCards:Card[][] = [[cards[i]]];

    // 向前点五张
    for(let j = i + 1; j < cards.length; j++) {
      if(lastCard.realPoint == cards[j].realPoint){
        // 相同则多开一组
        currentCards.push(...currentCards.map((sigleRowCard) => 
          sigleRowCard.map((v, k) => 
            (k == sigleRowCard.length - 1) ? cards[j] : v
          )));
      }else{
        // 不同则将值放所有的组
        currentCards.forEach(v => v.push(cards[j]));
        lastCard = cards[j];
      }
    }
    currentCards.filter(cardsList => cardsList.length >= 5).map(v => {
      const pushCard = v.slice(0, 5);
      if(pushCard.length != 5) return;
      // 取判定顺子的大小的数
      let compareBiggestPoint = pushCard[0];
      for(let i = 1; i < pushCard.length; i++) {
        if(pushCard[i].realPoint > compareBiggestPoint.realPoint) {
          compareBiggestPoint = pushCard[i];
        }
      }
      result.push({
        group: pushCard,
        compare: compareBiggestPoint.realPoint
      })
    })
  }
  return result;
}

// 由于A可以当做1，也可以当做比K大，所以要复制一份A
function changeStraight(cards: Card[]) {
  const addA: Card[] = [];
  // A1234, 10JQKA
  for(let i = 0; i < cards.length; i++) {
    if(cards[i].num <= 44) { // 4-A
      cards[i].realPoint = cards[i].point + 4;
    } else { // 2-3
      cards[i].realPoint = cards[i].point - 9;
    }
    if([41,42,43,44].includes(cards[i].num)) { // A
      const tmpCard = new Card(cards[i].num, cards[i].suit, cards[i].point, cards[i].suitName, cards[i].pointName, cards[i].point - 9);
      addA.push(tmpCard);
    }
  }
  return [...cards, ...addA];
}