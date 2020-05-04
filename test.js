"use strict"
const MJSoul = require("./mjsoul")
const mjsoul = new MJSoul()

let login = async()=>{

    try {
        //登陆
        let data = await mjsoul.sendAsync(
            "login",
            {account: "account", password: mjsoul.hash("password")}
        )
        console.log(data)

        //获取好友列表
        data = await mjsoul.sendAsync("fetchFriendList")
        console.log(data)
    } catch (e) {
        console.log(e)
    }
}

//绑定事件
mjsoul.on("NotifyAccountLogout", login)

mjsoul.open(login)
