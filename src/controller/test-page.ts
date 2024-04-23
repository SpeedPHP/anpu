import { log, component, getMapping, resource } from "typespeed";
import CardService from "../service/card-service";
import { Suit, Point, Kind } from '../common/card-types';
import {Ready,EventPlayCard,Player} from '../common/event-types';

@component
export default class FrontPage {

  @resource()
  public cardService: CardService;

  @getMapping("/socket.html")
  public socket(req, res) {
    res.render("socket");
  }

  @getMapping("/")
  public index(req, res) {
    // const cards = this.cardService.newCards();
    // for(let cardList of cards) {
    //   log(CardService.numToCard(cardList.cards).map(card => card));
    //   log(CardService.numToCard(cardList.cards).map(card => Suit[card.suit] + " " + Point[card.point]));
    // }
    // log("Cards:", cards);
    res.send("Front page running.");
  }

  @getMapping("/resp")
  public resp(req, res) {
    const play: Player = {
      uid : 0,
      username: "test",
      cardCount: 4,
      active: false,
      winRank: 0,
      isBigBoss: false, // 是否是大地主
      isMiniBoss: false, // 是否是小地主
      isPrevious: false, // 是否是上家
      isAllPassed: false, // 是否所有玩家都pass了，即傍风
    
          /** 以下是非显示的属性 */
      leftPlayerUid: 199, // 上家玩家uid
      rightPlayerUid: 122, // 下家玩家uid
    }
    const eventPlayCard: EventPlayCard = {
      uid: 0,
      username: "test",
      myCards: [1,2,3],
      active: false,
    
      ready: {
        previousCard: [1,2,3],
        availableCards: [
          [1,2,3],
          [1,2,3],
          [1,2,3],
        ],
        enablePass: false,
        isAllPassed: false
      } as Ready,
    
      leftPlayer: play,
      rightPlayer: play,
      upperPlayer: play
    }
    return eventPlayCard;
  }

  @getMapping("/flush")
  public flush(req, res) {
    const myCards = CardService.numToCard([31,15,19,23,27]);
    const result = this.cardService.testFlush(myCards);
    const result2 = this.cardService.testStraight(myCards);
    log(JSON.stringify(result));
    log(JSON.stringify(result2));
    res.send("Test page running.");
  }

  @getMapping("/straight")
  public straight(req, res) {
    const myCards = CardService.numToCard([11,15,19,23,27,24,25,29,34,37,41,42,45,51]);
    const result = this.cardService.testStraight(myCards);
    log(JSON.stringify(result));
    res.send("Test page running.");
  }

  @getMapping("/four")
  public four(req, res) {
    const myCards = CardService.numToCard([10,13,14,15,16,19]);
    log(myCards)
    const result = this.cardService.testFour(myCards);
    log(JSON.stringify(result));
    res.send("Test page running.");
  }

  @getMapping("/fullhouse")
  public fullhouse(req, res) {
    const myCards = CardService.numToCard([10,13,14,15,16,11]);
    const result = this.cardService.testFullhouse(myCards);
    log(JSON.stringify(result));
    res.send("Test page running.");
  }

  @getMapping("/pair")
  public pair(req, res) {
    const myCards = CardService.numToCard([10,13,14,15,16,11]);
    const result = this.cardService.testPair(myCards);
    log(JSON.stringify(result));
    res.send("Test page running.");
  }

  @getMapping("/check")
  public check(req, res) {
    const fiveCards = CardService.numToCard([2,38,42,26,14]);
    log(fiveCards)
    const result = this.cardService.checkCard(fiveCards);
    log(result[0], Kind[result[1]]);
    res.send("Test page running.");
  }
}