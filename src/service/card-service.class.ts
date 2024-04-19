import { component, log } from "typespeed";
import PlayerCard from "../entity/player-card.class";
import Card from "../entity/card.class";
import { Suit, Kind, Point, KindCompare } from '../common/types';

type SamePointCount = {point: number, count: number};

@component
export default class CardService {

  // 取得4副牌
  public newCards(): PlayerCard[] {
    const orderedArray = Array.from({ length: 52 }, (_, index) => index + 1);
    const shuffledArray = this.shuffleArray(orderedArray);
 
    return [
      new PlayerCard(shuffledArray.slice(0, 13)),
      new PlayerCard(shuffledArray.slice(13, 26)),
      new PlayerCard(shuffledArray.slice(26, 39)),
      new PlayerCard(shuffledArray.slice(39, 52)),
    ];
  }

  /*   
  4 = 1,2,3,4
  5 = 5,6,7,8
  6 = 9,10,11,12
  7 = 13,14,15,16
  8 = 17,16,19,20
  9 = 21,22,23,24
  10 = 25,26,27,28
  J = 29,30,31,32
  Q = 33,34,35,36
  K = 37,38,39,40
  A = 41,42,43,44
  2 = 45,46,47,48
  3 = 49,50,51,52 
  */
  // 号码转牌
  public static numToCard(num: number[]) {
    num = num.sort();
    return num.map((n) => {
      const point = Math.floor((n-1) / 4); // 从1开始所以要减一，逻辑在Point，3大4小
      const suit = n % 4; // 余数是花色，余1是方块，逻辑在enum Suit
      return new Card(n, suit, point, Suit[suit], Point[point]);
    });
  }

  // 牌转号码
  public static cardToNum(cards: Card[]) {
    const cardList = cards.map((c) => {
      return c.num;
    });
    return cardList.sort();
  }

  // 检查出牌是否正确
  public checkCardAndKind(sendCards: Card[], myCards: Card[]): [boolean, Kind] {
    // sendCards 是否在 myCards 里面 
    sendCards.every((card) => {
      if (!myCards.includes(card)) {
        return [false, null];
      }
    });
    const length = sendCards.length; // 看哪一种
    if (length === 2) { // 两张要一对，即point要一样的
      return [sendCards[0].pointName == sendCards[1].pointName, Kind.PAIR];
    } else if(length == 5) { // 5张




     
    } else {
      // 单张直接判定
      return [true, Kind.ONE];
    }
  }

  // 三带二，返回[{组，比较点数}]
  public testFullhouse(cards: Card[]): KindCompare[] {
    let groups: Map<number, Card[]> = new Map();
    for(let card of cards) {
      if (groups.has(card.point)) {
        groups.get(card.point).push(card);
      } else {
        groups.set(card.point, [card]);
      }
    }
    const result: KindCompare[] = [];
    const three: KindCompare[] = [];
    const two: KindCompare[] = [];
    for(let [point, cards] of groups.entries()) {
      if(cards.length == 3) {
        three.push({
          group: cards,
          compare: point
        });
      } else if (cards.length == 2) {
        two.push({
          group: cards,
          compare: point
        });
      }
    }
    // 如果没有一对，直接返回
    if (two.length == 0) {return [];}
    // 有的话，三张和对的相乘，三张作为比较点数

  }

  

  // 四带一，返回[{组，比较点数}]
  // TODO: 所有的组都要加上一张的情况，才能做比较
  // TODO：另外，KindCompare里面的groups数组要排序，方便对比
  public testFour(cards: Card[]): KindCompare[] {
    if(cards.length <= 4) { // 不够五张
      return [];
    }
    let groups: Map<number, Card[]> = new Map();
    for(let card of cards) {
      if (groups.has(card.point)) {
        groups.get(card.point).push(card);
      } else {
        groups.set(card.point, [card]);
      }
    }
    const result: KindCompare[] = [];
    for(let [point, cards] of groups.entries()) {
      if (cards.length == 4) {
        result.push({
          group: cards,
          compare: point
        });
      }
    }
    return result;
  }

  // 获取比上一家大的牌
  // TODO:顺 < 同花 < 三带二 < 四带一 < 同花顺
  public getBiggerCards(prevCards: Card[], myCards: Card[]) {
    const length = prevCards.length; // 看哪一种
    if (length === 1) { // 单张直接判定
      return myCards.filter((n) => n > prevCards[0]);
    } else if(length == 2) {

    }
  }

 
  // Fisher-Yates洗牌算法打乱数组
  private shuffleArray(array: number[]): number[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
