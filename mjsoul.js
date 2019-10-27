"use strict"
let config = {
    mainland: true,
    region  : "cn", //cn, jp
    url     : "wss://mj-srv-5.majsoul.com:4101",
    url1    : "wss://mj-srv-5.majsoul.com:4101",
    url2    : "wss://mj-srv-6.majsoul.com:4501",
    url3    : "wss://mjjpgs.mahjongsoul.com:4501",
    version : "0.6.73.w",
    proxy   : ""
}
const url = require('url')
const ws = require("ws")
const hpa = require('https-proxy-agent')
const pb = require("protobufjs")
const crypto = require('crypto')
const root = pb.Root.fromJSON(require("./liqi.json"))
const wrapper = root.lookupType("Wrapper")
const msgType = {notify: 1, req: 2, res: 3}
let msgIndex = 0
let msgQueue = []
let events = {}
let client

const mjsoul = {
    setConfig: function(k, v) {
        config[k] = v
    },
    run: function(onOpen) {
        if (!config.mainland)
            config.url = config.url2
        if (config.region == "jp")
            config.url = config.url3
        if (config.proxy) {
            let agent = new hpa(url.parse(config.proxy))
            client = new ws(config.url, {agent: agent})
        } else {
            client = new ws(config.url)
        }
        client.on("open", onOpen)
        client.on("error", function(err) {
            console.log("error: ", err)
        });
        client.on("close", function() {
            console.log("closed")
            msgIndex = 0
            msgQueue = []
        });
        client.on("message", function(data) {
            if (data[0] == msgType.notify) {
                data = wrapper.decode(data.slice(1))
                if (events[data.name] !== undefined)
                    events[data.name](root.lookupType(data.name).decode(data.data))
            }
            if (data[0] == msgType.res) {
                let index = (data[2] << 8 ) + data[1]
                if (msgQueue[index] !== undefined) {
                    let dataTpye = root.lookupType(msgQueue[index].t)
                    msgQueue[index].c(dataTpye.decode(wrapper.decode(data.slice(3)).data))
                    delete msgQueue[index]
                } else 
                    console.log("Error: unknown request for the response")
            }
        });
    },
    on: function(event, callback) {
        events[".lq." + event] = callback
    },
    api: function(name, callback = function(){}, data = {}) {
        name = ".lq.Lobby." + name
        let service = root.lookup(name).toJSON()
        let reqName = service.requestType
        let resName = service.responseType
        let reqType = root.lookupType(reqName)
        data = {
            name: name,
            data: reqType.encode(reqType.create(data)).finish()
        }
        msgIndex %= 60007
        msgQueue[msgIndex] = {t:resName, c:callback}
        data = Buffer.concat([Buffer.from([msgType.req, msgIndex - (msgIndex >> 8 << 8), msgIndex >> 8]), wrapper.encode(wrapper.create(data)).finish()])
        client.send(data)
        msgIndex++
    },
    jsonForLogin: function(username, password) {
        let k = function(cnt) {
            return Math.random().toString(16).substr(0 - cnt)
        }
        return {
            account: username,
            password: crypto.createHmac('sha256', "lailai").update(password, 'utf8').digest('hex'),
            reconnect: false,
            device: {device_type: "pc", os: "", os_version: "", browser: "chrome"},
            random_key: [k(8), k(4), k(4), k(4), k(12)].join("-"),
            client_version: config.version,
            gen_access_token: true,
            currency_platforms: 2
        }
    }
}

module.exports = mjsoul
