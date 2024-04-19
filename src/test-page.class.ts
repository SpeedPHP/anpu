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

  @getMapping("/check")
  public test(req, res) {
    //const checkCards = CardService.numToCard([1, 2, 3, 7, 6]);
    const myCards = CardService.numToCard([1, 2, 3, 4, 6,  7,
      21,22,23,24,  51, 45, 32,
      ]);
    log(myCards);
    const result = this.cardService.testFour(myCards);
    log(JSON.stringify(result));

    res.send("Test page running.");
  }
}