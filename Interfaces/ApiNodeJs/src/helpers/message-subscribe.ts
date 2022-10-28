import * as dgram from 'dgram';
import { MessageHeader, PortType } from "../model";
import { BinaryReader } from "./binary-reader";

export interface MessagePackage {
    header: MessageHeader;
    reader: BinaryReader;
    address: string;
}

export interface MessageSubscribe {
    fromUID?: number;
    port?: PortType;
    msg?: number;
    callBack: (pck: MessagePackage | null) => void;
    onetime?: boolean;
    timeout?: number;
    timeoutHandle?: any;
}

export class MessageController {

    private subscriptions: MessageSubscribe[];

    public constructor(
    ) {
        this.subscriptions = [];
    }

    public subscribe(msg: MessageSubscribe): void {
        if (msg.onetime) {
            msg.timeoutHandle = setTimeout(this.fireMsg.bind(this, msg, null), msg.timeout || 3000);
        }
        this.subscriptions.push(msg);
    }

    public unsubscribe(msg: MessageSubscribe): void {
        const index = this.subscriptions.indexOf(msg);
        if (index > -1) {
            this.subscriptions.splice(index, 1);
        }
    }

    private fireMsg(msg: MessageSubscribe, pck: MessagePackage | null): void {
        if (msg.timeoutHandle) {
            clearTimeout(msg.timeoutHandle);
            delete msg.timeoutHandle;
        }
        if (msg.onetime) {
            this.unsubscribe(msg);
        }
        msg.callBack(pck);
    }

    public fire(pck: MessagePackage): void {

        for (const sub of this.subscriptions) {
            if (sub.fromUID) {
                if (sub.fromUID != pck.header.fromUID) {
                    continue;
                }
            }
            if (sub.port) {
                if (sub.port != pck.header.port) {
                    continue;
                }
            }
            if (sub.msg) {
                if (sub.msg != pck.header.msg) {
                    continue;
                }
            }
            this.fireMsg(sub, pck);
        }
    }
}