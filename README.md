# anpu
安铺打地主的牌玩法服务

## http接口(BODY JSON)

### 登录和注册
> /login
```
post = {
  inputname: string
  inputpass: string
}

resp = {
  success:boolean
  uid:number
  access:string
  username:string
}
```

## ws全局约定

### c2s header
```
{
  uid:number // 用户id
  access:string // 访问token
}
```
### s2c 实体
```
:user = {
  uid:number
  username:string
}
```

## 事件定义

### 要求重新登录，不认token
```
s2cReLogin = {}
```

### 加入等候
```
c2sJoinWaiting = {}
```
### 等候状态
```
s2cWaitingStatus = {
  roomUserCount:number // 一起等候人数
}
```
### 开始
```
s2cStartGame = {
  myCards:number[] // 我的手牌
  active:boolean // 是否可行动，准备出牌

  ready: { // 可以行动，准备决策的内容
    availableCards: number[][] // 可用的牌组
    enablePass: boolean // 是否可以过牌：开始时不能pass
  }

  leftPlayer: { // 左边玩家
    :user
    cardCount: number // 剩余牌数
    active: boolean // 是否在行动，准备出牌
  },
  rightPlayer = leftPlayer // 右边玩家
  upperPlayer = leftPlayer // 上方玩家
}
```
### 出牌

```
c2sPlayCard = {
  remainingCards:number[] // 剩余牌
  sendCards:number[] // 出牌
  pass:boolean // 是否pass
}
```

### 游戏中收到响应

```
s2cPlayCard = {
  myCards:number[] // 我的手牌
  active:boolean // 是否可行动，准备出牌

  ready: { // 可以行动，准备决策的内容
    previousCard: number[] // 上家出牌
    availableCards: number[][] // 可用的牌组
    enablePass: boolean // 是否可以过牌：开始时和傍风时不能pass
    isAllPassed: boolean // 是否所有玩家都pass了，即傍风
  }

  leftPlayer: { // 左边玩家
    :user
    cardCount: number // 剩余牌数
    active: boolean // 是否在行动，准备出牌
    winRank: number // 第几名，默认0未赢
    isBigBoss: boolean // 是否是大地主
    isMiniBoss: boolean // 是否是小地主
    isPrevious: boolean // 是否是上家
    isAllPassed: boolean // 是否所有玩家都pass了，即傍风
  },
  rightPlayer = leftPlayer // 右边玩家
  upperPlayer = leftPlayer // 上方玩家
}
```

### 结束结算

```
s2cGameOver = {
  myCards:number[] // 我的手牌
  myWinRank:number // 我的排名
  isBigBoss: boolean // 是否是大地主
  isMiniBoss: boolean // 是否是小地主
}
```