# anpu
安铺打地主的扑克牌玩法，服务端文档

## 对应关系

### 牌和数字

|牌|索引值Point|散角|花仔|红桃|大葵|
|-|-|-|-|-|-|
|4|0|1|2|3|4|
|5|1|5|6|7|8|
|6|2|9|10|11|12|
|7|3|13|14|15|16|
|8|4|17|16|19|20|
|9|5|21|22|23|24|
|10|6|25|26|27|28|
|J|7|29|30|31|32|
|Q|8|33|34|35|36|
|K|9|37|38|39|40|
|A|10|41|42|43|44|
|2|11|45|46|47|48|
|3|12|49|50|51|52|

> 玩法没有大小鬼

### 角色

|角色|索引|索引值Role|特征|
|-|-|-|-|
|贫农|0|Poor| - |
|地主仔|1|MiniBoss|大葵A|
|大地主|2|BigBoss|大葵3|
|双地|3|DoubleBoss|大葵A + 大葵3|

### 贡牌规则

|第一名|第二名|第三名|第四名|贡牌|第一名|第二名|第三名|第四名|
|-|-|-|-|-|-|-|-|-|
|双|农|农|农|-|6|-1|-1|-1|
|农|双|农|农|-|-1|3|-1|-1|
|农|农|双|农|-|1|1|-3|1|
|农|农|农|双|-|2|2|2|-6|
|-|-|-|-|-|-|-|-|-|
|主|主|农|农|-|2|2|-1|-1|
|主|农|主|农|-|1|-1|1|-1|
|主|农|农|主|-|0|0|0|0|
|-|-|-|-|-|-|-|-|-|
|农|农|主|主|-|2|2|-1|-1|
|农|主|主|农|-|0|0|0|0|
|农|主|农|主|-|1|-1|1|-1|

### 花色 Suit（enum）

|花色|数字|
|-|-|
|大葵|0|
|散角|1|
|花仔|2|
|红桃|3|

### 牌型 Kind（enum）

|牌型|类型名|索引
|-|-|-|
|单张|ONE|0|
|对|PAIR|1|
|葫芦，三带二|FULLHOUSE|2|
|同花|FLUSH|3|
|拖尸，四带一|FOUR|4|
|蛇，顺|STRAIGHT|5|
|同花顺|STRAIGHTFLUSH|6|

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

s2cGameStart = s2cPlayCard // 内容相同，只是事件名不同

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
    winScore: number // 输赢分数
    isBigBoss: boolean // 是否是大地主
    isMiniBoss: boolean // 是否是小地主
    isPrevious: boolean // 是否是上家
    isAllPassed: boolean // 是否所有玩家都pass了，即傍风
    hasDiamondFour: boolean, // 是否有散角4
  },
  rightPlayer = leftPlayer // 右边玩家
  upperPlayer = leftPlayer // 上方玩家
}
```

### 结束结算

```
s2cGameOver = {
  continue:boolean // 是否继续游戏，或者直接退出到准备阶段
  currentPlayer: Player, // 当前玩家
  leftPlayer: Player, // 左边玩家
  rightPlayer: Player, // 右边玩家
  upperPlayer: Player, // 上方玩家
}
```

## 数据库表

### 用户表

```
CREATE TABLE `user` (
  `uid` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 游戏记录表

```
CREATE TABLE `game_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `user_ids` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `records` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 玩家记录表

```
CREATE TABLE `play_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `game_log_id` int NOT NULL,
  `room_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `uid` int DEFAULT NULL,
  `username` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` tinyint DEFAULT NULL COMMENT '0贫农，1地主仔，2大地主，3双地',
  `score` tinyint DEFAULT NULL COMMENT '贡牌得分，有负数',
  `rank` tinyint DEFAULT NULL COMMENT '排第几',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `player` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

