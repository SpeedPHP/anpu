// c 验证登录
// c 链接成功
// c 加入等待，加入房间
// s 发送等待的房间广播，等待状态
// s 最后加入的人，群发开始
// c 出牌
// s 响应出牌，判定输赢，群发下一把，如果只剩一人，则完成
var socket

function connect(uid, access) {
  socket = io('/', {
    auth: {
      uid: uid,
      access: access
    }
  });
  socket.on('connect', function () {
    console.log('connect');
  });
  socket.on('disconnect', function () {
    console.log('disconnect');
  });
  socket.on('error', function (err) {
    console.log('error', err);
  });
  socket.on('message', function (msg) {
    console.log('message', msg);
  });
  socket.on('connect', function () {
    showResponse('链接成功！');
  });
  socket.on('disconnect', function () {
    showResponse('断开链接！');
  });
  socket.on('s2cGameOver', function (data) {
    showResponse("游戏结束：" + data);
  });
  socket.on('s2cWaitingStatus', function (data) {
    showResponse("等待情况：" + JSON.stringify(data));
  });
  socket.on('s2cPlayCard', function (data) {
    showResponse("游戏中" + JSON.stringify(data));
  });
  socket.on('s2cGameStart', function (data) {
    showResponse("开始游戏" + JSON.stringify(data));
  });
  socket.on('s2cRelogin', function (data) {
    showResponse("要求重新登录");
  });
}

function play() {
  var card = $('#playcard').val();
  socket.emit('c2sPlayCard', {
    sentCards: card.split(",").map(v => parseInt(v)), pass: false
  });
}

function ready() {
  socket.emit("c2sJoinWaiting");
  showResponse("开始匹配...")
}

function pass() {
  socket.emit('c2sPlayCard', {
    card: [], pass: true
  });
}


function login() {
  var username = $('#username').val();
  var password = $('#password').val();
  $.ajax({type: "POST",url: "/login",
    data: JSON.stringify({
      inputname: username,
      inputpass: password
    }), // 将数据对象转换为JSON字符串
    contentType: "application/json; charset=utf-8", // 设置内容类型为JSON
    dataType: "json",
    success: function(response) {
      showResponse(response.username + " 登录成功");
      connect(response.uid, response.access);
    }
  });
}

function showResponse(message) {
  var response = $('#responseStr');
  response.prepend("<p>" + message + "</p>");
}