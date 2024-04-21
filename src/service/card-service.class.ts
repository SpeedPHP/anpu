import { component, log } from "typespeed";
import PlayerCard from "../entity/player-card.class";
import Card from "../entity/card.class";
import { Suit, Kind, Point, KindCompare } from '../common/types';
import { testStraight } from "../strategy/straight";
import { testFlush } from "../strategy/flush";
import { testFour } from "../strategy/four";
import { testFullhouse } from "../strategy/fullhouse";
import { testPair } from "../strategy/pair";


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

  // 检查是否拥有牌
  public checkOwn(cards: Card[], myCards: Card[]):boolean {
    return cards.every((card) => {
      return myCards.includes(card);
    });
  }

  // 检查出牌是否正确
  public checkCard(sendCards: Card[]): [boolean, Kind] {
    const length = sendCards.length; // 看哪一种
    if (length === 2) { // 两张要一对，即point要一样的
      return [sendCards[0].pointName == sendCards[1].pointName, Kind.PAIR];
    } else if(length == 5) { // 5张
      const flush = testFlush(sendCards);
      const straight = testStraight(sendCards);
      if (flush.length > 0 && straight.length > 0) { // 同花顺
        return [true, Kind.STRAIGHTFLUSH];
      } else if (flush.length > 0) { // 同花
        return [true, Kind.FLUSH];
      } else if (straight.length > 0) { // 顺
        return [true, Kind.STRAIGHT];
      } else if (testFour(sendCards).length > 0) { // 四带一
        return [true, Kind.FOUR];
      } else if (testFullhouse(sendCards).length > 0) { // 三带二
        return [true, Kind.FULLHOUSE];
      } else {
        return [false, null];
      }
    } else if(length == 1) {
      // 单张直接判定
      return [true, Kind.ONE];
    } else {
      return [false, null];
    }
  }

  public testFullhouse(cards: Card[]): KindCompare[] {
    return testFullhouse(cards);
  }

  public testStraight(cards: Card[]): KindCompare[] {
    return testStraight(cards);
  }

  public testFlush(cards: Card[]): KindCompare[] {
    return testFlush(cards);
  }

  public testFour(cards: Card[]): KindCompare[] {
    return testFour(cards);
  }

  public testPair(cards: Card[]): KindCompare[] {
    return testPair(cards);
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
