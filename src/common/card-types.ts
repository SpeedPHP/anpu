import Card from "../entity/card";

export enum Suit {
  '大葵',
  '散角',
  '花仔',
  '红桃'
}

export const Point: string[] = [
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
  '2',
  '3'
];

export enum Kind {
  "ONE", /* 单张 */
  "PAIR", /* 对 */
  "FULLHOUSE", /* 三带二 */
  "FLUSH", /* 同花 */
  "FOUR", /* 四带一 */
  "STRAIGHT", /* 顺子 */
  "STRAIGHTFLUSH", /* 同花顺 */
}
// {组，比较点数}
export type KindCompare = { group: Card[], compare: number };


// 获取组合
export function combinations<T>(items: T[], k: number): T[][] {
  const result: T[][] = [];
  function backtrack(start: number, currentCombination: T[]): void {
    if (currentCombination.length === k) {
      result.push([...currentCombination]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      // 避免添加重复元素
      if (currentCombination.includes(items[i])) {
        continue;
      }
      currentCombination.push(items[i]);
      backtrack(i + 1, currentCombination); // 不再考虑已经选择过的元素
      currentCombination.pop(); // 回溯，移除当前加入的元素
    }
  }

  backtrack(0, []);
  return result;
}