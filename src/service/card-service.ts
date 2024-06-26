import { component, log } from "typespeed";

import Card from "../entity/card";
import { Suit, Kind, Point, KindCompare } from '../common/card-types';
import { testStraight } from "../strategy/straight";
import { testFlush } from "../strategy/flush";
import { testFour } from "../strategy/four";
import { testFullhouse } from "../strategy/fullhouse";
import { testPair } from "../strategy/pair";
import { testStraightFlush } from "../strategy/straight-flush";


@component
export default class CardService {

  static FIRST_CARD_NUM = 1;
  static BIG_BOSS_CARD_NUM = 52;
  static MINI_BOSS_CARD_NUM = 44;

  // 取得4副牌
  public newCards(): Card[][] {
    const orderedArray = Array.from({ length: 52 }, (_, index) => index + 1);
    const shuffledArray = this.shuffleArray(orderedArray);

    return [
      CardService.numToCard(shuffledArray.slice(0, 13)),
      CardService.numToCard(shuffledArray.slice(13, 26)),
      CardService.numToCard(shuffledArray.slice(26, 39)),
      CardService.numToCard(shuffledArray.slice(39, 52)),
    ];
  }
  
  // 号码转牌
  public static numToCard(num: number[]): Card[] {
    num = num.sort((a, b) => a - b);
    return num.map((n) => {
      const point = Math.floor((n - 1) / 4); // 从1开始所以要减一，逻辑在Point，3大4小
      const suit = n % 4; // 余数是花色，余1是方块，逻辑在enum Suit
      return new Card(n, suit, point, Suit[suit], Point[point]);
    });
  }

  // 牌转号码
  public static cardToNum(cards: Card[]): number[] {
    const cardList = cards.map((c) => {
      return c.num;
    });
    return cardList.sort((a, b) => a - b);
  }

  // 出牌是否地主
  // isBigBoss取第0值，isMiniBoss取1值
  public isBoss(cardNums: number[]): [boolean, boolean] {
    let isBigBoss = false;
    let isMiniBoss = false;
    for (let num of cardNums) {
      if (num == CardService.BIG_BOSS_CARD_NUM) {
        isBigBoss = true;
      } else if (num == CardService.MINI_BOSS_CARD_NUM) {
        isMiniBoss = true;
      }
    }
    return [isBigBoss, isMiniBoss];
  }

  // 检查是否拥有第一张
  public hasFirstCard(cards: Card[]): boolean {
    for (let card of cards) {
      if (card.num == CardService.FIRST_CARD_NUM) {
        return true;
      }
    }
    return false;
  }

  // 第一张牌，可以出的组合，一定要出关联4的
  public availableCardsByFirst(cards: Card[]): number[][] {
    const result: number[][] = [[CardService.FIRST_CARD_NUM]]; // 首先可以出单张
    result.push(...this.isGroupWithFirst(cards, this.testPair));
    result.push(...this.isGroupWithFirst(cards, this.testFullhouse));
    result.push(...this.isGroupWithFirst(cards, this.testFour));
    result.push(...this.isGroupWithFirst(cards, this.testStraight));
    result.push(...this.isGroupWithFirst(cards, this.testFlush));
    return result;
  }

  // 如果全大了，可以出的组合
  public availableCardsByPassAll(cards: Card[]): number[][] {
    const result: number[][] = [...CardService.cardToNum(cards).map(v => [v])]; // 单张都可以出
    this.testPair(cards).forEach(v => result.push(CardService.cardToNum(v.group)));
    this.testFullhouse(cards).forEach(v => result.push(CardService.cardToNum(v.group)));
    this.testFour(cards).forEach(v => result.push(CardService.cardToNum(v.group)));
    this.testStraight(cards).forEach(v => result.push(CardService.cardToNum(v.group)));
    this.testFlush(cards).forEach(v => result.push(CardService.cardToNum(v.group)));
    return result;
  }

  // 上家出了牌，可以出的组合；上家的牌需要经过checkOwn和checkCard再输入
  public availableCardsByCompare(cards: Card[], aCardKind:Kind, aCardCompare: KindCompare): number[][] {
    if (aCardKind == Kind.ONE) {
      return CardService.cardToNum(cards.filter(c => c.num > aCardCompare.compare)).map(v => [v]);
    } else if(aCardKind == Kind.PAIR){
      return this.testPair(cards).filter(v => v.compare > aCardCompare.compare).map(v => CardService.cardToNum(v.group));
    } else if (aCardKind == Kind.FOUR) {
      return this.testFour(cards).filter(v => v.compare > aCardCompare.compare).map(v => CardService.cardToNum(v.group));
    } else if (aCardKind == Kind.FULLHOUSE) {
      return this.testFullhouse(cards).filter(v => v.compare > aCardCompare.compare).map(v => CardService.cardToNum(v.group));
    } else if (aCardKind == Kind.STRAIGHTFLUSH) {
      // 同花顺是先比花，再比顺
      const [compareCard] = CardService.numToCard([aCardCompare.compare]);
      return this.testStraightFlush(cards).filter(v => {
        let [ownCard] = CardService.numToCard([v.compare]);
        if(ownCard.suit > compareCard.suit) return true;
        if(ownCard.suit == compareCard.suit) {
          return ownCard.num > compareCard.num;
        }
      }).map(v => CardService.cardToNum(v.group));
    } else if (aCardKind == Kind.STRAIGHT) {
      return this.testStraight(cards).filter(v => v.compare > aCardCompare.compare).map(v => CardService.cardToNum(v.group));
    } else if (aCardKind == Kind.FLUSH) {
      return this.testFlush(cards).filter(v => v.compare > aCardCompare.compare).map(v => CardService.cardToNum(v.group));
    } else {
      return [];
    }
  }

  // 检查是否拥有牌
  public checkOwn(cards: Card[], myCards: Card[]): boolean {
    const cardsNum = cards.map(v => v.num);
    return myCards.every((card) => {
      return cardsNum.includes(card.num);
    });
  }

  // 检查出牌是否正确
  public checkCard(sendCards: Card[]): [boolean, Kind, KindCompare] {
    const length = sendCards.length; // 看哪一种
    if (length === 2) { // 两张要一对，即point要一样的
      return [sendCards[0].pointName == sendCards[1].pointName, Kind.PAIR, {
        group: sendCards,
        compare: Math.max(...sendCards.map((c) => c.num))
      }];
    } else if (length == 5) { // 5张
      const flush = testFlush(sendCards);
      const straight = testStraight(sendCards);
      const four = testFour(sendCards);
      const fullhouse = testFullhouse(sendCards);
      if (flush.length > 0 && straight.length > 0) { // 同花顺
        return [true, Kind.STRAIGHTFLUSH, straight[0]];
      } else if (flush.length > 0) { // 同花
        return [true, Kind.FLUSH, flush[0]];
      } else if (straight.length > 0) { // 顺
        return [true, Kind.STRAIGHT, straight[0]];
      } else if (testFour(sendCards).length > 0) { // 四带一
        return [true, Kind.FOUR, four[0]];
      } else if (testFullhouse(sendCards).length > 0) { // 三带二
        return [true, Kind.FULLHOUSE, fullhouse[0]];
      } else {
        return [false, null, null];
      }
    } else if (length == 1) {
      // 单张直接判定
      return [true, Kind.ONE, {
        group: sendCards,
        compare: sendCards[0].num
      }];
    } else {
      return [false, null, null];
    }
  }

  public testFullhouse(cards: Card[]): KindCompare[] { return testFullhouse(cards); }
  public testStraight(cards: Card[]): KindCompare[] { return testStraight(cards); }
  public testFlush(cards: Card[]): KindCompare[] { return testFlush(cards); }
  public testFour(cards: Card[]): KindCompare[] { return testFour(cards); }
  public testPair(cards: Card[]): KindCompare[] { return testPair(cards); }
  public testStraightFlush(cards: Card[]): KindCompare[] { return testStraightFlush(cards); }

  // 找出有哪些组合，对里哪些是带num=1的
  private isGroupWithFirst(cards: Card[], handler: Function): number[][] {
    const result: number[][] = [];
    handler(cards).filter((pair) => {
      return pair.group.some((card) => {
        return card.num == CardService.FIRST_CARD_NUM;
      });
    }).forEach(p => result.push(CardService.cardToNum(p.group)));
    return result;
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
