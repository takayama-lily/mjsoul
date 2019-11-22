"use strict"
const fs = require("fs")
const https = require("https")
const pb = require("protobufjs")
const root = pb.Root.fromJSON(require("./liqi.json"))
const wrapper = root.lookupType("Wrapper")
const parse = (data)=>{
    try {
        let GameDetailRecords = root.lookupType("GameDetailRecords").decode(wrapper.decode(data).data)
        GameDetailRecords.records.forEach((value, index)=>{
            let data = wrapper.decode(value)
            GameDetailRecords.records[index] = {
                "name": data.name.substr(4),
                "data": root.lookupType(data.name).decode(data.data)
            }
        })
        return GameDetailRecords.records
    } catch(e) {
        return {"error": "parse error"}
    }
}
const parseFile = (filepath)=>{
    return parse(fs.readFileSync(filepath))
}
const parseById = (id, cb, option = {})=>{
    https.get("https://mj-srv-3.majsoul.com:7343/majsoul/game_record/"+id, option, (res)=>{
        let raw = Buffer.from([])
        res.on("data", (data)=>{
            raw = Buffer.concat([raw, Buffer.from(data)])
        })
        res.on("end", ()=>{
            cb(parse(raw))
        })
    }).on("error", ()=>cb({"error":"mjsoul server error"}))
}
const record = {
    parse: parse,
    parseFile: parseFile,
    parseById: parseById
}
module.exports = record
