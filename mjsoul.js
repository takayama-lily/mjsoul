"use strict"
const EventEmitter = require('events')
const url = require('url')
const WebSocket = require("ws")
const HttpsProxyAgent = require('https-proxy-agent')
const pb = require("protobufjs")
const crypto = require('crypto')
const msgType = {notify: 1, req: 2, res: 3}
const FastTest = [
    "authGame", "broadcastInGame", "checkNetworkDelay", "confirmNewRound", "enterGame", "fetchGamePlayerState",
    "finishSyncGame", "inputChiPengGang", "inputGameGMCommand", "inputOperation", "syncGame", "terminateGame"
]
const hash = function(password) {
    return crypto.createHmac('sha256', "lailai").update(password, 'utf8').digest('hex')
}

class MJSoul extends EventEmitter {
    msgIndex = 0
    msgQueue = []
    ws = null
    service = ".lq.Lobby."
    root = pb.Root.fromJSON(require("./liqi.json"))
    wrapper = this.root.lookupType("Wrapper")
    url = "wss://mj-srv-5.majsoul.com:4101"
    version = "0.6.97.w"
    proxy = ""
    retryFlag = true
    retryTime = 0
    constructor(config) {
        super()
        for (let k in config) {
            this[k] = config[k]
        }
    }
    _onOpen = ()=>{}
    open(onOpen = ()=>{}) {
        this._onOpen = onOpen
        this.retryFlag = true
        let agent = null
        if (this.proxy)
            agent = new HttpsProxyAgent(url.parse(this.proxy))
        this.ws = new WebSocket(this.url, {agent: agent})
        this.ws.on("open", () => {
            this.retryTime = 0
            onOpen()
        })
        this.ws.on("message", this._onMessage.bind(this))
        this.ws.on("close", this._onClose.bind(this))
        this.ws.on("error", (err)=>this.emit("error", err))
    }
    _onClose() {
        this.emit("close")
        this.msgIndex = 0
        this.msgQueue = []
        if (++this.retryTime >= 5)
            this.emit("error", "Failed too many times")
        else if (this.retryFlag)
            this.open(this._onOpen)
    }
    close() {
        this.retryFlag = false
        try {
            this.ws ? this.ws.terminate() : 0
        } catch(e) {}
    }
    _onMessage(data) {
        if (data[0] == msgType.notify) {
            data = this.wrapper.decode(data.slice(1))
            this.emit(data.name.substr(4), this.root.lookupType(data.name).decode(data.data))
        }
        if (data[0] == msgType.res) {
            let index = (data[2] << 8 ) + data[1]
            if (this.msgQueue[index] !== undefined) {
                let dataTpye = this.root.lookupType(this.msgQueue[index].t)
                this.msgQueue[index].c(dataTpye.decode(this.wrapper.decode(data.slice(3)).data))
                delete this.msgQueue[index]
            }
        }
    }
    send(name, callback = ()=>{}, data = {}) {
        if (FastTest.indexOf(name) !== -1)
            name = ".lq.FastTest." + name //todo 
        else
            name = this.service + name
        try {
            var service = this.root.lookup(name).toJSON()
        } catch(e) {
            this.emit("warning", "Wrong api name")
            return
        }
        let reqName = service.requestType
        let resName = service.responseType
        let reqType = this.root.lookupType(reqName)
        data = {
            name: name,
            data: reqType.encode(reqType.create(data)).finish()
        }
        this.msgIndex %= 60007
        this.msgQueue[this.msgIndex] = {t:resName, c:callback}
        data = Buffer.concat([Buffer.from([msgType.req, this.msgIndex - (this.msgIndex >> 8 << 8), this.msgIndex >> 8]), this.wrapper.encode(this.wrapper.create(data)).finish()])
        this.ws.send(data)
        this.msgIndex++
    }
    jsonForLogin(account, password) {
        let k = function(cnt) {
            return Math.random().toString(16).substr(0 - cnt)
        }
        return {
            account: account,
            password: hash(password),
            reconnect: false,
            device: {device_type: "pc", os: "", os_version: "", browser: "chrome"},
            random_key: [k(8), k(4), k(4), k(4), k(12)].join("-"),
            client_version: this.version,
            gen_access_token: false,
            currency_platforms: 2
        }
    }
}

class DHS extends MJSoul {
    service = ".lq.CustomizedContestManagerApi."
    root = pb.Root.fromJSON(require("./dhs.json"))
    wrapper = this.root.lookupType("Wrapper")
    url = "wss://mj-srv-3.majsoul.com:4021"
    jsonForLogin(account, password) {
        return {
            account: account,
            password: hash(password),
            gen_access_token: true,
            type: 0
        }
    }
}

MJSoul.DHS = DHS

module.exports = MJSoul
