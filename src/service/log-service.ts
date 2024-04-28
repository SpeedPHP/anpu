import { component, autoware } from "typespeed";
import { Player, SentCardsData, SentEvent, EventPlayCard, Ready, EventGameOver, deepHideCopy, formatDate } from "../common/event-types";
import { Role } from "../common/card-types";
import CardService from "../service/card-service";

@component
export default class LogService {

  // 记录开始
  public gameStart(players: Player[]) {
    let record = "### 开始阶段，发牌\n";
    for (let player of players) {
      record += `- ${player.username}，手牌：${player._cards.map(c => c.suitName + c.pointName).join(" ")}\n`;
    }
    record += "### 出牌阶段\n";
    console.log(record);
  }

  // 过程
  public play(players: Player[], nextPlayer: Player, currentUid:number, sentMsg: SentEvent, isWin: boolean) {
    let record = "---\n";
    for (let player of players) {
      record += `- ${player.username}，手牌：${player._cards.map(c => c.suitName + c.pointName).join(" ")}\n`;
    }
    const sender = players.find(p => p.uid === currentUid);
    if(sentMsg.pass) {
      record += `\n> ${sender.username}，出牌：大\n`;
    }else{
      record += `\n> ${sender.username}，出牌：${sentMsg.sentCards.map(c => {
        const mc = CardService.numToCard([c]);
        return mc[0].suitName + mc[0].pointName
      }).join(" ")}\n`;
    }
    if (isWin) {
      record += `\n> ${sender.username}，胜出，排名：${sender.winRank + 1}，身份：${Role[sender._role]}\n`;
    }
    record += `\n> 轮到：${nextPlayer.username}\n`;
    console.log(record);
  }

  // 结束
  public gameOver(players: Player[]){
    let record = "### 结束\n";
    players.forEach(player => {
      record += `- ${player.username}，排名：${player.winRank + 1}，身份：${Role[player._role]}，分数：${player.winScore}\n`;
    });
    console.log(record);
  }
}