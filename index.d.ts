/// <reference types="node" />
import * as events from 'events';
import { RequestOptions } from "https";

interface Record {
    parse: (buf: Uint8Array | Buffer) => any;
    parseFile: (filepath: string) => any;
    parseByUrl: (url: string, cb: (data: any) => void, option?: RequestOptions) => void;
    parseById: (id: string, cb: (data: any) => void, option?: RequestOptions) => void;
}

declare class MJSoul extends events.EventEmitter {
    constructor(config?: MJSoul.Config);
    open(onOpen?: () => void): void;
    close(): void;
    send(name: string, data?: any, cb?: (data: any) => void): void;
    send(name: string, cb?: (data: any) => void, data?: any): void;
    sendAsync(name: string, data?: any): Promise<any>;
    hash(password: string): string;
}

declare namespace MJSoul {
    interface Config {
        url?: string,
        timeout?: number,
        wsOption?: RequestOptions,
    }
    const record: Record;
    class DHS extends MJSoul { }
}

export = MJSoul;
