
// 当前用户不是可出牌用户
export class NotActiveUserException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotActiveUserException';
  }
}

// 不正确的出牌
export class NotValidCardsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotValidCardsException';
  }
}

// 没有拥有那些牌
export class NotOwnCardsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotOwnCardsException';
  }
}