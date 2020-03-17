## mjsoul

**雀魂客户端组件**  
完成了雀魂底层protobuf数据的解析，只需要调用接口传入json数据，就能收到返回的json数据  
能处理所有请求、响应和事件(对局暂未实现)  
可以登陆国服日服美服，自动重新连接  
接口和数据类型定义在liqi.json中，也可以查看[API](http://104.168.30.204/doc.html)

**Install with npm:**
```
$ npm i mjsoul
```

**Example:**
```js
const MJSoul = require("mjsoul")
const mjsoul = new MJSoul()

//　set option
// const mjsoul = new MJSoul({
//     "wsOption": {
//         "proxy": ..., //参考websockets/ws中的proxy用法
//         ...
//     },
//     "url": "wss://mj-srv-6.majsoul.com:4501",
// })

// wss://mj-srv-6.majsoul.com:4501 国服海外
// wss://mjjpgs.mahjongsoul.com:4501 日服
// wss://mjusgs.mahjongsoul.com:4501 美服

let onOpen = ()=>{
    // call api
    mjsoul.send("fetchConnectionInfo", (data)=>{
        console.log(data)
    })
    // login
    mjsoul.send("login", {account: "account", password: mjsoul.hash("password")}, (data)=>{
        console.log(data)
        // call api
        mjsoul.send("fetchFriendList", (data)=>{
            console.log(data)
        })
    })
}

// bind event
mjsoul.on("NotifyAnotherLogin", (data)=>{
    console.log("logout", data)
})
mjsoul.on("NotifyAccountLogout", onOpen)
mjsoul.open(onOpen)

////////////////////////////////////////////////////

//大会室后台:
const dhs = new MJSoul.DHS()
dhs.open(()=>{
    // 后台数据定义文件dhs.json
    dhs.send("loginContestManager", (data)=>{
        console.log(data)
    }, {account: "account", password: dhs.hash("password")})
})

///////////////////////////////////////////////////

//解析牌谱
MJSoul.record.parseById("your game uuid", (data)=>{
    console.log(data)
})
```

**v2.0修改(不兼容旧版本)**
* 低版本nodejs支持(v8.10通过)
* 修改了登陆函数
* 更改了重连的方式(在发消息时才会触发)
* 删除内置代理，增加wsOption参数
