import { Injectable } from "providerjs";
import { BinaryWriter, BitFieldsReader, BitFieldsWriter } from "../helpers";
import { CellingFanMessageType, CellingFanState, FanSpeedEnum, ModuleModel, PortType, StateSaveRequest } from "../model";
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
        vl.setByteIntoTwoBits(6, typeof request.fanSpeed === 'undefined' ? FanSpeedEnum.NotSet: request.fanSpeed);

        writer.writeFields(vl);

        return this.connectionService.connectTCP(moduleModel, (client) => client.send(writer));
    }

    public getState(moduleModel: ModuleModel): Promise<CellingFanState> {

        const writer = this.initWriter(CellingFanMessageType.StateReadRequest);
     
        return this.connectionService.connectTCP(moduleModel, async (client) => {
            
            const pck = await client.sendAndWaiting(writer, PortType.CellingFan, CellingFanMessageType.StateReadResponse);
            
            const vl = pck.reader.readFields();
            const light = vl.readBool(0);
            const fan = vl.readBool(1);
            const fanUp = vl.readBool(2);
            const fanSpeed = <FanSpeedEnum>vl.readTwoBitsAsByte(3);

            return <CellingFanState>{
                light,
                fan,
                fanUp,
                fanSpeed
            };
        });
    }
}