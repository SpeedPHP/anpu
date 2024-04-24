import { log, component, getMapping, resource, reqQuery, autoware, logx } from "typespeed";
import CardService from "../service/card-service";
import { Suit, printCards, Kind } from '../common/card-types';
import {Ready,EventPlayCard,Player} from '../common/event-types';
import RoomService from "../service/room-service";
import GameService from "../service/game-service";

@component
export default class FrontPage {

  @autoware
  public cardService: CardService;

  @autoware
  public roomService: RoomService;

  @autoware
  public gameService: GameService;

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

  @getMapping("/room")
  public room(@reqQuery uid: number) {
    const player: Player = {
      uid: uid,
      username: "hello",
    }
    this.roomService.getWaitingRoomAndJoin(player);
    return "JOIN";
  }

  @getMapping("/sit")
  public sit() {
    const players = [
      this.gameService.createPlayer(1, "test1", "test"),
      this.gameService.createPlayer(2, "test2", "test"),
      this.gameService.createPlayer(3, "test3", "test"),
      this.gameService.createPlayer(4, "test4", "test"),];
    const newPlayers = this.gameService.playersSitDown(players);
    log(newPlayers);
    return "SIT";
  }

  @getMapping("/start")
  public start() {
    const players = [
      this.gameService.createPlayer(1, "test1", "test1"),
      this.gameService.createPlayer(2, "test2", "test2"),
      this.gameService.createPlayer(3, "test3", "test3"),
      this.gameService.createPlayer(4, "test4", "test4"),];
    const newPlayers = this.gameService.gameStart(players);
    logx(Object.fromEntries(newPlayers[1]));
    return "start";
  }

  @getMapping("/checkFour")
  public checkFour() {
    const cards = this.cardService.newCards();
    for(let i = 0; i < 4; i++) {
      printCards(cards[i]);
      const result:number[][] = this.cardService.availableCardsByFirst(cards[i]);
      log(result);
    }
    return "FOUR";
  }

  @getMapping("/checkAll")
  public checkAll() {
    const cards = this.cardService.newCards();
    for(let i = 0; i < 4; i++) {
      printCards(cards[i]);
      log("")
      let count = 0;
      this.cardService.availableCardsByPassAll(cards[i]).forEach(v => {
        printCards(CardService.numToCard(v));log("")
        count++;
      })
      log(count);
    }
    return "FOUR";
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