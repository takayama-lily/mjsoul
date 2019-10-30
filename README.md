# mjsoul

**雀魂 client tool**

完成了雀魂底层protobuf数据的解析，只需要调用接口传入json数据，就能收到返回的json数据

接口和数据类型定义在liqi.json中，能处理所有请求、响应和事件

支持国服日服美服，支持代理

暂不支持重连

Install with npm:
```
$ npm i mjsoul
```

Example:
```js
const Mjsoul = require("mjsoul")
const mjsoul = new Mjsoul()

/*
mjsoul.setConfig("proxy", "http://username:password@host:port") // set proxy
mjsoul.setConfig("region", "jp") // cn=国服 jp=日服 us=美服 default=cn
mjsoul.setConfig("mainland", false) // 国服使用海外服务器 default=true
*/

// bind event
mjsoul.on("NotifyAnotherLogin", function(data) {
    console.log("logout", data)
})
mjsoul.on("NotifyAccountLogout", function(data) {
    console.log("logout", data)
})

let onConn = function() {
    // call api
    mjsoul.api("fetchConnectionInfo", function(data) {
        console.log(data)
    })

    let reqData = mjsoul.jsonForLogin("account", "password")
    // login
    mjsoul.api("login", function(data) {
        console.log(data)
        // call api
        mjsoul.api("fetchFriendList", function(data) {
            console.log(data)
        })
    }, reqData)
}
mjsoul.run(onConn)
```
