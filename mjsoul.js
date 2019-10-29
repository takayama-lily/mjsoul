"use strict"
const EventEmitter = require('events')
const url = require('url')
const WS = require("ws")
const HttpsProxyAgent = require('https-proxy-agent')
const pb = require("protobufjs")
const crypto = require('crypto')
const root = pb.Root.fromJSON(require("./liqi.json"))
const wrapper = root.lookupType("Wrapper")
const msgType = {notify: 1, req: 2, res: 3}

class Mjsoul extends EventEmitter {
    constructor() {
        super()
        this.config = {
            region  : "cn", //cn, jp, us
            mainland: true,
            url     : "wss://mj-srv-5.majsoul.com:4101",
            url2    : "wss://mj-srv-6.majsoul.com:4501",
            url_jp  : "wss://mjjpgs.mahjongsoul.com:4501",
            url_us  : "wss://mjusgs.mahjongsoul.com:4501",
            version : "0.6.73.w",
            proxy   : ""
        }
        this.msgIndex = 0
        this.msgQueue = []
        this.client = null
    }

    setConfig(k, v) {
        this.config[k] = v
    }

    run(onOpen) {
        if (!this.config.mainland)
            this.config.url = this.config.url2
        if (this.config.region == "jp")
            this.config.url = this.config.url_jp
        if (this.config.region == "us")
            this.config.url = this.config.url_us
        if (this.config.proxy) {
            let agent = new HttpsProxyAgent(url.parse(this.config.proxy))
            this.client = new WS(this.config.url, {agent: agent})
        } else {
            this.client = new WS(this.config.url)
        }
        this.client.on("open", onOpen)
        this.client.on("error", (err) => {
            console.log("error: ", err)
        });
        this.client.on("close", () => {
            console.log("closed")
            this.msgIndex = 0
            this.msgQueue = []
        });
        this.client.on("message", (data) => {
            if (data[0] == msgType.notify) {
                data = wrapper.decode(data.slice(1))
                this.emit(data.name.substr(4), root.lookupType(data.name).decode(data.data))
            }
            if (data[0] == msgType.res) {
                let index = (data[2] << 8 ) + data[1]
                if (this.msgQueue[index] !== undefined) {
                    let dataTpye = root.lookupType(this.msgQueue[index].t)
                    this.msgQueue[index].c(dataTpye.decode(wrapper.decode(data.slice(3)).data))
                    delete this.msgQueue[index]
                } else 
                    console.log("Error: unknown request for the response")
            }
        });
    }

    api(name, callback = function(){}, data = {}) {
        name = ".lq.Lobby." + name
        let service = root.lookup(name).toJSON()
        let reqName = service.requestType
        let resName = service.responseType
        let reqType = root.lookupType(reqName)
        data = {
            name: name,
            data: reqType.encode(reqType.create(data)).finish()
        }
        this.msgIndex %= 60007
        this.msgQueue[this.msgIndex] = {t:resName, c:callback}
        data = Buffer.concat([Buffer.from([msgType.req, this.msgIndex - (this.msgIndex >> 8 << 8), this.msgIndex >> 8]), wrapper.encode(wrapper.create(data)).finish()])
        this.client.send(data)
        this.msgIndex++
    }

    jsonForLogin(username, password) {
        let k = function(cnt) {
            return Math.random().toString(16).substr(0 - cnt)
        }
        return {
            account: username,
            password: crypto.createHmac('sha256', "lailai").update(password, 'utf8').digest('hex'),
            reconnect: false,
            device: {device_type: "pc", os: "", os_version: "", browser: "chrome"},
            random_key: [k(8), k(4), k(4), k(4), k(12)].join("-"),
            client_version: this.config.version,
            gen_access_token: true,
            currency_platforms: 2
        }
    }
}

module.exports = Mjsoul
