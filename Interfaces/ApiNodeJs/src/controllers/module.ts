import { Controller, HttpGet } from "webhost-mvc";
import { ConnectionService } from "../services";
import { ControllerBase } from "./controller-base";

@Controller()
export default class ModuleController extends ControllerBase {

    public constructor(
        private connectionService: ConnectionService
    ) {
        super();
    }

    @HttpGet('/refreshdiscovery')
    public refreshDiscovery(): number {
        setTimeout(this.connectionService.sendPing.bind(this.connectionService), 1000);
        return 123;
    }
}