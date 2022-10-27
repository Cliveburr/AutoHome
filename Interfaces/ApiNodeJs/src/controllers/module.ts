import { Controller, HttpGet, HttpPost } from "webhost-mvc";
import { AutoHomeMessageType, DiscoveryModuleModel, ModuleListRequest, ModuleModel, ModuleType, PortType } from "../model";
import { AutoHomeService } from "../services";
import { ControllerBase } from "./controller-base";

@Controller()
export default class ModuleController extends ControllerBase {

    public constructor(
        private autoHomeService: AutoHomeService
    ) {
        super();
    }

    @HttpGet('/refreshdiscovery')
    public refreshDiscovery() {
        return this.autoHomeService.sendPing();
    }

    @HttpPost('modules')
    public getModuleList(request: ModuleListRequest): ModuleModel[] {
        const fromTime = Date.parse(request.fromTime)
        return this.autoHomeService.modules
            .filter(m => m.onTime > fromTime)
            .map(m => { return {
                UID: m.UID,
                alias: m.alias,
                moduleType: ModuleType[m.moduleType],
                ip: m.address
            }});
    }

    @HttpGet('getmodule/{uid}')
    public async getModule(uid: number): Promise<ModuleModel | undefined> {
        var retMod = this.autoHomeService.modules
            .find(m => m.UID == uid);
        if (retMod == null) {
            retMod = await this.refreshModulesAndWaitFor(uid);
        }

        if (retMod) {
            return {
                UID: retMod.UID,
                alias: retMod.alias,
                moduleType: ModuleType[retMod.moduleType],
                ip: retMod.address
            };
        }
        else {
            return undefined;
        }
    }

    private refreshModulesAndWaitFor(uid: number): Promise<DiscoveryModuleModel | undefined> {
        return new Promise<DiscoveryModuleModel | undefined>((e, r) => {

            this.autoHomeService.connectionService.messages.subscribe({
                fromUID: uid,
                port: PortType.AutoHome,
                msg: AutoHomeMessageType.PongResponse,
                onetime: true,
                callBack: (pck) => {
                    e(this.autoHomeService.modules
                        .find(m => m.UID == uid))
                }
            });

            this.autoHomeService.sendPing();
        });
    }
}