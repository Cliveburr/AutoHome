import { Injectable } from "providerjs";
import { BinaryWriter, BitFieldsWriter } from "../helpers";
import { CellingFanMessageType, FanSpeedEnum, ModuleModel, PortType, StateSaveRequest } from "../model";
import { ConnectionService } from "./connection.service";

@Injectable()
export class CellingFanService {

    public constructor(
        public connectionService: ConnectionService
    ) {
    }

    private initWriter(msg: CellingFanMessageType): BinaryWriter {
        return this.connectionService.initWriter(0, PortType.CellingFan, msg);
    }


    public saveState(request: StateSaveRequest, moduleModel: ModuleModel) {

        const writer = this.initWriter(CellingFanMessageType.StateSaveRequest);
        
        const vl = new BitFieldsWriter();
        vl.setBool(0, request.setLight || false);
        vl.setBool(1, request.light || false);
        vl.setBool(2, request.setFan || false);
        vl.setBool(3, request.fan || false);
        vl.setBool(4, request.setFanUp || false);
        vl.setBool(5, request.fanUp || false);
        vl.setByteIntoTwoBits(6, request.fanSpeed || FanSpeedEnum.NotSet);

        writer.writeFields(vl);

        return this.connectionService.connectTCP(moduleModel, (client) => client.send(writer));
    }
}