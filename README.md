# mjsoul

**雀魂 client tool**

完成了雀魂底层protobuf数据的解析，只需要调用接口传入json数据，就能收到返回的json数据

接口和数据类型定义在liqi.json中，能处理所有请求、响应和事件

支持代理，支持登陆日服美服，自动重连

暂时不能对局

Install with npm:
```
$ npm i mjsoul
```

Example:
```js
const MJSoul = require("mjsoul")
const mjsoul = new MJSoul()

/*　set option
const mjsoul = new MJSoul({
    "proxy": "http://username:password@host:port",
    "url": "wss://mj-srv-6.majsoul.com:4501",
    "version": "0.6.73.w"
})

// wss://mj-srv-6.majsoul.com:4501 国服海外
// wss://mjjpgs.mahjongsoul.com:4501 日服
// wss://mjusgs.mahjongsoul.com:4501 美服
*/

let onOpen = ()=>{
    // call api
    mjsoul.send("fetchConnectionInfo", (data)=>{
        console.log(data)
    })

    let reqData = mjsoul.jsonForLogin("account", "password")
    // login
    mjsoul.send("login", (data)=>{
        console.log(data)
        // call api
        mjsoul.send("fetchFriendList", (data)=>{
            console.log(data)
        })
    }, reqData)
}

// bind event
mjsoul.on("NotifyAnotherLogin", (data)=>{
    console.log("logout", data)
})
mjsoul.on("NotifyAccountLogout", onOpen)

mjsoul.open(onOpen)
```

dhs(管理后台):
```js
const DHS = require("mjsoul").DHS
const dhs = new DHS()

let onOpen = function() {
    let reqData = dhs.jsonForLogin("account", "password")
    // 后台数据定义文件dhs.json
    dhs.api("loginContestManager", function(data) {
        console.log(data)
    }, reqData)
}
dhs.open(onOpen)
```
