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

### c2s auth
```
{
  uid:number // 用户id
  access:string // 访问token
}
```

## 事件定义

### 要求重新登录，不认token
```
s2cRelogin = {}
```

### 加入等候
```
c2sJoinWaiting = {}
```
### 等候状态
```
s2cWaitingStatus = {
  roomUsers: string[] // 等待中的用户名称列表
}
```

### 开始游戏

s2cStartGame = s2cPlayCard // 内容相同，只是事件名不同

### 玩家游戏端出牌

```
c2sPlayCard = {
  sentCards:number[] // 出牌
  pass:boolean // 是否pass
}
```

### 服务端给单个玩家下发

```
s2cPlayCard = {
  uid:number
  username:string
  myCards:number[] // 我的手牌
  active:boolean // 是否可行动，准备出牌

  ready: { // 可以行动，准备决策的内容
    previousCard: number[] // 上家出牌
    availableCards: number[][] // 可用的牌组
    enablePass: boolean // 是否可以过牌：开始时和傍风时不能pass
    isAllPassed: boolean // 是否所有玩家都pass了，即傍风
  }

  leftPlayer: { // 左边玩家
    uid:number
    username:string
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
  continue:boolean // 是否继续游戏，或者直接退出到准备阶段
}
```