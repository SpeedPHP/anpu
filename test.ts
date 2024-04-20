function combinations<T>(items: T[], k: number): T[][] {
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

// 示例：计算含有13个对象集合中取出5个不重复对象的所有可能组合
const objects = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const combinationsWithoutRepetition = combinations(objects, 5);

console.log(combinationsWithoutRepetition);