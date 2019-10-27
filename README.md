# mjsoul client sdk

**雀魂 client sdk**

完成了雀魂底层protobuf数据的解析，只需要调用接口传入json数据，就能收到返回的json数据

接口和数据类型定义在liqi.json中，能处理所有请求、响应和事件

支持国服和日服，支持代理

Install with npm:
```
$ npm i mjsoul
```

Example:
```js
const mjsoul = require("mjsoul")

/*
mjsoul.setConfig("proxy", "http://username:password@host:port") // set proxy
mjsoul.setConfig("region", "jp") // set cn=国服 or jp=日服
mjsoul.setConfig("mainland", false) // 国服使用海外服务器
*/

// bind event
mjsoul.on("NotifyAnotherLogin", function(data) {
    console.log("logout", data)
})
mjsoul.on("NotifyAccountLogout", function(data) {
    console.log("logout", data)
})

let app = function() {
    let reqData = mjsoul.jsonForLogin("account", "password")
    // login
    mjsoul.api("login", function(resData) {
        console.log(resData)
        // call api
        mjsoul.api("fetchFriendList", function(resData) {
            console.log(resData)
        })
        mjsoul.api("fetchConnectionInfo", function(resData) {
            console.log(resData)
        })
    }, reqData)
}
mjsoul.run(app)
```
