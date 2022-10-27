import { Injectable } from "providerjs";
import { BinaryWriter } from "../helpers";
import { MessagePackage } from "../helpers/message-subscribe";
import { AutoHomeMessageType, DiscoveryModuleModel, MessageHeader, ModuleType, PortType } from "../model";
import { ConnectionService } from "./connection.service";

@Injectable()
export class AutoHomeService {

    public modules: DiscoveryModuleModel[];

    public constructor(
        public connectionService: ConnectionService
    ) {
        this.modules = [];
        this.connectionService.messages.subscribe({
            port: PortType.AutoHome,
            msg: AutoHomeMessageType.PongResponse,
            callBack: this.receivePong.bind(this)
        });
    }

    private initWriter(msg: AutoHomeMessageType): BinaryWriter {
        return this.connectionService.initWriter(0, PortType.AutoHome, msg);
    }

    public sendPing(): Promise<void> {

        this.modules = [];

        const writer = this.initWriter(AutoHomeMessageType.PingRequest);
        writer.writeDirectString('PING');

        return this.connectionService.sendBroadcast(writer);
    }

    private receivePong(pck: MessagePackage | null): void {

        if (!pck) {
            return;
        }

        const pong = pck.reader.readDirectString(4);
        const moduleType = <ModuleType>pck.reader.readByte();
        const alias = pck.reader.readString();
        
        if (pong != 'PONG') {
            return;
        }

        const has = this.modules
            .find(m => m.UID == pck.header.fromUID);
        if (has) {
            has.alias = alias;
            has.moduleType = moduleType;
            has.address = pck.rinfo.address;
            has.onTime = Date.now();
        }
        else {
            this.modules.push({
                UID: pck.header.fromUID,
                alias,
                moduleType,
                address: pck.rinfo.address,
                onTime: Date.now()
            });
        }
    }
}