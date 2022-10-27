import { Controller, HttpPost } from "webhost-mvc";
import { BolleanRequest } from "../model";
import { CellingFanService } from "../services";
import { ControllerBase } from "./controller-base";

@Controller()
export default class CellingFanController extends ControllerBase {

    public constructor(
        private cellingFanService: CellingFanService
    ) {
        super();
    }

    @HttpPost('setlight')
    public setLight(request: BolleanRequest): Promise<void> {
        return this.cellingFanService.saveState({
            setLight: true,
            light: request.value
        }, request.model);
    }

    @HttpPost('setfan')
    public setFan(request: BolleanRequest): Promise<void> {
        return this.cellingFanService.saveState({
            setFan: true,
            fan: request.value
        }, request.model);
    }
}