"use strict"
const EventEmitter = require("events")
const WebSocket = require("ws")
const pb = require("protobufjs")
const crypto = require("crypto")
const msgType = {notify: 1, req: 2, res: 3}
const FastTest = [
    "authGame", "broadcastInGame", "checkNetworkDelay", "confirmNewRound", "enterGame", "fetchGamePlayerState",
    "finishSyncGame", "inputChiPengGang", "inputGameGMCommand", "inputOperation", "syncGame", "terminateGame"
]

class MJSoul extends EventEmitter {
    constructor(config = {}) {
        super()
        this.status = "closed"
        this.msgIndex = 0
        this.msgQueue = []
        this.ws = null
        this.wsOption = {}
        this.service = ".lq.Lobby."
        this.root = pb.Root.fromJSON(require("./liqi.json"))
        this.wrapper = this.root.lookupType("Wrapper")
        this.url = "wss://mj-srv-5.majsoul.com:4101"
        this._onOpen = ()=>{}
        for (let k in config) {
            this[k] = config[k]
        }
    }
    open(onOpen = ()=>{}) {
        this.status = "connecting"
        this._onOpen = onOpen
        this.ws = new WebSocket(this.url, this.wsOption)
        this.ws.on("open", ()=>{
            this.status = "connected"
            onOpen()
        })
        this.ws.on("message", this._onMessage.bind(this))
        this.ws.on("close", ()=>{
            this.status = "closed"
            this.emit("close")
            this.ws = null
            this.msgIndex = 0
            this.msgQueue = []
        })
        this.ws.on("error", err=>this.emit("error", err))
    }
    close() {
        try {
            this.status = "closing"
            this.ws.terminate()
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
                let dataTpye = this.root.lookupType(this.msgQueue[index].name)
                this.msgQueue[index].cb(dataTpye.decode(this.wrapper.decode(data.slice(3)).data))
                delete this.msgQueue[index]
            }
        }
    }
    send(name, data = {}, callback = ()=>{}) {
        if (typeof data === "function") {
            let tmp = callback
            callback = data
            data = typeof tmp === "function" ? {} : tmp
        }

        if (this.status !== "connected") {
            if (this.status === "closed") this.open(this._onOpen)
            callback({"error":"We are trying to connect to mjsoul. Please try again."})
            return
        }

        if (FastTest.includes(name))
            name = ".lq.FastTest." + name //todo 
        else
            name = this.service + name

        try {
            var service = this.root.lookup(name).toJSON()
        } catch(e) {
            callback({"error":"Wrong api name."})
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
        this.msgQueue[this.msgIndex] = {name:resName, cb:callback}
        data = Buffer.concat([Buffer.from([msgType.req, this.msgIndex - (this.msgIndex >> 8 << 8), this.msgIndex >> 8]), this.wrapper.encode(this.wrapper.create(data)).finish()])
        this.ws.send(data)
        this.msgIndex++
    }
    hash(password) {
        return crypto.createHmac("sha256", "lailai").update(password, "utf8").digest("hex")
    }
}

class DHS extends MJSoul {
    constructor(config = {}) {
        super()
        this.service = ".lq.CustomizedContestManagerApi."
        this.root = pb.Root.fromJSON(require("./dhs.json"))
        this.wrapper = this.root.lookupType("Wrapper")
        this.url = "wss://mj-srv-3.majsoul.com:4021"
        for (let k in config) {
            this[k] = config[k]
        }
    }
}

MJSoul.DHS = DHS
module.exports = MJSoul
