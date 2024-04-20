import { log, component, getMapping, resource } from "typespeed";
import CardService from "./service/card-service.class";
import { Suit, Point, Kind } from './common/types';

@component
export default class FrontPage {

  @resource()
  public cardService: CardService;

  @getMapping("/")
  public index(req, res) {
    const cards = this.cardService.newCards();
    for(let cardList of cards) {
      log(CardService.numToCard(cardList.cards).map(card => card));
      log(CardService.numToCard(cardList.cards).map(card => Suit[card.suit] + " " + Point[card.point]));
    }
    log("Cards:", cards);
    res.send("Front page running.");
  }

  @getMapping("/flush")
  public flush(req, res) {
    const myCards = CardService.numToCard([31,15,19,23,27]);
    //log(myCards);
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
    const result = this.cardService.testFour(myCards);

    log(JSON.stringify(result));

    res.send("Test page running.");
  }
}