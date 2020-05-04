# **mjsoul**

**雀魂通信客户端**  
完成了雀魂底层protobuf数据的解析，转换为可读的json数据

**Install with npm:**

```
$ npm i mjsoul
```

**Example:**

```js
const MJSoul = require("mjsoul")
const mjsoul = new MJSoul()

let login = async()=>{

    //登陆
    let data = await mjsoul.sendAsync(
        "login",
        {account: "account", password: mjsoul.hash("password")}
    )
    console.log(data)

    //获取好友列表
    data = await mjsoul.sendAsync("fetchFriendList")
    console.log(data)
}

//绑定事件
mjsoul.on("NotifyAccountLogout", login)

mjsoul.open(login)
```

**详细使用方法请参阅以下资料:**

[雀魂协议](./docs/protocol.md)  
[雀魂API](https://takayama-lily.github.io/mjsoul/api.html)  
[使用说明](./docs/usage.md)  
